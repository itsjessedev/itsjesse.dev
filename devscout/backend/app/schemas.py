"""Pydantic schemas for API requests/responses."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PostBase(BaseModel):
    """Base post schema."""

    reddit_id: str
    subreddit: str
    title: str
    body: Optional[str] = None
    url: str
    author: str
    score: int = 0
    num_comments: int = 0
    created_utc: datetime


class PostCreate(PostBase):
    """Schema for creating a post."""

    pass


class PostResponse(PostBase):
    """Schema for post API responses."""

    id: int
    relevance_score: float
    keywords_matched: Optional[str] = None
    suggested_response: Optional[str] = None
    status: str
    responded_at: Optional[datetime] = None
    discovered_at: datetime
    my_comment_url: Optional[str] = None
    last_reply_check: Optional[datetime] = None
    unread_replies: int = 0

    class Config:
        from_attributes = True


class PostUpdate(BaseModel):
    """Schema for updating a post."""

    status: Optional[str] = None
    suggested_response: Optional[str] = None
    my_comment_url: Optional[str] = None


class ReplyInfo(BaseModel):
    """Info about a reply to user's comment."""

    id: str
    author: str
    body: str
    created_utc: datetime
    score: int
    permalink: str


class GenerateResponseRequest(BaseModel):
    """Request to generate a response for a post."""

    post_id: int
    custom_context: Optional[str] = None


class StatsResponse(BaseModel):
    """Response for dashboard stats."""

    total_posts: int
    new_posts: int
    responded_posts: int
    skipped_posts: int
    posts_by_subreddit: dict


class ClientPost(BaseModel):
    """Post submitted from client-side fetching."""

    reddit_id: str
    subreddit: str
    title: str
    body: Optional[str] = None
    url: str
    author: str
    score: int = 0
    num_comments: int = 0
    created_utc: float  # Unix timestamp from Reddit
    keywords_matched: list[str] = []
    relevance_score: float = 0.0


class ClientPostBatch(BaseModel):
    """Batch of posts from client-side fetching."""

    posts: list[ClientPost]
