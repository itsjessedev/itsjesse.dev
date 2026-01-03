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

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/api/linkedin", tags=["linkedin"])

# Get settings
settings = get_settings()

# LinkedIn OAuth Configuration (from settings)
LINKEDIN_CLIENT_ID = settings.linkedin_client_id
LINKEDIN_CLIENT_SECRET = settings.linkedin_client_secret
LINKEDIN_REDIRECT_URI = settings.linkedin_redirect_uri
LINKEDIN_SCOPES = "openid profile email w_member_social"

# Apify Configuration (from settings)
APIFY_API_KEY = settings.apify_api_key


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


# ============== Engagement Endpoints ==============

@router.get("/engagement", response_model=list[LinkedInEngagementPost])
async def fetch_engagement_posts(
    search_terms: str = Query(
        "developer discussion,tech tips,software engineering",
        description="Comma-separated search terms"
    ),
    limit: int = Query(50, le=100),
):
    """Fetch LinkedIn posts for engagement using Apify."""
    if not APIFY_API_KEY:
        raise HTTPException(status_code=500, detail="Apify API key not configured")

    terms = [t.strip() for t in search_terms.split(",") if t.strip()]
    all_posts = []
    seen_ids = set()

    async with httpx.AsyncClient(timeout=120.0) as client:
        for term in terms[:3]:  # Limit to 3 terms to control costs
            try:
                response = await client.post(
                    "https://api.apify.com/v2/acts/apimaestro~linkedin-posts-search-scraper-no-cookies/run-sync-get-dataset-items",
                    headers={
                        "Authorization": f"Bearer {APIFY_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "keyword": term,
                        "limit": limit // len(terms),
                        "sort": "relevance",
                    },
                )

                if response.status_code in [200, 201]:
                    data = response.json()
                    if isinstance(data, list):
                        for item in data:
                            post_id = item.get("activity_id") or item.get("full_urn") or item.get("post_url", "")
                            if not post_id or post_id in seen_ids:
                                continue
                            seen_ids.add(post_id)

                            text = item.get("text") or ""
                            author_obj = item.get("author") or {}
                            stats = item.get("stats") or {}
                            posted_at_obj = item.get("posted_at") or {}

                            # Convert timestamp
                            posted_at_str = None
                            if isinstance(posted_at_obj, dict):
                                ts = posted_at_obj.get("timestamp")
                                if ts:
                                    posted_at_str = datetime.fromtimestamp(ts / 1000).isoformat()

                            all_posts.append(LinkedInEngagementPost(
                                source_id=f"li_{hash(post_id) % 10**8}",
                                url=item.get("post_url") or "",
                                author=author_obj.get("name", "") if isinstance(author_obj, dict) else str(author_obj),
                                author_url=author_obj.get("profile_url", "") if isinstance(author_obj, dict) else None,
                                author_headline=author_obj.get("headline", "") if isinstance(author_obj, dict) else None,
                                text=text[:2000] if text else "",
                                posted_at=posted_at_str,
                                reactions=stats.get("total_reactions", 0) if isinstance(stats, dict) else 0,
                                comments=stats.get("comments", 0) if isinstance(stats, dict) else 0,
                            ))

            except Exception as e:
                logger.warning(f"Failed to fetch LinkedIn posts for '{term}': {e}")
                continue

    return all_posts[:limit]


@router.post("/generate-response")
async def generate_linkedin_response(request: GenerateResponseRequest):
    """Generate an AI response for a LinkedIn post."""
    generator = ResponseGenerator()

    # Create context for generation
    context = f"LinkedIn post by {request.author}"
    if request.author_headline:
        context += f" ({request.author_headline})"

    response = await generator.generate_response(
        title=context,
        body=request.post_text,
        subreddit="linkedin",  # Will be handled specially by generator
        author=request.author,
    )

    return {"response": response}


class GenerateLinkedInPostRequest(BaseModel):
    """Request to generate a LinkedIn post."""
    idea_template: str
    category: str


@router.post("/generate-post")
async def generate_linkedin_post(request: GenerateLinkedInPostRequest):
    """Generate an AI-written LinkedIn post."""
    generator = ResponseGenerator()

    response = await generator.generate_linkedin_post(
        idea_template=request.idea_template,
        category=request.category,
    )

    if not response:
        raise HTTPException(status_code=500, detail="Failed to generate LinkedIn post")

    return {"response": response}


# ============== Job Leads Endpoints ==============

@router.get("/job-leads")
async def fetch_job_leads(
    limit: int = Query(50, le=100),
):
    """Fetch LinkedIn job/hiring posts using Apify (same as prospects linkedin endpoint)."""
    if not APIFY_API_KEY:
        raise HTTPException(status_code=500, detail="Apify API key not configured")

    # Focus on freelance/contract opportunities only
    search_terms = [
        "need freelance developer",
        "hiring freelance developer",
        "looking for freelancer developer",
        "freelance python developer",
        "contract developer needed",
        "looking for contractor developer",
        "freelance automation",
        "freelance API integration",
    ]

    # Exclude full-time/permanent positions
    exclude_patterns = [
        "full-time", "full time", "fulltime",
        "permanent position", "permanent role",
        "w-2", "w2 position",
        "direct hire", "perm role",
        "salary range", "annual salary",
        "benefits package", "401k", "health insurance",
        "we are hiring", "we're hiring",  # Usually company job postings
        "join our team", "apply now",  # Job board style
    ]

    def is_fulltime_posting(text: str) -> bool:
        """Check if post is for a full-time position."""
        text_lower = text.lower()
        return any(pattern in text_lower for pattern in exclude_patterns)

    all_posts = []
    seen_ids = set()

    async with httpx.AsyncClient(timeout=120.0) as client:
        for term in search_terms:
            try:
                response = await client.post(
                    "https://api.apify.com/v2/acts/apimaestro~linkedin-posts-search-scraper-no-cookies/run-sync-get-dataset-items",
                    headers={
                        "Authorization": f"Bearer {APIFY_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "keyword": term,
                        "limit": 20,
                        "sort": "date",
                    },
                )

                if response.status_code in [200, 201]:
                    data = response.json()
                    if isinstance(data, list):
                        for item in data:
                            post_id = item.get("activity_id") or item.get("full_urn") or item.get("post_url", "")
                            if not post_id or post_id in seen_ids:
                                continue
                            seen_ids.add(post_id)

                            text = item.get("text") or ""

                            # Skip full-time job postings
                            if is_fulltime_posting(text):
                                continue

                            author_obj = item.get("author") or {}
                            stats = item.get("stats") or {}
                            posted_at_obj = item.get("posted_at") or {}

                            posted_at_str = None
                            if isinstance(posted_at_obj, dict):
                                ts = posted_at_obj.get("timestamp")
                                if ts:
                                    posted_at_str = datetime.fromtimestamp(ts / 1000).isoformat()

                            all_posts.append({
                                "source_id": f"li_post_{hash(post_id) % 10**8}",
                                "title": text[:100] + "..." if len(text) > 100 else text,
                                "body": text[:2000] if text else None,
                                "url": item.get("post_url") or "",
                                "author": author_obj.get("name", "") if isinstance(author_obj, dict) else str(author_obj),
                                "author_url": author_obj.get("profile_url", "") if isinstance(author_obj, dict) else None,
                                "author_headline": author_obj.get("headline", "") if isinstance(author_obj, dict) else None,
                                "posted_at": posted_at_str,
                                "reactions": stats.get("total_reactions", 0) if isinstance(stats, dict) else 0,
                                "comments": stats.get("comments", 0) if isinstance(stats, dict) else 0,
                            })

            except Exception as e:
                logger.warning(f"Failed to fetch LinkedIn job leads for '{term}': {e}")
                continue

    return all_posts[:limit]
