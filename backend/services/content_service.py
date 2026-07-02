# backend/services/content_service.py
"""Generacion de contenido multicanal para el Estudio.

Una sola llamada al LLM genera el contenido de TODOS los canales pedidos
(respeta el cap de costo). Sin API keys: fallback determinista local.
La imagen aun no se genera: `media_alt` describe la imagen a producir despues.
"""
from prompts.content import CONTENT_SYSTEM
from services.llm_service import LLMService, LLMUnavailable

CHANNELS = ["email", "whatsapp", "instagram", "facebook", "tiktok"]

# Canales que usan hashtags / asunto
_WITH_HASHTAGS = {"instagram", "facebook", "tiktok"}
_WITH_SUBJECT = {"email"}


def _build_user_prompt(prompt: str, channels: list[str], brand: dict) -> str:
    return (
        "BRAND BRAIN:\n"
        f"- Industria: {brand.get('industria', '')}\n"
        f"- Propuesta: {brand.get('propuesta', '')}\n"
        f"- Tono: {brand.get('tono', '')}\n"
        f"- Audiencia: {brand.get('audiencia', '')}\n"
        f"- Diferenciador: {brand.get('diferenciador', '')}\n"
        f"- PROHIBICIONES: {brand.get('prohibiciones', '')}\n\n"
        f"IDEA DE CAMPANA: {prompt}\n\n"
        f"CANALES SOLICITADOS: {', '.join(channels)}\n"
    )


def _stub_channel(channel: str, prompt: str, brand: dict) -> dict:
    """Contenido determinista sin IA."""
    idea = (prompt or "nuestra novedad").strip()
    empresa = brand.get("industria", "nuestra empresa")
    item: dict = {
        "caption": f"{idea}. En {empresa} lo hacemos pensando en ti.",
        "cta": "Mas informacion",
        "media_alt": f"Imagen alusiva a: {idea}",
    }
    if channel in _WITH_SUBJECT:
        item["subject"] = idea[:60]
    if channel in _WITH_HASHTAGS:
        item["hashtags"] = ["#Campana", "#Baral"]
    return item


def _normalize(channel: str, raw: dict, prompt: str, brand: dict) -> dict:
    """Garantiza los campos por canal, con fallback por campo."""
    raw = raw or {}
    stub = _stub_channel(channel, prompt, brand)
    item = {
        "channel": channel,
        "caption": (raw.get("caption") or stub["caption"]).strip(),
        "cta": (raw.get("cta") or stub["cta"]).strip(),
        "media_alt": (raw.get("media_alt") or stub["media_alt"]).strip(),
    }
    if channel in _WITH_SUBJECT:
        item["subject"] = (raw.get("subject") or stub.get("subject", "")).strip()
    if channel in _WITH_HASHTAGS:
        tags = raw.get("hashtags") or stub.get("hashtags", [])
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.replace(",", " ").split() if t.strip()]
        item["hashtags"] = [str(t) for t in tags][:6]
    return item


def generate_content(prompt: str, channels: list[str], brand: dict) -> dict:
    """Genera contenido para los canales pedidos. Devuelve items + uso."""
    channels = [c for c in (channels or []) if c in CHANNELS] or CHANNELS

    llm = LLMService()
    tokens = 0
    cost = 0.0
    provider = "stub"
    data: dict = {}

    if llm.available:
        try:
            user = _build_user_prompt(prompt, channels, brand)
            res = llm.complete_json(CONTENT_SYSTEM, user, temperature=0.6, max_tokens=1200)
            data = res.data if isinstance(res.data, dict) else {}
            tokens = res.tokens
            cost = res.cost_usd
            provider = res.provider
        except LLMUnavailable:
            data = {}

    items = [_normalize(ch, data.get(ch, {}), prompt, brand) for ch in channels]

    return {
        "items": items,
        "tokens_used": tokens,
        "cost_usd": round(cost, 6),
        "provider": provider,
    }
