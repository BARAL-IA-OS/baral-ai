# backend/routers/tasks.py
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from dependencies.auth import CurrentUser, get_current_user
from services.db_service import get_supabase
from services.email_service import send_campaign

router = APIRouter(tags=["Tasks"])


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
async def approve_task(task_id: str, user: CurrentUser = Depends(get_current_user)):
    """Aprueba y ejecuta el envio real de la campana (Resend)."""
    sb = get_supabase()

    # Ownership check: la tarea debe pertenecer al usuario del JWT.
    res = sb.table("tasks").select("*").eq("id", task_id).eq("user_id", user.id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    task = res.data[0]

    if task["status"] != "PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail=f"La tarea no esta pendiente de aprobacion (estado: {task['status']})")

    draft = task.get("draft_content") or {}
    recipients = task.get("recipients") or []

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
