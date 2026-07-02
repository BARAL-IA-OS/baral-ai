# backend/routers/tasks.py
from fastapi import APIRouter, Depends

from dependencies.auth import CurrentUser, get_current_user
from services.db_service import get_supabase

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


@router.post("/tasks/{task_id}/approve")
async def approve_task_mock(task_id: str):
    # TODO (Prioridad 4): ejecucion real con Resend + ownership check.
    return {
        "success": True,
        "task_id": task_id,
        "status": "COMPLETED",
        "emails_sent": 23,
        "emails_failed": 0,
    }
