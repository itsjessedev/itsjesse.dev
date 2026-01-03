/**
 * LinkedIn Posts Scraper - Fetches posts from people looking for developers
 *
 * Primary: Apify's LinkedIn Posts Search Scraper (if available)
 * Fallback: Client-side Google search (no API costs, works from browser)
 *
 * Note: Server-side scraping is blocked (VPS IP flagged by search engines),
 * so client-side fetching is preferred.
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
 * Falls back to client-side Google search if Apify fails
 */
export async function fetchLinkedInPosts(searchTerms = null, maxPostsPerTerm = 20) {
  const terms = searchTerms || DEFAULT_SEARCH_TERMS.slice(0, 3); // Limit terms

  // Try Apify first (may be rate limited)
  try {
    const response = await fetch(`${API_BASE}/api/prospects/linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        search_terms: terms,
        max_posts_per_term: maxPostsPerTerm,
        sort_by: 'date_posted',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.posts && data.posts.length > 0) {
        console.log(`LinkedIn: Got ${data.posts.length} posts from Apify`);
        return data.posts.map(post => ({
          source: 'linkedin',
          source_id: post.source_id,
          platform_detail: 'LinkedIn Posts',
          title: post.title,
          body: post.body,
          url: post.url,
          author: post.author,
          author_url: post.author_url,
          posted_at: post.posted_at,
          author_headline: post.author_headline,
          reactions: post.reactions,
          comments: post.comments,
        }));
      }
    }
  } catch (err) {
    console.warn('Apify LinkedIn failed, trying client-side fallback:', err.message);
  }

  // Fallback: Client-side Google search (from browser, not blocked)
  console.log('LinkedIn: Using client-side Google search fallback');
  return await fetchLinkedInViaGoogle(terms, maxPostsPerTerm);
}

/**
 * Client-side Google search fallback
 * Searches Google for LinkedIn posts directly from the browser
 */
async function fetchLinkedInViaGoogle(searchTerms, maxPerTerm = 10) {
  const allPosts = [];
  const seenUrls = new Set();

  for (const term of searchTerms.slice(0, 2)) { // Limit to 2 terms to avoid rate limiting
    try {
      const query = encodeURIComponent(`site:linkedin.com/posts ${term}`);
      const googleUrl = `https://www.google.com/search?q=${query}&num=20`;

      // Use a CORS proxy to fetch Google results
      const proxyUrls = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(googleUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(googleUrl)}`,
      ];

      let html = null;
      for (const proxyUrl of proxyUrls) {
        try {
          const response = await fetch(proxyUrl, { timeout: 15000 });
          if (response.ok) {
            html = await response.text();
            if (html && html.length > 1000 && !html.includes('unusual traffic')) {
              break;
            }
          }
        } catch (e) {
          console.warn(`Proxy ${proxyUrl.split('?')[0]} failed:`, e.message);
        }
      }

      if (!html || html.length < 1000) {
        console.warn(`Google search failed for "${term}"`);
        continue;
      }

      // Parse LinkedIn URLs from Google results
      const linkedInUrlPattern = /https:\/\/www\.linkedin\.com\/posts\/[^"'\s<>]+/g;
      const urls = html.match(linkedInUrlPattern) || [];

      for (const url of urls) {
        // Clean URL (remove tracking params)
        const cleanUrl = url.split('&')[0].split('?')[0];

        if (seenUrls.has(cleanUrl) || !cleanUrl.includes('/posts/')) continue;
        seenUrls.add(cleanUrl);

        // Extract author from URL (linkedin.com/posts/username_activity-id)
        const authorMatch = cleanUrl.match(/linkedin\.com\/posts\/([^_/]+)/);
        const author = authorMatch ? authorMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown';

        // Try to extract snippet from surrounding context
        const urlIndex = html.indexOf(cleanUrl);
        const contextStart = Math.max(0, urlIndex - 300);
        const contextEnd = Math.min(html.length, urlIndex + 300);
        const context = html.slice(contextStart, contextEnd);

        // Extract text between tags that might be the snippet
        const snippetMatch = context.match(/>([^<]{50,200})</);
        const snippet = snippetMatch ? snippetMatch[1].trim() : term;

        allPosts.push({
          source: 'linkedin',
          source_id: `li_${hashCode(cleanUrl)}`,
          platform_detail: 'LinkedIn Posts (via Google)',
          title: snippet.slice(0, 100) + (snippet.length > 100 ? '...' : ''),
          body: snippet,
          url: cleanUrl,
          author: author,
          author_url: null,
          posted_at: null,
          author_headline: null,
          reactions: 0,
          comments: 0,
        });

        if (allPosts.length >= maxPerTerm * searchTerms.length) break;
      }

      // Small delay between searches
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      console.error(`Error searching for "${term}":`, err);
    }
  }

  console.log(`LinkedIn: Found ${allPosts.length} posts via Google search`);
  return allPosts;
}

/**
 * Simple hash function for generating IDs
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 100000000;
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
