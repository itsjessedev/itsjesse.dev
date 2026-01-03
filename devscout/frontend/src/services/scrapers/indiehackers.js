/**
 * Indie Hackers Scraper - Fetches posts from Indie Hackers
 *
 * Note: IH doesn't have a public API, so we use their internal endpoints.
 * These may change without notice.
 */

const IH_API = 'https://www.indiehackers.com/api';

// Keywords indicating someone needs a developer
const HIRING_KEYWORDS = [
  'looking for developer', 'need developer', 'hiring developer',
  'looking for cofounder', 'technical cofounder', 'tech partner',
  'looking for freelancer', 'need help building',
  'who can build', 'anyone available',
];

// Keywords indicating general discussion (not leads)
const DISCUSSION_KEYWORDS = [
  'my experience', 'how i ', 'what i learned', 'tips for',
  'ama', 'ask me', 'thoughts on', 'opinion on',
];

/**
 * Fetch recent posts from Indie Hackers
 */
export async function fetchIndieHackers() {
  const posts = [];

  try {
    // IH internal API for posts
    const response = await fetch(`${IH_API}/posts?sort=new&limit=50`);

    if (!response.ok) {
      // IH may block or require auth
      console.warn(`Indie Hackers API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const postList = data.posts || [];

    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // Last 7 days

    for (const post of postList) {
      const createdAt = new Date(post.createdAt).getTime();
      if (createdAt < cutoffTime) continue;

      // Check for hiring signals
      const combined = `${post.title} ${post.body || ''} ${post.tagline || ''}`.toLowerCase();

      const hasHiringSignal = HIRING_KEYWORDS.some(kw => combined.includes(kw));
      const isDiscussion = DISCUSSION_KEYWORDS.some(kw => combined.includes(kw));

      // Only include if it has hiring signals and isn't just discussion
      if (!hasHiringSignal || isDiscussion) continue;

      posts.push({
        source: 'indiehackers',
        source_id: `ih_${post.id}`,
        platform_detail: post.group?.name || 'Indie Hackers',
        title: post.title,
        body: post.body?.slice(0, 2000) || post.tagline || null,
        url: `https://www.indiehackers.com/post/${post.slug || post.id}`,
        author: post.user?.username || 'unknown',
        author_url: post.user?.username ? `https://www.indiehackers.com/${post.user.username}` : null,
        posted_at: new Date(post.createdAt).toISOString(),
        // Extra metadata
        votes: post.voteCount || 0,
        comments: post.commentCount || 0,
        group: post.group?.name,
      });
    }
  } catch (err) {
    console.error('Error fetching Indie Hackers:', err);
  }

  return posts;
}

/**
 * Fetch from specific IH groups (like /ask for questions)
 */
export async function fetchIHGroup(groupSlug) {
  const posts = [];

  try {
    const response = await fetch(`${IH_API}/posts?sort=new&limit=30&group=${groupSlug}`);

    if (!response.ok) {
      console.warn(`IH group ${groupSlug} API returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    // Same processing as main fetch
    for (const post of data.posts || []) {
      const combined = `${post.title} ${post.body || ''}`.toLowerCase();
      const hasHiringSignal = HIRING_KEYWORDS.some(kw => combined.includes(kw));

      if (hasHiringSignal) {
        posts.push({
          source: 'indiehackers',
          source_id: `ih_${post.id}`,
          platform_detail: groupSlug,
          title: post.title,
          body: post.body?.slice(0, 2000) || null,
          url: `https://www.indiehackers.com/post/${post.slug || post.id}`,
          author: post.user?.username || 'unknown',
          posted_at: new Date(post.createdAt).toISOString(),
        });
      }
    }
  } catch (err) {
    console.error(`Error fetching IH group ${groupSlug}:`, err);
  }

  return posts;
}

export default {
  fetchIndieHackers,
  fetchIHGroup,
};
