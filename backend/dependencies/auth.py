# backend/dependencies/auth.py
"""Verificacion del JWT de Supabase.

El frontend manda el access_token de Supabase en el header:
    Authorization: Bearer <token>

Validamos el token contra Supabase Auth (GoTrue) y devolvemos el usuario.
Usar como dependencia en cualquier endpoint protegido:

    @router.get("/algo")
    async def algo(user: CurrentUser = Depends(get_current_user)):
        user.id  # user_id para filtrar en la DB
"""
from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services.db_service import get_supabase

_bearer = HTTPBearer(auto_error=True)


@dataclass
class CurrentUser:
    id: str
    email: str | None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> CurrentUser:
    token = credentials.credentials
    try:
        response = get_supabase().auth.get_user(token)
    except Exception as exc:  # token invalido/expirado o fallo de red
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = getattr(response, "user", None)
    if user is None or not getattr(user, "id", None):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return CurrentUser(id=user.id, email=getattr(user, "email", None))
