"""
Proxy diagnostic plante — GET /health et POST /predict vers Flask (ml-service, TFLite).
L’app mobile appelle /api/v1/ml/* (voir lib/agroconnectApi.ts).
"""

from __future__ import annotations

from typing import Any

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.config import ML_FLASK_URL

router = APIRouter(prefix="/ml", tags=["ML diagnostic"])


def _base() -> str:
    return ML_FLASK_URL.rstrip("/")


@router.get("/health")
async def ml_health() -> dict[str, Any]:
    """Propage l’état du service Flask (modèle chargé, etc.)."""
    base = _base()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{base}/health")
    except httpx.RequestError as exc:
        return {
            "ml_service": "down",
            "url": base,
            "hint": f"Service Flask injoignable ({base}). Lancez npm run ml (ml-service, port 5000). Détail : {exc!s}",
            "flask": None,
        }

    try:
        data = r.json()
    except Exception:
        data = {"status": "error", "error": r.text[:500] if r.text else None}

    flask_payload: dict[str, Any] = {
        "status": data.get("status"),
        "model_loaded": data.get("model_loaded"),
        "model_path": data.get("model_path"),
        "error": data.get("error"),
    }
    if isinstance(data, dict) and "raw" in data:
        flask_payload["raw"] = data.get("raw")

    if r.status_code >= 400:
        return {
            "ml_service": "error",
            "url": base,
            "http_status": r.status_code,
            "hint": (data.get("error") if isinstance(data, dict) else None)
            or r.text[:300]
            or f"HTTP {r.status_code}",
            "flask": flask_payload,
        }

    # Flask joignable : le bandeau jaune (modèle non chargé) est géré côté app via flask.model_loaded
    return {
        "ml_service": "up",
        "url": base,
        "flask": flask_payload,
    }


@router.post("/predict")
async def ml_predict(file: UploadFile = File(...)) -> Any:
    """Transfère l’image vers Flask POST /predict (multipart field `file`)."""
    base = _base()
    content = await file.read()
    filename = file.filename or "upload.jpg"
    ctype = file.content_type or "image/jpeg"

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                f"{base}/predict",
                files={"file": (filename, content, ctype)},
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Flask ML injoignable ({base}). Lancez npm run ml (dossier ml-service) : {exc!s}",
        ) from exc

    if r.status_code >= 400:
        detail: str
        try:
            j = r.json()
            detail = str(j.get("detail") or j.get("error") or j)
        except Exception:
            detail = r.text[:800] or f"HTTP {r.status_code}"
        raise HTTPException(status_code=r.status_code, detail=detail)

    try:
        return r.json()
    except Exception:
        return {"error": r.text[:500], "status": "error"}
