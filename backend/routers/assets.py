import io
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

from dependencies.auth import CurrentUser, get_current_user
from models.brand_asset import BrandAssetType, BrandAssetUpdate
from services.db_service import get_supabase
from services.url_security import UnsafeUrlError, safe_get


router = APIRouter(prefix="/brand-assets", tags=["Brand Assets"])
BUCKET = "brand-assets"
MAX_BYTES = 10 * 1024 * 1024
ALLOWED_FORMATS = {"PNG": ("image/png", ".png"), "JPEG": ("image/jpeg", ".jpg"), "WEBP": ("image/webp", ".webp")}


class ImportAssetRequest(BaseModel):
    url: str
    title: str | None = None
    asset_type: BrandAssetType = "reference"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _inspect_image(data: bytes) -> tuple[str, str, int, int]:
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="La imagen excede 10 MB")
    try:
        with Image.open(io.BytesIO(data)) as image:
            image.verify()
        with Image.open(io.BytesIO(data)) as image:
            image_format = (image.format or "").upper()
            width, height = image.size
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=400, detail="El archivo no es una imagen valida") from exc
    if image_format not in ALLOWED_FORMATS:
        raise HTTPException(status_code=400, detail="Usa PNG, JPG, JPEG o WebP")
    mime, extension = ALLOWED_FORMATS[image_format]
    return mime, extension, width, height


def _signed_url(storage_path: str) -> str | None:
    response = get_supabase().storage.from_(BUCKET).create_signed_url(storage_path, 3600)
    if isinstance(response, dict):
        return response.get("signedURL") or response.get("signedUrl") or response.get("signed_url")
    return None


def _serialize_asset(row: dict) -> dict:
    return {**row, "signed_url": _signed_url(row["storage_path"])}


def _store_asset(
    *,
    user_id: str,
    data: bytes,
    original_filename: str,
    title: str,
    asset_type: str,
    source_url: str | None = None,
    catalog_item_id: str | None = None,
) -> dict:
    mime, extension, width, height = _inspect_image(data)
    asset_id = str(uuid4())
    safe_stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", Path(original_filename).stem).strip("-") or "asset"
    storage_path = f"{user_id}/{asset_id}/{safe_stem}{extension}"
    get_supabase().storage.from_(BUCKET).upload(
        storage_path,
        data,
        {"content-type": mime, "upsert": "false"},
    )
    payload = {
        "id": asset_id,
        "user_id": user_id,
        "title": title.strip() or safe_stem,
        "asset_type": asset_type,
        "storage_path": storage_path,
        "original_filename": original_filename,
        "mime_type": mime,
        "size_bytes": len(data),
        "width": width,
        "height": height,
        "source_url": source_url,
        "catalog_item_id": catalog_item_id,
        "updated_at": _now(),
    }
    try:
        result = get_supabase().table("brand_assets").insert(payload).execute()
    except Exception:
        get_supabase().storage.from_(BUCKET).remove([storage_path])
        raise
    return _serialize_asset(result.data[0])


@router.get("")
async def list_brand_assets(user: CurrentUser = Depends(get_current_user)):
    result = (
        get_supabase()
        .table("brand_assets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"assets": [_serialize_asset(row) for row in (result.data or [])]}


@router.post("/upload", status_code=201)
async def upload_brand_assets(
    files: Annotated[list[UploadFile], File()],
    asset_type: Annotated[BrandAssetType, Form()] = "reference",
    catalog_item_id: Annotated[str | None, Form()] = None,
    user: CurrentUser = Depends(get_current_user),
):
    if not files or len(files) > 20:
        raise HTTPException(status_code=400, detail="Sube entre 1 y 20 imagenes")
    assets: list[dict] = []
    if catalog_item_id:
        owned_item = get_supabase().table("catalog_items").select("id").eq(
            "id", catalog_item_id
        ).eq("user_id", user.id).limit(1).execute()
        if not owned_item.data:
            raise HTTPException(status_code=404, detail="Elemento de catalogo no encontrado")
    for file in files:
        data = await file.read(MAX_BYTES + 1)
        assets.append(_store_asset(
            user_id=user.id,
            data=data,
            original_filename=file.filename or "asset",
            title=Path(file.filename or "asset").stem,
            asset_type=asset_type,
            catalog_item_id=catalog_item_id,
        ))
    return {"success": True, "assets": assets}


@router.post("/import-url", status_code=201)
async def import_brand_asset(
    request: ImportAssetRequest,
    user: CurrentUser = Depends(get_current_user),
):
    try:
        final_url, data, _ = safe_get(
            request.url,
            max_bytes=MAX_BYTES,
            allowed_content_prefixes=("image/",),
        )
    except (UnsafeUrlError, ValueError, OSError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    filename = Path(final_url.split("?", 1)[0]).name or "imported-asset"
    asset = _store_asset(
        user_id=user.id,
        data=data,
        original_filename=filename,
        title=request.title or Path(filename).stem,
        asset_type=request.asset_type,
        source_url=final_url,
    )
    return {"success": True, "asset": asset}


@router.patch("/{asset_id}")
async def update_brand_asset(
    asset_id: str,
    request: BrandAssetUpdate,
    user: CurrentUser = Depends(get_current_user),
):
    payload = request.model_dump(exclude_unset=True)
    payload["updated_at"] = _now()
    result = (
        get_supabase()
        .table("brand_assets")
        .update(payload)
        .eq("id", asset_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return {"success": True, "asset": _serialize_asset(result.data[0])}


@router.delete("/{asset_id}")
async def delete_brand_asset(asset_id: str, user: CurrentUser = Depends(get_current_user)):
    result = (
        get_supabase()
        .table("brand_assets")
        .select("id,storage_path")
        .eq("id", asset_id)
        .eq("user_id", user.id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    row = result.data[0]
    get_supabase().storage.from_(BUCKET).remove([row["storage_path"]])
    (
        get_supabase()
        .table("brand_assets")
        .delete()
        .eq("id", asset_id)
        .eq("user_id", user.id)
        .execute()
    )
    return {"success": True}
