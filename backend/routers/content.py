# backend/routers/content.py
"""Generacion de contenido multicanal para el Estudio."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from dependencies.auth import CurrentUser, get_current_user
from services.content_service import generate_content
from services.db_service import get_supabase

router = APIRouter(tags=["Content"])


class GenerateContentRequest(BaseModel):
    prompt: str
    channels: list[str] = []  # vacio = todos los canales


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

    return {
        "success": True,
        "prompt": request.prompt,
        "items": result["items"],
        "tokens_used": result["tokens_used"],
        "cost_usd": result["cost_usd"],
        "provider": result["provider"],
    }
