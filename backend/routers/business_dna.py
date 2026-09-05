from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from dependencies.auth import CurrentUser, get_current_user
from models.business_dna import (
    CompleteOnboardingRequest,
    ConfirmExtractionRequest,
    SaveBusinessDNASectionRequest,
    StartExtractionRequest,
)
from services.business_dna_service import (
    complete_onboarding,
    get_business_dna,
    onboarding_progress,
    save_section,
)
from services.db_service import get_supabase
from services.business_extract_service import run_business_extraction
from services.url_security import UnsafeUrlError, normalize_public_url


router = APIRouter(prefix="/business-dna", tags=["Business DNA"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("")
async def read_business_dna(user: CurrentUser = Depends(get_current_user)):
    sources = (
        get_supabase()
        .table("brand_sources")
        .select("*")
        .eq("user_id", user.id)
        .eq("confirmed_by_user", True)
        .order("updated_at", desc=True)
        .execute()
    )
    return {"businessDNA": get_business_dna(user.id), "sources": sources.data or []}


@router.patch("/sections/{section}")
async def update_business_dna_section(
    section: str,
    request: SaveBusinessDNASectionRequest,
    user: CurrentUser = Depends(get_current_user),
):
    try:
        dna = save_section(
            user.id,
            section,
            request.value,
            request.onboarding_step,
            request.onboarding_path,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"success": True, "businessDNA": dna}


@router.post("/extractions", status_code=202)
async def start_extraction(
    request: StartExtractionRequest,
    background_tasks: BackgroundTasks,
    user: CurrentUser = Depends(get_current_user),
):
    try:
        source_url = normalize_public_url(request.url)
    except UnsafeUrlError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    result = get_supabase().table("brand_extraction_jobs").insert({
        "user_id": user.id,
        "source_url": source_url,
        "status": "queued",
        "updated_at": _now(),
    }).execute()
    job = result.data[0]
    current_dna = get_business_dna(user.id)
    saved_dna = save_section(
        user.id,
        "identity",
        current_dna["sections"]["identity"] if current_dna else {},
        onboarding_step=0,
        onboarding_path="url",
    )
    get_supabase().table("brand_brain").update({
        "onboarding_state": {"extractionJobId": job["id"]},
        "updated_at": _now(),
    }).eq("id", saved_dna["id"]).eq("user_id", user.id).execute()
    background_tasks.add_task(run_business_extraction, job["id"], user.id, source_url)
    return {"job": job}


@router.get("/extractions/{job_id}")
async def read_extraction(job_id: str, user: CurrentUser = Depends(get_current_user)):
    result = (
        get_supabase()
        .table("brand_extraction_jobs")
        .select("*")
        .eq("id", job_id)
        .eq("user_id", user.id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Analisis no encontrado")
    return {"job": result.data[0]}


@router.post("/extractions/{job_id}/confirm")
async def confirm_extraction(
    job_id: str,
    request: ConfirmExtractionRequest,
    user: CurrentUser = Depends(get_current_user),
):
    job_result = (
        get_supabase()
        .table("brand_extraction_jobs")
        .select("id,status")
        .eq("id", job_id)
        .eq("user_id", user.id)
        .limit(1)
        .execute()
    )
    if not job_result.data or job_result.data[0]["status"] != "completed":
        raise HTTPException(status_code=409, detail="El analisis aun no esta listo")

    dna = None
    for section, value in request.sections.items():
        dna = save_section(user.id, section, value, onboarding_step=10, onboarding_path="url")
    for raw_item in request.catalog_items:
        name = str(raw_item.get("name", "")).strip()
        kind = raw_item.get("kind")
        if not name or kind not in {"product", "service"}:
            continue
        payload = {
            "user_id": user.id,
            "kind": kind,
            "name": name,
            "description": raw_item.get("description"),
            "price": raw_item.get("price") or None,
            "currency": raw_item.get("currency") or "BOB",
            "source_url": raw_item.get("source_url"),
            "updated_at": _now(),
        }
        get_supabase().table("catalog_items").insert(payload).execute()
    if request.source_ids:
        (
            get_supabase()
            .table("brand_sources")
            .update({"confirmed_by_user": True, "updated_at": _now()})
            .eq("user_id", user.id)
            .in_("id", request.source_ids)
            .execute()
        )
    latest_dna = get_business_dna(user.id)
    if latest_dna:
        get_supabase().table("brand_brain").update({"onboarding_state": {}}).eq(
            "id", latest_dna["id"]
        ).eq("user_id", user.id).execute()
    return {"success": True, "businessDNA": dna}


@router.get("/onboarding")
async def read_onboarding_progress(user: CurrentUser = Depends(get_current_user)):
    return onboarding_progress(user.id)


@router.post("/onboarding/complete")
async def finish_onboarding(
    request: CompleteOnboardingRequest,
    user: CurrentUser = Depends(get_current_user),
):
    try:
        dna = complete_onboarding(user.id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    if request.confirmed_source_ids:
        (
            get_supabase()
            .table("brand_sources")
            .update({"confirmed_by_user": True})
            .eq("user_id", user.id)
            .in_("id", request.confirmed_source_ids)
            .execute()
        )
    return {"success": True, "businessDNA": dna}
