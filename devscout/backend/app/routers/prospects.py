"""API routes for prospects (AI-enhanced lead scoring)."""

import json
import logging
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query

logger = logging.getLogger("uvicorn.error")
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Prospect
from ..services.prospect_scorer import ProspectInput, get_scorer

router = APIRouter(prefix="/api/prospects", tags=["prospects"])


# ============================================================================
# Request/Response Schemas
# ============================================================================

class ProspectScoreRequest(BaseModel):
    """Request to score a batch of prospects."""
    prospects: List[ProspectInput]


class ProspectCreate(BaseModel):
    """Create a new prospect in the database."""
    source: str
    source_id: str
    platform_detail: Optional[str] = None
    title: Optional[str] = None
    body: Optional[str] = None
    url: str
    author: Optional[str] = None
    author_url: Optional[str] = None
    posted_at: Optional[datetime] = None

    # AI scoring (from scorer)
    ai_score: Optional[dict] = None
    is_lead: bool = False
    confidence: float = 0.0
    fit_score: int = 0
    urgency: str = "unknown"
    budget_signal: str = "unknown"
    lead_type: str = "unknown"
    key_need: Optional[str] = None
    services_needed: List[str] = []
    contact_info: Optional[str] = None
    company_name: Optional[str] = None
    recommended_approach: Optional[str] = None


class ProspectUpdate(BaseModel):
    """Update a prospect's status or notes."""
    status: Optional[str] = None  # new, reviewing, contacted, replied, converted, dismissed
    notes: Optional[str] = None


class ProspectResponse(BaseModel):
    """Response schema for a prospect."""
    id: int
    source: str
    source_id: str
    platform_detail: Optional[str] = None
    title: Optional[str] = None
    body: Optional[str] = None
    url: str
    author: Optional[str] = None
    author_url: Optional[str] = None
    posted_at: Optional[datetime] = None

    # AI scoring
    ai_score: Optional[dict] = None
    is_lead: bool
    confidence: float
    fit_score: int
    urgency: str
    budget_signal: str
    lead_type: str
    key_need: Optional[str] = None
    services_needed: List[str] = []
    contact_info: Optional[str] = None
    company_name: Optional[str] = None
    recommended_approach: Optional[str] = None

    # Status tracking
    status: str
    contacted_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    converted_at: Optional[datetime] = None
    notes: Optional[str] = None

    # Metadata
    discovered_at: datetime
    last_scored_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProspectStatsResponse(BaseModel):
    """Stats for the prospects dashboard."""
    total: int
    leads: int
    hot: int  # fit_score >= 70
    warm: int  # fit_score >= 40
    cool: int  # fit_score < 40
    by_status: dict
    by_source: dict
    by_urgency: dict


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/score-batch")
async def score_prospects_batch(request: ProspectScoreRequest):
    """
    Score a batch of prospects using AI analysis.

    This is the main endpoint for the frontend to send raw prospects
    and receive AI-qualified results. Does NOT store in database.
    """
    scorer = get_scorer()

    results = await scorer.score_batch(
        prospects=request.prospects,
        delay_ms=200,  # Rate limiting
    )

    # Filter to only leads and sort by fit_score
    leads = [r for r in results if r.get("is_lead", False)]
    leads.sort(key=lambda x: x.get("fit_score", 0), reverse=True)

    return {
        "total_processed": len(results),
        "leads_found": len(leads),
        "results": results,  # All results (for debugging/transparency)
        "leads": leads,  # Just the qualified leads
    }


@router.post("/", response_model=ProspectResponse)
async def create_prospect(
    prospect: ProspectCreate,
    db: AsyncSession = Depends(get_db),
):
    """Store a qualified prospect in the database."""
    # Check for duplicates
    existing = await db.scalar(
        select(Prospect).where(
            Prospect.source == prospect.source,
            Prospect.source_id == prospect.source_id,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Prospect already exists")

    # Create new prospect
    db_prospect = Prospect(
        source=prospect.source,
        source_id=prospect.source_id,
        platform_detail=prospect.platform_detail,
        title=prospect.title,
        body=prospect.body,
        url=prospect.url,
        author=prospect.author,
        author_url=prospect.author_url,
        posted_at=prospect.posted_at,
        ai_score=json.dumps(prospect.ai_score) if prospect.ai_score else None,
        is_lead=prospect.is_lead,
        confidence=prospect.confidence,
        fit_score=prospect.fit_score,
        urgency=prospect.urgency,
        budget_signal=prospect.budget_signal,
        lead_type=prospect.lead_type,
        key_need=prospect.key_need,
        services_needed=json.dumps(prospect.services_needed),
        contact_info=prospect.contact_info,
        company_name=prospect.company_name,
        recommended_approach=prospect.recommended_approach,
        last_scored_at=datetime.utcnow(),
    )
    db.add(db_prospect)
    await db.commit()
    await db.refresh(db_prospect)

    # Parse JSON fields for response
    return _prospect_to_response(db_prospect)


@router.post("/batch")
async def create_prospects_batch(
    prospects: List[ProspectCreate],
    db: AsyncSession = Depends(get_db),
):
    """Store multiple prospects at once (deduplicates)."""
    added = 0
    skipped = 0

    for prospect in prospects:
        # Check for duplicates
        existing = await db.scalar(
            select(Prospect).where(
                Prospect.source == prospect.source,
                Prospect.source_id == prospect.source_id,
            )
        )
        if existing:
            skipped += 1
            continue

        # Create new prospect
        db_prospect = Prospect(
            source=prospect.source,
            source_id=prospect.source_id,
            platform_detail=prospect.platform_detail,
            title=prospect.title,
            body=prospect.body,
            url=prospect.url,
            author=prospect.author,
            author_url=prospect.author_url,
            posted_at=prospect.posted_at,
            ai_score=json.dumps(prospect.ai_score) if prospect.ai_score else None,
            is_lead=prospect.is_lead,
            confidence=prospect.confidence,
            fit_score=prospect.fit_score,
            urgency=prospect.urgency,
            budget_signal=prospect.budget_signal,
            lead_type=prospect.lead_type,
            key_need=prospect.key_need,
            services_needed=json.dumps(prospect.services_needed),
            contact_info=prospect.contact_info,
            company_name=prospect.company_name,
            recommended_approach=prospect.recommended_approach,
            last_scored_at=datetime.utcnow(),
        )
        db.add(db_prospect)
        added += 1

    await db.commit()
    return {"added": added, "skipped": skipped}


@router.get("/", response_model=List[ProspectResponse])
async def list_prospects(
    status: Optional[str] = Query(None, description="Filter by status"),
    source: Optional[str] = Query(None, description="Filter by source"),
    is_lead: Optional[bool] = Query(None, description="Filter by is_lead"),
    min_fit_score: Optional[int] = Query(None, description="Minimum fit score"),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    """List prospects with optional filters."""
    query = select(Prospect).order_by(
        Prospect.fit_score.desc(),
        Prospect.discovered_at.desc(),
    )

    if status:
        query = query.where(Prospect.status == status)
    if source:
        query = query.where(Prospect.source == source)
    if is_lead is not None:
        query = query.where(Prospect.is_lead == is_lead)
    if min_fit_score is not None:
        query = query.where(Prospect.fit_score >= min_fit_score)

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    prospects = result.scalars().all()

    return [_prospect_to_response(p) for p in prospects]


@router.get("/stats", response_model=ProspectStatsResponse)
async def get_prospect_stats(db: AsyncSession = Depends(get_db)):
    """Get prospect dashboard statistics."""
    # Total counts
    total = await db.scalar(select(func.count(Prospect.id))) or 0
    leads = await db.scalar(
        select(func.count(Prospect.id)).where(Prospect.is_lead == True)
    ) or 0
    hot = await db.scalar(
        select(func.count(Prospect.id)).where(
            Prospect.is_lead == True,
            Prospect.fit_score >= 70,
        )
    ) or 0
    warm = await db.scalar(
        select(func.count(Prospect.id)).where(
            Prospect.is_lead == True,
            Prospect.fit_score >= 40,
            Prospect.fit_score < 70,
        )
    ) or 0
    cool = await db.scalar(
        select(func.count(Prospect.id)).where(
            Prospect.is_lead == True,
            Prospect.fit_score < 40,
        )
    ) or 0

    # By status
    status_query = select(
        Prospect.status, func.count(Prospect.id)
    ).group_by(Prospect.status)
    result = await db.execute(status_query)
    by_status = {row[0]: row[1] for row in result.all()}

    # By source
    source_query = select(
        Prospect.source, func.count(Prospect.id)
    ).group_by(Prospect.source)
    result = await db.execute(source_query)
    by_source = {row[0]: row[1] for row in result.all()}

    # By urgency
    urgency_query = select(
        Prospect.urgency, func.count(Prospect.id)
    ).where(Prospect.is_lead == True).group_by(Prospect.urgency)
    result = await db.execute(urgency_query)
    by_urgency = {row[0]: row[1] for row in result.all()}

    return ProspectStatsResponse(
        total=total,
        leads=leads,
        hot=hot,
        warm=warm,
        cool=cool,
        by_status=by_status,
        by_source=by_source,
        by_urgency=by_urgency,
    )


@router.get("/{prospect_id}", response_model=ProspectResponse)
async def get_prospect(prospect_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific prospect."""
    prospect = await db.get(Prospect, prospect_id)
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")
    return _prospect_to_response(prospect)


@router.patch("/{prospect_id}", response_model=ProspectResponse)
async def update_prospect(
    prospect_id: int,
    update: ProspectUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a prospect's status or notes."""
    prospect = await db.get(Prospect, prospect_id)
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")

    if update.status:
        prospect.status = update.status
        # Track timestamps for status changes
        now = datetime.utcnow()
        if update.status == "contacted":
            prospect.contacted_at = now
        elif update.status == "replied":
            prospect.replied_at = now
        elif update.status == "converted":
            prospect.converted_at = now

    if update.notes is not None:
        prospect.notes = update.notes

    await db.commit()
    await db.refresh(prospect)
    return _prospect_to_response(prospect)


@router.delete("/{prospect_id}")
async def delete_prospect(prospect_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a prospect."""
    prospect = await db.get(Prospect, prospect_id)
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")

    await db.delete(prospect)
    await db.commit()
    return {"deleted": True}


@router.delete("/clear/all")
async def clear_all_prospects(
    keep_contacted: bool = Query(False, description="Keep contacted/converted prospects"),
    db: AsyncSession = Depends(get_db),
):
    """Clear all prospects from the database."""
    from sqlalchemy import delete

    if keep_contacted:
        result = await db.execute(
            delete(Prospect).where(
                ~Prospect.status.in_(["contacted", "replied", "converted"])
            )
        )
    else:
        result = await db.execute(delete(Prospect))

    await db.commit()
    return {"deleted": result.rowcount}


# ============================================================================
# Helpers
# ============================================================================

def _prospect_to_response(prospect: Prospect) -> ProspectResponse:
    """Convert a Prospect model to response schema, parsing JSON fields."""
    # Parse JSON fields
    ai_score = None
    if prospect.ai_score:
        try:
            ai_score = json.loads(prospect.ai_score)
        except json.JSONDecodeError:
            pass

    services_needed = []
    if prospect.services_needed:
        try:
            services_needed = json.loads(prospect.services_needed)
        except json.JSONDecodeError:
            pass

    return ProspectResponse(
        id=prospect.id,
        source=prospect.source,
        source_id=prospect.source_id,
        platform_detail=prospect.platform_detail,
        title=prospect.title,
        body=prospect.body,
        url=prospect.url,
        author=prospect.author,
        author_url=prospect.author_url,
        posted_at=prospect.posted_at,
        ai_score=ai_score,
        is_lead=prospect.is_lead,
        confidence=prospect.confidence,
        fit_score=prospect.fit_score,
        urgency=prospect.urgency,
        budget_signal=prospect.budget_signal,
        lead_type=prospect.lead_type,
        key_need=prospect.key_need,
        services_needed=services_needed,
        contact_info=prospect.contact_info,
        company_name=prospect.company_name,
        recommended_approach=prospect.recommended_approach,
        status=prospect.status,
        contacted_at=prospect.contacted_at,
        replied_at=prospect.replied_at,
        converted_at=prospect.converted_at,
        notes=prospect.notes,
        discovered_at=prospect.discovered_at,
        last_scored_at=prospect.last_scored_at,
    )


# ============================================================================
# LinkedIn via Apify
# ============================================================================

class LinkedInPostsRequest(BaseModel):
    """Request to fetch LinkedIn posts via Apify."""
    search_terms: List[str] = [
        "looking for a developer",
        "need freelance developer",
        "hiring freelance developer",
        "looking for freelancer",
        "need a programmer",
    ]
    max_posts_per_term: int = 20
    sort_by: str = "date_posted"  # "relevance" or "date_posted"


class LinkedInPost(BaseModel):
    """LinkedIn post from a user looking for help."""
    source: str = "linkedin"
    source_id: str
    platform_detail: str = "LinkedIn Posts"
    title: str  # First ~100 chars of post
    body: Optional[str] = None
    url: str
    author: Optional[str] = None
    author_url: Optional[str] = None
    author_headline: Optional[str] = None
    posted_at: Optional[str] = None
    reactions: int = 0
    comments: int = 0


@router.post("/linkedin")
async def fetch_linkedin_posts(request: LinkedInPostsRequest):
    """
    Fetch LinkedIn posts from people looking for developers.

    Uses Apify's LinkedIn Posts Search Scraper (no login required).
    Cost: ~$5 per 1,000 posts
    Free tier: $5/month credit (~1,000 posts)

    Requires APIFY_API_KEY in .env
    """
    import httpx
    from ..config import get_settings

    settings = get_settings()

    if not settings.apify_api_key:
        return {"posts": [], "error": "Apify API key not configured. Add APIFY_API_KEY to .env"}

    all_posts = []
    seen_ids = set()

    try:
        # Apify LinkedIn Posts Search Scraper (no cookies needed)
        actor_id = "apimaestro~linkedin-posts-search-scraper-no-cookies"
        run_url = f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items"

        async with httpx.AsyncClient(timeout=180.0) as client:
            for search_term in request.search_terms:
                try:
                    response = await client.post(
                        run_url,
                        headers={
                            "Authorization": f"Bearer {settings.apify_api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "keyword": search_term,
                            "sortBy": request.sort_by,
                            "maxPosts": request.max_posts_per_term,
                        },
                    )

                    if response.status_code not in (200, 201):
                        logger.error(f"LinkedIn API error for '{search_term}': {response.status_code}")
                        continue

                    data = response.json()

                    # Transform Apify results to our format
                    # Apify fields: activity_id, post_url, text, full_urn, author (object),
                    #               stats (object), posted_at, hashtags, content, is_reshare
                    for item in data:
                        post_id = item.get("activity_id") or item.get("full_urn") or item.get("post_url", "")
                        if not post_id or post_id in seen_ids:
                            continue
                        seen_ids.add(post_id)

                        # Get post text
                        text = item.get("text") or ""
                        title = text[:100] + "..." if len(text) > 100 else text

                        # Extract author info (author is an object with name, headline, profile_url)
                        author_obj = item.get("author") or {}
                        author_name = author_obj.get("name", "") if isinstance(author_obj, dict) else str(author_obj)
                        author_url = author_obj.get("profile_url", "") if isinstance(author_obj, dict) else ""
                        author_headline = author_obj.get("headline", "") if isinstance(author_obj, dict) else ""

                        # Extract stats (stats is an object with total_reactions, comments, shares)
                        stats = item.get("stats") or {}
                        reactions = stats.get("total_reactions", 0) if isinstance(stats, dict) else 0
                        comments_count = stats.get("comments", 0) if isinstance(stats, dict) else 0

                        # Extract posted_at (it's an object with display_text and timestamp)
                        posted_at_obj = item.get("posted_at") or {}
                        if isinstance(posted_at_obj, dict):
                            # Convert Unix timestamp (ms) to ISO string
                            ts = posted_at_obj.get("timestamp")
                            if ts:
                                from datetime import datetime
                                posted_at_str = datetime.fromtimestamp(ts / 1000).isoformat()
                            else:
                                posted_at_str = posted_at_obj.get("display_text", "")
                        else:
                            posted_at_str = str(posted_at_obj)

                        post = LinkedInPost(
                            source_id=f"li_post_{hash(post_id) % 10**8}",
                            title=title,
                            body=text[:2000] if text else None,
                            url=item.get("post_url") or "",
                            author=author_name,
                            author_url=author_url,
                            author_headline=author_headline,
                            posted_at=posted_at_str,
                            reactions=reactions,
                            comments=comments_count,
                        )
                        all_posts.append(post.model_dump())

                except Exception as e:
                    logger.error(f"Error searching LinkedIn for '{search_term}': {e}")
                    continue

        return {"posts": all_posts, "count": len(all_posts)}

    except httpx.TimeoutException:
        return {"posts": all_posts, "error": "Some LinkedIn requests timed out", "count": len(all_posts)}
    except Exception as e:
        return {"posts": [], "error": f"Error fetching LinkedIn posts: {str(e)}"}
