"""Tests for sentiment analysis."""

import pytest
from datetime import datetime

from src.services.sentiment import SentimentAnalyzer
from src.models.sentiment import SentimentScore


@pytest.fixture
def analyzer():
    """Create sentiment analyzer instance."""
    return SentimentAnalyzer()


@pytest.mark.asyncio
async def test_positive_sentiment(analyzer):
    """Test positive sentiment detection."""
    result = await analyzer.analyze(
        review_id="test_1",
        text="This is absolutely amazing! Great service and wonderful experience!",
        rating=5.0
    )

    assert result.label == SentimentScore.POSITIVE
    assert result.score > 0.6
    assert result.confidence > 0.0
    assert len(result.keywords) > 0


@pytest.mark.asyncio
async def test_negative_sentiment(analyzer):
    """Test negative sentiment detection."""
    result = await analyzer.analyze(
        review_id="test_2",
        text="Terrible experience. Horrible service and very disappointed.",
        rating=1.0
    )

    assert result.label == SentimentScore.NEGATIVE
    assert result.score < 0.4
    assert result.confidence > 0.0


@pytest.mark.asyncio
async def test_neutral_sentiment(analyzer):
    """Test neutral sentiment detection."""
    result = await analyzer.analyze(
        review_id="test_3",
        text="It was okay. Nothing special but not bad either.",
        rating=3.0
    )

    assert result.label == SentimentScore.NEUTRAL
    assert 0.3 <= result.score <= 0.7


@pytest.mark.asyncio
async def test_keyword_extraction(analyzer):
    """Test keyword extraction."""
    result = await analyzer.analyze(
        review_id="test_4",
        text="The staff was excellent and the quality was outstanding. Highly recommend!",
        rating=5.0
    )

    assert len(result.keywords) > 0
    assert any(kw in ["excellent", "outstanding"] for kw in result.keywords)


def test_extract_topics(analyzer):
    """Test topic extraction."""
    topics = analyzer._extract_topics(
        "The staff was very helpful and the service was quick."
    )

    assert "customer_service" in topics
    assert "wait_time" in topics
