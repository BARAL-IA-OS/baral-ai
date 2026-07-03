# backend/routers/strategies.py
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from dependencies.auth import CurrentUser, get_current_user
from services.db_service import get_supabase

router = APIRouter(tags=["Strategies"])

class CreateStrategyRequest(BaseModel):
    name: str
    task_id: str

@router.get("/strategies")
async def get_strategies(user: CurrentUser = Depends(get_current_user)):
    """Lista las estrategias guardadas del usuario autenticado."""
    sb = get_supabase()
    try:
        res = sb.table("saved_strategies").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return {"strategies": res.data or []}
    except Exception as exc:
        exc_str = str(exc)
        if "PGRST205" in exc_str or "Could not find the table" in exc_str:
            # Fallback seguro si no se ha ejecutado el script SQL de saved_strategies en Supabase
            print("WARNING: La tabla 'saved_strategies' no existe en Supabase. Retornando lista vacía.")
            return {"strategies": []}
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {exc}")

@router.post("/strategies")
async def create_strategy(req: CreateStrategyRequest, user: CurrentUser = Depends(get_current_user)):
    """Guarda una nueva estrategia a partir de una campaña completada/existente."""
    sb = get_supabase()

    # 1. Obtener la campaña (task) para extraer recipe_type y params
    try:
        task_res = sb.table("tasks").select("*").eq("id", req.task_id).eq("user_id", user.id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al buscar campaña de referencia: {exc}")

    if not task_res.data:
        raise HTTPException(status_code=404, detail="Campaña de referencia no encontrada")
    task = task_res.data[0]

    # 2. Insertar en saved_strategies
    payload = {
        "user_id": user.id,
        "name": req.name,
        "recipe_type": task["recipe_type"],
        "params": task["params"] or {},
        "times_used": 1,
        "last_used_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        res = sb.table("saved_strategies").insert(payload).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Error al guardar la estrategia")
        return {"success": True, "strategy": res.data[0]}
    except Exception as exc:
        exc_str = str(exc)
        if "PGRST205" in exc_str or "Could not find the table" in exc_str:
            raise HTTPException(
                status_code=400,
                detail="La tabla 'saved_strategies' no existe en Supabase. Por favor ejecuta el script de migración SQL en Supabase para habilitar esta funcionalidad."
            )
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {exc}")

@router.delete("/strategies/{id}")
async def delete_strategy(id: str, user: CurrentUser = Depends(get_current_user)):
    """Elimina una estrategia del usuario autenticado."""
    sb = get_supabase()
    
    try:
        # Verificar ownership
        check_res = sb.table("saved_strategies").select("*").eq("id", id).eq("user_id", user.id).limit(1).execute()
        if not check_res.data:
            raise HTTPException(status_code=404, detail="Estrategia no encontrada")
            
        sb.table("saved_strategies").delete().eq("id", id).execute()
        return {"success": True}
    except Exception as exc:
        exc_str = str(exc)
        if "PGRST205" in exc_str or "Could not find the table" in exc_str:
            raise HTTPException(
                status_code=400,
                detail="La tabla 'saved_strategies' no existe en Supabase."
            )
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {exc}")

