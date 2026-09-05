"""API de auditorias web ejecutadas por el motor Baral Audit integrado."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

import config
from dependencies.auth import CurrentUser, get_current_user
from services.audit_engine import run_internal_audit, validate_public_url
from services.db_service import get_supabase
from services.rate_limit import enforce_rate_limit

router = APIRouter(tags=["Website audit"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class ConsentRequest(BaseModel):
    url: str
    accepted: bool


class RunAuditRequest(BaseModel):
    consent_id: str
    idempotency_key: str | None = None


@router.post("/audits/consent")
async def authorize_website_audit(
    request: ConsentRequest, user: CurrentUser = Depends(get_current_user)
):
    if not request.accepted:
        raise HTTPException(status_code=400, detail="Debes autorizar expresamente la auditoria")
    url, domain = validate_public_url(request.url)
    row = {
        "id": str(uuid4()), "user_id": user.id, "url": url, "domain": domain,
        "consent_version": config.AUDIT_CONSENT_VERSION, "authorized_at": _now(),
    }
    try:
        result = get_supabase().table("website_audit_consents").insert(row).execute()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Inicializa las tablas de Auditoria: " + str(exc)) from exc
    return {"success": True, "consent": result.data[0] if result.data else row}


@router.post("/audits/run")
async def run_website_audit(
    request: RunAuditRequest, user: CurrentUser = Depends(get_current_user)
):
    consents = (
        get_supabase().table("website_audit_consents").select("*")
        .eq("id", request.consent_id).eq("user_id", user.id).limit(1).execute()
    )
    if not consents.data:
        raise HTTPException(status_code=404, detail="Autorizacion no encontrada")
    consent = consents.data[0]
    enforce_rate_limit(user.id, "auditorias web", 3, 600)
    # Se valida nuevamente justo antes de que el motor interno visite el sitio.
    url, domain = validate_public_url(consent["url"])
    if request.idempotency_key:
        existing = (
            get_supabase().table("website_audit_runs").select("*")
            .eq("user_id", user.id).eq("idempotency_key", request.idempotency_key).limit(1).execute()
        )
        if existing.data and existing.data[0].get("status") == "COMPLETED":
            return {"success": True, "audit": existing.data[0]}
    run = {
        "id": str(uuid4()), "user_id": user.id, "consent_id": consent["id"],
        "url": url, "domain": domain, "status": "PROCESSING", "progress": 5,
        "idempotency_key": request.idempotency_key, "created_at": _now(),
    }
    inserted = get_supabase().table("website_audit_runs").insert(run).execute()
    run = inserted.data[0] if inserted.data else run
    try:
        audit_result = await run_internal_audit(url)
        update = {"status": "COMPLETED", "progress": 100, "result": audit_result, "completed_at": _now()}
    except HTTPException as exc:
        update = {"status": "FAILED", "error": str(exc.detail), "completed_at": _now()}
        get_supabase().table("website_audit_runs").update(update).eq("id", run["id"]).eq("user_id", user.id).execute()
        raise
    except Exception as exc:
        update = {"status": "FAILED", "error": str(exc), "completed_at": _now()}
        get_supabase().table("website_audit_runs").update(update).eq("id", run["id"]).eq("user_id", user.id).execute()
        raise HTTPException(
            status_code=502,
            detail="El motor interno de auditoria no pudo completar el analisis. Intenta nuevamente.",
        ) from exc
    saved = (
        get_supabase().table("website_audit_runs").update(update)
        .eq("id", run["id"]).eq("user_id", user.id).execute()
    )
    return {"success": True, "audit": saved.data[0]}


@router.get("/audits")
async def list_website_audits(user: CurrentUser = Depends(get_current_user)):
    result = (
        get_supabase().table("website_audit_runs").select("*")
        .eq("user_id", user.id).order("created_at", desc=True).execute()
    )
    return {"audits": result.data or []}


@router.get("/audits/{audit_id}")
async def get_website_audit(audit_id: str, user: CurrentUser = Depends(get_current_user)):
    result = (
        get_supabase().table("website_audit_runs").select("*")
        .eq("id", audit_id).eq("user_id", user.id).limit(1).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Auditoria no encontrada")
    return {"audit": result.data[0]}
