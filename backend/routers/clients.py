import csv
import io
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from dependencies.auth import CurrentUser, get_current_user
from models.client import (
    ClientImportMapping,
    ClientInput,
    ClientSegmentInput,
    ClientUpdate,
    ConfirmClientImport,
)
from services.db_service import get_supabase


router = APIRouter(tags=["Clients"])
MAX_IMPORT_BYTES = 10 * 1024 * 1024
MAX_IMPORT_ROWS = 5000
ALLOWED_MAPPING_FIELDS = {
    "nombre", "email", "telefono", "company", "producto", "interest", "source",
    "lifecycle_status", "ultima_compra", "last_purchase_amount", "tags", "notes",
}
HEADER_ALIASES = {
    "nombre": "nombre", "name": "nombre", "cliente": "nombre",
    "email": "email", "correo": "email", "e-mail": "email", "mail": "email",
    "telefono": "telefono", "phone": "telefono", "celular": "telefono", "movil": "telefono",
    "empresa": "company", "company": "company",
    "producto": "producto", "product": "producto", "servicio": "producto",
    "interes": "interest", "interest": "interest",
    "origen": "source", "source": "source",
    "estado": "lifecycle_status", "status": "lifecycle_status",
    "ultima_compra": "ultima_compra", "last_purchase": "ultima_compra", "fecha_compra": "ultima_compra",
    "monto": "last_purchase_amount", "last_purchase_amount": "last_purchase_amount",
    "etiquetas": "tags", "tags": "tags", "notas": "notes", "notes": "notes",
}
STATUS_ALIASES = {
    "nuevo": "new", "new": "new", "activo": "active", "active": "active",
    "inactivo": "inactive", "inactive": "inactive", "vip": "vip",
    "no_contactar": "do_not_contact", "do_not_contact": "do_not_contact",
}
DATE_FORMATS = ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%Y/%m/%d")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_header(value: str) -> str:
    value = (value or "").strip().lower()
    return re.sub(r"[^a-z0-9áéíóúñ]+", "_", value).strip("_")


def _normalize_email(value: str | None) -> str:
    return (value or "").strip().lower()


def _normalize_phone(value: str | None) -> str:
    return re.sub(r"\D", "", value or "")


def _parse_date(value: str) -> str | None:
    for date_format in DATE_FORMATS:
        try:
            return datetime.strptime(value, date_format).date().isoformat()
        except ValueError:
            continue
    return None


def _client_payload(model: ClientInput | ClientUpdate, *, exclude_unset: bool = False) -> dict:
    payload = model.model_dump(exclude_unset=exclude_unset, mode="json")
    if "email" in payload and payload["email"]:
        payload["email"] = _normalize_email(payload["email"])
    if "telefono" in payload and payload["telefono"]:
        payload["telefono"] = payload["telefono"].strip()
    if "tags" in payload and payload["tags"] is not None:
        payload["tags"] = list(dict.fromkeys(tag.strip() for tag in payload["tags"] if tag.strip()))
    payload["updated_at"] = _now()
    return payload


def _apply_filters(query, filters: dict):
    client_ids = filters.get("clientIds")
    if isinstance(client_ids, list) and client_ids:
        query = query.in_("id", [str(value) for value in client_ids[:5000]])
    statuses = filters.get("statuses") or filters.get("status")
    if isinstance(statuses, str):
        statuses = [statuses]
    valid_statuses = [value for value in (statuses or []) if value in STATUS_ALIASES.values()]
    if valid_statuses:
        query = query.in_("lifecycle_status", valid_statuses)
    source = str(filters.get("source") or "").strip()
    if source:
        query = query.eq("source", source)
    interest = str(filters.get("interest") or "").strip()
    if interest:
        query = query.eq("interest", interest)
    product = str(filters.get("product") or "").strip()
    if product:
        query = query.eq("producto", product)
    tags = filters.get("tags")
    if isinstance(tags, list) and tags:
        query = query.contains("tags", tags)
    if filters.get("purchasedAfter"):
        query = query.gte("ultima_compra", filters["purchasedAfter"])
    if filters.get("purchasedBefore"):
        query = query.lte("ultima_compra", filters["purchasedBefore"])
    search = re.sub(r"[%(),]", "", str(filters.get("search") or "").strip())
    if search:
        query = query.or_(f"nombre.ilike.%{search}%,email.ilike.%{search}%,telefono.ilike.%{search}%,producto.ilike.%{search}%")
    return query


@router.get("/clients/stats")
async def client_stats(user: CurrentUser = Depends(get_current_user)):
    result = get_supabase().table("clients").select(
        "id,lifecycle_status,email,telefono,created_at"
    ).eq("user_id", user.id).execute()
    rows = result.data or []
    return {
        "total": len(rows),
        "active": sum(row.get("lifecycle_status") in {"active", "vip"} for row in rows),
        "inactive": sum(row.get("lifecycle_status") == "inactive" for row in rows),
        "new": sum(row.get("lifecycle_status") == "new" for row in rows),
        "withoutContact": sum(not row.get("email") and not row.get("telefono") for row in rows),
    }


@router.post("/clients/imports", status_code=201)
async def create_client_import(file: UploadFile = File(...), user: CurrentUser = Depends(get_current_user)):
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="El archivo debe ser CSV")
    raw = await file.read(MAX_IMPORT_BYTES + 1)
    if len(raw) > MAX_IMPORT_BYTES:
        raise HTTPException(status_code=413, detail="El CSV excede 10 MB")
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="El CSV no tiene encabezados")
    rows = list(reader)
    if len(rows) > MAX_IMPORT_ROWS:
        raise HTTPException(status_code=400, detail=f"El CSV admite hasta {MAX_IMPORT_ROWS} filas")
    headers = list(reader.fieldnames)
    suggested = {
        header: HEADER_ALIASES[_normalize_header(header)]
        for header in headers if _normalize_header(header) in HEADER_ALIASES
    }
    result = get_supabase().table("client_imports").insert({
        "user_id": user.id,
        "filename": file.filename or "clientes.csv",
        "headers": headers,
        "suggested_mapping": suggested,
        "mapping": suggested,
        "raw_rows": rows,
        "preview_rows": rows[:25],
        "updated_at": _now(),
    }).execute()
    return {"import": result.data[0]}


def _mapped_rows(raw_rows: list[dict], mapping: dict[str, str], existing: list[dict]) -> tuple[list[dict], list[str]]:
    by_email = {_normalize_email(row.get("email")): row["id"] for row in existing if row.get("email")}
    by_phone = {_normalize_phone(row.get("telefono")): row["id"] for row in existing if row.get("telefono")}
    preview: list[dict] = []
    errors: list[str] = []
    seen_emails: dict[str, int] = {}
    seen_phones: dict[str, int] = {}
    for index, raw in enumerate(raw_rows, start=2):
        row: dict = {}
        for source, target in mapping.items():
            if target not in ALLOWED_MAPPING_FIELDS:
                continue
            value = str(raw.get(source, "") or "").strip()
            if not value:
                continue
            if target == "tags":
                row[target] = [tag.strip() for tag in re.split(r"[,;|]", value) if tag.strip()]
            elif target == "last_purchase_amount":
                try:
                    row[target] = float(value.replace(",", "."))
                except ValueError:
                    errors.append(f"Fila {index}: monto invalido")
            elif target == "lifecycle_status":
                row[target] = STATUS_ALIASES.get(value.lower(), "new")
            elif target == "ultima_compra":
                parsed = _parse_date(value)
                if parsed:
                    row[target] = parsed
                else:
                    errors.append(f"Fila {index}: fecha invalida")
            else:
                row[target] = value
        if not row.get("nombre"):
            errors.append(f"Fila {index}: falta nombre")
            continue
        email_key = _normalize_email(row.get("email"))
        phone_key = _normalize_phone(row.get("telefono"))
        duplicate_id = by_email.get(email_key) if email_key else None
        duplicate_id = duplicate_id or (by_phone.get(phone_key) if phone_key else None)
        duplicate_row = seen_emails.get(email_key) if email_key else None
        duplicate_row = duplicate_row or (seen_phones.get(phone_key) if phone_key else None)
        row["_line"] = index
        row["_duplicate_id"] = duplicate_id
        row["_duplicate_row"] = duplicate_row
        preview.append(row)
        if email_key and email_key not in seen_emails:
            seen_emails[email_key] = index
        if phone_key and phone_key not in seen_phones:
            seen_phones[phone_key] = index
    return preview, errors


@router.patch("/clients/imports/{import_id}/mapping")
async def map_client_import(import_id: str, request: ClientImportMapping, user: CurrentUser = Depends(get_current_user)):
    invalid = set(request.mapping.values()) - ALLOWED_MAPPING_FIELDS - {""}
    if invalid:
        raise HTTPException(status_code=400, detail="El mapeo contiene campos no permitidos")
    found = get_supabase().table("client_imports").select("*").eq(
        "id", import_id
    ).eq("user_id", user.id).limit(1).execute()
    if not found.data:
        raise HTTPException(status_code=404, detail="Importacion no encontrada")
    current_clients = get_supabase().table("clients").select(
        "id,email,telefono"
    ).eq("user_id", user.id).execute().data or []
    preview, errors = _mapped_rows(found.data[0].get("raw_rows") or [], request.mapping, current_clients)
    updated = get_supabase().table("client_imports").update({
        "mapping": request.mapping,
        "preview_rows": preview,
        "status": "mapped",
        "result": {"errors": errors},
        "updated_at": _now(),
    }).eq("id", import_id).eq("user_id", user.id).execute()
    return {
        "import": updated.data[0],
        "summary": {
            "valid": len(preview),
            "duplicates": sum(bool(row.get("_duplicate_id") or row.get("_duplicate_row")) for row in preview),
            "errors": errors,
        },
    }


@router.post("/clients/imports/{import_id}/confirm")
async def confirm_client_import(import_id: str, request: ConfirmClientImport, user: CurrentUser = Depends(get_current_user)):
    found = get_supabase().table("client_imports").select("*").eq(
        "id", import_id
    ).eq("user_id", user.id).limit(1).execute()
    if not found.data or found.data[0].get("status") != "mapped":
        raise HTTPException(status_code=409, detail="Primero revisa el mapeo de columnas")
    rows = found.data[0].get("preview_rows") or []
    created = updated_count = skipped = 0
    errors: list[str] = []
    created_by_line: dict[int, str] = {}
    for original in rows:
        row = dict(original)
        duplicate_id = row.pop("_duplicate_id", None)
        duplicate_row = row.pop("_duplicate_row", None)
        line = row.pop("_line", None)
        row["updated_at"] = _now()
        try:
            target_id = duplicate_id or created_by_line.get(duplicate_row)
            if duplicate_id or duplicate_row:
                if request.duplicate_strategy == "skip":
                    skipped += 1
                    continue
                if not target_id:
                    skipped += 1
                    continue
                get_supabase().table("clients").update(row).eq("id", target_id).eq("user_id", user.id).execute()
                updated_count += 1
            else:
                row["user_id"] = user.id
                inserted = get_supabase().table("clients").insert(row).execute()
                if line and inserted.data:
                    created_by_line[line] = inserted.data[0]["id"]
                created += 1
        except Exception as exc:
            errors.append(f"Fila {line or '?'}: {str(exc)[:180]}")
    summary = {"created": created, "updated": updated_count, "skipped": skipped, "errors": errors}
    get_supabase().table("client_imports").update({
        "status": "completed", "result": summary, "raw_rows": [], "preview_rows": [], "updated_at": _now()
    }).eq("id", import_id).eq("user_id", user.id).execute()
    return {"success": True, **summary}


@router.get("/clients/segments")
async def list_client_segments(user: CurrentUser = Depends(get_current_user)):
    result = get_supabase().table("client_segments").select("*").eq(
        "user_id", user.id
    ).order("updated_at", desc=True).execute()
    return {"segments": result.data or []}


@router.post("/clients/segments", status_code=201)
async def create_client_segment(request: ClientSegmentInput, user: CurrentUser = Depends(get_current_user)):
    payload = request.model_dump()
    payload.update({"user_id": user.id, "updated_at": _now()})
    result = get_supabase().table("client_segments").insert(payload).execute()
    return {"success": True, "segment": result.data[0]}


@router.get("/clients/segments/{segment_id}/recipients")
async def get_segment_recipients(segment_id: str, user: CurrentUser = Depends(get_current_user)):
    found = get_supabase().table("client_segments").select("*").eq(
        "id", segment_id
    ).eq("user_id", user.id).limit(1).execute()
    if not found.data:
        raise HTTPException(status_code=404, detail="Segmento no encontrado")
    query = get_supabase().table("clients").select("*").eq(
        "user_id", user.id
    ).neq("lifecycle_status", "do_not_contact").eq("contact_consent", True)
    clients = _apply_filters(query, found.data[0].get("filters") or {}).order("nombre").execute().data or []
    return {"segmentId": segment_id, "clientIds": [row["id"] for row in clients], "clients": clients}


@router.get("/clients")
async def list_clients(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    search: str = "",
    status: str | None = None,
    source: str | None = None,
    interest: str | None = None,
    product: str | None = None,
    purchased_after: str | None = None,
    purchased_before: str | None = None,
    sort: str = Query(default="nombre", pattern="^(nombre|created_at|ultima_compra|lifecycle_status)$"),
    direction: str = Query(default="asc", pattern="^(asc|desc)$"),
    user: CurrentUser = Depends(get_current_user),
):
    query = get_supabase().table("clients").select("*", count="exact").eq("user_id", user.id)
    if status and status in STATUS_ALIASES.values():
        query = query.eq("lifecycle_status", status)
    if source:
        query = query.eq("source", source)
    if interest:
        query = query.eq("interest", interest)
    if product:
        query = query.eq("producto", product)
    if purchased_after:
        query = query.gte("ultima_compra", purchased_after)
    if purchased_before:
        query = query.lte("ultima_compra", purchased_before)
    if search.strip():
        safe = re.sub(r"[%(),]", "", search.strip())
        query = query.or_(f"nombre.ilike.%{safe}%,email.ilike.%{safe}%,telefono.ilike.%{safe}%,producto.ilike.%{safe}%")
    start = (page - 1) * page_size
    result = query.order(sort, desc=direction == "desc").range(start, start + page_size - 1).execute()
    return {"clients": result.data or [], "total": result.count or 0, "page": page, "pageSize": page_size}


@router.post("/clients", status_code=201)
async def create_client(request: ClientInput, user: CurrentUser = Depends(get_current_user)):
    payload = _client_payload(request)
    payload["user_id"] = user.id
    result = get_supabase().table("clients").insert(payload).execute()
    return {"success": True, "client": result.data[0]}


@router.patch("/clients/{client_id}")
async def update_client(client_id: str, request: ClientUpdate, user: CurrentUser = Depends(get_current_user)):
    result = get_supabase().table("clients").update(
        _client_payload(request, exclude_unset=True)
    ).eq("id", client_id).eq("user_id", user.id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"success": True, "client": result.data[0]}


@router.delete("/clients/{client_id}")
async def delete_client(client_id: str, user: CurrentUser = Depends(get_current_user)):
    result = get_supabase().table("clients").delete().eq(
        "id", client_id
    ).eq("user_id", user.id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"success": True}
