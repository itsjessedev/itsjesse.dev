"""Analysis endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from ..aggregator.collector import ReviewCollector
from ..services.keyword_extractor import KeywordExtractor
from ..services.trend_detector import TrendDetector

router = APIRouter(prefix="/analysis", tags=["analysis"])

collector = ReviewCollector()
keyword_extractor = KeywordExtractor()
trend_detector = TrendDetector()


@router.get("/keywords")
async def get_keywords(
    google_place_id: Optional[str] = Query(None),
    yelp_business_id: Optional[str] = Query(None),
    top_n: int = Query(10, ge=1, le=50),
    sentiment_filter: str = Query("all", regex="^(all|positive|negative)$"),
):
    """Extract top keywords from reviews."""
    try:
        reviews = await collector.collect_all(
            google_place_id=google_place_id,
            yelp_business_id=yelp_business_id,
            analyze_sentiment=True
        )

        keywords = keyword_extractor.get_sentiment_keywords(
            reviews=reviews,
            sentiment_filter=sentiment_filter
        )

        return {
            "keywords": dict(list(keywords.items())[:top_n]),
            "total_reviews": len(reviews),
            "sentiment_filter": sentiment_filter
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/phrases")
async def get_common_phrases(
    google_place_id: Optional[str] = Query(None),
    yelp_business_id: Optional[str] = Query(None),
    phrase_length: int = Query(2, ge=2, le=4),
    top_n: int = Query(10, ge=1, le=50),
):
    """Extract common phrases from reviews."""
    try:
        reviews = await collector.collect_all(
            google_place_id=google_place_id,
            yelp_business_id=yelp_business_id,
            analyze_sentiment=True
        )

        phrases = keyword_extractor.extract_phrases(
            reviews=reviews,
            phrase_length=phrase_length,
            top_n=top_n
        )

        return {
            "phrases": phrases,
            "phrase_length": phrase_length,
            "total_reviews": len(reviews)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sentiment-breakdown")
async def get_sentiment_breakdown(
    google_place_id: Optional[str] = Query(None),
    yelp_business_id: Optional[str] = Query(None),
):
    """Get detailed sentiment breakdown."""
    try:
        reviews = await collector.collect_all(
            google_place_id=google_place_id,
            yelp_business_id=yelp_business_id,
            analyze_sentiment=True
        )

        if not reviews:
            return {"error": "No reviews found"}

        # Group by source
        by_source = {}
        for review in reviews:
            source = review.source.value
            if source not in by_source:
                by_source[source] = {
                    "positive": 0,
                    "neutral": 0,
                    "negative": 0,
                    "total": 0
                }

            by_source[source][review.sentiment_label] += 1
            by_source[source]["total"] += 1

        # Calculate percentages
        for source_data in by_source.values():
            total = source_data["total"]
            if total > 0:
                source_data["positive_pct"] = round(source_data["positive"] / total * 100, 1)
                source_data["neutral_pct"] = round(source_data["neutral"] / total * 100, 1)
                source_data["negative_pct"] = round(source_data["negative"] / total * 100, 1)

        return {
            "by_source": by_source,
            "total_reviews": len(reviews)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
