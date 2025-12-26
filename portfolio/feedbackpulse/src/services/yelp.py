"""Yelp API client for fetching reviews."""

from typing import Optional
from datetime import datetime
import httpx

from ..config import settings
from ..models.review import Review, ReviewSource


class YelpClient:
    """Client for fetching Yelp reviews."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.yelp_api_key
        self.base_url = "https://api.yelp.com/v3"

    async def get_business_reviews(self, business_id: str) -> list[Review]:
        """Fetch reviews for a specific business.

        Args:
            business_id: Yelp Business ID

        Returns:
            List of Review objects
        """
        if settings.demo_mode or not self.api_key:
            return self._get_demo_reviews()

        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/businesses/{business_id}/reviews"
            headers = {"Authorization": f"Bearer {self.api_key}"}

            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()

            reviews_data = data.get("reviews", [])

            return [
                Review(
                    source=ReviewSource.YELP,
                    source_id=review.get("id", ""),
                    author=review.get("user", {}).get("name", "Anonymous"),
                    rating=float(review.get("rating", 0)),
                    text=review.get("text", ""),
                    created_at=datetime.fromisoformat(
                        review.get("time_created", "").replace("Z", "+00:00")
                    ),
                )
                for review in reviews_data
            ]

    def _get_demo_reviews(self) -> list[Review]:
        """Return demo reviews for testing."""
        return [
            Review(
                source=ReviewSource.YELP,
                source_id="demo_yelp_1",
                author="Robert Martinez",
                rating=5.0,
                text="Fantastic place! Great atmosphere and excellent customer service. Highly recommended!",
                created_at=datetime(2024, 1, 16, 13, 20),
            ),
            Review(
                source=ReviewSource.YELP,
                source_id="demo_yelp_2",
                author="Lisa Wang",
                rating=4.0,
                text="Good experience overall. A few minor issues but nothing major. Would visit again.",
                created_at=datetime(2024, 1, 15, 18, 30),
            ),
            Review(
                source=ReviewSource.YELP,
                source_id="demo_yelp_3",
                author="Tom Anderson",
                rating=1.0,
                text="Terrible experience. Rude staff, long wait, and poor quality. Will not be returning.",
                created_at=datetime(2024, 1, 14, 20, 10),
            ),
        ]
