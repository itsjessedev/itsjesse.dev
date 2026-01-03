"""
LinkedIn Scraper using Playwright

Scrapes LinkedIn posts using search engines (LinkedIn requires login).
Runs headless Chromium on the VPS.
"""

import asyncio
import logging
import re
from datetime import datetime
from typing import Optional
from urllib.parse import quote_plus
from playwright.async_api import async_playwright, Browser, Page

logger = logging.getLogger("uvicorn.error")

# Realistic user agent
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


class LinkedInScraper:
    """Playwright-based LinkedIn post scraper."""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self._playwright = None

    async def _ensure_browser(self):
        """Ensure browser is started."""
        if not self.browser:
            self._playwright = await async_playwright().start()
            self.browser = await self._playwright.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                ]
            )

    async def close(self):
        """Close browser."""
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None

    async def search_posts(
        self,
        keywords: list[str],
        limit_per_keyword: int = 10,
    ) -> list[dict]:
        """
        Search for LinkedIn posts matching keywords via DuckDuckGo.
        """
        await self._ensure_browser()
        all_posts = []
        seen_urls = set()

        for keyword in keywords:
            try:
                logger.info(f"Searching for LinkedIn posts: '{keyword}'")
                posts = await self._search_via_duckduckgo(keyword, limit_per_keyword)
                logger.info(f"Found {len(posts)} posts for '{keyword}'")

                for post in posts:
                    url = post.get('url', '')
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        all_posts.append(post)
            except Exception as e:
                logger.warning(f"Failed to search LinkedIn for '{keyword}': {e}")
                continue

        logger.info(f"Total unique posts found: {len(all_posts)}")
        return all_posts

    async def _search_via_duckduckgo(self, keyword: str, limit: int) -> list[dict]:
        """Search DuckDuckGo for LinkedIn posts."""
        posts = []
        page = await self.browser.new_page(user_agent=USER_AGENT)

        try:
            # Use DuckDuckGo HTML version (more reliable)
            search_query = f"site:linkedin.com/posts {keyword}"
            url = f"https://html.duckduckgo.com/html/?q={quote_plus(search_query)}"

            logger.info(f"Fetching DuckDuckGo: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await page.wait_for_timeout(1000)

            # Get page content for debugging
            content = await page.content()
            logger.info(f"Page content length: {len(content)}")

            # DuckDuckGo HTML uses .result__a for links
            links = await page.query_selector_all('a.result__a')
            logger.info(f"Found {len(links)} result links")

            for link in links[:limit * 2]:  # Get more than needed to filter
                try:
                    href = await link.get_attribute('href')
                    if not href or 'linkedin.com/posts' not in href:
                        continue

                    # Clean up URL
                    linkedin_url = href
                    if 'uddg=' in linkedin_url:
                        # DuckDuckGo redirect URL - extract actual URL
                        match = re.search(r'uddg=([^&]+)', linkedin_url)
                        if match:
                            from urllib.parse import unquote
                            linkedin_url = unquote(match.group(1))

                    if 'linkedin.com/posts' not in linkedin_url:
                        continue

                    # Get title/snippet
                    title = await link.inner_text()

                    # Get snippet from parent
                    parent = await link.evaluate_handle('el => el.closest(".result")')
                    snippet_el = await parent.query_selector('.result__snippet') if parent else None
                    snippet = await snippet_el.inner_text() if snippet_el else ""

                    text = f"{title}\n\n{snippet}".strip()

                    posts.append({
                        'source_id': f"li_{hash(linkedin_url) % 10**8}",
                        'url': linkedin_url,
                        'text': text[:500] if text else keyword,
                        'author': self._extract_author_from_url(linkedin_url),
                        'author_headline': None,
                        'posted_at': None,
                        'reactions': 0,
                        'comments': 0,
                    })

                    if len(posts) >= limit:
                        break

                except Exception as e:
                    logger.debug(f"Error extracting link: {e}")
                    continue

            # If DuckDuckGo didn't work, try Bing
            if not posts:
                logger.info("DuckDuckGo returned no results, trying Bing")
                posts = await self._search_via_bing(page, keyword, limit)

        except Exception as e:
            logger.warning(f"Error in DuckDuckGo search: {e}")
        finally:
            await page.close()

        return posts

    async def _search_via_bing(self, page: Page, keyword: str, limit: int) -> list[dict]:
        """Fallback to Bing search for LinkedIn posts."""
        posts = []

        try:
            search_query = f"site:linkedin.com/posts {keyword}"
            url = f"https://www.bing.com/search?q={quote_plus(search_query)}"

            logger.info(f"Fetching Bing: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await page.wait_for_timeout(1000)

            # Bing result links
            links = await page.query_selector_all('li.b_algo h2 a')
            logger.info(f"Found {len(links)} Bing result links")

            for link in links[:limit * 2]:
                try:
                    href = await link.get_attribute('href')
                    if not href or 'linkedin.com/posts' not in href:
                        continue

                    title = await link.inner_text()

                    # Get snippet
                    parent = await link.evaluate_handle('el => el.closest("li.b_algo")')
                    snippet_el = await parent.query_selector('.b_caption p') if parent else None
                    snippet = await snippet_el.inner_text() if snippet_el else ""

                    text = f"{title}\n\n{snippet}".strip()

                    posts.append({
                        'source_id': f"li_{hash(href) % 10**8}",
                        'url': href,
                        'text': text[:500] if text else keyword,
                        'author': self._extract_author_from_url(href),
                        'author_headline': None,
                        'posted_at': None,
                        'reactions': 0,
                        'comments': 0,
                    })

                    if len(posts) >= limit:
                        break

                except Exception as e:
                    logger.debug(f"Error extracting Bing link: {e}")
                    continue

        except Exception as e:
            logger.warning(f"Error in Bing search: {e}")

        return posts

    def _extract_author_from_url(self, url: str) -> str:
        """Extract author name from LinkedIn post URL."""
        # URL format: linkedin.com/posts/username_activity-id
        match = re.search(r'linkedin\.com/posts/([^_/]+)', url)
        if match:
            # Convert URL slug to readable name
            name = match.group(1).replace('-', ' ').title()
            return name
        return "Unknown"


# Singleton instance
_scraper: Optional[LinkedInScraper] = None


async def get_scraper() -> LinkedInScraper:
    """Get or create the scraper instance."""
    global _scraper
    if _scraper is None:
        _scraper = LinkedInScraper()
    return _scraper


async def search_linkedin_posts(keywords: list[str], limit_per_keyword: int = 10) -> list[dict]:
    """
    Search LinkedIn for posts matching keywords.

    Args:
        keywords: List of search terms
        limit_per_keyword: Max posts per keyword

    Returns:
        List of post dictionaries
    """
    scraper = await get_scraper()
    return await scraper.search_posts(keywords, limit_per_keyword)
