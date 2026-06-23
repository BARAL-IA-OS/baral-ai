# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import health, onboarding, recipes, tasks, analytics
app = FastAPI(
 title="Baral AI — API",
 description="Motor de ejecución de acciones de negocio con IA",
 version="1.0.0"
)
app.add_middleware(
 CORSMiddleware,
 allow_origins=["http://localhost:5173", "https://*.vercel.app"],
 allow_credentials=True,
 allow_methods=["*"],
 allow_headers=["*"],
)
app.include_router(health.router)
app.include_router(onboarding.router, prefix="/api/onboarding")
app.include_router(recipes.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")