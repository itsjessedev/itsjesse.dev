"""Sentiment analysis models."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class SentimentScore(str, Enum):
    """Sentiment classification labels."""

    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class SentimentAnalysis(BaseModel):
    """Sentiment analysis result."""

    review_id: str
    score: float = Field(..., ge=0.0, le=1.0, description="Sentiment score 0-1")
    label: SentimentScore
    confidence: float = Field(..., ge=0.0, le=1.0)
    keywords: list[str] = Field(default_factory=list)

    # Detailed scores
    positive_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    neutral_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    negative_score: Optional[float] = Field(None, ge=0.0, le=1.0)

    # Additional insights
    topics: list[str] = Field(default_factory=list)
    emotions: list[str] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "review_id": "123",
                "score": 0.85,
                "label": "positive",
                "confidence": 0.92,
                "keywords": ["great", "friendly", "excellent"],
                "topics": ["customer_service", "quality"],
                "emotions": ["happy", "satisfied"]
            }
        }
