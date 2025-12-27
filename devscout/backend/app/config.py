"""Application configuration from environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""

    # Database
    database_url: str = "sqlite+aiosqlite:///./reddit_scout.db"

    # OpenRouter API (reuse from DealScout)
    openrouter_api_key: str = ""

    # Subreddits to monitor (comma-separated)
    target_subreddits: str = "webdev,programming,learnprogramming,automation,smallbusiness,Entrepreneur,freelance,SaaS,startups,zapier,n8n"

    # Keywords to look for in posts
    target_keywords: str = "integrate,automate,automation,API,webhook,sync,help with,how do I,need advice,looking for,struggle,stuck"

    # Post filters
    max_post_age_hours: int = 24
    max_comments: int = 15
    min_score: int = 1

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
