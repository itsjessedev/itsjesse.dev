/**
 * LinkedIn Scraper - Fetches jobs via Apify LinkedIn Jobs Scraper
 *
 * Uses Apify's LinkedIn scraper API which costs ~$1 per 1000 jobs.
 * $5 free monthly credit covers ~5,000 jobs.
 *
 * IMPORTANT: This should be called from the backend, not client-side,
 * as it requires the Apify API token which should not be exposed.
 *
 * This file provides the client-side interface that calls the backend.
 */

import { API_BASE } from '../sources.js';

// Search terms optimized for freelance/contract developer work
const SEARCH_TERMS = [
  'freelance developer',
  'contract developer',
  'python freelance',
  'javascript freelance',
  'api integration developer',
  'automation developer',
];

/**
 * Fetch LinkedIn jobs via backend (which calls Apify)
 *
 * The backend endpoint should be: POST /api/prospects/linkedin
 */
export async function fetchLinkedIn(searchTerm = null) {
  try {
    const response = await fetch(`${API_BASE}/api/prospects/linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        search_term: searchTerm || SEARCH_TERMS[0],
        filters: {
          datePosted: 'past-week',
          workType: ['remote', 'contract'],
          limit: 50,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`LinkedIn API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.jobs || [];
  } catch (err) {
    console.error('Error fetching LinkedIn jobs:', err);
    return [];
  }
}

/**
 * Fetch LinkedIn jobs for all search terms
 */
export async function fetchAllLinkedIn(onProgress = null) {
  const allJobs = [];
  const seen = new Set();

  for (let i = 0; i < SEARCH_TERMS.length; i++) {
    const term = SEARCH_TERMS[i];

    if (onProgress) {
      onProgress(i + 1, SEARCH_TERMS.length, `LinkedIn: ${term}`);
    }

    const jobs = await fetchLinkedIn(term);

    for (const job of jobs) {
      if (!seen.has(job.source_id)) {
        seen.add(job.source_id);
        allJobs.push(job);
      }
    }

    // Rate limiting
    if (i < SEARCH_TERMS.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return allJobs;
}

/**
 * NOTE: If LinkedIn backend endpoint doesn't exist yet,
 * this provides a stub that returns empty results.
 * The backend needs to implement the Apify integration.
 *
 * Backend implementation example:
 *
 * @router.post("/linkedin")
 * async def fetch_linkedin_jobs(request: LinkedInRequest):
 *     apify_token = settings.apify_api_token
 *     if not apify_token:
 *         return {"jobs": [], "error": "Apify token not configured"}
 *
 *     async with httpx.AsyncClient() as client:
 *         response = await client.post(
 *             'https://api.apify.com/v2/acts/practicaltools~linkedin-jobs/runs',
 *             headers={'Authorization': f'Bearer {apify_token}'},
 *             json={
 *                 'keywords': request.search_term,
 *                 'location': 'remote',
 *                 'datePosted': request.filters.get('datePosted', 'past-week'),
 *                 'maxResults': request.filters.get('limit', 50),
 *             }
 *         )
 *         # Process and return results
 */

export default {
  fetchLinkedIn,
  fetchAllLinkedIn,
  SEARCH_TERMS,
};
