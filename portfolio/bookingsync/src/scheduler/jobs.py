"""Scheduled reminder jobs"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
import logging

from ..services.reminder import reminder_service

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def process_reminders():
    """Process pending reminders"""
    logger.info("Processing pending reminders...")
    # Fetch pending reminders from database
    # Call reminder_service.process_pending_reminders()


def start_scheduler():
    """Start the scheduler"""
    # Run reminder processor every 5 minutes
    scheduler.add_job(
        process_reminders,
        'interval',
        minutes=5,
        id='process_reminders'
    )

    scheduler.start()
    logger.info("Scheduler started")


def stop_scheduler():
    """Stop the scheduler"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")
