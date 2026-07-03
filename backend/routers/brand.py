# backend/routers/brand.py
"""Ingestion del Brand Brain: extrae y estructura info desde URL o archivo."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from dependencies.auth import CurrentUser, get_current_user
from services.brand_extract_service import ExtractionError, extract_and_structure
from services.usage_service import log_usage

router = APIRouter(tags=["Brand"])

_MAX_FILE_MB = 10


class ExtractUrlRequest(BaseModel):
    url: str


def _respond(result: dict, user_id: str) -> dict:
    if result.get("cost_usd"):
        log_usage(user_id, kind="text", provider=result.get("provider", ""), cost_usd=result["cost_usd"], tokens=result.get("tokens_used", 0))
    return {
        "success": True,
        "nombre_empresa": result.get("nombre_empresa", ""),
        "fields": result["fields"],       # { industria, propuesta, tono, audiencia, diferenciador }
        "raw_text": result["raw_text"],    # texto crudo (para el editor)
        "chars": result["chars"],
        "provider": result.get("provider"),
    }


@router.post("/brand/extract-url")
async def extract_url(request: ExtractUrlRequest, user: CurrentUser = Depends(get_current_user)):
    """Extrae info de marca desde la URL de la empresa y la estructura."""
    if not request.url.strip():
        raise HTTPException(status_code=400, detail="La URL no puede estar vacia")
    try:
        result = extract_and_structure(url=request.url)
    except ExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return _respond(result, user.id)


@router.post("/brand/extract-file")
async def extract_file(file: UploadFile = File(...), user: CurrentUser = Depends(get_current_user)):
    """Extrae info de marca desde un archivo (PDF, DOCX, MD, TXT) y la estructura."""
    data = await file.read()
    if len(data) > _MAX_FILE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"El archivo excede {_MAX_FILE_MB} MB")
    try:
        result = extract_and_structure(filename=file.filename, data=data)
    except ExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return _respond(result, user.id)
