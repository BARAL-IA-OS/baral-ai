# backend/routers/content.py
"""Generacion de contenido multicanal para el Estudio."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from dependencies.auth import CurrentUser, get_current_user
from services.content_service import generate_content
from services.db_service import get_supabase
from services.image_service import generate_image
from services.usage_service import log_usage

router = APIRouter(tags=["Content"])


class GenerateContentRequest(BaseModel):
    prompt: str
    channels: list[str] = []  # vacio = todos los canales


class GenerateImageRequest(BaseModel):
    prompt: str  # normalmente el `media_alt` de un canal


@router.post("/content/generate")
async def generate(request: GenerateContentRequest, user: CurrentUser = Depends(get_current_user)):
    """Genera texto por canal a partir del prompt + Brand Brain del usuario."""
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="El prompt no puede estar vacio")

    brand_res = (
        get_supabase().table("brand_brain").select("*").eq("user_id", user.id).limit(1).execute()
    )
    if not brand_res.data:
        raise HTTPException(status_code=400, detail="Primero completa tu Brand Brain")

    result = generate_content(request.prompt, request.channels, brand_res.data[0])

    log_usage(user.id, kind="text", provider=result["provider"], cost_usd=result["cost_usd"], tokens=result["tokens_used"])

    return {
        "success": True,
        "prompt": request.prompt,
        "items": result["items"],
        "tokens_used": result["tokens_used"],
        "cost_usd": result["cost_usd"],
        "provider": result["provider"],
    }


@router.post("/content/image")
async def generate_image_endpoint(
    request: GenerateImageRequest,
    user: CurrentUser = Depends(get_current_user),
):
    """Genera UNA imagen (bajo demanda) a partir del prompt/media_alt."""
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="El prompt no puede estar vacio")

    result = generate_image(request.prompt, user_id=user.id)
    if result.image_url is None and result.b64 is None:
        raise HTTPException(
            status_code=503,
            detail=result.error or "Generacion de imagen no disponible",
        )

    # Registra el gasto de esta generacion.
    log_usage(user.id, kind="image", provider=result.provider, cost_usd=result.cost_usd, tokens=result.tokens)

    return {
        "success": True,
        "image_url": result.image_url,   # URL en Supabase Storage (preferida)
        "image_b64": result.b64,         # fallback: data:image/png;base64,<image_b64>
        "cost_usd": result.cost_usd,
        "tokens": result.tokens,
        "provider": result.provider,
    }
