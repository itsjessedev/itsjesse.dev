"""API routes for LinkedIn integration."""

import logging
from typing import Optional
from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..database import get_db
from ..models import LinkedInAuth
from ..services.response_generator import ResponseGenerator
# NOTE: linkedin_scraper.py exists but is not used - VPS IP is blocked by all search engines
# LinkedIn scraping only works with Apify or from client-side browser requests

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/api/linkedin", tags=["linkedin"])

# Get settings
settings = get_settings()

# LinkedIn OAuth Configuration (from settings)
LINKEDIN_CLIENT_ID = settings.linkedin_client_id
LINKEDIN_CLIENT_SECRET = settings.linkedin_client_secret
LINKEDIN_REDIRECT_URI = settings.linkedin_redirect_uri
LINKEDIN_SCOPES = "openid profile email w_member_social"


class LinkedInAuthStatus(BaseModel):
    """LinkedIn auth status response."""
    is_authenticated: bool
    person_name: Optional[str] = None
    expires_at: Optional[datetime] = None
    expires_in_days: Optional[int] = None
    needs_refresh: bool = False


class LinkedInPostRequest(BaseModel):
    """Request to post to LinkedIn."""
    text: str
    visibility: str = "PUBLIC"  # PUBLIC, CONNECTIONS


class LinkedInEngagementPost(BaseModel):
    """A LinkedIn post found for engagement."""
    source_id: str
    url: str
    author: str
    author_url: Optional[str] = None
    author_headline: Optional[str] = None
    text: str
    posted_at: Optional[str] = None
    reactions: int = 0
    comments: int = 0


class GenerateResponseRequest(BaseModel):
    """Request to generate a response for a LinkedIn post."""
    post_text: str
    author: str
    author_headline: Optional[str] = None


class LinkedInCommentRequest(BaseModel):
    """Request to post a comment on a LinkedIn post."""
    post_url: str  # LinkedIn post URL
    comment_text: str


class LinkedInLikeRequest(BaseModel):
    """Request to like a LinkedIn post."""
    post_url: str  # LinkedIn post URL


# ============== OAuth Endpoints ==============

@router.get("/auth/url")
async def get_auth_url():
    """Get LinkedIn OAuth authorization URL."""
    if not LINKEDIN_CLIENT_ID:
        raise HTTPException(status_code=500, detail="LinkedIn client ID not configured")

    params = {
        "response_type": "code",
        "client_id": LINKEDIN_CLIENT_ID,
        "redirect_uri": LINKEDIN_REDIRECT_URI,
        "scope": LINKEDIN_SCOPES,
        "state": "devscout",  # Could be CSRF token
    }

    auth_url = f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(params)}"
    return {"url": auth_url}


@router.post("/auth/callback")
async def handle_oauth_callback(
    code: str,
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Handle OAuth callback and exchange code for token."""
    if not LINKEDIN_CLIENT_ID or not LINKEDIN_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="LinkedIn OAuth not configured")

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": LINKEDIN_CLIENT_ID,
                "client_secret": LINKEDIN_CLIENT_SECRET,
                "redirect_uri": LINKEDIN_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if token_response.status_code != 200:
            logger.error(f"LinkedIn token exchange failed: {token_response.text}")
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")

        token_data = token_response.json()
        access_token = token_data.get("access_token")
        expires_in = token_data.get("expires_in", 5184000)  # Default 60 days

        # Get user profile
        profile_response = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        person_id = None
        person_name = None
        if profile_response.status_code == 200:
            profile = profile_response.json()
            person_id = profile.get("sub")
            person_name = profile.get("name")

    # Store in database (replace existing)
    existing = await db.scalar(select(LinkedInAuth).where(LinkedInAuth.id == 1))
    if existing:
        existing.access_token = access_token
        existing.expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        existing.scope = LINKEDIN_SCOPES
        existing.person_id = person_id
        existing.person_name = person_name
        existing.updated_at = datetime.utcnow()
    else:
        auth = LinkedInAuth(
            id=1,  # Single user
            access_token=access_token,
            expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
            scope=LINKEDIN_SCOPES,
            person_id=person_id,
            person_name=person_name,
        )
        db.add(auth)

    await db.commit()

    return {
        "status": "authenticated",
        "person_name": person_name,
        "expires_in_days": expires_in // 86400,
    }


@router.get("/auth/status", response_model=LinkedInAuthStatus)
async def get_auth_status(db: AsyncSession = Depends(get_db)):
    """Check LinkedIn authentication status."""
    auth = await db.get(LinkedInAuth, 1)

    if not auth:
        return LinkedInAuthStatus(is_authenticated=False)

    now = datetime.utcnow()
    expires_in_days = (auth.expires_at - now).days if auth.expires_at > now else 0

    return LinkedInAuthStatus(
        is_authenticated=auth.expires_at > now,
        person_name=auth.person_name,
        expires_at=auth.expires_at,
        expires_in_days=expires_in_days,
        needs_refresh=expires_in_days < 15,  # Warn when less than 15 days left
    )


@router.delete("/auth")
async def revoke_auth(db: AsyncSession = Depends(get_db)):
    """Revoke LinkedIn authentication."""
    auth = await db.get(LinkedInAuth, 1)
    if auth:
        await db.delete(auth)
        await db.commit()

    return {"status": "revoked"}


# ============== Posting Endpoints ==============

async def get_linkedin_token(db: AsyncSession) -> str:
    """Get valid LinkedIn access token."""
    auth = await db.get(LinkedInAuth, 1)
    if not auth:
        raise HTTPException(status_code=401, detail="LinkedIn not authenticated")

    if auth.expires_at <= datetime.utcnow():
        raise HTTPException(status_code=401, detail="LinkedIn token expired, please re-authenticate")

    return auth.access_token


@router.post("/posts")
async def publish_post(
    request: LinkedInPostRequest,
    db: AsyncSession = Depends(get_db),
):
    """Publish a post to LinkedIn."""
    access_token = await get_linkedin_token(db)
    auth = await db.get(LinkedInAuth, 1)

    if not auth or not auth.person_id:
        raise HTTPException(status_code=400, detail="Missing LinkedIn person ID")

    # LinkedIn UGC Post API
    post_data = {
        "author": f"urn:li:person:{auth.person_id}",
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": request.text},
                "shareMediaCategory": "NONE",
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": request.visibility
        },
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.linkedin.com/v2/ugcPosts",
            json=post_data,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            },
        )

        if response.status_code not in [200, 201]:
            logger.error(f"LinkedIn post failed: {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to post to LinkedIn: {response.text}"
            )

        result = response.json()
        post_id = result.get("id", "")

        return {
            "status": "published",
            "post_id": post_id,
            "url": f"https://www.linkedin.com/feed/update/{post_id}" if post_id else None,
        }


async def _like_post(client: httpx.AsyncClient, access_token: str, person_id: str, post_urn: str) -> bool:
    """Helper to like a LinkedIn post. Returns True if successful, False otherwise."""
    import re

    encoded_urn = post_urn.replace(":", "%3A")
    like_data = {
        "actor": f"urn:li:person:{person_id}",
        "object": post_urn,
    }

    try:
        response = await client.post(
            f"https://api.linkedin.com/v2/socialActions/{encoded_urn}/likes",
            json=like_data,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            },
        )

        # If we get a 400 with wrong URN, try with the correct URN
        if response.status_code == 400:
            error_text = response.text
            actual_urn_match = re.search(r'actual threadUrn: (urn:li:\w+:\d+)', error_text)
            if actual_urn_match:
                correct_urn = actual_urn_match.group(1)
                logger.info(f"Like: LinkedIn returned correct URN: {correct_urn}, retrying...")
                encoded_correct_urn = correct_urn.replace(":", "%3A")
                like_data["object"] = correct_urn

                retry_response = await client.post(
                    f"https://api.linkedin.com/v2/socialActions/{encoded_correct_urn}/likes",
                    json=like_data,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                        "X-Restli-Protocol-Version": "2.0.0",
                    },
                )
                if retry_response.status_code in [200, 201]:
                    logger.info(f"Successfully liked post {correct_urn}")
                    return True

        if response.status_code in [200, 201]:
            logger.info(f"Successfully liked post {post_urn}")
            return True

        # 409 Conflict means already liked - that's fine
        if response.status_code == 409:
            logger.info(f"Post already liked: {post_urn}")
            return True

        logger.warning(f"Failed to like post: {response.status_code} - {response.text}")
        return False

    except Exception as e:
        logger.error(f"Error liking post: {e}")
        return False


@router.post("/comments")
async def post_comment(
    request: LinkedInCommentRequest,
    db: AsyncSession = Depends(get_db),
):
    """Post a comment on a LinkedIn post."""
    import re

    access_token = await get_linkedin_token(db)
    auth = await db.get(LinkedInAuth, 1)

    if not auth or not auth.person_id:
        raise HTTPException(status_code=400, detail="Missing LinkedIn person ID")

    # Extract activity ID from various LinkedIn URL formats
    # Format 1: https://www.linkedin.com/feed/update/urn:li:activity:7123456789/
    # Format 2: https://www.linkedin.com/posts/username_text-activity-7123456789-xxxx
    # Format 3: https://www.linkedin.com/feed/update/urn:li:share:7123456789/

    activity_urn = None
    url = request.post_url

    # Try to find activity URN directly in URL
    urn_match = re.search(r'urn:li:(activity|share|ugcPost):(\d+)', url)
    if urn_match:
        urn_type = urn_match.group(1)
        urn_id = urn_match.group(2)
        activity_urn = f"urn:li:{urn_type}:{urn_id}"
    else:
        # Try to extract from posts URL format (activity ID after last hyphen before the end)
        activity_match = re.search(r'-activity-(\d+)', url)
        if activity_match:
            activity_urn = f"urn:li:activity:{activity_match.group(1)}"

    if not activity_urn:
        raise HTTPException(
            status_code=400,
            detail="Could not extract activity ID from LinkedIn URL. Please provide a valid post URL."
        )

    # LinkedIn Comments API
    comment_data = {
        "actor": f"urn:li:person:{auth.person_id}",
        "message": {
            "text": request.comment_text
        }
    }

    # URL encode the URN for the API path
    encoded_urn = activity_urn.replace(":", "%3A")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.linkedin.com/v2/socialActions/{encoded_urn}/comments",
            json=comment_data,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            },
        )

        # If we get a 400 with "not the same as the actual threadUrn", extract correct URN and retry
        if response.status_code == 400:
            error_text = response.text
            actual_urn_match = re.search(r'actual threadUrn: (urn:li:\w+:\d+)', error_text)
            if actual_urn_match:
                correct_urn = actual_urn_match.group(1)
                logger.info(f"LinkedIn returned correct URN: {correct_urn}, retrying...")
                encoded_correct_urn = correct_urn.replace(":", "%3A")

                retry_response = await client.post(
                    f"https://api.linkedin.com/v2/socialActions/{encoded_correct_urn}/comments",
                    json=comment_data,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                        "X-Restli-Protocol-Version": "2.0.0",
                    },
                )

                if retry_response.status_code in [200, 201]:
                    result = retry_response.json()
                    comment_id = result.get("id", "")
                    # Auto-like the post using the correct URN
                    liked = await _like_post(client, access_token, auth.person_id, correct_urn)
                    return {
                        "status": "posted",
                        "comment_id": comment_id,
                        "activity_urn": correct_urn,
                        "liked": liked,
                    }
                else:
                    logger.error(f"LinkedIn comment retry failed: {retry_response.text}")
                    raise HTTPException(
                        status_code=retry_response.status_code,
                        detail=f"Failed to post comment: {retry_response.text}"
                    )

        if response.status_code not in [200, 201]:
            logger.error(f"LinkedIn comment failed: {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to post comment: {response.text}"
            )

        result = response.json()
        comment_id = result.get("id", "")

        # Auto-like the post
        liked = await _like_post(client, access_token, auth.person_id, activity_urn)

        return {
            "status": "posted",
            "comment_id": comment_id,
            "activity_urn": activity_urn,
            "liked": liked,
        }


# ============== Engagement Endpoints ==============

@router.get("/engagement", response_model=list[LinkedInEngagementPost])
async def fetch_engagement_posts(
    search_terms: str = Query(
        "developer discussion,tech tips,software engineering",
        description="Comma-separated search terms"
    ),
    limit: int = Query(50, le=100),
):
    """Fetch LinkedIn posts for engagement.

    Note: VPS IP is blocked by search engines, so this endpoint
    will return an empty list unless Apify is available.
    LinkedIn scraping from datacenter IPs is not reliable.
    """
    terms = [t.strip() for t in search_terms.split(",") if t.strip()]

    # VPS is blocked by search engines (DuckDuckGo, Bing, Google all block datacenter IPs)
    # Return helpful error message
    logger.info("LinkedIn engagement fetch requested - VPS blocked by search engines")
    raise HTTPException(
        status_code=503,
        detail="LinkedIn scraping temporarily unavailable. Search engines block VPS IPs. "
               "Use the Prospects tab which fetches from your browser instead."
    )


class EngagementFetchRequest(BaseModel):
    """Request to fetch LinkedIn engagement posts via Apify."""
    search_terms: list[str] = [
        "developer tips",
        "coding lessons learned",
        "software engineering",
        "automation workflow",
        "API integration",
    ]
    limit: int = 20  # Per-fetch limit


@router.post("/engagement/fetch")
async def fetch_engagement_via_apify(request: EngagementFetchRequest):
    """
    Fetch LinkedIn posts for engagement via Apify.

    Uses Apify's LinkedIn Posts Search Scraper.
    Limit is per-fetch (default 20).
    """
    settings = get_settings()

    # Collect available API keys (supports up to 6 keys with rotation)
    api_keys = [k for k in [
        settings.apify_api_key,
        settings.apify_api_key_2,
        settings.apify_api_key_3,
        settings.apify_api_key_4,
        settings.apify_api_key_5,
        settings.apify_api_key_6,
    ] if k]

    if not api_keys:
        return {"posts": [], "error": "Apify API key not configured. Add APIFY_API_KEY to .env"}

    all_posts = []
    seen_ids = set()
    current_key_index = 0
    posts_per_term = max(1, request.limit // len(request.search_terms))

    async def call_apify(client: httpx.AsyncClient, search_term: str, api_key: str):
        """Make Apify API call with given key."""
        actor_id = "apimaestro~linkedin-posts-search-scraper-no-cookies"
        run_url = f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items"
        return await client.post(
            run_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "keyword": search_term,
                "sortBy": "date_posted",
                "maxPosts": posts_per_term,
            },
        )

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            for search_term in request.search_terms:
                if len(all_posts) >= request.limit:
                    break

                try:
                    # Try with current key, rotate on quota exhaustion (402)
                    response = None
                    for attempt in range(len(api_keys)):
                        key_idx = (current_key_index + attempt) % len(api_keys)
                        api_key = api_keys[key_idx]

                        response = await call_apify(client, search_term, api_key)

                        if response.status_code in (402, 403):
                            logger.warning(f"Apify key {key_idx + 1} failed ({response.status_code}), trying next...")
                            if attempt == len(api_keys) - 1:
                                logger.error("All Apify keys exhausted or invalid")
                                return {"posts": all_posts, "error": "All Apify API keys exhausted or invalid.", "count": len(all_posts)}
                            continue
                        else:
                            current_key_index = key_idx
                            break

                    if response is None or response.status_code not in (200, 201):
                        logger.error(f"Apify error for '{search_term}': {response.status_code if response else 'no response'}")
                        continue

                    data = response.json()

                    # Transform Apify results to engagement format
                    for item in data:
                        if len(all_posts) >= request.limit:
                            break

                        post_id = item.get("activity_id") or item.get("full_urn") or item.get("post_url", "")
                        if not post_id or post_id in seen_ids:
                            continue
                        seen_ids.add(post_id)

                        text = item.get("text") or ""
                        if not text:
                            continue

                        # Extract author info
                        author_obj = item.get("author") or {}
                        author_name = author_obj.get("name", "") if isinstance(author_obj, dict) else str(author_obj)
                        author_url = author_obj.get("profile_url", "") if isinstance(author_obj, dict) else ""
                        author_headline = author_obj.get("headline", "") if isinstance(author_obj, dict) else ""

                        # Extract stats
                        stats = item.get("stats") or {}
                        reactions = stats.get("total_reactions", 0) if isinstance(stats, dict) else 0
                        comments_count = stats.get("comments", 0) if isinstance(stats, dict) else 0

                        # Extract posted_at
                        posted_at_obj = item.get("posted_at") or {}
                        posted_at = None
                        if isinstance(posted_at_obj, dict):
                            ts = posted_at_obj.get("timestamp")
                            if ts:
                                try:
                                    posted_at = datetime.fromtimestamp(ts / 1000).isoformat()
                                except (ValueError, TypeError):
                                    pass

                        all_posts.append({
                            "source_id": post_id,
                            "url": item.get("post_url", ""),
                            "author": author_name,
                            "author_url": author_url,
                            "author_headline": author_headline,
                            "text": text,
                            "posted_at": posted_at,
                            "reactions": reactions,
                            "comments": comments_count,
                        })

                except Exception as e:
                    logger.error(f"Error fetching term '{search_term}': {e}")
                    continue

        logger.info(f"Fetched {len(all_posts)} LinkedIn engagement posts via Apify")
        return {"posts": all_posts, "count": len(all_posts)}

    except Exception as e:
        logger.error(f"LinkedIn Apify fetch error: {e}")
        return {"posts": all_posts, "error": str(e), "count": len(all_posts)}


@router.post("/generate-response")
async def generate_linkedin_response(request: GenerateResponseRequest):
    """Generate an AI response for a LinkedIn post."""
    generator = ResponseGenerator()

    # Create context for generation
    context = f"LinkedIn post by {request.author}"
    if request.author_headline:
        context += f" ({request.author_headline})"

    response = await generator.generate(
        title=context,
        body=request.post_text,
        subreddit="linkedin",  # Will be handled specially by generator
    )

    return {"response": response}


class GenerateLinkedInPostRequest(BaseModel):
    """Request to generate a LinkedIn post."""
    idea_template: str
    category: str
    length: str = "medium"  # short, medium, long


@router.post("/generate-post")
async def generate_linkedin_post(request: GenerateLinkedInPostRequest):
    """Generate an AI-written LinkedIn post."""
    generator = ResponseGenerator()

    response = await generator.generate_linkedin_post(
        idea_template=request.idea_template,
        category=request.category,
        length=request.length,
    )

    if not response:
        raise HTTPException(status_code=500, detail="Failed to generate LinkedIn post")

    return {"response": response}


# ============== Job Leads Endpoints ==============

@router.get("/job-leads")
async def fetch_job_leads(
    limit: int = Query(50, le=100),
):
    """Fetch LinkedIn job/hiring posts.

    Note: VPS IP is blocked by search engines, so this endpoint
    is temporarily unavailable. Use Prospects tab instead which
    fetches from your browser.
    """
    # VPS is blocked by search engines (DuckDuckGo, Bing, Google all block datacenter IPs)
    logger.info("LinkedIn job leads fetch requested - VPS blocked by search engines")
    raise HTTPException(
        status_code=503,
        detail="LinkedIn job leads temporarily unavailable. Search engines block VPS IPs. "
               "LinkedIn leads are still available in the Prospects tab (fetched from your browser)."
    )
