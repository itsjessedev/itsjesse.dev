"""API routes for posts."""

import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Post
from ..schemas import PostResponse, PostUpdate, GenerateResponseRequest, StatsResponse, ClientPostBatch, ReplyInfo
from ..services import get_fetcher, get_generator

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("/", response_model=list[PostResponse])
async def list_posts(
    status: Optional[str] = Query(None, description="Filter by status: new, skipped, responded"),
    subreddit: Optional[str] = Query(None, description="Filter by subreddit"),
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List posts with optional filters."""
    query = select(Post).order_by(Post.relevance_score.desc(), Post.discovered_at.desc())

    if status:
        query = query.where(Post.status == status)
    if subreddit:
        query = query.where(Post.subreddit == subreddit)

    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get dashboard statistics."""
    # Total counts
    total = await db.scalar(select(func.count(Post.id)))
    new_count = await db.scalar(select(func.count(Post.id)).where(Post.status == "new"))
    responded = await db.scalar(select(func.count(Post.id)).where(Post.status == "responded"))
    skipped = await db.scalar(select(func.count(Post.id)).where(Post.status == "skipped"))

    # Posts by subreddit
    subreddit_query = select(Post.subreddit, func.count(Post.id)).group_by(Post.subreddit)
    result = await db.execute(subreddit_query)
    by_subreddit = {row[0]: row[1] for row in result.all()}

    return StatsResponse(
        total_posts=total or 0,
        new_posts=new_count or 0,
        responded_posts=responded or 0,
        skipped_posts=skipped or 0,
        posts_by_subreddit=by_subreddit,
    )


@router.post("/submit")
async def submit_posts(batch: ClientPostBatch, db: AsyncSession = Depends(get_db)):
    """Receive posts from client-side fetching."""
    added = 0
    for post_data in batch.posts:
        # Check if already exists
        existing = await db.scalar(
            select(Post).where(Post.reddit_id == post_data.reddit_id)
        )
        if existing:
            continue

        # Create new post
        post = Post(
            reddit_id=post_data.reddit_id,
            subreddit=post_data.subreddit,
            title=post_data.title,
            body=post_data.body,
            url=post_data.url,
            author=post_data.author,
            score=post_data.score,
            num_comments=post_data.num_comments,
            created_utc=datetime.utcfromtimestamp(post_data.created_utc),
            relevance_score=post_data.relevance_score,
            keywords_matched=json.dumps(post_data.keywords_matched),
        )
        db.add(post)
        added += 1

    await db.commit()
    return {"received": len(batch.posts), "added": added}


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific post."""
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.patch("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    update: PostUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a post's status or response."""
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if update.status:
        post.status = update.status
        if update.status == "responded":
            post.responded_at = datetime.utcnow()

    if update.suggested_response:
        post.suggested_response = update.suggested_response

    if update.my_comment_url:
        post.my_comment_url = update.my_comment_url

    await db.commit()
    await db.refresh(post)
    return post


@router.post("/{post_id}/generate")
async def generate_response(
    post_id: int,
    request: Optional[GenerateResponseRequest] = None,
    db: AsyncSession = Depends(get_db),
):
    """Generate an AI response for a post."""
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    generator = get_generator()
    custom_context = request.custom_context if request else None

    response = await generator.generate(
        title=post.title,
        body=post.body,
        subreddit=post.subreddit,
        custom_context=custom_context,
    )

    if not response:
        raise HTTPException(status_code=500, detail="Failed to generate response")

    # Save the response
    post.suggested_response = response
    await db.commit()

    return {"response": response}


class GenerateReplyRequest(BaseModel):
    """Request to generate a reply response."""
    subreddit: str
    my_comment: str
    their_reply: str


@router.post("/generate-reply")
async def generate_reply_response(request: GenerateReplyRequest):
    """Generate an AI response to a reply to user's comment."""
    generator = get_generator()

    response = await generator.generate_reply(
        subreddit=request.subreddit,
        my_comment=request.my_comment,
        their_reply=request.their_reply,
    )

    if not response:
        raise HTTPException(status_code=500, detail="Failed to generate reply")

    return {"response": response}


class GenerateEngagePostRequest(BaseModel):
    """Request to generate an engagement post."""
    subreddit: str
    idea_template: str
    category: str


@router.post("/generate-engage")
async def generate_engage_post(request: GenerateEngagePostRequest):
    """Generate an engagement post for starting a discussion on Reddit."""
    generator = get_generator()

    response = await generator.generate_engage_post(
        subreddit=request.subreddit,
        idea_template=request.idea_template,
        category=request.category,
    )

    if not response:
        raise HTTPException(status_code=500, detail="Failed to generate engage post")

    return {"response": response}


class GenerateNewsResponseRequest(BaseModel):
    """Request to generate a response for a news post."""
    title: str
    body: Optional[str] = None
    source: str  # e.g., "HN:Ask", "Lobsters:programming", "DEV:webdev"


@router.post("/generate-news")
async def generate_news_response(request: GenerateNewsResponseRequest):
    """Generate an AI response for a news post (HN, Lobsters, Dev.to, etc)."""
    generator = get_generator()

    response = await generator.generate(
        title=request.title,
        body=request.body,
        subreddit=request.source,  # Uses source as subreddit for context
    )

    if not response:
        raise HTTPException(status_code=500, detail="Failed to generate response")

    return {"response": response}


@router.delete("/clear/stale")
async def clear_stale_posts(db: AsyncSession = Depends(get_db)):
    """Delete all non-responded posts to start fresh."""
    from sqlalchemy import delete

    result = await db.execute(
        delete(Post).where(Post.status != "responded")
    )
    await db.commit()
    return {"deleted": result.rowcount}


@router.get("/tracked", response_model=list[PostResponse])
async def get_tracked_posts(db: AsyncSession = Depends(get_db)):
    """Get all posts with tracked comment URLs for reply checking."""
    query = (
        select(Post)
        .where(Post.my_comment_url.isnot(None))
        .order_by(Post.responded_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{post_id}/update-replies")
async def update_reply_count(
    post_id: int,
    count: int = Query(..., description="Number of unread replies"),
    db: AsyncSession = Depends(get_db),
):
    """Update the unread reply count for a post (called after client-side check)."""
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.unread_replies = count
    post.last_reply_check = datetime.utcnow()
    await db.commit()
    return {"updated": True, "unread_replies": count}


@router.post("/{post_id}/mark-read")
async def mark_replies_read(
    post_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Mark all replies as read for a post."""
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.unread_replies = 0
    post.last_reply_check = datetime.utcnow()
    await db.commit()
    return {"updated": True}


@router.delete("/{post_id}")
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a post."""
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    await db.delete(post)
    await db.commit()
    return {"deleted": True}


# Reddit JSON Proxy (to bypass CORS)
import httpx
import re

@router.get("/reddit-proxy/{post_id}")
async def proxy_reddit_post(post_id: str):
    """Proxy Reddit JSON API to bypass CORS restrictions."""
    # Validate post_id format (alphanumeric only)
    if not re.match(r'^[a-zA-Z0-9]+$', post_id):
        raise HTTPException(status_code=400, detail="Invalid post ID format")

    url = f"https://www.reddit.com/comments/{post_id}.json?limit=500&depth=10"

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "application/json, text/html,application/xhtml+xml",
                    "Accept-Language": "en-US,en;q=0.9",
                }
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Reddit API error: {response.status_code}"
                )

            return response.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Reddit API timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach Reddit: {str(e)}")
