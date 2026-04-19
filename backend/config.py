"""
Configuration AgroConnect — variables d'environnement uniquement (pas de secrets en dur).
"""

import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# Charge la racine du repo (même dossier que package.json) pour npm run api / uvicorn.
_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")

# Météo : OpenWeather (optionnel) ; sans clé, le service utilise Open-Meteo en secours.
OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "").strip()
OPENWEATHER_GEOCODING_URL = "http://api.openweathermap.org/geo/1.0/direct"
OPENWEATHER_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

# Agrobot — POST /api/chat : OpenAI si OPENAI_API_KEY, sinon Ollama (même machine que FastAPI en dev).
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
# Délai max (secondes) pour la réponse Ollama — llama3 sur CPU peut dépasser 30 s.
OLLAMA_HTTP_TIMEOUT: float = float(os.getenv("OLLAMA_HTTP_TIMEOUT", "180"))


def _env_bool(name: str, default: bool = True) -> bool:
    v = os.getenv(name, "").strip().lower()
    if not v:
        return default
    if v in ("0", "false", "no", "off"):
        return False
    return v in ("1", "true", "yes", "on")


# Si False : après échec ou absence d’OpenAI, ne pas appeler Ollama (mode « OpenAI uniquement »).
OLLAMA_FALLBACK: bool = _env_bool("OLLAMA_FALLBACK", True)

DEFAULT_LAT = float(os.getenv("DEFAULT_LAT", "5.3599517"))
DEFAULT_LON = float(os.getenv("DEFAULT_LON", "-4.0082563"))

# Défaut = même identifiants que docker-compose.yml (service db).
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql://agro:agro_dev@127.0.0.1:5432/agroconnect",
)

# JWT (obligatoire en prod : définir JWT_SECRET)
JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production-mvp-only")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 jours MVP

# Paiement (stubs — brancher Stripe/PayPal via variables)
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "").strip()
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "").strip()

# OpenAI (priorité sur Ollama si défini) — modèle : OPENAI_CHAT_MODEL
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

# Service ML (Flask + TFLite) — diagnostic image Scan IA
ML_FLASK_URL: str = os.getenv("ML_FLASK_URL", "http://127.0.0.1:5000")


def _parse_origins(raw: str) -> List[str]:
    parts = [x.strip() for x in raw.split(",") if x.strip()]
    return parts


# CORS : Expo dev, Vite, mobile LAN
INSIGHTS_ORIGINS: List[str] = _parse_origins(
    os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081,http://127.0.0.1:8081",
    )
)
