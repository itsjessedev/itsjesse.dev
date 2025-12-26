"""Keyword extraction service."""

from collections import Counter
from typing import List
import re

from ..config import settings
from ..models.review import Review


class KeywordExtractor:
    """Extract and rank keywords from reviews."""

    def __init__(self):
        # Common stop words to filter out
        self.stop_words = {
            "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
            "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
            "to", "was", "were", "will", "with", "i", "me", "my", "we", "our",
            "you", "your", "they", "them", "their", "this", "these", "those",
        }

    def extract_keywords(
        self,
        reviews: List[Review],
        top_n: int = 10,
        min_frequency: int = None
    ) -> dict[str, int]:
        """Extract top keywords from a list of reviews.

        Args:
            reviews: List of Review objects
            top_n: Number of top keywords to return
            min_frequency: Minimum frequency threshold

        Returns:
            Dictionary of keyword -> frequency
        """
        min_freq = min_frequency or settings.keyword_min_frequency

        # Combine all review text
        all_text = " ".join([review.text.lower() for review in reviews])

        # Extract words (alphanumeric only)
        words = re.findall(r'\b[a-z]+\b', all_text)

        # Filter out stop words and short words
        filtered_words = [
            word for word in words
            if word not in self.stop_words and len(word) > 3
        ]

        # Count frequencies
        word_counts = Counter(filtered_words)

        # Filter by minimum frequency
        filtered_counts = {
            word: count
            for word, count in word_counts.items()
            if count >= min_freq
        }

        # Return top N
        return dict(Counter(filtered_counts).most_common(top_n))

    def extract_phrases(
        self,
        reviews: List[Review],
        phrase_length: int = 2,
        top_n: int = 10
    ) -> dict[str, int]:
        """Extract common phrases (n-grams) from reviews.

        Args:
            reviews: List of Review objects
            phrase_length: Length of phrases (2 = bigrams, 3 = trigrams)
            top_n: Number of top phrases to return

        Returns:
            Dictionary of phrase -> frequency
        """
        phrases = []

        for review in reviews:
            # Tokenize
            words = re.findall(r'\b[a-z]+\b', review.text.lower())

            # Filter stop words
            filtered = [w for w in words if w not in self.stop_words and len(w) > 3]

            # Create n-grams
            for i in range(len(filtered) - phrase_length + 1):
                phrase = " ".join(filtered[i:i + phrase_length])
                phrases.append(phrase)

        # Count and return top phrases
        phrase_counts = Counter(phrases)
        return dict(phrase_counts.most_common(top_n))

    def get_sentiment_keywords(
        self,
        reviews: List[Review],
        sentiment_filter: str = "all"
    ) -> dict[str, int]:
        """Get keywords filtered by sentiment.

        Args:
            reviews: List of Review objects
            sentiment_filter: "positive", "negative", or "all"

        Returns:
            Dictionary of keyword -> frequency
        """
        # Filter reviews by sentiment
        filtered_reviews = reviews

        if sentiment_filter == "positive":
            filtered_reviews = [r for r in reviews if r.sentiment_label == "positive"]
        elif sentiment_filter == "negative":
            filtered_reviews = [r for r in reviews if r.sentiment_label == "negative"]

        return self.extract_keywords(filtered_reviews)
