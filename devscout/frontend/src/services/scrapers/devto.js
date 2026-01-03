/**
 * Dev.to Scraper - Fetches posts from Dev.to API
 *
 * Dev.to has a public API for articles.
 */

const DEVTO_API = 'https://dev.to/api/articles';

// Keywords relevant to Jesse's services
const RELEVANT_KEYWORDS = [
  'hiring', 'looking for', 'need developer', 'need help',
  'freelance', 'contract', 'side project',
  'api', 'integration', 'automation', 'help',
];

// Tags that indicate potential leads
const RELEVANT_TAGS = [
  'help', 'discuss', 'watercooler', 'career',
  'hiring', 'jobs', 'freelance', 'sideproject',
];

/**
 * Fetch recent articles from Dev.to
 */
export async function fetchDevTo() {
  const posts = [];

  try {
    // Get recent articles
    const response = await fetch(`${DEVTO_API}?per_page=50&top=7`);

    if (!response.ok) {
      console.warn(`Dev.to API returned ${response.status}`);
      return [];
    }

    const articles = await response.json();

    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // Last 7 days

    for (const article of articles) {
      const createdAt = new Date(article.published_at).getTime();
      if (createdAt < cutoffTime) continue;

      // Check for relevant content
      const combined = `${article.title} ${article.description || ''} ${article.tag_list?.join(' ') || ''}`.toLowerCase();
      const hasRelevantKeyword = RELEVANT_KEYWORDS.some(kw => combined.includes(kw));
      const hasRelevantTag = article.tag_list?.some(tag =>
        RELEVANT_TAGS.includes(tag.toLowerCase())
      );

      if (!hasRelevantKeyword && !hasRelevantTag) continue;

      posts.push({
        source: 'devto',
        source_id: `devto_${article.id}`,
        platform_detail: article.tag_list?.[0] || 'Dev.to',
        title: article.title,
        body: article.description?.slice(0, 2000) || null,
        url: article.url,
        author: article.user?.username || 'unknown',
        author_url: article.user?.website_url || `https://dev.to/${article.user?.username}`,
        posted_at: article.published_at,
        // Extra metadata
        reactions_count: article.public_reactions_count || 0,
        comments_count: article.comments_count || 0,
        tags: article.tag_list || [],
        cover_image: article.cover_image,
      });
    }
  } catch (err) {
    console.error('Error fetching Dev.to:', err);
  }

  return posts;
}

/**
 * Search Dev.to for specific terms
 */
export async function searchDevTo(query) {
  const posts = [];

  try {
    // Dev.to doesn't have a search API, but we can use tag filtering
    // For now, just return the main fetch
    return await fetchDevTo();
  } catch (err) {
    console.error(`Error searching Dev.to for "${query}":`, err);
  }

  return posts;
}

export default {
  fetchDevTo,
  searchDevTo,
};
