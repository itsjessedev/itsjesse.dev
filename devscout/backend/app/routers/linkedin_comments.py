"""LinkedIn comment tracking via Apify - tracks replies to user's comments."""

import logging
from datetime import datetime
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..database import get_db
from ..models import LinkedInMyComment

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/api/linkedin/comments", tags=["linkedin-comments"])


# ============================================================================
# Schemas
# ============================================================================

class CommentResponse(BaseModel):
    """Response schema for a tracked comment."""
    id: int
    comment_urn: str
    comment_text: Optional[str]
    comment_link: Optional[str]
    post_url: Optional[str]
    post_text: Optional[str]
    post_author: Optional[str]
    reply_count: int
    has_unread_replies: bool
    comment_created_at: Optional[datetime]
    last_checked_at: Optional[datetime]

    class Config:
        from_attributes = True


class FetchCommentsRequest(BaseModel):
    """Request to fetch comments from Apify."""
    username: str = "jesseeldridge"
    max_pages: int = 3


# ============================================================================
# Apify Key Rotation
# ============================================================================

def get_apify_keys() -> List[str]:
    """Get all configured Apify API keys."""
    settings = get_settings()
    return [k for k in [
        settings.apify_api_key,
        settings.apify_api_key_2,
        settings.apify_api_key_3,
        settings.apify_api_key_4,
        settings.apify_api_key_5,
        settings.apify_api_key_6,
        settings.apify_api_key_7,
    ] if k]


async def call_apify_with_rotation(username: str, max_pages: int) -> dict:
    """
    Call Apify LinkedIn profile comments scraper with key rotation.
    Rotates through all 7 keys on 402/403 errors.
    """
    api_keys = get_apify_keys()
    if not api_keys:
        return {"error": "No Apify API keys configured", "comments": []}

    actor_id = "apimaestro~linkedin-profile-comments"

    async with httpx.AsyncClient(timeout=180.0) as client:
        for i, api_key in enumerate(api_keys):
            try:
                logger.info(f"Trying Apify key {i + 1}/{len(api_keys)} for LinkedIn comments")

                response = await client.post(
                    f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items",
                    params={"token": api_key, "timeout": 120},
                    json={"username": username, "maxPages": max_pages},
                )

                if response.status_code in (402, 403):
                    logger.warning(f"Apify key {i + 1} exhausted ({response.status_code})")
                    continue

                if response.status_code in (200, 201):
                    data = response.json()
                    logger.info(f"Fetched {len(data)} comments with key {i + 1}")
                    return {"comments": data, "key_used": i + 1}

                # Other error
                logger.error(f"Apify error: {response.status_code} - {response.text[:200]}")

            except httpx.TimeoutException:
                logger.warning(f"Timeout with key {i + 1}")
                continue
            except Exception as e:
                logger.error(f"Error with key {i + 1}: {e}")
                continue

    return {"error": "All Apify keys exhausted or failed", "comments": []}


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/fetch")
async def fetch_and_update_comments(
    request: FetchCommentsRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch user's LinkedIn comments via Apify and update the database.
    Detects new replies by comparing reply counts.
    """
    result = await call_apify_with_rotation(request.username, request.max_pages)

    if "error" in result and not result.get("comments"):
        return {"error": result["error"], "comments": [], "new_replies": 0}

    comments_data = result.get("comments", [])
    new_replies_count = 0
    updated_count = 0
    new_count = 0

    for comment in comments_data:
        comment_urn = comment.get("comment_urn")
        if not comment_urn:
            continue

        # Get reply count from comment_stats
        comment_stats = comment.get("comment_stats", {})
        current_reply_count = comment_stats.get("comments", 0)

        # Get post info
        post = comment.get("post", {})
        post_author_obj = post.get("post_author", {})

        # Parse comment timestamp
        created_at = comment.get("created_at", {})
        comment_timestamp = None
        if created_at.get("timestamp"):
            try:
                comment_timestamp = datetime.fromtimestamp(created_at["timestamp"] / 1000)
            except:
                pass

        # Check if comment exists in database
        existing = await db.scalar(
            select(LinkedInMyComment).where(LinkedInMyComment.comment_urn == comment_urn)
        )

        if existing:
            # Update existing comment
            old_reply_count = existing.reply_count

            # Check for new replies
            if current_reply_count > old_reply_count:
                new_replies = current_reply_count - old_reply_count
                new_replies_count += new_replies
                existing.has_unread_replies = True
                logger.info(f"New replies detected on comment: {new_replies}")

            existing.reply_count = current_reply_count
            existing.last_checked_at = datetime.utcnow()
            updated_count += 1
        else:
            # Create new comment record
            new_comment = LinkedInMyComment(
                comment_urn=comment_urn,
                comment_text=comment.get("comment_text"),
                comment_link=comment.get("comment_link"),
                post_url=post.get("post_url"),
                post_text=post.get("post_text", "")[:500] if post.get("post_text") else None,
                post_author=post_author_obj.get("name") if isinstance(post_author_obj, dict) else None,
                reply_count=current_reply_count,
                last_known_reply_count=current_reply_count,
                has_unread_replies=False,
                comment_created_at=comment_timestamp,
            )
            db.add(new_comment)
            new_count += 1

    await db.commit()

    return {
        "success": True,
        "total_fetched": len(comments_data),
        "new_comments": new_count,
        "updated_comments": updated_count,
        "new_replies": new_replies_count,
        "key_used": result.get("key_used"),
    }


@router.get("/", response_model=List[CommentResponse])
async def get_tracked_comments(
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """Get all tracked comments, optionally filtered to unread only."""
    query = select(LinkedInMyComment).order_by(LinkedInMyComment.comment_created_at.desc())

    if unread_only:
        query = query.where(LinkedInMyComment.has_unread_replies == True)

    result = await db.execute(query)
    comments = result.scalars().all()
    return comments


@router.get("/unread-count")
async def get_unread_count(db: AsyncSession = Depends(get_db)):
    """Get count of comments with unread replies."""
    from sqlalchemy import func

    count = await db.scalar(
        select(func.count(LinkedInMyComment.id)).where(
            LinkedInMyComment.has_unread_replies == True
        )
    )
    return {"unread_count": count or 0}


@router.post("/{comment_id}/mark-read")
async def mark_comment_read(comment_id: int, db: AsyncSession = Depends(get_db)):
    """Mark a comment's replies as read."""
    comment = await db.get(LinkedInMyComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.has_unread_replies = False
    comment.last_known_reply_count = comment.reply_count
    await db.commit()

    return {"success": True}


@router.post("/mark-all-read")
async def mark_all_read(db: AsyncSession = Depends(get_db)):
    """Mark all comments as read."""
    from sqlalchemy import update

    await db.execute(
        update(LinkedInMyComment)
        .where(LinkedInMyComment.has_unread_replies == True)
        .values(has_unread_replies=False)
    )
    await db.commit()

    return {"success": True}


@router.delete("/clear")
async def clear_all_comments(db: AsyncSession = Depends(get_db)):
    """Clear all tracked comments (for testing/reset)."""
    from sqlalchemy import delete

    result = await db.execute(delete(LinkedInMyComment))
    await db.commit()

    return {"deleted": result.rowcount}
