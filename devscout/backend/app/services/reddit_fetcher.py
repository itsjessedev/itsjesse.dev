"""Reddit post fetcher using public JSON endpoints (no API key needed)."""

import asyncio
from datetime import datetime, timedelta
from typing import Optional

import httpx

from ..config import get_settings

settings = get_settings()

# User agent to avoid blocks
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


class RedditFetcher:
    """Fetches and filters relevant posts from Reddit using public JSON endpoints."""

    def __init__(self):
        self.subreddits = [s.strip() for s in settings.target_subreddits.split(",")]
        self.keywords = [k.strip().lower() for k in settings.target_keywords.split(",")]

    def _matches_keywords(self, text: str) -> list[str]:
        """Check if text contains any target keywords."""
        text_lower = text.lower()
        matched = []
        for keyword in self.keywords:
            if keyword in text_lower:
                matched.append(keyword)
        return matched

    def _calculate_relevance(self, post: dict, matched_keywords: list[str]) -> float:
        """Calculate relevance score for a post."""
        score = 0.0

        # Keyword matches (up to 40 points)
        score += min(len(matched_keywords) * 10, 40)

        # Question indicators (20 points)
        title_lower = post["title"].lower()
        if any(q in title_lower for q in ["how", "help", "advice", "need", "looking for", "?"]):
            score += 20

        # Low comment count = opportunity (20 points max)
        num_comments = post.get("num_comments", 0)
        if num_comments <= 3:
            score += 20
        elif num_comments <= 7:
            score += 10
        elif num_comments <= 15:
            score += 5

        # Recency bonus (20 points max)
        created_utc = post.get("created_utc", 0)
        post_age_hours = (datetime.utcnow() - datetime.utcfromtimestamp(created_utc)).total_seconds() / 3600
        if post_age_hours <= 2:
            score += 20
        elif post_age_hours <= 6:
            score += 15
        elif post_age_hours <= 12:
            score += 10
        elif post_age_hours <= 24:
            score += 5

        return score

    async def _fetch_subreddit(self, client: httpx.AsyncClient, subreddit: str) -> list[dict]:
        """Fetch posts from a single subreddit."""
        posts = []
        cutoff_time = datetime.utcnow() - timedelta(hours=settings.max_post_age_hours)

        try:
            # Fetch new posts
            url = f"https://www.reddit.com/r/{subreddit}/new.json?limit=25"
            response = await client.get(url)

            if response.status_code != 200:
                print(f"Error fetching r/{subreddit}: {response.status_code}")
                return []

            data = response.json()
            children = data.get("data", {}).get("children", [])

            for child in children:
                post = child.get("data", {})

                # Skip old posts
                created_utc = post.get("created_utc", 0)
                post_time = datetime.utcfromtimestamp(created_utc)
                if post_time < cutoff_time:
                    continue

                # Skip posts with too many comments
                if post.get("num_comments", 0) > settings.max_comments:
                    continue

                # Skip low-score posts (might be spam)
                if post.get("score", 0) < settings.min_score:
                    continue

                # Skip non-self posts (links, images, etc.)
                if not post.get("is_self", False):
                    continue

                # Check for keyword matches
                full_text = f"{post.get('title', '')} {post.get('selftext', '')}"
                matched = self._matches_keywords(full_text)

                if matched:
                    relevance = self._calculate_relevance(post, matched)
                    posts.append({
                        "reddit_id": post.get("id", ""),
                        "subreddit": subreddit,
                        "title": post.get("title", ""),
                        "body": post.get("selftext", "")[:2000] if post.get("selftext") else None,
                        "url": f"https://reddit.com{post.get('permalink', '')}",
                        "author": post.get("author", "[deleted]"),
                        "score": post.get("score", 0),
                        "num_comments": post.get("num_comments", 0),
                        "created_utc": post_time,
                        "relevance_score": relevance,
                        "keywords_matched": matched,
                    })

        except Exception as e:
            print(f"Error fetching r/{subreddit}: {e}")

        return posts

    async def fetch_posts(self) -> list[dict]:
        """Fetch relevant posts from all target subreddits."""
        all_posts = []

        async with httpx.AsyncClient(
            headers={"User-Agent": USER_AGENT},
            timeout=30.0,
            follow_redirects=True,
        ) as client:
            # Fetch subreddits with small delay between each to avoid rate limits
            for subreddit in self.subreddits:
                posts = await self._fetch_subreddit(client, subreddit)
                all_posts.extend(posts)
                await asyncio.sleep(0.5)  # Be nice to Reddit

        # Sort by relevance
        all_posts.sort(key=lambda x: x["relevance_score"], reverse=True)
        return all_posts


# Singleton
_fetcher: Optional[RedditFetcher] = None


def get_fetcher() -> RedditFetcher:
    """Get or create fetcher instance."""
    global _fetcher
    if _fetcher is None:
        _fetcher = RedditFetcher()
    return _fetcher
