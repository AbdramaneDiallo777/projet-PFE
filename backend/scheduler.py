import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from backend.worker import run_worker

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


async def _job() -> None:
    logger.info("scheduler: lancement du worker agronomique...")
    try:
        result = await run_worker()
        logger.info("scheduler: worker terminé → %s", result)
    except Exception as exc:
        logger.error("scheduler: erreur inattendue → %s", exc)


def start_scheduler() -> None:
    global _scheduler
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        _job,
        trigger=IntervalTrigger(hours=6),
        id="agronomie_worker",
        replace_existing=True,
        max_instances=1,
    )
    _scheduler.start()
    logger.info("scheduler: démarré — worker toutes les 6h.")


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("scheduler: arrêté.")
