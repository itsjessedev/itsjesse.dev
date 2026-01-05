"""Background service for publishing scheduled posts."""

import asyncio
import logging
from datetime import datetime

import httpx
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from ..config import get_settings
from ..models import Base, ScheduledPost, LinkedInAuth

logger = logging.getLogger(__name__)
settings = get_settings()


class PostPublisher:
    """Handles publishing scheduled posts to various platforms."""

    def __init__(self):
        self.engine = create_async_engine(settings.database_url, echo=False)
        self.async_session = async_sessionmaker(self.engine, class_=AsyncSession, expire_on_commit=False)

    async def get_due_posts(self, db: AsyncSession) -> list[ScheduledPost]:
        """Get all posts that are due to be published."""
        now = datetime.utcnow()
        result = await db.execute(
            select(ScheduledPost).where(
                and_(
                    ScheduledPost.status.in_(["scheduled", "pending_publish"]),
                    ScheduledPost.scheduled_for <= now
                )
            ).order_by(ScheduledPost.scheduled_for.asc())
        )
        return list(result.scalars().all())

    async def get_linkedin_token(self, db: AsyncSession) -> str | None:
        """Get valid LinkedIn access token."""
        auth = await db.get(LinkedInAuth, 1)
        if not auth:
            return None
        if auth.expires_at <= datetime.utcnow():
            return None
        return auth.access_token

    async def get_linkedin_person_id(self, db: AsyncSession) -> str | None:
        """Get LinkedIn person ID for posting."""
        auth = await db.get(LinkedInAuth, 1)
        return auth.person_id if auth else None

    async def publish_linkedin_post(self, post: ScheduledPost, db: AsyncSession) -> tuple[bool, str | None, str | None]:
        """
        Publish a post to LinkedIn.
        Returns: (success, post_url, error_message)
        """
        access_token = await self.get_linkedin_token(db)
        if not access_token:
            return False, None, "LinkedIn not authenticated or token expired"

        person_id = await self.get_linkedin_person_id(db)
        if not person_id:
            return False, None, "LinkedIn person ID not found"

        # LinkedIn UGC Post API
        post_data = {
            "author": f"urn:li:person:{person_id}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": post.body},
                    "shareMediaCategory": "NONE",
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            },
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.linkedin.com/v2/ugcPosts",
                    json=post_data,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                        "X-Restli-Protocol-Version": "2.0.0",
                    },
                )

                if response.status_code in [200, 201]:
                    result = response.json()
                    post_id = result.get("id", "")
                    post_url = f"https://www.linkedin.com/feed/update/{post_id}" if post_id else None
                    return True, post_url, None
                else:
                    error_msg = f"LinkedIn API error {response.status_code}: {response.text[:200]}"
                    logger.error(error_msg)
                    return False, None, error_msg

        except Exception as e:
            error_msg = f"Failed to publish to LinkedIn: {str(e)}"
            logger.exception(error_msg)
            return False, None, error_msg

    async def process_post(self, post: ScheduledPost, db: AsyncSession) -> None:
        """Process a single scheduled post."""
        logger.info(f"Processing post {post.id} for {post.platform} (scheduled: {post.scheduled_for})")

        if post.platform == "linkedin":
            # Check if LinkedIn OAuth is configured
            access_token = await self.get_linkedin_token(db)
            if not access_token:
                # No OAuth - mark as ready for manual posting
                post.status = "ready"
                post.error_message = "LinkedIn not connected. Copy and post manually."
                logger.info(f"LinkedIn post {post.id} ready for manual posting (no OAuth)")
            else:
                success, url, error = await self.publish_linkedin_post(post, db)
                if success:
                    post.status = "published"
                    post.published_at = datetime.utcnow()
                    post.published_url = url
                    logger.info(f"Published LinkedIn post {post.id}: {url}")
                else:
                    post.status = "failed"
                    post.error_message = error
                    logger.error(f"Failed to publish LinkedIn post {post.id}: {error}")

        elif post.platform == "reddit":
            # Reddit doesn't allow automated posting without API approval
            # Mark as failed with clear message - user must post manually
            post.status = "failed"
            post.error_message = "Reddit doesn't allow automated posting. Copy the content and post manually to the subreddit."
            logger.info(f"Reddit post {post.id} marked for manual posting (Reddit API limitation)")

        else:
            post.status = "failed"
            post.error_message = f"Unknown platform: {post.platform}"

        await db.commit()

    async def run_once(self) -> dict:
        """Run one cycle of checking and publishing due posts."""
        stats = {"processed": 0, "published": 0, "failed": 0, "ready": 0}

        async with self.async_session() as db:
            due_posts = await self.get_due_posts(db)
            logger.info(f"Found {len(due_posts)} posts due for publishing")

            for post in due_posts:
                await self.process_post(post, db)
                stats["processed"] += 1

                if post.status == "published":
                    stats["published"] += 1
                elif post.status == "failed":
                    stats["failed"] += 1
                elif post.status == "ready":
                    stats["ready"] += 1

        return stats

    async def cleanup(self):
        """Clean up resources - must be called when done."""
        await self.engine.dispose()

    async def run_forever(self, interval_seconds: int = 60):
        """Run continuously, checking for posts every interval."""
        logger.info(f"Starting post publisher (interval: {interval_seconds}s)")
        while True:
            try:
                stats = await self.run_once()
                if stats["processed"] > 0:
                    logger.info(f"Cycle complete: {stats}")
            except Exception as e:
                logger.exception(f"Error in publisher cycle: {e}")

            await asyncio.sleep(interval_seconds)


async def main():
    """Entry point for running as a standalone script."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )

    publisher = PostPublisher()
    await publisher.run_forever(interval_seconds=60)


if __name__ == "__main__":
    asyncio.run(main())
