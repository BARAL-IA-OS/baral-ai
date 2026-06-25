import uuid
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Recipes"])

class RunRecipeRequest(BaseModel):
    user_id: str       #
    recipe_type: str   #
    params: dict       #

@router.post("/recipes/run")
async def run_recipe_mock(request: RunRecipeRequest):
    fake_task_id = str(uuid.uuid4())
    
    # Estructura de respuesta exacta requerida por el contrato del Día 2
    return {
        "success": True,
        "task_id": fake_task_id,
        "status": "PENDING_APPROVAL",
        "draft_content": {
            "asunto": f"[{request.recipe_type.upper()}] María, te extrañamos por el estudio",
            "saludo": "Hola María,",
            "cuerpo": "Han pasado 45 días desde tu última sesión de fotos con nosotros. Hemos diseñado un espacio reservado especialmente para ti este mes.",
            "cta": "Reclamar mi beneficio de regreso"
        },
        "recipients": [
            {"nombre": "María García", "email": "maria@ejemplo.com"},
            {"nombre": "Carlos Mendoza", "email": "carlos@ejemplo.com"}
        ],
        "tokens_used": 1140,
        "cost_usd": 0.000171,
        "agent_score": 8.5
    }