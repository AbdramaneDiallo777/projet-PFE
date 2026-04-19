from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from backend.database import get_agronomie_since, get_all_agronomie
from backend.models import (
    AgronomieRecord,
    AgronomieSync,
    ChatRequest,
    ChatResponse,
    RecommendationResponse,
    WeatherResponse,
)
from backend.services.chat_service import call_ollama_for_chat
from backend.services.recommendation_service import generate_recommendations
from backend.services.weather_service import fetch_weather_from_openweather
from backend.worker import run_worker

router = APIRouter(tags=["Météo & IA"])


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(
    lat: float | None = Query(default=None),
    lon: float | None = Query(default=None),
) -> WeatherResponse:
    try:
        return await fetch_weather_from_openweather(lat=lat, lon=lon)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    lat: float | None = Query(default=None),
    lon: float | None = Query(default=None),
) -> RecommendationResponse:
    try:
        weather = await fetch_weather_from_openweather(lat=lat, lon=lon)
        return await generate_recommendations(weather)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(payload: ChatRequest) -> ChatResponse:
    try:
        return await call_ollama_for_chat(payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/chat/info")
def chat_engine_info() -> dict[str, str]:
    """Moteur IA réellement utilisé par POST /api/chat (pour affichage dans l’app)."""
    from backend.config import OPENAI_API_KEY, OPENAI_CHAT_MODEL, OLLAMA_MODEL

    if OPENAI_API_KEY:
        return {"provider": "openai", "model": OPENAI_CHAT_MODEL}
    return {"provider": "ollama", "model": OLLAMA_MODEL}


@router.get("/agronomie/sync", response_model=AgronomieSync)
async def agronomie_sync(
    since: Optional[str] = Query(
        default=None,
        description="ISO 8601 — parcelles modifiées après cette date.",
    ),
) -> AgronomieSync:
    try:
        if since:
            dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
            rows = await get_agronomie_since(dt)
        else:
            rows = await get_all_agronomie()

        records = [
            AgronomieRecord(
                id_local=r["id_local"],
                humidite=r["humidite"],
                ndvi=r["ndvi"],
                croissance=r["croissance"],
                updated_at=r["updated_at"].isoformat(),
                meteo_updated_at=r["meteo_updated_at"].isoformat() if r["meteo_updated_at"] else None,
            )
            for r in rows
        ]
        return AgronomieSync(
            parcelles=records,
            server_time=datetime.now(timezone.utc).isoformat(),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/agronomie/refresh")
async def agronomie_refresh() -> dict:
    try:
        result = await run_worker()
        return {"status": "ok", **result}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
