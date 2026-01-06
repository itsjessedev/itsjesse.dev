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
from ..models import LinkedInMyComment, LinkedInCommentReply, LinkedInMyPost, LinkedInPostComment
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


class AddPostByUrlRequest(BaseModel):
    """Request to manually add a post to track by URL."""
    post_url: str
    post_text: Optional[str] = None


class PostCommentResponse(BaseModel):
    """Response schema for a comment on user's post."""
    id: int
    comment_urn: str
    comment_text: Optional[str]
    comment_link: Optional[str]
    author_name: Optional[str]
    author_headline: Optional[str]
    author_url: Optional[str]
    author_image: Optional[str]
    likes: int
    reply_count: int
    is_read: bool
    is_dismissed: bool
    has_user_reply: bool
    comment_created_at: Optional[datetime]
    discovered_at: Optional[datetime]

    class Config:
        from_attributes = True


class TrackedPostResponse(BaseModel):
    """Response schema for a tracked post."""
    id: int
    post_urn: str
    post_url: Optional[str]
    post_text: Optional[str]
    comment_count: int
    has_unread_comments: bool
    post_created_at: Optional[datetime]
    last_checked_at: Optional[datetime]
    comments: List[PostCommentResponse] = []

    class Config:
        from_attributes = True


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


async def fetch_post_content_with_rotation(post_url: str) -> dict:
    """
    Fetch the content of a LinkedIn post using Apify.
    Uses apimaestro/linkedin-posts-search-scraper-no-cookies with the post URL.
    """
    api_keys = get_apify_keys()
    if not api_keys:
        return {"error": "No Apify API keys configured", "post_text": None}

    # Extract the activity ID for a targeted search
    urn_match = re.search(r'urn:li:(activity|ugcPost|share):(\d+)', post_url)
    if not urn_match:
        return {"error": "Could not extract URN from URL", "post_text": None}

    activity_id = urn_match.group(2)
    actor_id = "apimaestro~linkedin-posts-search-scraper-no-cookies"

    async with httpx.AsyncClient(timeout=120.0) as client:
        for i, api_key in enumerate(api_keys):
            try:
                logger.info(f"Trying Apify key {i + 1}/{len(api_keys)} for post content: {activity_id}...")

                # Search for the specific post by activity ID
                response = await client.post(
                    f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items",
                    params={"token": api_key, "timeout": 90},
                    json={
                        "searchQueries": [activity_id],
                        "maxResults": 5,
                        "datePosted": "any-time"
                    },
                )

                if response.status_code in (402, 403):
                    logger.warning(f"Apify key {i + 1} exhausted ({response.status_code})")
                    continue

                if response.status_code in (200, 201):
                    data = response.json()
                    logger.info(f"Got {len(data)} posts from Apify for activity {activity_id}")

                    # Find the matching post
                    for post in data:
                        post_activity = post.get("activity_id") or ""
                        post_text = post.get("text") or ""
                        if activity_id in str(post_activity) or activity_id in str(post.get("post_url", "")):
                            logger.info(f"Found matching post with {len(post_text)} chars")
                            return {"post_text": post_text, "key_used": i + 1}

                    # If no exact match, return first result if it looks right
                    if data and data[0].get("text"):
                        return {"post_text": data[0].get("text"), "key_used": i + 1}

                    return {"error": "Post not found in search results", "post_text": None}

                logger.error(f"Apify error: {response.status_code} - {response.text[:200]}")

            except httpx.TimeoutException:
                logger.warning(f"Timeout with key {i + 1}")
                continue
            except Exception as e:
                logger.error(f"Error with key {i + 1}: {e}")
                continue

    return {"error": "All Apify keys exhausted or failed", "post_text": None}


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


@router.post("/{reply_id}/like-and-dismiss")
async def like_and_dismiss_reply(reply_id: int, db: AsyncSession = Depends(get_db)):
    """
    Like a reply on LinkedIn and dismiss it from DevScout.
    This is a quick action to acknowledge a reply without responding.
    """
    import httpx

    reply = await db.get(LinkedInCommentReply, reply_id)
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")

    # Get LinkedIn auth
    access_token = await _get_linkedin_token(db)
    if not access_token:
        # No LinkedIn auth - just dismiss without liking
        reply.is_dismissed = True
        reply.is_read = True
        await db.commit()
        return {"success": True, "liked": False, "reason": "Not authenticated with LinkedIn"}

    # Get person ID for the like
    from ..models import LinkedInAuth
    auth = await db.get(LinkedInAuth, 1)
    if not auth or not auth.person_id:
        reply.is_dismissed = True
        reply.is_read = True
        await db.commit()
        return {"success": True, "liked": False, "reason": "Missing LinkedIn person ID"}

    # Try to like the reply
    liked = False
    error_reason = None

    # The reply_urn is stored as "reply:{comment_id}" - we need the actual LinkedIn URN
    # The reply_link should contain the actual LinkedIn URL with URN info
    if reply.reply_link:
        # Extract URN from the reply link
        import re
        # LinkedIn comment URNs look like: urn:li:comment:(ugcPost:123,456) or urn:li:comment:(activity:123,456)
        urn_match = re.search(r'commentUrn=(urn[^&]+)', reply.reply_link)
        if urn_match:
            from urllib.parse import unquote
            comment_urn = unquote(urn_match.group(1))
        else:
            # Try to find URN directly in URL
            urn_match = re.search(r'urn:li:comment:\([^)]+\)', reply.reply_link)
            if urn_match:
                comment_urn = urn_match.group(0)
            else:
                comment_urn = None

        if comment_urn:
            async with httpx.AsyncClient(timeout=30.0) as client:
                try:
                    # To like a comment, we use the socialActions endpoint
                    # Format: POST /socialActions/{parentUrn}/comments/{commentUrn}/likes
                    # But LinkedIn's API for liking comments is more complex
                    # Simpler approach: use the reactions endpoint
                    encoded_urn = comment_urn.replace(":", "%3A").replace("(", "%28").replace(")", "%29").replace(",", "%2C")

                    like_data = {
                        "actor": f"urn:li:person:{auth.person_id}",
                        "object": comment_urn,
                    }

                    response = await client.post(
                        f"https://api.linkedin.com/v2/socialActions/{encoded_urn}/likes",
                        json=like_data,
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Content-Type": "application/json",
                            "X-Restli-Protocol-Version": "2.0.0",
                        },
                    )

                    if response.status_code in [200, 201]:
                        liked = True
                        logger.info(f"Successfully liked comment {comment_urn}")
                    elif response.status_code == 409:
                        # Already liked
                        liked = True
                        logger.info(f"Comment already liked: {comment_urn}")
                    else:
                        error_reason = f"LinkedIn returned {response.status_code}"
                        logger.warning(f"Failed to like comment: {response.text[:200]}")

                except Exception as e:
                    error_reason = str(e)
                    logger.error(f"Error liking comment: {e}")
        else:
            error_reason = "Could not extract comment URN from link"
    else:
        error_reason = "No reply link available"

    # Always dismiss the reply regardless of like success
    reply.is_dismissed = True
    reply.is_read = True
    await db.commit()

    return {
        "success": True,
        "liked": liked,
        "reason": error_reason if not liked else None,
    }


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


# ============================================================================
# My Posts Tracking - Track user's own posts and their comments
# ============================================================================

@router.post("/posts/add")
async def add_post_to_track(
    request: AddPostByUrlRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Add a LinkedIn post to track for comments.

    Use this to monitor comments on your own posts.
    Automatically fetches the post content via Apify.

    URL format examples:
    - https://www.linkedin.com/feed/update/urn:li:activity:7413065454996348928/
    - https://www.linkedin.com/posts/jesseeldridge_my-post-title-activity-7413065454996348928
    """
    url = request.post_url

    # Extract activity/post URN from URL
    post_urn = extract_activity_urn_from_url(url)
    if not post_urn:
        raise HTTPException(
            status_code=400,
            detail="Could not extract post URN from URL. Make sure the URL contains urn:li:activity:XXX or similar."
        )

    # Check if post already exists
    existing = await db.scalar(
        select(LinkedInMyPost).where(LinkedInMyPost.post_urn == post_urn)
    )
    if existing:
        return {
            "status": "already_tracked",
            "post_id": existing.id,
            "post_urn": post_urn,
            "message": "This post is already being tracked",
        }

    # Try to fetch post content via Apify
    post_text = request.post_text
    if not post_text:
        logger.info(f"Fetching post content for: {url[:60]}...")
        content_result = await fetch_post_content_with_rotation(url)
        if content_result.get("post_text"):
            post_text = content_result["post_text"]
            logger.info(f"Got post content: {len(post_text)} chars")
        else:
            logger.warning(f"Could not fetch post content: {content_result.get('error', 'unknown')}")

    # Create new tracked post
    new_post = LinkedInMyPost(
        post_urn=post_urn,
        post_url=request.post_url,
        post_text=post_text,
        comment_count=0,
        last_known_comment_count=0,
        has_unread_comments=False,
        post_created_at=datetime.utcnow(),
    )
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)

    return {
        "status": "added",
        "post_id": new_post.id,
        "post_urn": post_urn,
        "post_text": post_text[:200] if post_text else None,
        "message": "Post added for tracking.",
    }


@router.post("/posts/backfill-content")
async def backfill_post_content(
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch content for all tracked posts that don't have post_text.
    Uses Apify to retrieve the original post content.
    """
    # Get posts without content
    result = await db.execute(
        select(LinkedInMyPost).where(
            (LinkedInMyPost.post_text == None) | (LinkedInMyPost.post_text == "")
        )
    )
    posts = list(result.scalars().all())

    if not posts:
        return {"status": "ok", "message": "All posts already have content", "updated": 0}

    updated = 0
    errors = []

    for post in posts:
        try:
            url = post.post_url or f"https://www.linkedin.com/feed/update/{post.post_urn}/"
            logger.info(f"Backfilling content for post {post.id}: {url[:50]}...")

            content_result = await fetch_post_content_with_rotation(url)

            if content_result.get("post_text"):
                post.post_text = content_result["post_text"]
                updated += 1
                logger.info(f"Updated post {post.id} with {len(post.post_text)} chars")
            else:
                errors.append(f"Post {post.id}: {content_result.get('error', 'no content found')}")

        except Exception as e:
            errors.append(f"Post {post.id}: {str(e)}")
            logger.error(f"Error backfilling post {post.id}: {e}")

    await db.commit()

    return {
        "status": "ok",
        "message": f"Backfilled {updated}/{len(posts)} posts",
        "updated": updated,
        "total": len(posts),
        "errors": errors if errors else None,
    }


@router.get("/posts", response_model=List[TrackedPostResponse])
async def get_tracked_posts(
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """Get all tracked posts with their comments."""
    query = select(LinkedInMyPost).options(
        selectinload(LinkedInMyPost.comments)
    ).order_by(LinkedInMyPost.discovered_at.desc())

    if unread_only:
        query = query.where(LinkedInMyPost.has_unread_comments == True)

    result = await db.execute(query)
    posts = result.scalars().all()
    return posts


@router.post("/posts/fetch-comments")
async def fetch_comments_for_tracked_posts(
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch comments for all tracked posts via Apify.

    Uses apimaestro/linkedin-post-comments-replies-engagements-scraper-no-cookies
    to get all comments on each tracked post.
    """
    # Get all tracked posts
    result = await db.execute(
        select(LinkedInMyPost).order_by(LinkedInMyPost.discovered_at.desc())
    )
    posts = result.scalars().all()

    if not posts:
        return {
            "success": True,
            "message": "No posts to fetch comments for",
            "posts_processed": 0,
            "new_comments": 0,
        }

    total_new_comments = 0
    posts_processed = 0
    errors = []

    for post in posts:
        logger.info(f"Fetching comments for post: {post.post_url[:60] if post.post_url else post.post_urn}...")

        # Fetch all comments on this post
        api_result = await fetch_post_comments_with_rotation(post.post_url or f"https://www.linkedin.com/feed/update/{post.post_urn}/")

        if "error" in api_result and not api_result.get("comments"):
            errors.append(f"Failed to fetch {post.post_urn}: {api_result['error']}")
            continue

        all_comments = api_result.get("comments", [])
        posts_processed += 1

        logger.info(f"Got {len(all_comments)} comments from Apify for post {post.post_urn}")

        # Process each top-level comment
        for comment_data in all_comments:
            comment_id = comment_data.get("comment_id")
            if not comment_id:
                continue

            # Use comment_id as URN
            comment_urn = f"comment:{comment_id}"

            # Check if we already have this comment
            existing = await db.scalar(
                select(LinkedInPostComment).where(
                    LinkedInPostComment.my_post_id == post.id,
                    LinkedInPostComment.comment_urn == comment_urn,
                )
            )

            if not existing:
                # Parse comment timestamp
                comment_timestamp = None
                posted_at = comment_data.get("posted_at")
                if posted_at:
                    try:
                        if isinstance(posted_at, (int, float)):
                            comment_timestamp = datetime.fromtimestamp(posted_at / 1000 if posted_at > 10000000000 else posted_at)
                        elif isinstance(posted_at, str):
                            from dateutil import parser
                            comment_timestamp = parser.parse(posted_at)
                    except:
                        pass

                # Get author info
                author = comment_data.get("author", {})
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

                # Get engagement stats
                stats = comment_data.get("stats", {})
                likes = 0
                reply_count = 0
                if isinstance(stats, dict):
                    for key in ["like", "appreciation", "empathy", "interest", "praise", "reactions", "likes"]:
                        val = stats.get(key, 0)
                        if isinstance(val, (int, float)):
                            likes += int(val)
                    for key in ["replies", "comments"]:
                        val = stats.get(key, 0)
                        if isinstance(val, (int, float)):
                            reply_count += int(val)

                # Count nested replies
                nested_replies = comment_data.get("replies", [])
                if nested_replies:
                    reply_count = max(reply_count, len(nested_replies))

                # Create comment link
                comment_link = comment_data.get("comment_url") or comment_data.get("url")

                # Create new comment record
                new_comment = LinkedInPostComment(
                    my_post_id=post.id,
                    comment_urn=comment_urn,
                    comment_text=comment_data.get("text") or comment_data.get("comment_text"),
                    comment_link=comment_link,
                    author_name=author_name,
                    author_headline=author_headline,
                    author_url=author_url,
                    author_image=author_image,
                    likes=likes,
                    reply_count=reply_count,
                    comment_created_at=comment_timestamp,
                )
                db.add(new_comment)
                total_new_comments += 1
                logger.info(f"New comment from {author_name}: {new_comment.comment_text[:50] if new_comment.comment_text else 'no text'}...")

        # Update post's comment count and last checked time
        old_count = post.comment_count
        new_count = len(all_comments)
        post.comment_count = new_count
        post.last_checked_at = datetime.utcnow()

        if new_count > old_count:
            post.has_unread_comments = True

    await db.commit()

    return {
        "success": True,
        "posts_processed": posts_processed,
        "new_comments": total_new_comments,
        "errors": errors if errors else None,
    }


@router.post("/posts/{comment_id}/dismiss")
async def dismiss_post_comment(comment_id: int, db: AsyncSession = Depends(get_db)):
    """Dismiss a comment on a tracked post."""
    comment = await db.get(LinkedInPostComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.is_dismissed = True
    comment.is_read = True
    await db.commit()

    return {"success": True}


@router.post("/posts/{comment_id}/mark-read")
async def mark_post_comment_read(comment_id: int, db: AsyncSession = Depends(get_db)):
    """Mark a comment on a tracked post as read."""
    comment = await db.get(LinkedInPostComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.is_read = True
    await db.commit()

    # Check if all comments on this post are now read
    parent_post = await db.get(LinkedInMyPost, comment.my_post_id)
    if parent_post:
        unread_count = await db.scalar(
            select(LinkedInPostComment).where(
                LinkedInPostComment.my_post_id == parent_post.id,
                LinkedInPostComment.is_read == False,
                LinkedInPostComment.is_dismissed == False,
            )
        )
        if not unread_count:
            parent_post.has_unread_comments = False
            await db.commit()

    return {"success": True}


@router.post("/posts/{comment_id}/like-and-dismiss")
async def like_and_dismiss_post_comment(comment_id: int, db: AsyncSession = Depends(get_db)):
    """Like a comment on a tracked post and dismiss it."""
    import httpx

    comment = await db.get(LinkedInPostComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Get LinkedIn auth
    access_token = await _get_linkedin_token(db)
    if not access_token:
        comment.is_dismissed = True
        comment.is_read = True
        await db.commit()
        return {"success": True, "liked": False, "reason": "Not authenticated with LinkedIn"}

    # Get person ID
    from ..models import LinkedInAuth
    auth = await db.get(LinkedInAuth, 1)
    if not auth or not auth.person_id:
        comment.is_dismissed = True
        comment.is_read = True
        await db.commit()
        return {"success": True, "liked": False, "reason": "Missing LinkedIn person ID"}

    liked = False
    error_reason = None

    if comment.comment_link:
        # Extract URN from comment link
        urn_match = re.search(r'commentUrn=(urn[^&]+)', comment.comment_link)
        if urn_match:
            from urllib.parse import unquote
            comment_urn_full = unquote(urn_match.group(1))
        else:
            urn_match = re.search(r'urn:li:comment:\([^)]+\)', comment.comment_link)
            comment_urn_full = urn_match.group(0) if urn_match else None

        if comment_urn_full:
            async with httpx.AsyncClient(timeout=30.0) as client:
                try:
                    encoded_urn = comment_urn_full.replace(":", "%3A").replace("(", "%28").replace(")", "%29").replace(",", "%2C")

                    like_data = {
                        "actor": f"urn:li:person:{auth.person_id}",
                        "object": comment_urn_full,
                    }

                    response = await client.post(
                        f"https://api.linkedin.com/v2/socialActions/{encoded_urn}/likes",
                        json=like_data,
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Content-Type": "application/json",
                            "X-Restli-Protocol-Version": "2.0.0",
                        },
                    )

                    if response.status_code in [200, 201]:
                        liked = True
                    elif response.status_code == 409:
                        liked = True  # Already liked
                    else:
                        error_reason = f"LinkedIn returned {response.status_code}"

                except Exception as e:
                    error_reason = str(e)
        else:
            error_reason = "Could not extract comment URN"
    else:
        error_reason = "No comment link available"

    # Always dismiss
    comment.is_dismissed = True
    comment.is_read = True
    await db.commit()

    return {
        "success": True,
        "liked": liked,
        "reason": error_reason if not liked else None,
    }


@router.delete("/posts/{post_id}")
async def delete_tracked_post(post_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a tracked post and all its comments."""
    post = await db.get(LinkedInMyPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    await db.delete(post)
    await db.commit()

    return {"success": True}


@router.post("/posts/generate-reply")
async def generate_reply_to_post_comment(
    my_post_text: str,
    their_comment_text: str,
):
    """Generate a reply to a comment on my LinkedIn post."""
    generator = ResponseGenerator()

    reply = await generator.generate_linkedin_comment_reply(
        my_comment_text=my_post_text,  # Treat my post as "my comment" for context
        their_reply_text=their_comment_text,
        post_text=my_post_text,
        post_author="Me",
    )

    if not reply:
        raise HTTPException(status_code=500, detail="Failed to generate reply")

    return {"reply": reply}
