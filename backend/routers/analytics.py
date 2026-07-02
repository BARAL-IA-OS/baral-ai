# backend/routers/analytics.py
from fastapi import APIRouter, Depends

from dependencies.auth import CurrentUser, get_current_user
from services.db_service import get_supabase

router = APIRouter(tags=["Analytics"])


@router.get("/analytics/summary")
async def get_analytics_summary(user: CurrentUser = Depends(get_current_user)):
    """KPIs agregados de las tareas del usuario. Contrato: AnalyticsSummary."""
    res = (
        get_supabase()
        .table("tasks")
        .select("status,cost_usd,agent_score")
        .eq("user_id", user.id)
        .execute()
    )
    tasks = res.data or []

    total = len(tasks)
    completed = sum(1 for t in tasks if t.get("status") == "COMPLETED")
    total_cost = round(sum(float(t.get("cost_usd") or 0) for t in tasks), 6)
    scores = [float(t["agent_score"]) for t in tasks if t.get("agent_score") is not None]
    avg_score = round(sum(scores) / len(scores), 2) if scores else 0

    return {
        "total_tasks": total,
        "completed_tasks": completed,
        "total_cost_usd": total_cost,
        "average_agent_score": avg_score,
    }
