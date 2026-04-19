import json
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

import asyncpg

from backend.config import DATABASE_URL

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


async def _remove_duplicate_champ3_parcelles(conn: asyncpg.Connection) -> None:
    """
    Supprime les doublons backend nommés « Champ 3 » (même nom que l’auto-libellé carte).
    On conserve une seule ligne : la plus ancienne (updated_at puis id_local).
    Supprime aussi les lignes correspondantes dans parcelles_agronomie.
    """
    rows = await conn.fetch(
        """
        SELECT id_local
        FROM (
            SELECT id_local,
                   ROW_NUMBER() OVER (
                       ORDER BY updated_at ASC NULLS FIRST, id_local ASC
                   ) AS rn
            FROM parcelles
            WHERE TRIM(nom) = 'Champ 3'
        ) t
        WHERE rn > 1
        """
    )
    if not rows:
        return
    ids = [r["id_local"] for r in rows]
    await conn.execute(
        "DELETE FROM parcelles_agronomie WHERE id_local = ANY($1::text[])",
        ids,
    )
    await conn.execute(
        "DELETE FROM parcelles WHERE id_local = ANY($1::text[])",
        ids,
    )


def _centroid_from_points_json(points_str: str) -> tuple[float, float]:
    try:
        pts = json.loads(points_str)
    except (json.JSONDecodeError, TypeError):
        return 0.0, 0.0
    if not pts or not isinstance(pts, list):
        return 0.0, 0.0
    lats: list[float] = []
    lons: list[float] = []
    for p in pts:
        if isinstance(p, dict):
            lat = p.get("latitude")
            lon = p.get("longitude")
            if lat is not None and lon is not None:
                lats.append(float(lat))
                lons.append(float(lon))
    if not lats:
        return 0.0, 0.0
    return sum(lats) / len(lats), sum(lons) / len(lons)


async def init_db() -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email           TEXT NOT NULL UNIQUE,
                password_hash   TEXT NOT NULL,
                full_name       TEXT NOT NULL DEFAULT '',
                role            TEXT NOT NULL DEFAULT 'farmer'
                    CHECK (role IN ('farmer', 'company', 'admin', 'logistics', 'client')),
                country_code    TEXT DEFAULT 'CI',
                created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

            CREATE TABLE IF NOT EXISTS parcelles (
                id_local            TEXT PRIMARY KEY,
                nom                 TEXT NOT NULL DEFAULT '',
                points              TEXT NOT NULL DEFAULT '[]',
                surface             TEXT NOT NULL DEFAULT '',
                humidite            TEXT NOT NULL DEFAULT '40',
                croissance          TEXT NOT NULL DEFAULT '50',
                qualite_sol         TEXT NOT NULL DEFAULT '',
                statut_occupation   TEXT NOT NULL DEFAULT 'libre',
                statut_location     TEXT NOT NULL DEFAULT 'a_louer',
                lieu                TEXT NOT NULL DEFAULT 'Non défini',
                culture             TEXT NOT NULL DEFAULT '',
                proprietaire_nom    TEXT NOT NULL DEFAULT 'Inconnu',
                proprietaire_tel    TEXT NOT NULL DEFAULT '',
                owner_user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
                updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS parcelles_agronomie (
                id_local        TEXT PRIMARY KEY,
                lat             DOUBLE PRECISION NOT NULL,
                lon             DOUBLE PRECISION NOT NULL,
                humidite        INTEGER NOT NULL DEFAULT 40,
                ndvi            DOUBLE PRECISION NOT NULL DEFAULT 0.4,
                croissance      INTEGER NOT NULL DEFAULT 20,
                updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                meteo_updated_at TIMESTAMPTZ
            );

            CREATE TABLE IF NOT EXISTS products (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                seller_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title           TEXT NOT NULL,
                description     TEXT NOT NULL DEFAULT '',
                category        TEXT NOT NULL DEFAULT 'autre',
                price_cents     INTEGER NOT NULL DEFAULT 0,
                currency        TEXT NOT NULL DEFAULT 'XOF',
                quantity        INTEGER NOT NULL DEFAULT 0,
                origin_country  TEXT DEFAULT 'CI',
                image_url       TEXT,
                created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
            CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

            CREATE TABLE IF NOT EXISTS orders (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
                total_cents     INTEGER NOT NULL DEFAULT 0,
                currency        TEXT NOT NULL DEFAULT 'XOF',
                created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
                quantity        INTEGER NOT NULL DEFAULT 1,
                unit_price_cents INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS shipments (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
                carrier_id      UUID REFERENCES users(id) ON DELETE SET NULL,
                origin_label    TEXT,
                destination_label TEXT,
                status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'scheduled', 'in_transit', 'delivered', 'cancelled')),
                tracking_code   TEXT UNIQUE,
                eta             TIMESTAMPTZ,
                created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS payment_intents (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                provider        TEXT NOT NULL DEFAULT 'stub',
                status          TEXT NOT NULL DEFAULT 'requires_payment'
                    CHECK (status IN ('requires_payment', 'succeeded', 'failed', 'cancelled')),
                amount_cents    INTEGER NOT NULL,
                currency        TEXT NOT NULL DEFAULT 'XOF',
                client_secret   TEXT,
                external_id     TEXT,
                created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """)
        await conn.execute(
            "ALTER TABLE parcelles ADD COLUMN IF NOT EXISTS photos_urls TEXT NOT NULL DEFAULT '[]';"
        )
        await conn.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url TEXT;"
        )
        await conn.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;"
        )
        await conn.execute(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;"
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS service_reservations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL DEFAULT '',
                total_cents INTEGER NOT NULL,
                currency TEXT NOT NULL DEFAULT 'XOF',
                status TEXT NOT NULL DEFAULT 'confirmed',
                notes TEXT NOT NULL DEFAULT '',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_service_reservations_buyer ON service_reservations(buyer_id);
            """
        )
        # Bases déjà créées : étendre la contrainte rôle (acheteurs internationaux).
        try:
            await conn.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;")
            await conn.execute(
                """
                ALTER TABLE users ADD CONSTRAINT users_role_check
                CHECK (role IN ('farmer', 'company', 'admin', 'logistics', 'client'));
                """
            )
        except Exception:
            pass

        await _remove_duplicate_champ3_parcelles(conn)


# ── Agronomie (inchangé fonctionnellement) ───────────────────────────────────

async def upsert_agronomie(
    id_local: str,
    lat: float,
    lon: float,
    humidite: int,
    ndvi: float,
    croissance: int,
) -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO parcelles_agronomie
                (id_local, lat, lon, humidite, ndvi, croissance, updated_at, meteo_updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT (id_local) DO UPDATE SET
                humidite         = EXCLUDED.humidite,
                ndvi             = EXCLUDED.ndvi,
                croissance       = EXCLUDED.croissance,
                updated_at       = NOW(),
                meteo_updated_at = NOW();
        """, id_local, lat, lon, humidite, ndvi, croissance)


async def sync_agronomie_from_parcelle(id_local: str, points_json: str) -> None:
    lat, lon = _centroid_from_points_json(points_json)
    if lat == 0.0 and lon == 0.0:
        return
    await upsert_agronomie(id_local, lat, lon, 40, 0.4, 20)


async def get_all_parcelles_coords() -> list[asyncpg.Record]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetch(
            "SELECT id_local, lat, lon FROM parcelles_agronomie ORDER BY id_local"
        )


async def get_agronomie_since(since: datetime) -> list[asyncpg.Record]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetch(
            """
            SELECT id_local, humidite, ndvi, croissance, updated_at, meteo_updated_at
            FROM parcelles_agronomie
            WHERE updated_at > $1
            ORDER BY updated_at DESC
            """,
            since,
        )


async def get_all_agronomie() -> list[asyncpg.Record]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetch(
            """
            SELECT id_local, humidite, ndvi, croissance, updated_at, meteo_updated_at
            FROM parcelles_agronomie
            ORDER BY updated_at DESC
            """
        )


# ── Parcelles (sync mobile AgriTerra) ─────────────────────────────────────────

async def get_parcelles_last_updated_ms() -> int:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT COALESCE(
                (EXTRACT(EPOCH FROM MAX(updated_at)) * 1000)::bigint,
                0
            ) AS ts FROM parcelles
            """
        )
        return int(row["ts"]) if row and row["ts"] is not None else 0


async def list_all_parcelles_for_sync() -> list[dict[str, Any]]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id_local, nom, points, surface, humidite, croissance, qualite_sol,
                   statut_occupation, statut_location, lieu, culture,
                   proprietaire_nom, proprietaire_tel, photos_urls
            FROM parcelles ORDER BY id_local DESC
            """
        )
        return [dict(r) for r in rows]


async def upsert_parcelle_row(
    row: dict[str, Any],
    owner_user_id: Optional[UUID] = None,
) -> None:
    pool = await get_pool()
    points = row.get("points") or "[]"
    photos_urls = row.get("photos_urls") or "[]"
    oid = owner_user_id
    if oid is None and row.get("owner_user_id"):
        try:
            oid = UUID(str(row["owner_user_id"]))
        except (ValueError, TypeError):
            oid = None
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO parcelles (
                id_local, nom, points, surface, humidite, croissance, qualite_sol,
                statut_occupation, statut_location, lieu, culture,
                proprietaire_nom, proprietaire_tel, photos_urls, owner_user_id, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, NOW())
            ON CONFLICT (id_local) DO UPDATE SET
                nom = EXCLUDED.nom,
                points = EXCLUDED.points,
                surface = EXCLUDED.surface,
                humidite = EXCLUDED.humidite,
                croissance = EXCLUDED.croissance,
                qualite_sol = EXCLUDED.qualite_sol,
                statut_occupation = EXCLUDED.statut_occupation,
                statut_location = EXCLUDED.statut_location,
                lieu = EXCLUDED.lieu,
                culture = EXCLUDED.culture,
                proprietaire_nom = EXCLUDED.proprietaire_nom,
                proprietaire_tel = EXCLUDED.proprietaire_tel,
                photos_urls = EXCLUDED.photos_urls,
                owner_user_id = COALESCE(EXCLUDED.owner_user_id, parcelles.owner_user_id),
                updated_at = NOW()
            """,
            row["id_local"],
            row.get("nom") or "",
            points,
            row.get("surface") or "",
            str(row.get("humidite") or "40"),
            str(row.get("croissance") or "50"),
            row.get("qualite_sol") or "",
            row.get("statut_occupation") or "libre",
            row.get("statut_location") or "a_louer",
            row.get("lieu") or "Non défini",
            row.get("culture") or "",
            row.get("proprietaire_nom") or "Inconnu",
            row.get("proprietaire_tel") or "",
            photos_urls,
            oid,
        )
    await sync_agronomie_from_parcelle(row["id_local"], points)


# ── Utilisateurs ─────────────────────────────────────────────────────────────

async def get_user_by_email(email: str) -> Optional[asyncpg.Record]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchrow(
            "SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1",
            email.lower().strip(),
        )


async def get_user_by_id(user_id: UUID) -> Optional[asyncpg.Record]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchrow(
            """
            SELECT id, email, full_name, role, country_code, created_at,
                   image_url, phone_number, location
            FROM users WHERE id = $1
            """,
            user_id,
        )


async def update_user_profile(
    user_id: UUID,
    patch: dict[str, Any],
) -> Optional[asyncpg.Record]:
    """Met à jour uniquement les clés présentes dans patch (noms de colonnes users)."""
    allowed = frozenset(
        {"full_name", "phone_number", "location", "country_code", "image_url"}
    )
    sets: list[str] = []
    args: list[Any] = [user_id]
    n = 2
    for key, val in patch.items():
        if key in allowed:
            sets.append(f"{key} = ${n}")
            args.append(val)
            n += 1
    if not sets:
        return await get_user_by_id(user_id)
    pool = await get_pool()
    async with pool.acquire() as conn:
        q = f"""
            UPDATE users SET {", ".join(sets)}, updated_at = NOW()
            WHERE id = $1
            RETURNING id, email, full_name, role, country_code, created_at,
                      image_url, phone_number, location
        """
        return await conn.fetchrow(q, *args)


async def create_user(email: str, password_hash: str, full_name: str, role: str) -> asyncpg.Record:
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchrow(
            """
            INSERT INTO users (email, password_hash, full_name, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, full_name, role, country_code, created_at
            """,
            email.lower().strip(),
            password_hash,
            full_name,
            role,
        )


# ── Marketplace / commandes (MVP) ────────────────────────────────────────────

async def insert_product(
    seller_id: UUID,
    title: str,
    description: str,
    category: str,
    price_cents: int,
    currency: str,
    quantity: int,
    origin_country: Optional[str],
    image_url: Optional[str],
) -> asyncpg.Record:
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchrow(
            """
            INSERT INTO products (
                seller_id, title, description, category, price_cents, currency,
                quantity, origin_country, image_url
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *
            """,
            seller_id,
            title,
            description,
            category,
            price_cents,
            currency,
            quantity,
            origin_country,
            image_url,
        )


async def list_products(limit: int = 50, category: Optional[str] = None) -> list[asyncpg.Record]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        if category:
            return await conn.fetch(
                """
                SELECT p.*, u.full_name AS seller_name
                FROM products p
                JOIN users u ON u.id = p.seller_id
                WHERE p.category = $1 AND p.quantity > 0
                ORDER BY p.created_at DESC LIMIT $2
                """,
                category,
                limit,
            )
        return await conn.fetch(
            """
            SELECT p.*, u.full_name AS seller_name
            FROM products p
            JOIN users u ON u.id = p.seller_id
            WHERE p.quantity > 0
            ORDER BY p.created_at DESC LIMIT $1
            """,
            limit,
        )


async def get_product(product_id: UUID) -> Optional[asyncpg.Record]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchrow(
            """
            SELECT p.*, u.full_name AS seller_name
            FROM products p JOIN users u ON u.id = p.seller_id
            WHERE p.id = $1
            """,
            product_id,
        )


async def create_order_with_items(
    buyer_id: UUID,
    items: list[tuple[UUID, int]],
) -> tuple[asyncpg.Record, list[asyncpg.Record]]:
    """items: (product_id, qty). Prix figés depuis products."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            reserved: list[tuple[asyncpg.Record, int]] = []
            total = 0
            currency = "XOF"
            for pid, qty in items:
                pr = await conn.fetchrow(
                    "SELECT id, price_cents, currency, quantity FROM products WHERE id = $1 FOR UPDATE",
                    pid,
                )
                if not pr or int(pr["quantity"]) < qty:
                    raise ValueError(f"Produit indisponible: {pid}")
                unit = int(pr["price_cents"])
                currency = str(pr["currency"])
                total += unit * qty
                reserved.append((pr, qty))

            order = await conn.fetchrow(
                """
                INSERT INTO orders (buyer_id, status, total_cents, currency)
                VALUES ($1, 'paid', $2, $3)
                RETURNING *
                """,
                buyer_id,
                total,
                currency,
            )
            oid = order["id"]
            line_rows: list[asyncpg.Record] = []
            for pr, qty in reserved:
                pid = pr["id"]
                unit = int(pr["price_cents"])
                await conn.execute(
                    "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
                    qty,
                    pid,
                )
                ir = await conn.fetchrow(
                    """
                    INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents)
                    VALUES ($1, $2, $3, $4)
                    RETURNING *
                    """,
                    oid,
                    pid,
                    qty,
                    unit,
                )
                line_rows.append(ir)
            return order, line_rows


async def list_orders_for_buyer(buyer_id: UUID, limit: int = 50) -> list[asyncpg.Record]:
    """Commandes du connecté, les plus récentes d’abord."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetch(
            """
            SELECT o.id, o.status, o.total_cents, o.currency, o.created_at,
                   (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS line_count
            FROM orders o
            WHERE o.buyer_id = $1
            ORDER BY o.created_at DESC
            LIMIT $2
            """,
            buyer_id,
            limit,
        )


async def list_buyer_orders_with_line_details(
    buyer_id: UUID, limit: int = 50
) -> list[dict[str, Any]]:
    """Commandes acheteur avec lignes : produit + vendeur (pour « Mes commandes »)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        orders = await conn.fetch(
            """
            SELECT id, status, total_cents, currency, created_at
            FROM orders
            WHERE buyer_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            """,
            buyer_id,
            limit,
        )
        out: list[dict[str, Any]] = []
        for o in orders:
            lines = await conn.fetch(
                """
                SELECT oi.quantity, oi.unit_price_cents,
                       p.id AS product_id, p.title AS product_title,
                       p.seller_id, u.full_name AS seller_name
                FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                JOIN users u ON u.id = p.seller_id
                WHERE oi.order_id = $1
                ORDER BY oi.id
                """,
                o["id"],
            )
            line_dicts: list[dict[str, Any]] = []
            for r in lines:
                q = int(r["quantity"])
                unit = int(r["unit_price_cents"])
                line_dicts.append(
                    {
                        "product_id": r["product_id"],
                        "product_title": r["product_title"] or "Produit",
                        "seller_id": r["seller_id"],
                        "seller_name": (r["seller_name"] or "").strip() or "Vendeur",
                        "quantity": q,
                        "unit_price_cents": unit,
                        "line_total_cents": q * unit,
                    }
                )
            out.append(
                {
                    "id": o["id"],
                    "status": o["status"],
                    "total_cents": o["total_cents"],
                    "currency": o["currency"],
                    "created_at": o["created_at"],
                    "line_count": len(line_dicts),
                    "lines": line_dicts,
                }
            )
        return out


async def insert_service_reservation(
    buyer_id: UUID,
    title: str,
    total_cents: int,
    currency: str,
    notes: str,
) -> asyncpg.Record:
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchrow(
            """
            INSERT INTO service_reservations (buyer_id, title, total_cents, currency, notes, status)
            VALUES ($1, $2, $3, $4, $5, 'confirmed')
            RETURNING *
            """,
            buyer_id,
            title[:500],
            total_cents,
            currency,
            notes[:2000],
        )


async def list_service_reservations_for_buyer(buyer_id: UUID, limit: int = 50) -> list[asyncpg.Record]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetch(
            """
            SELECT id, buyer_id, title, total_cents, currency, status, notes, created_at
            FROM service_reservations
            WHERE buyer_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            """,
            buyer_id,
            limit,
        )


async def list_sales_for_seller(seller_id: UUID, limit: int = 50) -> list[asyncpg.Record]:
    """
    Commandes contenant au moins une ligne sur un produit du vendeur.
    total_cents = somme (prix unitaire × quantité) pour ses lignes uniquement.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetch(
            """
            SELECT o.id,
                   o.status,
                   COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0)::bigint AS seller_total_cents,
                   o.currency,
                   o.created_at,
                   COUNT(oi.id)::int AS line_count
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN products p ON p.id = oi.product_id AND p.seller_id = $1
            GROUP BY o.id, o.status, o.currency, o.created_at
            ORDER BY o.created_at DESC
            LIMIT $2
            """,
            seller_id,
            limit,
        )


async def create_payment_intent_stub(order_id: UUID, amount_cents: int, currency: str) -> asyncpg.Record:
    pool = await get_pool()
    secret = f"agro_stub_{order_id.hex[:12]}"
    async with pool.acquire() as conn:
        return await conn.fetchrow(
            """
            INSERT INTO payment_intents (order_id, provider, status, amount_cents, currency, client_secret)
            VALUES ($1, 'stub', 'requires_payment', $2, $3, $4)
            RETURNING *
            """,
            order_id,
            amount_cents,
            currency,
            secret,
        )


async def create_shipment_stub(
    order_id: UUID,
    origin_label: str,
    destination_label: str,
) -> asyncpg.Record:
    pool = await get_pool()
    import secrets

    code = f"AGRO-{secrets.token_hex(4).upper()}"
    async with pool.acquire() as conn:
        return await conn.fetchrow(
            """
            INSERT INTO shipments (order_id, origin_label, destination_label, status, tracking_code)
            VALUES ($1, $2, $3, 'scheduled', $4)
            RETURNING *
            """,
            order_id,
            origin_label,
            destination_label,
            code,
        )
