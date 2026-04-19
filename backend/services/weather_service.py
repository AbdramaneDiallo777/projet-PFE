from typing import Optional

import httpx

from backend.config import (
    DEFAULT_LAT,
    DEFAULT_LON,
    OPENWEATHER_API_KEY,
    OPENWEATHER_WEATHER_URL,
)
from backend.models import WeatherResponse, Wind, Rain


async def _fetch_open_meteo_current(lat: float, lon: float) -> WeatherResponse:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation",
        "timezone": "auto",
    }
    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
    cur = data.get("current") or {}
    temp = float(cur.get("temperature_2m") or 20.0)
    rh = int(cur.get("relative_humidity_2m") or 50)
    wind = float(cur.get("wind_speed_10m") or 0.0)
    precip = cur.get("precipitation")
    rain_last = float(precip) if precip is not None else None
    return WeatherResponse(
        temperature=temp,
        humidity=rh,
        wind=Wind(speed=wind),
        rain=Rain(lastHour=rain_last),
    )


async def fetch_weather_from_openweather(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
) -> WeatherResponse:
    latitude = lat if lat is not None else DEFAULT_LAT
    longitude = lon if lon is not None else DEFAULT_LON

    if not OPENWEATHER_API_KEY:
        return await _fetch_open_meteo_current(latitude, longitude)

    params = {
        "lat": latitude,
        "lon": longitude,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(OPENWEATHER_WEATHER_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    temperature = float(data["main"]["temp"])
    humidity = int(data["main"]["humidity"])
    wind_speed = float(data.get("wind", {}).get("speed", 0.0))

    rain_data = data.get("rain", {})
    last_hour = rain_data.get("1h")
    last_hour_value: Optional[float] = float(last_hour) if last_hour is not None else None

    return WeatherResponse(
        temperature=temperature,
        humidity=humidity,
        wind=Wind(speed=wind_speed),
        rain=Rain(lastHour=last_hour_value),
    )
