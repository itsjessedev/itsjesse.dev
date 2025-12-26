"""Alert and trend endpoints."""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query

from ..aggregator.collector import ReviewCollector
from ..services.trend_detector import TrendDetector
from ..models.trend import Trend

router = APIRouter(prefix="/alerts", tags=["alerts"])

collector = ReviewCollector()
trend_detector = TrendDetector()


@router.get("/trends", response_model=List[Trend])
async def get_trends(
    google_place_id: Optional[str] = Query(None),
    yelp_business_id: Optional[str] = Query(None),
    window_days: int = Query(7, ge=1, le=90),
):
    """Get trend analysis for ratings, sentiment, and volume."""
    try:
        reviews = await collector.collect_all(
            google_place_id=google_place_id,
            yelp_business_id=yelp_business_id,
            analyze_sentiment=True
        )

        if not reviews:
            raise HTTPException(status_code=404, detail="No reviews found")

        trends = [
            trend_detector.analyze_rating_trend(reviews, window_days),
            trend_detector.analyze_sentiment_trend(reviews, window_days),
            trend_detector.get_volume_trend(reviews, window_days),
        ]

        return trends
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check-alerts")
async def check_alerts(
    google_place_id: Optional[str] = Query(None),
    yelp_business_id: Optional[str] = Query(None),
    window_days: int = Query(7, ge=1, le=90),
):
    """Check for active alerts."""
    try:
        reviews = await collector.collect_all(
            google_place_id=google_place_id,
            yelp_business_id=yelp_business_id,
            analyze_sentiment=True
        )

        if not reviews:
            return {
                "has_alerts": False,
                "alerts": [],
                "total_reviews": 0
            }

        alerts = []

        # Check trend alerts
        rating_trend = trend_detector.analyze_rating_trend(reviews, window_days)
        if rating_trend.is_alert:
            alerts.append({
                "type": "rating_trend",
                "severity": "high",
                "message": rating_trend.alert_message
            })

        sentiment_trend = trend_detector.analyze_sentiment_trend(reviews, window_days)
        if sentiment_trend.is_alert:
            alerts.append({
                "type": "sentiment_trend",
                "severity": "high",
                "message": sentiment_trend.alert_message
            })

        # Check negative spike
        is_spike, spike_message = trend_detector.detect_negative_spike(reviews, days=1)
        if is_spike:
            alerts.append({
                "type": "negative_spike",
                "severity": "critical",
                "message": spike_message
            })

        return {
            "has_alerts": len(alerts) > 0,
            "alerts": alerts,
            "total_reviews": len(reviews),
            "checked_at": reviews[-1].created_at.isoformat() if reviews else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/negative-reviews")
async def get_recent_negative_reviews(
    google_place_id: Optional[str] = Query(None),
    yelp_business_id: Optional[str] = Query(None),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(10, ge=1, le=100),
):
    """Get recent negative reviews for investigation."""
    try:
        reviews = await collector.collect_all(
            google_place_id=google_place_id,
            yelp_business_id=yelp_business_id,
            analyze_sentiment=True
        )

        # Filter negative reviews
        negative_reviews = [
            r for r in reviews
            if r.sentiment_label == "negative"
        ]

        # Sort by date (most recent first)
        negative_reviews.sort(key=lambda x: x.created_at, reverse=True)

        return {
            "negative_reviews": [r.model_dump() for r in negative_reviews[:limit]],
            "total_negative": len(negative_reviews),
            "total_reviews": len(reviews),
            "negative_percentage": round(len(negative_reviews) / len(reviews) * 100, 1) if reviews else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
