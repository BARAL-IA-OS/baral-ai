from datetime import datetime, timezone
from typing import Any

from services.db_service import get_supabase


SECTION_COLUMNS = {
    "identity",
    "positioning",
    "audience_profile",
    "communication",
    "visual_identity",
    "operations",
    "social_proof",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _latest_row(user_id: str) -> dict[str, Any] | None:
    result = (
        get_supabase()
        .table("brand_brain")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def _legacy_sections(row: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        "identity": {
            "name": row.get("business_name") or "",
            "industry": row.get("industria") or "",
            "websiteUrl": row.get("website_url") or "",
            "description": "",
        },
        "positioning": {
            "valueProposition": row.get("propuesta") or "",
            "differentiators": row.get("diferenciador") or "",
        },
        "audience_profile": {"targetAudience": row.get("audiencia") or ""},
        "communication": {
            "tone": row.get("tono") or "",
            "forbiddenWords": row.get("prohibiciones") or "",
        },
        "visual_identity": {},
        "operations": {},
        "social_proof": {},
    }


def serialize_business_dna(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    legacy = _legacy_sections(row)
    sections = {
        section: {**legacy[section], **(row.get(section) or {})}
        for section in SECTION_COLUMNS
    }
    return {
        "id": row.get("id"),
        "sections": sections,
        "onboardingStep": row.get("onboarding_step") or 0,
        "onboardingPath": row.get("onboarding_path"),
        "activeExtractionJobId": (row.get("onboarding_state") or {}).get("extractionJobId"),
        "onboardingCompletedAt": row.get("onboarding_completed_at"),
        "completionPercentage": row.get("completion_percentage") or 0,
        "updatedAt": row.get("updated_at"),
    }


def get_business_dna(user_id: str) -> dict[str, Any] | None:
    return serialize_business_dna(_latest_row(user_id))


def _legacy_updates(section: str, value: dict[str, Any]) -> dict[str, Any]:
    if section == "identity":
        return {
            "business_name": value.get("name", ""),
            "industria": value.get("industry", ""),
            "website_url": value.get("websiteUrl") or None,
        }
    if section == "positioning":
        return {
            "propuesta": value.get("valueProposition", ""),
            "diferenciador": value.get("differentiators", ""),
        }
    if section == "audience_profile":
        return {"audiencia": value.get("targetAudience", "")}
    if section == "communication":
        return {
            "tono": value.get("tone", ""),
            "prohibiciones": value.get("forbiddenWords", ""),
        }
    return {}


def _sync_operations(user_id: str, value: dict[str, Any]) -> None:
    phones = value.get("phones") if isinstance(value.get("phones"), list) else []
    emails = value.get("emails") if isinstance(value.get("emails"), list) else []
    location_payload = {
        "address": value.get("address") or None,
        "city": value.get("city") or None,
        "country": value.get("country") or None,
        "phone": phones[0] if phones else None,
        "whatsapp": value.get("whatsapp") or None,
        "email": emails[0] if emails else None,
        "opening_hours": {"text": value.get("openingHours", "")},
        "is_primary": True,
        "updated_at": _now(),
    }
    existing_location = (
        get_supabase().table("business_locations").select("id")
        .eq("user_id", user_id).eq("is_primary", True).limit(1).execute()
    )
    if existing_location.data:
        get_supabase().table("business_locations").update(location_payload).eq(
            "id", existing_location.data[0]["id"]
        ).eq("user_id", user_id).execute()
    else:
        get_supabase().table("business_locations").insert({
            **location_payload, "user_id": user_id, "name": "Principal",
        }).execute()

    social_links = value.get("socialLinks") if isinstance(value.get("socialLinks"), list) else []
    get_supabase().table("social_links").delete().eq("user_id", user_id).execute()
    rows = [
        {
            "user_id": user_id,
            "network": str(link.get("network") or "other")[:40],
            "url": str(link.get("url") or "").strip(),
            "handle": link.get("handle"),
            "updated_at": _now(),
        }
        for link in social_links
        if isinstance(link, dict) and str(link.get("url") or "").strip()
    ]
    if rows:
        get_supabase().table("social_links").insert(rows).execute()


def _completion(row: dict[str, Any]) -> int:
    dna = serialize_business_dna(row)
    if not dna:
        return 0
    sections = dna["sections"]
    checks = [
        bool(sections["identity"].get("name")),
        bool(sections["identity"].get("industry") or sections["identity"].get("description")),
        bool(sections["positioning"].get("valueProposition")),
        bool(sections["audience_profile"].get("targetAudience")),
        bool(sections["communication"].get("tone")),
        bool(sections["visual_identity"]),
        bool(sections["operations"]),
        bool(sections["social_proof"]),
    ]
    return round(sum(checks) / len(checks) * 100)


def save_section(
    user_id: str,
    section: str,
    value: dict[str, Any],
    onboarding_step: int | None = None,
    onboarding_path: str | None = None,
) -> dict[str, Any]:
    if section not in SECTION_COLUMNS:
        raise ValueError("Seccion de ADN desconocida")

    current = _latest_row(user_id)
    payload: dict[str, Any] = {
        section: value,
        "updated_at": _now(),
        **_legacy_updates(section, value),
    }
    if onboarding_step is not None:
        payload["onboarding_step"] = onboarding_step
    if onboarding_path is not None:
        payload["onboarding_path"] = onboarding_path

    if current:
        merged = {**current, **payload}
        payload["completion_percentage"] = _completion(merged)
        response = (
            get_supabase()
            .table("brand_brain")
            .update(payload)
            .eq("id", current["id"])
            .eq("user_id", user_id)
            .execute()
        )
    else:
        row = {
            "user_id": user_id,
            "industria": "",
            "propuesta": "",
            "tono": "",
            "audiencia": "",
            "diferenciador": "",
            "prohibiciones": "",
            **payload,
        }
        row["completion_percentage"] = _completion(row)
        response = get_supabase().table("brand_brain").insert(row).execute()

    if section == "operations":
        _sync_operations(user_id, value)

    return serialize_business_dna(response.data[0]) or {}


def onboarding_progress(user_id: str) -> dict[str, Any]:
    dna = get_business_dna(user_id)
    if not dna:
        return {
            "exists": False,
            "completed": False,
            "currentStep": 0,
            "path": None,
            "completionPercentage": 0,
            "businessDNA": None,
        }
    return {
        "exists": True,
        "completed": bool(dna["onboardingCompletedAt"]),
        "currentStep": dna["onboardingStep"],
        "path": dna["onboardingPath"],
        "activeExtractionJobId": dna["activeExtractionJobId"],
        "completionPercentage": dna["completionPercentage"],
        "businessDNA": dna,
    }


def complete_onboarding(user_id: str) -> dict[str, Any]:
    current = _latest_row(user_id)
    if not current:
        raise ValueError("Aun no existe informacion del negocio")
    dna = serialize_business_dna(current)
    assert dna is not None
    sections = dna["sections"]
    missing: list[str] = []
    if not sections["identity"].get("name"):
        missing.append("nombre del negocio")
    if not (sections["identity"].get("industry") or sections["identity"].get("description")):
        missing.append("industria o descripcion")
    if not sections["positioning"].get("valueProposition"):
        missing.append("propuesta de valor")
    if not sections["audience_profile"].get("targetAudience"):
        missing.append("audiencia")
    if not sections["communication"].get("tone"):
        missing.append("tono de comunicacion")

    catalog = (
        get_supabase()
        .table("catalog_items")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not catalog.data:
        missing.append("al menos un producto o servicio")
    if missing:
        raise ValueError("Completa: " + ", ".join(missing))

    completed_at = _now()
    response = (
        get_supabase()
        .table("brand_brain")
        .update({
            "onboarding_completed_at": completed_at,
            "onboarding_step": 11,
            "completion_percentage": 100,
            "updated_at": completed_at,
        })
        .eq("id", current["id"])
        .eq("user_id", user_id)
        .execute()
    )
    return serialize_business_dna(response.data[0]) or {}
