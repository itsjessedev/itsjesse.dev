"""Google Places API client for fetching reviews."""

from typing import Optional
from datetime import datetime
import httpx

from ..config import settings
from ..models.review import Review, ReviewSource


class GoogleReviewsClient:
    """Client for fetching Google Places reviews."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.google_places_api_key
        self.base_url = "https://maps.googleapis.com/maps/api/place"

    async def get_place_reviews(self, place_id: str) -> list[Review]:
        """Fetch reviews for a specific place.

        Args:
            place_id: Google Place ID

        Returns:
            List of Review objects
        """
        if settings.demo_mode or not self.api_key:
            return self._get_demo_reviews()

        async with httpx.AsyncClient() as client:
            # Get place details including reviews
            url = f"{self.base_url}/details/json"
            params = {
                "place_id": place_id,
                "fields": "name,rating,reviews",
                "key": self.api_key
            }

            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data.get("status") != "OK":
                raise ValueError(f"Google API error: {data.get('status')}")

            result = data.get("result", {})
            reviews_data = result.get("reviews", [])

            return [
                Review(
                    source=ReviewSource.GOOGLE,
                    source_id=f"google_{review['time']}",
                    author=review.get("author_name", "Anonymous"),
                    rating=float(review.get("rating", 0)),
                    text=review.get("text", ""),
                    created_at=datetime.fromtimestamp(review.get("time", 0)),
                    location=result.get("name")
                )
                for review in reviews_data
            ]

    def _get_demo_reviews(self) -> list[Review]:
        """Return demo reviews for testing."""
        return [
            Review(
                source=ReviewSource.GOOGLE,
                source_id="demo_google_1",
                author="Sarah Johnson",
                rating=5.0,
                text="Absolutely amazing experience! The staff was incredibly helpful and the service was top-notch. Will definitely come back!",
                created_at=datetime(2024, 1, 15, 10, 30),
                location="Demo Location"
            ),
            Review(
                source=ReviewSource.GOOGLE,
                source_id="demo_google_2",
                author="Mike Chen",
                rating=4.0,
                text="Pretty good overall. Wait time was a bit long but the quality made up for it. Would recommend.",
                created_at=datetime(2024, 1, 14, 14, 20),
                location="Demo Location"
            ),
            Review(
                source=ReviewSource.GOOGLE,
                source_id="demo_google_3",
                author="Jennifer Smith",
                rating=2.0,
                text="Disappointed with the service. Staff seemed disorganized and the wait was unacceptable. Not what I expected.",
                created_at=datetime(2024, 1, 13, 9, 15),
                location="Demo Location"
            ),
            Review(
                source=ReviewSource.GOOGLE,
                source_id="demo_google_4",
                author="David Lee",
                rating=5.0,
                text="Outstanding! Best experience I've had in years. Everything was perfect from start to finish.",
                created_at=datetime(2024, 1, 12, 16, 45),
                location="Demo Location"
            ),
            Review(
                source=ReviewSource.GOOGLE,
                source_id="demo_google_5",
                author="Amanda Brown",
                rating=3.0,
                text="Average experience. Nothing special but nothing terrible either. It was okay.",
                created_at=datetime(2024, 1, 11, 11, 0),
                location="Demo Location"
            ),
        ]
