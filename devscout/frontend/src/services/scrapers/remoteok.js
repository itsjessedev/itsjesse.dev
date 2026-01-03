/**
 * RemoteOK Scraper - Fetches jobs from RemoteOK API
 *
 * RemoteOK has a public JSON API that doesn't require authentication.
 */

const REMOTEOK_API = 'https://remoteok.com/api';

// Keywords relevant to Jesse's services
const RELEVANT_KEYWORDS = [
  'python', 'javascript', 'typescript', 'react', 'node', 'developer',
  'engineer', 'fullstack', 'full stack', 'backend', 'frontend',
  'api', 'integration', 'automation', 'bot', 'scraping',
];

// Job types that indicate freelance/contract
const FREELANCE_INDICATORS = [
  'contract', 'freelance', 'contractor', 'consultant',
  'part-time', 'part time', 'temporary',
];

/**
 * Fetch jobs from RemoteOK
 */
export async function fetchRemoteOK() {
  const posts = [];

  try {
    // RemoteOK returns JSON directly
    const response = await fetch(REMOTEOK_API);

    if (!response.ok) {
      console.warn(`RemoteOK API returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    // First item is metadata, skip it
    const jobs = Array.isArray(data) ? data.slice(1) : [];

    const cutoffTime = Date.now() - (14 * 24 * 60 * 60 * 1000); // Last 14 days

    for (const job of jobs) {
      if (!job.date) continue;

      const postedAt = new Date(job.date).getTime();
      if (postedAt < cutoffTime) continue;

      // Check for relevant keywords
      const combined = `${job.position || ''} ${job.description || ''} ${job.tags?.join(' ') || ''}`.toLowerCase();
      const hasRelevant = RELEVANT_KEYWORDS.some(kw => combined.includes(kw));

      if (!hasRelevant) continue;

      // Check if it's freelance/contract (higher value)
      const isFreelance = FREELANCE_INDICATORS.some(kw => combined.includes(kw));

      posts.push({
        source: 'remoteok',
        source_id: `rok_${job.id}`,
        platform_detail: 'RemoteOK',
        title: job.position || 'Untitled',
        body: job.description?.slice(0, 2000) || null,
        url: job.url || `https://remoteok.com/jobs/${job.id}`,
        author: job.company || 'Unknown Company',
        posted_at: new Date(job.date).toISOString(),
        // Extra metadata
        company: job.company,
        company_logo: job.company_logo,
        location: job.location,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        tags: job.tags || [],
        is_freelance: isFreelance,
      });
    }
  } catch (err) {
    console.error('Error fetching RemoteOK:', err);
  }

  return posts;
}

export default {
  fetchRemoteOK,
};
