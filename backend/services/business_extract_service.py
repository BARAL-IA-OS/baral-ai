"""Staged, traceable extraction of a public website into Business DNA suggestions."""

import json
import re
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from services.brand_extract_service import structure_brand
from services.db_service import get_supabase
from services.url_security import safe_get


IMPORTANT_LINK_WORDS = (
    "about", "nosotros", "contact", "contacto", "service", "servicio",
    "product", "producto", "catalog", "catalogo", "shop", "tienda",
)
SOCIAL_HOSTS = {
    "instagram.com": "instagram",
    "facebook.com": "facebook",
    "linkedin.com": "linkedin",
    "tiktok.com": "tiktok",
    "youtube.com": "youtube",
    "x.com": "x",
    "twitter.com": "x",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _update_job(job_id: str, user_id: str, stage: int, progress: int, label: str, **extra) -> None:
    payload = {
        "status": "running",
        "current_stage": stage,
        "progress": progress,
        "stage_label": label,
        "updated_at": _now(),
        **extra,
    }
    (
        get_supabase()
        .table("brand_extraction_jobs")
        .update(payload)
        .eq("id", job_id)
        .eq("user_id", user_id)
        .execute()
    )


def _page_data(url: str, html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    title = (soup.title.string or "").strip() if soup.title and soup.title.string else ""
    description_tag = soup.find("meta", attrs={"name": re.compile("description", re.I)})
    description = str(description_tag.get("content", "")).strip() if description_tag else ""
    links = [urljoin(url, str(anchor.get("href", ""))) for anchor in soup.find_all("a", href=True)]
    images: list[str] = []
    for selector in (
        soup.find("meta", attrs={"property": "og:image"}),
        soup.find("link", rel=lambda value: value and "icon" in value),
    ):
        if selector:
            source = selector.get("content") or selector.get("href")
            if source:
                images.append(urljoin(url, str(source)))
    text = " ".join(soup.get_text(" ", strip=True).split())
    html_without_scripts = str(soup)
    colors = list(dict.fromkeys(re.findall(r"#[0-9a-fA-F]{6}\b", html_without_scripts)))[:8]
    fonts = list(dict.fromkeys(re.findall(r"font-family\s*:\s*['\"]?([^;'\"}]+)", html_without_scripts, re.I)))[:5]
    emails = list(dict.fromkeys(re.findall(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", text)))[:5]
    phones = list(dict.fromkeys(re.findall(r"(?:\+?\d[\d\s().-]{7,}\d)", text)))[:5]
    socials: list[dict] = []
    for link in links:
        host = (urlparse(link).hostname or "").lower().removeprefix("www.")
        for social_host, network in SOCIAL_HOSTS.items():
            if host == social_host or host.endswith("." + social_host):
                socials.append({"network": network, "url": link})
                break
    return {
        "url": url,
        "title": title,
        "description": description,
        "links": links,
        "images": list(dict.fromkeys(images)),
        "colors": colors,
        "fonts": fonts,
        "emails": emails,
        "phones": phones,
        "socials": list({entry["url"]: entry for entry in socials}.values()),
        "text": text,
        "soup": soup,
    }


def _jsonld_catalog(pages: list[dict]) -> list[dict]:
    items: list[dict] = []
    for page in pages:
        for script in page["soup"].find_all("script", attrs={"type": "application/ld+json"}):
            try:
                payload = json.loads(script.string or "null")
            except (json.JSONDecodeError, TypeError):
                continue
            candidates = payload if isinstance(payload, list) else [payload]
            for candidate in candidates:
                if isinstance(candidate, dict) and "@graph" in candidate:
                    candidates.extend(candidate.get("@graph") or [])
                if not isinstance(candidate, dict):
                    continue
                item_type = str(candidate.get("@type", "")).lower()
                if item_type not in {"product", "service"}:
                    continue
                offers = candidate.get("offers") if isinstance(candidate.get("offers"), dict) else {}
                items.append({
                    "kind": "product" if item_type == "product" else "service",
                    "name": str(candidate.get("name", "")).strip(),
                    "description": str(candidate.get("description", "")).strip(),
                    "price": offers.get("price"),
                    "currency": offers.get("priceCurrency") or "BOB",
                    "source_url": page["url"],
                })
    unique = {item["name"].lower(): item for item in items if item["name"]}
    return list(unique.values())[:30]


def _walk_jsonld(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from _walk_jsonld(child)
    elif isinstance(value, list):
        for child in value:
            yield from _walk_jsonld(child)


def _jsonld_details(pages: list[dict]) -> dict:
    addresses: list[str] = []
    hours: list[str] = []
    testimonials: list[str] = []
    faqs: list[str] = []
    trust_signals: list[str] = []
    images: list[str] = []
    for page in pages:
        for script in page["soup"].find_all("script", attrs={"type": "application/ld+json"}):
            try:
                payload = json.loads(script.string or "null")
            except (json.JSONDecodeError, TypeError):
                continue
            for node in _walk_jsonld(payload):
                node_type = str(node.get("@type", "")).lower()
                address = node.get("address")
                if isinstance(address, dict):
                    formatted = ", ".join(str(address.get(key, "")).strip() for key in (
                        "streetAddress", "addressLocality", "addressRegion", "addressCountry"
                    ) if address.get(key))
                    if formatted:
                        addresses.append(formatted)
                opening = node.get("openingHours")
                if isinstance(opening, list):
                    hours.extend(str(value) for value in opening)
                elif opening:
                    hours.append(str(opening))
                if node_type == "review" and node.get("reviewBody"):
                    testimonials.append(str(node["reviewBody"]))
                if node_type == "question" and node.get("name"):
                    answer = node.get("acceptedAnswer") if isinstance(node.get("acceptedAnswer"), dict) else {}
                    faqs.append(f"{node['name']}: {answer.get('text', '')}".strip())
                rating = node.get("aggregateRating")
                if isinstance(rating, dict) and rating.get("ratingValue"):
                    trust_signals.append(
                        f"Calificacion {rating['ratingValue']} ({rating.get('reviewCount', 'sin conteo')} resenas)"
                    )
                for key in ("logo", "image"):
                    image = node.get(key)
                    if isinstance(image, str):
                        images.append(urljoin(page["url"], image))
    return {
        "address": addresses[0] if addresses else "",
        "openingHours": "\n".join(dict.fromkeys(hours)),
        "testimonials": "\n\n".join(dict.fromkeys(testimonials[:8])),
        "frequentlyAskedQuestions": "\n\n".join(dict.fromkeys(faqs[:12])),
        "trustSignals": "\n".join(dict.fromkeys(trust_signals[:5])),
        "images": list(dict.fromkeys(images))[:10],
    }


def run_business_extraction(job_id: str, user_id: str, source_url: str) -> None:
    try:
        _update_job(job_id, user_id, 1, 8, "Conectando con la pagina")
        final_url, body, _ = safe_get(
            source_url,
            max_bytes=3 * 1024 * 1024,
            allowed_content_prefixes=("text/html",),
        )
        home = _page_data(final_url, body.decode("utf-8", errors="replace"))

        _update_job(job_id, user_id, 2, 24, "Leyendo identidad y oferta")
        origin = urlparse(final_url)
        candidate_links: list[str] = []
        for link in home["links"]:
            parsed = urlparse(link)
            if parsed.scheme not in {"http", "https"} or parsed.netloc != origin.netloc:
                continue
            lowered = parsed.path.lower()
            if any(word in lowered for word in IMPORTANT_LINK_WORDS):
                candidate_links.append(link.split("#", 1)[0])
        pages = [home]
        for link in list(dict.fromkeys(candidate_links))[:5]:
            try:
                page_url, page_body, _ = safe_get(
                    link,
                    max_bytes=2 * 1024 * 1024,
                    allowed_content_prefixes=("text/html",),
                )
                pages.append(_page_data(page_url, page_body.decode("utf-8", errors="replace")))
            except Exception:
                continue

        _update_job(job_id, user_id, 3, 42, "Detectando comunicacion y audiencia")
        combined_text = "\n\n".join(f"FUENTE: {page['url']}\n{page['text']}" for page in pages)
        structured = structure_brand(combined_text[:24000])

        _update_job(job_id, user_id, 4, 58, "Buscando logo, colores y tipografias")
        details = _jsonld_details(pages)
        images = list(dict.fromkeys([*(value for page in pages for value in page["images"]), *details["images"]]))[:10]
        colors = list(dict.fromkeys(value for page in pages for value in page["colors"]))[:8]
        fonts = list(dict.fromkeys(value for page in pages for value in page["fonts"]))[:5]

        _update_job(job_id, user_id, 5, 70, "Detectando contacto, ubicacion y redes")
        emails = list(dict.fromkeys(value for page in pages for value in page["emails"]))[:8]
        phones = list(dict.fromkeys(value for page in pages for value in page["phones"]))[:8]
        socials = list({item["url"]: item for page in pages for item in page["socials"]}.values())
        important_links = list(dict.fromkeys(
            link for page in pages for link in page["links"]
            if any(word in link.lower() for word in ("contact", "contacto", "reserv", "shop", "tienda", "catalog", "cotiza"))
        ))[:12]

        _update_job(job_id, user_id, 6, 82, "Organizando productos y servicios")
        catalog_items = _jsonld_catalog(pages)
        fields = structured["fields"]
        sections = {
            "identity": {
                "name": structured.get("nombre_empresa") or home["title"],
                "industry": fields.get("industria", ""),
                "description": home["description"],
                "websiteUrl": final_url,
            },
            "positioning": {
                "valueProposition": fields.get("propuesta", ""),
                "differentiators": fields.get("diferenciador", ""),
            },
            "audience_profile": {"targetAudience": fields.get("audiencia", "")},
            "communication": {"tone": fields.get("tono", ""), "forbiddenWords": ""},
            "visual_identity": {"logoCandidates": images, "colors": colors, "fonts": fonts},
            "operations": {
                "address": details["address"], "openingHours": details["openingHours"],
                "emails": emails, "phones": phones, "socialLinks": socials,
                "importantLinks": important_links,
            },
            "social_proof": {
                "testimonials": details["testimonials"],
                "trustSignals": details["trustSignals"],
                "frequentlyAskedQuestions": details["frequentlyAskedQuestions"],
            },
        }
        sources: list[dict] = []
        for field_path, value in (
            ("identity.name", sections["identity"]["name"]),
            ("identity.description", sections["identity"]["description"]),
            ("identity.industry", sections["identity"]["industry"]),
            ("positioning.valueProposition", sections["positioning"]["valueProposition"]),
            ("audience_profile.targetAudience", sections["audience_profile"]["targetAudience"]),
            ("communication.tone", sections["communication"]["tone"]),
        ):
            if value:
                sources.append({
                    "user_id": user_id,
                    "field_path": field_path,
                    "detected_value": value,
                    "source_url": final_url,
                    "confidence": "high" if field_path in {"identity.name", "identity.description"} else "medium",
                })
        inserted_sources = []
        if sources:
            inserted_sources = get_supabase().table("brand_sources").insert(sources).execute().data or []

        _update_job(job_id, user_id, 7, 94, "Preparando la revision")
        result = {
            "sections": sections,
            "catalogItems": catalog_items,
            "sources": inserted_sources,
            "pagesRead": [page["url"] for page in pages],
        }
        completed_at = _now()
        (
            get_supabase()
            .table("brand_extraction_jobs")
            .update({
                "status": "completed",
                "current_stage": 7,
                "progress": 100,
                "stage_label": "Revision lista",
                "result": result,
                "updated_at": completed_at,
                "completed_at": completed_at,
            })
            .eq("id", job_id)
            .eq("user_id", user_id)
            .execute()
        )
    except Exception as exc:
        (
            get_supabase()
            .table("brand_extraction_jobs")
            .update({
                "status": "failed",
                "stage_label": "No se pudo analizar la pagina",
                "error": str(exc)[:1000],
                "updated_at": _now(),
            })
            .eq("id", job_id)
            .eq("user_id", user_id)
            .execute()
        )
