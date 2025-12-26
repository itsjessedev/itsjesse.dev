"""Review data models."""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ReviewSource(str, Enum):
    """Review source platforms."""

    GOOGLE = "google"
    YELP = "yelp"
    SURVEY = "survey"
    SUPPORT_TICKET = "support_ticket"
    CUSTOM = "custom"


class Review(BaseModel):
    """Review model."""

    id: Optional[str] = None
    source: ReviewSource
    source_id: str = Field(..., description="ID from the source platform")
    author: str
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    text: str
    created_at: datetime
    location: Optional[str] = None

    # Analysis fields (populated after processing)
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    keywords: list[str] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "source": "google",
                "source_id": "123abc",
                "author": "John Doe",
                "rating": 4.5,
                "text": "Great service and friendly staff!",
                "created_at": "2024-01-15T10:30:00Z",
                "location": "San Francisco, CA"
            }
        }
