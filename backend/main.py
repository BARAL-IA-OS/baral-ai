# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import config
from routers import (
    analytics,
    assets,
    audits,
    auth,
    brand,
    business_dna,
    catalog,
    clients,
    content,
    creative,
    health,
    onboarding,
    recipes,
    strategies,
    tasks,
    usage,
)

cors_origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://baral-ai.vercel.app",
    config.FRONTEND_URL,
}

app = FastAPI(
 title="Baral AI — API",
 description="Motor de ejecución de acciones de negocio con IA",
 version="1.0.0"
)
app.add_middleware(
 CORSMiddleware,
 allow_origins=sorted(cors_origins),
 allow_credentials=True,
 allow_methods=["*"],
 allow_headers=["*"],
)
app.include_router(health.router)
app.include_router(auth.router, prefix="/api")
app.include_router(onboarding.router, prefix="/api/onboarding")
app.include_router(recipes.router, prefix="/api")
app.include_router(content.router, prefix="/api")
app.include_router(brand.router, prefix="/api")
app.include_router(business_dna.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(assets.router, prefix="/api")
app.include_router(usage.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(strategies.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(creative.router, prefix="/api")
app.include_router(audits.router, prefix="/api")
