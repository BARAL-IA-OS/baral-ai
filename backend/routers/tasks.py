from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["Tasks"])

@router.get("/tasks")
async def get_tasks_mock(user_id: str, limit: int = 20):  #
    return {
        "tasks": [
            {
                "id": "mock-task-uuid-001",
                "recipe_type": "reactivacion",
                "status": "COMPLETED",       #
                "recipients": 23,
                "cost_usd": 0.006,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "mock-task-uuid-002",
                "recipe_type": "bienvenida",
                "status": "PENDING_APPROVAL", #
                "recipients": 14,
                "cost_usd": 0.003,
                "created_at": datetime.now().isoformat()
            }
        ][:limit]
    }

@router.post("/tasks/{task_id}/approve")
async def approve_task_mock(task_id: str):
    # Simula el salto instantáneo de PENDING -> EXECUTING -> COMPLETED
    return {
        "success": True,
        "task_id": task_id,
        "status": "COMPLETED",   #
        "emails_sent": 23,       #
        "emails_failed": 0        #
    }