# backend/routers/usage.py
"""Resumen de gasto de generacion por usuario."""
from fastapi import APIRouter, Depends

from dependencies.auth import CurrentUser, get_current_user
from services.usage_service import usage_summary

router = APIRouter(tags=["Usage"])


@router.get("/usage/summary")
async def get_usage_summary(user: CurrentUser = Depends(get_current_user)):
    """Cuanto ha gastado el usuario en generacion (texto + imagen)."""
    return usage_summary(user.id)
