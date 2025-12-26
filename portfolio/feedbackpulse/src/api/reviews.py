"""Review endpoints."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from ..models.review import Review, ReviewSource
from ..aggregator.collector import ReviewCollector

router = APIRouter(prefix="/reviews", tags=["reviews"])

# Initialize collector (will use demo mode if no API keys)
collector = ReviewCollector()


@router.get("/", response_model=List[Review])
async def get_reviews(
    google_place_id: Optional[str] = Query(None, description="Google Place ID"),
    yelp_business_id: Optional[str] = Query(None, description="Yelp Business ID"),
    analyze_sentiment: bool = Query(True, description="Run sentiment analysis"),
) -> List[Review]:
    """Fetch reviews from all configured sources.

    If no IDs are provided, returns demo data.
    """
    try:
        reviews = await collector.collect_all(
            google_place_id=google_place_id,
            yelp_business_id=yelp_business_id,
            analyze_sentiment=analyze_sentiment
        )
        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{source}", response_model=List[Review])
async def get_reviews_by_source(
    source: ReviewSource,
    source_id: str = Query(..., description="Platform-specific ID"),
    analyze_sentiment: bool = Query(True, description="Run sentiment analysis"),
) -> List[Review]:
    """Fetch reviews from a specific source."""
    try:
        reviews = await collector.collect_by_source(
            source=source,
            source_id=source_id,
            analyze_sentiment=analyze_sentiment
        )
        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary")
async def get_review_summary(
    google_place_id: Optional[str] = Query(None),
    yelp_business_id: Optional[str] = Query(None),
):
    """Get summary statistics for all reviews."""
    try:
        reviews = await collector.collect_all(
            google_place_id=google_place_id,
            yelp_business_id=yelp_business_id,
            analyze_sentiment=True
        )

        total = len(reviews)
        if total == 0:
            return {
                "total_reviews": 0,
                "avg_rating": 0,
                "avg_sentiment": 0,
                "positive_count": 0,
                "neutral_count": 0,
                "negative_count": 0,
            }

        avg_rating = sum(r.rating for r in reviews if r.rating) / len([r for r in reviews if r.rating])
        avg_sentiment = sum(r.sentiment_score for r in reviews if r.sentiment_score) / len([r for r in reviews if r.sentiment_score])

        positive = len([r for r in reviews if r.sentiment_label == "positive"])
        neutral = len([r for r in reviews if r.sentiment_label == "neutral"])
        negative = len([r for r in reviews if r.sentiment_label == "negative"])

        return {
            "total_reviews": total,
            "avg_rating": round(avg_rating, 2),
            "avg_sentiment": round(avg_sentiment, 2),
            "positive_count": positive,
            "neutral_count": neutral,
            "negative_count": negative,
            "sentiment_distribution": {
                "positive": round(positive / total * 100, 1),
                "neutral": round(neutral / total * 100, 1),
                "negative": round(negative / total * 100, 1),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
