"""Platforms API endpoints."""

from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.services.aggregator import OrderAggregator

router = APIRouter()


class PlatformResponse(BaseModel):
    """Platform status response model."""
    name: str
    type: str
    connected: bool
    orders_count: int


class PlatformStatsResponse(BaseModel):
    """Platform statistics response."""
    platforms: List[PlatformResponse]
    total_orders: int


@router.get("/", response_model=PlatformStatsResponse)
async def list_platforms(
    db: Session = Depends(get_db),
):
    """
    List all platforms and their connection status.

    Returns connection status, health check, and order counts for each platform.
    """
    aggregator = OrderAggregator()
    stats = aggregator.get_platform_stats()

    platforms = []
    total_orders = 0

    platform_names = {
        "shopify": "Shopify",
        "amazon": "Amazon",
        "ebay": "eBay",
        "etsy": "Etsy",
    }

    for platform_type, platform_stats in stats.items():
        platforms.append(PlatformResponse(
            name=platform_names.get(platform_type, platform_type.title()),
            type=platform_type,
            connected=platform_stats["connected"],
            orders_count=platform_stats["orders_count"]
        ))
        total_orders += platform_stats["orders_count"]

    return PlatformStatsResponse(
        platforms=platforms,
        total_orders=total_orders
    )


@router.get("/{platform}/health")
async def check_platform_health(
    platform: str,
    db: Session = Depends(get_db),
):
    """
    Check if a specific platform connection is healthy.

    - **platform**: Platform name (shopify, amazon, ebay, etsy)
    """
    aggregator = OrderAggregator()

    client_map = {
        "shopify": aggregator.shopify,
        "amazon": aggregator.amazon,
        "ebay": aggregator.ebay,
        "etsy": aggregator.etsy,
    }

    client = client_map.get(platform)
    if not client:
        return {"platform": platform, "healthy": False, "error": "Unknown platform"}

    healthy = client.health_check()

    return {
        "platform": platform,
        "healthy": healthy,
        "demo_mode": client.demo_mode
    }
