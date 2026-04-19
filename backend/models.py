from typing import List, Optional, Literal

from pydantic import BaseModel


class Wind(BaseModel):
    speed: float


class Rain(BaseModel):
    lastHour: Optional[float]


class WeatherResponse(BaseModel):
    temperature: float
    humidity: int
    wind: Wind
    rain: Rain


RiskLevel = Literal["Low", "Medium", "High"]


class RecommendationResponse(BaseModel):
    analysis: List[str]
    recommendations: List[str]
    risk_level: RiskLevel


ChatIntent = Literal[
    "weather_analysis",
    "disease_detection",
    "map",
    "marketplace",
    "help",
]


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    intent: ChatIntent


class AgronomieRecord(BaseModel):
    id_local: str
    humidite: int
    ndvi: float
    croissance: int
    updated_at: str
    meteo_updated_at: Optional[str]


class AgronomieSync(BaseModel):
    parcelles: List[AgronomieRecord]
    server_time: str
