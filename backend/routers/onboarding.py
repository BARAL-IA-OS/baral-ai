# backend/routers/onboarding.py
"""Onboarding: importacion de la base de clientes desde CSV."""
import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from dependencies.auth import CurrentUser, get_current_user
from services.db_service import get_supabase

router = APIRouter(tags=["Onboarding"])

# Mapeo flexible de encabezados del CSV -> columnas de la tabla `clients`.
HEADER_MAP = {
    "nombre": "nombre", "name": "nombre", "cliente": "nombre",
    "email": "email", "correo": "email", "e-mail": "email", "mail": "email",
    "telefono": "telefono", "phone": "telefono", "celular": "telefono", "movil": "telefono",
    "ultima_compra": "ultima_compra", "last_purchase": "ultima_compra", "fecha": "ultima_compra",
    "fecha_compra": "ultima_compra",
    "producto": "producto", "product": "producto", "servicio": "producto",
}

_DATE_FORMATS = ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%Y/%m/%d")


def _norm(header: str) -> str:
    return (header or "").strip().lower().replace(" ", "_")


def _parse_date(value: str) -> str | None:
    """Normaliza una fecha a ISO (YYYY-MM-DD); None si no se reconoce."""
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            continue
    return None


@router.post("/import-clients")
async def import_clients(
    file: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),
):
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="El archivo debe ser un CSV")

    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="El CSV esta vacio o no tiene encabezados")

    # Mapear encabezados detectados a columnas reales.
    colmap = {h: HEADER_MAP[_norm(h)] for h in reader.fieldnames if _norm(h) in HEADER_MAP}
    detected = set(colmap.values())
    if "nombre" not in detected or "email" not in detected:
        raise HTTPException(
            status_code=400,
            detail="El CSV debe incluir al menos las columnas 'nombre' y 'email'",
        )

    rows: list[dict] = []
    skipped = 0
    errors: list[str] = []

    for line_no, record in enumerate(reader, start=2):  # fila 1 = encabezados
        row: dict = {}
        for original, column in colmap.items():
            value = (record.get(original) or "").strip()
            if not value:
                continue
            if column == "ultima_compra":
                iso = _parse_date(value)
                if iso:
                    row[column] = iso
            else:
                row[column] = value

        if not row.get("nombre") or not row.get("email"):
            skipped += 1
            if len(errors) < 10:
                errors.append(f"Fila {line_no}: falta nombre o email")
            continue

        row["user_id"] = user.id
        rows.append(row)

    if not rows:
        raise HTTPException(status_code=400, detail="No se encontraron filas validas para importar")

    try:
        get_supabase().table("clients").insert(rows).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al guardar en Supabase: {exc}") from exc

    return {
        "success": True,
        "imported": len(rows),
        "skipped": skipped,
        "columns_detected": sorted(detected),
        "errors": errors,
    }
