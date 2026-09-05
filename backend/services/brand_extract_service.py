# backend/services/brand_extract_service.py
"""Ingestion para el Brand Brain: URL o archivo -> texto -> campos estructurados.

Flujo unificado:
  fuente (url o archivo) -> extraer texto crudo -> LLM estructura -> campos
"""
import io

from prompts.brand_extract import BRAND_EXTRACT_SYSTEM
from services.llm_service import LLMService, LLMUnavailable
from services.url_security import safe_get

# Tope de texto que se manda al LLM (protege costo/latencia).
_MAX_CHARS = 8000
_FIELDS = ("industria", "propuesta", "tono", "audiencia", "diferenciador")


class ExtractionError(Exception):
    """No se pudo obtener texto de la fuente."""


# ---- Extraccion de texto -----------------------------------------------------

def extract_from_url(url: str) -> str:
    """Descarga la pagina y devuelve su texto legible."""
    try:
        _, body, _ = safe_get(
            url,
            max_bytes=3 * 1024 * 1024,
            allowed_content_prefixes=("text/html",),
        )
        html = body.decode("utf-8", errors="replace")
    except Exception as exc:
        raise ExtractionError(f"No se pudo acceder a la pagina: {exc}") from exc

    # 1) trafilatura (mejor extraccion de contenido principal)
    try:
        import trafilatura

        text = trafilatura.extract(html, include_comments=False, include_tables=False)
        if text and text.strip():
            return text.strip()
    except Exception:
        pass

    # 2) fallback: BeautifulSoup (texto plano)
    try:
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        text = " ".join(soup.get_text(separator=" ").split())
        if text.strip():
            return text.strip()
    except Exception:
        pass

    raise ExtractionError("La pagina no devolvio texto (posiblemente requiere JavaScript).")


def extract_from_file(filename: str, data: bytes) -> str:
    """Extrae texto de un PDF, .docx, .md o .txt."""
    name = (filename or "").lower()

    if name.endswith(".pdf"):
        try:
            from pypdf import PdfReader

            reader = PdfReader(io.BytesIO(data))
            return "\n".join((page.extract_text() or "") for page in reader.pages).strip()
        except Exception as exc:
            raise ExtractionError(f"No se pudo leer el PDF: {exc}") from exc

    if name.endswith(".docx"):
        try:
            import docx

            doc = docx.Document(io.BytesIO(data))
            return "\n".join(p.text for p in doc.paragraphs).strip()
        except Exception as exc:
            raise ExtractionError(f"No se pudo leer el .docx: {exc}") from exc

    if name.endswith((".md", ".txt", ".markdown")):
        try:
            return data.decode("utf-8-sig", errors="replace").strip()
        except Exception as exc:
            raise ExtractionError(f"No se pudo leer el archivo: {exc}") from exc

    raise ExtractionError("Formato no soportado. Usa PDF, DOCX, MD o TXT.")


# ---- Estructuracion con LLM --------------------------------------------------

def structure_brand(raw_text: str) -> dict:
    """Convierte el texto crudo en nombre + campos del Brand Brain (via LLM)."""
    text = (raw_text or "").strip()
    if not text:
        raise ExtractionError("No se obtuvo texto para analizar.")

    empty = {f: "" for f in _FIELDS}
    llm = LLMService()
    if not llm.available:
        # Sin IA: devolvemos vacio + el texto crudo para que el usuario lo edite.
        return {"nombre_empresa": "", "fields": empty, "tokens_used": 0, "cost_usd": 0.0, "provider": "stub"}

    try:
        res = llm.complete_json(
            BRAND_EXTRACT_SYSTEM,
            f"TEXTO DE LA EMPRESA:\n{text[:_MAX_CHARS]}",
            temperature=0.2,
            max_tokens=600,
        )
        data = res.data if isinstance(res.data, dict) else {}
        fields = {f: str(data.get(f, "") or "").strip() for f in _FIELDS}
        nombre = str(data.get("nombre_empresa", "") or "").strip()
        return {"nombre_empresa": nombre, "fields": fields, "tokens_used": res.tokens, "cost_usd": res.cost_usd, "provider": res.provider}
    except LLMUnavailable:
        return {"nombre_empresa": "", "fields": empty, "tokens_used": 0, "cost_usd": 0.0, "provider": "stub"}


def extract_and_structure(*, url: str | None = None, filename: str | None = None, data: bytes | None = None) -> dict:
    """Punto de entrada: obtiene texto de la fuente y lo estructura."""
    if url:
        raw = extract_from_url(url)
    elif data is not None:
        raw = extract_from_file(filename or "", data)
    else:
        raise ExtractionError("Falta la fuente (url o archivo).")

    result = structure_brand(raw)
    result["raw_text"] = raw[:_MAX_CHARS]
    result["chars"] = len(raw)
    return result
