const API_BASE = import.meta.env.PROD ? '' : '';

// GitHub search config
const GITHUB_LANGUAGES = ['python', 'javascript', 'typescript', 'go', 'rust'];
const GITHUB_LABELS = ['good-first-issue', 'help-wanted', 'beginner-friendly', 'easy'];

// Subreddits and keywords for filtering
const TARGET_SUBREDDITS = [
  // Developer communities
  'webdev', 'programming', 'learnprogramming', 'node', 'reactjs',
  'Python', 'django', 'flask', 'FastAPI', 'javascript', 'typescript',
  'golang', 'rust', 'dotnet', 'csharp', 'java', 'php', 'laravel',
  'vuejs', 'angular', 'svelte', 'nextjs', 'devops', 'docker', 'kubernetes',
  'aws', 'azure', 'googlecloud', 'terraform', 'coding', 'softwaredevelopment',

  // Automation & Integration
  'automation', 'zapier', 'n8n', 'IFTTT', 'nocode', 'lowcode', 'make',
  'selfhosted', 'homelab', 'homeautomation', 'tasker', 'shortcuts',

  // Business & Entrepreneurship
  'smallbusiness', 'Entrepreneur', 'startups', 'SaaS', 'indiehackers',
  'microsaas', 'EntrepreneurRideAlong', 'sweatystartup', 'sidehustle',
  'businessideas', 'growmybusiness', 'consulting',

  // Freelance & Consulting
  'freelance', 'freelanceWriters', 'webdesign', 'digitalnomad',
  'WorkOnline', 'remotework', 'forhire', 'slavelabour',

  // Productivity & Tools
  'productivity', 'Notion', 'Airtable', 'crmquestions', 'Obsidianmd',
  'roamresearch', 'logseq', 'zettelkasten',

  // Ecommerce & Marketing
  'ecommerce', 'shopify', 'dropship', 'marketing', 'PPC', 'SEO',
  'emailmarketing', 'socialmediamarketing', 'analytics', 'growthhacking',

  // Data & APIs
  'dataengineering', 'datascience', 'BusinessIntelligence', 'tableau',
  'PowerBI', 'excel', 'googlesheets', 'sql', 'database',

  // Specific tools people struggle with
  'salesforce', 'hubspot', 'stripe', 'twilio', 'sendgrid', 'firebase',
  'supabase', 'mongodb', 'postgresql', 'redis', 'elasticsearch'
];

const TARGET_KEYWORDS = [
  // Integration & Automation
  'integrate', 'integration', 'automate', 'automation', 'api', 'webhook',
  'sync', 'connect', 'workflow', 'pipeline', 'etl',

  // Help-seeking phrases
  'help with', 'how do i', 'how can i', 'need advice', 'looking for',
  'recommendations', 'suggestions', 'best way to', 'anyone know',

  // Problem indicators
  'struggle', 'struggling', 'stuck', 'frustrated', 'issue with',
  'problem with', 'not working', 'cant figure', "can't figure",

  // Tool/solution seeking
  'tool for', 'app for', 'software for', 'solution for', 'alternative to',
  'switch from', 'migrate', 'export', 'import'
];

const MAX_POST_AGE_HOURS = 24;
const MAX_COMMENTS = 15;
const MIN_SCORE = 1;

// Check if text contains keywords
function matchesKeywords(text) {
  const lower = text.toLowerCase();
  return TARGET_KEYWORDS.filter(kw => lower.includes(kw));
}

// Calculate relevance score
function calculateRelevance(post, matchedKeywords) {
  let score = 0;

  // Keyword matches (up to 40 points)
  score += Math.min(matchedKeywords.length * 10, 40);

  // Question indicators (20 points)
  const titleLower = post.title.toLowerCase();
  if (['how', 'help', 'advice', 'need', 'looking for', '?'].some(q => titleLower.includes(q))) {
    score += 20;
  }

  // Low comment count = opportunity (20 points max)
  if (post.num_comments <= 3) score += 20;
  else if (post.num_comments <= 7) score += 10;
  else if (post.num_comments <= 15) score += 5;

  // Recency bonus (20 points max)
  const postAgeHours = (Date.now() / 1000 - post.created_utc) / 3600;
  if (postAgeHours <= 2) score += 20;
  else if (postAgeHours <= 6) score += 15;
  else if (postAgeHours <= 12) score += 10;
  else if (postAgeHours <= 24) score += 5;

  return score;
}

// Fetch from a single subreddit
async function fetchSubreddit(subreddit) {
  const posts = [];
  const cutoffTime = Date.now() / 1000 - (MAX_POST_AGE_HOURS * 3600);

  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/new.json?limit=25`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      console.warn(`Failed to fetch r/${subreddit}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const children = data?.data?.children || [];

    for (const child of children) {
      const post = child.data;

      // Skip old posts
      if (post.created_utc < cutoffTime) continue;

      // Skip posts with too many comments
      if (post.num_comments > MAX_COMMENTS) continue;

      // Skip low-score posts
      if (post.score < MIN_SCORE) continue;

      // Skip non-self posts (links, images)
      if (!post.is_self) continue;

      // Check for keyword matches
      const fullText = `${post.title} ${post.selftext || ''}`;
      const matched = matchesKeywords(fullText);

      if (matched.length > 0) {
        const relevance = calculateRelevance(post, matched);
        posts.push({
          reddit_id: post.id,
          subreddit: subreddit,
          title: post.title,
          body: post.selftext?.slice(0, 2000) || null,
          url: `https://reddit.com${post.permalink}`,
          author: post.author || '[deleted]',
          score: post.score,
          num_comments: post.num_comments,
          created_utc: post.created_utc,
          relevance_score: relevance,
          keywords_matched: matched,
        });
      }
    }
  } catch (err) {
    console.error(`Error fetching r/${subreddit}:`, err);
  }

  return posts;
}

// Fetch from Hacker News
async function fetchHackerNews() {
  const posts = [];
  const cutoffTime = Date.now() / 1000 - (MAX_POST_AGE_HOURS * 3600);

  try {
    // Get latest story IDs
    const idsResponse = await fetch('https://hacker-news.firebaseio.com/v0/newstories.json');
    if (!idsResponse.ok) return [];

    const storyIds = await idsResponse.json();
    // Check first 50 stories
    const toCheck = storyIds.slice(0, 50);

    for (const id of toCheck) {
      try {
        const itemResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!itemResponse.ok) continue;

        const item = await itemResponse.json();
        if (!item || item.type !== 'story' || item.dead || item.deleted) continue;

        // Skip old posts
        if (item.time < cutoffTime) continue;

        // Skip posts with too many comments
        if ((item.descendants || 0) > MAX_COMMENTS) continue;

        // HN "Ask HN" and text posts are most relevant (no url means it's a text post)
        const isAskHN = item.title?.startsWith('Ask HN:');
        const isShowHN = item.title?.startsWith('Show HN:');
        const isTextPost = !item.url;

        // Only process Ask HN or text posts (these are discussion posts)
        if (!isAskHN && !isTextPost) continue;

        const fullText = `${item.title || ''} ${item.text || ''}`;
        const matched = matchesKeywords(fullText);

        // For HN, also match Ask HN posts even without keywords
        if (matched.length > 0 || isAskHN) {
          const relevance = calculateRelevance({
            title: item.title,
            num_comments: item.descendants || 0,
            created_utc: item.time,
          }, matched);

          posts.push({
            reddit_id: `hn_${item.id}`,
            subreddit: isAskHN ? 'HN:Ask' : isShowHN ? 'HN:Show' : 'HN',
            title: item.title,
            body: item.text?.slice(0, 2000) || null,
            url: `https://news.ycombinator.com/item?id=${item.id}`,
            author: item.by || '[deleted]',
            score: item.score || 0,
            num_comments: item.descendants || 0,
            created_utc: item.time,
            relevance_score: relevance + (isAskHN ? 15 : 0), // Bonus for Ask HN
            keywords_matched: matched.length > 0 ? matched : ['ask-hn'],
          });
        }
      } catch (err) {
        console.warn(`Error fetching HN item ${id}:`, err);
      }
    }
  } catch (err) {
    console.error('Error fetching Hacker News:', err);
  }

  return posts;
}

// Fetch from Lobsters
async function fetchLobsters() {
  const posts = [];
  const cutoffTime = Date.now() / 1000 - (MAX_POST_AGE_HOURS * 3600);

  try {
    const response = await fetch('https://lobste.rs/newest.json');
    if (!response.ok) return [];

    const stories = await response.json();

    for (const story of stories) {
      const createdAt = new Date(story.created_at).getTime() / 1000;

      // Skip old posts
      if (createdAt < cutoffTime) continue;

      // Skip posts with too many comments
      if (story.comment_count > MAX_COMMENTS) continue;

      // Only text posts (no url or same-domain url)
      if (story.url && !story.url.includes('lobste.rs')) continue;

      const fullText = `${story.title} ${story.description || ''}`;
      const matched = matchesKeywords(fullText);

      if (matched.length > 0) {
        const relevance = calculateRelevance({
          title: story.title,
          num_comments: story.comment_count,
          created_utc: createdAt,
        }, matched);

        posts.push({
          reddit_id: `lobsters_${story.short_id}`,
          subreddit: `Lobsters:${story.tags?.[0] || 'general'}`,
          title: story.title,
          body: story.description?.slice(0, 2000) || null,
          url: story.comments_url,
          author: story.submitter_user?.username || '[deleted]',
          score: story.score || 0,
          num_comments: story.comment_count || 0,
          created_utc: createdAt,
          relevance_score: relevance,
          keywords_matched: matched,
        });
      }
    }
  } catch (err) {
    console.error('Error fetching Lobsters:', err);
  }

  return posts;
}

// Fetch from all sources (client-side)
export async function fetchFromReddit(onProgress = null) {
  const allPosts = [];
  const totalSources = TARGET_SUBREDDITS.length + 2; // +2 for HN and Lobsters
  let current = 0;

  // Fetch from Hacker News first
  if (onProgress) onProgress(++current, totalSources, 'Hacker News');
  const hnPosts = await fetchHackerNews();
  allPosts.push(...hnPosts);

  // Fetch from Lobsters
  if (onProgress) onProgress(++current, totalSources, 'Lobsters');
  const lobstersPosts = await fetchLobsters();
  allPosts.push(...lobstersPosts);

  // Fetch from Reddit subreddits
  for (let i = 0; i < TARGET_SUBREDDITS.length; i++) {
    const subreddit = TARGET_SUBREDDITS[i];
    if (onProgress) onProgress(++current, totalSources, `r/${subreddit}`);

    const posts = await fetchSubreddit(subreddit);
    allPosts.push(...posts);

    // Small delay to be nice to Reddit
    if (i < TARGET_SUBREDDITS.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Sort by relevance
  allPosts.sort((a, b) => b.relevance_score - a.relevance_score);
  return allPosts;
}

// Submit fetched posts to backend
export async function submitPosts(posts) {
  const res = await fetch(`${API_BASE}/api/posts/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ posts }),
  });
  if (!res.ok) throw new Error('Failed to submit posts');
  return res.json();
}

// Get posts from backend
export async function fetchPosts(status = null) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('limit', '50');

  const res = await fetch(`${API_BASE}/api/posts/?${params}`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/api/posts/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function generateResponse(postId, customContext = null) {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ post_id: postId, custom_context: customContext }),
  });
  if (!res.ok) throw new Error('Failed to generate response');
  return res.json();
}

export async function updatePost(postId, updates) {
  const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update post');
  return res.json();
}

export async function deletePost(postId) {
  const res = await fetch(`${API_BASE}/api/posts/${postId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete post');
  return res.json();
}

// Fetch GitHub issues for contribution opportunities
export async function fetchGitHubIssues(onProgress = null) {
  const allIssues = [];
  const seenIds = new Set();

  for (let i = 0; i < GITHUB_LABELS.length; i++) {
    const label = GITHUB_LABELS[i];
    if (onProgress) onProgress(i + 1, GITHUB_LABELS.length, label);

    try {
      // Search for issues with this label across all target languages
      const langQuery = GITHUB_LANGUAGES.map(l => `language:${l}`).join('+');
      const query = `label:${label}+state:open+${langQuery}`;

      const response = await fetch(
        `https://api.github.com/search/issues?q=${query}&sort=created&order=desc&per_page=25`,
        { headers: { 'Accept': 'application/vnd.github.v3+json' } }
      );

      if (!response.ok) {
        console.warn(`GitHub API error for ${label}: ${response.status}`);
        continue;
      }

      const data = await response.json();

      for (const issue of data.items || []) {
        // Skip if we've seen this issue
        if (seenIds.has(issue.id)) continue;
        seenIds.add(issue.id);

        // Extract repo info from URL
        const repoMatch = issue.repository_url.match(/repos\/(.+)$/);
        const repoFullName = repoMatch ? repoMatch[1] : 'unknown';

        // Calculate a simple relevance score
        let score = 0;
        // Prefer issues with fewer comments (less competition)
        if (issue.comments <= 2) score += 30;
        else if (issue.comments <= 5) score += 15;
        // Prefer recent issues
        const ageHours = (Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60);
        if (ageHours <= 24) score += 30;
        else if (ageHours <= 72) score += 20;
        else if (ageHours <= 168) score += 10;
        // Bonus for good-first-issue specifically
        if (issue.labels?.some(l => l.name === 'good-first-issue')) score += 20;

        allIssues.push({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body?.slice(0, 2000) || null,
          url: issue.html_url,
          repo: repoFullName,
          repoUrl: `https://github.com/${repoFullName}`,
          author: issue.user?.login || '[deleted]',
          comments: issue.comments,
          labels: issue.labels?.map(l => l.name) || [],
          created_at: issue.created_at,
          relevance_score: score,
        });
      }

      // Small delay between requests
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`Error fetching GitHub issues for ${label}:`, err);
    }
  }

  // Sort by relevance
  allIssues.sort((a, b) => b.relevance_score - a.relevance_score);
  return allIssues;
}

// Format a GitHub issue for Claude
export function formatIssueForClaude(issue) {
  return `I found this GitHub issue I'd like to contribute to:
**Repo:** ${issue.repo}
**Issue #${issue.number}:** ${issue.title}
**URL:** ${issue.url}
**Labels:** ${issue.labels.join(', ')}

**Description:**
${issue.body || 'No description provided.'}

---
Please help me make a contribution to fix this issue. Clone the repo, understand the codebase, implement a fix, and create a pull request.`;
}
