/**
 * Craigslist Scraper - Fetches computer gigs from major cities
 *
 * Uses CORS proxy since Craigslist blocks cross-origin requests.
 * Scrapes RSS feeds for computer gigs section.
 */

import { CRAIGSLIST_CITIES } from '../sources.js';

// CORS proxy
const PROXY_URL = (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`;

// Keywords to match
const RELEVANT_KEYWORDS = [
  'developer', 'programmer', 'coder', 'software',
  'python', 'javascript', 'react', 'node',
  'api', 'integration', 'automation', 'scraping',
  'web', 'app', 'website', 'bot',
];

/**
 * Parse Craigslist RSS feed
 */
function parseRSS(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const items = doc.querySelectorAll('item');

  const posts = [];

  for (const item of items) {
    const title = item.querySelector('title')?.textContent || '';
    const link = item.querySelector('link')?.textContent || '';
    const description = item.querySelector('description')?.textContent || '';
    const pubDate = item.querySelector('pubDate')?.textContent || '';

    posts.push({
      title,
      link,
      description,
      pubDate,
    });
  }

  return posts;
}

/**
 * Fetch gigs from a single city
 */
export async function fetchCityGigs(cityCode, cityName) {
  const posts = [];

  try {
    // Craigslist RSS feed for computer gigs
    const rssUrl = `https://${cityCode}.craigslist.org/search/cpg?format=rss`;
    const response = await fetch(PROXY_URL(rssUrl));

    if (!response.ok) {
      console.warn(`Failed to fetch Craigslist ${cityName}: ${response.status}`);
      return [];
    }

    const text = await response.text();

    // Check if we got HTML instead of RSS
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      console.warn(`Craigslist ${cityName} returned HTML (blocked)`);
      return [];
    }

    const items = parseRSS(text);
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // Last 7 days

    for (const item of items) {
      const pubDate = new Date(item.pubDate).getTime();
      if (pubDate < cutoffTime) continue;

      // Check for relevant keywords
      const combined = (item.title + ' ' + item.description).toLowerCase();
      const hasRelevant = RELEVANT_KEYWORDS.some(kw => combined.includes(kw));

      if (hasRelevant) {
        // Extract post ID from link
        const idMatch = item.link.match(/\/(\d+)\.html/);
        const postId = idMatch ? idMatch[1] : item.link;

        posts.push({
          source: 'craigslist',
          source_id: `cl_${cityCode}_${postId}`,
          platform_detail: cityName,
          title: item.title,
          body: item.description?.slice(0, 2000) || null,
          url: item.link,
          author: null, // Craigslist doesn't show author
          posted_at: new Date(item.pubDate).toISOString(),
          city: cityName,
        });
      }
    }
  } catch (err) {
    console.error(`Error fetching Craigslist ${cityName}:`, err);
  }

  return posts;
}

/**
 * Fetch gigs from all configured cities
 */
export async function fetchAllCraigslist(onProgress = null) {
  const allPosts = [];
  const cities = CRAIGSLIST_CITIES;

  for (let i = 0; i < cities.length; i++) {
    const { code, name } = cities[i];

    if (onProgress) {
      onProgress(i + 1, cities.length, `Craigslist: ${name}`);
    }

    const posts = await fetchCityGigs(code, name);
    allPosts.push(...posts);

    // Rate limiting
    if (i < cities.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Deduplicate by title similarity (Craigslist often has reposts)
  const seen = new Set();
  return allPosts.filter(post => {
    const key = post.title.toLowerCase().slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default {
  fetchCityGigs,
  fetchAllCraigslist,
};
