# backend/routers/clients.py
from fastapi import APIRouter, Depends, HTTPException

from dependencies.auth import CurrentUser, get_current_user
from services.db_service import get_supabase

router = APIRouter(tags=["Clients"])


@router.get("/clients")
async def list_clients(user: CurrentUser = Depends(get_current_user)):
    """Lista todos los clientes importados por el usuario."""
    res = (
        get_supabase()
        .table("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("nombre", desc=False)
        .execute()
    )
    return {"clients": res.data or []}


@router.delete("/clients/{client_id}")
async def delete_client(client_id: str, user: CurrentUser = Depends(get_current_user)):
    """Elimina un cliente por ID (solo si pertenece al usuario)."""
    sb = get_supabase()
    # Verify ownership
    check = sb.table("clients").select("id").eq("id", client_id).eq("user_id", user.id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    sb.table("clients").delete().eq("id", client_id).execute()
    return {"success": True}
