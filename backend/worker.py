import logging
from datetime import datetime, timezone

import httpx

from backend.database import get_all_parcelles_coords, upsert_agronomie

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# NDVI simulé — sera remplacé par Sentinel-2 quand la clé sera disponible
def _simulated_ndvi(id_local: str) -> float:
    seed = int(id_local[-4:], 10) if id_local[-4:].isdigit() else 0
    return round(0.2 + (seed % 80) / 100, 2)


def _ndvi_to_croissance(ndvi: float) -> int:
    if ndvi < 0.2:
        return 10
    if ndvi < 0.5:
        return int(15 + (ndvi - 0.2) / 0.3 * 35)
    if ndvi < 0.7:
        return int(50 + (ndvi - 0.5) / 0.2 * 20)
    return int(70 + (ndvi - 0.7) / 0.3 * 30)


async def _fetch_meteo(lat: float, lon: float) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(OPEN_METEO_URL, params={
            "latitude": lat,
            "longitude": lon,
            "daily": "precipitation_sum,et0_fao_evapotranspiration,temperature_2m_max",
            "timezone": "auto",
            "past_days": 1,
            "forecast_days": 1,
        })
        resp.raise_for_status()
        return resp.json()


def _compute_humidite(daily: dict) -> int:
    precip = daily.get("precipitation_sum", [])
    et0    = daily.get("et0_fao_evapotranspiration", [])
    tmax   = daily.get("temperature_2m_max", [])

    # On regarde les dernières 24h (index 0 = hier avec past_days=1)
    rain_24h = precip[0] if precip else 0.0
    et0_24h  = et0[0]    if et0    else 3.0
    temp_max = tmax[0]   if tmax   else 28.0

    if rain_24h > 5:
        humidite = min(100, int(80 + (rain_24h - 5) * 1.5))
    elif rain_24h > 0:
        humidite = int(50 + rain_24h * 6)
    else:
        base = 50
        if temp_max > 35:
            base -= 15
        elif temp_max > 30:
            base -= 8
        humidite = max(10, int(base - et0_24h * 2))

    return humidite


async def run_worker() -> dict:
    parcelles = await get_all_parcelles_coords()

    if not parcelles:
        logger.info("worker: aucune parcelle à traiter.")
        return {"updated": 0, "errors": 0}

    updated = 0
    errors  = 0

    for row in parcelles:
        id_local = row["id_local"]
        lat      = row["lat"]
        lon      = row["lon"]
        try:
            meteo_data = await _fetch_meteo(lat, lon)
            daily      = meteo_data.get("daily", {})
            humidite   = _compute_humidite(daily)
            ndvi       = _simulated_ndvi(id_local)
            croissance = _ndvi_to_croissance(ndvi)

            await upsert_agronomie(
                id_local=id_local,
                lat=lat,
                lon=lon,
                humidite=humidite,
                ndvi=ndvi,
                croissance=croissance,
            )
            updated += 1
            logger.debug("worker: %s → humidite=%d%% ndvi=%.2f", id_local, humidite, ndvi)

        except Exception as exc:
            errors += 1
            logger.warning("worker: erreur pour %s — %s", id_local, exc)

    logger.info("worker terminé : %d mis à jour, %d erreurs", updated, errors)
    return {"updated": updated, "errors": errors}
