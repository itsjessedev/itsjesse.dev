"""API routes for comment tracking."""

from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import MyComment, CommentReply

router = APIRouter(prefix="/api/comments", tags=["comments"])


class CreateComment(BaseModel):
    """Request to track a new comment."""
    platform: str  # reddit, linkedin
    platform_comment_id: str
    platform_post_id: str
    post_title: Optional[str] = None
    post_url: str
    comment_url: Optional[str] = None
    comment_body: Optional[str] = None
    subreddit: Optional[str] = None  # Reddit only
    commented_at: Optional[datetime] = None


class CommentReplyResponse(BaseModel):
    """Response for a comment reply."""
    id: int
    platform_reply_id: str
    author: Optional[str]
    author_url: Optional[str]
    body: Optional[str]
    replied_at: Optional[datetime]
    score: int
    permalink: Optional[str]
    has_user_reply: bool
    is_read: bool
    is_dismissed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MyCommentResponse(BaseModel):
    """Response for a tracked comment."""
    id: int
    platform: str
    platform_comment_id: str
    platform_post_id: str
    post_title: Optional[str]
    post_url: str
    comment_url: Optional[str]
    comment_body: Optional[str]
    subreddit: Optional[str]
    commented_at: Optional[datetime]
    last_checked_at: Optional[datetime]
    unread_reply_count: int
    status: str
    created_at: datetime
    replies: list[CommentReplyResponse] = []

    class Config:
        from_attributes = True


class AddReplyRequest(BaseModel):
    """Request to add a reply to a tracked comment."""
    platform_reply_id: str
    author: Optional[str] = None
    author_url: Optional[str] = None
    body: Optional[str] = None
    replied_at: Optional[datetime] = None
    score: int = 0
    permalink: Optional[str] = None


@router.post("/", response_model=MyCommentResponse)
async def track_comment(request: CreateComment, db: AsyncSession = Depends(get_db)):
    """Start tracking a comment for replies."""
    # Check if already tracking
    existing = await db.scalar(
        select(MyComment).where(
            MyComment.platform == request.platform,
            MyComment.platform_comment_id == request.platform_comment_id
        )
    )
    if existing:
        return existing

    comment = MyComment(
        platform=request.platform,
        platform_comment_id=request.platform_comment_id,
        platform_post_id=request.platform_post_id,
        post_title=request.post_title,
        post_url=request.post_url,
        comment_url=request.comment_url,
        comment_body=request.comment_body,
        subreddit=request.subreddit,
        commented_at=request.commented_at or datetime.utcnow(),
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


@router.get("/", response_model=list[MyCommentResponse])
async def list_comments(
    platform: Optional[str] = Query(None, description="Filter by platform"),
    status: Optional[str] = Query(None, description="Filter by status"),
    has_unread: Optional[bool] = Query(None, description="Filter to only those with unread replies"),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List tracked comments."""
    query = select(MyComment).options(selectinload(MyComment.replies)).order_by(
        MyComment.unread_reply_count.desc(),
        MyComment.last_checked_at.desc().nulls_last()
    )

    if platform:
        query = query.where(MyComment.platform == platform)
    if status:
        query = query.where(MyComment.status == status)
    if has_unread:
        query = query.where(MyComment.unread_reply_count > 0)

    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().unique().all()


@router.get("/unread-count")
async def get_unread_count(
    platform: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get total unread reply count across all comments."""
    query = select(func.sum(MyComment.unread_reply_count)).where(MyComment.status == "active")

    if platform:
        query = query.where(MyComment.platform == platform)

    total = await db.scalar(query)
    return {"unread_count": total or 0}


@router.get("/{comment_id}", response_model=MyCommentResponse)
async def get_comment(comment_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific tracked comment with replies."""
    result = await db.execute(
        select(MyComment).options(selectinload(MyComment.replies)).where(MyComment.id == comment_id)
    )
    comment = result.scalars().first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


@router.get("/{comment_id}/replies", response_model=list[CommentReplyResponse])
async def get_replies(
    comment_id: int,
    include_dismissed: bool = Query(False, description="Include dismissed replies"),
    db: AsyncSession = Depends(get_db),
):
    """Get replies to a specific comment."""
    query = select(CommentReply).where(CommentReply.my_comment_id == comment_id)

    if not include_dismissed:
        query = query.where(CommentReply.is_dismissed == False)

    query = query.order_by(CommentReply.replied_at.desc().nulls_last())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{comment_id}/replies")
async def add_replies(
    comment_id: int,
    replies: list[AddReplyRequest],
    db: AsyncSession = Depends(get_db),
):
    """Add replies to a tracked comment (called by reply checker)."""
    comment = await db.get(MyComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    added = 0
    for reply_data in replies:
        # Check if reply already exists
        existing = await db.scalar(
            select(CommentReply).where(
                CommentReply.my_comment_id == comment_id,
                CommentReply.platform_reply_id == reply_data.platform_reply_id
            )
        )
        if existing:
            continue

        reply = CommentReply(
            my_comment_id=comment_id,
            platform_reply_id=reply_data.platform_reply_id,
            author=reply_data.author,
            author_url=reply_data.author_url,
            body=reply_data.body,
            replied_at=reply_data.replied_at,
            score=reply_data.score,
            permalink=reply_data.permalink,
        )
        db.add(reply)
        added += 1

    # Update unread count
    if added > 0:
        comment.unread_reply_count = (comment.unread_reply_count or 0) + added
        comment.last_checked_at = datetime.utcnow()

    await db.commit()
    return {"added": added, "total_unread": comment.unread_reply_count}


@router.patch("/{comment_id}")
async def update_comment(
    comment_id: int,
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Update a tracked comment's status."""
    comment = await db.get(MyComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if status:
        comment.status = status

    await db.commit()
    await db.refresh(comment)
    return {"id": comment_id, "status": comment.status}


@router.delete("/{comment_id}")
async def stop_tracking_comment(comment_id: int, db: AsyncSession = Depends(get_db)):
    """Stop tracking a comment (deletes it and all replies)."""
    comment = await db.get(MyComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    await db.delete(comment)
    await db.commit()
    return {"status": "deleted", "id": comment_id}


@router.patch("/replies/{reply_id}/read")
async def mark_reply_read(reply_id: int, db: AsyncSession = Depends(get_db)):
    """Mark a reply as read."""
    reply = await db.get(CommentReply, reply_id)
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")

    if not reply.is_read:
        reply.is_read = True

        # Decrement unread count on parent comment
        comment = await db.get(MyComment, reply.my_comment_id)
        if comment and comment.unread_reply_count > 0:
            comment.unread_reply_count -= 1

    await db.commit()
    return {"id": reply_id, "is_read": True}


@router.patch("/replies/{reply_id}/dismiss")
async def dismiss_reply(reply_id: int, db: AsyncSession = Depends(get_db)):
    """Dismiss a reply (persistent)."""
    reply = await db.get(CommentReply, reply_id)
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")

    if not reply.is_dismissed:
        reply.is_dismissed = True

        # Also mark as read and decrement unread count
        if not reply.is_read:
            reply.is_read = True
            comment = await db.get(MyComment, reply.my_comment_id)
            if comment and comment.unread_reply_count > 0:
                comment.unread_reply_count -= 1

    await db.commit()
    return {"id": reply_id, "is_dismissed": True}


@router.post("/{comment_id}/mark-all-read")
async def mark_all_read(comment_id: int, db: AsyncSession = Depends(get_db)):
    """Mark all replies to a comment as read."""
    comment = await db.get(MyComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Update all unread replies
    result = await db.execute(
        select(CommentReply).where(
            CommentReply.my_comment_id == comment_id,
            CommentReply.is_read == False
        )
    )
    replies = result.scalars().all()

    for reply in replies:
        reply.is_read = True

    comment.unread_reply_count = 0
    await db.commit()

    return {"marked_read": len(replies)}


@router.get("/stats/summary")
async def get_comment_stats(db: AsyncSession = Depends(get_db)):
    """Get comment tracking statistics."""
    total_comments = await db.scalar(select(func.count(MyComment.id)))
    active_comments = await db.scalar(
        select(func.count(MyComment.id)).where(MyComment.status == "active")
    )
    total_unread = await db.scalar(
        select(func.sum(MyComment.unread_reply_count)).where(MyComment.status == "active")
    )
    total_replies = await db.scalar(select(func.count(CommentReply.id)))

    # By platform
    platform_query = select(
        MyComment.platform, func.count(MyComment.id)
    ).group_by(MyComment.platform)
    result = await db.execute(platform_query)
    by_platform = {row[0]: row[1] for row in result.all()}

    return {
        "total_comments": total_comments or 0,
        "active_comments": active_comments or 0,
        "total_unread": total_unread or 0,
        "total_replies": total_replies or 0,
        "by_platform": by_platform,
    }
