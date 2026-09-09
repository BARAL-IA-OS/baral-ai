"""Staged, traceable extraction of a public website into Business DNA suggestions."""

import json
import re
import unicodedata
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from services.brand_extract_service import structure_brand
from services.db_service import get_supabase
from services.llm_service import LLMService, LLMUnavailable
from services.url_security import safe_get


IMPORTANT_LINK_WORDS = (
    "about", "nosotros", "contact", "contacto", "service", "servicio",
    "product", "producto", "catalog", "catalogo", "shop", "tienda",
    "oferta", "solucion", "solution", "planes", "pricing",
)
OFFER_PAGE_WORDS = (
    "service", "servicio", "product", "producto", "catalog", "catalogo",
    "shop", "tienda", "oferta", "solucion", "solution", "planes", "pricing",
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


def _plain(value: object) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    return "".join(char for char in text if not unicodedata.combining(char)).lower()


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
    link_records = [
        {
            "url": urljoin(url, str(anchor.get("href", ""))),
            "text": " ".join(anchor.get_text(" ", strip=True).split()),
            "title": str(anchor.get("title", "")).strip(),
        }
        for anchor in soup.find_all("a", href=True)
    ]
    links = [record["url"] for record in link_records]
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
        "link_records": link_records,
        "images": list(dict.fromkeys(images)),
        "colors": colors,
        "fonts": fonts,
        "emails": emails,
        "phones": phones,
        "socials": list({entry["url"]: entry for entry in socials}.values()),
        "text": text,
        "soup": soup,
    }


def _candidate_page_links(home: dict) -> list[str]:
    """Find useful same-origin pages using both URL and human-readable link text."""
    origin = urlparse(home["url"])
    candidates: list[str] = []
    for record in home["link_records"]:
        link = record["url"]
        normalized_link = link.split("#", 1)[0]
        parsed = urlparse(link)
        if parsed.scheme not in {"http", "https"} or parsed.netloc != origin.netloc:
            continue
        if normalized_link.rstrip("/") == home["url"].rstrip("/"):
            continue
        signal = _plain(f"{parsed.path} {parsed.query} {record['text']} {record['title']}")
        if any(word in signal for word in IMPORTANT_LINK_WORDS):
            candidates.append(normalized_link)
    return list(dict.fromkeys(candidates))[:8]


def _jsonld_catalog(pages: list[dict]) -> list[dict]:
    items: list[dict] = []
    for page in pages:
        for script in page["soup"].find_all("script", attrs={"type": "application/ld+json"}):
            try:
                payload = json.loads(script.string or "null")
            except (json.JSONDecodeError, TypeError):
                continue
            for candidate in _walk_jsonld(payload):
                if not isinstance(candidate, dict):
                    continue
                raw_types = candidate.get("@type", [])
                types = raw_types if isinstance(raw_types, list) else [raw_types]
                normalized_types = {_plain(value).replace(" ", "") for value in types}
                product_types = {"product", "productgroup", "individualproduct"}
                if not normalized_types.intersection(product_types | {"service"}):
                    continue
                raw_offers = candidate.get("offers")
                if isinstance(raw_offers, list):
                    offers = next((value for value in raw_offers if isinstance(value, dict)), {})
                else:
                    offers = raw_offers if isinstance(raw_offers, dict) else {}
                price_spec = offers.get("priceSpecification") if isinstance(offers.get("priceSpecification"), dict) else {}
                items.append({
                    "kind": "product" if normalized_types.intersection(product_types) else "service",
                    "name": str(candidate.get("name", "")).strip(),
                    "description": str(candidate.get("description", "")).strip(),
                    "category": str(candidate.get("category", "") or "").strip(),
                    "price": offers.get("price") or price_spec.get("price"),
                    "currency": offers.get("priceCurrency") or price_spec.get("priceCurrency") or "BOB",
                    "source_url": str(candidate.get("url") or page["url"]),
                })
    return _unique_catalog(items)


def _walk_jsonld(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from _walk_jsonld(child)
    elif isinstance(value, list):
        for child in value:
            yield from _walk_jsonld(child)


def _price_from_text(text: str) -> tuple[float | None, str]:
    match = re.search(
        r"(?:(Bs\.?|BOB|USD|US\$|\$|EUR|€)\s*)?(\d{1,7}(?:[.,]\d{1,2})?)",
        text or "",
        re.I,
    )
    if not match:
        return None, "BOB"
    symbol = _plain(match.group(1))
    currency = "USD" if symbol in {"usd", "us$", "$"} else "EUR" if symbol in {"eur", "€"} else "BOB"
    try:
        price = float(match.group(2).replace(",", "."))
    except ValueError:
        price = None
    return price, currency


def _unique_catalog(items: list[dict]) -> list[dict]:
    unique: dict[str, dict] = {}
    for item in items:
        name = " ".join(str(item.get("name", "")).split()).strip(" -|•")
        key = _plain(name)
        if len(name) < 3 or not key:
            continue
        normalized = {**item, "name": name}
        if key not in unique:
            unique[key] = normalized
            continue
        current = unique[key]
        for field in ("description", "category", "price", "currency", "source_url"):
            if not current.get(field) and normalized.get(field):
                current[field] = normalized[field]
    return list(unique.values())[:30]


_GENERIC_HEADINGS = (
    "todo lo que", "ayudamos a", "por que elegir", "una historia de",
    "nuestro enfoque", "explora como", "estamos aqui", "ubicacion",
    "correo electronico", "numero de telefono", "listo para", "proyectos que",
    "clientes satisfechos", "marketing que conecta",
)


def _looks_like_offer_name(value: str) -> bool:
    name = " ".join((value or "").split())
    plain = _plain(name).strip(" ?!¡¿")
    if len(name) < 3 or len(name) > 100 or len(name.split()) > 12:
        return False
    if not any(char.isalpha() for char in name) or plain in {"productos", "servicios", "catalogo", "tienda"}:
        return False
    return not any(plain.startswith(prefix) for prefix in _GENERIC_HEADINGS)


def _html_catalog(pages: list[dict]) -> list[dict]:
    """Extract microdata, common product cards, and headings on offer pages."""
    items: list[dict] = []
    for page in pages:
        soup = page["soup"]
        page_signal = _plain(f"{urlparse(page['url']).path} {page['title']}")
        is_offer_page = any(word in page_signal for word in OFFER_PAGE_WORDS)
        default_kind = "service" if any(word in page_signal for word in ("service", "servicio", "solucion")) else "product"

        for node in soup.select('[itemtype*="Product"], [itemtype*="Service"]'):
            name_node = node.select_one('[itemprop="name"]') or node.find(["h2", "h3", "h4"])
            if not name_node:
                continue
            name = str(name_node.get("content") or name_node.get_text(" ", strip=True))
            description_node = node.select_one('[itemprop="description"]') or node.find("p")
            price_node = node.select_one('[itemprop="price"]') or node.select_one('[class*="price"]')
            price_text = str(price_node.get("content") or price_node.get_text(" ", strip=True)) if price_node else ""
            price, currency = _price_from_text(price_text)
            items.append({
                "kind": "service" if "service" in _plain(node.get("itemtype")) else "product",
                "name": name,
                "description": description_node.get_text(" ", strip=True) if description_node else "",
                "price": price,
                "currency": currency,
                "source_url": page["url"],
            })

        card_nodes = soup.find_all(class_=lambda value: value and any(
            word in _plain(" ".join(value if isinstance(value, list) else [value]))
            for word in ("product", "producto", "service", "servicio")
        ))[:120] if is_offer_page else []
        for node in card_nodes:
            headings = node.find_all(["h2", "h3", "h4", "h5"])
            if not 1 <= len(headings) <= 2:
                continue
            name = headings[0].get_text(" ", strip=True)
            if not _looks_like_offer_name(name):
                continue
            description_node = node.find("p")
            price_node = node.find(class_=lambda value: value and "price" in _plain(value))
            price, currency = _price_from_text(price_node.get_text(" ", strip=True) if price_node else "")
            kind = "service" if any(word in _plain(str(node.get("class"))) for word in ("service", "servicio")) else default_kind
            items.append({
                "kind": kind,
                "name": name,
                "description": description_node.get_text(" ", strip=True) if description_node else "",
                "price": price,
                "currency": currency,
                "source_url": page["url"],
            })

        if is_offer_page:
            for heading in soup.find_all(["h2", "h3", "h4"]):
                name = heading.get_text(" ", strip=True)
                if not _looks_like_offer_name(name):
                    continue
                description_node = heading.find_next("p")
                description = description_node.get_text(" ", strip=True) if description_node else ""
                items.append({
                    "kind": default_kind,
                    "name": name,
                    "description": description[:1200],
                    "price": None,
                    "currency": "BOB",
                    "source_url": page["url"],
                })
    return _unique_catalog(items)


def _llm_catalog(pages: list[dict]) -> list[dict]:
    """Fallback for offers visible in prose without machine-readable markup."""
    llm = LLMService(openai_only=True)
    if not llm.available:
        return []
    prioritized_pages = sorted(
        pages,
        key=lambda page: not any(
            word in _plain(f"{urlparse(page['url']).path} {page['title']}")
            for word in OFFER_PAGE_WORDS
        ),
    )
    source = "\n\n".join(
        f"URL: {page['url']}\nTITULO: {page['title']}\nCONTENIDO:\n{page['text']}"
        for page in prioritized_pages
    )[:20000]
    system = (
        "Extrae exclusivamente productos o servicios ofrecidos explicitamente por el negocio. "
        "No inventes elementos, precios ni caracteristicas. Ignora blog, testimonios, contacto, "
        "estadisticas, llamados generales y nombres de clientes. Devuelve JSON valido con la forma "
        '{"items":[{"kind":"product|service","name":"...","description":"...",'
        '"category":"...","price":null,"currency":"BOB","source_url":"..."}]}. '
        "Incluye hasta 30 ofertas y usa la URL exacta donde aparece cada una."
    )
    try:
        result = llm.complete_json(system, source, temperature=0.1, max_tokens=1800)
    except LLMUnavailable:
        return []
    raw_items = result.data.get("items", []) if isinstance(result.data, dict) else []
    items: list[dict] = []
    for raw in raw_items if isinstance(raw_items, list) else []:
        if not isinstance(raw, dict) or not _looks_like_offer_name(str(raw.get("name", ""))):
            continue
        kind = "service" if _plain(raw.get("kind")) == "service" else "product"
        items.append({
            "kind": kind,
            "name": str(raw.get("name", "")).strip(),
            "description": str(raw.get("description", "") or "").strip(),
            "category": str(raw.get("category", "") or "").strip(),
            "price": raw.get("price"),
            "currency": str(raw.get("currency", "") or "BOB").upper()[:3],
            "source_url": str(raw.get("source_url", "") or pages[0]["url"]),
        })
    return _unique_catalog(items)


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
        candidate_links = _candidate_page_links(home)
        pages = [home]
        for link in candidate_links:
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
        structured_catalog = _jsonld_catalog(pages)
        html_catalog = _html_catalog(pages)
        catalog_items = _unique_catalog([*structured_catalog, *html_catalog])
        if len(catalog_items) < 2:
            catalog_items = _unique_catalog([*catalog_items, *_llm_catalog(pages)])
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
