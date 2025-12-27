import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPosts, fetchStats, fetchFromReddit, fetchNews, submitPosts, generateResponse, generateReplyResponse, generateEngagePost, generateNewsResponse, updatePost, fetchGitHubIssues, formatIssueForClaude, fetchProspects, getProspectSearchCount, clearStalePosts, scrapeTrackedPostsForReplies, scrapePostForUserComments, getEngagementSubreddits, getRelatedSubreddits, getIdeasForSubreddit, getPostIdeas, getEngagementCategories, getRandomEngagementSubreddit, ENGAGEMENT_TEMPLATES } from './services/api';

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
    transition: 'all 0.2s ease',
  },
  btnPrimary: {
    background: '#3b82f6',
    color: '#fff',
  },
  btnSecondary: {
    background: '#4b5563',
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
  btnReddit: {
    background: '#ff4500',
    color: '#fff',
  },
  btnRegenerate: {
    background: '#8b5cf6',
    color: '#fff',
  },
  btnSkip: {
    background: '#6b7280',
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
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '500',
    lineHeight: '1',
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
  // Collapsible UI for Replies tab
  collapsibleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '16px',
    background: '#1a1a1a',
    borderRadius: '12px',
    border: '1px solid #333',
    transition: 'all 0.2s',
  },
  collapsibleHeaderExpanded: {
    borderRadius: '12px 12px 0 0',
    borderBottom: 'none',
  },
  collapsibleContent: {
    background: '#141414',
    borderRadius: '0 0 12px 12px',
    border: '1px solid #333',
    borderTop: 'none',
    padding: '16px',
    animation: 'slideDown 0.2s ease-out',
  },
  expandIcon: {
    width: '24px',
    height: '24px',
    transition: 'transform 0.2s',
    color: '#666',
  },
  needsAttention: {
    boxShadow: '0 0 0 2px #ef4444',
    animation: 'pulse 2s infinite',
  },
  unrepliedBadge: {
    background: '#ef4444',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: '8px',
    animation: 'glow 1.5s ease-in-out infinite alternate',
  },
  myComment: {
    background: '#1a2e1a',
    border: '1px solid #22c55e40',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  myCommentLabel: {
    fontSize: '11px',
    color: '#22c55e',
    textTransform: 'uppercase',
    marginBottom: '6px',
    fontWeight: '600',
  },
  replyItem: {
    background: '#0f0f0f',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '8px',
    marginLeft: '20px',
    borderLeft: '3px solid #3b82f6',
  },
  unrepliedReply: {
    borderLeft: '3px solid #ef4444',
    animation: 'fadeIn 0.5s ease-out',
  },
  repliedReply: {
    borderLeft: '3px solid #22c55e',
    opacity: 0.7,
  },
  postBodyFull: {
    fontSize: '14px',
    color: '#ccc',
    background: '#0f0f0f',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.6',
  },
  generateReplyBtn: {
    background: '#8b5cf6',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
  pollingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#666',
  },
  pulsingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulse 1.5s infinite',
  },
  globalNotification: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: '#ef4444',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)',
    animation: 'glow 1.5s ease-in-out infinite alternate, fadeIn 0.3s ease-out',
    zIndex: 1000,
    fontSize: '14px',
    fontWeight: '600',
  },
  notificationDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#fff',
    animation: 'pulse 1s infinite',
  },
  // Engage tab styles
  engageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  engageHeader: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  subredditSelect: {
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '14px',
    minWidth: '200px',
  },
  categoryTabs: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  categoryTab: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    background: '#1a1a1a',
    color: '#888',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  categoryTabActive: {
    background: '#3b82f6',
    color: '#fff',
  },
  ideaCard: {
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #333',
    marginBottom: '12px',
  },
  ideaTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '12px',
    lineHeight: '1.4',
  },
  ideaTags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  ideaTag: {
    background: '#3b82f620',
    color: '#60a5fa',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
  },
  ideaSubreddits: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '12px',
  },
  relatedSubreddits: {
    background: '#0f0f0f',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  relatedLabel: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  relatedList: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  relatedChip: {
    background: '#22c55e20',
    color: '#22c55e',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    cursor: 'pointer',
  },
};

// CSS Keyframes (inject once)
const injectStyles = () => {
  if (document.getElementById('devscout-animations')) return;
  const style = document.createElement('style');
  style.id = 'devscout-animations';
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes glow {
      from { box-shadow: 0 0 5px #ef4444; }
      to { box-shadow: 0 0 15px #ef4444; }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideDown {
      from { opacity: 0; max-height: 0; }
      to { opacity: 1; max-height: 2000px; }
    }
    /* Button hover effects */
    button, a.btn-hover {
      transition: all 0.2s ease !important;
    }
    button:hover:not(:disabled), a.btn-hover:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      filter: brightness(1.1);
    }
    button:active:not(:disabled), a.btn-hover:active {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    /* Specific button hover colors */
    button[data-btn="primary"]:hover:not(:disabled) {
      background: #2563eb !important;
    }
    button[data-btn="reddit"]:hover:not(:disabled) {
      background: #e03d00 !important;
    }
    button[data-btn="regenerate"]:hover:not(:disabled) {
      background: #7c3aed !important;
    }
    button[data-btn="skip"]:hover:not(:disabled) {
      background: #4b5563 !important;
    }
    button[data-btn="success"]:hover:not(:disabled) {
      background: #16a34a !important;
    }
    button[data-btn="secondary"]:hover:not(:disabled) {
      background: #374151 !important;
    }
    button[data-btn="danger"]:hover:not(:disabled) {
      background: #dc2626 !important;
    }

    /* ============= MOBILE RESPONSIVE STYLES ============= */

    /* Viewport meta - ensure proper scaling */
    @viewport {
      width: device-width;
      initial-scale: 1;
    }

    /* Mobile-first responsive design */
    @media (max-width: 768px) {
      /* Container */
      .devscout-container {
        padding: 12px !important;
      }

      /* Header - stack vertically */
      .devscout-header {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 12px !important;
      }

      .devscout-title {
        font-size: 20px !important;
      }

      .devscout-stats {
        gap: 16px !important;
        width: 100% !important;
        justify-content: flex-start !important;
      }

      .devscout-stat-value {
        font-size: 20px !important;
      }

      /* Mode toggle - horizontal scroll */
      .devscout-mode-toggle {
        width: 100% !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        scrollbar-width: none !important;
        padding-bottom: 4px !important;
      }

      .devscout-mode-toggle::-webkit-scrollbar {
        display: none !important;
      }

      .devscout-mode-btn {
        padding: 8px 12px !important;
        font-size: 13px !important;
        white-space: nowrap !important;
        flex-shrink: 0 !important;
      }

      /* Controls - wrap and full width buttons */
      .devscout-controls {
        flex-wrap: wrap !important;
        gap: 8px !important;
      }

      .devscout-controls button {
        flex: 1 1 auto !important;
        min-width: 120px !important;
        padding: 12px 16px !important;
        font-size: 14px !important;
      }

      /* Post cards */
      .devscout-post {
        padding: 14px !important;
        border-radius: 10px !important;
      }

      .devscout-post-header {
        flex-wrap: wrap !important;
        gap: 8px !important;
      }

      .devscout-post-title {
        font-size: 15px !important;
        line-height: 1.4 !important;
      }

      .devscout-post-body {
        font-size: 13px !important;
        padding: 10px !important;
        max-height: 150px !important;
      }

      .devscout-post-meta {
        font-size: 12px !important;
      }

      /* Actions - stack or wrap */
      .devscout-actions {
        flex-wrap: wrap !important;
        gap: 8px !important;
      }

      .devscout-actions button {
        flex: 1 1 auto !important;
        min-width: 100px !important;
        padding: 10px 12px !important;
        font-size: 13px !important;
      }

      /* Response textarea */
      .devscout-response-textarea {
        font-size: 14px !important;
        min-height: 120px !important;
      }

      /* Keywords */
      .devscout-keywords {
        gap: 4px !important;
      }

      .devscout-keyword {
        font-size: 11px !important;
        padding: 2px 6px !important;
      }

      /* Badges */
      .devscout-subreddit,
      .devscout-score {
        font-size: 11px !important;
        padding: 3px 8px !important;
      }

      /* Collapsible headers */
      .devscout-collapsible-header {
        padding: 12px !important;
      }

      .devscout-collapsible-content {
        padding: 12px !important;
      }

      /* Reply cards */
      .devscout-reply-card {
        padding: 10px !important;
        margin-left: 8px !important;
      }

      /* Input fields */
      .devscout-input {
        font-size: 16px !important; /* Prevents iOS zoom */
        padding: 12px !important;
      }

      /* Select dropdowns */
      .devscout-select {
        font-size: 16px !important;
        padding: 12px !important;
      }

      /* Engage tab specific */
      .devscout-engage-controls {
        flex-direction: column !important;
        gap: 8px !important;
      }

      .devscout-engage-controls select {
        width: 100% !important;
      }

      /* Empty state */
      .devscout-empty {
        padding: 40px 20px !important;
        font-size: 14px !important;
      }

      /* Notification badge */
      .devscout-notification-badge {
        font-size: 10px !important;
        min-width: 16px !important;
        height: 16px !important;
        top: -6px !important;
        right: -6px !important;
      }

      /* Custom URL input row */
      .devscout-url-input-row {
        flex-direction: column !important;
        gap: 8px !important;
      }

      .devscout-url-input-row input {
        width: 100% !important;
      }

      .devscout-url-input-row button {
        width: 100% !important;
      }

      /* Filter tabs */
      .devscout-filter-tabs {
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        padding-bottom: 4px !important;
      }

      .devscout-filter-tabs::-webkit-scrollbar {
        display: none !important;
      }

      .devscout-filter-tab {
        padding: 6px 12px !important;
        font-size: 13px !important;
        white-space: nowrap !important;
      }

      /* Idea cards in Engage */
      .devscout-idea-card {
        padding: 12px !important;
      }

      .devscout-idea-title {
        font-size: 14px !important;
      }

      /* Thread structure in Replies */
      .devscout-thread {
        margin-left: 0 !important;
        padding-left: 8px !important;
        border-left-width: 2px !important;
      }

      /* Disable hover effects on touch */
      @media (hover: none) {
        button:hover:not(:disabled), a.btn-hover:hover {
          transform: none !important;
          box-shadow: none !important;
          filter: none !important;
        }
      }
    }

    /* Extra small devices */
    @media (max-width: 380px) {
      .devscout-container {
        padding: 8px !important;
      }

      .devscout-mode-btn {
        padding: 6px 10px !important;
        font-size: 12px !important;
      }

      .devscout-post {
        padding: 12px !important;
      }

      .devscout-actions button {
        padding: 8px 10px !important;
        font-size: 12px !important;
        min-width: 80px !important;
      }

      .devscout-controls button {
        min-width: 100px !important;
        padding: 10px 12px !important;
        font-size: 13px !important;
      }
    }
  `;
  document.head.appendChild(style);
};

function App() {
  const [mode, setMode] = useState('engage'); // 'engage', 'posts', 'news', 'github', 'prospects', 'replies'
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
  // Load persisted data from localStorage
  const loadPersistedData = (key, defaultValue = []) => {
    try {
      const stored = localStorage.getItem(`devscout_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  };
  const savePersistedData = (key, data) => {
    try {
      localStorage.setItem(`devscout_${key}`, JSON.stringify(data));
    } catch {}
  };

  const [prospects, setProspects] = useState(() => loadPersistedData('prospects'));
  const [prospectsFetching, setProspectsFetching] = useState(false);
  const [prospectsProgress, setProspectsProgress] = useState(null);
  const [news, setNews] = useState(() => loadPersistedData('news'));
  const [newsFetching, setNewsFetching] = useState(false);
  const [newsProgress, setNewsProgress] = useState(null);
  const [newsResponses, setNewsResponses] = useState({}); // newsId -> response text
  const [autoMarkStatus, setAutoMarkStatus] = useState(null); // Status message for auto-mark
  const [generatingNews, setGeneratingNews] = useState({}); // newsId -> boolean
  // Replies tab state (refactored) - with localStorage persistence
  const [respondedPosts, setRespondedPosts] = useState(() => loadPersistedData('responded_posts'));
  const [postRepliesData, setPostRepliesData] = useState(() => loadPersistedData('replies_data', {}));
  const [dismissedReplies, setDismissedReplies] = useState(() => loadPersistedData('dismissed_replies', []));
  const [repliesFetching, setRepliesFetching] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState({}); // postId -> boolean
  const [pollingActive, setPollingActive] = useState(false);
  const pollingInterval = useRef(null);
  // Engage tab state
  const [engageSubreddit, setEngageSubreddit] = useState('');
  const [engageCategory, setEngageCategory] = useState('all');
  const [generatingEngage, setGeneratingEngage] = useState({}); // ideaIdx -> boolean
  const [generatedEngagePosts, setGeneratedEngagePosts] = useState({}); // ideaIdx -> text
  // Reply generation state
  const [generatingReply, setGeneratingReply] = useState({}); // replyId -> boolean
  const [generatedReplies, setGeneratedReplies] = useState({}); // replyId -> text

  // Inject CSS animations on mount
  useEffect(() => {
    injectStyles();
  }, []);

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

  // Refs for auto-mark functionality
  const isCheckingPosts = useRef(false);

  // Load checked posts from localStorage (survives page reload)
  const getCheckedPosts = () => {
    try {
      const stored = localStorage.getItem('devscout_checked_posts');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  };
  const saveCheckedPosts = (ids) => {
    try {
      // Keep only last 200 to avoid bloat
      const arr = [...ids].slice(-200);
      localStorage.setItem('devscout_checked_posts', JSON.stringify(arr));
    } catch {}
  };

  // Auto-detect if user has commented on "new" posts and mark them as responded
  const checkPostsForUserComments = useCallback(async (postsToCheck) => {
    // Prevent concurrent runs
    if (isCheckingPosts.current) {
      console.log(`[DevScout] Auto-mark already in progress, skipping`);
      return;
    }
    isCheckingPosts.current = true;

    const checkedPosts = getCheckedPosts();
    const newPosts = postsToCheck.filter(p => p.status === 'new' && !checkedPosts.has(p.id));
    if (newPosts.length === 0) {
      console.log(`[DevScout] No unchecked new posts`);
      isCheckingPosts.current = false;
      setAutoMarkStatus(null);
      return;
    }

    console.log(`[DevScout] Checking ${newPosts.length} new posts for user comments (parallel)...`);
    setAutoMarkStatus(`Checking ${newPosts.length} posts...`);

    let markedCount = 0;
    const BATCH_SIZE = 5; // Check 5 posts in parallel

    for (let i = 0; i < newPosts.length; i += BATCH_SIZE) {
      const batch = newPosts.slice(i, i + BATCH_SIZE);
      setAutoMarkStatus(`Checking posts ${i + 1}-${Math.min(i + BATCH_SIZE, newPosts.length)}/${newPosts.length}...`);

      // Check batch in parallel
      const results = await Promise.all(batch.map(async (post) => {
        try {
          console.log(`[DevScout] Checking post ${post.id}: ${post.url}`);
          const { comments, error } = await scrapePostForUserComments(post.url);
          checkedPosts.add(post.id);

          console.log(`[DevScout] Post ${post.id} result: error=${error}, comments=${comments?.length || 0}`);

          if (!error && comments && comments.length > 0) {
            console.log(`[DevScout] ✓ Found user comment on post ${post.id}, calling updatePost...`);
            try {
              const updateResult = await updatePost(post.id, { status: 'responded' });
              console.log(`[DevScout] ✓ updatePost succeeded for ${post.id}:`, updateResult);
              return true;
            } catch (updateErr) {
              console.error(`[DevScout] ✗ updatePost FAILED for ${post.id}:`, updateErr);
              return false;
            }
          }
          return false;
        } catch (err) {
          console.error(`[DevScout] Error checking post ${post.id}:`, err);
          return false;
        }
      }));

      markedCount += results.filter(Boolean).length;
      saveCheckedPosts(checkedPosts);

      // Brief pause between batches to avoid rate limiting
      if (i + BATCH_SIZE < newPosts.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    if (markedCount > 0) {
      setAutoMarkStatus(`Marked ${markedCount} post(s) as responded!`);
      loadData();
    } else {
      setAutoMarkStatus(null);
    }

    setTimeout(() => setAutoMarkStatus(null), 3000);
    isCheckingPosts.current = false;
  }, [loadData]);

  // Check for user comments on initial load (uses localStorage to persist across reloads)
  useEffect(() => {
    if (mode !== 'posts') return;
    // Trigger check when posts change - the function handles deduplication via localStorage
    checkPostsForUserComments(posts);
  }, [posts, mode, checkPostsForUserComments]);

  // Periodic re-check for auto-marking responded (every 60s when on Posts tab)
  // This clears the localStorage cache to force re-check of all posts
  useEffect(() => {
    if (mode !== 'posts') return;

    const interval = setInterval(() => {
      const newPosts = posts.filter(p => p.status === 'new');
      if (newPosts.length > 0) {
        console.log(`[DevScout] Periodic check: clearing cache and re-checking ${newPosts.length} posts`);
        // Clear localStorage cache so all posts get re-checked
        localStorage.removeItem('devscout_checked_posts');
        checkPostsForUserComments(newPosts);
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, [mode, posts, checkPostsForUserComments]);

  const handleFetch = async () => {
    setFetching(true);
    setFetchProgress({ current: 0, total: 0, subreddit: 'Clearing old posts...' });
    try {
      // Clear non-responded posts first
      await clearStalePosts();

      // Fetch from Reddit directly (browser-side)
      const redditPosts = await fetchFromReddit((current, total, subreddit) => {
        setFetchProgress({ current, total, subreddit });
      });

      if (redditPosts.length === 0) {
        return;
      }

      setFetchProgress({ current: 0, total: 0, subreddit: 'Submitting to server...' });

      // Submit to backend
      await submitPosts(redditPosts);
      // Clear the auto-check cache so new posts get checked for user comments
      hasCheckedPosts.current.clear();
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
      // Always refresh replies immediately (for global notification and Replies tab)
      setTimeout(handleFetchReplies, 500);
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

  // Persist replies data to localStorage when it changes
  useEffect(() => {
    if (respondedPosts.length > 0) {
      savePersistedData('responded_posts', respondedPosts);
    }
  }, [respondedPosts]);

  useEffect(() => {
    if (Object.keys(postRepliesData).length > 0) {
      savePersistedData('replies_data', postRepliesData);
    }
  }, [postRepliesData]);

  useEffect(() => {
    savePersistedData('dismissed_replies', dismissedReplies);
  }, [dismissedReplies]);

  // Dismiss a reply (removes from notification count, persists across refresh)
  const handleDismissReply = (replyId) => {
    setDismissedReplies(prev => [...prev, replyId]);
  };

  // Clear all dismissed replies (e.g., when starting fresh)
  const handleClearDismissed = () => {
    setDismissedReplies([]);
  };

  // Get unreplied count excluding dismissed
  const getActiveUnrepliedCount = (comments) => {
    if (!comments) return 0;
    return comments.reduce((sum, c) => {
      const unreplied = c.replies?.filter(r => !r.hasUserReply && !dismissedReplies.includes(r.id)) || [];
      return sum + unreplied.length;
    }, 0);
  };

  const handleFetchGitHub = async () => {
    setGithubFetching(true);
    setGithubProgress({ current: 0, total: 4, label: 'Starting...' });
    try {
      const issues = await fetchGitHubIssues((current, total, label) => {
        setGithubProgress({ current, total, label });
      });
      setGithubIssues(issues);
    } catch (err) {
      console.error('Failed to fetch GitHub issues:', err);
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

  const handleDismissIssue = (issueId) => {
    setGithubIssues((prev) => prev.filter((issue) => issue.id !== issueId));
  };

  const handleFetchProspects = async (resume = false) => {
    setProspectsFetching(true);

    // Check for resume capability
    const savedProgress = loadPersistedData('prospects_progress', null);
    const startIndex = resume && savedProgress ? savedProgress.completedSearches : 0;

    if (startIndex > 0 && resume) {
      console.log(`[DevScout] Resuming prospects fetch from search ${startIndex + 1}`);
    }

    setProspectsProgress({ current: startIndex, total: getProspectSearchCount(), search: 'Starting...' });

    try {
      const prospectData = await fetchProspects(
        // Progress callback
        (current, total, search) => {
          setProspectsProgress({ current, total, search });
        },
        // Partial results callback - save incrementally
        (partialResults, completedSearches) => {
          setProspects(partialResults);
          savePersistedData('prospects', partialResults);
          savePersistedData('prospects_progress', { completedSearches, total: getProspectSearchCount() });
        },
        // Start from index (for resume)
        startIndex
      );
      setProspects(prospectData);
      savePersistedData('prospects', prospectData);
      // Clear progress on completion
      localStorage.removeItem('devscout_prospects_progress');
    } catch (err) {
      console.error('Failed to fetch prospects:', err);
    } finally {
      setProspectsFetching(false);
      setProspectsProgress(null);
    }
  };

  // Check if prospects fetch can be resumed
  const getProspectsResumeInfo = () => {
    const savedProgress = loadPersistedData('prospects_progress', null);
    if (savedProgress && savedProgress.completedSearches < savedProgress.total) {
      return savedProgress;
    }
    return null;
  };

  const handleDismissProspect = (prospectId) => {
    setProspects((prev) => {
      const updated = prev.filter((p) => p.id !== prospectId);
      savePersistedData('prospects', updated);
      return updated;
    });
  };

  const handleClearProspects = () => {
    setProspects([]);
    localStorage.removeItem('devscout_prospects');
    localStorage.removeItem('devscout_prospects_progress');
  };

  const handleFetchNews = async () => {
    setNewsFetching(true);
    setNewsProgress({ current: 0, total: 6, source: 'Starting...' });
    try {
      const newsData = await fetchNews((current, total, source) => {
        setNewsProgress({ current, total, source });
      });
      setNews(newsData);
      savePersistedData('news', newsData);
    } catch (err) {
      console.error('Failed to fetch news:', err);
    } finally {
      setNewsFetching(false);
      setNewsProgress(null);
    }
  };

  const handleClearNews = () => {
    setNews([]);
    localStorage.removeItem('devscout_news');
  };

  const handleGenerateNewsResponse = async (newsItem) => {
    const newsId = newsItem.reddit_id;
    setGeneratingNews((prev) => ({ ...prev, [newsId]: true }));
    try {
      const result = await generateNewsResponse({
        title: newsItem.title,
        body: newsItem.body,
        source: newsItem.subreddit,
      });
      setNewsResponses((prev) => ({ ...prev, [newsId]: result.response }));
    } catch (err) {
      alert('Failed to generate: ' + err.message);
    } finally {
      setGeneratingNews((prev) => ({ ...prev, [newsId]: false }));
    }
  };

  const handleDismissNews = (newsId) => {
    setNews((prev) => prev.filter((n) => n.reddit_id !== newsId));
  };

  // Ref to prevent concurrent fetches
  const repliesFetchingRef = useRef(false);

  // Fetch all responded posts and scrape for replies
  const handleFetchReplies = useCallback(async () => {
    if (repliesFetchingRef.current) {
      console.log('[DevScout] Skipping fetch - already in progress');
      return;
    }
    repliesFetchingRef.current = true;
    setRepliesFetching(true);

    console.log('[DevScout] Starting handleFetchReplies...');

    try {
      // Get responded posts from backend
      const responded = await fetchPosts('responded');
      console.log('[DevScout] Got responded posts:', responded?.length || 0);

      // Only scrape if we have posts
      if (responded && responded.length > 0) {
        // Scrape each post for user's comments and their replies
        console.log('[DevScout] Scraping posts for replies...');
        const repliesData = await scrapeTrackedPostsForReplies(responded);
        console.log('[DevScout] Scrape results:', repliesData);

        // Auto-cleanup: Remove posts where our comment was autodeleted
        // If responded > 48 hours ago AND no comments found, revert to skipped
        const staleThreshold = 48 * 60 * 60 * 1000; // 48 hours in ms
        const postsToCleanup = [];

        for (const post of responded) {
          const repliesInfo = repliesData[post.id];
          const respondedAt = post.responded_at ? new Date(post.responded_at).getTime() : 0;
          const isStale = respondedAt && (Date.now() - respondedAt) > staleThreshold;
          const hasNoComments = !repliesInfo?.comments || repliesInfo.comments.length === 0;

          if (isStale && hasNoComments) {
            console.log(`[DevScout] Auto-cleanup: Post ${post.id} marked responded ${Math.round((Date.now() - respondedAt) / 3600000)}h ago with no comments found - reverting to skipped`);
            postsToCleanup.push(post.id);
          }
        }

        // Cleanup stale posts
        for (const postId of postsToCleanup) {
          try {
            await updatePost(postId, { status: 'skipped' });
          } catch (err) {
            console.error(`[DevScout] Failed to cleanup post ${postId}:`, err);
          }
        }

        // Filter out cleaned up posts for display
        const activePosts = responded.filter(p => !postsToCleanup.includes(p.id));
        setRespondedPosts(activePosts);
        setPostRepliesData(repliesData || {});

        // Auto-expand posts with unreplied comments
        const autoExpand = {};
        for (const [postId, data] of Object.entries(repliesData || {})) {
          if (data?.totalUnreplied > 0) {
            autoExpand[postId] = true;
          }
        }
        setExpandedPosts(prev => ({ ...prev, ...autoExpand }));

        // If we cleaned up posts, reload to get fresh data
        if (postsToCleanup.length > 0) {
          console.log(`[DevScout] Cleaned up ${postsToCleanup.length} stale posts`);
        }
      } else {
        setRespondedPosts([]);
        setPostRepliesData({});
      }
    } catch (err) {
      console.error('[DevScout] Failed to fetch replies:', err);
      setRespondedPosts([]);
      setPostRepliesData({});
    } finally {
      repliesFetchingRef.current = false;
      setRepliesFetching(false);
    }
  }, []); // No dependencies - stable callback

  // Add a custom post URL (for Posts tab - adds posts scraper missed)
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [addingCustomPost, setAddingCustomPost] = useState(false);
  const handleAddCustomUrl = async () => {
    if (!customUrlInput.trim()) return;

    // Extract info from URL
    const match = customUrlInput.match(/reddit\.com\/r\/(\w+)\/comments\/(\w+)/);
    if (!match) {
      alert('Invalid Reddit post URL');
      return;
    }

    setAddingCustomPost(true);
    try {
      // Fetch post details from Reddit
      const response = await fetch(`https://www.reddit.com/comments/${match[2]}.json?limit=1`);
      if (!response.ok) throw new Error('Failed to fetch post');

      const data = await response.json();
      const postData = data[0]?.data?.children?.[0]?.data;

      if (!postData) throw new Error('Post not found');

      // Create post object matching backend schema
      const newPost = {
        reddit_id: postData.id,
        subreddit: postData.subreddit,
        title: postData.title,
        body: postData.selftext?.slice(0, 2000) || null,
        url: `https://reddit.com${postData.permalink}`,
        author: postData.author,
        score: postData.score,
        num_comments: postData.num_comments,
        created_utc: postData.created_utc,
        relevance_score: 100, // High score since user manually added
        keywords_matched: ['manual-add'],
      };

      // Submit to backend
      await submitPosts([newPost]);
      setCustomUrlInput('');

      // Reload posts to show the new one
      loadData();
    } catch (err) {
      alert('Failed to add post: ' + err.message);
    } finally {
      setAddingCustomPost(false);
    }
  };

  // Toggle post expansion
  const togglePostExpanded = (postId) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Generate a response to a reply
  const handleGenerateReply = async (replyId, subreddit, myComment, theirReply) => {
    setGeneratingReply((prev) => ({ ...prev, [replyId]: true }));
    try {
      const result = await generateReplyResponse({ subreddit, myComment, theirReply });
      setGeneratedReplies((prev) => ({ ...prev, [replyId]: result.response }));
    } catch (err) {
      alert('Failed to generate: ' + err.message);
    } finally {
      setGeneratingReply((prev) => ({ ...prev, [replyId]: false }));
    }
  };

  // Generate an engagement post
  const handleGenerateEngage = async (ideaIdx, subreddit, ideaTemplate, category) => {
    setGeneratingEngage((prev) => ({ ...prev, [ideaIdx]: true }));
    try {
      const result = await generateEngagePost({ subreddit, ideaTemplate, category });
      setGeneratedEngagePosts((prev) => ({ ...prev, [ideaIdx]: result.response }));
    } catch (err) {
      alert('Failed to generate: ' + err.message);
    } finally {
      setGeneratingEngage((prev) => ({ ...prev, [ideaIdx]: false }));
    }
  };

  // Calculate total unreplied comments across all posts
  const getTotalUnreadReplies = () => {
    // Count unreplied replies, excluding dismissed ones
    return Object.values(postRepliesData).reduce((sum, data) => {
      if (!data?.comments) return sum;
      return sum + data.comments.reduce((cSum, c) => {
        const unreplied = c.replies?.filter(r => !r.hasUserReply && !dismissedReplies.includes(r.id)) || [];
        return cSum + unreplied.length;
      }, 0);
    }, 0);
  };

  // Background polling for replies on ALL pages (for global notification)
  const backgroundPollingInterval = useRef(null);

  useEffect(() => {
    // Initial fetch for notification badge (always run on mount)
    const initialFetch = setTimeout(() => {
      handleFetchReplies();
    }, 500);

    // Background poll every 60s on non-replies pages, 30s on replies page
    const pollInterval = mode === 'replies' ? 30000 : 60000;

    if (mode === 'replies') {
      setPollingActive(true);
    }

    backgroundPollingInterval.current = setInterval(() => {
      handleFetchReplies();
    }, pollInterval);

    return () => {
      clearTimeout(initialFetch);
      if (backgroundPollingInterval.current) {
        clearInterval(backgroundPollingInterval.current);
      }
    };
  }, [mode, handleFetchReplies]);

  // Handle notification click - navigate to replies and scroll to first unreplied
  const handleNotificationClick = () => {
    setMode('replies');
    // Find first post with unreplied comments and expand it
    let firstUnrepliedId = null;
    for (const [postId, data] of Object.entries(postRepliesData)) {
      if (data?.totalUnreplied > 0) {
        setExpandedPosts(prev => ({ ...prev, [postId]: true }));
        // Find the first unreplied reply ID
        for (const comment of data.comments || []) {
          for (const reply of comment.replies || []) {
            if (!reply.hasUserReply) {
              firstUnrepliedId = reply.id;
              break;
            }
          }
          if (firstUnrepliedId) break;
        }
        break;
      }
    }

    // Scroll to the specific unreplied reply after DOM updates
    setTimeout(() => {
      const element = firstUnrepliedId
        ? document.getElementById(`unreplied-${firstUnrepliedId}`)
        : null;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a brief highlight effect
        element.style.transition = 'box-shadow 0.3s';
        element.style.boxShadow = '0 0 0 3px #ef4444';
        setTimeout(() => {
          element.style.boxShadow = '';
        }, 2000);
      }
    }, 200);
  };

  const getProspectCategory = (score) => {
    if (score >= 40) return { label: 'HOT', color: '#ef4444', bg: '#ef444420' };
    if (score >= 20) return { label: 'WARM', color: '#f59e0b', bg: '#f59e0b20' };
    return { label: 'COOL', color: '#6b7280', bg: '#6b728020' };
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
    <div style={styles.container} className="devscout-container">
      {/* Global Notification Badge - visible on all pages */}
      {getTotalUnreadReplies() > 0 && mode !== 'replies' && (
        <div
          style={styles.globalNotification}
          onClick={handleNotificationClick}
          className="devscout-notification-badge"
        >
          <div style={styles.notificationDot}></div>
          <span>{getTotalUnreadReplies()} new {getTotalUnreadReplies() === 1 ? 'reply' : 'replies'} to your comments</span>
        </div>
      )}

      <div style={styles.header} className="devscout-header">
        <h1 style={styles.title} className="devscout-title">DevScout</h1>
        {mode === 'posts' && stats && (
          <div style={styles.stats} className="devscout-stats">
            <div style={styles.stat}>
              <div style={styles.statValue} className="devscout-stat-value">{stats.new_posts}</div>
              <div style={styles.statLabel}>New</div>
            </div>
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#3b82f6' }} className="devscout-stat-value">{stats.responded_posts}</div>
              <div style={styles.statLabel}>Responded</div>
            </div>
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#666' }} className="devscout-stat-value">{stats.total_posts}</div>
              <div style={styles.statLabel}>Total</div>
            </div>
          </div>
        )}
        {mode === 'news' && (
          <div style={styles.stats} className="devscout-stats">
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#f97316' }} className="devscout-stat-value">{news.length}</div>
              <div style={styles.statLabel}>Posts</div>
            </div>
          </div>
        )}
        {mode === 'github' && (
          <div style={styles.stats} className="devscout-stats">
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#a78bfa' }} className="devscout-stat-value">{githubIssues.length}</div>
              <div style={styles.statLabel}>Issues</div>
            </div>
          </div>
        )}
        {mode === 'prospects' && (
          <div style={styles.stats} className="devscout-stats">
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#ef4444' }} className="devscout-stat-value">
                {prospects.filter(p => p.score >= 40).length}
              </div>
              <div style={styles.statLabel}>Hot</div>
            </div>
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#f59e0b' }} className="devscout-stat-value">
                {prospects.filter(p => p.score >= 20 && p.score < 40).length}
              </div>
              <div style={styles.statLabel}>Warm</div>
            </div>
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#666' }} className="devscout-stat-value">{prospects.length}</div>
              <div style={styles.statLabel}>Total</div>
            </div>
          </div>
        )}
        {mode === 'replies' && (
          <div style={styles.stats} className="devscout-stats">
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#ef4444' }} className="devscout-stat-value">{getTotalUnreadReplies()}</div>
              <div style={styles.statLabel}>Unread</div>
            </div>
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#666' }} className="devscout-stat-value">{respondedPosts.length}</div>
              <div style={styles.statLabel}>Tracked</div>
            </div>
          </div>
        )}
      </div>

      {/* Mode Toggle */}
      <div style={styles.modeToggle} className="devscout-mode-toggle">
        <button
          className="devscout-mode-btn"
          style={{ ...styles.modeBtn, ...(mode === 'engage' ? styles.modeBtnActive : {}), background: mode === 'engage' ? '#22c55e' : 'transparent' }}
          onClick={() => setMode('engage')}
        >
          Engage
        </button>
        <button
          className="devscout-mode-btn"
          style={{ ...styles.modeBtn, ...(mode === 'posts' ? styles.modeBtnActive : {}) }}
          onClick={() => setMode('posts')}
        >
          Posts
        </button>
        <button
          className="devscout-mode-btn"
          style={{ ...styles.modeBtn, ...(mode === 'replies' ? styles.modeBtnActive : {}) }}
          onClick={() => setMode('replies')}
        >
          Replies {getTotalUnreadReplies() > 0 && <span style={{ background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', marginLeft: '4px' }}>{getTotalUnreadReplies()}</span>}
        </button>
        <button
          className="devscout-mode-btn"
          style={{ ...styles.modeBtn, ...(mode === 'news' ? styles.modeBtnActive : {}) }}
          onClick={() => setMode('news')}
        >
          News
        </button>
        <button
          className="devscout-mode-btn"
          style={{ ...styles.modeBtn, ...(mode === 'github' ? styles.modeBtnActive : {}) }}
          onClick={() => setMode('github')}
        >
          GitHub
        </button>
        <button
          className="devscout-mode-btn"
          style={{ ...styles.modeBtn, ...(mode === 'prospects' ? styles.modeBtnActive : {}) }}
          onClick={() => setMode('prospects')}
        >
          Prospects
        </button>
      </div>

      {mode === 'posts' && (
        <>
          {/* Custom URL Input - add posts scraper missed */}
          <div className="devscout-url-input-row" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              className="devscout-input"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="Add Reddit post URL manually..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #333',
                background: '#0f0f0f',
                color: '#fff',
                fontSize: '14px',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomUrl()}
            />
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleAddCustomUrl}
              disabled={addingCustomPost}
            >
              {addingCustomPost ? 'Adding...' : 'Add Post'}
            </button>
          </div>

          <div style={styles.controls} className="devscout-controls">
            <button
              data-btn="primary"
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
            {autoMarkStatus && (
              <span style={{ marginLeft: '12px', color: '#4ade80', fontSize: '13px', animation: 'pulse 1s infinite' }}>
                🔍 {autoMarkStatus}
              </span>
            )}
          </div>

          <div style={styles.tabs} className="devscout-filter-tabs">
            {['new', 'skipped', 'all'].map((tab) => (
              <button
                key={tab}
                className="devscout-filter-tab"
                style={{ ...styles.tab, ...(filter === tab ? styles.tabActive : {}) }}
                onClick={() => setFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </>
      )}

      {mode === 'news' && (
        <div style={styles.controls} className="devscout-controls">
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={handleFetchNews}
            disabled={newsFetching}
          >
            {newsFetching
              ? newsProgress
                ? `Scanning ${newsProgress.source} (${newsProgress.current}/${newsProgress.total})`
                : 'Fetching...'
              : 'Fetch Tech News'}
          </button>
          {news.length > 0 && !newsFetching && (
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={handleClearNews}
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {mode === 'github' && (
        <div style={styles.controls} className="devscout-controls">
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
            <div style={styles.empty} className="devscout-empty">
              No posts found. Click "Fetch New Posts" to scan Reddit.
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} style={styles.post} className="devscout-post">
                <div style={styles.postHeader} className="devscout-post-header">
                  <a href={`https://reddit.com/r/${post.subreddit}`} target="_blank" rel="noopener noreferrer" style={{ ...styles.subreddit, textDecoration: 'none' }} className="devscout-subreddit">r/{post.subreddit}</a>
                  <span style={styles.score}>Score: {Math.round(post.relevance_score)}</span>
                </div>

                <h3 style={styles.postTitle} className="devscout-post-title">
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
                  <div style={styles.postBody} className="devscout-post-body">{post.body}</div>
                )}

                <div style={styles.keywords} className="devscout-keywords">
                  {parseKeywords(post.keywords_matched).map((kw, i) => (
                    <span key={i} style={styles.keyword}>{kw}</span>
                  ))}
                </div>

                {post.suggested_response ? (
                  <div style={styles.responseSection}>
                    <div style={styles.responseLabel}>Suggested Response</div>
                    <div style={styles.response}>{post.suggested_response}</div>
                    <div style={styles.actions} className="devscout-actions">
                      <button
                        data-btn="reddit"
                        style={{ ...styles.btn, ...styles.btnReddit, display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={async () => {
                          await navigator.clipboard.writeText(post.suggested_response);
                          setCopied((prev) => ({ ...prev, [post.id]: true }));
                          // Add #comments to scroll to comment section
                          const urlWithAnchor = post.url.includes('#') ? post.url : `${post.url}#comments`;
                          window.open(urlWithAnchor, '_blank');
                          setTimeout(() => setCopied((prev) => ({ ...prev, [post.id]: false })), 2000);
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                        {copied[post.id] ? 'Copied! Opening...' : 'Reply on Reddit'}
                      </button>
                      <button
                        data-btn="success"
                        style={{ ...styles.btn, ...styles.btnSuccess }}
                        onClick={() => handleMarkResponded(post.id)}
                      >
                        Mark Responded
                      </button>
                      <button
                        data-btn="regenerate"
                        style={{ ...styles.btn, ...styles.btnRegenerate }}
                        onClick={() => handleGenerate(post.id)}
                        disabled={generating[post.id]}
                      >
                        {generating[post.id] ? 'Regenerating...' : 'Regenerate'}
                      </button>
                      <button
                        data-btn="skip"
                        style={{ ...styles.btn, ...styles.btnSkip }}
                        onClick={() => handleSkip(post.id)}
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.actions} className="devscout-actions">
                    <button
                      data-btn="primary"
                      style={{ ...styles.btn, ...styles.btnPrimary }}
                      onClick={() => handleGenerate(post.id)}
                      disabled={generating[post.id]}
                    >
                      {generating[post.id] ? 'Generating...' : 'Generate Response'}
                    </button>
                    <button
                      data-btn="skip"
                      style={{ ...styles.btn, ...styles.btnSkip }}
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

      {/* News View (HN, Lobsters, Dev.to, Hashnode) */}
      {mode === 'news' && (
        <div style={styles.postList}>
          {news.length === 0 ? (
            <div style={styles.empty} className="devscout-empty">
              No news loaded. Click "Fetch Tech News" to scan HN, Lobsters, Dev.to & Hashnode.
            </div>
          ) : (
            news.map((item) => (
              <div key={item.reddit_id} style={styles.post} className="devscout-post">
                <div style={styles.postHeader} className="devscout-post-header">
                  <span style={{ ...styles.subreddit, color: '#f97316' }}>{item.subreddit}</span>
                  <span style={styles.score}>Score: {Math.round(item.relevance_score)}</span>
                </div>

                <h3 style={styles.postTitle} className="devscout-post-title">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.postLink}
                  >
                    {item.title}
                  </a>
                </h3>

                <div style={styles.postMeta}>
                  {item.author} · {formatTime(new Date(item.created_utc * 1000).toISOString())} · {item.num_comments} comments · {item.score} points
                </div>

                {item.body && (
                  <div style={styles.postBody} className="devscout-post-body">{item.body}</div>
                )}

                <div style={styles.keywords} className="devscout-keywords">
                  {item.keywords_matched?.map((kw, i) => (
                    <span key={i} style={styles.keyword}>{kw}</span>
                  ))}
                </div>

                {/* Generated response section */}
                {newsResponses[item.reddit_id] ? (
                  <div style={styles.responseSection}>
                    <div style={styles.responseLabel}>Generated Response</div>
                    <textarea
                      value={newsResponses[item.reddit_id]}
                      onChange={(e) => setNewsResponses((prev) => ({ ...prev, [item.reddit_id]: e.target.value }))}
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #333',
                        background: '#0a0a0a',
                        color: '#e0e0e0',
                        fontSize: '14px',
                        resize: 'vertical',
                        marginBottom: '8px',
                      }}
                    />
                    <div style={styles.actions} className="devscout-actions">
                      <button
                        data-btn="primary"
                        style={{ ...styles.btn, ...styles.btnPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={async () => {
                          await navigator.clipboard.writeText(newsResponses[item.reddit_id]);
                          setCopied((prev) => ({ ...prev, [`news_${item.reddit_id}`]: true }));
                          window.open(item.url, '_blank');
                          setTimeout(() => setCopied((prev) => ({ ...prev, [`news_${item.reddit_id}`]: false })), 2000);
                        }}
                      >
                        {copied[`news_${item.reddit_id}`] ? 'Copied! Opening...' : 'Copy & View Post →'}
                      </button>
                      <button
                        data-btn="regenerate"
                        style={{ ...styles.btn, ...styles.btnRegenerate }}
                        onClick={() => handleGenerateNewsResponse(item)}
                        disabled={generatingNews[item.reddit_id]}
                      >
                        {generatingNews[item.reddit_id] ? 'Regenerating...' : 'Regenerate'}
                      </button>
                      <button
                        data-btn="skip"
                        style={{ ...styles.btn, ...styles.btnSkip }}
                        onClick={() => handleDismissNews(item.reddit_id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.actions} className="devscout-actions">
                    <button
                      data-btn="primary"
                      style={{ ...styles.btn, ...styles.btnPrimary }}
                      onClick={() => handleGenerateNewsResponse(item)}
                      disabled={generatingNews[item.reddit_id]}
                    >
                      {generatingNews[item.reddit_id] ? 'Generating...' : 'Generate Response'}
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...styles.btn, ...styles.btnSecondary, textDecoration: 'none', display: 'inline-block' }}
                      className="btn-hover"
                    >
                      View Post
                    </a>
                    <button
                      data-btn="skip"
                      style={{ ...styles.btn, ...styles.btnSkip }}
                      onClick={() => handleDismissNews(item.reddit_id)}
                    >
                      Dismiss
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
            <div style={styles.empty} className="devscout-empty">
              No issues loaded. Click "Find Contribution Opportunities" to search GitHub.
            </div>
          ) : (
            githubIssues.map((issue) => (
              <div key={issue.id} style={styles.post} className="devscout-post">
                <div style={styles.postHeader} className="devscout-post-header">
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

                <h3 style={styles.postTitle} className="devscout-post-title">
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
                  <div style={styles.postBody} className="devscout-post-body">{issue.body}</div>
                )}

                <div style={styles.actions} className="devscout-actions">
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
                  <button
                    style={{ ...styles.btn, ...styles.btnSecondary }}
                    onClick={() => handleDismissIssue(issue.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Prospects Controls */}
      {mode === 'prospects' && (
        <div style={styles.controls} className="devscout-controls">
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={() => handleFetchProspects(false)}
            disabled={prospectsFetching}
          >
            {prospectsFetching
              ? prospectsProgress
                ? `Searching ${prospectsProgress.search} (${prospectsProgress.current}/${prospectsProgress.total})`
                : 'Fetching...'
              : 'Find Hot Prospects'}
          </button>
          {!prospectsFetching && getProspectsResumeInfo() && (
            <button
              style={{ ...styles.btn, ...styles.btnSuccess }}
              onClick={() => handleFetchProspects(true)}
            >
              Resume ({getProspectsResumeInfo().completedSearches}/{getProspectsResumeInfo().total})
            </button>
          )}
          {prospects.length > 0 && !prospectsFetching && (
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={handleClearProspects}
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Prospects View */}
      {mode === 'prospects' && (
        <div style={styles.postList}>
          {prospects.length === 0 ? (
            <div style={styles.empty} className="devscout-empty">
              No prospects loaded. Click "Find Hot Prospects" to search for freelance opportunities.
            </div>
          ) : (
            [...prospects].sort((a, b) => b.score - a.score).map((prospect) => {
              const category = getProspectCategory(prospect.score);
              return (
                <div key={prospect.id} style={styles.post} className="devscout-post">
                  <div style={styles.postHeader} className="devscout-post-header">
                    {prospect.source === 'hackernews' ? (
                      <a href={prospect.thread_url || 'https://news.ycombinator.com'} target="_blank" rel="noopener noreferrer" style={{ ...styles.subreddit, textDecoration: 'none', background: '#ff6600' }} className="devscout-subreddit">HN</a>
                    ) : (
                      <a href={`https://reddit.com/r/${prospect.subreddit}`} target="_blank" rel="noopener noreferrer" style={{ ...styles.subreddit, textDecoration: 'none' }} className="devscout-subreddit">r/{prospect.subreddit}</a>
                    )}
                    <span style={{
                      ...styles.score,
                      background: category.bg,
                      color: category.color,
                    }}>
                      {category.label} ({prospect.score})
                    </span>
                  </div>

                  <h3 style={styles.postTitle} className="devscout-post-title">
                    <a
                      href={prospect.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.postLink}
                    >
                      {prospect.title}
                    </a>
                  </h3>

                  <div style={styles.postMeta}>
                    {prospect.source === 'hackernews' ? prospect.author : `u/${prospect.author}`} · {formatTime(new Date(prospect.created_utc * 1000).toISOString())}
                    {prospect.source !== 'hackernews' && ` · ${prospect.num_comments} comments · ${prospect.ups || prospect.score} upvotes`}
                  </div>

                  {prospect.body && (
                    <div style={styles.postBody} className="devscout-post-body">{prospect.body}</div>
                  )}

                  {prospect.matchedKeywords && prospect.matchedKeywords.length > 0 && (
                    <div style={styles.keywords} className="devscout-keywords">
                      {prospect.matchedKeywords.map((kw, i) => (
                        <span key={i} style={styles.keyword}>{kw}</span>
                      ))}
                    </div>
                  )}

                  <div style={styles.actions} className="devscout-actions">
                    <a
                      href={prospect.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none', display: 'inline-block' }}
                    >
                      View Post
                    </a>
                    <button
                      style={{ ...styles.btn, ...styles.btnSecondary }}
                      onClick={() => handleDismissProspect(prospect.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Replies Controls */}
      {mode === 'replies' && (
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={handleFetchReplies}
            disabled={repliesFetching}
          >
            {repliesFetching ? 'Scanning...' : 'Refresh Now'}
          </button>
          {pollingActive && (
            <div style={styles.pollingIndicator}>
              <div style={styles.pulsingDot}></div>
              <span>Auto-refreshing every 30s</span>
            </div>
          )}
        </div>
      )}

      {/* Replies View */}
      {mode === 'replies' && (
        <div style={styles.postList}>
          {respondedPosts.length === 0 ? (
            <div style={styles.empty} className="devscout-empty">
              No responded posts yet. Posts you mark as "Responded" will appear here for reply tracking.
            </div>
          ) : (
            respondedPosts.map((post) => {
              const repliesData = postRepliesData[post.id] || { comments: [], totalUnreplied: 0 };
              const isExpanded = expandedPosts[post.id];
              // Use dismissal-aware count
              const activeUnreplied = getActiveUnrepliedCount(repliesData.comments);
              const needsAttention = activeUnreplied > 0;

              return (
                <div key={post.id} id={`reply-post-${post.id}`} style={{ marginBottom: '8px' }}>
                  {/* Collapsible Header */}
                  <div
                    style={{
                      ...styles.collapsibleHeader,
                      ...(isExpanded ? styles.collapsibleHeaderExpanded : {}),
                      ...(needsAttention ? styles.needsAttention : {}),
                    }}
                    onClick={() => togglePostExpanded(post.id)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <a
                          href={`https://reddit.com/r/${post.subreddit}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...styles.subreddit, textDecoration: 'none' }}
                          className="devscout-subreddit"
                          onClick={(e) => e.stopPropagation()}
                        >
                          r/{post.subreddit}
                        </a>
                        {needsAttention && (
                          <span style={styles.unrepliedBadge}>
                            {activeUnreplied} unreplied
                          </span>
                        )}
                        {repliesData.comments.length > 0 && !needsAttention && (
                          <span style={{ color: '#22c55e', fontSize: '12px' }}>
                            ✓ All replied
                          </span>
                        )}
                      </div>
                      <h3 style={{ ...styles.postTitle, marginBottom: 0 }}>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.postLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {post.title}
                        </a>
                      </h3>
                      <div style={{ ...styles.postMeta, marginTop: '4px', marginBottom: 0 }}>
                        Responded {formatTime(post.responded_at)} · {repliesData.comments.length} comment{repliesData.comments.length !== 1 ? 's' : ''} tracked
                      </div>
                    </div>
                    <div
                      style={{
                        ...styles.expandIcon,
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      ▼
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  {isExpanded && (
                    <div style={styles.collapsibleContent}>
                      {/* Show full post body */}
                      {post.body && (
                        <div style={styles.postBodyFull}>
                          <strong style={{ color: '#fff' }}>Original Post:</strong>
                          <div style={{ marginTop: '8px' }}>{post.body}</div>
                        </div>
                      )}

                      {/* User's comments and their replies */}
                      {repliesData.comments.length === 0 ? (
                        <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                          No comments by u/jessedev_ found on this post yet.
                        </div>
                      ) : (
                        repliesData.comments.map((comment) => (
                          <div key={comment.id} style={{ marginBottom: '20px' }}>
                            {/* User's comment */}
                            <div style={styles.myComment}>
                              <div style={styles.myCommentLabel}>Your Comment</div>
                              <div style={{ color: '#e0e0e0', whiteSpace: 'pre-wrap' }}>{comment.body}</div>
                              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                {formatTime(new Date(comment.created_utc * 1000).toISOString())} · {comment.score} points ·
                                <a href={comment.permalink} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', marginLeft: '4px' }}>View</a>
                              </div>
                            </div>

                            {/* Replies to this comment */}
                            {comment.replies.length > 0 && (
                              <div style={{ marginLeft: '8px' }}>
                                {comment.replies
                                  .filter(reply => !dismissedReplies.includes(reply.id) || reply.hasUserReply)
                                  .map((reply) => (
                                  <div
                                    key={reply.id}
                                    id={!reply.hasUserReply ? `unreplied-${reply.id}` : undefined}
                                    style={{
                                      ...styles.replyItem,
                                      ...(reply.hasUserReply ? styles.repliedReply : styles.unrepliedReply),
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                      <div style={{ fontSize: '12px', color: '#888' }}>
                                        <strong style={{ color: reply.hasUserReply ? '#22c55e' : '#ef4444' }}>
                                          u/{reply.author}
                                        </strong>
                                        {' · '}{formatTime(new Date(reply.created_utc * 1000).toISOString())} · {reply.score} points
                                        {reply.hasUserReply && <span style={{ color: '#22c55e', marginLeft: '8px' }}>✓ Replied</span>}
                                      </div>
                                    </div>
                                    <div style={{ color: '#ccc', whiteSpace: 'pre-wrap' }}>{reply.body}</div>

                                    {/* Generate response section - only for unreplied */}
                                    {!reply.hasUserReply && (
                                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #333' }}>
                                        {generatedReplies[reply.id] ? (
                                          <>
                                            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>
                                              Generated Response
                                            </div>
                                            <textarea
                                              value={generatedReplies[reply.id]}
                                              onChange={(e) => setGeneratedReplies((prev) => ({ ...prev, [reply.id]: e.target.value }))}
                                              style={{
                                                width: '100%',
                                                minHeight: '100px',
                                                padding: '10px',
                                                borderRadius: '6px',
                                                border: '1px solid #333',
                                                background: '#0a0a0a',
                                                color: '#e0e0e0',
                                                fontSize: '14px',
                                                resize: 'vertical',
                                                marginBottom: '8px',
                                              }}
                                            />
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                              <button
                                                data-btn="regenerate"
                                                style={{ ...styles.btn, ...styles.btnRegenerate }}
                                                onClick={() => handleGenerateReply(reply.id, post.subreddit, comment.body, reply.body)}
                                                disabled={generatingReply[reply.id]}
                                              >
                                                {generatingReply[reply.id] ? 'Regenerating...' : 'Regenerate'}
                                              </button>
                                              <button
                                                data-btn="reddit"
                                                style={{ ...styles.btn, ...styles.btnReddit, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                onClick={async () => {
                                                  await navigator.clipboard.writeText(generatedReplies[reply.id]);
                                                  setCopied((prev) => ({ ...prev, [`gen_${reply.id}`]: true }));
                                                  // Add ?context=3 for better context and scroll to comment
                                                  const replyUrl = reply.permalink.includes('?') ? reply.permalink : `${reply.permalink}?context=3`;
                                                  window.open(replyUrl, '_blank');
                                                  setTimeout(() => setCopied((prev) => ({ ...prev, [`gen_${reply.id}`]: false })), 2000);
                                                }}
                                              >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                                                {copied[`gen_${reply.id}`] ? 'Copied! Opening...' : 'Reply on Reddit'}
                                              </button>
                                              <button
                                                data-btn="skip"
                                                style={{ ...styles.btn, ...styles.btnSkip }}
                                                onClick={() => handleDismissReply(reply.id)}
                                                title="Dismiss this reply (won't notify again)"
                                              >
                                                Dismiss
                                              </button>
                                            </div>
                                          </>
                                        ) : (
                                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button
                                              data-btn="primary"
                                              style={{ ...styles.btn, ...styles.btnPrimary }}
                                              onClick={() => handleGenerateReply(reply.id, post.subreddit, comment.body, reply.body)}
                                              disabled={generatingReply[reply.id]}
                                            >
                                              {generatingReply[reply.id] ? 'Generating...' : 'Generate Response'}
                                            </button>
                                            <a
                                              href={`${reply.permalink}${reply.permalink.includes('?') ? '' : '?context=3'}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{ ...styles.btn, ...styles.btnReddit, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                              className="btn-hover"
                                            >
                                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                                              Reply on Reddit
                                            </a>
                                            <button
                                              data-btn="skip"
                                              style={{ ...styles.btn, ...styles.btnSkip }}
                                              onClick={() => handleDismissReply(reply.id)}
                                              title="Dismiss this reply (won't notify again)"
                                            >
                                              Dismiss
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Already replied - just show link */}
                                    {reply.hasUserReply && (
                                      <a href={reply.permalink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', display: 'block', marginTop: '8px' }}>
                                        View thread →
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {comment.replies.length === 0 && (
                              <div style={{ marginLeft: '20px', color: '#666', fontSize: '13px', fontStyle: 'italic' }}>
                                No replies to this comment yet
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      <div style={{ ...styles.actions, marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #333' }}>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none', display: 'inline-block' }}
                        >
                          View Post
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Engage View */}
      {mode === 'engage' && (
        <div style={styles.engageContainer}>
          {/* Subreddit Selection */}
          <div style={styles.engageHeader}>
            <select
              value={engageSubreddit}
              onChange={(e) => setEngageSubreddit(e.target.value)}
              style={styles.subredditSelect}
            >
              <option value="">Select a subreddit (or random)</option>
              {getEngagementSubreddits().map((sub) => (
                <option key={sub} value={sub}>r/{sub}</option>
              ))}
            </select>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => setEngageSubreddit(getRandomEngagementSubreddit())}
            >
              Random
            </button>
          </div>

          {/* Related Subreddits */}
          {engageSubreddit && getRelatedSubreddits(engageSubreddit).length > 0 && (
            <div style={styles.relatedSubreddits}>
              <div style={styles.relatedLabel}>Also consider posting in:</div>
              <div style={styles.relatedList}>
                {getRelatedSubreddits(engageSubreddit).map((sub) => (
                  <span
                    key={sub}
                    style={styles.relatedChip}
                    onClick={() => setEngageSubreddit(sub)}
                  >
                    r/{sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <div style={styles.categoryTabs}>
            <button
              style={{ ...styles.categoryTab, ...(engageCategory === 'all' ? styles.categoryTabActive : {}) }}
              onClick={() => setEngageCategory('all')}
            >
              All Ideas
            </button>
            {getEngagementCategories().map((cat) => (
              <button
                key={cat}
                style={{ ...styles.categoryTab, ...(engageCategory === cat ? styles.categoryTabActive : {}) }}
                onClick={() => setEngageCategory(cat)}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Post Ideas */}
          <div style={styles.postList}>
            {(() => {
              // Get ideas based on subreddit and category
              let ideas = engageSubreddit
                ? getIdeasForSubreddit(engageSubreddit)
                : getPostIdeas();

              // Filter by category
              if (engageCategory !== 'all') {
                if (engageSubreddit) {
                  ideas = ideas.filter((idea) => idea.category === engageCategory);
                } else {
                  ideas = ENGAGEMENT_TEMPLATES[engageCategory] || [];
                }
              }

              if (ideas.length === 0) {
                return (
                  <div style={styles.empty} className="devscout-empty">
                    No ideas found for this combination. Try a different subreddit or category.
                  </div>
                );
              }

              return ideas.map((idea, idx) => {
                const ideaKey = `${idea.title}_${idx}`;
                const sub = engageSubreddit || idea.subreddits[0];
                const category = idea.category || engageCategory;

                return (
                  <div key={idx} style={styles.ideaCard}>
                    <div style={styles.ideaTitle}>{idea.title}</div>

                    <div style={styles.ideaTags}>
                      {idea.tags.map((tag) => (
                        <span key={tag} style={styles.ideaTag}>{tag}</span>
                      ))}
                    </div>

                    <div style={styles.ideaSubreddits}>
                      Works in: {idea.subreddits.map((s) => `r/${s}`).join(', ')}
                    </div>

                    {/* Generated content section */}
                    {generatedEngagePosts[ideaKey] ? (
                      <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Generated Post for r/{sub}
                        </div>
                        <textarea
                          value={generatedEngagePosts[ideaKey]}
                          onChange={(e) => setGeneratedEngagePosts((prev) => ({ ...prev, [ideaKey]: e.target.value }))}
                          style={{
                            width: '100%',
                            minHeight: '200px',
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid #333',
                            background: '#0a0a0a',
                            color: '#e0e0e0',
                            fontSize: '14px',
                            resize: 'vertical',
                            lineHeight: '1.6',
                            fontFamily: 'inherit',
                          }}
                        />
                        <div style={{ ...styles.actions, marginTop: '12px' }}>
                          <button
                            data-btn="success"
                            style={{ ...styles.btn, ...styles.btnSuccess }}
                            onClick={() => {
                              navigator.clipboard.writeText(generatedEngagePosts[ideaKey]);
                              setCopied((prev) => ({ ...prev, [`engage_${ideaKey}`]: true }));
                              setTimeout(() => setCopied((prev) => ({ ...prev, [`engage_${ideaKey}`]: false })), 2000);
                            }}
                          >
                            {copied[`engage_${ideaKey}`] ? 'Copied!' : 'Copy Post'}
                          </button>
                          <button
                            data-btn="regenerate"
                            style={{ ...styles.btn, ...styles.btnRegenerate }}
                            onClick={() => handleGenerateEngage(ideaKey, sub, idea.title, category)}
                            disabled={generatingEngage[ideaKey]}
                          >
                            {generatingEngage[ideaKey] ? 'Regenerating...' : 'Regenerate'}
                          </button>
                          <a
                            href={`https://reddit.com/r/${sub}/submit?selftext=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ ...styles.btn, ...styles.btnReddit, textDecoration: 'none', display: 'inline-block' }}
                            className="btn-hover"
                          >
                            Create Post in r/{sub} →
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div style={styles.actions} className="devscout-actions">
                        <button
                          data-btn="primary"
                          style={{ ...styles.btn, ...styles.btnPrimary }}
                          onClick={() => handleGenerateEngage(ideaKey, sub, idea.title, category)}
                          disabled={generatingEngage[ideaKey]}
                        >
                          {generatingEngage[ideaKey] ? 'Generating...' : 'Generate Post'}
                        </button>
                        {engageSubreddit && (
                          <a
                            href={`https://reddit.com/r/${engageSubreddit}/submit?selftext=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ ...styles.btn, ...styles.btnSecondary, textDecoration: 'none', display: 'inline-block' }}
                            className="btn-hover"
                          >
                            Create Post in r/{engageSubreddit}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
