# backend/routers/tasks.py
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from dependencies.auth import CurrentUser, get_current_user
from services.db_service import get_supabase
from services.email_service import send_campaign

router = APIRouter(tags=["Tasks"])


class DraftContentIn(BaseModel):
    asunto: str = ""
    saludo: str = ""
    cuerpo: str = ""
    cta: str = ""


class ApproveRequest(BaseModel):
    # Draft editado por el usuario en el Preview (Human Gate). Opcional:
    # si viene, se persiste y se usa para el envio; si no, se usa el guardado.
    draft_content: DraftContentIn | None = None


class RegenerateRequest(BaseModel):
    field: str
    current_draft: DraftContentIn



@router.get("/tasks")
async def get_tasks(limit: int = 20, user: CurrentUser = Depends(get_current_user)):
    """Lista las tareas/campanas del usuario autenticado (filtrado por user_id del JWT)."""
    res = (
        get_supabase()
        .table("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"tasks": res.data or []}


@router.get("/tasks/{task_id}")
async def get_task_detail(task_id: str, user: CurrentUser = Depends(get_current_user)):
    """Obtiene los detalles de una tarea/campana especifica del usuario."""
    res = (
        get_supabase()
        .table("tasks")
        .select("*")
        .eq("id", task_id)
        .eq("user_id", user.id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return res.data[0]


@router.post("/tasks/{task_id}/approve")
async def approve_task(
    task_id: str,
    body: ApproveRequest | None = None,
    user: CurrentUser = Depends(get_current_user),
):
    """Aprueba y ejecuta el envio real de la campana (Resend).

    Si el body trae `draft_content` (editado en el Preview), se persiste y se
    usa para el envio; si no, se envia el draft guardado.
    """
    sb = get_supabase()

    # Ownership check: la tarea debe pertenecer al usuario del JWT.
    res = sb.table("tasks").select("*").eq("id", task_id).eq("user_id", user.id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    task = res.data[0]

    if task["status"] != "PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail=f"La tarea no esta pendiente de aprobacion (estado: {task['status']})")

    recipients = task.get("recipients") or []

    # Draft editado por el usuario (Human Gate): persistir y usar.
    draft = task.get("draft_content") or {}
    if body and body.draft_content is not None:
        draft = body.draft_content.model_dump()
        sb.table("tasks").update({"draft_content": draft}).eq("id", task_id).execute()

    # APPROVED -> EXECUTING
    sb.table("tasks").update({"status": "EXECUTING"}).eq("id", task_id).execute()

    try:
        report = send_campaign(draft, recipients)
    except Exception as exc:
        sb.table("tasks").update({"status": "FAILED", "error_log": str(exc)}).eq("id", task_id).execute()
        raise HTTPException(status_code=500, detail=f"Error al enviar: {exc}") from exc

    # COMPLETED salvo que TODO haya fallado.
    all_failed = report.sent == 0 and report.failed > 0
    status = "FAILED" if all_failed else "COMPLETED"
    sb.table("tasks").update(
        {
            "status": status,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "error_log": "; ".join(report.errors) if report.errors else None,
        }
    ).eq("id", task_id).execute()

    return {
        "success": not all_failed,
        "task_id": task_id,
        "status": status,
        "emails_sent": report.sent,
        "emails_failed": report.failed,
        "provider": report.provider,
        "errors": report.errors,
    }


@router.post("/tasks/{task_id}/regenerate")
async def regenerate_task_field(
    task_id: str,
    req: RegenerateRequest,
    user: CurrentUser = Depends(get_current_user)
):
    """Regenera un campo especifico del email con IA sin perder las otras modificaciones."""
    if req.field not in ("asunto", "saludo", "cuerpo", "cta"):
        raise HTTPException(status_code=400, detail=f"Campo invalido para regenerar: {req.field}")

    sb = get_supabase()

    # Buscar la tarea original del usuario
    res = sb.table("tasks").select("*").eq("id", task_id).eq("user_id", user.id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    task = res.data[0]

    if task["status"] not in ("PENDING_APPROVAL", "FAILED"):
        raise HTTPException(status_code=400, detail="Solo se pueden regenerar tareas pendientes de aprobacion")

    # Brand Brain del usuario
    brand_res = sb.table("brand_brain").select("*").eq("user_id", user.id).limit(1).execute()
    if not brand_res.data:
        raise HTTPException(status_code=400, detail="Brand Brain no configurado")
    brand = brand_res.data[0]

    # Base de clientes del usuario
    clients_res = sb.table("clients").select("*").eq("user_id", user.id).execute()
    clients = clients_res.data or []

    # Correr el pipeline para obtener una nueva sugerencia
    try:
        from services.agent_pipeline import run_pipeline
        result = run_pipeline(task["recipe_type"], task["params"], brand, clients)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error en el pipeline de IA al regenerar: {exc}")

    # Reemplazar solo el campo solicitado en el borrador provisto por el usuario
    new_draft = {
        "asunto": req.current_draft.asunto,
        "saludo": req.current_draft.saludo,
        "cuerpo": req.current_draft.cuerpo,
        "cta": req.current_draft.cta
    }
    new_draft[req.field] = result["draft_content"].get(req.field, "")

    # Sumar costo y tokens acumulados
    new_cost = round(float(task.get("cost_usd") or 0) + float(result.get("cost_usd") or 0), 6)
    new_tokens = int(task.get("tokens_used") or 0) + int(result.get("tokens_used") or 0)

    # Actualizar la tarea en Supabase
    sb.table("tasks").update({
        "draft_content": new_draft,
        "cost_usd": new_cost,
        "tokens_used": new_tokens,
        "agent_score": result["agent_score"]
    }).eq("id", task_id).execute()

    return {
        "success": True,
        "task_id": task_id,
        "draft_content": new_draft,
        "cost_usd": new_cost,
        "agent_score": result["agent_score"]
    }

