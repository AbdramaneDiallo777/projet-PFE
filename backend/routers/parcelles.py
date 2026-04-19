from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.database import (
    get_parcelles_last_updated_ms,
    list_all_parcelles_for_sync,
    list_parcelles_for_owner,
    upsert_parcelle_row,
)
from backend.dependencies import get_current_user, get_current_user_optional

router = APIRouter(prefix="/parcelles", tags=["Parcelles"])


class ParcellePayload(BaseModel):
    id_local: str
    nom: str = ""
    points: str = "[]"
    surface: str = ""
    humidite: str = "40"
    croissance: str = "50"
    qualite_sol: str = ""
    statut_occupation: str = "libre"
    statut_location: str = "a_louer"
    lieu: str = "Non défini"
    culture: str = ""
    proprietaire_nom: str = "Inconnu"
    proprietaire_tel: str = ""
    # URLs d'images (JSON liste de chemins /uploads/...) — synchro app mobile.
    photos_urls: str = "[]"


class BulkParcellesBody(BaseModel):
    parcelles: list[ParcellePayload] = Field(default_factory=list)


class SyncResponse(BaseModel):
    parcelles: list[dict[str, Any]]
    last_updated: int


@router.get("/me", response_model=list[dict[str, Any]])
async def my_parcelles(user=Depends(get_current_user)) -> list[dict[str, Any]]:
    """Parcelles enregistrées pour le compte connecté (producteur / pro)."""
    return await list_parcelles_for_owner(user["id"])


@router.get("/sync", response_model=SyncResponse)
async def sync_parcelles() -> SyncResponse:
    """
    Synchronisation descendante pour l'app carte (SQLite locale).
    `last_updated` : timestamp ms pour décider si le client doit réécraser sa base.
    """
    try:
        rows = await list_all_parcelles_for_sync()
        ts = await get_parcelles_last_updated_ms()
        return SyncResponse(parcelles=rows, last_updated=ts)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/bulk")
async def bulk_upsert_parcelles(
    body: BulkParcellesBody,
    user=Depends(get_current_user_optional),
) -> dict:
    """Réception des parcelles créées/modifiées hors-ligne (upload). Réservé aux comptes producteurs / pro."""
    if user is not None and user["role"] == "client":
        raise HTTPException(
            status_code=403,
            detail="Les comptes acheteurs ne peuvent pas enregistrer de parcelles.",
        )
    if not body.parcelles:
        return {"ok": True, "upserted": 0}
    owner_id: UUID | None = None
    if user is not None and user.get("role") != "client":
        owner_id = user["id"]
    try:
        for p in body.parcelles:
            await upsert_parcelle_row(p.model_dump(), owner_user_id=owner_id)
        return {"ok": True, "upserted": len(body.parcelles)}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
