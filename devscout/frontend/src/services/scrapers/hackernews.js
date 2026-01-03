/**
 * Hacker News Scraper - Handles HN source fetching
 *
 * Sources:
 * - Monthly "Who is Hiring?" thread
 * - Freelancer thread
 * - HN Algolia search for hiring keywords
 */

const HN_ALGOLIA_BASE = 'https://hn.algolia.com/api/v1';
const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0';

// Relevant keywords for filtering
const RELEVANT_KEYWORDS = [
  'python', 'javascript', 'typescript', 'react', 'node', 'api', 'integration',
  'automation', 'fullstack', 'full stack', 'backend', 'remote', 'contract',
  'freelance', 'part-time', 'part time', 'consultant', 'contractor',
  'web scraping', 'data', 'bot', 'discord', 'slack',
];

/**
 * Fetch the monthly "Who is Hiring?" thread
 */
export async function fetchWhoIsHiring() {
  const posts = [];

  try {
    // Search for the latest "Ask HN: Who is hiring?" thread
    const searchUrl = `${HN_ALGOLIA_BASE}/search_by_date?query=Ask%20HN:%20Who%20is%20hiring&tags=story&hitsPerPage=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.hits || searchData.hits.length === 0) return [];

    const threadId = searchData.hits[0].objectID;
    const threadTitle = searchData.hits[0].title;

    // Fetch comments from the thread
    const commentsUrl = `${HN_ALGOLIA_BASE}/items/${threadId}`;
    const commentsRes = await fetch(commentsUrl);
    const commentsData = await commentsRes.json();

    if (!commentsData.children) return [];

    // Process top-level comments (job listings)
    for (const comment of commentsData.children.slice(0, 100)) {
      if (!comment.text) continue;

      const textLower = comment.text.toLowerCase();
      const hasRelevant = RELEVANT_KEYWORDS.some(kw => textLower.includes(kw));
      const hasRemote = textLower.includes('remote');

      if (hasRelevant || hasRemote) {
        posts.push({
          source: 'hackernews',
          source_id: `hn_hiring_${comment.id}`,
          platform_detail: 'Who is Hiring',
          title: comment.text.slice(0, 150) + (comment.text.length > 150 ? '...' : ''),
          body: comment.text,
          url: `https://news.ycombinator.com/item?id=${comment.id}`,
          author: comment.author || 'unknown',
          posted_at: comment.created_at || new Date().toISOString(),
          // Extra metadata
          is_remote: hasRemote,
          thread_title: threadTitle,
        });
      }
    }
  } catch (err) {
    console.error('Error fetching HN Who is Hiring:', err);
  }

  return posts;
}

/**
 * Fetch the Freelancer thread
 */
export async function fetchFreelancerThread() {
  const posts = [];

  try {
    // Search for "Freelancer? Seeking freelancer?" threads
    const searchUrl = `${HN_ALGOLIA_BASE}/search_by_date?query=Ask%20HN:%20Freelancer&tags=story&hitsPerPage=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.hits || searchData.hits.length === 0) return [];

    const threadId = searchData.hits[0].objectID;
    const threadTitle = searchData.hits[0].title;

    const commentsUrl = `${HN_ALGOLIA_BASE}/items/${threadId}`;
    const commentsRes = await fetch(commentsUrl);
    const commentsData = await commentsRes.json();

    if (!commentsData.children) return [];

    // Look for "Seeking freelancer" comments (people hiring)
    for (const comment of commentsData.children.slice(0, 100)) {
      if (!comment.text) continue;

      const textLower = comment.text.toLowerCase();

      // Only include posts SEEKING freelancers (not freelancers offering)
      const isSeeking = textLower.includes('seeking') || textLower.includes('looking for') ||
                       textLower.includes('need') || textLower.includes('hiring');
      const isOffering = textLower.includes('available') || textLower.includes('for hire') ||
                        textLower.includes('my rate') || textLower.includes('my skills');

      if (isSeeking && !isOffering) {
        posts.push({
          source: 'hackernews',
          source_id: `hn_freelance_${comment.id}`,
          platform_detail: 'Freelancer Thread',
          title: comment.text.slice(0, 150) + (comment.text.length > 150 ? '...' : ''),
          body: comment.text,
          url: `https://news.ycombinator.com/item?id=${comment.id}`,
          author: comment.author || 'unknown',
          posted_at: comment.created_at || new Date().toISOString(),
          thread_title: threadTitle,
        });
      }
    }
  } catch (err) {
    console.error('Error fetching HN Freelancer thread:', err);
  }

  return posts;
}

/**
 * Search HN for hiring-related posts
 */
export async function searchHN(query) {
  const posts = [];

  try {
    const searchUrl = `${HN_ALGOLIA_BASE}/search_by_date?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=30`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!data.hits) return [];

    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // Last 7 days

    for (const hit of data.hits) {
      const createdAt = new Date(hit.created_at).getTime();

      if (createdAt < cutoffTime) continue;

      // Only process Ask HN or text posts
      const isAskHN = hit.title?.startsWith('Ask HN:');
      const isShowHN = hit.title?.startsWith('Show HN:');

      if (isAskHN || !hit.url) {
        posts.push({
          source: 'hackernews',
          source_id: `hn_${hit.objectID}`,
          platform_detail: isAskHN ? 'Ask HN' : isShowHN ? 'Show HN' : 'HN',
          title: hit.title,
          body: hit.story_text || null,
          url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
          author: hit.author || 'unknown',
          posted_at: hit.created_at,
          // Extra metadata
          points: hit.points || 0,
          num_comments: hit.num_comments || 0,
        });
      }
    }
  } catch (err) {
    console.error(`Error searching HN for "${query}":`, err);
  }

  return posts;
}

/**
 * Fetch all HN sources
 */
export async function fetchAllHN(onProgress = null) {
  const allPosts = [];
  const sources = ['Who is Hiring', 'Freelancer Thread', 'Search: hiring', 'Search: looking for developer'];

  // Who is Hiring
  if (onProgress) onProgress(1, sources.length, 'HN: Who is Hiring?');
  const hiringPosts = await fetchWhoIsHiring();
  allPosts.push(...hiringPosts);

  await new Promise(r => setTimeout(r, 300));

  // Freelancer Thread
  if (onProgress) onProgress(2, sources.length, 'HN: Freelancer Thread');
  const freelancePosts = await fetchFreelancerThread();
  allPosts.push(...freelancePosts);

  await new Promise(r => setTimeout(r, 300));

  // Search for hiring
  if (onProgress) onProgress(3, sources.length, 'HN: Search hiring');
  const searchPosts1 = await searchHN('hiring developer');
  allPosts.push(...searchPosts1);

  await new Promise(r => setTimeout(r, 300));

  // Search for looking for developer
  if (onProgress) onProgress(4, sources.length, 'HN: Search looking for');
  const searchPosts2 = await searchHN('looking for developer');
  allPosts.push(...searchPosts2);

  // Deduplicate
  const seen = new Set();
  return allPosts.filter(post => {
    if (seen.has(post.source_id)) return false;
    seen.add(post.source_id);
    return true;
  });
}

export default {
  fetchWhoIsHiring,
  fetchFreelancerThread,
  searchHN,
  fetchAllHN,
};
