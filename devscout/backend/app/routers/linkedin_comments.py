"""LinkedIn comment tracking via Apify - tracks replies to user's comments."""

import logging
import re
from datetime import datetime
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..config import get_settings
from ..database import get_db
from ..models import LinkedInMyComment, LinkedInCommentReply
from ..services.response_generator import ResponseGenerator

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/api/linkedin/comments", tags=["linkedin-comments"])


# ============================================================================
# Schemas
# ============================================================================

class ReplyResponse(BaseModel):
    """Response schema for a reply to user's comment."""
    id: int
    reply_urn: str
    reply_text: Optional[str]
    reply_link: Optional[str]
    author_name: Optional[str]
    author_headline: Optional[str]
    author_url: Optional[str]
    author_image: Optional[str]
    likes: int
    nested_reply_count: int
    is_read: bool
    is_dismissed: bool
    has_user_reply: bool
    reply_created_at: Optional[datetime]
    discovered_at: Optional[datetime]

    class Config:
        from_attributes = True


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
    replies: List[ReplyResponse] = []

    class Config:
        from_attributes = True


class FetchCommentsRequest(BaseModel):
    """Request to fetch comments from Apify."""
    username: str = "jesseeldridge"
    max_pages: int = 3


class GenerateReplyRequest(BaseModel):
    """Request to generate a reply to a comment on my tracked comment."""
    my_comment_text: str
    reply_text: str  # The actual reply we're responding to
    post_text: Optional[str] = None
    post_author: Optional[str] = None


class AddCommentByUrlRequest(BaseModel):
    """Request to manually add a comment to track by URL."""
    comment_url: str
    comment_text: Optional[str] = None


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


async def fetch_post_comments_with_rotation(post_url: str) -> dict:
    """
    Fetch all comments on a LinkedIn post (including nested replies) using Apify.
    Uses apimaestro/linkedin-post-comments-replies-engagements-scraper-no-cookies.
    """
    api_keys = get_apify_keys()
    if not api_keys:
        return {"error": "No Apify API keys configured", "comments": []}

    actor_id = "apimaestro~linkedin-post-comments-replies-engagements-scraper-no-cookies"

    async with httpx.AsyncClient(timeout=180.0) as client:
        for i, api_key in enumerate(api_keys):
            try:
                logger.info(f"Trying Apify key {i + 1}/{len(api_keys)} for post comments: {post_url[:50]}...")

                response = await client.post(
                    f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items",
                    params={"token": api_key, "timeout": 120},
                    json={"postIds": [post_url], "maxComments": 100},
                )

                if response.status_code in (402, 403):
                    logger.warning(f"Apify key {i + 1} exhausted ({response.status_code})")
                    continue

                if response.status_code in (200, 201):
                    data = response.json()
                    logger.info(f"Fetched {len(data)} comment items from post with key {i + 1}")
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


def extract_activity_urn_from_url(url: str) -> Optional[str]:
    """Extract LinkedIn activity/post URN from a URL."""
    if not url:
        return None
    # Match patterns like:
    # urn:li:activity:123456
    # urn:li:ugcPost:123456
    # urn:li:share:123456
    match = re.search(r'urn:li:(activity|ugcPost|share):(\d+)', url)
    if match:
        return f"urn:li:{match.group(1)}:{match.group(2)}"

    # Also try URL-encoded versions
    match = re.search(r'urn%3Ali%3A(activity|ugcPost|share)%3A(\d+)', url)
    if match:
        return f"urn:li:{match.group(1)}:{match.group(2)}"

    return None


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
    """Get all tracked comments with their replies, optionally filtered to unread only."""
    query = select(LinkedInMyComment).options(
        selectinload(LinkedInMyComment.replies)
    ).order_by(LinkedInMyComment.comment_created_at.desc())

    if unread_only:
        query = query.where(LinkedInMyComment.has_unread_replies == True)

    result = await db.execute(query)
    comments = result.scalars().all()
    return comments


@router.post("/fetch-replies")
async def fetch_replies_for_tracked_comments(
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch actual reply CONTENT for all tracked comments.

    For each tracked comment that has replies (reply_count > 0):
    1. Fetch all comments on the parent post
    2. Find comments that are replies to our comment (nested under it)
    3. Save the reply content to linkedin_comment_replies table

    This uses apimaestro/linkedin-post-comments-replies-engagements-scraper-no-cookies
    which returns nested comment structure.
    """
    # Get all tracked comments with replies
    result = await db.execute(
        select(LinkedInMyComment)
        .where(LinkedInMyComment.reply_count > 0)
        .order_by(LinkedInMyComment.comment_created_at.desc())
    )
    comments = result.scalars().all()

    if not comments:
        return {
            "success": True,
            "message": "No comments with replies to fetch",
            "fetched": 0,
            "new_replies": 0,
        }

    # Group comments by post URL to minimize API calls
    posts_to_fetch = {}
    for comment in comments:
        if comment.post_url:
            if comment.post_url not in posts_to_fetch:
                posts_to_fetch[comment.post_url] = []
            posts_to_fetch[comment.post_url].append(comment)

    total_new_replies = 0
    posts_processed = 0
    errors = []

    for post_url, post_comments in posts_to_fetch.items():
        logger.info(f"Fetching comments for post: {post_url[:60]}...")

        # Fetch all comments on this post
        result = await fetch_post_comments_with_rotation(post_url)

        if "error" in result and not result.get("comments"):
            errors.append(f"Failed to fetch {post_url[:50]}: {result['error']}")
            continue

        all_post_comments = result.get("comments", [])
        posts_processed += 1

        # For each of our tracked comments on this post, find replies to it
        for my_comment in post_comments:
            # Get the comment URN ID (e.g., extract "7414056..." from "urn:li:comment:(ugcPost:7413...,7414...)")
            my_comment_id = None
            urn_match = re.search(r',(\d+)\)', my_comment.comment_urn)
            if urn_match:
                my_comment_id = urn_match.group(1)

            if not my_comment_id:
                logger.warning(f"Could not extract comment ID from URN: {my_comment.comment_urn}")
                continue

            logger.info(f"Looking for replies to comment ID: {my_comment_id}")

            # Apify response structure has nested replies inside each comment
            # Structure: [{comment_id, text, replies: [{comment_id, text, author...}], ...}, ...]
            # We need to find MY comment and get its replies array

            for comment_data in all_post_comments:
                # Check if this is our comment by matching the comment_id
                comment_id = comment_data.get("comment_id")
                if not comment_id or my_comment_id not in str(comment_id):
                    continue

                # Found our comment! Now get the replies
                replies = comment_data.get("replies", [])
                logger.info(f"Found our comment with {len(replies)} replies")

                if not replies:
                    continue

                # Process each reply
                for reply_data in replies:
                    reply_id = reply_data.get("comment_id")
                    if not reply_id:
                        continue

                    # Use the reply_id as the unique identifier
                    reply_urn = f"reply:{reply_id}"

                    # Check if we already have this reply
                    existing = await db.scalar(
                        select(LinkedInCommentReply).where(
                            LinkedInCommentReply.my_comment_id == my_comment.id,
                            LinkedInCommentReply.reply_urn == reply_urn,
                        )
                    )

                    if not existing:
                        # Parse reply timestamp
                        reply_timestamp = None
                        posted_at = reply_data.get("posted_at")
                        if posted_at:
                            try:
                                # Handle various timestamp formats
                                if isinstance(posted_at, (int, float)):
                                    reply_timestamp = datetime.fromtimestamp(posted_at / 1000 if posted_at > 10000000000 else posted_at)
                                elif isinstance(posted_at, str):
                                    # Try to parse ISO format or other string formats
                                    from dateutil import parser
                                    reply_timestamp = parser.parse(posted_at)
                            except:
                                pass

                        # Get author info
                        author = reply_data.get("author", {})
                        if isinstance(author, dict):
                            author_name = author.get("name") or author.get("fullName")
                            author_headline = author.get("headline")
                            author_url = author.get("profile_url") or author.get("profileUrl") or author.get("url")
                            author_image = author.get("image") or author.get("profileImage") or author.get("profile_image")
                        else:
                            author_name = str(author) if author else None
                            author_headline = None
                            author_url = None
                            author_image = None

                        # Get engagement stats - handle various structures
                        stats = reply_data.get("stats", {})
                        likes = 0
                        nested_replies = 0
                        if isinstance(stats, dict):
                            # Try to extract numeric values, handling nested dicts
                            for key in ["like", "appreciation", "empathy", "interest", "praise", "reactions", "likes"]:
                                val = stats.get(key, 0)
                                if isinstance(val, (int, float)):
                                    likes += int(val)
                            for key in ["replies", "comments"]:
                                val = stats.get(key, 0)
                                if isinstance(val, (int, float)):
                                    nested_replies += int(val)

                        # Create new reply record
                        new_reply = LinkedInCommentReply(
                            my_comment_id=my_comment.id,
                            reply_urn=reply_urn,
                            reply_text=reply_data.get("text") or reply_data.get("comment_text"),
                            reply_link=reply_data.get("comment_url") or reply_data.get("url"),
                            author_name=author_name,
                            author_headline=author_headline,
                            author_url=author_url,
                            author_image=author_image,
                            likes=likes,
                            nested_reply_count=nested_replies,
                            reply_created_at=reply_timestamp,
                        )
                        db.add(new_reply)
                        total_new_replies += 1
                        logger.info(f"Found new reply from {author_name}: {new_reply.reply_text[:50] if new_reply.reply_text else 'no text'}...")

            # Update last checked time
            my_comment.last_checked_at = datetime.utcnow()

    await db.commit()

    return {
        "success": True,
        "posts_processed": posts_processed,
        "new_replies": total_new_replies,
        "errors": errors if errors else None,
    }


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


@router.post("/generate-reply")
async def generate_comment_reply(request: GenerateReplyRequest):
    """Generate a reply to someone who replied to my LinkedIn comment."""
    generator = ResponseGenerator()

    reply = await generator.generate_linkedin_comment_reply(
        my_comment_text=request.my_comment_text,
        their_reply_text=request.reply_text,
        post_text=request.post_text,
        post_author=request.post_author,
    )

    if not reply:
        raise HTTPException(status_code=500, detail="Failed to generate reply")

    return {"reply": reply}


@router.post("/{reply_id}/mark-reply-read")
async def mark_reply_read(reply_id: int, db: AsyncSession = Depends(get_db)):
    """Mark a specific reply as read."""
    reply = await db.get(LinkedInCommentReply, reply_id)
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")

    reply.is_read = True
    await db.commit()

    # Check if all replies to this comment are now read
    parent_comment = await db.get(LinkedInMyComment, reply.my_comment_id)
    if parent_comment:
        unread_count = await db.scalar(
            select(LinkedInCommentReply).where(
                LinkedInCommentReply.my_comment_id == parent_comment.id,
                LinkedInCommentReply.is_read == False,
                LinkedInCommentReply.is_dismissed == False,
            )
        )
        if not unread_count:
            parent_comment.has_unread_replies = False
            await db.commit()

    return {"success": True}


@router.post("/{reply_id}/dismiss-reply")
async def dismiss_reply(reply_id: int, db: AsyncSession = Depends(get_db)):
    """Dismiss a reply (won't show in unread)."""
    reply = await db.get(LinkedInCommentReply, reply_id)
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")

    reply.is_dismissed = True
    reply.is_read = True
    await db.commit()

    return {"success": True}


# ============================================================================
# DevScout-Based Reply Checking (uses LinkedIn OAuth API)
# ============================================================================

async def _get_linkedin_token(db: AsyncSession) -> Optional[str]:
    """Get valid LinkedIn access token from database."""
    from ..models import LinkedInAuth

    auth = await db.get(LinkedInAuth, 1)
    if not auth:
        return None

    if auth.expires_at <= datetime.utcnow():
        return None

    return auth.access_token


@router.post("/check-replies")
async def check_replies_for_tracked_comments(
    db: AsyncSession = Depends(get_db),
):
    """
    Check for new replies to all tracked comments using LinkedIn OAuth API.

    NOTE: LinkedIn's basic w_member_social permission does NOT support reading
    replies to comments. This endpoint will return 400/403 errors for most comments.

    The workaround is to use the Apify-based /fetch endpoint which scrapes the
    public profile to get reply counts. This endpoint is provided for future use
    if LinkedIn expands API permissions.

    For now, use 'Fetch Comments' button which uses Apify to get reply counts.
    """
    access_token = await _get_linkedin_token(db)
    if not access_token:
        return {
            "error": "LinkedIn not authenticated. Use 'Fetch Comments' button instead (uses Apify).",
            "checked": 0,
            "new_replies": 0,
            "suggestion": "The LinkedIn API doesn't support reading comment replies with basic permissions. Use the Apify-based fetch instead.",
        }

    # Get all tracked comments
    result = await db.execute(
        select(LinkedInMyComment).order_by(LinkedInMyComment.comment_created_at.desc())
    )
    comments = result.scalars().all()

    if not comments:
        return {
            "checked": 0,
            "new_replies": 0,
            "message": "No tracked comments to check",
        }

    checked_count = 0
    new_replies_total = 0
    errors = []
    permission_errors = 0

    async with httpx.AsyncClient(timeout=30.0) as client:
        for comment in comments:
            try:
                # URL encode the comment URN for the API path
                # Comment URN format: urn:li:comment:(ugcPost:123,456)
                encoded_urn = comment.comment_urn.replace(":", "%3A").replace("(", "%28").replace(")", "%29").replace(",", "%2C")

                response = await client.get(
                    f"https://api.linkedin.com/v2/socialActions/{encoded_urn}/comments",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "X-Restli-Protocol-Version": "2.0.0",
                    },
                )

                if response.status_code in (400, 403):
                    # LinkedIn API doesn't support this with w_member_social
                    permission_errors += 1
                    continue

                if response.status_code != 200:
                    logger.warning(f"Failed to check replies for {comment.comment_urn}: {response.status_code}")
                    errors.append(f"Comment {comment.id}: {response.status_code}")
                    continue

                data = response.json()
                replies = data.get("elements", [])
                current_reply_count = len(replies)

                # Check for new replies
                old_reply_count = comment.reply_count
                if current_reply_count > old_reply_count:
                    new_replies = current_reply_count - old_reply_count
                    new_replies_total += new_replies
                    comment.has_unread_replies = True
                    logger.info(f"New replies detected on comment {comment.id}: {new_replies}")

                # Update counts
                comment.reply_count = current_reply_count
                comment.last_checked_at = datetime.utcnow()
                checked_count += 1

            except Exception as e:
                logger.error(f"Error checking replies for comment {comment.id}: {e}")
                errors.append(f"Comment {comment.id}: {str(e)}")
                continue

    await db.commit()

    # If all comments returned permission errors, provide helpful message
    if permission_errors == len(comments) and checked_count == 0:
        return {
            "checked": 0,
            "total_comments": len(comments),
            "new_replies": 0,
            "message": "LinkedIn API doesn't support reading comment replies with w_member_social permission. Use 'Fetch Comments' button instead (uses Apify scraping).",
            "suggestion": "Click 'Fetch Comments' to update reply counts via Apify.",
        }

    return {
        "checked": checked_count,
        "total_comments": len(comments),
        "new_replies": new_replies_total,
        "permission_errors": permission_errors if permission_errors > 0 else None,
        "errors": errors if errors else None,
    }


@router.post("/add-by-url")
async def add_comment_by_url(
    request: AddCommentByUrlRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Manually add a comment to track by URL.

    Use this to track comments that were posted before DevScout tracking was enabled,
    or comments posted directly on LinkedIn.

    URL format: https://www.linkedin.com/feed/update/{activity_urn}/?commentUrn={comment_urn}
    """
    import re

    url = request.comment_url

    # Extract comment URN from URL
    # Format: commentUrn=urn%3Ali%3Acomment%3A(activity%3A123%2C456)
    # or: commentUrn=urn:li:comment:(activity:123,456)
    comment_urn_match = re.search(r'commentUrn=([^&]+)', url)
    if not comment_urn_match:
        raise HTTPException(
            status_code=400,
            detail="Could not extract comment URN from URL. Make sure the URL contains commentUrn parameter."
        )

    comment_urn = comment_urn_match.group(1)
    # URL decode if needed
    from urllib.parse import unquote
    comment_urn = unquote(comment_urn)

    # Extract activity URN from URL
    activity_urn_match = re.search(r'urn:li:(activity|share|ugcPost):(\d+)', url)
    if not activity_urn_match:
        raise HTTPException(
            status_code=400,
            detail="Could not extract activity URN from URL."
        )

    activity_urn = f"urn:li:{activity_urn_match.group(1)}:{activity_urn_match.group(2)}"

    # Check if comment already exists
    existing = await db.scalar(
        select(LinkedInMyComment).where(LinkedInMyComment.comment_urn == comment_urn)
    )
    if existing:
        return {
            "status": "already_tracked",
            "comment_id": existing.id,
            "message": "This comment is already being tracked",
        }

    # Create new tracked comment
    new_comment = LinkedInMyComment(
        comment_urn=comment_urn,
        comment_text=request.comment_text,
        comment_link=request.comment_url,
        post_url=f"https://www.linkedin.com/feed/update/{activity_urn}/",
        reply_count=0,
        last_known_reply_count=0,
        has_unread_replies=False,
        comment_created_at=datetime.utcnow(),
    )
    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment)

    return {
        "status": "added",
        "comment_id": new_comment.id,
        "comment_urn": comment_urn,
        "message": "Comment added for tracking. Use /check-replies to check for replies.",
    }
