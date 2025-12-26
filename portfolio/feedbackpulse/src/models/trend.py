"""Trend analysis models."""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class TrendDirection(str, Enum):
    """Trend direction indicators."""

    IMPROVING = "improving"
    DECLINING = "declining"
    STABLE = "stable"


class Trend(BaseModel):
    """Trend analysis result."""

    metric: str = Field(..., description="Metric being tracked (e.g., 'avg_rating', 'sentiment_score')")
    direction: TrendDirection
    current_value: float
    previous_value: float
    change_percent: float
    period_start: datetime
    period_end: datetime

    # Alert status
    is_alert: bool = False
    alert_message: str = ""

    # Supporting data
    data_points: int = Field(..., description="Number of reviews in analysis")

    class Config:
        json_schema_extra = {
            "example": {
                "metric": "avg_rating",
                "direction": "declining",
                "current_value": 3.8,
                "previous_value": 4.2,
                "change_percent": -9.5,
                "period_start": "2024-01-01T00:00:00Z",
                "period_end": "2024-01-07T23:59:59Z",
                "is_alert": True,
                "alert_message": "Average rating declined by 9.5% this week",
                "data_points": 42
            }
        }
