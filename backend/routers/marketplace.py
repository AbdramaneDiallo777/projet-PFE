from datetime import datetime
from pathlib import Path
from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from backend.database import (
    create_order_with_items,
    get_product,
    insert_product,
    insert_service_reservation,
    list_buyer_orders_with_line_details,
    list_orders_for_buyer,
    list_products,
    list_sales_for_seller,
    list_service_reservations_for_buyer,
)
from backend.dependencies import get_current_user

router = APIRouter(prefix="/marketplace", tags=["Marketplace B2B"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
_ALLOWED_CT = frozenset({"image/jpeg", "image/png", "image/webp", "image/jpg"})
_EXT = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/jpg": ".jpg"}


class ProductCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str = ""
    category: str = "autre"
    price_cents: int = Field(ge=0)
    currency: str = "XOF"
    quantity: int = Field(ge=0)
    origin_country: Optional[str] = "CI"
    image_url: Optional[str] = None


class ProductOut(BaseModel):
    id: UUID
    seller_id: UUID
    seller_name: Optional[str] = None
    title: str
    description: str
    category: str
    price_cents: int
    currency: str
    quantity: int
    origin_country: Optional[str]
    image_url: Optional[str]


class OrderLineIn(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1)


class OrderCreate(BaseModel):
    lines: list[OrderLineIn]


class OrderOut(BaseModel):
    id: UUID
    status: str
    total_cents: int
    currency: str


class OrderListItem(BaseModel):
    id: UUID
    status: str
    total_cents: int
    currency: str
    created_at: datetime
    line_count: int


class OrderLineDetail(BaseModel):
    product_id: UUID
    product_title: str
    seller_id: UUID
    seller_name: str
    quantity: int
    unit_price_cents: int
    line_total_cents: int


class OrderDetailItem(BaseModel):
    id: UUID
    status: str
    total_cents: int
    currency: str
    created_at: datetime
    line_count: int
    lines: list[OrderLineDetail]


class UploadedImageOut(BaseModel):
    url: str


class ServiceReservationCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    total_cents: int = Field(ge=0)
    currency: str = "XOF"
    notes: str = ""


class ServiceReservationOut(BaseModel):
    id: UUID
    title: str
    total_cents: int
    currency: str
    status: str
    notes: str
    created_at: datetime


@router.post("/upload-image", response_model=UploadedImageOut)
async def upload_product_image(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
) -> UploadedImageOut:
    """
    Enregistre une image (produit ou parcelle) et renvoie un chemin utilisable dans `image_url` ou `photos_urls`.
    """
    if user["role"] not in ("farmer", "company", "admin"):
        raise HTTPException(status_code=403, detail="Rôle non autorisé à envoyer des images.")
    ct = (file.content_type or "").split(";")[0].strip().lower()
    if ct not in _ALLOWED_CT:
        raise HTTPException(
            status_code=400,
            detail=f"Type non supporté ({ct or 'inconnu'}). Utilisez JPEG, PNG ou WebP.",
        )
    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 5 Mo).")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = _EXT.get(ct, ".jpg")
    name = f"{uuid4().hex}{ext}"
    path = UPLOAD_DIR / name
    path.write_bytes(raw)
    return UploadedImageOut(url=f"/uploads/{name}")


@router.post("/products", response_model=ProductOut)
async def create_product(
    body: ProductCreate,
    user=Depends(get_current_user),
) -> ProductOut:
    if user["role"] not in ("farmer", "company", "admin"):
        raise HTTPException(status_code=403, detail="Rôle non autorisé à publier des produits.")
    row = await insert_product(
        user["id"],
        body.title,
        body.description,
        body.category,
        body.price_cents,
        body.currency,
        body.quantity,
        body.origin_country,
        body.image_url,
    )
    return ProductOut(
        id=row["id"],
        seller_id=row["seller_id"],
        seller_name=user["full_name"],
        title=row["title"],
        description=row["description"],
        category=row["category"],
        price_cents=row["price_cents"],
        currency=row["currency"],
        quantity=row["quantity"],
        origin_country=row["origin_country"],
        image_url=row["image_url"],
    )


@router.get("/products", response_model=list[ProductOut])
async def get_products(
    category: Optional[str] = None,
    limit: int = 50,
) -> list[ProductOut]:
    rows = await list_products(limit=limit, category=category)
    out: list[ProductOut] = []
    for r in rows:
        out.append(
            ProductOut(
                id=r["id"],
                seller_id=r["seller_id"],
                seller_name=r.get("seller_name"),
                title=r["title"],
                description=r["description"],
                category=r["category"],
                price_cents=r["price_cents"],
                currency=r["currency"],
                quantity=r["quantity"],
                origin_country=r["origin_country"],
                image_url=r["image_url"],
            )
        )
    return out


@router.get("/products/{product_id}", response_model=ProductOut)
async def get_one_product(product_id: UUID) -> ProductOut:
    r = await get_product(product_id)
    if not r:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return ProductOut(
        id=r["id"],
        seller_id=r["seller_id"],
        seller_name=r.get("seller_name"),
        title=r["title"],
        description=r["description"],
        category=r["category"],
        price_cents=r["price_cents"],
        currency=r["currency"],
        quantity=r["quantity"],
        origin_country=r["origin_country"],
        image_url=r["image_url"],
    )


@router.get("/orders/me", response_model=list[OrderListItem])
async def my_orders(
    limit: int = 50,
    user=Depends(get_current_user),
) -> list[OrderListItem]:
    """Commandes passées par l’utilisateur connecté (acheteur)."""
    rows = await list_orders_for_buyer(user["id"], min(limit, 100))
    return [
        OrderListItem(
            id=r["id"],
            status=r["status"],
            total_cents=r["total_cents"],
            currency=r["currency"],
            created_at=r["created_at"],
            line_count=int(r["line_count"] or 0),
        )
        for r in rows
    ]


@router.get("/orders/me/detailed", response_model=list[OrderDetailItem])
async def my_orders_detailed(
    limit: int = 50,
    user=Depends(get_current_user),
) -> list[OrderDetailItem]:
    """Commandes où l’utilisateur est l’acheteur, avec lignes (produit + vendeur)."""
    raw = await list_buyer_orders_with_line_details(user["id"], min(limit, 100))
    out: list[OrderDetailItem] = []
    for o in raw:
        lines = [
            OrderLineDetail(
                product_id=ln["product_id"],
                product_title=ln["product_title"],
                seller_id=ln["seller_id"],
                seller_name=ln["seller_name"],
                quantity=ln["quantity"],
                unit_price_cents=ln["unit_price_cents"],
                line_total_cents=ln["line_total_cents"],
            )
            for ln in o["lines"]
        ]
        out.append(
            OrderDetailItem(
                id=o["id"],
                status=o["status"],
                total_cents=o["total_cents"],
                currency=o["currency"],
                created_at=o["created_at"],
                line_count=o["line_count"],
                lines=lines,
            )
        )
    return out


@router.get("/orders/sales", response_model=list[OrderListItem])
async def my_sales_as_seller(
    limit: int = 50,
    user=Depends(get_current_user),
) -> list[OrderListItem]:
    """Ventes : commandes qui incluent au moins un produit publié par le vendeur connecté."""
    rows = await list_sales_for_seller(user["id"], min(limit, 100))
    return [
        OrderListItem(
            id=r["id"],
            status=r["status"],
            total_cents=int(r["seller_total_cents"] or 0),
            currency=r["currency"],
            created_at=r["created_at"],
            line_count=int(r["line_count"] or 0),
        )
        for r in rows
    ]


@router.post("/reservations", response_model=ServiceReservationOut)
async def create_service_reservation(
    body: ServiceReservationCreate,
    user=Depends(get_current_user),
) -> ServiceReservationOut:
    """Réservation terrain / matériel (hors lignes panier produits) — enregistrée en base."""
    if user["role"] != "client":
        raise HTTPException(
            status_code=403,
            detail="Les réservations de service sont réservées aux comptes acheteur.",
        )
    row = await insert_service_reservation(
        user["id"],
        body.title,
        body.total_cents,
        body.currency,
        body.notes or "",
    )
    return ServiceReservationOut(
        id=row["id"],
        title=row["title"] or "",
        total_cents=int(row["total_cents"]),
        currency=str(row["currency"]),
        status=str(row["status"]),
        notes=row["notes"] or "",
        created_at=row["created_at"],
    )


@router.get("/reservations/me", response_model=list[ServiceReservationOut])
async def my_service_reservations(
    limit: int = 50,
    user=Depends(get_current_user),
) -> list[ServiceReservationOut]:
    if user["role"] != "client":
        raise HTTPException(
            status_code=403,
            detail="Réservé aux comptes acheteur.",
        )
    rows = await list_service_reservations_for_buyer(user["id"], min(limit, 100))
    return [
        ServiceReservationOut(
            id=r["id"],
            title=r["title"] or "",
            total_cents=int(r["total_cents"]),
            currency=str(r["currency"]),
            status=str(r["status"]),
            notes=r["notes"] or "",
            created_at=r["created_at"],
        )
        for r in rows
    ]


@router.post("/orders", response_model=OrderOut)
async def place_order(
    body: OrderCreate,
    user=Depends(get_current_user),
) -> OrderOut:
    if not body.lines:
        raise HTTPException(status_code=400, detail="Panier vide.")
    items = [(ln.product_id, ln.quantity) for ln in body.lines]
    try:
        order, _ = await create_order_with_items(user["id"], items)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return OrderOut(
        id=order["id"],
        status=order["status"],
        total_cents=order["total_cents"],
        currency=order["currency"],
    )
