"""
Données agrégées pour tableaux de bord (Recharts / Chart.js côté front).
"""

from fastapi import APIRouter

from backend.database import get_pool

router = APIRouter(prefix="/dashboard", tags=["Visualisation"])


@router.get("/summary")
async def dashboard_summary() -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        users = await conn.fetchval("SELECT COUNT(*) FROM users")
        parcelles = await conn.fetchval("SELECT COUNT(*) FROM parcelles")
        products = await conn.fetchval("SELECT COUNT(*) FROM products WHERE quantity > 0")
        orders = await conn.fetchval("SELECT COUNT(*) FROM orders")
        by_role = await conn.fetch(
            "SELECT role, COUNT(*) AS n FROM users GROUP BY role ORDER BY role"
        )
        orders_by_status = await conn.fetch(
            "SELECT status, COUNT(*) AS n FROM orders GROUP BY status ORDER BY status"
        )
    return {
        "counts": {
            "users": int(users or 0),
            "parcelles": int(parcelles or 0),
            "products_active": int(products or 0),
            "orders": int(orders or 0),
        },
        "users_by_role": [{"role": r["role"], "count": r["n"]} for r in by_role],
        "orders_by_status": [{"status": r["status"], "count": r["n"]} for r in orders_by_status],
        "note": "Séries prêtes pour graphiques (bar/pie) sur le front React/Expo.",
    }
