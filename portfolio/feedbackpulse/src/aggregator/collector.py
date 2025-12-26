"""Multi-source review collector."""

from typing import List, Optional

from ..models.review import Review, ReviewSource
from ..services.google_reviews import GoogleReviewsClient
from ..services.yelp import YelpClient
from ..services.sentiment import SentimentAnalyzer


class ReviewCollector:
    """Aggregate reviews from multiple sources."""

    def __init__(
        self,
        google_api_key: Optional[str] = None,
        yelp_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None
    ):
        self.google_client = GoogleReviewsClient(google_api_key)
        self.yelp_client = YelpClient(yelp_api_key)
        self.sentiment_analyzer = SentimentAnalyzer(openai_api_key)

    async def collect_all(
        self,
        google_place_id: Optional[str] = None,
        yelp_business_id: Optional[str] = None,
        analyze_sentiment: bool = True
    ) -> List[Review]:
        """Collect reviews from all configured sources.

        Args:
            google_place_id: Google Place ID (optional)
            yelp_business_id: Yelp Business ID (optional)
            analyze_sentiment: Whether to run sentiment analysis

        Returns:
            List of all collected reviews
        """
        all_reviews = []

        # Collect from Google
        if google_place_id:
            try:
                google_reviews = await self.google_client.get_place_reviews(google_place_id)
                all_reviews.extend(google_reviews)
            except Exception as e:
                print(f"Error collecting Google reviews: {e}")

        # Collect from Yelp
        if yelp_business_id:
            try:
                yelp_reviews = await self.yelp_client.get_business_reviews(yelp_business_id)
                all_reviews.extend(yelp_reviews)
            except Exception as e:
                print(f"Error collecting Yelp reviews: {e}")

        # If no IDs provided, get demo data
        if not google_place_id and not yelp_business_id:
            all_reviews.extend(self.google_client._get_demo_reviews())
            all_reviews.extend(self.yelp_client._get_demo_reviews())

        # Analyze sentiment if requested
        if analyze_sentiment:
            for review in all_reviews:
                try:
                    sentiment = await self.sentiment_analyzer.analyze(
                        review_id=review.source_id,
                        text=review.text,
                        rating=review.rating
                    )
                    review.sentiment_score = sentiment.score
                    review.sentiment_label = sentiment.label.value
                    review.keywords = sentiment.keywords
                except Exception as e:
                    print(f"Error analyzing sentiment for review {review.source_id}: {e}")

        return all_reviews

    async def collect_by_source(
        self,
        source: ReviewSource,
        source_id: str,
        analyze_sentiment: bool = True
    ) -> List[Review]:
        """Collect reviews from a specific source.

        Args:
            source: Review source platform
            source_id: Platform-specific identifier
            analyze_sentiment: Whether to run sentiment analysis

        Returns:
            List of reviews from the specified source
        """
        reviews = []

        if source == ReviewSource.GOOGLE:
            reviews = await self.google_client.get_place_reviews(source_id)
        elif source == ReviewSource.YELP:
            reviews = await self.yelp_client.get_business_reviews(source_id)
        else:
            raise ValueError(f"Unsupported source: {source}")

        # Analyze sentiment if requested
        if analyze_sentiment:
            for review in reviews:
                sentiment = await self.sentiment_analyzer.analyze(
                    review_id=review.source_id,
                    text=review.text,
                    rating=review.rating
                )
                review.sentiment_score = sentiment.score
                review.sentiment_label = sentiment.label.value
                review.keywords = sentiment.keywords

        return reviews
