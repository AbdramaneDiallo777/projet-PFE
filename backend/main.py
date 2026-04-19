"""
AgroConnect Africa — API MVP (FastAPI + PostgreSQL + JWT).

Préfixe unique : `/api/*`
"""

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import INSIGHTS_ORIGINS
from backend.database import close_pool, init_db
from backend.routers import auth, core, dashboard, logistics, marketplace, ml, parcelles, payments
from backend.scheduler import start_scheduler, stop_scheduler

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AgroConnect Africa API",
    version="3.0.0-mvp",
    description=(
        "MVP : parcelles & agronomie, météo/recommandations, assistant IA, "
        "auth JWT, marketplace B2B, paiements (stub), transport, stats dashboard."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=INSIGHTS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    try:
        await init_db()
    except Exception as exc:
        logger.warning(
            "init_db échoué (PostgreSQL absent ?). Parcelles/auth peuvent échouer ; "
            "les routes /api/v1/ml/* restent utilisables si ML_FLASK_URL répond. Détail : %s",
            exc,
        )
    start_scheduler()


@app.on_event("shutdown")
async def shutdown() -> None:
    stop_scheduler()
    await close_pool()


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok", "service": "agroconnect-api"}


_UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_UPLOADS_DIR)), name="uploads")

app.include_router(core.router, prefix="/api")
app.include_router(parcelles.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(marketplace.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(logistics.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(ml.router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
