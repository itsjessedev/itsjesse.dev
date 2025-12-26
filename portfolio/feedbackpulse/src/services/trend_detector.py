"""Trend detection and alert service."""

from datetime import datetime, timedelta
from typing import List
from statistics import mean

from ..config import settings
from ..models.review import Review
from ..models.trend import Trend, TrendDirection


class TrendDetector:
    """Detect trends and generate alerts from review data."""

    def analyze_rating_trend(
        self,
        reviews: List[Review],
        window_days: int = None
    ) -> Trend:
        """Analyze rating trends over time.

        Args:
            reviews: List of Review objects with ratings
            window_days: Analysis window in days

        Returns:
            Trend object
        """
        window = window_days or settings.trend_window_days
        now = datetime.now()

        # Split reviews into current and previous periods
        current_period_start = now - timedelta(days=window)
        previous_period_start = now - timedelta(days=window * 2)

        current_reviews = [
            r for r in reviews
            if r.rating and current_period_start <= r.created_at <= now
        ]

        previous_reviews = [
            r for r in reviews
            if r.rating and previous_period_start <= r.created_at < current_period_start
        ]

        # Calculate average ratings
        current_avg = mean([r.rating for r in current_reviews]) if current_reviews else 0
        previous_avg = mean([r.rating for r in previous_reviews]) if previous_reviews else 0

        # Calculate change
        if previous_avg > 0:
            change_percent = ((current_avg - previous_avg) / previous_avg) * 100
        else:
            change_percent = 0

        # Determine direction
        if abs(change_percent) < 5:  # Less than 5% change is stable
            direction = TrendDirection.STABLE
        elif change_percent > 0:
            direction = TrendDirection.IMPROVING
        else:
            direction = TrendDirection.DECLINING

        # Check for alerts
        is_alert = False
        alert_message = ""

        if direction == TrendDirection.DECLINING and abs(change_percent) >= settings.alert_trend_change_percent:
            is_alert = True
            alert_message = f"Alert: Average rating declined by {abs(change_percent):.1f}% in the last {window} days"

        return Trend(
            metric="avg_rating",
            direction=direction,
            current_value=current_avg,
            previous_value=previous_avg,
            change_percent=change_percent,
            period_start=current_period_start,
            period_end=now,
            is_alert=is_alert,
            alert_message=alert_message,
            data_points=len(current_reviews)
        )

    def analyze_sentiment_trend(
        self,
        reviews: List[Review],
        window_days: int = None
    ) -> Trend:
        """Analyze sentiment trends over time.

        Args:
            reviews: List of Review objects with sentiment scores
            window_days: Analysis window in days

        Returns:
            Trend object
        """
        window = window_days or settings.trend_window_days
        now = datetime.now()

        # Split reviews into current and previous periods
        current_period_start = now - timedelta(days=window)
        previous_period_start = now - timedelta(days=window * 2)

        current_reviews = [
            r for r in reviews
            if r.sentiment_score is not None and current_period_start <= r.created_at <= now
        ]

        previous_reviews = [
            r for r in reviews
            if r.sentiment_score is not None and previous_period_start <= r.created_at < current_period_start
        ]

        # Calculate average sentiment
        current_avg = mean([r.sentiment_score for r in current_reviews]) if current_reviews else 0
        previous_avg = mean([r.sentiment_score for r in previous_reviews]) if previous_reviews else 0

        # Calculate change
        if previous_avg > 0:
            change_percent = ((current_avg - previous_avg) / previous_avg) * 100
        else:
            change_percent = 0

        # Determine direction
        if abs(change_percent) < 5:
            direction = TrendDirection.STABLE
        elif change_percent > 0:
            direction = TrendDirection.IMPROVING
        else:
            direction = TrendDirection.DECLINING

        # Check for alerts
        is_alert = False
        alert_message = ""

        if direction == TrendDirection.DECLINING and abs(change_percent) >= settings.alert_trend_change_percent:
            is_alert = True
            alert_message = f"Alert: Sentiment score declined by {abs(change_percent):.1f}% in the last {window} days"

        return Trend(
            metric="sentiment_score",
            direction=direction,
            current_value=current_avg,
            previous_value=previous_avg,
            change_percent=change_percent,
            period_start=current_period_start,
            period_end=now,
            is_alert=is_alert,
            alert_message=alert_message,
            data_points=len(current_reviews)
        )

    def detect_negative_spike(
        self,
        reviews: List[Review],
        days: int = 1
    ) -> tuple[bool, str]:
        """Detect spike in negative reviews.

        Args:
            reviews: List of Review objects
            days: Period to check for spike

        Returns:
            Tuple of (is_alert, alert_message)
        """
        cutoff = datetime.now() - timedelta(days=days)

        recent_negative = [
            r for r in reviews
            if r.created_at >= cutoff and r.sentiment_label == "negative"
        ]

        if len(recent_negative) >= settings.alert_negative_threshold:
            return (
                True,
                f"Alert: {len(recent_negative)} negative reviews detected in the last {days} day(s)"
            )

        return (False, "")

    def get_volume_trend(
        self,
        reviews: List[Review],
        window_days: int = None
    ) -> Trend:
        """Analyze review volume trends.

        Args:
            reviews: List of Review objects
            window_days: Analysis window in days

        Returns:
            Trend object
        """
        window = window_days or settings.trend_window_days
        now = datetime.now()

        current_period_start = now - timedelta(days=window)
        previous_period_start = now - timedelta(days=window * 2)

        current_count = len([
            r for r in reviews
            if current_period_start <= r.created_at <= now
        ])

        previous_count = len([
            r for r in reviews
            if previous_period_start <= r.created_at < current_period_start
        ])

        # Calculate change
        if previous_count > 0:
            change_percent = ((current_count - previous_count) / previous_count) * 100
        else:
            change_percent = 100 if current_count > 0 else 0

        # Determine direction
        if abs(change_percent) < 10:
            direction = TrendDirection.STABLE
        elif change_percent > 0:
            direction = TrendDirection.IMPROVING
        else:
            direction = TrendDirection.DECLINING

        return Trend(
            metric="review_volume",
            direction=direction,
            current_value=float(current_count),
            previous_value=float(previous_count),
            change_percent=change_percent,
            period_start=current_period_start,
            period_end=now,
            is_alert=False,
            alert_message="",
            data_points=current_count
        )
