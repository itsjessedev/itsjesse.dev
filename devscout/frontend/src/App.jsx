import React, { useState, useEffect, useCallback } from 'react';
import { fetchPosts, fetchStats, fetchFromReddit, submitPosts, generateResponse, updatePost, fetchGitHubIssues, formatIssueForClaude } from './services/api';

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #333',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#fff',
  },
  stats: {
    display: 'flex',
    gap: '24px',
  },
  stat: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#4ade80',
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
  },
  controls: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  btn: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  btnPrimary: {
    background: '#3b82f6',
    color: '#fff',
  },
  btnSecondary: {
    background: '#333',
    color: '#e0e0e0',
  },
  btnSuccess: {
    background: '#22c55e',
    color: '#fff',
  },
  btnDanger: {
    background: '#ef4444',
    color: '#fff',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    background: '#1a1a1a',
    padding: '4px',
    borderRadius: '8px',
    width: 'fit-content',
  },
  tab: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
    color: '#888',
    fontWeight: '500',
  },
  tabActive: {
    background: '#333',
    color: '#fff',
  },
  postList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  post: {
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #333',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  subreddit: {
    display: 'inline-block',
    background: '#333',
    color: '#4ade80',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  score: {
    background: '#2563eb',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  postTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '8px',
  },
  postLink: {
    color: '#3b82f6',
    textDecoration: 'none',
  },
  postMeta: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '12px',
  },
  postBody: {
    fontSize: '14px',
    color: '#aaa',
    background: '#0f0f0f',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    maxHeight: '200px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
  },
  keywords: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  keyword: {
    background: '#3b82f620',
    color: '#60a5fa',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  responseSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #333',
  },
  responseLabel: {
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  response: {
    background: '#0f0f0f',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#e0e0e0',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.6',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  copyBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    background: '#22c55e',
    color: '#fff',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '60px',
    color: '#666',
  },
  modeToggle: {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    background: '#0f0f0f',
    padding: '4px',
    borderRadius: '8px',
    width: 'fit-content',
  },
  modeBtn: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
    color: '#888',
    fontWeight: '600',
    fontSize: '14px',
  },
  modeBtnActive: {
    background: '#3b82f6',
    color: '#fff',
  },
  issueLabels: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  issueLabel: {
    background: '#8b5cf620',
    color: '#a78bfa',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  repoLink: {
    color: '#4ade80',
    textDecoration: 'none',
    fontSize: '13px',
  },
  btnClaude: {
    background: '#d97706',
    color: '#fff',
  },
};

function App() {
  const [mode, setMode] = useState('posts'); // 'posts' or 'github'
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('new');
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(null);
  const [generating, setGenerating] = useState({});
  const [copied, setCopied] = useState({});
  const [githubIssues, setGithubIssues] = useState([]);
  const [githubFetching, setGithubFetching] = useState(false);
  const [githubProgress, setGithubProgress] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [postsData, statsData] = await Promise.all([
        fetchPosts(filter === 'all' ? null : filter),
        fetchStats(),
      ]);
      setPosts(postsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFetch = async () => {
    setFetching(true);
    setFetchProgress({ current: 0, total: 0, subreddit: 'Starting...' });
    try {
      // Fetch from Reddit directly (browser-side)
      const redditPosts = await fetchFromReddit((current, total, subreddit) => {
        setFetchProgress({ current, total, subreddit });
      });

      if (redditPosts.length === 0) {
        alert('No matching posts found');
        return;
      }

      setFetchProgress({ current: 0, total: 0, subreddit: 'Submitting to server...' });

      // Submit to backend
      const result = await submitPosts(redditPosts);
      alert(`Found ${redditPosts.length} posts, added ${result.added} new`);
      loadData();
    } catch (err) {
      alert('Failed to fetch: ' + err.message);
    } finally {
      setFetching(false);
      setFetchProgress(null);
    }
  };

  const handleGenerate = async (postId) => {
    setGenerating((prev) => ({ ...prev, [postId]: true }));
    try {
      const result = await generateResponse(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, suggested_response: result.response } : p
        )
      );
    } catch (err) {
      alert('Failed to generate: ' + err.message);
    } finally {
      setGenerating((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleCopy = async (postId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied((prev) => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [postId]: false }));
      }, 2000);
    } catch (err) {
      alert('Failed to copy');
    }
  };

  const handleMarkResponded = async (postId) => {
    try {
      await updatePost(postId, { status: 'responded' });
      loadData();
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  const handleSkip = async (postId) => {
    try {
      await updatePost(postId, { status: 'skipped' });
      loadData();
    } catch (err) {
      alert('Failed to skip: ' + err.message);
    }
  };

  const handleFetchGitHub = async () => {
    setGithubFetching(true);
    setGithubProgress({ current: 0, total: 4, label: 'Starting...' });
    try {
      const issues = await fetchGitHubIssues((current, total, label) => {
        setGithubProgress({ current, total, label });
      });
      setGithubIssues(issues);
      if (issues.length === 0) {
        alert('No matching issues found');
      }
    } catch (err) {
      alert('Failed to fetch GitHub issues: ' + err.message);
    } finally {
      setGithubFetching(false);
      setGithubProgress(null);
    }
  };

  const handleCopyForClaude = async (issue) => {
    try {
      const text = formatIssueForClaude(issue);
      await navigator.clipboard.writeText(text);
      setCopied((prev) => ({ ...prev, [`gh_${issue.id}`]: true }));
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [`gh_${issue.id}`]: false }));
      }, 2000);
    } catch (err) {
      alert('Failed to copy');
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const parseKeywords = (keywordsStr) => {
    try {
      return JSON.parse(keywordsStr || '[]');
    } catch {
      return [];
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Scout</h1>
        {mode === 'posts' && stats && (
          <div style={styles.stats}>
            <div style={styles.stat}>
              <div style={styles.statValue}>{stats.new_posts}</div>
              <div style={styles.statLabel}>New</div>
            </div>
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#3b82f6' }}>{stats.responded_posts}</div>
              <div style={styles.statLabel}>Responded</div>
            </div>
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#666' }}>{stats.total_posts}</div>
              <div style={styles.statLabel}>Total</div>
            </div>
          </div>
        )}
        {mode === 'github' && (
          <div style={styles.stats}>
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#a78bfa' }}>{githubIssues.length}</div>
              <div style={styles.statLabel}>Issues</div>
            </div>
          </div>
        )}
      </div>

      {/* Mode Toggle */}
      <div style={styles.modeToggle}>
        <button
          style={{ ...styles.modeBtn, ...(mode === 'posts' ? styles.modeBtnActive : {}) }}
          onClick={() => setMode('posts')}
        >
          Posts
        </button>
        <button
          style={{ ...styles.modeBtn, ...(mode === 'github' ? styles.modeBtnActive : {}) }}
          onClick={() => setMode('github')}
        >
          GitHub
        </button>
      </div>

      {mode === 'posts' && (
        <>
          <div style={styles.controls}>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleFetch}
              disabled={fetching}
            >
              {fetching
                ? fetchProgress
                  ? `Scanning ${fetchProgress.subreddit} (${fetchProgress.current}/${fetchProgress.total})`
                  : 'Fetching...'
                : 'Fetch New Posts'}
            </button>
          </div>

          <div style={styles.tabs}>
            {['new', 'responded', 'skipped', 'all'].map((tab) => (
              <button
                key={tab}
                style={{ ...styles.tab, ...(filter === tab ? styles.tabActive : {}) }}
                onClick={() => setFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </>
      )}

      {mode === 'github' && (
        <div style={styles.controls}>
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={handleFetchGitHub}
            disabled={githubFetching}
          >
            {githubFetching
              ? githubProgress
                ? `Searching ${githubProgress.label} (${githubProgress.current}/${githubProgress.total})`
                : 'Fetching...'
              : 'Find Contribution Opportunities'}
          </button>
        </div>
      )}

      {/* Posts View */}
      {mode === 'posts' && (
        <div style={styles.postList}>
          {posts.length === 0 ? (
            <div style={styles.empty}>
              No posts found. Click "Fetch New Posts" to scan Reddit, HN, and Lobsters.
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} style={styles.post}>
                <div style={styles.postHeader}>
                  <span style={styles.subreddit}>{post.subreddit.startsWith('HN') || post.subreddit.startsWith('Lobsters') ? post.subreddit : `r/${post.subreddit}`}</span>
                  <span style={styles.score}>Score: {Math.round(post.relevance_score)}</span>
                </div>

                <h3 style={styles.postTitle}>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.postLink}
                  >
                    {post.title}
                  </a>
                </h3>

                <div style={styles.postMeta}>
                  u/{post.author} · {formatTime(post.created_utc)} · {post.num_comments} comments · {post.score} upvotes
                </div>

                {post.body && (
                  <div style={styles.postBody}>{post.body}</div>
                )}

                <div style={styles.keywords}>
                  {parseKeywords(post.keywords_matched).map((kw, i) => (
                    <span key={i} style={styles.keyword}>{kw}</span>
                  ))}
                </div>

                {post.suggested_response ? (
                  <div style={styles.responseSection}>
                    <div style={styles.responseLabel}>Suggested Response</div>
                    <div style={styles.response}>{post.suggested_response}</div>
                    <div style={styles.actions}>
                      <button
                        style={styles.copyBtn}
                        onClick={() => handleCopy(post.id, post.suggested_response)}
                      >
                        {copied[post.id] ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        style={{ ...styles.btn, ...styles.btnSuccess }}
                        onClick={() => handleMarkResponded(post.id)}
                      >
                        Mark Responded
                      </button>
                      <button
                        style={{ ...styles.btn, ...styles.btnSecondary }}
                        onClick={() => handleGenerate(post.id)}
                        disabled={generating[post.id]}
                      >
                        {generating[post.id] ? 'Regenerating...' : 'Regenerate'}
                      </button>
                      <button
                        style={{ ...styles.btn, ...styles.btnSecondary }}
                        onClick={() => handleSkip(post.id)}
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.actions}>
                    <button
                      style={{ ...styles.btn, ...styles.btnPrimary }}
                      onClick={() => handleGenerate(post.id)}
                      disabled={generating[post.id]}
                    >
                      {generating[post.id] ? 'Generating...' : 'Generate Response'}
                    </button>
                    <button
                      style={{ ...styles.btn, ...styles.btnSecondary }}
                      onClick={() => handleSkip(post.id)}
                    >
                      Skip
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* GitHub View */}
      {mode === 'github' && (
        <div style={styles.postList}>
          {githubIssues.length === 0 ? (
            <div style={styles.empty}>
              No issues loaded. Click "Find Contribution Opportunities" to search GitHub.
            </div>
          ) : (
            githubIssues.map((issue) => (
              <div key={issue.id} style={styles.post}>
                <div style={styles.postHeader}>
                  <a
                    href={issue.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.repoLink}
                  >
                    {issue.repo}
                  </a>
                  <span style={styles.score}>Score: {Math.round(issue.relevance_score)}</span>
                </div>

                <h3 style={styles.postTitle}>
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.postLink}
                  >
                    #{issue.number}: {issue.title}
                  </a>
                </h3>

                <div style={styles.postMeta}>
                  by {issue.author} · {formatTime(issue.created_at)} · {issue.comments} comments
                </div>

                <div style={styles.issueLabels}>
                  {issue.labels.map((label, i) => (
                    <span key={i} style={styles.issueLabel}>{label}</span>
                  ))}
                </div>

                {issue.body && (
                  <div style={styles.postBody}>{issue.body}</div>
                )}

                <div style={styles.actions}>
                  <button
                    style={{ ...styles.btn, ...styles.btnClaude }}
                    onClick={() => handleCopyForClaude(issue)}
                  >
                    {copied[`gh_${issue.id}`] ? 'Copied!' : 'Copy for Claude'}
                  </button>
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...styles.btn, ...styles.btnSecondary, textDecoration: 'none', display: 'inline-block' }}
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;
