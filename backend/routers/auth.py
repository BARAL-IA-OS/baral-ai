# backend/routers/auth.py
"""Endpoints relacionados a la sesion del usuario autenticado."""
from fastapi import APIRouter, Depends

from dependencies.auth import CurrentUser, get_current_user

router = APIRouter(tags=["Auth"])


@router.get("/me")
async def me(user: CurrentUser = Depends(get_current_user)):
    """Devuelve el usuario del JWT. Sirve para verificar que el token es valido."""
    return {"id": user.id, "email": user.email}
