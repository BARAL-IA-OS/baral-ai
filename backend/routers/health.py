from fastapi import APIRouter

from services.db_service import is_configured

router = APIRouter(tags=["System"])


@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "baral-ai-engine",
        "version": "1.0.0",
        "supabase_configured": is_configured(),
    }
