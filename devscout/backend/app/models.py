"""SQLAlchemy models for DevScout."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, Index
from sqlalchemy.orm import declarative_base, relationship

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

    # Category for organization
    category = Column(String(50))  # freelance, remote_job, bounty, contract

    # Unique constraint on source + source_id
    __table_args__ = (
        Index('ix_prospect_source_source_id', 'source', 'source_id', unique=True),
        {"sqlite_autoincrement": True},
    )


class DismissedItem(Base):
    """Persistently dismissed items (replaces localStorage dismissals)."""

    __tablename__ = "dismissed_items"

    id = Column(Integer, primary_key=True)
    item_type = Column(String(50), nullable=False, index=True)  # reddit_post, linkedin_post, reddit_comment, opportunity
    source = Column(String(50), nullable=False)  # reddit, linkedin, craigslist, hackernews, etc.
    source_id = Column(String(200), nullable=False)
    url = Column(String(500))
    dismissed_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index('ix_dismissed_type_source_id', 'item_type', 'source_id', unique=True),
    )


class ScheduledPost(Base):
    """Scheduled posts for Reddit and LinkedIn."""

    __tablename__ = "scheduled_posts"

    id = Column(Integer, primary_key=True)
    platform = Column(String(20), nullable=False, index=True)  # reddit, linkedin
    subreddit = Column(String(100))  # Reddit only
    title = Column(Text)
    body = Column(Text, nullable=False)
    category = Column(String(50))  # Template category
    status = Column(String(20), default="scheduled", index=True)  # scheduled, published, failed, cancelled
    scheduled_for = Column(DateTime, nullable=False, index=True)
    published_at = Column(DateTime)
    published_url = Column(String(500))
    error_message = Column(Text)  # For failed posts
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LinkedInAuth(Base):
    """LinkedIn OAuth token storage."""

    __tablename__ = "linkedin_auth"

    id = Column(Integer, primary_key=True)
    access_token = Column(Text, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    scope = Column(Text)
    person_id = Column(String(100))  # LinkedIn person URN
    person_name = Column(String(200))  # Display name
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MyComment(Base):
    """Track user's comments across platforms for reply monitoring."""

    __tablename__ = "my_comments"

    id = Column(Integer, primary_key=True)
    platform = Column(String(20), nullable=False, index=True)  # reddit, linkedin
    platform_comment_id = Column(String(100), nullable=False)
    platform_post_id = Column(String(100), nullable=False)
    post_title = Column(Text)
    post_url = Column(String(500), nullable=False)
    comment_url = Column(String(500))
    comment_body = Column(Text)
    subreddit = Column(String(100))  # Reddit only
    commented_at = Column(DateTime)
    last_checked_at = Column(DateTime)
    unread_reply_count = Column(Integer, default=0)
    status = Column(String(20), default="active", index=True)  # active, archived, dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to replies
    replies = relationship("CommentReply", back_populates="my_comment", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_my_comment_platform_id', 'platform', 'platform_comment_id', unique=True),
    )


class CommentReply(Base):
    """Replies to user's comments."""

    __tablename__ = "comment_replies"

    id = Column(Integer, primary_key=True)
    my_comment_id = Column(Integer, ForeignKey("my_comments.id", ondelete="CASCADE"), nullable=False, index=True)
    platform_reply_id = Column(String(100), nullable=False)
    author = Column(String(100))
    author_url = Column(String(500))
    body = Column(Text)
    replied_at = Column(DateTime)
    score = Column(Integer, default=0)
    permalink = Column(String(500))
    has_user_reply = Column(Boolean, default=False)  # Has user responded to this?
    is_read = Column(Boolean, default=False, index=True)
    is_dismissed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to parent comment
    my_comment = relationship("MyComment", back_populates="replies")

    __table_args__ = (
        Index('ix_comment_reply_unique', 'my_comment_id', 'platform_reply_id', unique=True),
    )
