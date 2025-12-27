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

// Fetch from Reddit only (client-side)
// Supports resume via startIndex and incremental progress via onPartialResults
export async function fetchFromReddit(onProgress = null, onPartialResults = null, startIndex = 0) {
  const allPosts = [];
  const totalSources = TARGET_SUBREDDITS.length;

  // Fetch from Reddit subreddits
  for (let i = startIndex; i < TARGET_SUBREDDITS.length; i++) {
    const subreddit = TARGET_SUBREDDITS[i];
    if (onProgress) onProgress(i + 1, totalSources, `r/${subreddit}`);

    const posts = await fetchSubreddit(subreddit);
    allPosts.push(...posts);

    // Save incremental progress
    if (onPartialResults) {
      onPartialResults([...allPosts], i + 1);
    }

    // Small delay to be nice to Reddit
    if (i < TARGET_SUBREDDITS.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Sort by relevance
  allPosts.sort((a, b) => b.relevance_score - a.relevance_score);
  return allPosts;
}

// Get total subreddit count for progress display
export function getPostsSubredditCount() {
  return TARGET_SUBREDDITS.length;
}

// Fetch from Dev.to
async function fetchDevTo() {
  const posts = [];
  const cutoffTime = Date.now() / 1000 - (MAX_POST_AGE_HOURS * 3600);

  try {
    // Get latest articles - use top=7 to get popular posts from last week
    const response = await fetch('https://dev.to/api/articles?per_page=50&top=7');
    if (!response.ok) return [];

    const articles = await response.json();

    for (const article of articles) {
      const createdAt = new Date(article.published_at).getTime() / 1000;

      // Skip old posts
      if (createdAt < cutoffTime) continue;

      // Skip posts with too many comments (already saturated)
      if (article.comments_count > MAX_COMMENTS * 2) continue;

      const fullText = `${article.title} ${article.description || ''} ${article.tag_list?.join(' ') || ''}`;
      const matched = matchesKeywords(fullText);

      if (matched.length > 0) {
        const relevance = calculateRelevance({
          title: article.title,
          num_comments: article.comments_count,
          created_utc: createdAt,
        }, matched);

        posts.push({
          reddit_id: `devto_${article.id}`,
          subreddit: `DEV:${article.tag_list?.[0] || 'general'}`,
          title: article.title,
          body: article.description?.slice(0, 2000) || null,
          url: article.url,
          author: article.user?.username || '[deleted]',
          score: article.public_reactions_count || 0,
          num_comments: article.comments_count || 0,
          created_utc: createdAt,
          relevance_score: relevance,
          keywords_matched: matched,
        });
      }
    }
  } catch (err) {
    console.error('Error fetching Dev.to:', err);
  }

  return posts;
}

// Fetch from Hashnode
async function fetchHashnode() {
  const posts = [];
  const cutoffTime = Date.now() / 1000 - (MAX_POST_AGE_HOURS * 3600);

  try {
    // Hashnode has a GraphQL API, but we can use their feed API
    const response = await fetch('https://hashnode.com/api/feed/hot?page=0');
    if (!response.ok) return [];

    const data = await response.json();
    const articles = data.posts || [];

    for (const article of articles) {
      const createdAt = new Date(article.dateAdded).getTime() / 1000;

      // Skip old posts
      if (createdAt < cutoffTime) continue;

      // Skip posts with too many responses
      if ((article.responseCount || 0) > MAX_COMMENTS * 2) continue;

      const fullText = `${article.title} ${article.brief || ''} ${article.tags?.map(t => t.name).join(' ') || ''}`;
      const matched = matchesKeywords(fullText);

      if (matched.length > 0) {
        const relevance = calculateRelevance({
          title: article.title,
          num_comments: article.responseCount || 0,
          created_utc: createdAt,
        }, matched);

        posts.push({
          reddit_id: `hashnode_${article._id || article.cuid}`,
          subreddit: `Hashnode:${article.tags?.[0]?.name || 'general'}`,
          title: article.title,
          body: article.brief?.slice(0, 2000) || null,
          url: article.publication?.domain
            ? `https://${article.publication.domain}/${article.slug}`
            : `https://hashnode.com/post/${article.slug}`,
          author: article.author?.username || '[deleted]',
          score: article.totalReactions || 0,
          num_comments: article.responseCount || 0,
          created_utc: createdAt,
          relevance_score: relevance,
          keywords_matched: matched,
        });
      }
    }
  } catch (err) {
    console.error('Error fetching Hashnode:', err);
  }

  return posts;
}

// Fetch from Indie Hackers
async function fetchIndieHackers() {
  const posts = [];
  const cutoffTime = Date.now() / 1000 - (MAX_POST_AGE_HOURS * 3600);

  try {
    // Indie Hackers posts API
    const response = await fetch('https://www.indiehackers.com/api/posts?sort=new&limit=50');
    if (!response.ok) return [];

    const data = await response.json();
    const postList = data.posts || [];

    for (const post of postList) {
      const createdAt = new Date(post.createdAt).getTime() / 1000;

      // Skip old posts
      if (createdAt < cutoffTime) continue;

      // Skip posts with too many comments
      if (post.commentCount > MAX_COMMENTS * 2) continue;

      const fullText = `${post.title} ${post.body || ''} ${post.tagline || ''}`;
      const matched = matchesKeywords(fullText);

      if (matched.length > 0) {
        const relevance = calculateRelevance({
          title: post.title,
          num_comments: post.commentCount || 0,
          created_utc: createdAt,
        }, matched);

        posts.push({
          reddit_id: `ih_${post.id}`,
          subreddit: `IH:${post.group?.name || 'general'}`,
          title: post.title,
          body: post.body?.slice(0, 2000) || post.tagline || null,
          url: `https://www.indiehackers.com/post/${post.slug || post.id}`,
          author: post.user?.username || '[deleted]',
          score: post.voteCount || 0,
          num_comments: post.commentCount || 0,
          created_utc: createdAt,
          relevance_score: relevance,
          keywords_matched: matched,
        });
      }
    }
  } catch (err) {
    console.error('Error fetching Indie Hackers:', err);
  }

  return posts;
}

// Fetch from Tildes (HN-like community)
async function fetchTildes() {
  const posts = [];
  const cutoffTime = Date.now() / 1000 - (MAX_POST_AGE_HOURS * 3600);

  try {
    // Tildes doesn't have a public API, but we can try to parse their RSS/Atom
    const response = await fetch('https://tildes.net/~tech.rss');
    if (!response.ok) return [];

    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const items = doc.querySelectorAll('item');

    for (const item of items) {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent;
      const description = item.querySelector('description')?.textContent || '';

      if (!pubDate) continue;
      const createdAt = new Date(pubDate).getTime() / 1000;

      // Skip old posts
      if (createdAt < cutoffTime) continue;

      const fullText = `${title} ${description}`;
      const matched = matchesKeywords(fullText);

      if (matched.length > 0) {
        const relevance = calculateRelevance({
          title,
          num_comments: 0,
          created_utc: createdAt,
        }, matched);

        posts.push({
          reddit_id: `tildes_${btoa(link).slice(0, 20)}`,
          subreddit: 'Tildes:tech',
          title,
          body: description?.slice(0, 2000) || null,
          url: link,
          author: '[tildes]',
          score: 0,
          num_comments: 0,
          created_utc: createdAt,
          relevance_score: relevance,
          keywords_matched: matched,
        });
      }
    }
  } catch (err) {
    console.error('Error fetching Tildes:', err);
  }

  return posts;
}

// Fetch from HN, Lobsters, Dev.to, Hashnode, Indie Hackers, and Tildes (client-side)
export async function fetchNews(onProgress = null) {
  const allPosts = [];
  const totalSources = 6;

  // Fetch from Hacker News
  if (onProgress) onProgress(1, totalSources, 'Hacker News');
  const hnPosts = await fetchHackerNews();
  allPosts.push(...hnPosts);

  // Fetch from Lobsters
  if (onProgress) onProgress(2, totalSources, 'Lobsters');
  const lobstersPosts = await fetchLobsters();
  allPosts.push(...lobstersPosts);

  // Fetch from Dev.to
  if (onProgress) onProgress(3, totalSources, 'Dev.to');
  const devtoPosts = await fetchDevTo();
  allPosts.push(...devtoPosts);

  // Fetch from Hashnode
  if (onProgress) onProgress(4, totalSources, 'Hashnode');
  const hashnodePosts = await fetchHashnode();
  allPosts.push(...hashnodePosts);

  // Fetch from Indie Hackers
  if (onProgress) onProgress(5, totalSources, 'Indie Hackers');
  const ihPosts = await fetchIndieHackers();
  allPosts.push(...ihPosts);

  // Fetch from Tildes
  if (onProgress) onProgress(6, totalSources, 'Tildes');
  const tildesPosts = await fetchTildes();
  allPosts.push(...tildesPosts);

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

// Generate a response to a reply to user's comment
export async function generateReplyResponse({ subreddit, myComment, theirReply }) {
  const res = await fetch(`${API_BASE}/api/posts/generate-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subreddit, my_comment: myComment, their_reply: theirReply }),
  });
  if (!res.ok) throw new Error('Failed to generate reply');
  return res.json();
}

// Generate an engagement post for starting a discussion
export async function generateEngagePost({ subreddit, ideaTemplate, category }) {
  const res = await fetch(`${API_BASE}/api/posts/generate-engage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subreddit, idea_template: ideaTemplate, category }),
  });
  if (!res.ok) throw new Error('Failed to generate engage post');
  return res.json();
}

// Generate a response for a news post (HN, Lobsters, Dev.to, Hashnode)
export async function generateNewsResponse({ title, body, source }) {
  const res = await fetch(`${API_BASE}/api/posts/generate-news`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, source }),
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

export async function clearStalePosts() {
  const res = await fetch(`${API_BASE}/api/posts/clear/stale`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear posts');
  return res.json();
}

// Reply tracking functions
export async function fetchTrackedPosts() {
  const res = await fetch(`${API_BASE}/api/posts/tracked`);
  if (!res.ok) throw new Error('Failed to fetch tracked posts');
  return res.json();
}

export async function updateReplyCount(postId, count) {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/update-replies?count=${count}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to update reply count');
  return res.json();
}

export async function markRepliesRead(postId) {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/mark-read`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to mark replies read');
  return res.json();
}

// Parse Reddit comment URL to extract info
function parseRedditCommentUrl(url) {
  // Expected format: https://reddit.com/r/subreddit/comments/postid/title/commentid/
  const match = url.match(/reddit\.com\/r\/(\w+)\/comments\/(\w+)\/[^/]+\/(\w+)/);
  if (!match) return null;
  return {
    subreddit: match[1],
    postId: match[2],
    commentId: match[3],
  };
}

// Fetch replies to a Reddit comment (client-side)
export async function fetchCommentReplies(commentUrl) {
  const parsed = parseRedditCommentUrl(commentUrl);
  if (!parsed) return { replies: [], error: 'Invalid Reddit comment URL' };

  try {
    // Fetch the comment thread
    const response = await fetch(
      `https://www.reddit.com/r/${parsed.subreddit}/comments/${parsed.postId}/_/${parsed.commentId}.json`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      return { replies: [], error: `Failed to fetch: ${response.status}` };
    }

    const data = await response.json();

    // The structure is: [post, comments]
    // comments.data.children contains the comment and its replies
    const replies = [];

    if (data[1]?.data?.children) {
      for (const child of data[1].data.children) {
        if (child.kind === 't1' && child.data.id !== parsed.commentId) {
          // Find replies to our comment
          const findReplies = (comment, parentId) => {
            if (comment.data?.parent_id === `t1_${parentId}`) {
              replies.push({
                id: comment.data.id,
                author: comment.data.author || '[deleted]',
                body: comment.data.body || '',
                created_utc: comment.data.created_utc,
                score: comment.data.score || 0,
                permalink: `https://reddit.com${comment.data.permalink}`,
              });
            }
            // Check nested replies
            if (comment.data?.replies?.data?.children) {
              for (const reply of comment.data.replies.data.children) {
                if (reply.kind === 't1') {
                  findReplies(reply, parentId);
                }
              }
            }
          };
          findReplies(child, parsed.commentId);
        }

        // Also check if this IS our comment and has replies
        if (child.data?.id === parsed.commentId && child.data?.replies?.data?.children) {
          for (const reply of child.data.replies.data.children) {
            if (reply.kind === 't1') {
              replies.push({
                id: reply.data.id,
                author: reply.data.author || '[deleted]',
                body: reply.data.body || '',
                created_utc: reply.data.created_utc,
                score: reply.data.score || 0,
                permalink: `https://reddit.com${reply.data.permalink}`,
              });
            }
          }
        }
      }
    }

    return { replies, error: null };
  } catch (err) {
    return { replies: [], error: err.message };
  }
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

// ============= REPLIES TRACKING =============

const TARGET_USERNAME = 'jessedev_';

// Scrape a Reddit post for user's comments and their replies
export async function scrapePostForUserComments(postUrl) {
  console.log(`[DevScout] scrapePostForUserComments called with URL: ${postUrl}`);

  try {
    // Extract post ID from URL - handle both old.reddit and www.reddit URLs
    const match = postUrl.match(/reddit\.com\/r\/\w+\/comments\/(\w+)/);
    if (!match) {
      console.error(`[DevScout] Could not parse post URL: ${postUrl}`);
      return { comments: [], error: 'Invalid Reddit post URL' };
    }

    const postId = match[1];
    console.log(`[DevScout] Extracted post ID: ${postId}`);

    // Try multiple methods to fetch Reddit data
    let response;
    let data;

    // Method 1: Try direct fetch (might work in some browsers/situations)
    try {
      const directUrl = `https://www.reddit.com/comments/${postId}.json?limit=500&depth=10`;
      console.log(`[DevScout] Trying direct fetch: ${directUrl}`);
      response = await fetch(directUrl, {
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        data = await response.json();
        console.log(`[DevScout] Direct fetch succeeded`);
      }
    } catch (e) {
      console.log(`[DevScout] Direct fetch failed: ${e.message}`);
    }

    // Method 2: Try corsproxy.io (free CORS proxy)
    if (!data) {
      try {
        const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://www.reddit.com/comments/${postId}.json?limit=500&depth=10`)}`;
        console.log(`[DevScout] Trying corsproxy.io: ${corsProxyUrl}`);
        response = await fetch(corsProxyUrl, {
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          data = await response.json();
          console.log(`[DevScout] corsproxy.io succeeded`);
        }
      } catch (e) {
        console.log(`[DevScout] corsproxy.io failed: ${e.message}`);
      }
    }

    // Method 3: Try allorigins.win
    if (!data) {
      try {
        const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.reddit.com/comments/${postId}.json?limit=500&depth=10`)}`;
        console.log(`[DevScout] Trying allorigins: ${allOriginsUrl}`);
        response = await fetch(allOriginsUrl);
        if (response.ok) {
          data = await response.json();
          console.log(`[DevScout] allorigins succeeded`);
        }
      } catch (e) {
        console.log(`[DevScout] allorigins failed: ${e.message}`);
      }
    }

    if (!data) {
      console.error(`[DevScout] All fetch methods failed for post ${postId}`);
      return { comments: [], error: 'All fetch methods failed' };
    }

    console.log(`[DevScout] Got response data, array length: ${Array.isArray(data) ? data.length : 'not an array'}`);

    // Debug: log the structure
    if (Array.isArray(data) && data.length >= 2) {
      console.log(`[DevScout] data[0] kind: ${data[0]?.kind}, data[1] kind: ${data[1]?.kind}`);
      console.log(`[DevScout] data[1].data.children count: ${data[1]?.data?.children?.length || 0}`);
    } else {
      console.error(`[DevScout] Unexpected data structure:`, JSON.stringify(data).slice(0, 500));
    }

    const userComments = [];

    console.log(`[DevScout] Searching for comments by u/${TARGET_USERNAME}...`);

    // Recursively find all comments by target user
    function findUserComments(comments, depth = 0) {
      if (!comments || !Array.isArray(comments)) {
        if (depth === 0) console.log(`[DevScout] No comments array at depth ${depth}`);
        return;
      }

      for (const child of comments) {
        if (child.kind !== 't1') continue;

        const comment = child.data;
        const author = comment.author || '[deleted]';

        // Debug: log all authors at shallow depths
        if (depth < 2) {
          console.log(`[DevScout] Depth ${depth}: Comment by u/${author} (id: ${comment.id})`);
        }

        // Check if this comment is by our user (case-insensitive)
        if (author.toLowerCase() === TARGET_USERNAME.toLowerCase()) {
          console.log(`[DevScout] ✓ FOUND user comment! ID: ${comment.id}, Body: "${comment.body?.slice(0, 80)}..."`);

          // Get direct replies to this comment
          const replies = [];
          if (comment.replies?.data?.children) {
            console.log(`[DevScout] Checking ${comment.replies.data.children.length} replies to user's comment`);
            for (const reply of comment.replies.data.children) {
              if (reply.kind === 't1' && reply.data.author?.toLowerCase() !== TARGET_USERNAME.toLowerCase()) {
                replies.push({
                  id: reply.data.id,
                  author: reply.data.author || '[deleted]',
                  body: reply.data.body || '',
                  created_utc: reply.data.created_utc,
                  score: reply.data.score || 0,
                  permalink: `https://reddit.com${reply.data.permalink}`,
                  // Check if user has replied to this reply
                  hasUserReply: checkForUserReply(reply.data.replies),
                });
              }
            }
          }

          userComments.push({
            id: comment.id,
            body: comment.body || '',
            created_utc: comment.created_utc,
            score: comment.score || 0,
            permalink: `https://reddit.com${comment.permalink}`,
            replies: replies,
            unrepliedCount: replies.filter(r => !r.hasUserReply).length,
          });
        }

        // Recurse into nested comments
        if (comment.replies?.data?.children) {
          findUserComments(comment.replies.data.children, depth + 1);
        }
      }
    }

    // Check if user has replied within a comment tree
    function checkForUserReply(replies) {
      if (!replies?.data?.children) return false;

      for (const child of replies.data.children) {
        if (child.kind !== 't1') continue;
        if (child.data.author?.toLowerCase() === TARGET_USERNAME.toLowerCase()) {
          return true;
        }
        // Check nested replies
        if (checkForUserReply(child.data.replies)) {
          return true;
        }
      }
      return false;
    }

    // Start searching from the comment tree
    if (data[1]?.data?.children) {
      console.log(`[DevScout] Starting search through ${data[1].data.children.length} top-level comments`);
      findUserComments(data[1].data.children);
    } else {
      console.error(`[DevScout] No comments found in response - data[1].data.children is missing`);
    }

    console.log(`[DevScout] Search complete. Found ${userComments.length} comments by u/${TARGET_USERNAME}`);
    return { comments: userComments, error: null };
  } catch (err) {
    console.error(`[DevScout] Exception in scrapePostForUserComments:`, err);
    return { comments: [], error: err.message };
  }
}

// Scrape multiple posts for user's comments (for batch processing)
export async function scrapeTrackedPostsForReplies(posts) {
  const results = {};

  for (const post of posts) {
    const { comments, error } = await scrapePostForUserComments(post.url);
    if (!error) {
      results[post.id] = {
        comments,
        totalUnreplied: comments.reduce((sum, c) => sum + c.unrepliedCount, 0),
      };
    }
    // Small delay to be nice to Reddit
    await new Promise(r => setTimeout(r, 300));
  }

  return results;
}

// ============= COMMUNITY ENGAGEMENT =============

// Engagement subreddits (where we can start discussions)
export const ENGAGEMENT_SUBREDDITS = {
  // Developer discussions
  'programming': ['webdev', 'coding', 'softwareDevelopment', 'learnprogramming'],
  'webdev': ['programming', 'frontend', 'webdevelopment', 'coding'],
  'Python': ['learnpython', 'django', 'flask', 'coding'],
  'javascript': ['reactjs', 'typescript', 'node', 'webdev'],
  'reactjs': ['javascript', 'nextjs', 'webdev', 'frontend'],
  'node': ['javascript', 'express', 'webdev', 'backend'],
  'learnprogramming': ['programming', 'coding', 'cscareerquestions'],

  // Automation & Tools
  'automation': ['selfhosted', 'homelab', 'productivity'],
  'selfhosted': ['homelab', 'automation', 'linux'],
  'homelab': ['selfhosted', 'sysadmin', 'networking'],

  // Business & Entrepreneurship
  'Entrepreneur': ['startups', 'smallbusiness', 'SaaS', 'indiehackers'],
  'startups': ['Entrepreneur', 'SaaS', 'microsaas'],
  'smallbusiness': ['Entrepreneur', 'ecommerce', 'marketing'],
  'SaaS': ['startups', 'microsaas', 'indiehackers'],
  'indiehackers': ['SaaS', 'microsaas', 'startups'],

  // Freelance
  'freelance': ['WorkOnline', 'digitalnomad', 'consulting'],
  'WorkOnline': ['freelance', 'remotework', 'sidehustle'],
};

// Post idea templates organized by category - EXPERT LEVEL (no novice content)
export const ENGAGEMENT_TEMPLATES = {
  architecture_deep_dives: [
    { title: "The hidden complexity of {X} integrations that nobody talks about", tags: ['architecture', 'deep-dive'], subreddits: ['programming', 'webdev', 'node'] },
    { title: "Why I stopped using {X} and built my own {Y}", tags: ['architecture', 'experience'], subreddits: ['programming', 'selfhosted', 'SaaS'] },
    { title: "Patterns I've seen across 50+ API integrations", tags: ['patterns', 'api'], subreddits: ['programming', 'webdev', 'node'] },
    { title: "What happens when {X} fails at scale - lessons from production", tags: ['scale', 'production'], subreddits: ['programming', 'devops', 'node'] },
    { title: "The architecture decisions that saved us from {X} disaster", tags: ['architecture', 'lessons'], subreddits: ['programming', 'devops', 'webdev'] },
    { title: "How I structure {X} integrations to avoid vendor lock-in", tags: ['architecture', 'strategy'], subreddits: ['programming', 'webdev', 'SaaS'] },
    { title: "The abstraction layer that made {X} integrations maintainable", tags: ['architecture', 'patterns'], subreddits: ['programming', 'webdev', 'node'] },
  ],
  production_war_stories: [
    { title: "That time {X} took down our {Y} - and what we learned", tags: ['war-story', 'postmortem'], subreddits: ['programming', 'devops', 'startups'] },
    { title: "The 3am incident that changed how we handle {X}", tags: ['war-story', 'oncall'], subreddits: ['devops', 'programming', 'sysadmin'] },
    { title: "How a {X} edge case cost us {Y} - lessons learned", tags: ['war-story', 'lessons'], subreddits: ['programming', 'startups', 'Entrepreneur'] },
    { title: "The silent failure that went unnoticed for 3 months", tags: ['war-story', 'monitoring'], subreddits: ['devops', 'programming', 'sysadmin'] },
    { title: "When {X} rate limits hit and we had to rewrite everything in 48 hours", tags: ['war-story', 'api'], subreddits: ['programming', 'webdev', 'node'] },
    { title: "The $X,000 mistake that taught me about {Y}", tags: ['war-story', 'lessons'], subreddits: ['programming', 'startups', 'Entrepreneur'] },
  ],
  hard_lessons: [
    { title: "When NOT to automate - lessons from over-engineering", tags: ['automation', 'lessons'], subreddits: ['programming', 'automation', 'Entrepreneur'] },
    { title: "The real cost of technical debt in {X} - a postmortem", tags: ['technical-debt', 'postmortem'], subreddits: ['programming', 'webdev', 'startups'] },
    { title: "Why your {X} integration is probably broken (and how to fix it)", tags: ['debugging', 'integration'], subreddits: ['programming', 'webdev', 'node'] },
    { title: "The 3 integration antipatterns I see everywhere", tags: ['antipatterns', 'architecture'], subreddits: ['programming', 'webdev', 'node'] },
    { title: "What I wish I knew before building {X} integrations at scale", tags: ['lessons', 'scale'], subreddits: ['programming', 'webdev', 'devops'] },
    { title: "The abstractions that seemed clever until production", tags: ['lessons', 'architecture'], subreddits: ['programming', 'webdev', 'node'] },
  ],
  technical_opinions: [
    { title: "Unpopular opinion: {X} is overengineered for most use cases", tags: ['opinion', 'discussion'], subreddits: ['programming', 'webdev', 'node'] },
    { title: "Why I prefer {X} over {Y} for production workloads", tags: ['opinion', 'comparison'], subreddits: ['programming', 'devops', 'selfhosted'] },
    { title: "The case against {X} in {Y} environments", tags: ['opinion', 'technical'], subreddits: ['programming', 'webdev', 'devops'] },
    { title: "Hot take: Most {X} problems are actually {Y} problems", tags: ['opinion', 'discussion'], subreddits: ['programming', 'webdev', 'Entrepreneur'] },
    { title: "Why the {X} ecosystem is heading in the wrong direction", tags: ['opinion', 'industry'], subreddits: ['programming', 'webdev', 'node'] },
    { title: "The uncomfortable truth about {X} that vendors won't tell you", tags: ['opinion', 'industry'], subreddits: ['programming', 'devops', 'SaaS'] },
  ],
  debugging_and_process: [
    { title: "How I debug {X} integrations - my actual process", tags: ['debugging', 'process'], subreddits: ['programming', 'webdev', 'node'] },
    { title: "The debugging technique that changed how I approach {X}", tags: ['debugging', 'tips'], subreddits: ['programming', 'webdev', 'devops'] },
    { title: "Tracing a {X} bug through 5 services - a war story", tags: ['debugging', 'war-story'], subreddits: ['programming', 'devops', 'node'] },
    { title: "My toolkit for debugging distributed {X} systems", tags: ['debugging', 'tools'], subreddits: ['programming', 'devops', 'node'] },
    { title: "The observability setup that makes debugging {X} actually possible", tags: ['debugging', 'monitoring'], subreddits: ['devops', 'programming', 'sysadmin'] },
  ],
  expert_discussions: [
    { title: "How do you handle {X} at scale?", tags: ['scale', 'discussion'], subreddits: ['programming', 'webdev', 'devops'] },
    { title: "What's your approach to {X} in distributed systems?", tags: ['distributed', 'discussion'], subreddits: ['programming', 'devops', 'node'] },
    { title: "What's your monitoring/alerting setup for {X}?", tags: ['monitoring', 'discussion'], subreddits: ['devops', 'selfhosted', 'programming'] },
    { title: "How do you test {X} integrations in CI/CD?", tags: ['testing', 'cicd'], subreddits: ['programming', 'devops', 'webdev'] },
    { title: "What's your strategy for API versioning in production?", tags: ['api', 'discussion'], subreddits: ['programming', 'webdev', 'node'] },
    { title: "How are you handling secrets management for {X}?", tags: ['security', 'discussion'], subreddits: ['devops', 'programming', 'sysadmin'] },
  ],
  industry_insights: [
    { title: "Why {X} adoption is stalling - an insider perspective", tags: ['industry', 'analysis'], subreddits: ['programming', 'Entrepreneur', 'startups'] },
    { title: "The real reason companies struggle with {X}", tags: ['industry', 'analysis'], subreddits: ['programming', 'Entrepreneur', 'SaaS'] },
    { title: "What I learned consulting for {X} companies on {Y}", tags: ['consulting', 'insights'], subreddits: ['Entrepreneur', 'startups', 'programming'] },
    { title: "The hidden costs of {X} that nobody talks about", tags: ['industry', 'analysis'], subreddits: ['programming', 'SaaS', 'Entrepreneur'] },
    { title: "Why enterprises are moving away from {X} (and what they're using instead)", tags: ['industry', 'trends'], subreddits: ['programming', 'devops', 'SaaS'] },
  ],
  production_comparisons: [
    { title: "After running {X} and {Y} in production for a year - honest comparison", tags: ['comparison', 'production'], subreddits: ['programming', 'webdev', 'selfhosted'] },
    { title: "Why we migrated from {X} to {Y} after 2 years", tags: ['comparison', 'migration'], subreddits: ['programming', 'devops', 'webdev'] },
    { title: "The performance difference between {X} and {Y} in real workloads", tags: ['comparison', 'performance'], subreddits: ['programming', 'webdev', 'node'] },
    { title: "{X} vs {Y} for {Z} workloads - what the benchmarks don't show", tags: ['comparison', 'production'], subreddits: ['programming', 'devops', 'webdev'] },
  ],
};

// Get all subreddits for engagement
export function getEngagementSubreddits() {
  return Object.keys(ENGAGEMENT_SUBREDDITS);
}

// Get related subreddits for a given subreddit
export function getRelatedSubreddits(subreddit) {
  return ENGAGEMENT_SUBREDDITS[subreddit] || [];
}

// Get post ideas for a category or all categories
export function getPostIdeas(category = null) {
  if (category) {
    return ENGAGEMENT_TEMPLATES[category] || [];
  }
  // Return all ideas flattened
  return Object.values(ENGAGEMENT_TEMPLATES).flat();
}

// Get category names
export function getEngagementCategories() {
  return Object.keys(ENGAGEMENT_TEMPLATES);
}

// Get a random subreddit from the engagement list
export function getRandomEngagementSubreddit() {
  const subreddits = Object.keys(ENGAGEMENT_SUBREDDITS);
  return subreddits[Math.floor(Math.random() * subreddits.length)];
}

// Filter post ideas by subreddit compatibility
export function getIdeasForSubreddit(subreddit) {
  const allIdeas = Object.entries(ENGAGEMENT_TEMPLATES).flatMap(([category, ideas]) =>
    ideas.filter(idea => idea.subreddits.includes(subreddit)).map(idea => ({ ...idea, category }))
  );
  return allIdeas;
}

// ============= PROSPECTS (Outreach) =============

// ============= PROSPECT SEARCHES =============
// FOCUSED: Only actual hiring/job posts, not general discussions

const PROSPECT_SEARCHES = [
  // ============= DIRECT HIRING SUBREDDITS (GOLD) =============
  // These are subreddits specifically for hiring
  { subreddit: 'forhire', query: '[Hiring]', source: 'reddit' },
  { subreddit: 'slavelabour', query: '[TASK]', source: 'reddit' },
  { subreddit: 'jobbit', query: '[Hiring]', source: 'reddit' },
  { subreddit: 'Jobs4Bitcoins', query: '[Hiring]', source: 'reddit' },
  { subreddit: 'remotejs', query: 'hiring', source: 'reddit' },
  { subreddit: 'remotepython', query: 'hiring', source: 'reddit' },
  { subreddit: 'freelance_forhire', query: 'hiring OR [Hiring]', source: 'reddit' },
  { subreddit: 'hiring', query: 'developer OR engineer OR python OR javascript', source: 'reddit' },

  // ============= EXPLICIT HIRING LANGUAGE =============
  // Searches with very specific "looking to hire" language
  { subreddit: 'Entrepreneur', query: 'looking to hire developer', source: 'reddit' },
  { subreddit: 'Entrepreneur', query: 'need a developer', source: 'reddit' },
  { subreddit: 'startups', query: 'hiring developer OR hiring engineer', source: 'reddit' },
  { subreddit: 'startups', query: 'looking for technical cofounder', source: 'reddit' },
  { subreddit: 'smallbusiness', query: 'looking to hire developer', source: 'reddit' },
  { subreddit: 'smallbusiness', query: 'need someone to build', source: 'reddit' },
  { subreddit: 'SaaS', query: 'hiring developer OR looking for developer', source: 'reddit' },
  { subreddit: 'indiehackers', query: 'looking for cofounder OR hiring developer', source: 'reddit' },

  // ============= FREELANCE-SPECIFIC =============
  { subreddit: 'freelance', query: '[Hiring] OR looking for freelancer', source: 'reddit' },
  { subreddit: 'remotework', query: 'hiring OR looking for developer', source: 'reddit' },
  { subreddit: 'WorkOnline', query: '[Hiring] OR need developer', source: 'reddit' },

  // ============= AUTOMATION/INTEGRATION PROJECTS =============
  // People explicitly asking for help building something
  { subreddit: 'Salesforce', query: 'hire freelancer OR looking for developer', source: 'reddit' },
  { subreddit: 'hubspot', query: 'hire developer OR need integration', source: 'reddit' },
  { subreddit: 'zapier', query: 'hire developer OR need custom', source: 'reddit' },
  { subreddit: 'n8n', query: 'hire OR pay someone', source: 'reddit' },
  { subreddit: 'shopify', query: 'hire developer OR looking for developer', source: 'reddit' },
  { subreddit: 'Airtable', query: 'hire developer OR pay someone', source: 'reddit' },
];

// Check if post is from a competitor offering services
function isCompetitor(title) {
  const lower = title.toLowerCase();
  const patterns = [
    '[for hire]', '[offer]', 'for hire',
    'i will build', 'i will create', 'i will scrape',
    'my services', 'hire me', 'available for',
    'looking for clients', 'seeking clients'
  ];
  return patterns.some(p => lower.includes(p));
}

// Score a prospect
function scoreProspect(post) {
  if (isCompetitor(post.title)) return 0;

  let score = 0;
  const title = post.title.toLowerCase();
  const text = (post.selftext || '').toLowerCase();
  const combined = title + ' ' + text;

  // [HIRING] or [TASK] tags are gold
  if (title.includes('[hiring]') || title.includes('[task]')) score += 30;

  // HIGHEST value - explicit hiring intent
  const goldKeywords = [
    'looking for developer', 'need developer', 'need a developer', 'hire developer',
    'looking for freelancer', 'need freelancer', 'hire freelancer',
    'looking for contractor', 'need contractor',
    'technical cofounder', 'tech cofounder', 'tech partner',
    'looking for programmer', 'need programmer',
  ];
  goldKeywords.forEach(kw => { if (combined.includes(kw)) score += 15; });

  // High-value - pain points and automation needs
  const highValue = [
    'spreadsheet', 'automation', 'automate', 'manual data', 'manual entry',
    'tedious', 'repetitive', 'time consuming', 'hours per week',
    'csv', 'excel', 'integration', 'api', 'webhook', 'script',
    'non-technical', 'non technical', 'bottleneck', 'broken process',
    'copy paste', 'data entry', 'sync data', 'sync inventory',
    'scrape', 'scraping', 'data extraction',
  ];
  highValue.forEach(kw => { if (combined.includes(kw)) score += 10; });

  // Medium-value - general development needs
  const midValue = [
    'software', 'app', 'tool', 'help', 'build', 'create',
    'cofounder', 'technical', 'programmer', 'developer',
    'mvp', 'prototype', 'custom', 'limitations', 'workaround',
    'outsource', 'virtual assistant', 'freelance',
  ];
  midValue.forEach(kw => { if (combined.includes(kw)) score += 5; });

  // Tool-specific keywords (people hitting limits)
  const toolPainPoints = [
    'zapier', 'make.com', 'integromat', 'n8n', 'bubble', 'webflow',
    'nocode', 'no-code', 'lowcode', 'low-code', 'airtable', 'notion',
  ];
  toolPainPoints.forEach(kw => { if (combined.includes(kw)) score += 3; });

  // Engagement signals
  if (post.num_comments > 10) score += 5;
  if (post.score > 20) score += 5;

  // Recency bonus
  const ageHours = (Date.now() / 1000 - post.created_utc) / 3600;
  if (ageHours <= 24) score += 10;
  else if (ageHours <= 72) score += 5;

  return score;
}

// Search a subreddit
async function searchSubreddit(subreddit, query) {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=new&t=week&limit=15`;
    let data = null;

    // Method 1: Try direct fetch
    try {
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (response.ok) {
        data = await response.json();
      }
    } catch (e) {
      // Direct fetch failed, try proxy
    }

    // Method 2: Try corsproxy.io
    if (!data) {
      try {
        const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const response = await fetch(corsProxyUrl, { headers: { 'Accept': 'application/json' } });
        if (response.ok) {
          data = await response.json();
        }
      } catch (e) {
        // corsproxy failed
      }
    }

    // Method 3: Try allorigins.win
    if (!data) {
      try {
        const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(allOriginsUrl);
        if (response.ok) {
          data = await response.json();
        }
      } catch (e) {
        // allorigins failed
      }
    }

    if (!data) return [];

    const posts = [];

    for (const child of data?.data?.children || []) {
      const post = child.data;
      if (!post.is_self) continue; // Skip link posts

      const prospectScore = scoreProspect(post);
      if (prospectScore === 0) continue; // Skip competitors

      posts.push({
        id: post.id,
        source: 'reddit',
        subreddit: subreddit,
        title: post.title,
        body: post.selftext?.slice(0, 2000) || null,
        url: `https://reddit.com${post.permalink}`,
        author: post.author || '[deleted]',
        score: post.score,
        num_comments: post.num_comments,
        created_utc: post.created_utc,
        prospect_score: prospectScore,
        query: query,
        is_hiring: post.title.toLowerCase().includes('[hiring]'),
      });
    }
    return posts;
  } catch (err) {
    console.error(`Error searching r/${subreddit}:`, err);
    return [];
  }
}

// Fetch prospects from all searches
export async function fetchProspects(onProgress = null, onPartialResults = null, startFromIndex = 0) {
  const allProspects = [];
  const seenIds = new Set();
  const redditTotal = PROSPECT_SEARCHES.length;
  const total = redditTotal + 2; // +2 for HN Who's Hiring and HN Freelancer

  // First, fetch Reddit sources
  for (let i = startFromIndex; i < redditTotal; i++) {
    const { subreddit, query } = PROSPECT_SEARCHES[i];
    if (onProgress) onProgress(i + 1, total, `r/${subreddit}: ${query}`);

    const posts = await searchSubreddit(subreddit, query);

    for (const post of posts) {
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id);
        allProspects.push(post);
      }
    }

    // Save partial results after each search
    if (onPartialResults) {
      const sorted = [...allProspects].sort((a, b) => b.prospect_score - a.prospect_score);
      onPartialResults(sorted, i + 1);
    }

    // Delay between requests
    await new Promise(r => setTimeout(r, 400));
  }

  // Then fetch Hacker News sources (only if not resuming from middle of Reddit)
  if (startFromIndex <= redditTotal) {
    // HN Who is Hiring
    if (onProgress) onProgress(redditTotal + 1, total, 'Hacker News: Who is hiring?');
    try {
      const hnPosts = await fetchHNWhoIsHiring();
      for (const post of hnPosts) {
        if (!seenIds.has(post.id)) {
          seenIds.add(post.id);
          allProspects.push(post);
        }
      }
      if (onPartialResults) {
        const sorted = [...allProspects].sort((a, b) => b.prospect_score - a.prospect_score);
        onPartialResults(sorted, redditTotal + 1);
      }
    } catch (err) {
      console.error('Error in HN Who is hiring:', err);
    }

    await new Promise(r => setTimeout(r, 400));

    // HN Freelancer thread
    if (onProgress) onProgress(redditTotal + 2, total, 'Hacker News: Freelancer thread');
    try {
      const hnFreelancePosts = await fetchHNFreelancer();
      for (const post of hnFreelancePosts) {
        if (!seenIds.has(post.id)) {
          seenIds.add(post.id);
          allProspects.push(post);
        }
      }
      if (onPartialResults) {
        const sorted = [...allProspects].sort((a, b) => b.prospect_score - a.prospect_score);
        onPartialResults(sorted, redditTotal + 2);
      }
    } catch (err) {
      console.error('Error in HN Freelancer:', err);
    }
  }

  // Sort by prospect score
  allProspects.sort((a, b) => b.prospect_score - a.prospect_score);
  return allProspects;
}

// Get total number of prospect searches (for resume calculation)
export function getProspectSearchCount() {
  return PROSPECT_SEARCHES.length + 2; // +2 for HN Who's Hiring and HN Freelancer
}

// ============= NON-REDDIT SOURCES =============

// Fetch Hacker News "Who is hiring?" monthly thread
async function fetchHNWhoIsHiring() {
  const posts = [];
  try {
    // Search for the latest "Ask HN: Who is hiring?" thread
    const searchUrl = 'https://hn.algolia.com/api/v1/search_by_date?query=Ask%20HN:%20Who%20is%20hiring&tags=story&hitsPerPage=1';
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.hits || searchData.hits.length === 0) return [];

    const threadId = searchData.hits[0].objectID;
    const threadTitle = searchData.hits[0].title;
    const threadUrl = `https://news.ycombinator.com/item?id=${threadId}`;

    // Fetch comments from the thread (top-level only = job listings)
    const commentsUrl = `https://hn.algolia.com/api/v1/items/${threadId}`;
    const commentsRes = await fetch(commentsUrl);
    const commentsData = await commentsRes.json();

    if (!commentsData.children) return [];

    // Filter for relevant keywords (automation, integration, freelance-friendly)
    const relevantKeywords = [
      'python', 'javascript', 'typescript', 'react', 'node', 'api', 'integration',
      'automation', 'fullstack', 'full stack', 'backend', 'remote', 'contract',
      'freelance', 'part-time', 'part time', 'consultant', 'contractor'
    ];

    for (const comment of commentsData.children.slice(0, 50)) {
      if (!comment.text) continue;

      const textLower = comment.text.toLowerCase();
      const hasRelevant = relevantKeywords.some(kw => textLower.includes(kw));
      const hasRemote = textLower.includes('remote') || textLower.includes('onsite');

      if (hasRelevant || hasRemote) {
        // Score based on keywords
        let score = 10;
        if (textLower.includes('remote')) score += 15;
        if (textLower.includes('contract') || textLower.includes('freelance')) score += 20;
        if (textLower.includes('part-time') || textLower.includes('part time')) score += 15;
        relevantKeywords.forEach(kw => { if (textLower.includes(kw)) score += 3; });

        posts.push({
          id: `hn-${comment.id}`,
          source: 'hackernews',
          subreddit: 'Hacker News', // For display
          title: comment.text.slice(0, 120) + (comment.text.length > 120 ? '...' : ''),
          body: comment.text,
          url: `https://news.ycombinator.com/item?id=${comment.id}`,
          author: comment.author || 'unknown',
          score: 0,
          num_comments: 0,
          created_utc: comment.created_at_i || Date.now() / 1000,
          prospect_score: score,
          query: 'Who is hiring?',
          is_hiring: true,
          thread_title: threadTitle,
          thread_url: threadUrl,
        });
      }
    }
    return posts;
  } catch (err) {
    console.error('Error fetching HN Who is hiring:', err);
    return [];
  }
}

// Fetch Hacker News "Freelancer? Seeking freelancer?" thread
async function fetchHNFreelancer() {
  const posts = [];
  try {
    // Search for "Freelancer? Seeking freelancer?" threads
    const searchUrl = 'https://hn.algolia.com/api/v1/search_by_date?query=Ask%20HN:%20Freelancer&tags=story&hitsPerPage=1';
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.hits || searchData.hits.length === 0) return [];

    const threadId = searchData.hits[0].objectID;
    const threadTitle = searchData.hits[0].title;
    const threadUrl = `https://news.ycombinator.com/item?id=${threadId}`;

    const commentsUrl = `https://hn.algolia.com/api/v1/items/${threadId}`;
    const commentsRes = await fetch(commentsUrl);
    const commentsData = await commentsRes.json();

    if (!commentsData.children) return [];

    // Look for "Seeking freelancer" comments (people hiring)
    for (const comment of commentsData.children.slice(0, 50)) {
      if (!comment.text) continue;

      const textLower = comment.text.toLowerCase();
      // Only include posts SEEKING freelancers (not freelancers offering)
      const isSeeking = textLower.includes('seeking') || textLower.includes('looking for') ||
                       textLower.includes('need') || textLower.includes('hiring');
      const isOffering = textLower.includes('available') || textLower.includes('for hire') ||
                        textLower.includes('my rate') || textLower.includes('my skills');

      if (isSeeking && !isOffering) {
        let score = 25; // Freelancer thread posts are high value
        if (textLower.includes('python')) score += 10;
        if (textLower.includes('javascript') || textLower.includes('react')) score += 10;
        if (textLower.includes('automation') || textLower.includes('integration')) score += 15;

        posts.push({
          id: `hn-freelance-${comment.id}`,
          source: 'hackernews',
          subreddit: 'Hacker News',
          title: comment.text.slice(0, 120) + (comment.text.length > 120 ? '...' : ''),
          body: comment.text,
          url: `https://news.ycombinator.com/item?id=${comment.id}`,
          author: comment.author || 'unknown',
          score: 0,
          num_comments: 0,
          created_utc: comment.created_at_i || Date.now() / 1000,
          prospect_score: score,
          query: 'Freelancer thread',
          is_hiring: true,
          thread_title: threadTitle,
          thread_url: threadUrl,
        });
      }
    }
    return posts;
  } catch (err) {
    console.error('Error fetching HN Freelancer thread:', err);
    return [];
  }
}

