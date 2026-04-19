from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.database import create_shipment_stub, get_pool
from backend.dependencies import get_current_user

router = APIRouter(prefix="/logistics", tags=["Transport"])


class ShipmentCreate(BaseModel):
    order_id: UUID
    origin_label: str = ""
    destination_label: str = ""


class ShipmentOut(BaseModel):
    id: UUID
    order_id: UUID | None
    tracking_code: str | None
    status: str
    origin_label: str | None
    destination_label: str | None


@router.post("/shipments", response_model=ShipmentOut)
async def schedule_shipment(
    body: ShipmentCreate,
    user=Depends(get_current_user),
) -> ShipmentOut:
    if user["role"] not in ("company", "logistics", "admin"):
        raise HTTPException(status_code=403, detail="Rôle transport ou entreprise requis.")
    row = await create_shipment_stub(
        body.order_id,
        body.origin_label or "Origine",
        body.destination_label or "Destination",
    )
    return ShipmentOut(
        id=row["id"],
        order_id=row["order_id"],
        tracking_code=row["tracking_code"],
        status=row["status"],
        origin_label=row["origin_label"],
        destination_label=row["destination_label"],
    )


@router.get("/shipments/{tracking_code}", response_model=ShipmentOut)
async def track(tracking_code: str) -> ShipmentOut:
    pool = await get_pool()
    async with pool.acquire() as conn:
        r = await conn.fetchrow(
            "SELECT * FROM shipments WHERE UPPER(tracking_code) = UPPER($1)",
            tracking_code.strip(),
        )
    if not r:
        raise HTTPException(status_code=404, detail="Suivi introuvable")
    return ShipmentOut(
        id=r["id"],
        order_id=r["order_id"],
        tracking_code=r["tracking_code"],
        status=r["status"],
        origin_label=r["origin_label"],
        destination_label=r["destination_label"],
    )
