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

    # Reply tracking
    my_comment_url = Column(String(500), nullable=True)  # URL to user's comment
    last_reply_check = Column(DateTime, nullable=True)
    unread_replies = Column(Integer, default=0)

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


class Prospect(Base):
    """A prospect/lead found and scored by AI."""

    __tablename__ = "prospects"

    id = Column(Integer, primary_key=True)

    # Source identification
    source = Column(String(50), nullable=False, index=True)  # reddit, hackernews, linkedin, etc.
    source_id = Column(String(100), nullable=False)  # Platform-specific ID
    platform_detail = Column(String(100))  # Subreddit, city, etc.

    # Post content
    title = Column(Text)
    body = Column(Text)
    url = Column(String(500), nullable=False)
    author = Column(String(100))
    author_url = Column(String(500))
    posted_at = Column(DateTime)

    # AI scoring (stored as JSON string)
    ai_score = Column(Text)  # Full JSON response from AI
    is_lead = Column(Boolean, default=False, index=True)
    confidence = Column(Float, default=0.0)
    fit_score = Column(Integer, default=0, index=True)
    urgency = Column(String(50))
    budget_signal = Column(String(50))
    lead_type = Column(String(50))
    key_need = Column(Text)
    services_needed = Column(Text)  # JSON array
    contact_info = Column(String(500))
    company_name = Column(String(200))
    recommended_approach = Column(Text)

    # Lead tracking
    status = Column(String(50), default="new", index=True)  # new, reviewing, contacted, replied, converted, dismissed
    contacted_at = Column(DateTime)
    replied_at = Column(DateTime)
    converted_at = Column(DateTime)
    notes = Column(Text)

    # Metadata
    discovered_at = Column(DateTime, default=datetime.utcnow, index=True)
    last_scored_at = Column(DateTime)

    # Unique constraint on source + source_id
    __table_args__ = (
        # Create unique index on source + source_id
        {"sqlite_autoincrement": True},
    )
