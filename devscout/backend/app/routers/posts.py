"""API routes for posts."""

import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Post
from ..schemas import PostResponse, PostUpdate, GenerateResponseRequest, StatsResponse, ClientPostBatch
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


@router.delete("/{post_id}")
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a post."""
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    await db.delete(post)
    await db.commit()
    return {"deleted": True}
