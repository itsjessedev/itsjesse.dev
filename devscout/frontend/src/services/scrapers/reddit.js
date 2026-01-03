/**
 * Reddit Scraper - Handles all Reddit source fetching
 *
 * Uses CORS proxies to bypass VPS IP blocks.
 * Returns normalized prospect objects for AI scoring.
 */

// CORS proxy chain (corsproxy.io works best)
const PROXY_URLS = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/**
 * Try fetching with multiple proxies
 */
async function fetchWithProxy(url) {
  for (const getProxyUrl of PROXY_URLS) {
    try {
      const proxyUrl = getProxyUrl(url);
      const response = await fetch(proxyUrl);

      if (!response.ok) continue;

      const text = await response.text();

      // Check if response is HTML (blocked page) instead of JSON
      if (text.trim().startsWith('<') || text.includes('<!doctype') || text.includes('<html')) {
        continue;
      }

      return JSON.parse(text);
    } catch (e) {
      continue;
    }
  }

  return null;
}

/**
 * Check if post is from a competitor offering services
 */
function isCompetitor(title, body = '') {
  const text = (title + ' ' + body).toLowerCase();
  const patterns = [
    '[for hire]', '[offer]', 'for hire',
    'i will build', 'i will create', 'i will scrape',
    'my services', 'hire me', 'available for',
    'looking for clients', 'seeking clients',
    'freelancer available', 'developer available',
  ];
  return patterns.some(p => text.includes(p));
}

/**
 * Search a subreddit for prospects
 */
export async function searchSubreddit(subreddit, query, options = {}) {
  const {
    limit = 25,
    timeframe = 'week',
    sort = 'new',
  } = options;

  try {
    const searchQuery = query ? `q=${encodeURIComponent(query)}&` : '';
    const url = query
      ? `https://www.reddit.com/r/${subreddit}/search.json?${searchQuery}restrict_sr=on&sort=${sort}&t=${timeframe}&limit=${limit}`
      : `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;

    const data = await fetchWithProxy(url);

    if (!data?.data?.children) {
      return [];
    }

    const posts = [];

    for (const child of data.data.children) {
      const post = child.data;

      // Skip non-self posts (links, images)
      if (!post.is_self) continue;

      // Skip competitor posts
      if (isCompetitor(post.title, post.selftext)) continue;

      // Normalize to ProspectInput format (matches backend schema)
      posts.push({
        source: 'reddit',
        source_id: post.id,
        platform_detail: subreddit,
        title: post.title,
        body: post.selftext?.slice(0, 2000) || null,
        url: `https://reddit.com${post.permalink}`,
        author: post.author || '[deleted]',
        posted_at: new Date(post.created_utc * 1000).toISOString(),
        // Extra metadata for UI
        score: post.score,
        num_comments: post.num_comments,
        created_utc: post.created_utc,
        is_hiring: post.title.toLowerCase().includes('[hiring]') || post.title.toLowerCase().includes('[task]'),
      });
    }

    return posts;
  } catch (err) {
    console.error(`Error searching r/${subreddit}:`, err);
    return [];
  }
}

/**
 * Batch search multiple subreddits
 */
export async function batchSearchReddit(searches, onProgress = null) {
  const allPosts = [];
  const seenIds = new Set();

  for (let i = 0; i < searches.length; i++) {
    const { subreddit, query, tier } = searches[i];

    if (onProgress) {
      onProgress(i + 1, searches.length, `r/${subreddit}: ${query || 'all'}`);
    }

    const posts = await searchSubreddit(subreddit, query);

    for (const post of posts) {
      if (!seenIds.has(post.source_id)) {
        seenIds.add(post.source_id);
        post.tier = tier; // Add tier for filtering
        allPosts.push(post);
      }
    }

    // Rate limiting - be nice to Reddit
    if (i < searches.length - 1) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  return allPosts;
}

export default {
  searchSubreddit,
  batchSearchReddit,
};
