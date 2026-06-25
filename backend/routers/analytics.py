from fastapi import APIRouter

router = APIRouter(tags=["Analytics"])

@router.get("/analytics/summary")
async def get_analytics_mock(user_id: str):  #
    return {
        "total_campaigns": 12,        #
        "completed_campaigns": 10,    #
        "total_recipients": 342,      #
        "total_cost_usd": 0.0482,     #
        "approval_rate_pct": 91.5,    #
        "by_recipe": {                #
            "reactivacion": {"total": 5, "completed": 5},
            "bienvenida": {"total": 4, "completed": 4},
            "postventa": {"total": 3, "completed": 1}
        }
    }