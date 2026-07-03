# backend/routers/recipes.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from dependencies.auth import CurrentUser, get_current_user
from prompts.orchestrator import RECIPES
from services.agent_pipeline import run_pipeline
from services.db_service import get_supabase
from services.usage_service import log_usage

router = APIRouter(tags=["Recipes"])


class RunRecipeRequest(BaseModel):
    recipe_type: str
    params: dict = {}


@router.post("/recipes/run")
async def run_recipe(request: RunRecipeRequest, user: CurrentUser = Depends(get_current_user)):
    """Ejecuta una receta: filtra clientes, corre el pipeline de IA y crea la tarea."""
    if request.recipe_type not in RECIPES:
        raise HTTPException(status_code=400, detail=f"Receta desconocida: {request.recipe_type}")

    sb = get_supabase()

    # Brand Brain del usuario (contexto obligatorio para la IA)
    brand_res = sb.table("brand_brain").select("*").eq("user_id", user.id).limit(1).execute()
    if not brand_res.data:
        raise HTTPException(status_code=400, detail="Primero completa tu Brand Brain")
    brand = brand_res.data[0]

    # Base de clientes del usuario
    clients_res = sb.table("clients").select("*").eq("user_id", user.id).execute()
    clients = clients_res.data or []

    # Crea la tarea (status inicial)
    created = (
        sb.table("tasks")
        .insert({"user_id": user.id, "recipe_type": request.recipe_type, "status": "PROCESSING", "params": request.params})
        .execute()
    )
    task_id = created.data[0]["id"]

    # Ejecuta el pipeline de 3 agentes
    try:
        result = run_pipeline(request.recipe_type, request.params, brand, clients)
    except Exception as exc:
        sb.table("tasks").update({"status": "FAILED", "error_log": str(exc)}).eq("id", task_id).execute()
        raise HTTPException(status_code=500, detail=f"Error en el pipeline de IA: {exc}") from exc

    # Registra el gasto de generacion del pipeline.
    log_usage(user.id, kind="text", provider=result.get("provider", ""), cost_usd=result["cost_usd"], tokens=result["tokens_used"])

    # Persiste el resultado -> PENDING_APPROVAL (espera aprobacion humana)
    sb.table("tasks").update(
        {
            "status": "PENDING_APPROVAL",
            "draft_content": result["draft_content"],
            "recipients": result["recipients"],
            "tokens_used": result["tokens_used"],
            "cost_usd": result["cost_usd"],
            "agent_score": result["agent_score"],
        }
    ).eq("id", task_id).execute()

    return {
        "success": True,
        "task_id": task_id,
        "status": "PENDING_APPROVAL",
        "draft_content": result["draft_content"],
        "recipients": result["recipients"],
        "tokens_used": result["tokens_used"],
        "cost_usd": result["cost_usd"],
        "agent_score": result["agent_score"],
        "provider": result["provider"],
    }
