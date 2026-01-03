/**
 * LinkedIn Posts Scraper - Fetches posts from people looking for developers
 *
 * Uses Apify's LinkedIn Posts Search Scraper (no login required).
 * Cost: ~$5 per 1,000 posts
 * Free tier: $5/month credit (~1,000 posts)
 *
 * This scrapes actual LinkedIn POSTS (people asking their network for help),
 * NOT job listings.
 */

import { API_BASE } from '../sources.js';

// Search terms to find people looking for developers
const DEFAULT_SEARCH_TERMS = [
  'looking for a developer',
  'need freelance developer',
  'hiring freelance developer',
  'looking for freelancer',
  'need a programmer',
  'anyone know a developer',
  'recommend a developer',
];

/**
 * Fetch LinkedIn posts via backend (which calls Apify)
 *
 * The backend endpoint: POST /api/prospects/linkedin
 */
export async function fetchLinkedInPosts(searchTerms = null, maxPostsPerTerm = 20) {
  try {
    const response = await fetch(`${API_BASE}/api/prospects/linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        search_terms: searchTerms || DEFAULT_SEARCH_TERMS,
        max_posts_per_term: maxPostsPerTerm,
        sort_by: 'date_posted',
      }),
    });

    if (!response.ok) {
      console.warn(`LinkedIn API returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (data.error) {
      console.warn('LinkedIn API error:', data.error);
    }

    // Transform to standard prospect format
    return (data.posts || []).map(post => ({
      source: 'linkedin',
      source_id: post.source_id,
      platform_detail: 'LinkedIn Posts',
      title: post.title,
      body: post.body,
      url: post.url,
      author: post.author,
      author_url: post.author_url,
      posted_at: post.posted_at,
      // Extra metadata
      author_headline: post.author_headline,
      reactions: post.reactions,
      comments: post.comments,
    }));
  } catch (err) {
    console.error('Error fetching LinkedIn posts:', err);
    return [];
  }
}

/**
 * Fetch all LinkedIn posts (main entry point for scraper system)
 */
export async function fetchAllLinkedIn(onProgress = null) {
  if (onProgress) {
    onProgress(1, 1, 'LinkedIn: Searching posts...');
  }

  const posts = await fetchLinkedInPosts();

  if (onProgress) {
    onProgress(1, 1, `LinkedIn: Found ${posts.length} posts`);
  }

  return posts;
}

export default {
  fetchLinkedInPosts,
  fetchAllLinkedIn,
  DEFAULT_SEARCH_TERMS,
};
