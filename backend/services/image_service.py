# backend/services/image_service.py
"""Generacion de imagenes con OpenAI Images (gpt-image-1).

- Bajo demanda (una imagen por llamada) para cuidar el saldo.
- Costo REAL calculado desde `usage` (tokens) de la respuesta.
- La imagen se guarda en Supabase Storage (bucket publico) y se devuelve su URL.
- Sin OPENAI_API_KEY devuelve None (el frontend muestra el placeholder).
"""
import base64
import uuid
from dataclasses import dataclass

import config
from services.db_service import get_supabase

# Precio gpt-image-1 por 1M tokens: texto de entrada / imagen de salida.
_PRICE_TEXT_IN = 5.0
_PRICE_IMAGE_OUT = 40.0
# Estimado por si la respuesta no trae usage (segun calidad, 1024x1024).
_IMG_COST_FALLBACK = {"low": 0.011, "medium": 0.042, "high": 0.167}

_BUCKET = "content-images"


@dataclass
class ImageResult:
    b64: str | None          # PNG en base64 (fallback si no hay storage)
    image_url: str | None    # URL publica en Supabase Storage
    cost_usd: float
    tokens: int
    provider: str
    error: str | None = None


def _ensure_bucket(sb) -> None:
    """Crea el bucket publico si no existe (idempotente)."""
    try:
        sb.storage.create_bucket(_BUCKET, options={"public": True})
    except Exception:
        pass  # ya existe u otro error no fatal


def _save_to_storage(b64: str, user_id: str | None) -> str | None:
    """Sube el PNG a Supabase Storage y devuelve la URL publica."""
    try:
        sb = get_supabase()
        _ensure_bucket(sb)
        data = base64.b64decode(b64)
        path = f"{user_id or 'anon'}/{uuid.uuid4().hex}.png"
        sb.storage.from_(_BUCKET).upload(
            path, data, {"content-type": "image/png", "upsert": "true"}
        )
        return sb.storage.from_(_BUCKET).get_public_url(path)
    except Exception:
        return None


def _cost_from_usage(usage) -> float:
    inp = getattr(usage, "input_tokens", 0) or 0
    out = getattr(usage, "output_tokens", 0) or 0
    return round(inp / 1_000_000 * _PRICE_TEXT_IN + out / 1_000_000 * _PRICE_IMAGE_OUT, 6)


def generate_image(prompt: str, user_id: str | None = None) -> ImageResult:
    """Genera UNA imagen a partir del prompt (tipicamente el `media_alt`)."""
    if not config.OPENAI_API_KEY:
        return ImageResult(None, None, 0.0, 0, "stub", error="OPENAI_API_KEY no configurada")

    try:
        from openai import OpenAI

        client = OpenAI(api_key=config.OPENAI_API_KEY)
        resp = client.images.generate(
            model=config.OPENAI_IMAGE_MODEL,
            prompt=prompt,
            size=config.OPENAI_IMAGE_SIZE,
            quality=config.OPENAI_IMAGE_QUALITY,
            n=1,
        )
        b64 = resp.data[0].b64_json

        usage = getattr(resp, "usage", None)
        tokens = int(getattr(usage, "total_tokens", 0) or 0) if usage else 0
        cost = _cost_from_usage(usage) if usage else _IMG_COST_FALLBACK.get(config.OPENAI_IMAGE_QUALITY, 0.011)

        image_url = _save_to_storage(b64, user_id)

        return ImageResult(
            b64=None if image_url else b64,  # si se guardo, no arrastramos el base64
            image_url=image_url,
            cost_usd=cost,
            tokens=tokens,
            provider=f"openai:{config.OPENAI_IMAGE_MODEL}",
        )
    except Exception as exc:
        return ImageResult(None, None, 0.0, 0, "openai", error=str(exc))
