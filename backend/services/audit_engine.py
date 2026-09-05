"""Motor Baral Audit integrado en FastAPI.

Porta al runtime Python las partes deterministas del proyecto ``baral-audit``:
gateway anti-SSRF, recoleccion HTML, robots/sitemap/llms, enlaces, stack,
heuristicas AUDITOR-X, scores y preparacion para agentes.
"""
from __future__ import annotations

import asyncio
import ipaddress
import re
import socket
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from fastapi import HTTPException

USER_AGENT = "Mozilla/5.0 (compatible; BaralAI-AuditorX/3.0; +https://baralintegral.com)"
MAX_HTML_BYTES = 8 * 1024 * 1024
MAX_REDIRECTS = 5
MAX_LINKS = 12


def validate_public_url(raw_url: str) -> tuple[str, str]:
    candidate = raw_url.strip()
    if not candidate:
        raise HTTPException(status_code=400, detail="Ingresa la URL que deseas auditar")
    if "://" not in candidate:
        candidate = "https://" + candidate
    parsed = urlparse(candidate)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise HTTPException(status_code=400, detail="La URL debe usar http o https")
    if parsed.username or parsed.password:
        raise HTTPException(status_code=400, detail="No se permiten credenciales en la URL")
    host = parsed.hostname.lower().rstrip(".")
    if host in {"localhost", "localhost.localdomain"} or host.endswith(".local"):
        raise HTTPException(status_code=400, detail="No se permiten dominios locales o internos")
    try:
        addresses = {item[4][0] for item in socket.getaddrinfo(host, parsed.port or 443)}
    except socket.gaierror as exc:
        raise HTTPException(status_code=400, detail="No se pudo resolver el dominio") from exc
    if not addresses:
        raise HTTPException(status_code=400, detail="El dominio no resolvio a ninguna direccion")
    for address in addresses:
        if not ipaddress.ip_address(address).is_global:
            raise HTTPException(status_code=400, detail="No se permiten direcciones privadas o reservadas")
    normalized = parsed._replace(fragment="").geturl()
    return normalized, host.removeprefix("www.")


@dataclass
class FetchedPage:
    url: str
    status: int
    headers: dict[str, str]
    text: str
    ttfb_ms: int


async def _safe_fetch(client: httpx.AsyncClient, raw_url: str, *, max_bytes: int = MAX_HTML_BYTES) -> FetchedPage:
    current, _ = validate_public_url(raw_url)
    for hop in range(MAX_REDIRECTS + 1):
        current, _ = validate_public_url(current)
        started = asyncio.get_running_loop().time()
        async with client.stream(
            "GET", current,
            headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,*/*;q=0.7"},
            follow_redirects=False,
        ) as response:
            elapsed = round((asyncio.get_running_loop().time() - started) * 1000)
            location = response.headers.get("location")
            if 300 <= response.status_code < 400 and location:
                if hop >= MAX_REDIRECTS:
                    raise HTTPException(status_code=400, detail="El sitio tiene demasiadas redirecciones")
                current = urljoin(current, location)
                continue
            chunks: list[bytes] = []
            downloaded = 0
            async for chunk in response.aiter_bytes():
                remaining = max_bytes - downloaded
                if remaining <= 0:
                    break
                chunks.append(chunk[:remaining])
                downloaded += min(len(chunk), remaining)
                if len(chunk) > remaining:
                    break
            body = b"".join(chunks)
            return FetchedPage(
                url=str(response.url), status=response.status_code,
                headers={key.lower(): value for key, value in response.headers.items()},
                text=body.decode(response.encoding or "utf-8", errors="replace"), ttfb_ms=elapsed,
            )
    raise HTTPException(status_code=400, detail="No se pudo seguir la cadena de redirecciones")


async def _optional_text(client: httpx.AsyncClient, url: str, max_bytes: int = 1_000_000) -> str | None:
    try:
        page = await _safe_fetch(client, url, max_bytes=max_bytes)
        return page.text if 200 <= page.status < 300 else None
    except Exception:
        return None


async def _check_link(client: httpx.AsyncClient, url: str) -> dict[str, Any]:
    try:
        normalized, _ = validate_public_url(url)
        response = await client.head(normalized, headers={"User-Agent": USER_AGENT}, follow_redirects=False)
        if response.status_code in {405, 501}:
            async with client.stream("GET", normalized, headers={"User-Agent": USER_AGENT}, follow_redirects=False) as fallback:
                status = fallback.status_code
        else:
            status = response.status_code
        return {"url": normalized, "status": status, "broken": status in {404, 410} or status >= 500}
    except Exception:
        return {"url": url, "status": None, "broken": False, "unreachable": True}


TECH_PATTERNS = {
    "WordPress": r"wp-content|wp-includes|wp-json",
    "Elementor": r"elementor",
    "WooCommerce": r"plugins/woocommerce/|woocommerce-js|wc-add-to-cart",
    "Shopify": r"cdn\.shopify|shopify\.com",
    "Wix": r"wix\.com|wixstatic",
    "Webflow": r"webflow",
    "Next.js": r"_next/static|__NEXT_DATA__",
    "React": r"data-reactroot|react-dom",
    "Vue.js": r"vue(\.min)?\.js|data-v-[0-9a-f]{8}",
    "Google Analytics 4": r"gtag/js|googletagmanager\.com/gtag|G-[A-Z0-9]{8,}",
    "Google Tag Manager": r"googletagmanager\.com/gtm|GTM-[A-Z0-9]+",
    "Meta Pixel": r"connect\.facebook\.net|fbevents\.js",
    "Cloudflare": r"cloudflare|cdnjs\.cloudflare",
}


def _tech(html: str, headers: dict[str, str]) -> list[dict[str, Any]]:
    detected: list[dict[str, Any]] = []
    server = headers.get("server", "")
    for name in ("nginx", "apache", "litespeed"):
        if name in server.lower():
            detected.append({"label": name.title(), "crit": False, "note": "Servidor HTTP"})
    if headers.get("cf-ray"):
        detected.append({"label": "Cloudflare CDN", "crit": False, "note": "Cabecera cf-ray"})
    for label, pattern in TECH_PATTERNS.items():
        if re.search(pattern, html, re.I) and not any(item["label"] == label for item in detected):
            if label == "React" and re.search(r"wp-includes/js/dist/vendor/react", html, re.I):
                continue
            detected.append({"label": label, "crit": False, "note": "Firma detectada en HTML"})
    return detected or [{"label": "Stack no detectado", "crit": False, "note": "Sin firmas reconocibles"}]


def _finding(
    counter: int, domain: str, module: str, category: str, priority: str,
    title: str, what: str, direction: str, *, effort: str = "Bajo",
    evidence: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    severity = {"P0": 5, "P1": 4, "P2": 3, "P3": 2}[priority]
    return {
        "id": f"{re.sub(r'[^A-Z0-9]', '', domain.upper())}-{module}-{counter:03d}",
        "module": module, "category": category, "priority": priority,
        "stage": "discover", "title": title, "what": what,
        "impactBusiness": what, "impactUser": what, "impactTech": direction,
        "evidence": evidence or [], "confidence": 95, "severity": severity,
        "scope": 1.5, "businessImpact": 1.5, "auditxStatus": "CONFIRMED",
        "effort": effort, "direction": direction,
        "validate": "Repetir la auditoria y confirmar que el hallazgo desaparece.",
        "impact3mo": "Reduce rendimiento, confianza o visibilidad si no se corrige.",
        "impact6mo": "La deuda acumulada aumenta la brecha frente a competidores.",
    }


def analyze_document(
    *, url: str, domain: str, status: int, headers: dict[str, str], html: str,
    ttfb_ms: int, robots_text: str | None, sitemap_text: str | None,
    llms_text: str | None, link_checks: list[dict[str, Any]],
) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    meta = soup.find("meta", attrs={"name": re.compile(r"^description$", re.I)})
    description = str(meta.get("content", "")).strip() if meta else ""
    h1s = [node.get_text(" ", strip=True) for node in soup.find_all("h1") if node.get_text(" ", strip=True)]
    headings = [{"level": int(node.name[1]), "text": node.get_text(" ", strip=True)} for node in soup.find_all(re.compile(r"^h[1-6]$"))]
    images = soup.find_all("img")
    images_without_alt = sum(1 for image in images if not str(image.get("alt", "")).strip())
    canonical_node = soup.find("link", attrs={"rel": lambda value: value and "canonical" in value})
    canonical = canonical_node.get("href") if canonical_node else None
    viewport = bool(soup.find("meta", attrs={"name": re.compile(r"^viewport$", re.I)}))
    schema_nodes = soup.find_all("script", attrs={"type": "application/ld+json"})
    schema_types: list[str] = []
    for node in schema_nodes:
        schema_types.extend(re.findall(r'"@type"\s*:\s*"([^"]+)"', node.get_text()))
    has_open_graph = bool(soup.find("meta", attrs={"property": re.compile(r"^og:", re.I)}))
    has_twitter = bool(soup.find("meta", attrs={"name": re.compile(r"^twitter:", re.I)}))
    lang = str(soup.html.get("lang", "")).strip() if soup.html else ""
    form_controls = soup.find_all(["input", "select", "textarea"])
    labelled = 0
    for control in form_controls:
        control_id = control.get("id")
        if control.get("aria-label") or control.get("aria-labelledby") or control.find_parent("label") or (control_id and soup.find("label", attrs={"for": control_id})):
            labelled += 1
    for node in soup(["script", "style", "noscript", "svg"]):
        node.decompose()
    words = len([word for word in soup.get_text(" ", strip=True).split() if len(word) > 2])
    broken = [item for item in link_checks if item.get("broken")]

    findings: list[dict[str, Any]] = []
    def add(module: str, category: str, priority: str, heading: str, what: str, direction: str, effort: str = "Bajo", evidence: list[dict[str, str]] | None = None):
        findings.append(_finding(len(findings) + 1, domain, module, category, priority, heading, what, direction, effort=effort, evidence=evidence))

    if urlparse(url).scheme != "https": add("M13", "Seguridad", "P0", "Sitio sin HTTPS", "La conexion no esta cifrada y los navegadores reducen la confianza.", "Instalar TLS y redirigir HTTP a HTTPS.", "Medio")
    if status >= 400: add("M01", "HTTP", "P0", f"Error HTTP {status}", "La pagina principal no se pudo servir correctamente.", "Corregir disponibilidad, DNS o redirecciones.", "Alto")
    if not title: add("M04", "SEO", "P0", "Sin etiqueta title", "Google no puede construir un titulo de resultado controlado.", "Agregar un title unico de 50 a 60 caracteres.")
    elif len(title) < 30 or len(title) > 65: add("M04", "SEO", "P2", f"Title fuera del rango recomendado ({len(title)} caracteres)", "El snippet puede comunicar poco valor o aparecer truncado.", "Reescribir el title entre 50 y 60 caracteres.")
    if not description: add("M04", "SEO", "P1", "Sin meta description", "Google elegira texto automatico para el snippet.", "Agregar una descripcion unica de 145 a 155 caracteres.")
    if not h1s: add("M04", "SEO", "P1", "Sin encabezado H1", "No hay una senal clara del tema principal.", "Agregar exactamente un H1 descriptivo.")
    elif len(h1s) > 1: add("M04", "SEO", "P1", f"{len(h1s)} encabezados H1", "La jerarquia principal resulta ambigua.", "Conservar un solo H1 y convertir el resto a H2/H3.")
    if not viewport: add("M08", "Accesibilidad", "P0", "Sin viewport responsive", "La pagina puede renderizar mal en telefonos.", "Agregar meta viewport y validar en movil.")
    if images and (images_without_alt > 5 or images_without_alt / len(images) > .3): add("M08", "Accesibilidad", "P1", f"{images_without_alt} de {len(images)} imagenes sin alt util", "Lectores de pantalla y Google Images pierden contexto.", "Agregar alt descriptivo a imagenes de contenido.", "Medio")
    if not lang: add("M08", "Accesibilidad", "P2", "Documento sin idioma declarado", "Tecnologias de asistencia no conocen el idioma principal.", "Agregar lang al elemento html.")
    if not canonical: add("M04", "SEO", "P2", "Sin URL canonica", "Puede existir ambiguedad ante contenido duplicado.", "Agregar link rel=canonical absoluto.")
    if not schema_nodes: add("M11", "Datos estructurados", "P2", "Sin Schema.org JSON-LD", "Buscadores y agentes reciben poca identidad estructurada.", "Agregar Organization o LocalBusiness con datos confirmados.", "Medio")
    if not has_open_graph or not has_twitter: add("M10", "Social", "P2", "Metadatos sociales incompletos", "Los enlaces compartidos pueden perder imagen o mensaje.", "Agregar Open Graph y Twitter Card.")
    if form_controls and labelled < len(form_controls): add("M08", "Accesibilidad", "P1", f"{len(form_controls) - labelled} campos sin etiqueta accesible", "Usuarios y agentes no pueden identificar correctamente todos los campos.", "Relacionar labels, name y autocomplete con cada control.", "Medio")
    if robots_text is None: add("M05", "Indexacion", "P2", "robots.txt no disponible", "No existe una politica explicita para crawlers.", "Publicar robots.txt y enlazar el sitemap.")
    if sitemap_text is None: add("M05", "Indexacion", "P2", "sitemap.xml no disponible", "Los buscadores descubren el contenido con menor eficiencia.", "Generar sitemap XML y registrarlo en Search Console.", "Medio")
    if llms_text is None: add("M14", "Preparacion IA", "P3", "llms.txt no disponible", "Los agentes no reciben una guia resumida del negocio.", "Publicar llms.txt con contenido y rutas confiables.")
    if ttfb_ms > 1200: add("M02", "Rendimiento", "P1", f"TTFB alto: {ttfb_ms} ms", "La respuesta inicial retrasa toda la experiencia.", "Optimizar servidor, cache y consultas.", "Alto")
    elif ttfb_ms > 600: add("M02", "Rendimiento", "P2", f"TTFB mejorable: {ttfb_ms} ms", "La respuesta inicial supera el objetivo recomendado.", "Revisar cache y tiempo de backend.", "Medio")
    if broken: add("M06", "Enlaces", "P1", f"{len(broken)} enlaces rotos confirmados", "Los usuarios encuentran destinos con error.", "Corregir o retirar los enlaces rotos.", "Medio", [{"source": "HTTP", "value": f"{item['url']} -> {item['status']}"} for item in broken[:5]])
    missing_headers = [header for header in ("strict-transport-security", "content-security-policy", "x-content-type-options") if header not in headers]
    if missing_headers: add("M13", "Seguridad", "P2", "Cabeceras de seguridad incompletas", "Faltan defensas HTTP que reducen riesgos comunes.", "Configurar " + ", ".join(missing_headers) + ".", "Medio")
    if words < 180: add("M04", "Contenido", "P2", f"Contenido escaso: {words} palabras", "La pagina ofrece poco contexto para usuarios y buscadores.", "Ampliar contenido util y especifico del negocio.", "Medio")

    deduction = {"P0": 24, "P1": 12, "P2": 6, "P3": 2}
    def score_for(categories: set[str], base: int = 100) -> int:
        return max(0, base - sum(deduction[item["priority"]] for item in findings if item["category"] in categories))
    seo_score = score_for({"SEO", "Indexacion", "Contenido", "Datos estructurados", "Social", "Enlaces"})
    accessibility_score = score_for({"Accesibilidad"})
    performance_score = max(0, 100 - (35 if ttfb_ms > 1200 else 15 if ttfb_ms > 600 else 0) - (20 if status >= 400 else 0))
    conversion_score = max(0, 100 - (15 if not form_controls else 0) - (12 if words < 180 else 0) - (12 if not has_open_graph else 0) - len(broken) * 5)
    overall = round(seo_score * .32 + performance_score * .23 + accessibility_score * .2 + conversion_score * .25)
    agent_score = max(0, 100 - (20 if not schema_nodes else 0) - (15 if llms_text is None else 0) - (15 if robots_text is None else 0) - (15 if not form_controls else max(0, len(form_controls) - labelled) * 4))
    tech = _tech(html, headers)
    raw = {
        "url": url, "domain": domain, "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "ttfb": ttfb_ms, "statusCode": status, "isHttps": urlparse(url).scheme == "https",
        "headers": headers, "title": title, "titleLen": len(title),
        "metaDescription": description, "metaDescLen": len(description), "h1s": h1s,
        "headingOutline": headings, "canonical": canonical, "hasViewportMeta": viewport,
        "totalImages": len(images), "imagesWithoutAlt": images_without_alt,
        "wordCount": words, "hasSchema": bool(schema_nodes), "schemaTypes": schema_types,
        "hasOpenGraph": has_open_graph, "hasTwitterCard": has_twitter,
        "robotsTxtExists": robots_text is not None, "sitemapExists": sitemap_text is not None,
        "llmsTxtExists": llms_text is not None, "linkChecks": link_checks,
        "brokenLinks": [item["url"] for item in broken], "techDetected": tech,
        "screenshots": {}, "screenshotUrl": "",
    }
    return {
        "domain": domain, "url": url, "scanDate": datetime.now(timezone.utc).isoformat(),
        "scores": {"overall": overall, "performance": performance_score, "seo": seo_score, "accessibility": accessibility_score, "conversion": conversion_score},
        "findings": findings, "compactFindings": [], "tech": tech, "raw": raw,
        "agentReadiness": {
            "score": agent_score,
            "coverage": {"run": 5, "total": 7},
            "bots": [],
            "blockedCount": 0,
            "checks": [
                {"key": "schema-identity", "label": "Identidad legible por maquina", "pass": bool(schema_nodes), "source": "Schema.org", "weight": 20},
                {"key": "server-rendered", "label": "Contenido visible sin JavaScript", "pass": words >= 180, "source": "HTML servido", "weight": 20},
                {"key": "forms-semantic", "label": "Formularios operables", "pass": None if not form_controls else labelled == len(form_controls), "source": "WCAG 2.2", "weight": 15},
                {"key": "canonical", "label": "URL canonica", "pass": bool(canonical), "source": "HTML", "weight": 5},
                {"key": "llms-txt", "label": "llms.txt", "pass": llms_text is not None, "source": "Sitio", "weight": 5},
            ],
        },
        "coverage": {
            "pillars": [
                {"key": "seo", "label": "SEO", "run": 8, "total": 12, "note": "No incluye datos privados de Search Console."},
                {"key": "performance", "label": "Rendimiento", "run": 1, "total": 6, "note": "Mide TTFB; Core Web Vitals requieren telemetria de navegador."},
                {"key": "accessibility", "label": "Accesibilidad", "run": 5, "total": 56, "note": "La evaluacion automatica no sustituye una revision WCAG manual."},
                {"key": "conversion", "label": "Conversion", "run": 3, "total": 9, "note": "Sin analitica conectada no se observa comportamiento real."},
                {"key": "agent", "label": "Agent-Readiness", "run": 5, "total": 7, "note": "Analisis determinista del HTML y archivos publicos."},
            ],
            "overallPct": 24,
            "visualEvidence": False,
            "linksChecked": len(link_checks),
        },
    }


async def run_internal_audit(raw_url: str) -> dict[str, Any]:
    url, _ = validate_public_url(raw_url)
    timeout = httpx.Timeout(18.0, connect=8.0)
    limits = httpx.Limits(max_connections=8, max_keepalive_connections=4)
    async with httpx.AsyncClient(timeout=timeout, limits=limits) as client:
        page = await _safe_fetch(client, url)
        final_url, domain = validate_public_url(page.url)
        soup = BeautifulSoup(page.text, "html.parser")
        origin = f"{urlparse(final_url).scheme}://{urlparse(final_url).netloc}"
        links: list[str] = []
        for node in soup.find_all("a", href=True):
            absolute = urljoin(final_url, str(node["href"]))
            parsed = urlparse(absolute)
            if parsed.scheme in {"http", "https"} and absolute not in links:
                links.append(absolute)
            if len(links) >= MAX_LINKS:
                break
        robots, sitemap, llms, link_checks = await asyncio.gather(
            _optional_text(client, origin + "/robots.txt"),
            _optional_text(client, origin + "/sitemap.xml"),
            _optional_text(client, origin + "/llms.txt"),
            asyncio.gather(*[_check_link(client, link) for link in links]),
        )
    return analyze_document(
        url=final_url, domain=domain, status=page.status, headers=page.headers,
        html=page.text, ttfb_ms=page.ttfb_ms, robots_text=robots,
        sitemap_text=sitemap, llms_text=llms, link_checks=list(link_checks),
    )
