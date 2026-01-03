/**
 * GitHub Scraper - Fetches opportunities from GitHub
 *
 * Sources:
 * - Issues with help-wanted/good-first-issue labels that have bounties
 * - Discussions in popular repos seeking contributors
 * - Sponsor-seeking projects
 */

const GITHUB_API = 'https://api.github.com';

// Languages Jesse works with
const LANGUAGES = ['python', 'javascript', 'typescript', 'go', 'rust'];

// Labels indicating paid opportunities
const PAID_LABELS = [
  'bounty', 'paid', 'funded', 'reward',
  'contractor', 'contract', 'freelance',
];

/**
 * Search GitHub issues with bounties
 */
export async function fetchBountyIssues() {
  const posts = [];

  try {
    // Search for issues with bounty-related labels
    for (const label of ['bounty', 'paid']) {
      const langQuery = LANGUAGES.map(l => `language:${l}`).join('+');
      const query = `label:${label}+state:open+${langQuery}`;

      const response = await fetch(
        `${GITHUB_API}/search/issues?q=${query}&sort=created&order=desc&per_page=20`,
        { headers: { 'Accept': 'application/vnd.github.v3+json' } }
      );

      if (!response.ok) {
        console.warn(`GitHub API returned ${response.status}`);
        continue;
      }

      const data = await response.json();

      for (const issue of data.items || []) {
        // Extract repo info from URL
        const repoMatch = issue.repository_url.match(/repos\/(.+)$/);
        const repoFullName = repoMatch ? repoMatch[1] : 'unknown';

        posts.push({
          source: 'github',
          source_id: `gh_issue_${issue.id}`,
          platform_detail: repoFullName,
          title: issue.title,
          body: issue.body?.slice(0, 2000) || null,
          url: issue.html_url,
          author: issue.user?.login || 'unknown',
          author_url: issue.user?.html_url,
          posted_at: issue.created_at,
          // Extra metadata
          repo: repoFullName,
          labels: issue.labels?.map(l => l.name) || [],
          comments: issue.comments,
          is_bounty: true,
        });
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (err) {
    console.error('Error fetching GitHub bounty issues:', err);
  }

  return posts;
}

/**
 * Search for help-wanted issues in relevant repos
 */
export async function fetchHelpWantedIssues() {
  const posts = [];

  try {
    const langQuery = LANGUAGES.map(l => `language:${l}`).join('+');
    const query = `label:help-wanted+state:open+${langQuery}`;

    const response = await fetch(
      `${GITHUB_API}/search/issues?q=${query}&sort=created&order=desc&per_page=30`,
      { headers: { 'Accept': 'application/vnd.github.v3+json' } }
    );

    if (!response.ok) {
      console.warn(`GitHub API returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    for (const issue of data.items || []) {
      // Skip issues with too many comments (already saturated)
      if (issue.comments > 10) continue;

      const repoMatch = issue.repository_url.match(/repos\/(.+)$/);
      const repoFullName = repoMatch ? repoMatch[1] : 'unknown';

      // Check if any label indicates paid work
      const hasPaidLabel = issue.labels?.some(l =>
        PAID_LABELS.some(pl => l.name.toLowerCase().includes(pl))
      );

      posts.push({
        source: 'github',
        source_id: `gh_issue_${issue.id}`,
        platform_detail: repoFullName,
        title: issue.title,
        body: issue.body?.slice(0, 2000) || null,
        url: issue.html_url,
        author: issue.user?.login || 'unknown',
        author_url: issue.user?.html_url,
        posted_at: issue.created_at,
        // Extra metadata
        repo: repoFullName,
        labels: issue.labels?.map(l => l.name) || [],
        comments: issue.comments,
        is_bounty: hasPaidLabel,
      });
    }
  } catch (err) {
    console.error('Error fetching GitHub help-wanted issues:', err);
  }

  return posts;
}

/**
 * Fetch all GitHub opportunities
 */
export async function fetchAllGitHub(onProgress = null) {
  const allPosts = [];
  const seen = new Set();

  // Bounty issues
  if (onProgress) onProgress(1, 2, 'GitHub: Bounty Issues');
  const bountyPosts = await fetchBountyIssues();
  for (const post of bountyPosts) {
    if (!seen.has(post.source_id)) {
      seen.add(post.source_id);
      allPosts.push(post);
    }
  }

  await new Promise(r => setTimeout(r, 500));

  // Help wanted issues
  if (onProgress) onProgress(2, 2, 'GitHub: Help Wanted');
  const helpPosts = await fetchHelpWantedIssues();
  for (const post of helpPosts) {
    if (!seen.has(post.source_id)) {
      seen.add(post.source_id);
      allPosts.push(post);
    }
  }

  return allPosts;
}

export default {
  fetchBountyIssues,
  fetchHelpWantedIssues,
  fetchAllGitHub,
};
