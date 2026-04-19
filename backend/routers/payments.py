from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.database import create_payment_intent_stub, get_pool
from backend.dependencies import get_current_user

router = APIRouter(prefix="/payments", tags=["Paiements"])


class PaymentIntentOut(BaseModel):
    order_id: UUID
    client_secret: str
    status: str
    provider: str
    amount_cents: int
    currency: str
    message: str


@router.post("/intent/{order_id}", response_model=PaymentIntentOut)
async def create_intent(
    order_id: UUID,
    user=Depends(get_current_user),
) -> PaymentIntentOut:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, buyer_id, total_cents, currency, status FROM orders WHERE id = $1",
            order_id,
        )
    if not row:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    if row["buyer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Accès refusé")
    if row["status"] != "pending":
        raise HTTPException(status_code=400, detail="Commande déjà traitée")

    pi = await create_payment_intent_stub(order_id, int(row["total_cents"]), str(row["currency"]))
    return PaymentIntentOut(
        order_id=order_id,
        client_secret=pi["client_secret"] or "",
        status=pi["status"],
        provider=pi["provider"],
        amount_cents=pi["amount_cents"],
        currency=pi["currency"],
        message=(
            "MVP : secret simulé. Branchez Stripe (STRIPE_SECRET_KEY) ou un PSP pour la production."
        ),
    )
