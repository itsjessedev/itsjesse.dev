"""API routes for cross-device persistence of all DevScout data."""

from typing import Optional, List, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, delete, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from ..database import get_db
from ..models import (
    LinkedInJob, LinkedInEngagement,
    RedditJob, RedditEngagement,
    NewsPost, GitHubIssue,
)

router = APIRouter(prefix="/api/persistence", tags=["persistence"])


# ============ Pydantic Schemas ============

class LinkedInJobCreate(BaseModel):
    source_id: str
    url: str
    title: Optional[str] = None
    body: Optional[str] = None
    author: Optional[str] = None
    author_url: Optional[str] = None
    author_headline: Optional[str] = None
    posted_at: Optional[datetime] = None
    reactions: int = 0
    comments: int = 0


class LinkedInEngagementCreate(BaseModel):
    source_id: str
    url: str
    title: Optional[str] = None
    body: Optional[str] = None
    author: Optional[str] = None
    author_url: Optional[str] = None
    author_headline: Optional[str] = None
    posted_at: Optional[datetime] = None
    reactions: int = 0
    comments: int = 0


class RedditJobCreate(BaseModel):
    reddit_id: str
    subreddit: str
    title: Optional[str] = None
    body: Optional[str] = None
    url: str
    author: Optional[str] = None
    score: int = 0
    num_comments: int = 0
    created_utc: Optional[datetime] = None


class RedditEngagementCreate(BaseModel):
    reddit_id: str
    subreddit: str
    title: Optional[str] = None
    body: Optional[str] = None
    url: str
    author: Optional[str] = None
    score: int = 0
    num_comments: int = 0
    created_utc: Optional[datetime] = None
    relevance_score: float = 0.0
    keywords_matched: Optional[str] = None


class NewsPostCreate(BaseModel):
    source: str  # hackernews, lobsters, devto, hashnode
    source_id: str
    title: Optional[str] = None
    body: Optional[str] = None
    url: str
    author: Optional[str] = None
    score: int = 0
    comments: int = 0
    posted_at: Optional[datetime] = None
    tags: Optional[str] = None


class GitHubIssueCreate(BaseModel):
    github_id: int
    repo_owner: str
    repo_name: str
    issue_number: int
    title: Optional[str] = None
    body: Optional[str] = None
    url: str
    author: Optional[str] = None
    labels: Optional[str] = None
    language: Optional[str] = None
    stars: int = 0
    created_at_gh: Optional[datetime] = None


class StatusUpdate(BaseModel):
    status: str  # new, responded, dismissed
    suggested_response: Optional[str] = None


# ============ Response Models ============

class LinkedInJobResponse(BaseModel):
    id: int
    source_id: str
    url: str
    title: Optional[str]
    body: Optional[str]
    author: Optional[str]
    author_url: Optional[str]
    author_headline: Optional[str]
    posted_at: Optional[datetime]
    reactions: int
    comments: int
    status: str
    responded_at: Optional[datetime]
    suggested_response: Optional[str]
    discovered_at: datetime

    class Config:
        from_attributes = True


class LinkedInEngagementResponse(BaseModel):
    id: int
    source_id: str
    url: str
    title: Optional[str]
    body: Optional[str]
    author: Optional[str]
    author_url: Optional[str]
    author_headline: Optional[str]
    posted_at: Optional[datetime]
    reactions: int
    comments: int
    status: str
    responded_at: Optional[datetime]
    suggested_response: Optional[str]
    discovered_at: datetime

    class Config:
        from_attributes = True


class RedditJobResponse(BaseModel):
    id: int
    reddit_id: str
    subreddit: str
    title: Optional[str]
    body: Optional[str]
    url: str
    author: Optional[str]
    score: int
    num_comments: int
    created_utc: Optional[datetime]
    status: str
    responded_at: Optional[datetime]
    suggested_response: Optional[str]
    discovered_at: datetime

    class Config:
        from_attributes = True


class RedditEngagementResponse(BaseModel):
    id: int
    reddit_id: str
    subreddit: str
    title: Optional[str]
    body: Optional[str]
    url: str
    author: Optional[str]
    score: int
    num_comments: int
    created_utc: Optional[datetime]
    relevance_score: float
    keywords_matched: Optional[str]
    status: str
    responded_at: Optional[datetime]
    suggested_response: Optional[str]
    discovered_at: datetime

    class Config:
        from_attributes = True


class NewsPostResponse(BaseModel):
    id: int
    source: str
    source_id: str
    title: Optional[str]
    body: Optional[str]
    url: str
    author: Optional[str]
    score: int
    comments: int
    posted_at: Optional[datetime]
    tags: Optional[str]
    status: str
    responded_at: Optional[datetime]
    suggested_response: Optional[str]
    discovered_at: datetime

    class Config:
        from_attributes = True


class GitHubIssueResponse(BaseModel):
    id: int
    github_id: int
    repo_owner: str
    repo_name: str
    issue_number: int
    title: Optional[str]
    body: Optional[str]
    url: str
    author: Optional[str]
    labels: Optional[str]
    language: Optional[str]
    stars: int
    created_at_gh: Optional[datetime]
    status: str
    responded_at: Optional[datetime]
    discovered_at: datetime

    class Config:
        from_attributes = True


# ============ LinkedIn Jobs ============

@router.post("/linkedin/jobs/batch")
async def upsert_linkedin_jobs(items: List[LinkedInJobCreate], db: AsyncSession = Depends(get_db)):
    """Upsert LinkedIn job posts (deduped by source_id)."""
    added = 0
    for item in items:
        existing = await db.scalar(
            select(LinkedInJob).where(LinkedInJob.source_id == item.source_id)
        )
        if not existing:
            job = LinkedInJob(**item.model_dump())
            db.add(job)
            added += 1
    await db.commit()
    return {"received": len(items), "added": added}


@router.get("/linkedin/jobs", response_model=List[LinkedInJobResponse])
async def get_linkedin_jobs(
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Get LinkedIn job posts, optionally filtered by status."""
    query = select(LinkedInJob).order_by(LinkedInJob.discovered_at.desc())
    if status:
        query = query.where(LinkedInJob.status == status)
    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/linkedin/jobs/{source_id}")
async def update_linkedin_job_status(
    source_id: str,
    update: StatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update status of a LinkedIn job post."""
    job = await db.scalar(select(LinkedInJob).where(LinkedInJob.source_id == source_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = update.status
    if update.status == "responded":
        job.responded_at = datetime.utcnow()
    if update.suggested_response:
        job.suggested_response = update.suggested_response

    await db.commit()
    return {"status": "updated", "source_id": source_id}


@router.delete("/linkedin/jobs/clear")
async def clear_linkedin_jobs(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Clear LinkedIn jobs, optionally by status."""
    query = delete(LinkedInJob)
    if status:
        query = query.where(LinkedInJob.status == status)
    result = await db.execute(query)
    await db.commit()
    return {"cleared": result.rowcount}


# ============ LinkedIn Engagement ============

@router.post("/linkedin/engagement/batch")
async def upsert_linkedin_engagement(items: List[LinkedInEngagementCreate], db: AsyncSession = Depends(get_db)):
    """Upsert LinkedIn engagement posts (deduped by source_id)."""
    added = 0
    for item in items:
        existing = await db.scalar(
            select(LinkedInEngagement).where(LinkedInEngagement.source_id == item.source_id)
        )
        if not existing:
            post = LinkedInEngagement(**item.model_dump())
            db.add(post)
            added += 1
    await db.commit()
    return {"received": len(items), "added": added}


@router.get("/linkedin/engagement", response_model=List[LinkedInEngagementResponse])
async def get_linkedin_engagement(
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Get LinkedIn engagement posts, optionally filtered by status."""
    query = select(LinkedInEngagement).order_by(LinkedInEngagement.discovered_at.desc())
    if status:
        query = query.where(LinkedInEngagement.status == status)
    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/linkedin/engagement/{source_id}")
async def update_linkedin_engagement_status(
    source_id: str,
    update: StatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update status of a LinkedIn engagement post."""
    post = await db.scalar(select(LinkedInEngagement).where(LinkedInEngagement.source_id == source_id))
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.status = update.status
    if update.status == "responded":
        post.responded_at = datetime.utcnow()
    if update.suggested_response:
        post.suggested_response = update.suggested_response

    await db.commit()
    return {"status": "updated", "source_id": source_id}


@router.delete("/linkedin/engagement/clear")
async def clear_linkedin_engagement(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Clear LinkedIn engagement posts, optionally by status."""
    query = delete(LinkedInEngagement)
    if status:
        query = query.where(LinkedInEngagement.status == status)
    result = await db.execute(query)
    await db.commit()
    return {"cleared": result.rowcount}


# ============ Reddit Jobs ============

@router.post("/reddit/jobs/batch")
async def upsert_reddit_jobs(items: List[RedditJobCreate], db: AsyncSession = Depends(get_db)):
    """Upsert Reddit job posts (deduped by reddit_id)."""
    added = 0
    for item in items:
        existing = await db.scalar(
            select(RedditJob).where(RedditJob.reddit_id == item.reddit_id)
        )
        if not existing:
            job = RedditJob(**item.model_dump())
            db.add(job)
            added += 1
    await db.commit()
    return {"received": len(items), "added": added}


@router.get("/reddit/jobs", response_model=List[RedditJobResponse])
async def get_reddit_jobs(
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Get Reddit job posts, optionally filtered by status."""
    query = select(RedditJob).order_by(RedditJob.discovered_at.desc())
    if status:
        query = query.where(RedditJob.status == status)
    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/reddit/jobs/{reddit_id}")
async def update_reddit_job_status(
    reddit_id: str,
    update: StatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update status of a Reddit job post."""
    job = await db.scalar(select(RedditJob).where(RedditJob.reddit_id == reddit_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = update.status
    if update.status == "responded":
        job.responded_at = datetime.utcnow()
    if update.suggested_response:
        job.suggested_response = update.suggested_response

    await db.commit()
    return {"status": "updated", "reddit_id": reddit_id}


@router.delete("/reddit/jobs/clear")
async def clear_reddit_jobs(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Clear Reddit jobs, optionally by status."""
    query = delete(RedditJob)
    if status:
        query = query.where(RedditJob.status == status)
    result = await db.execute(query)
    await db.commit()
    return {"cleared": result.rowcount}


# ============ Reddit Engagement ============

@router.post("/reddit/engagement/batch")
async def upsert_reddit_engagement(items: List[RedditEngagementCreate], db: AsyncSession = Depends(get_db)):
    """Upsert Reddit engagement posts (deduped by reddit_id)."""
    added = 0
    for item in items:
        existing = await db.scalar(
            select(RedditEngagement).where(RedditEngagement.reddit_id == item.reddit_id)
        )
        if not existing:
            post = RedditEngagement(**item.model_dump())
            db.add(post)
            added += 1
    await db.commit()
    return {"received": len(items), "added": added}


@router.get("/reddit/engagement", response_model=List[RedditEngagementResponse])
async def get_reddit_engagement(
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Get Reddit engagement posts, optionally filtered by status."""
    query = select(RedditEngagement).order_by(RedditEngagement.discovered_at.desc())
    if status:
        query = query.where(RedditEngagement.status == status)
    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/reddit/engagement/{reddit_id}")
async def update_reddit_engagement_status(
    reddit_id: str,
    update: StatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update status of a Reddit engagement post."""
    post = await db.scalar(select(RedditEngagement).where(RedditEngagement.reddit_id == reddit_id))
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.status = update.status
    if update.status == "responded":
        post.responded_at = datetime.utcnow()
    if update.suggested_response:
        post.suggested_response = update.suggested_response

    await db.commit()
    return {"status": "updated", "reddit_id": reddit_id}


@router.delete("/reddit/engagement/clear")
async def clear_reddit_engagement(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Clear Reddit engagement posts, optionally by status."""
    query = delete(RedditEngagement)
    if status:
        query = query.where(RedditEngagement.status == status)
    result = await db.execute(query)
    await db.commit()
    return {"cleared": result.rowcount}


# ============ News Posts ============

@router.post("/news/batch")
async def upsert_news_posts(items: List[NewsPostCreate], db: AsyncSession = Depends(get_db)):
    """Upsert news posts (deduped by source + source_id)."""
    added = 0
    for item in items:
        existing = await db.scalar(
            select(NewsPost).where(
                NewsPost.source == item.source,
                NewsPost.source_id == item.source_id
            )
        )
        if not existing:
            post = NewsPost(**item.model_dump())
            db.add(post)
            added += 1
    await db.commit()
    return {"received": len(items), "added": added}


@router.get("/news", response_model=List[NewsPostResponse])
async def get_news_posts(
    source: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Get news posts, optionally filtered by source and status."""
    query = select(NewsPost).order_by(NewsPost.discovered_at.desc())
    if source:
        query = query.where(NewsPost.source == source)
    if status:
        query = query.where(NewsPost.status == status)
    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/news/{source}/{source_id}")
async def update_news_status(
    source: str,
    source_id: str,
    update: StatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update status of a news post."""
    post = await db.scalar(
        select(NewsPost).where(
            NewsPost.source == source,
            NewsPost.source_id == source_id
        )
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.status = update.status
    if update.status == "responded":
        post.responded_at = datetime.utcnow()
    if update.suggested_response:
        post.suggested_response = update.suggested_response

    await db.commit()
    return {"status": "updated", "source": source, "source_id": source_id}


@router.delete("/news/clear")
async def clear_news_posts(
    source: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Clear news posts, optionally by source and status."""
    query = delete(NewsPost)
    if source:
        query = query.where(NewsPost.source == source)
    if status:
        query = query.where(NewsPost.status == status)
    result = await db.execute(query)
    await db.commit()
    return {"cleared": result.rowcount}


# ============ GitHub Issues ============

@router.post("/github/batch")
async def upsert_github_issues(items: List[GitHubIssueCreate], db: AsyncSession = Depends(get_db)):
    """Upsert GitHub issues (deduped by github_id)."""
    added = 0
    for item in items:
        existing = await db.scalar(
            select(GitHubIssue).where(GitHubIssue.github_id == item.github_id)
        )
        if not existing:
            issue = GitHubIssue(**item.model_dump())
            db.add(issue)
            added += 1
    await db.commit()
    return {"received": len(items), "added": added}


@router.get("/github", response_model=List[GitHubIssueResponse])
async def get_github_issues(
    status: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Get GitHub issues, optionally filtered by status and language."""
    query = select(GitHubIssue).order_by(GitHubIssue.discovered_at.desc())
    if status:
        query = query.where(GitHubIssue.status == status)
    if language:
        query = query.where(GitHubIssue.language == language)
    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/github/{github_id}")
async def update_github_issue_status(
    github_id: int,
    update: StatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update status of a GitHub issue."""
    issue = await db.scalar(select(GitHubIssue).where(GitHubIssue.github_id == github_id))
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = update.status
    if update.status == "responded":
        issue.responded_at = datetime.utcnow()

    await db.commit()
    return {"status": "updated", "github_id": github_id}


@router.delete("/github/clear")
async def clear_github_issues(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Clear GitHub issues, optionally by status."""
    query = delete(GitHubIssue)
    if status:
        query = query.where(GitHubIssue.status == status)
    result = await db.execute(query)
    await db.commit()
    return {"cleared": result.rowcount}


# ============ Stats ============

@router.get("/stats")
async def get_persistence_stats(db: AsyncSession = Depends(get_db)):
    """Get statistics for all persisted data."""
    stats = {}

    # LinkedIn Jobs
    li_jobs_total = await db.scalar(select(func.count(LinkedInJob.id)))
    li_jobs_new = await db.scalar(select(func.count(LinkedInJob.id)).where(LinkedInJob.status == "new"))
    stats["linkedin_jobs"] = {"total": li_jobs_total or 0, "new": li_jobs_new or 0}

    # LinkedIn Engagement
    li_eng_total = await db.scalar(select(func.count(LinkedInEngagement.id)))
    li_eng_new = await db.scalar(select(func.count(LinkedInEngagement.id)).where(LinkedInEngagement.status == "new"))
    stats["linkedin_engagement"] = {"total": li_eng_total or 0, "new": li_eng_new or 0}

    # Reddit Jobs
    r_jobs_total = await db.scalar(select(func.count(RedditJob.id)))
    r_jobs_new = await db.scalar(select(func.count(RedditJob.id)).where(RedditJob.status == "new"))
    stats["reddit_jobs"] = {"total": r_jobs_total or 0, "new": r_jobs_new or 0}

    # Reddit Engagement
    r_eng_total = await db.scalar(select(func.count(RedditEngagement.id)))
    r_eng_new = await db.scalar(select(func.count(RedditEngagement.id)).where(RedditEngagement.status == "new"))
    stats["reddit_engagement"] = {"total": r_eng_total or 0, "new": r_eng_new or 0}

    # News
    news_total = await db.scalar(select(func.count(NewsPost.id)))
    news_new = await db.scalar(select(func.count(NewsPost.id)).where(NewsPost.status == "new"))
    stats["news"] = {"total": news_total or 0, "new": news_new or 0}

    # GitHub Issues
    gh_total = await db.scalar(select(func.count(GitHubIssue.id)))
    gh_new = await db.scalar(select(func.count(GitHubIssue.id)).where(GitHubIssue.status == "new"))
    stats["github"] = {"total": gh_total or 0, "new": gh_new or 0}

    return stats
