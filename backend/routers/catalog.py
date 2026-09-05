from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from dependencies.auth import CurrentUser, get_current_user
from models.catalog import CatalogItemInput, CatalogItemUpdate
from services.db_service import get_supabase


router = APIRouter(prefix="/catalog-items", tags=["Catalog"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("")
async def list_catalog_items(
    status: str = Query(default="active", pattern="^(active|archived|all)$"),
    search: str = "",
    user: CurrentUser = Depends(get_current_user),
):
    query = get_supabase().table("catalog_items").select("*").eq("user_id", user.id)
    if status != "all":
        query = query.eq("status", status)
    if search.strip():
        safe_search = search.strip().replace("%", "")
        query = query.or_(f"name.ilike.%{safe_search}%,category.ilike.%{safe_search}%")
    result = query.order("featured", desc=True).order("updated_at", desc=True).execute()
    return {"items": result.data or []}


@router.post("", status_code=201)
async def create_catalog_item(
    request: CatalogItemInput,
    user: CurrentUser = Depends(get_current_user),
):
    payload = request.model_dump()
    payload.update({"user_id": user.id, "updated_at": _now()})
    result = get_supabase().table("catalog_items").insert(payload).execute()
    return {"success": True, "item": result.data[0]}


@router.patch("/{item_id}")
async def update_catalog_item(
    item_id: str,
    request: CatalogItemUpdate,
    user: CurrentUser = Depends(get_current_user),
):
    payload = request.model_dump(exclude_unset=True)
    payload["updated_at"] = _now()
    result = (
        get_supabase()
        .table("catalog_items")
        .update(payload)
        .eq("id", item_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Producto o servicio no encontrado")
    return {"success": True, "item": result.data[0]}


@router.delete("/{item_id}")
async def delete_catalog_item(item_id: str, user: CurrentUser = Depends(get_current_user)):
    result = (
        get_supabase()
        .table("catalog_items")
        .delete()
        .eq("id", item_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Producto o servicio no encontrado")
    return {"success": True}
