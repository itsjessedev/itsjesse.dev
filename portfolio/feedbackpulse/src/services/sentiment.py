"""Sentiment analysis service with OpenAI and fallback."""

from typing import Optional
import re
from openai import AsyncOpenAI

from ..config import settings
from ..models.sentiment import SentimentAnalysis, SentimentScore


class SentimentAnalyzer:
    """Sentiment analyzer with OpenAI and keyword-based fallback."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.openai_api_key
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

        # Keyword lists for fallback analysis
        self.positive_keywords = {
            "excellent", "amazing", "fantastic", "outstanding", "wonderful",
            "great", "awesome", "perfect", "love", "best", "incredible",
            "superb", "exceptional", "brilliant", "highly recommend", "impressed"
        }

        self.negative_keywords = {
            "terrible", "horrible", "awful", "worst", "poor", "bad",
            "disappointing", "disappointed", "unacceptable", "rude",
            "slow", "waste", "never again", "avoid", "disgrace", "pathetic"
        }

    async def analyze(self, review_id: str, text: str, rating: Optional[float] = None) -> SentimentAnalysis:
        """Analyze sentiment of review text.

        Args:
            review_id: Review identifier
            text: Review text to analyze
            rating: Optional star rating (1-5)

        Returns:
            SentimentAnalysis object
        """
        # Try OpenAI if available and not in demo mode
        if self.client and not settings.demo_mode:
            try:
                return await self._analyze_with_openai(review_id, text, rating)
            except Exception as e:
                print(f"OpenAI analysis failed, using fallback: {e}")

        # Use keyword-based fallback
        return self._analyze_with_keywords(review_id, text, rating)

    async def _analyze_with_openai(
        self,
        review_id: str,
        text: str,
        rating: Optional[float]
    ) -> SentimentAnalysis:
        """Analyze sentiment using OpenAI API."""
        prompt = f"""Analyze the sentiment of this review and provide:
1. Overall sentiment score (0.0 = very negative, 1.0 = very positive)
2. Sentiment label (positive/neutral/negative)
3. Confidence score (0.0 - 1.0)
4. Key keywords (3-5 words)
5. Main topics discussed
6. Detected emotions

Review: "{text}"
{"Star Rating: " + str(rating) if rating else ""}

Return JSON with: score, label, confidence, keywords, topics, emotions"""

        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a sentiment analysis expert. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
        )

        # Parse response (simplified - would need proper JSON parsing)
        content = response.choices[0].message.content

        # For production, parse JSON properly
        # This is simplified for demonstration
        score = 0.7 if "positive" in content.lower() else 0.3
        label = SentimentScore.POSITIVE if score > 0.6 else SentimentScore.NEGATIVE

        return SentimentAnalysis(
            review_id=review_id,
            score=score,
            label=label,
            confidence=0.85,
            keywords=self._extract_keywords(text),
            topics=["customer_service", "quality"],
            emotions=["satisfied"] if score > 0.6 else ["disappointed"]
        )

    def _analyze_with_keywords(
        self,
        review_id: str,
        text: str,
        rating: Optional[float]
    ) -> SentimentAnalysis:
        """Analyze sentiment using keyword matching (fallback)."""
        text_lower = text.lower()

        # Count positive and negative keywords
        positive_count = sum(1 for word in self.positive_keywords if word in text_lower)
        negative_count = sum(1 for word in self.negative_keywords if word in text_lower)

        # Factor in rating if available
        rating_score = 0.5
        if rating is not None:
            rating_score = (rating - 1) / 4  # Normalize 1-5 to 0-1

        # Calculate sentiment score
        if positive_count + negative_count > 0:
            keyword_score = positive_count / (positive_count + negative_count)
            # Weight: 60% keywords, 40% rating
            score = (keyword_score * 0.6) + (rating_score * 0.4)
        else:
            # No keywords found, rely on rating
            score = rating_score

        # Determine label
        if score >= settings.sentiment_threshold_positive:
            label = SentimentScore.POSITIVE
        elif score <= settings.sentiment_threshold_negative:
            label = SentimentScore.NEGATIVE
        else:
            label = SentimentScore.NEUTRAL

        # Calculate confidence based on signal strength
        confidence = min(0.9, 0.5 + (positive_count + negative_count) * 0.1)

        return SentimentAnalysis(
            review_id=review_id,
            score=score,
            label=label,
            confidence=confidence,
            keywords=self._extract_keywords(text),
            positive_score=positive_count / max(1, positive_count + negative_count),
            negative_score=negative_count / max(1, positive_count + negative_count),
            topics=self._extract_topics(text),
            emotions=self._detect_emotions(text, score)
        )

    def _extract_keywords(self, text: str) -> list[str]:
        """Extract important keywords from text."""
        # Simple keyword extraction (would use NLP in production)
        text_lower = text.lower()
        keywords = []

        # Check for positive keywords
        for word in self.positive_keywords:
            if word in text_lower:
                keywords.append(word)

        # Check for negative keywords
        for word in self.negative_keywords:
            if word in text_lower:
                keywords.append(word)

        return keywords[:5]  # Return top 5

    def _extract_topics(self, text: str) -> list[str]:
        """Extract main topics from text."""
        text_lower = text.lower()
        topics = []

        topic_keywords = {
            "customer_service": ["staff", "service", "help", "support", "employee"],
            "quality": ["quality", "product", "item", "material"],
            "price": ["price", "cost", "expensive", "cheap", "value"],
            "wait_time": ["wait", "slow", "quick", "fast", "time"],
            "cleanliness": ["clean", "dirty", "messy", "neat"],
        }

        for topic, keywords in topic_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                topics.append(topic)

        return topics

    def _detect_emotions(self, text: str, score: float) -> list[str]:
        """Detect emotions from text and sentiment score."""
        emotions = []

        if score > 0.7:
            emotions.extend(["happy", "satisfied", "delighted"])
        elif score < 0.3:
            emotions.extend(["frustrated", "disappointed", "angry"])
        else:
            emotions.append("neutral")

        return emotions[:3]
