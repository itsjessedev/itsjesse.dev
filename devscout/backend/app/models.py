"""SQLAlchemy models for Reddit Scout."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Post(Base):
    """A Reddit post that was found and analyzed."""

    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    reddit_id = Column(String(20), unique=True, index=True)
    subreddit = Column(String(50), index=True)
    title = Column(Text)
    body = Column(Text)
    url = Column(String(500))
    author = Column(String(50))
    score = Column(Integer, default=0)
    num_comments = Column(Integer, default=0)
    created_utc = Column(DateTime)

    # Analysis
    relevance_score = Column(Float, default=0.0)
    keywords_matched = Column(Text)  # JSON array
    suggested_response = Column(Text)

    # Status
    status = Column(String(20), default="new")  # new, skipped, responded
    responded_at = Column(DateTime, nullable=True)

    # Timestamps
    discovered_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ResponseTemplate(Base):
    """Saved response templates for common topics."""

    __tablename__ = "response_templates"

    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    topic = Column(String(100))
    template = Column(Text)
    use_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
