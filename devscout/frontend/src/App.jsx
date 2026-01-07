import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPosts, fetchStats, fetchFromReddit, fetchNews, submitPosts, generateResponse, generateReplyResponse, generateEngagePost, generateNewsResponse, updatePost, fetchGitHubIssues, formatIssueForClaude, fetchProspects, getProspectSearchCount, getPostsSubredditCount, clearStalePosts, scrapeTrackedPostsForReplies, scrapePostForUserComments, getEngagementSubreddits, getRelatedSubreddits, getIdeasForSubreddit, getPostIdeas, getEngagementCategories, getRandomEngagementSubreddit, ENGAGEMENT_TEMPLATES,
  // AI-Powered Prospects System
  fetchAndScoreProspects, getStoredProspects, getProspectStats, updateProspect as updateProspectAPI, deleteProspect as deleteProspectAPI, clearAllProspects, getAvailablePlatforms, getTotalSourceCount,
  // LinkedIn Post Templates
  LINKEDIN_POST_TEMPLATES, generateLinkedInPost, generateSmartLinkedInPost, getLinkedInPostIdeas, getLinkedInPostCategories,
  // LinkedIn Comments & Likes
  postLinkedInComment, likeLinkedInPost,
  // LinkedIn Engagement via Apify
  fetchLinkedInEngagementViaApify,
  // LinkedIn My Comments Tracking (DevScout-based + Apify fallback)
  fetchLinkedInMyComments, getLinkedInMyComments, getLinkedInMyCommentsUnreadCount,
  markLinkedInCommentRead, markAllLinkedInCommentsRead, clearLinkedInMyComments,
  generateLinkedInCommentReply, checkLinkedInCommentReplies, addLinkedInCommentByUrl,
  fetchLinkedInCommentReplies, markLinkedInReplyRead, dismissLinkedInReply, likeAndDismissLinkedInReply, postLinkedInReplyToComment,
  // LinkedIn My Posts Tracking (track comments on YOUR posts)
  addLinkedInPostToTrack, getTrackedLinkedInPosts, fetchLinkedInPostComments,
  dismissLinkedInPostComment, markLinkedInPostCommentRead, likeAndDismissLinkedInPostComment,
  deleteTrackedLinkedInPost, generateLinkedInPostCommentReply,
  // Dismissals (cross-device persistence)
  dismissItem, getDismissedIds, clearDismissals,
  // Persistence API (cross-device)
  saveLinkedInJobs, getLinkedInJobs, updateLinkedInJobStatus, clearLinkedInJobs, scoreLinkedInJobs,
  saveLinkedInEngagement, getLinkedInEngagement, updateLinkedInEngagementStatus, clearLinkedInEngagement,
  saveRedditJobs, getRedditJobs, updateRedditJobStatus, clearRedditJobs,
  saveRedditEngagement, getRedditEngagement, updateRedditEngagementStatus, clearRedditEngagement,
  saveNewsPosts, getNewsPosts, updateNewsPostStatus, clearNewsPosts,
  saveGitHubIssues, getGitHubIssues as fetchPersistedGitHubIssues, updateGitHubIssueStatus, clearGitHubIssues,
  getPersistenceStats,
} from './services/api';
import { fetchLinkedInPosts } from './services/scrapers/linkedin.js';

// ==============================================================================
// FEATURE FLAGS
// ==============================================================================

// LinkedIn OAuth is disabled until Company Page + Developer App are set up
// Set to true once LinkedIn credentials are added to the backend .env
const LINKEDIN_OAUTH_ENABLED = true;

// ==============================================================================
// TAB CONFIGURATION
// ==============================================================================

const TAB_CONFIG = {
  reddit: {
    label: 'Reddit',
    color: '#ff4500',
    subTabs: [
      { id: 'jobs', label: 'Job Search' },
      { id: 'schedule', label: 'Post Schedule' },
      { id: 'engagement', label: 'Engagement' },
      { id: 'comments', label: 'Comments' },
    ],
    defaultSubTab: 'jobs',
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    subTabs: [
      { id: 'jobs', label: 'Job Search' },
      { id: 'schedule', label: 'Post Schedule' },
      { id: 'engagement', label: 'Engagement' },
      { id: 'comments', label: 'Comments' },
    ],
    defaultSubTab: 'jobs',
  },
  opportunities: {
    label: 'Opportunities',
    color: '#22c55e',
    subTabs: [
      { id: 'all', label: 'All Sources' },
      { id: 'tech', label: 'Tech News' },
      { id: 'github', label: 'GitHub' },
    ],
    defaultSubTab: 'all',
  },
};

// Platform icons as inline SVG components
const RedditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const OpportunitiesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2zm0 15c-4.42 0-8-1.79-8-4V9.75L12 14l8-4.25V13c0 2.21-3.58 4-8 4zm6.5-9.25L12 11 5.5 7.75l-.004.008L5.5 7.75 12 4.5l6.5 3.25z"/>
    <path d="M12 16c-4.42 0-8-1.79-8-4v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4z"/>
  </svg>
);

const PLATFORM_ICONS = {
  reddit: RedditIcon,
  linkedin: LinkedInIcon,
  opportunities: OpportunitiesIcon,
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    paddingBottom: '20px',
    borderBottom: '1px solid #222',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '20px',
    fontWeight: '700',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '400',
    marginTop: '2px',
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
  btnLinkedIn: {
    background: '#0A66C2',
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
  // Main tabs (3 platforms)
  mainTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    padding: '6px',
    background: '#111',
    borderRadius: '14px',
  },
  mainTab: {
    padding: '14px 28px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'all 0.25s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    justifyContent: 'center',
  },
  // Sub-tabs (within each main tab)
  subTabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    background: '#1a1a1a',
    padding: '4px',
    borderRadius: '8px',
    width: 'fit-content',
  },
  subTab: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
    color: '#888',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  subTabActive: {
    background: '#333',
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
    gap: '20px',
  },
  post: {
    background: 'linear-gradient(145deg, #1a1a1a 0%, #141414 100%)',
    borderRadius: '14px',
    padding: '22px',
    border: '1px solid #262626',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    transition: 'border-color 0.2s ease, transform 0.2s ease',
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
    padding: '1px 6px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '1',
    verticalAlign: 'middle',
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
  // Collapsible UI for Comments
  collapsibleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '18px',
    background: 'linear-gradient(145deg, #1a1a1a 0%, #151515 100%)',
    borderRadius: '14px',
    border: '1px solid #262626',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
  collapsibleHeaderExpanded: {
    borderRadius: '14px 14px 0 0',
    borderBottom: 'none',
  },
  collapsibleContent: {
    background: '#121212',
    borderRadius: '0 0 14px 14px',
    border: '1px solid #262626',
    borderTop: 'none',
    padding: '18px',
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
    background: 'linear-gradient(145deg, #1a1a1a 0%, #141414 100%)',
    borderRadius: '14px',
    padding: '22px',
    border: '1px solid #262626',
    marginBottom: '14px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
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
  // LinkedIn OAuth status card
  linkedInAuthCard: {
    background: 'linear-gradient(145deg, #1a1a1a 0%, #141414 100%)',
    borderRadius: '14px',
    padding: '22px',
    border: '1px solid #262626',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  linkedInAuthHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  linkedInAuthStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  authDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
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
    button[data-btn="linkedin"]:hover:not(:disabled) {
      background: #004182 !important;
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
        padding-bottom: 16px !important;
      }

      .devscout-header-left {
        gap: 12px !important;
      }

      .devscout-logo {
        width: 36px !important;
        height: 36px !important;
      }

      .devscout-title {
        font-size: 20px !important;
      }

      .devscout-subtitle {
        font-size: 11px !important;
      }

      .devscout-stats {
        gap: 16px !important;
        width: 100% !important;
        justify-content: flex-start !important;
      }

      .devscout-stat-value {
        font-size: 20px !important;
      }

      /* Main tabs - horizontal scroll on mobile */
      .devscout-main-tabs {
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        scrollbar-width: none !important;
        padding: 4px !important;
        gap: 6px !important;
      }

      .devscout-main-tabs::-webkit-scrollbar {
        display: none !important;
      }

      .devscout-main-tab {
        padding: 10px 14px !important;
        font-size: 13px !important;
        white-space: nowrap !important;
        flex-shrink: 0 !important;
        flex: 0 0 auto !important;
        gap: 6px !important;
      }

      .devscout-main-tab svg {
        width: 16px !important;
        height: 16px !important;
      }

      /* Sub tabs - horizontal scroll */
      .devscout-sub-tabs {
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        scrollbar-width: none !important;
      }

      .devscout-sub-tabs::-webkit-scrollbar {
        display: none !important;
      }

      .devscout-sub-tab {
        padding: 8px 12px !important;
        font-size: 13px !important;
        white-space: nowrap !important;
        flex-shrink: 0 !important;
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

      /* Thread structure in Comments */
      .devscout-thread {
        margin-left: 0 !important;
        padding-left: 8px !important;
        border-left-width: 2px !important;
      }

      /* Global notification - mobile friendly */
      .devscout-global-notification {
        left: 12px !important;
        right: 12px !important;
        top: 12px !important;
        max-width: none !important;
      }

      /* Ensure nothing overflows */
      .devscout-container {
        max-width: 100% !important;
        overflow-x: hidden !important;
      }

      /* Post text wrap */
      .devscout-post-body,
      .devscout-post-title,
      .devscout-response-textarea {
        word-break: break-word !important;
        overflow-wrap: break-word !important;
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
        padding: 6px 8px !important;
        font-size: 11px !important;
      }

      .devscout-post {
        padding: 10px !important;
      }

      .devscout-actions button {
        padding: 8px 10px !important;
        font-size: 11px !important;
        min-width: unset !important;
        flex: 1 1 45% !important;
      }

      .devscout-controls button {
        min-width: unset !important;
        padding: 10px 12px !important;
        font-size: 12px !important;
        flex: 1 1 100% !important;
      }

      .devscout-title {
        font-size: 18px !important;
      }

      .devscout-global-notification {
        font-size: 12px !important;
        padding: 10px 12px !important;
      }
    }
  `;
  document.head.appendChild(style);
};

function App() {
  // ==============================================================================
  // TAB STATE - New 3-tab structure
  // ==============================================================================
  const [mainTab, setMainTab] = useState('reddit'); // 'reddit', 'linkedin', 'opportunities'
  const [subTabs, setSubTabs] = useState({
    reddit: 'jobs',        // 'jobs', 'schedule', 'engagement', 'comments'
    linkedin: 'jobs',      // 'jobs', 'schedule', 'engagement', 'comments'
    opportunities: 'all',  // 'all', 'tech', 'github'
  });

  const currentSubTab = subTabs[mainTab];

  const setSubTab = (tab) => {
    setSubTabs(prev => ({ ...prev, [mainTab]: tab }));
  };

  // ==============================================================================
  // REDDIT TAB STATE
  // ==============================================================================
  // Reddit Job Search - persisted to DB
  const [redditJobs, setRedditJobs] = useState([]);
  const [redditJobsFetching, setRedditJobsFetching] = useState(false);
  const [redditJobsResponses, setRedditJobsResponses] = useState({}); // jobId -> response text
  const [generatingRedditJob, setGeneratingRedditJob] = useState({}); // jobId -> boolean

  // Reddit Engagement (Posts)
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('new');
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(null);
  const [generating, setGenerating] = useState({});
  const [copied, setCopied] = useState({});
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [addingCustomPost, setAddingCustomPost] = useState(false);

  // Reddit Post Schedule (Engage)
  const [engageSubreddit, setEngageSubreddit] = useState('');
  const [engageCategory, setEngageCategory] = useState('all');
  const [generatingEngage, setGeneratingEngage] = useState({}); // ideaIdx -> boolean
  const [generatedEngagePosts, setGeneratedEngagePosts] = useState({}); // ideaIdx -> text

  // Reddit Comments (Replies)
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

  const [respondedPosts, setRespondedPosts] = useState(() => loadPersistedData('responded_posts'));
  const [postRepliesData, setPostRepliesData] = useState(() => loadPersistedData('replies_data', {}));
  const [dismissedReplies, setDismissedReplies] = useState([]);
  const [repliesFetching, setRepliesFetching] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState({}); // postId -> boolean
  const [pollingActive, setPollingActive] = useState(false);
  const [hideNoActionNeeded, setHideNoActionNeeded] = useState(true);
  const pollingInterval = useRef(null);
  const [generatingReply, setGeneratingReply] = useState({}); // replyId -> boolean
  const [generatedReplies, setGeneratedReplies] = useState({}); // replyId -> text

  // Auto-mark state
  const [autoMarkStatus, setAutoMarkStatus] = useState(null);
  const isCheckingPosts = useRef(false);

  // ==============================================================================
  // LINKEDIN TAB STATE
  // ==============================================================================
  const [linkedInAuth, setLinkedInAuth] = useState(null);
  const [linkedInAuthLoading, setLinkedInAuthLoading] = useState(true);

  // LinkedIn Job Leads (from Prospects) - persisted
  // LinkedIn Jobs - loaded from DATABASE on mount (cross-device)
  const [linkedInLeads, setLinkedInLeads] = useState([]);
  const [linkedInLeadsFetching, setLinkedInLeadsFetching] = useState(false);
  // AI Job Scoring - scores keyed by source_id
  const [linkedInJobScores, setLinkedInJobScores] = useState({}); // { source_id: { fit_score, remote_confidence, ... } }
  const [scoringLinkedInJobs, setScoringLinkedInJobs] = useState(false);

  // LinkedIn Engagement - loaded from DATABASE on mount (cross-device)
  const [linkedInEngagement, setLinkedInEngagement] = useState([]);
  const [linkedInEngagementFetching, setLinkedInEngagementFetching] = useState(false);
  const [linkedInEngagementResponses, setLinkedInEngagementResponses] = useState({}); // postId -> response text
  const [generatingLinkedInEngagement, setGeneratingLinkedInEngagement] = useState({}); // postId -> boolean
  const [postingLinkedInComment, setPostingLinkedInComment] = useState({}); // postId -> boolean
  const [likingLinkedInPost, setLikingLinkedInPost] = useState({}); // postId -> boolean
  const [dismissedLinkedInEngagement, setDismissedLinkedInEngagement] = useState([]);

  // LinkedIn Post Schedule
  const [linkedInScheduledPosts, setLinkedInScheduledPosts] = useState([]);
  const [linkedInPostContent, setLinkedInPostContent] = useState('');
  const [linkedInPostIdea, setLinkedInPostIdea] = useState(''); // Current post idea/topic
  const [linkedInScheduling, setLinkedInScheduling] = useState(false);
  const [linkedInPublishing, setLinkedInPublishing] = useState(false);
  const [linkedInPostCategory, setLinkedInPostCategory] = useState('lessons_learned');
  const [linkedInPostGenerating, setLinkedInPostGenerating] = useState(false);
  const [linkedInShowTemplates, setLinkedInShowTemplates] = useState(false); // Toggle for old template browser
  const [redditScheduledPosts, setRedditScheduledPosts] = useState([]);

  // LinkedIn Comments (my posts with their comments) - OLD SYSTEM
  const [linkedInMyPosts, setLinkedInMyPosts] = useState([]);
  const [linkedInMyPostsLoading, setLinkedInMyPostsLoading] = useState(false);
  const [linkedInExpandedPosts, setLinkedInExpandedPosts] = useState({}); // postId -> { loading, comments, error }
  const [linkedInDismissedComments, setLinkedInDismissedComments] = useState(() => {
    const loaded = loadPersistedData('linkedin_dismissed_comments');
    return Array.isArray(loaded) ? loaded : [];
  });
  const [linkedInCommentsLoading, setLinkedInCommentsLoading] = useState(false);

  // LinkedIn My Comments Tracking (via Apify) - NEW SYSTEM
  // Tracks comments I've made on OTHER people's posts and their replies
  const [myLinkedInComments, setMyLinkedInComments] = useState([]);
  const [myLinkedInCommentsLoading, setMyLinkedInCommentsLoading] = useState(false);
  const [myLinkedInCommentsUnread, setMyLinkedInCommentsUnread] = useState(0);
  const [fetchingLinkedInReplies, setFetchingLinkedInReplies] = useState(false);
  // Reply generation state: { [replyId]: { generating: boolean, generatedReply: string, expanded: boolean } }
  // Changed from commentId to replyId since we now generate replies for specific replies, not comments
  const [linkedInCommentReplies, setLinkedInCommentReplies] = useState({});

  // LinkedIn My Posts Tracking (track comments on MY posts)
  // This is for tracking comments people leave on YOUR LinkedIn posts
  const [myLinkedInPosts, setMyLinkedInPosts] = useState([]);
  const [myLinkedInPostsLoading, setMyLinkedInPostsLoading] = useState(false);
  const [fetchingPostComments, setFetchingPostComments] = useState(false);
  // Comment response state: { [commentId]: { generating, generatedReply, expanded } }
  const [linkedInPostCommentReplies, setLinkedInPostCommentReplies] = useState({});
  // URL input for adding posts
  const [addPostUrl, setAddPostUrl] = useState('');
  const [addingPostByUrl, setAddingPostByUrl] = useState(false);

  // Toast notifications (replaces confirmation dialogs)
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' | 'info' }

  // ==============================================================================
  // OPPORTUNITIES TAB STATE
  // ==============================================================================
  // AI-Powered Prospects (non-LinkedIn)
  // AI Prospects - loaded from DATABASE on mount (cross-device)
  const [aiProspects, setAiProspects] = useState([]);
  const [aiProspectsStats, setAiProspectsStats] = useState(null);
  const [aiScoring, setAiScoring] = useState(false);
  const [aiScoringProgress, setAiScoringProgress] = useState(null);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [prospectNotes, setProspectNotes] = useState({});

  // News (HN, Lobsters, Dev.to, Hashnode)
  // News - loaded from DATABASE on mount (cross-device)
  const [news, setNews] = useState([]);
  const [newsFetching, setNewsFetching] = useState(false);
  const [newsProgress, setNewsProgress] = useState(null);
  const [newsResponses, setNewsResponses] = useState({});
  const [generatingNews, setGeneratingNews] = useState({});
  const [dismissedNews, setDismissedNews] = useState([]);

  // GitHub Issues - persisted
  // GitHub Issues - loaded from DATABASE on mount (cross-device)
  const [githubIssues, setGithubIssues] = useState([]);
  const [githubFetching, setGithubFetching] = useState(false);
  const [githubProgress, setGithubProgress] = useState(null);
  const [dismissedGitHub, setDismissedGitHub] = useState([]);

  // ==============================================================================
  // NOTIFICATIONS
  // ==============================================================================
  const [notificationVisible, setNotificationVisible] = useState(true);
  const lastUnreadCount = useRef(0);
  const notificationFadeTimer = useRef(null);

  // Inject CSS animations on mount
  useEffect(() => {
    injectStyles();
  }, []);

  // ==============================================================================
  // REDDIT DATA LOADING
  // ==============================================================================
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

  // Load AI prospects from database on mount
  useEffect(() => {
    const loadProspectsFromDB = async () => {
      try {
        const stored = await getStoredProspects({ is_lead: true, limit: 500 });
        if (stored && stored.length > 0) {
          setAiProspects(stored);
          savePersistedData('ai_prospects', stored);
          console.log(`[DevScout] Loaded ${stored.length} prospects from database`);
        }
      } catch (err) {
        console.error('Failed to load prospects from DB:', err);
      }
    };
    loadProspectsFromDB();
  }, []);

  // Load all persisted data from database on mount (CROSS-DEVICE SYNC)
  // This is the source of truth - database, not localStorage
  useEffect(() => {
    const loadPersistedDataFromDB = async () => {
      console.log('[DevScout] Loading all data from database (cross-device sync)...');

      // LinkedIn Jobs
      try {
        const linkedInJobsData = await getLinkedInJobs('new');
        const jobs = Array.isArray(linkedInJobsData) ? linkedInJobsData : [];
        setLinkedInLeads(jobs);
        console.log(`[DevScout] Loaded ${jobs.length} LinkedIn jobs from database`);
      } catch (err) {
        console.error('[DevScout] Failed to load LinkedIn jobs:', err);
      }

      // Reddit Jobs
      try {
        const redditJobsData = await getRedditJobs('new');
        const jobs = Array.isArray(redditJobsData) ? redditJobsData : [];
        setRedditJobs(jobs);
        console.log(`[DevScout] Loaded ${jobs.length} Reddit jobs from database`);
      } catch (err) {
        console.error('[DevScout] Failed to load Reddit jobs:', err);
      }

      // LinkedIn Engagement
      try {
        const linkedInEngData = await getLinkedInEngagement('new');
        const posts = Array.isArray(linkedInEngData) ? linkedInEngData : [];
        setLinkedInEngagement(posts);
        console.log(`[DevScout] Loaded ${posts.length} LinkedIn engagement posts from database`);
      } catch (err) {
        console.error('[DevScout] Failed to load LinkedIn engagement:', err);
      }

      // News posts
      try {
        const newsData = await getNewsPosts(null, 'new');
        const newsArray = Array.isArray(newsData) ? newsData : [];
        // Transform back to frontend format
        const newsForUI = newsArray.map(item => ({
          reddit_id: item.source_id,
          subreddit: item.source,
          url: item.url,
          title: item.title,
          body: item.body,
          author: item.author,
          score: item.score,
          num_comments: item.comments,
          created_utc: item.posted_at ? new Date(item.posted_at).getTime() / 1000 : null,
        }));
        setNews(newsForUI);
        console.log(`[DevScout] Loaded ${newsForUI.length} news posts from database`);
      } catch (err) {
        console.error('[DevScout] Failed to load news posts:', err);
      }

      // GitHub issues
      try {
        const githubData = await fetchPersistedGitHubIssues('new');
        const issuesArray = Array.isArray(githubData) ? githubData : [];
        // Transform back to frontend format
        const issuesForUI = issuesArray.map(issue => ({
          id: issue.source_id,
          repo: issue.repo,
          url: issue.url,
          title: issue.title,
          body: issue.body,
          labels: issue.labels ? issue.labels.split(',') : [],
          language: issue.language,
          stars: issue.stars,
          created_at: issue.created_at,
        }));
        setGithubIssues(issuesForUI);
        console.log(`[DevScout] Loaded ${issuesForUI.length} GitHub issues from database`);
      } catch (err) {
        console.error('[DevScout] Failed to load GitHub issues:', err);
      }

      console.log('[DevScout] Cross-device data sync complete');
    };
    loadPersistedDataFromDB();
  }, []);

  // Handle LinkedIn OAuth callback (when redirected back from LinkedIn)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      // Check if this is an OAuth callback (has code parameter)
      if (code && (window.location.pathname === '/linkedin/callback' || window.location.pathname === '/')) {
        console.log('[LinkedIn OAuth] Handling callback with code');
        try {
          const response = await fetch(`/api/linkedin/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`, {
            method: 'POST',
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[LinkedIn OAuth] Connected successfully:', data.person_name);
            // Refresh auth status
            const statusResponse = await fetch('/api/linkedin/auth/status');
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              setLinkedInAuth(statusData);
            }
            showToast(`LinkedIn connected as ${data.person_name}`, 'success');
          } else {
            const errorData = await response.json();
            console.error('[LinkedIn OAuth] Callback failed:', errorData);
            showToast('Failed to connect LinkedIn: ' + (errorData.detail || 'Unknown error'), 'error');
          }
        } catch (err) {
          console.error('[LinkedIn OAuth] Error handling callback:', err);
          showToast('Failed to connect LinkedIn: ' + err.message, 'error');
        }

        // Clean up URL (remove OAuth params)
        window.history.replaceState({}, document.title, '/');
      }
    };

    handleOAuthCallback();
  }, []);

  // Load LinkedIn auth status on mount
  useEffect(() => {
    const checkLinkedInAuth = async () => {
      try {
        const response = await fetch('/api/linkedin/auth/status');
        if (response.ok) {
          const data = await response.json();
          setLinkedInAuth(data);
        }
      } catch (err) {
        console.error('Failed to check LinkedIn auth:', err);
      } finally {
        setLinkedInAuthLoading(false);
      }
    };
    checkLinkedInAuth();
  }, []);

  // ==============================================================================
  // HELPER FUNCTIONS
  // ==============================================================================
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const parseKeywords = (keywords) => {
    if (!keywords) return [];
    if (Array.isArray(keywords)) return keywords;
    try {
      return JSON.parse(keywords);
    } catch {
      return keywords.split(',').map(k => k.trim());
    }
  };

  // Load checked posts from localStorage
  const getCheckedPosts = () => {
    try {
      const stored = localStorage.getItem('devscout_checked_posts');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  };
  const saveCheckedPosts = (ids) => {
    try {
      const arr = [...ids].slice(-200);
      localStorage.getItem('devscout_checked_posts', JSON.stringify(arr));
    } catch {}
  };

  // ==============================================================================
  // REDDIT ENGAGEMENT HANDLERS
  // ==============================================================================
  const checkPostsForUserComments = useCallback(async (postsToCheck) => {
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

    console.log(`[DevScout] Checking ${newPosts.length} new posts for user comments...`);
    setAutoMarkStatus(`Checking ${newPosts.length} posts...`);

    let markedCount = 0;
    const BATCH_SIZE = 2;

    for (let i = 0; i < newPosts.length; i += BATCH_SIZE) {
      const batch = newPosts.slice(i, i + BATCH_SIZE);
      setAutoMarkStatus(`Checking posts ${i + 1}-${Math.min(i + BATCH_SIZE, newPosts.length)}/${newPosts.length}...`);

      const results = await Promise.all(batch.map(async (post) => {
        try {
          const { comments, error } = await scrapePostForUserComments(post.url);
          checkedPosts.add(post.id);

          if (!error && comments && comments.length > 0) {
            try {
              await updatePost(post.id, { status: 'responded' });
              return true;
            } catch {
              return false;
            }
          }
          return false;
        } catch {
          return false;
        }
      }));

      markedCount += results.filter(Boolean).length;
      saveCheckedPosts(checkedPosts);

      if (i + BATCH_SIZE < newPosts.length) {
        await new Promise(r => setTimeout(r, 500));
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

  // Check for user comments when on Reddit Engagement tab
  useEffect(() => {
    if (mainTab !== 'reddit' || currentSubTab !== 'engagement') return;
    checkPostsForUserComments(posts);
  }, [posts, mainTab, currentSubTab, checkPostsForUserComments]);

  // Periodic re-check for auto-marking (every 60s)
  useEffect(() => {
    if (mainTab !== 'reddit' || currentSubTab !== 'engagement') return;

    const interval = setInterval(() => {
      const newPosts = posts.filter(p => p.status === 'new');
      if (newPosts.length > 0) {
        localStorage.removeItem('devscout_checked_posts');
        checkPostsForUserComments(newPosts);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [mainTab, currentSubTab, posts, checkPostsForUserComments]);

  const handleFetch = async (resume = false) => {
    setFetching(true);

    const savedProgress = loadPersistedData('posts_progress', null);
    const startIndex = resume && savedProgress ? savedProgress.completedSubreddits : 0;

    if (startIndex === 0) {
      setFetchProgress({ current: 0, total: 0, subreddit: 'Clearing old posts...' });
      await clearStalePosts();
    }

    try {
      const redditPosts = await fetchFromReddit(
        (current, total, subreddit) => {
          setFetchProgress({ current, total, subreddit });
        },
        (partialResults, completedSubreddits) => {
          savePersistedData('posts_progress', { completedSubreddits, total: getPostsSubredditCount() });
        },
        startIndex
      );

      if (redditPosts.length === 0) {
        localStorage.removeItem('devscout_posts_progress');
        return;
      }

      setFetchProgress({ current: 0, total: 0, subreddit: 'Submitting to server...' });
      await submitPosts(redditPosts);
      localStorage.removeItem('devscout_checked_posts');
      localStorage.removeItem('devscout_posts_progress');
      loadData();
    } catch (err) {
      showToast('Failed to fetch: ' + err.message, 'error');
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
      showToast('Failed to generate: ' + err.message, 'error');
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
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handleMarkResponded = async (postId) => {
    try {
      await updatePost(postId, { status: 'responded' });
      loadData();
    } catch (err) {
      showToast('Failed to update: ' + err.message, 'error');
    }
  };

  const handleSkip = async (postId) => {
    try {
      await updatePost(postId, { status: 'skipped' });
      loadData();
    } catch (err) {
      showToast('Failed to skip: ' + err.message, 'error');
    }
  };

  const handleClearPosts = async () => {
    // Just do it - no confirmation needed
    try {
      setPosts([]);
      localStorage.removeItem('devscout_checked_posts');
      showToast('Posts cleared', 'success');
    } catch (err) {
      showToast('Failed to clear: ' + err.message, 'error');
    }
  };

  const handleAddCustomUrl = async () => {
    if (!customUrlInput.trim()) return;
    setAddingCustomPost(true);
    try {
      // TODO: Implement custom URL adding
      showToast('Custom URL adding coming soon!', 'info');
    } finally {
      setAddingCustomPost(false);
      setCustomUrlInput('');
    }
  };

  // ==============================================================================
  // REDDIT POST SCHEDULE (ENGAGE) HANDLERS
  // ==============================================================================
  const handleGenerateEngage = async (ideaKey, subreddit, title, category) => {
    setGeneratingEngage((prev) => ({ ...prev, [ideaKey]: true }));
    try {
      const result = await generateEngagePost(subreddit, title, category);
      setGeneratedEngagePosts((prev) => ({ ...prev, [ideaKey]: result.post }));
    } catch (err) {
      showToast('Failed to generate: ' + err.message, 'error');
    } finally {
      setGeneratingEngage((prev) => ({ ...prev, [ideaKey]: false }));
    }
  };

  // ==============================================================================
  // REDDIT COMMENTS (REPLIES) HANDLERS
  // ==============================================================================
  const getTotalUnreadReplies = useCallback(() => {
    let total = 0;
    // Only count replies from posts that are still in respondedPosts (not stale data)
    const activePostIds = new Set(respondedPosts.map(p => p.id));
    Object.entries(postRepliesData).forEach(([postId, post]) => {
      // Skip if post is no longer being tracked
      if (!activePostIds.has(postId)) return;
      if (post.comments) {
        post.comments.forEach(comment => {
          if (comment.replies) {
            total += comment.replies.filter(r =>
              !r.hasUserReply && !dismissedReplies.includes(r.id)
            ).length;
          }
        });
      }
    });
    return total;
  }, [postRepliesData, dismissedReplies, respondedPosts]);

  const handleFetchReplies = async () => {
    setRepliesFetching(true);
    try {
      const postsWithComments = await fetchPosts('responded');
      setRespondedPosts(postsWithComments);

      // Scrape for replies
      const repliesData = await scrapeTrackedPostsForReplies(postsWithComments);
      setPostRepliesData(repliesData);
      savePersistedData('replied_data', repliesData);
    } catch (err) {
      console.error('Failed to fetch replies:', err);
    } finally {
      setRepliesFetching(false);
    }
  };

  // Persist replies data
  useEffect(() => {
    if (respondedPosts.length > 0) {
      savePersistedData('responded_posts', respondedPosts);
    }
  }, [respondedPosts]);

  // Auto-cleanup: Remove stale entries from postRepliesData when respondedPosts changes
  useEffect(() => {
    const activePostIds = new Set(respondedPosts.map(p => p.id));
    const staleIds = Object.keys(postRepliesData).filter(id => !activePostIds.has(id));

    if (staleIds.length > 0) {
      console.log(`Cleaning up ${staleIds.length} stale reply entries`);
      const cleaned = { ...postRepliesData };
      staleIds.forEach(id => delete cleaned[id]);
      setPostRepliesData(cleaned);
      savePersistedData('replies_data', cleaned);
    }
  }, [respondedPosts]); // Only run when respondedPosts changes

  useEffect(() => {
    if (Object.keys(postRepliesData).length > 0) {
      savePersistedData('replies_data', postRepliesData);
    }
  }, [postRepliesData]);

  // Load dismissed replies from backend (cross-device sync)
  useEffect(() => {
    const loadDismissedReplies = async () => {
      try {
        const ids = await getDismissedIds('reddit_reply');
        setDismissedReplies(ids);
      } catch (err) {
        console.error('Failed to load dismissed replies:', err);
      }
    };
    loadDismissedReplies();
  }, []);

  // ==============================================================================
  // TOAST NOTIFICATIONS (replaces confirmation dialogs)
  // ==============================================================================
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ==============================================================================
  // LINKEDIN COMMENTS HANDLERS (NEW - via Apify)
  // ==============================================================================
  // Count unread replies to my comments (via Apify tracking)
  const getLinkedInUnreadComments = useCallback(() => {
    return myLinkedInCommentsUnread;
  }, [myLinkedInCommentsUnread]);

  // Load my LinkedIn comments from database on mount
  useEffect(() => {
    const loadMyComments = async () => {
      try {
        const comments = await getLinkedInMyComments();
        setMyLinkedInComments(comments);
        const unreadCount = comments.filter(c => c.has_unread_replies).length;
        setMyLinkedInCommentsUnread(unreadCount);
      } catch (err) {
        console.error('Failed to load my LinkedIn comments:', err);
      }
    };
    loadMyComments();
  }, []);

  // Fetch my comments via Apify
  const handleFetchMyLinkedInComments = async () => {
    setMyLinkedInCommentsLoading(true);
    try {
      const result = await fetchLinkedInMyComments('jesseeldridge', 3);
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast(`Found ${result.total_fetched} comments, ${result.new_replies} new replies`, 'success');
        // Reload from database
        const comments = await getLinkedInMyComments();
        setMyLinkedInComments(comments);
        const unreadCount = comments.filter(c => c.has_unread_replies).length;
        setMyLinkedInCommentsUnread(unreadCount);
      }
    } catch (err) {
      showToast('Failed to fetch comments: ' + err.message, 'error');
    } finally {
      setMyLinkedInCommentsLoading(false);
    }
  };

  // Check for replies using LinkedIn OAuth API (DevScout-based tracking)
  // NOTE: LinkedIn API has permission limitations - use Fetch Comments (Apify) for reliable reply checking
  const [checkingLinkedInReplies, setCheckingLinkedInReplies] = useState(false);
  const handleCheckLinkedInReplies = async () => {
    setCheckingLinkedInReplies(true);
    try {
      const result = await checkLinkedInCommentReplies();
      if (result.error) {
        showToast(result.error, 'error');
      } else if (result.message) {
        // LinkedIn API permission limitation - suggest using Apify
        showToast(result.suggestion || result.message, 'info');
      } else if (result.checked > 0) {
        showToast(`Checked ${result.checked} comments, ${result.new_replies} new replies`, 'success');
        // Reload from database
        const comments = await getLinkedInMyComments();
        setMyLinkedInComments(comments);
        const unreadCount = comments.filter(c => c.has_unread_replies).length;
        setMyLinkedInCommentsUnread(unreadCount);
      } else {
        // All permission errors - suggest using Fetch Comments instead
        showToast('Use "Fetch Comments" button instead (Apify works better)', 'info');
      }
    } catch (err) {
      showToast('Failed to check replies: ' + err.message, 'error');
    } finally {
      setCheckingLinkedInReplies(false);
    }
  };

  // Add comment by URL (for manual tracking)
  const [addLinkedInUrl, setAddLinkedInUrl] = useState('');
  const [addingLinkedInUrl, setAddingLinkedInUrl] = useState(false);

  // Unified handler: auto-detect if URL is a post or comment and add accordingly
  const handleAddLinkedInUrl = async () => {
    if (!addLinkedInUrl.trim()) {
      showToast('Please enter a LinkedIn URL', 'info');
      return;
    }
    setAddingLinkedInUrl(true);
    try {
      const url = addLinkedInUrl.trim();

      // Detect URL type: comment URLs contain "commentUrn=" or similar patterns
      const isCommentUrl = url.includes('commentUrn=') || (url.includes('comment') && url.includes('urn'));
      // Post URLs contain urn:li:activity, urn:li:ugcPost, or urn:li:share
      const isPostUrl = /urn:li:(activity|ugcPost|share):\d+/.test(url) || url.includes('/posts/');

      if (isCommentUrl) {
        // It's a comment URL - track your comment for replies
        const result = await addLinkedInCommentByUrl(url);
        showToast(result.message || 'Comment added! Fetching replies...', result.status === 'already_tracked' ? 'info' : 'success');
        // Refresh the comments list
        const comments = await getLinkedInMyComments();
        setMyLinkedInComments(comments);
        // Auto-fetch replies for better UX
        setAddLinkedInUrl('');
        await handleFetchLinkedInReplies();
      } else if (isPostUrl) {
        // It's a post URL - track your post for comments
        const result = await addLinkedInPostToTrack(url);
        if (result.status === 'already_tracked') {
          showToast('Post already tracked', 'info');
        } else {
          showToast('Post added! Fetching comments...', 'success');
        }
        // Refresh the posts list immediately
        const posts = await getTrackedLinkedInPosts();
        setMyLinkedInPosts(posts);
        setAddLinkedInUrl('');
        // Auto-fetch comments for the newly added post
        if (result.status !== 'already_tracked') {
          await handleFetchLinkedInPostComments();
        }
      } else {
        showToast('Could not detect URL type. Make sure it\'s a valid LinkedIn post or comment URL.', 'error');
        return;
      }
    } catch (err) {
      showToast('Failed to add: ' + err.message, 'error');
    } finally {
      setAddingLinkedInUrl(false);
    }
  };

  // Mark a comment as read
  const handleMarkLinkedInCommentRead = async (commentId) => {
    try {
      await markLinkedInCommentRead(commentId);
      setMyLinkedInComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, has_unread_replies: false } : c
      ));
      setMyLinkedInCommentsUnread(prev => Math.max(0, prev - 1));
      showToast('Marked as read', 'success');
    } catch (err) {
      showToast('Failed to mark as read', 'error');
    }
  };

  // Mark all comments as read
  const handleMarkAllLinkedInCommentsRead = async () => {
    try {
      await markAllLinkedInCommentsRead();
      setMyLinkedInComments(prev => prev.map(c => ({ ...c, has_unread_replies: false })));
      setMyLinkedInCommentsUnread(0);
      showToast('All marked as read', 'success');
    } catch (err) {
      showToast('Failed to mark all as read', 'error');
    }
  };

  // Fetch actual reply content for all tracked comments
  const handleFetchLinkedInReplies = async () => {
    setFetchingLinkedInReplies(true);
    try {
      const result = await fetchLinkedInCommentReplies();
      if (result.success) {
        if (result.new_replies > 0) {
          showToast(`Found ${result.new_replies} new reply/replies!`, 'success');
        } else {
          showToast('No new replies found', 'info');
        }
        // Reload comments with the new reply data
        const comments = await getLinkedInMyComments();
        setMyLinkedInComments(comments);
        const unreadResult = await getLinkedInMyCommentsUnreadCount();
        setMyLinkedInCommentsUnread(unreadResult.unread_count || 0);
      } else if (result.error) {
        showToast(result.error, 'error');
      }
    } catch (err) {
      showToast('Failed to fetch replies: ' + err.message, 'error');
    } finally {
      setFetchingLinkedInReplies(false);
    }
  };

  // Unified fetch: fetch all LinkedIn activity (comments, replies, and post comments)
  const [fetchingAllLinkedIn, setFetchingAllLinkedIn] = useState(false);
  const handleFetchAllLinkedIn = async () => {
    setFetchingAllLinkedIn(true);
    try {
      // Fetch my comments and their replies
      await handleFetchMyLinkedInComments();
      await handleFetchLinkedInReplies();

      // Fetch comments on my tracked posts
      if (myLinkedInPosts.length > 0) {
        await handleFetchLinkedInPostComments();
      }

      showToast('All LinkedIn activity updated', 'success');
    } catch (err) {
      showToast('Failed to fetch: ' + err.message, 'error');
    } finally {
      setFetchingAllLinkedIn(false);
    }
  };

  // Generate a reply to a specific reply on my LinkedIn comment
  // reply = the LinkedInCommentReply object (the person's reply to my comment)
  // comment = the parent LinkedInMyComment (my original comment)
  const handleGenerateLinkedInCommentReply = async (reply, comment) => {
    setLinkedInCommentReplies(prev => ({
      ...prev,
      [reply.id]: { ...prev[reply.id], generating: true, expanded: true },
    }));

    try {
      const result = await generateLinkedInCommentReply(
        comment.comment_text,  // My original comment
        reply.reply_text,      // Their reply to my comment (THIS IS WHAT WE'RE RESPONDING TO)
        comment.post_text,     // Original post context
        comment.post_author    // Original post author
      );
      setLinkedInCommentReplies(prev => ({
        ...prev,
        [reply.id]: { generating: false, generatedReply: result.reply, expanded: true },
      }));
    } catch (err) {
      showToast('Failed to generate reply: ' + err.message, 'error');
      setLinkedInCommentReplies(prev => ({
        ...prev,
        [reply.id]: { ...prev[reply.id], generating: false },
      }));
    }
  };

  // Update the generated reply text (for editing before posting)
  const handleUpdateLinkedInReplyText = (replyId, newText) => {
    setLinkedInCommentReplies(prev => ({
      ...prev,
      [replyId]: { ...prev[replyId], generatedReply: newText },
    }));
  };

  // Copy generated reply and open LinkedIn comment link
  const handleCopyAndOpenLinkedInReply = async (reply, comment) => {
    const replyState = linkedInCommentReplies[reply.id];
    if (replyState?.generatedReply) {
      await navigator.clipboard.writeText(replyState.generatedReply);
      showToast('Copied! Opening LinkedIn...', 'success');
    }
    // Open the reply link or comment link to reply on LinkedIn
    const linkToOpen = reply.reply_link || comment.comment_link;
    if (linkToOpen) {
      window.open(linkToOpen, '_blank');
    }
    // Mark the reply as read
    try {
      await markLinkedInReplyRead(reply.id);
      // Update local state
      setMyLinkedInComments(prev => prev.map(c => ({
        ...c,
        replies: (c.replies || []).map(r =>
          r.id === reply.id ? { ...r, is_read: true } : r
        ),
      })));
    } catch (err) {
      console.error('Failed to mark reply as read:', err);
    }
  };

  // Clear generated reply state
  const handleClearLinkedInReply = (replyId) => {
    setLinkedInCommentReplies(prev => {
      const newState = { ...prev };
      delete newState[replyId];
      return newState;
    });
  };

  // Dismiss a reply (won't show in unread)
  const handleDismissLinkedInReply = async (replyId) => {
    try {
      await dismissLinkedInReply(replyId);
      // Update local state
      setMyLinkedInComments(prev => prev.map(c => ({
        ...c,
        replies: (c.replies || []).map(r =>
          r.id === replyId ? { ...r, is_dismissed: true, is_read: true } : r
        ),
      })));
      showToast('Reply dismissed', 'success');
    } catch (err) {
      showToast('Failed to dismiss reply', 'error');
    }
  };

  // Like a reply on LinkedIn and dismiss it from DevScout
  const [likingReply, setLikingReply] = useState({});
  const handleLikeAndDismissLinkedInReply = async (replyId) => {
    setLikingReply(prev => ({ ...prev, [replyId]: true }));
    try {
      const result = await likeAndDismissLinkedInReply(replyId);
      // Update local state
      setMyLinkedInComments(prev => prev.map(c => ({
        ...c,
        replies: (c.replies || []).map(r =>
          r.id === replyId ? { ...r, is_dismissed: true, is_read: true } : r
        ),
      })));
      if (result.liked) {
        showToast('Liked & dismissed', 'success');
      } else {
        showToast('Dismissed (like failed: ' + (result.reason || 'unknown') + ')', 'info');
      }
    } catch (err) {
      showToast('Failed to like reply', 'error');
    } finally {
      setLikingReply(prev => ({ ...prev, [replyId]: false }));
    }
  };

  // Post a reply directly to LinkedIn (no copy/paste needed)
  const [postingReply, setPostingReply] = useState({});
  const handlePostLinkedInReply = async (reply, comment) => {
    const replyState = linkedInCommentReplies[reply.id];
    if (!replyState?.generatedReply?.trim()) {
      showToast('Generate a reply first', 'info');
      return;
    }
    setPostingReply(prev => ({ ...prev, [reply.id]: true }));
    try {
      await postLinkedInReplyToComment(reply.id, replyState.generatedReply);
      // Update local state - mark as dismissed
      setMyLinkedInComments(prev => prev.map(c => ({
        ...c,
        replies: (c.replies || []).map(r =>
          r.id === reply.id ? { ...r, is_dismissed: true, is_read: true, has_user_reply: true } : r
        ),
      })));
      // Clear the generated reply
      handleClearLinkedInReply(reply.id);
      showToast('Posted to LinkedIn!', 'success');
    } catch (err) {
      console.error('Failed to post reply:', err);
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      setPostingReply(prev => ({ ...prev, [reply.id]: false }));
    }
  };

  // ===================================================================================
  // LINKEDIN MY POSTS TRACKING HANDLERS
  // Track comments on YOUR LinkedIn posts (different from tracking your comments on others' posts)
  // ===================================================================================

  // Load tracked LinkedIn posts on mount
  useEffect(() => {
    const loadTrackedPosts = async () => {
      try {
        const posts = await getTrackedLinkedInPosts();
        setMyLinkedInPosts(posts);
        console.log(`[DevScout] Loaded ${posts.length} tracked LinkedIn posts`);
      } catch (err) {
        console.error('Failed to load tracked LinkedIn posts:', err);
      }
    };
    loadTrackedPosts();
  }, []);

  // Add a LinkedIn post by URL to track
  const handleAddLinkedInPostByUrl = async () => {
    if (!addPostUrl.trim()) {
      showToast('Please enter a post URL', 'info');
      return;
    }
    setAddingPostByUrl(true);
    try {
      const result = await addLinkedInPostToTrack(addPostUrl);
      showToast(result.message, result.status === 'already_tracked' ? 'info' : 'success');
      setAddPostUrl('');
      // Reload tracked posts
      const posts = await getTrackedLinkedInPosts();
      setMyLinkedInPosts(posts);
    } catch (err) {
      showToast('Failed to add post: ' + err.message, 'error');
    } finally {
      setAddingPostByUrl(false);
    }
  };

  // Fetch comments for all tracked posts via Apify
  const handleFetchLinkedInPostComments = async () => {
    if (myLinkedInPosts.length === 0) {
      showToast('Add a post first to track its comments', 'info');
      return;
    }
    setFetchingPostComments(true);
    try {
      const result = await fetchLinkedInPostComments();
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast(`Fetched ${result.total_comments} comments for ${result.posts_processed} posts`, 'success');
        // Reload tracked posts to get updated comments
        const posts = await getTrackedLinkedInPosts();
        setMyLinkedInPosts(posts);
      }
    } catch (err) {
      showToast('Failed to fetch comments: ' + err.message, 'error');
    } finally {
      setFetchingPostComments(false);
    }
  };

  // Delete a tracked post
  const handleDeleteTrackedPost = async (postId) => {
    try {
      await deleteTrackedLinkedInPost(postId);
      setMyLinkedInPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Post removed from tracking', 'success');
    } catch (err) {
      showToast('Failed to delete post', 'error');
    }
  };

  // Dismiss a comment on a tracked post
  const handleDismissLinkedInPostComment = async (commentId) => {
    try {
      await dismissLinkedInPostComment(commentId);
      setMyLinkedInPosts(prev => prev.map(p => ({
        ...p,
        comments: (p.comments || []).map(c =>
          c.id === commentId ? { ...c, is_dismissed: true, is_read: true } : c
        ),
      })));
      showToast('Comment dismissed', 'success');
    } catch (err) {
      showToast('Failed to dismiss comment', 'error');
    }
  };

  // Like and dismiss a comment on my tracked post
  const [likingPostComment, setLikingPostComment] = useState({});
  const handleLikeAndDismissPostComment = async (commentId) => {
    setLikingPostComment(prev => ({ ...prev, [commentId]: true }));
    try {
      const result = await likeAndDismissLinkedInPostComment(commentId);
      setMyLinkedInPosts(prev => prev.map(p => ({
        ...p,
        comments: (p.comments || []).map(c =>
          c.id === commentId ? { ...c, is_dismissed: true, is_read: true } : c
        ),
      })));
      if (result.liked) {
        showToast('Liked & dismissed', 'success');
      } else {
        showToast('Dismissed (like failed: ' + (result.reason || 'unknown') + ')', 'info');
      }
    } catch (err) {
      showToast('Failed to like comment', 'error');
    } finally {
      setLikingPostComment(prev => ({ ...prev, [commentId]: false }));
    }
  };

  // Generate a reply to a comment on my post
  const handleGenerateLinkedInPostCommentReply = async (comment, myPost) => {
    setLinkedInPostCommentReplies(prev => ({
      ...prev,
      [comment.id]: { ...prev[comment.id], generating: true, expanded: true },
    }));

    try {
      const result = await generateLinkedInPostCommentReply(
        myPost.post_text || '',  // My original post text
        comment.comment_text     // Their comment on my post
      );
      setLinkedInPostCommentReplies(prev => ({
        ...prev,
        [comment.id]: { generating: false, generatedReply: result.reply, expanded: true },
      }));
    } catch (err) {
      showToast('Failed to generate reply: ' + err.message, 'error');
      setLinkedInPostCommentReplies(prev => ({
        ...prev,
        [comment.id]: { ...prev[comment.id], generating: false },
      }));
    }
  };

  // Update generated reply text (for editing before posting)
  const handleUpdateLinkedInPostCommentReply = (commentId, newText) => {
    setLinkedInPostCommentReplies(prev => ({
      ...prev,
      [commentId]: { ...prev[commentId], generatedReply: newText },
    }));
  };

  // Copy generated reply and open LinkedIn
  const handleCopyAndOpenLinkedInPostComment = async (comment) => {
    const replyState = linkedInPostCommentReplies[comment.id];
    if (replyState?.generatedReply) {
      await navigator.clipboard.writeText(replyState.generatedReply);
      showToast('Copied! Opening LinkedIn...', 'success');
    }
    if (comment.comment_link) {
      window.open(comment.comment_link, '_blank');
    }
    // Mark as read
    try {
      await markLinkedInPostCommentRead(comment.id);
      setMyLinkedInPosts(prev => prev.map(p => ({
        ...p,
        comments: (p.comments || []).map(c =>
          c.id === comment.id ? { ...c, is_read: true } : c
        ),
      })));
    } catch (err) {
      console.error('Failed to mark comment as read:', err);
    }
  };

  // Clear generated reply state
  const handleClearLinkedInPostCommentReply = (commentId) => {
    setLinkedInPostCommentReplies(prev => {
      const newState = { ...prev };
      delete newState[commentId];
      return newState;
    });
  };

  // OLD SYSTEM: Auto-fetch my DevScout-scheduled posts when LinkedIn auth becomes available
  useEffect(() => {
    if (!linkedInAuth?.is_authenticated || linkedInMyPosts.length > 0) return;

    const fetchMyPosts = async () => {
      setLinkedInMyPostsLoading(true);
      try {
        const API_BASE = import.meta.env.PROD
          ? 'https://devscout.junipr.io'
          : 'http://localhost:8004';
        const res = await fetch(`${API_BASE}/api/linkedin/my-posts`);
        if (res.ok) {
          const posts = await res.json();
          setLinkedInMyPosts(posts);
          console.log(`[DevScout] Loaded ${posts.length} LinkedIn posts`);

          // Auto-fetch comments for all posts
          if (posts.length > 0) {
            setLinkedInCommentsLoading(true);
            for (const post of posts) {
              try {
                const commentsRes = await fetch(`${API_BASE}/api/linkedin/my-posts/${post.id}/comments`);
                const commentsData = await commentsRes.json();
                setLinkedInExpandedPosts(prev => ({
                  ...prev,
                  [post.id]: { loading: false, comments: commentsData.comments || [], error: commentsData.error }
                }));
              } catch (err) {
                console.error(`Failed to fetch comments for post ${post.id}:`, err);
              }
            }
            setLinkedInCommentsLoading(false);
          }
        }
      } catch (err) {
        console.error('Failed to auto-fetch LinkedIn posts:', err);
      } finally {
        setLinkedInMyPostsLoading(false);
      }
    };

    fetchMyPosts();
  }, [linkedInAuth?.is_authenticated]);

  // Persist LinkedIn dismissed comments
  useEffect(() => {
    savePersistedData('linkedin_dismissed_comments', linkedInDismissedComments);
  }, [linkedInDismissedComments]);

  // Persist LinkedIn leads
  useEffect(() => {
    savePersistedData('linkedin_leads', linkedInLeads);
  }, [linkedInLeads]);

  // Persist LinkedIn engagement
  useEffect(() => {
    savePersistedData('linkedin_engagement', linkedInEngagement);
  }, [linkedInEngagement]);

  // Load dismissed LinkedIn engagement posts from backend (cross-device sync)
  useEffect(() => {
    const loadDismissed = async () => {
      try {
        const ids = await getDismissedIds('linkedin_engagement');
        setDismissedLinkedInEngagement(ids);
      } catch (err) {
        console.error('Failed to load dismissed LinkedIn engagement:', err);
      }
    };
    loadDismissed();
  }, []);

  // Load dismissed News from backend (cross-device sync)
  useEffect(() => {
    const loadDismissedNews = async () => {
      try {
        const ids = await getDismissedIds('news_item');
        setDismissedNews(ids);
      } catch (err) {
        console.error('Failed to load dismissed news:', err);
      }
    };
    loadDismissedNews();
  }, []);

  // Load dismissed GitHub issues from backend (cross-device sync)
  useEffect(() => {
    const loadDismissedGitHub = async () => {
      try {
        const ids = await getDismissedIds('github_issue');
        setDismissedGitHub(ids);
      } catch (err) {
        console.error('Failed to load dismissed GitHub issues:', err);
      }
    };
    loadDismissedGitHub();
  }, []);

  // Persist GitHub issues
  useEffect(() => {
    savePersistedData('github_issues', githubIssues);
  }, [githubIssues]);

  // Polling for replies
  useEffect(() => {
    const pollInterval = mainTab === 'reddit' && currentSubTab === 'comments' ? 30000 : 60000;

    if (mainTab === 'reddit' && currentSubTab === 'comments') {
      handleFetchReplies();
    }

    pollingInterval.current = setInterval(() => {
      if (respondedPosts.length > 0) {
        handleFetchReplies();
      }
    }, pollInterval);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [mainTab, currentSubTab, respondedPosts.length]);

  const togglePostExpand = (postId) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const dismissReply = async (replyId, replyUrl = null) => {
    // Optimistic update
    setDismissedReplies(prev => [...prev, replyId]);
    // Persist to backend
    try {
      await dismissItem('reddit_reply', 'reddit', replyId, replyUrl);
    } catch (err) {
      console.error('Failed to persist reply dismissal:', err);
      setDismissedReplies(prev => prev.filter(id => id !== replyId));
    }
  };

  const handleGenerateReply = async (reply, parentComment, post) => {
    const replyKey = reply.id;
    setGeneratingReply(prev => ({ ...prev, [replyKey]: true }));
    try {
      // Build thread context: original post -> my comment -> their reply
      const threadContext = [];

      // Add original post as context (if available)
      if (post) {
        threadContext.push({
          author: post.author || 'OP',
          text: (post.title || '') + (post.body ? '\n\n' + post.body : ''),
          is_me: false,
        });
      }

      // Add my comment
      threadContext.push({
        author: 'jessedev_',
        text: parentComment.body,
        is_me: true,
      });

      // Add their reply
      threadContext.push({
        author: reply.author,
        text: reply.body,
        is_me: false,
      });

      const result = await generateReplyResponse({
        subreddit: post?.subreddit || 'unknown',
        myComment: parentComment.body,
        theirReply: reply.body,
        threadContext,
      });
      setGeneratedReplies(prev => ({ ...prev, [replyKey]: result.response }));
    } catch (err) {
      showToast('Failed to generate: ' + err.message, 'error');
    } finally {
      setGeneratingReply(prev => ({ ...prev, [replyKey]: false }));
    }
  };

  // ==============================================================================
  // LINKEDIN HANDLERS
  // ==============================================================================
  const handleLinkedInConnect = async () => {
    try {
      const response = await fetch('/api/linkedin/auth/url');
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      showToast('Failed to start LinkedIn auth: ' + err.message, 'error');
    }
  };

  const handleFetchLinkedInLeads = async () => {
    setLinkedInLeadsFetching(true);
    setLinkedInLeads([]); // Clear old data
    try {
      const response = await fetch('/api/linkedin/job-leads?limit=50');
      if (response.ok) {
        const data = await response.json();
        setLinkedInLeads(data);
        if (data.length === 0) {
          showToast('No freelance job leads found', 'info');
        }
      } else if (response.status === 503) {
        // VPS blocked by search engines - guide user to Prospects
        showToast('LinkedIn Job Leads unavailable. Use Opportunities tab instead.', 'error');
      } else {
        const error = await response.json();
        showToast('Failed to fetch: ' + (error.detail || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error('Failed to fetch LinkedIn leads:', err);
      showToast('Failed to fetch job leads: ' + err.message, 'error');
    } finally {
      setLinkedInLeadsFetching(false);
    }
  };

  const handleFetchLinkedInEngagement = async () => {
    setLinkedInEngagementFetching(true);
    try {
      // Fetch via Apify with limit of 20
      const result = await fetchLinkedInEngagementViaApify(null, 20);

      if (result.error) {
        showToast('Apify error: ' + result.error, 'error');
        if (result.posts?.length === 0) {
          setLinkedInEngagementFetching(false);
          return;
        }
      }

      const posts = result.posts || [];
      if (posts.length === 0) {
        showToast('No engagement posts found', 'info');
        setLinkedInEngagementFetching(false);
        return;
      }

      // Get dismissed IDs from database
      const dismissedIds = await getDismissedIds('linkedin_engagement');

      // Filter out dismissed posts
      const filteredPosts = posts.filter(post => !dismissedIds.includes(post.source_id));

      // Map 'text' to 'body' for database storage (schema expects body, not text)
      const postsForDb = filteredPosts.map(post => ({
        ...post,
        body: post.text || post.body,
      }));

      // Save to database for cross-device persistence
      if (postsForDb.length > 0) {
        await saveLinkedInEngagement(postsForDb);
      }

      // Keep text field for display compatibility
      setLinkedInEngagement(postsForDb);

      if (filteredPosts.length === 0 && posts.length > 0) {
        showToast('All posts were previously dismissed', 'info');
      }
    } catch (err) {
      console.error('Failed to fetch LinkedIn engagement posts:', err);
      showToast('Failed to fetch: ' + err.message, 'error');
    } finally {
      setLinkedInEngagementFetching(false);
    }
  };

  // Generate response for a LinkedIn engagement post
  const handleGenerateLinkedInEngagementResponse = async (post) => {
    const postId = post.source_id;
    setGeneratingLinkedInEngagement(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await fetch('/api/linkedin/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_text: post.body || post.text,
          author: post.author,
          author_headline: post.author_headline,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setLinkedInEngagementResponses(prev => ({ ...prev, [postId]: data.response }));
      } else {
        showToast('Failed to generate response', 'error');
      }
    } catch (err) {
      console.error('Failed to generate LinkedIn response:', err);
      showToast('Failed to generate: ' + err.message, 'error');
    } finally {
      setGeneratingLinkedInEngagement(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Post a comment directly to LinkedIn (with DevScout-based tracking)
  const handlePostLinkedInComment = async (post) => {
    const postId = post.source_id;
    const commentText = linkedInEngagementResponses[postId];

    if (!commentText || !commentText.trim()) {
      showToast('Generate a response first', 'info');
      return;
    }

    setPostingLinkedInComment(prev => ({ ...prev, [postId]: true }));
    try {
      // Pass post context for DevScout-based reply tracking
      const postText = post.body || post.text || '';
      const postAuthor = post.author || '';
      await postLinkedInComment(post.url, commentText, postText, postAuthor);
      // Success - remove from list and persist as responded
      setLinkedInEngagement(prev => prev.filter(p => p.source_id !== postId));
      setLinkedInEngagementResponses(prev => {
        const updated = { ...prev };
        delete updated[postId];
        return updated;
      });
      // Persist to backend so it won't show up again on next fetch
      setDismissedLinkedInEngagement(prev => [...prev, postId]);
      await dismissItem('linkedin_engagement', 'linkedin', postId, post.url);
      await updateLinkedInEngagementStatus(postId, 'responded');
    } catch (err) {
      console.error('Failed to post LinkedIn comment:', err);
      showToast('Failed to post comment: ' + err.message, 'error');
    } finally {
      setPostingLinkedInComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Dismiss a LinkedIn engagement post (persisted to backend for cross-device sync)
  const handleDismissLinkedInEngagement = async (post) => {
    const postId = post.source_id;
    // Optimistic update - remove from UI immediately
    setDismissedLinkedInEngagement(prev => [...prev, postId]);
    setLinkedInEngagement(prev => prev.filter(p => p.source_id !== postId));

    // Persist to backend (both dismissals table and update status in persistence table)
    try {
      await dismissItem('linkedin_engagement', 'linkedin', postId, post.url);
      await updateLinkedInEngagementStatus(postId, 'dismissed');
    } catch (err) {
      console.error('Failed to persist dismissal:', err);
      // Rollback on error
      setDismissedLinkedInEngagement(prev => prev.filter(id => id !== postId));
    }
  };

  // Like a LinkedIn post and dismiss it (quick engagement without commenting)
  const handleLikeAndDismissLinkedInEngagement = async (post) => {
    const postId = post.source_id;
    setLikingLinkedInPost(prev => ({ ...prev, [postId]: true }));

    try {
      await likeLinkedInPost(post.url);
      // Success - dismiss the post
      setDismissedLinkedInEngagement(prev => [...prev, postId]);
      setLinkedInEngagement(prev => prev.filter(p => p.source_id !== postId));
      await dismissItem('linkedin_engagement', 'linkedin', postId, post.url);
      await updateLinkedInEngagementStatus(postId, 'dismissed');
    } catch (err) {
      console.error('Failed to like post:', err);
      showToast('Failed to like: ' + err.message, 'error');
    } finally {
      setLikingLinkedInPost(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Clear all dismissed LinkedIn engagement posts
  const handleClearDismissedLinkedInEngagement = async () => {
    try {
      await clearDismissals('linkedin_engagement');
      setDismissedLinkedInEngagement([]);
      showToast('Dismissals cleared', 'success');
    } catch (err) {
      console.error('Failed to clear dismissals:', err);
      showToast('Failed to clear: ' + err.message, 'error');
    }
  };

  // Fetch scheduled posts for a platform
  const handleFetchScheduledPosts = async (platform) => {
    try {
      const response = await fetch(`/api/schedule/?platform=${platform}&status=scheduled`);
      if (response.ok) {
        const data = await response.json();
        if (platform === 'linkedin') {
          setLinkedInScheduledPosts(data);
        } else if (platform === 'reddit') {
          setRedditScheduledPosts(data);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch ${platform} scheduled posts:`, err);
    }
  };

  // Schedule a LinkedIn post
  const handleScheduleLinkedInPost = async () => {
    if (!linkedInPostContent.trim()) {
      showToast('Please enter post content', 'info');
      return;
    }
    setLinkedInScheduling(true);
    try {
      const response = await fetch('/api/schedule/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'linkedin',
          body: linkedInPostContent,
        }),
      });
      if (response.ok) {
        const post = await response.json();
        setLinkedInScheduledPosts(prev => [...prev, post].sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for)));
        setLinkedInPostContent('');
        showToast(`Scheduled for ${new Date(post.scheduled_for + 'Z').toLocaleString()}`, 'success');
      } else {
        const error = await response.json();
        showToast('Failed to schedule: ' + error.detail, 'error');
      }
    } catch (err) {
      showToast('Failed to schedule: ' + err.message, 'error');
    } finally {
      setLinkedInScheduling(false);
    }
  };

  // Generate a LinkedIn post using AI (old method - from template)
  const handleGenerateLinkedInPost = async (ideaTemplate) => {
    setLinkedInPostGenerating(true);
    try {
      const response = await generateLinkedInPost({
        ideaTemplate: ideaTemplate,
        category: linkedInPostCategory,
      });
      setLinkedInPostContent(response);
      setLinkedInPostIdea(ideaTemplate);
    } catch (err) {
      showToast('Failed to generate: ' + err.message, 'error');
    } finally {
      setLinkedInPostGenerating(false);
    }
  };

  // Generate a smart LinkedIn post (AI creates idea + content)
  const handleGenerateSmartLinkedInPost = async (postType = 'random') => {
    setLinkedInPostGenerating(true);
    setLinkedInPostContent('');
    setLinkedInPostIdea('');
    try {
      const result = await generateSmartLinkedInPost(postType);
      setLinkedInPostContent(result.content);
      setLinkedInPostIdea(result.idea);
    } catch (err) {
      showToast('Failed to generate: ' + err.message, 'error');
    } finally {
      setLinkedInPostGenerating(false);
    }
  };

  // Publish a LinkedIn post immediately
  const handlePublishLinkedInPost = async () => {
    if (!linkedInPostContent.trim()) {
      showToast('Please enter post content', 'info');
      return;
    }
    if (!linkedInAuth?.is_authenticated) {
      showToast('Connect LinkedIn first', 'info');
      return;
    }
    setLinkedInPublishing(true);
    try {
      const response = await fetch('/api/linkedin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: linkedInPostContent,
          visibility: 'PUBLIC',
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setLinkedInPostContent('');
        if (result.url) {
          window.open(result.url, '_blank');
        }
        showToast('Post published!', 'success');
      } else {
        const error = await response.json();
        showToast('Failed to publish: ' + error.detail, 'error');
      }
    } catch (err) {
      showToast('Failed to publish: ' + err.message, 'error');
    } finally {
      setLinkedInPublishing(false);
    }
  };

  // Cancel a scheduled post
  const handleCancelScheduledPost = async (postId, platform) => {
    try {
      const response = await fetch(`/api/schedule/${postId}`, { method: 'DELETE' });
      if (response.ok) {
        if (platform === 'linkedin') {
          setLinkedInScheduledPosts(prev => prev.filter(p => p.id !== postId));
        } else if (platform === 'reddit') {
          setRedditScheduledPosts(prev => prev.filter(p => p.id !== postId));
        }
        showToast('Post cancelled', 'success');
      } else {
        showToast('Failed to cancel post', 'error');
      }
    } catch (err) {
      showToast('Failed to cancel: ' + err.message, 'error');
    }
  };

  // Load scheduled posts when switching to schedule tab
  useEffect(() => {
    if (mainTab === 'linkedin' && currentSubTab === 'schedule') {
      handleFetchScheduledPosts('linkedin');
    }
  }, [mainTab, currentSubTab]);

  // ==============================================================================
  // OPPORTUNITIES HANDLERS
  // ==============================================================================
  const handleFetchNews = async () => {
    setNewsFetching(true);
    try {
      const newsData = await fetchNews((current, total, source) => {
        setNewsProgress({ current, total, source });
      });
      // Get dismissed IDs from database
      const dismissedIds = await getDismissedIds('news_item');
      // Filter out previously dismissed items
      const filteredNews = newsData.filter(item => !dismissedIds.includes(item.reddit_id));

      // Save to database for cross-device persistence
      if (filteredNews.length > 0) {
        const newsForDB = filteredNews.map(item => ({
          source_id: item.reddit_id,
          source: item.subreddit || 'news',
          url: item.url,
          title: item.title,
          body: item.body,
          author: item.author,
          score: item.score || 0,
          comments: item.num_comments || 0,
          posted_at: item.created_utc ? new Date(item.created_utc * 1000).toISOString() : null,
        }));
        await saveNewsPosts(newsForDB);
      }

      setNews(filteredNews);
    } catch (err) {
      showToast('Failed to fetch news: ' + err.message, 'error');
    } finally {
      setNewsFetching(false);
      setNewsProgress(null);
    }
  };

  const handleGenerateNewsResponse = async (item) => {
    const itemId = item.reddit_id;
    setGeneratingNews(prev => ({ ...prev, [itemId]: true }));
    try {
      const result = await generateNewsResponse(item.title, item.body, item.subreddit);
      setNewsResponses(prev => ({ ...prev, [itemId]: result.response }));
    } catch (err) {
      showToast('Failed to generate: ' + err.message, 'error');
    } finally {
      setGeneratingNews(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleDismissNews = async (item) => {
    const itemId = item.reddit_id;
    // Optimistic update
    setDismissedNews(prev => [...prev, itemId]);
    setNews(prev => prev.filter(n => n.reddit_id !== itemId));
    // Persist to backend (both dismissals table and update status in persistence table)
    try {
      await dismissItem('news_item', item.subreddit || 'news', itemId, item.url);
      await updateNewsPostStatus(itemId, 'dismissed');
    } catch (err) {
      console.error('Failed to persist news dismissal:', err);
      setDismissedNews(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleClearNews = async () => {
    setNews([]);
    setNewsResponses({});
    try {
      await clearNewsPosts();
      showToast('News cleared', 'success');
    } catch (err) {
      console.error('Failed to clear news from database:', err);
    }
  };

  const handleFetchGitHub = async () => {
    setGithubFetching(true);
    try {
      const issues = await fetchGitHubIssues((current, total, label) => {
        setGithubProgress({ current, total, label });
      });
      // Get dismissed IDs from database
      const dismissedIds = await getDismissedIds('github_issue');
      // Filter out previously dismissed issues
      const filteredIssues = issues.filter(issue =>
        !dismissedIds.includes(issue.id) && !dismissedIds.includes(String(issue.id))
      );

      // Save to database for cross-device persistence
      if (filteredIssues.length > 0) {
        const issuesForDB = filteredIssues.map(issue => ({
          source_id: String(issue.id),
          repo: issue.repo,
          url: issue.url,
          title: issue.title,
          body: issue.body,
          labels: issue.labels?.join(',') || '',
          language: issue.language,
          stars: issue.stars || 0,
          created_at: issue.created_at,
        }));
        await saveGitHubIssues(issuesForDB);
      }

      setGithubIssues(filteredIssues);
    } catch (err) {
      showToast('Failed to fetch GitHub: ' + err.message, 'error');
    } finally {
      setGithubFetching(false);
      setGithubProgress(null);
    }
  };

  const handleClearGitHub = async () => {
    setGithubIssues([]);
    try {
      await clearGitHubIssues();
      showToast('GitHub issues cleared', 'success');
    } catch (err) {
      console.error('Failed to clear GitHub issues from database:', err);
    }
  };

  const handleDismissGitHub = async (issue) => {
    const issueId = issue.id;
    // Optimistic update
    setDismissedGitHub(prev => [...prev, issueId]);
    setGithubIssues(prev => prev.filter(i => i.id !== issueId));
    // Persist to backend (both dismissals table and update status in persistence table)
    try {
      await dismissItem('github_issue', 'github', String(issueId), issue.url);
      await updateGitHubIssueStatus(String(issueId), 'dismissed');
    } catch (err) {
      console.error('Failed to persist GitHub dismissal:', err);
      setDismissedGitHub(prev => prev.filter(id => id !== issueId));
    }
  };

  const handleFetchProspects = async () => {
    setAiScoring(true);
    setAiProspects([]); // Clear old data
    try {
      const result = await fetchAndScoreProspects({
        onFetchProgress: (current, total, source) => {
          setAiScoringProgress({ current, total, source: `Fetching ${source}` });
        },
        onScoreProgress: (current, total, source) => {
          setAiScoringProgress({ current, total, source: `Scoring...` });
        },
        storeLeads: true,
      });
      const prospects = result.leads || [];
      setAiProspects(prospects);
      savePersistedData('ai_prospects', prospects);
      if (prospects.length === 0) {
        showToast('No opportunities found', 'info');
      }
    } catch (err) {
      showToast('Failed to fetch: ' + err.message, 'error');
    } finally {
      setAiScoring(false);
      setAiScoringProgress(null);
    }
  };

  const handleDismissProspect = async (prospectId) => {
    try {
      await deleteProspectAPI(prospectId);
      setAiProspects(prev => prev.filter(p => p.id !== prospectId));
      savePersistedData('ai_prospects', aiProspects.filter(p => p.id !== prospectId));
    } catch (err) {
      showToast('Failed to dismiss: ' + err.message, 'error');
    }
  };

  // ==============================================================================
  // GLOBAL NOTIFICATION
  // ==============================================================================
  const totalUnread = getTotalUnreadReplies();
  const linkedInUnreadComments = getLinkedInUnreadComments();

  useEffect(() => {
    if (totalUnread > lastUnreadCount.current) {
      setNotificationVisible(true);
      if (notificationFadeTimer.current) {
        clearTimeout(notificationFadeTimer.current);
      }
    }
    lastUnreadCount.current = totalUnread;

    // Auto-fade after 10 seconds of no new activity
    if (totalUnread > 0) {
      notificationFadeTimer.current = setTimeout(() => {
        // Keep visible if on another tab
        if (mainTab !== 'reddit' || currentSubTab !== 'comments') {
          // Don't fade
        }
      }, 10000);
    }

    return () => {
      if (notificationFadeTimer.current) {
        clearTimeout(notificationFadeTimer.current);
      }
    };
  }, [totalUnread, mainTab, currentSubTab]);

  const handleNotificationClick = () => {
    setMainTab('reddit');
    setSubTabs(prev => ({ ...prev, reddit: 'comments' }));
    setNotificationVisible(false);
  };

  const handleLinkedInNotificationClick = () => {
    setMainTab('linkedin');
    setSubTabs(prev => ({ ...prev, linkedin: 'comments' }));
  };

  // ==============================================================================
  // RENDER
  // ==============================================================================
  return (
    <div style={{ ...styles.container, background: '#0a0a0a', minHeight: '100vh', color: '#e0e0e0' }} className="devscout-container">
      {/* Global Notification Banner - Reddit */}
      {totalUnread > 0 && notificationVisible && (mainTab !== 'reddit' || currentSubTab !== 'comments') && (
        <div
          style={{
            ...styles.globalNotification,
            background: '#ff4500',
            boxShadow: '0 4px 20px rgba(255, 69, 0, 0.5)',
          }}
          className="devscout-global-notification"
          onClick={handleNotificationClick}
        >
          <RedditIcon />
          {totalUnread} unread Reddit {totalUnread === 1 ? 'reply' : 'replies'}
        </div>
      )}

      {/* Global Notification Banner - LinkedIn */}
      {linkedInUnreadComments > 0 && (mainTab !== 'linkedin' || currentSubTab !== 'comments') && (
        <div
          style={{
            ...styles.globalNotification,
            background: '#0A66C2',
            boxShadow: '0 4px 20px rgba(10, 102, 194, 0.5)',
            top: totalUnread > 0 && notificationVisible ? '50px' : '10px', // Stack below Reddit notification if both active
          }}
          className="devscout-global-notification"
          onClick={handleLinkedInNotificationClick}
        >
          <LinkedInIcon />
          {linkedInUnreadComments} unread LinkedIn {linkedInUnreadComments === 1 ? 'comment' : 'comments'}
        </div>
      )}

      {/* Toast Notification (fade in/out) */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 20px',
            borderRadius: '8px',
            background: toast.type === 'error' ? '#dc2626' : toast.type === 'info' ? '#6366f1' : '#10b981',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 9999,
            animation: 'fadeInUp 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✓'}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={styles.header} className="devscout-header">
        <div style={styles.headerLeft} className="devscout-header-left">
          <div style={styles.logo} className="devscout-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z"/>
              <path d="M12 16c-4.42 0-8-1.79-8-4v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4z"/>
            </svg>
          </div>
          <div>
            <h1 style={styles.title} className="devscout-title">DevScout</h1>
            <div style={styles.subtitle} className="devscout-subtitle">Find opportunities • Build credibility</div>
          </div>
        </div>
        {mainTab === 'reddit' && currentSubTab === 'engagement' && stats && (
          <div style={styles.stats} className="devscout-stats">
            <div style={styles.stat}>
              <div style={styles.statValue} className="devscout-stat-value">{stats.new}</div>
              <div style={styles.statLabel}>New</div>
            </div>
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#3b82f6' }} className="devscout-stat-value">{stats.responded}</div>
              <div style={styles.statLabel}>Responded</div>
            </div>
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#666' }} className="devscout-stat-value">{stats.skipped}</div>
              <div style={styles.statLabel}>Skipped</div>
            </div>
          </div>
        )}
        {mainTab === 'reddit' && currentSubTab === 'comments' && (
          <div style={styles.stats} className="devscout-stats">
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#ff4500' }} className="devscout-stat-value">{totalUnread}</div>
              <div style={styles.statLabel}>Unread</div>
            </div>
            <div style={styles.stat}>
              <div style={{ ...styles.statValue, color: '#666' }} className="devscout-stat-value">{respondedPosts.length}</div>
              <div style={styles.statLabel}>Tracked</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <div style={styles.mainTabs} className="devscout-main-tabs">
        {Object.entries(TAB_CONFIG).map(([tabId, config]) => {
          const IconComponent = PLATFORM_ICONS[tabId];
          return (
          <button
            key={tabId}
            className="devscout-main-tab"
            style={{
              ...styles.mainTab,
              background: mainTab === tabId ? config.color : 'transparent',
              color: mainTab === tabId ? '#fff' : '#777',
              border: 'none',
              boxShadow: mainTab === tabId ? `0 4px 12px ${config.color}40` : 'none',
            }}
            onClick={() => setMainTab(tabId)}
          >
            {IconComponent && <IconComponent />}
            {config.label}
            {tabId === 'reddit' && totalUnread > 0 && (
              <span style={{
                background: mainTab === tabId ? 'rgba(255,255,255,0.25)' : '#ff4500',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600',
              }}>{totalUnread}</span>
            )}
            {tabId === 'linkedin' && linkedInUnreadComments > 0 && (
              <span style={{
                background: mainTab === tabId ? 'rgba(255,255,255,0.25)' : '#0A66C2',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600',
              }}>{linkedInUnreadComments}</span>
            )}
          </button>
        );})}
      </div>

      {/* Sub-Tabs */}
      <div style={styles.subTabs} className="devscout-sub-tabs">
        {TAB_CONFIG[mainTab].subTabs.map((tab) => (
          <button
            key={tab.id}
            className="devscout-sub-tab"
            style={{
              ...styles.subTab,
              ...(currentSubTab === tab.id ? styles.subTabActive : {}),
            }}
            onClick={() => setSubTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============== REDDIT TAB ============== */}

      {/* Reddit > Job Search */}
      {mainTab === 'reddit' && currentSubTab === 'jobs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                Reddit Job Opportunities
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                Freelance and contract opportunities from hiring subreddits
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                data-btn="reddit"
                style={{ ...styles.btn, ...styles.btnReddit }}
                onClick={async () => {
                  setRedditJobsFetching(true);
                  try {
                    // Fetch from hiring subreddits via client-side
                    const hiringSubreddits = ['forhire', 'slavelabour', 'freelance_forhire', 'remotejobs', 'jobbit'];
                    const jobPosts = [];
                    for (const sub of hiringSubreddits) {
                      try {
                        const response = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(`https://www.reddit.com/r/${sub}/new.json?limit=10`)}`);
                        if (response.ok) {
                          const data = await response.json();
                          if (data?.data?.children) {
                            for (const post of data.data.children) {
                              const p = post.data;
                              // Filter for hiring posts
                              const isHiring = p.title?.toLowerCase().includes('[hiring]') ||
                                              p.link_flair_text?.toLowerCase().includes('hiring') ||
                                              p.title?.toLowerCase().includes('looking for') ||
                                              p.title?.toLowerCase().includes('need a');
                              if (isHiring && jobPosts.length < 30) {
                                jobPosts.push({
                                  reddit_id: p.id,
                                  subreddit: p.subreddit,
                                  title: p.title,
                                  body: p.selftext || '',
                                  url: `https://reddit.com${p.permalink}`,
                                  author: p.author,
                                  score: p.score || 0,
                                  num_comments: p.num_comments || 0,
                                  created_utc: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : null,
                                });
                              }
                            }
                          }
                        }
                      } catch (e) {
                        console.warn(`Failed to fetch r/${sub}:`, e);
                      }
                    }
                    if (jobPosts.length > 0) {
                      await saveRedditJobs(jobPosts);
                      const jobs = await getRedditJobs('new');
                      setRedditJobs(jobs);
                    } else {
                      showToast('No hiring posts found', 'info');
                    }
                  } catch (err) {
                    console.error('Reddit jobs fetch error:', err);
                    showToast('Failed to fetch: ' + err.message, 'error');
                  } finally {
                    setRedditJobsFetching(false);
                  }
                }}
                disabled={redditJobsFetching}
              >
                {redditJobsFetching ? 'Fetching...' : '🔍 Fetch Jobs (30)'}
              </button>
              {redditJobs.length > 0 && (
                <button
                  data-btn="secondary"
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={async () => {
                    await clearRedditJobs('dismissed');
                    const jobs = await getRedditJobs('new');
                    setRedditJobs(jobs);
                    showToast('Cleared', 'success');
                  }}
                >
                  Clear Dismissed
                </button>
              )}
            </div>
          </div>

          {redditJobs.length === 0 ? (
            <div style={styles.empty}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
              <div style={{ fontSize: '16px', color: '#888' }}>
                No job opportunities yet. Click "Fetch Jobs" to search hiring subreddits.
              </div>
            </div>
          ) : (
            <div style={styles.postList}>
              {redditJobs.filter(job => job.status === 'new').map((job) => (
                <div key={job.reddit_id || job.id} style={styles.post}>
                  <div style={styles.postHeader}>
                    <a
                      href={`https://reddit.com/r/${job.subreddit}`}
                      target="_blank"
                      rel="noopener"
                      style={styles.subreddit}
                    >
                      r/{job.subreddit}
                    </a>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      {job.score || 0} pts · {job.num_comments || 0} comments
                    </span>
                  </div>
                  <div style={styles.postTitle}>
                    <a href={job.url} target="_blank" rel="noopener" style={styles.postLink}>
                      {job.title}
                    </a>
                  </div>
                  <div style={styles.postMeta}>
                    by u/{job.author}
                  </div>
                  {job.body && (
                    <div style={styles.postBody}>
                      {job.body.slice(0, 500)}{job.body.length > 500 ? '...' : ''}
                    </div>
                  )}
                  <div style={styles.actions}>
                    <button
                      data-btn="reddit"
                      style={{ ...styles.btn, ...styles.btnReddit }}
                      onClick={() => {
                        window.open(job.url + '#comments', '_blank');
                        updateRedditJobStatus(job.reddit_id, 'responded');
                        setRedditJobs(prev => prev.map(j =>
                          j.reddit_id === job.reddit_id ? { ...j, status: 'responded' } : j
                        ));
                      }}
                    >
                      📋 View & Respond
                    </button>
                    <button
                      data-btn="skip"
                      style={{ ...styles.btn, ...styles.btnSkip }}
                      onClick={() => {
                        updateRedditJobStatus(job.reddit_id, 'dismissed');
                        setRedditJobs(prev => prev.map(j =>
                          j.reddit_id === job.reddit_id ? { ...j, status: 'dismissed' } : j
                        ));
                      }}
                    >
                      ✕ Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reddit > Post Schedule */}
      {mainTab === 'reddit' && currentSubTab === 'schedule' && (
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
              let ideas = engageSubreddit
                ? getIdeasForSubreddit(engageSubreddit)
                : getPostIdeas();

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

      {/* Reddit > Engagement */}
      {mainTab === 'reddit' && currentSubTab === 'engagement' && (
        <>
          {/* Custom URL Input */}
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
              onClick={() => handleFetch()}
              disabled={fetching}
            >
              {fetching
                ? fetchProgress
                  ? `Scanning ${fetchProgress.subreddit} (${fetchProgress.current}/${fetchProgress.total})`
                  : 'Fetching...'
                : 'Fetch New Posts'}
            </button>
            {posts.length > 0 && !fetching && (
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={handleClearPosts}
              >
                Clear All
              </button>
            )}
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
                    <a href={post.url} target="_blank" rel="noopener noreferrer" style={styles.postLink}>
                      {post.title}
                    </a>
                  </h3>

                  <div style={styles.postMeta}>
                    u/{post.author} · {formatTime(post.created_utc * 1000)} · {post.num_comments} comments · {post.score} upvotes
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
        </>
      )}

      {/* Reddit > Comments */}
      {mainTab === 'reddit' && currentSubTab === 'comments' && (
        <div>
          <div style={styles.controls} className="devscout-controls">
            <button
              data-btn="primary"
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleFetchReplies}
              disabled={repliesFetching}
            >
              {repliesFetching ? 'Checking...' : 'Check for Replies'}
            </button>
            <div style={styles.pollingIndicator}>
              <div style={styles.pulsingDot} />
              <span>Auto-checking every 30s</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={hideNoActionNeeded}
                onChange={(e) => setHideNoActionNeeded(e.target.checked)}
              />
              Hide no action needed
            </label>
          </div>

          <div style={styles.postList}>
            {respondedPosts.length === 0 ? (
              <div style={styles.empty} className="devscout-empty">
                No responded posts to track. Mark posts as "responded" in the Engagement tab to track replies.
              </div>
            ) : (
              <>
                <div style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>
                  Tracking {respondedPosts.length} responded posts for replies
                </div>
                {respondedPosts
                  .filter((post) => {
                    if (!hideNoActionNeeded) return true;
                    const data = postRepliesData[post.id];
                    if (!data || !data.comments) return false;
                    const unreplied = data.comments.reduce((count, comment) => {
                      if (!comment.replies) return count;
                      return count + comment.replies.filter(r => !r.hasUserReply && !dismissedReplies.includes(r.id)).length;
                    }, 0);
                    return unreplied > 0;
                  })
                  .map((post) => {
                    const data = postRepliesData[post.id] || {};
                    const isExpanded = expandedPosts[post.id];
                    const unrepliedCount = data.comments?.reduce((count, comment) => {
                      if (!comment.replies) return count;
                      return count + comment.replies.filter(r => !r.hasUserReply && !dismissedReplies.includes(r.id)).length;
                    }, 0) || 0;

                    return (
                      <div key={post.id} style={{ marginBottom: '12px' }}>
                        {/* Collapsible Header */}
                        <div
                          style={{
                            ...styles.collapsibleHeader,
                            ...(isExpanded ? styles.collapsibleHeaderExpanded : {}),
                            ...(unrepliedCount > 0 ? styles.needsAttention : {}),
                          }}
                          className="devscout-collapsible-header"
                          onClick={() => togglePostExpand(post.id)}
                        >
                          <div style={{ flex: 1 }}>
                            <a
                              href={`https://reddit.com/r/${post.subreddit}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ ...styles.subreddit, marginRight: '8px' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              r/{post.subreddit}
                            </a>
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ ...styles.postLink, fontSize: '14px', fontWeight: '500' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {post.title?.slice(0, 80)}{post.title?.length > 80 ? '...' : ''}
                            </a>
                            {unrepliedCount > 0 && (
                              <span style={styles.unrepliedBadge}>
                                {unrepliedCount} unreplied
                              </span>
                            )}
                          </div>
                          <svg
                            style={{
                              ...styles.expandIcon,
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div style={styles.collapsibleContent} className="devscout-collapsible-content">
                            {/* Original Post Body */}
                            {post.body && (
                              <div style={styles.postBodyFull}>
                                <div style={{ color: '#666', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase' }}>Original Post</div>
                                {post.body}
                              </div>
                            )}

                            {/* My Comments and Replies */}
                            {data.comments?.map((comment) => (
                              <div key={comment.id} style={{ marginBottom: '16px' }}>
                                {/* My Comment */}
                                <div style={styles.myComment}>
                                  <div style={styles.myCommentLabel}>My Comment</div>
                                  <div style={{ fontSize: '14px', color: '#e0e0e0', whiteSpace: 'pre-wrap' }}>
                                    {comment.body}
                                  </div>
                                </div>

                                {/* Replies to My Comment */}
                                {comment.replies?.filter(r => !dismissedReplies.includes(r.id)).map((reply) => {
                                  const replyKey = reply.id;
                                  const hasGenerated = generatedReplies[replyKey];
                                  const isReplied = reply.hasUserReply;

                                  return (
                                    <div
                                      key={reply.id}
                                      style={{
                                        ...styles.replyItem,
                                        ...(isReplied ? styles.repliedReply : {}),
                                        ...(!isReplied ? styles.unrepliedReply : {}),
                                      }}
                                      className="devscout-reply-card"
                                    >
                                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                                        <strong style={{ color: '#3b82f6' }}>u/{reply.author}</strong>
                                        <span style={{ marginLeft: '8px' }}>{formatTime(reply.created_utc * 1000)}</span>
                                        {isReplied && (
                                          <span style={{ marginLeft: '8px', color: '#22c55e' }}>✓ Replied</span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: '14px', color: '#ccc', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                                        {reply.body}
                                      </div>

                                      {/* Generated Reply */}
                                      {hasGenerated && (
                                        <div style={{ marginBottom: '12px' }}>
                                          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>
                                            Your Reply
                                          </div>
                                          <textarea
                                            value={generatedReplies[replyKey]}
                                            onChange={(e) => setGeneratedReplies((prev) => ({ ...prev, [replyKey]: e.target.value }))}
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
                                              fontFamily: 'inherit',
                                            }}
                                          />
                                        </div>
                                      )}

                                      {/* Actions */}
                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {hasGenerated ? (
                                          <>
                                            <button
                                              data-btn="reddit"
                                              style={{ ...styles.btn, ...styles.btnReddit, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
                                              onClick={async () => {
                                                await navigator.clipboard.writeText(generatedReplies[replyKey]);
                                                const replyUrl = reply.permalink
                                                  ? `https://reddit.com${reply.permalink}`
                                                  : `${post.url}#${reply.id}`;
                                                window.open(replyUrl, '_blank');
                                              }}
                                            >
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                                              Reply on Reddit
                                            </button>
                                            <button
                                              data-btn="regenerate"
                                              style={{ ...styles.btn, ...styles.btnRegenerate, fontSize: '12px', padding: '6px 12px' }}
                                              onClick={() => handleGenerateReply(reply, comment, post)}
                                              disabled={generatingReply[replyKey]}
                                            >
                                              {generatingReply[replyKey] ? 'Regenerating...' : 'Regenerate'}
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            style={styles.generateReplyBtn}
                                            onClick={() => handleGenerateReply(reply, comment, post)}
                                            disabled={generatingReply[replyKey]}
                                          >
                                            {generatingReply[replyKey] ? 'Generating...' : 'Generate Response'}
                                          </button>
                                        )}
                                        <button
                                          data-btn="skip"
                                          style={{ ...styles.btn, ...styles.btnSkip, fontSize: '12px', padding: '6px 12px' }}
                                          onClick={() => dismissReply(reply.id)}
                                        >
                                          Dismiss
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* No Replies Message */}
                                {(!comment.replies || comment.replies.filter(r => !dismissedReplies.includes(r.id)).length === 0) && (
                                  <div style={{ color: '#666', fontSize: '13px', fontStyle: 'italic', marginLeft: '20px' }}>
                                    No replies yet
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* No Comments Found */}
                            {(!data.comments || data.comments.length === 0) && (
                              <div style={{ color: '#666', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                                No comments found for this post. Click "Check for Replies" to scan.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        </div>
      )}

      {/* ============== LINKEDIN TAB ============== */}

      {/* LinkedIn > Job Search */}
      {mainTab === 'linkedin' && currentSubTab === 'jobs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                LinkedIn Job Opportunities
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                Freelance and contract opportunities from LinkedIn posts (via Apify)
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                data-btn="linkedin"
                style={{ ...styles.btn, ...styles.btnLinkedIn }}
                onClick={async () => {
                  setLinkedInLeadsFetching(true);
                  try {
                    const API_BASE = import.meta.env.PROD
                      ? 'https://devscout.junipr.io/api/prospects/linkedin'
                      : 'http://localhost:8004/api/prospects/linkedin';
                    const res = await fetch(API_BASE, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ limit: 30 }),
                    });
                    if (!res.ok) {
                      if (res.status === 402 || res.status === 403) {
                        showToast('Apify quota exceeded. Try Opportunities tab.', 'error');
                      } else if (res.status === 503) {
                        const data = await res.json();
                        showToast(data.detail || 'Service unavailable', 'error');
                      } else {
                        throw new Error(`HTTP ${res.status}`);
                      }
                      return;
                    }
                    const data = await res.json();
                    // Check for any error in response (quota, rate limit, etc.)
                    if (data.error) {
                      showToast(data.error, 'error');
                      return;
                    }
                    if (data.posts && data.posts.length > 0) {
                      // Save to database - backend already transforms to correct format
                      const jobsToSave = data.posts.map(p => ({
                        source_id: p.source_id,
                        url: p.url || '',
                        title: p.title || '',
                        body: p.body || '',
                        author: p.author || '',
                        author_url: p.author_url || '',
                        author_headline: p.author_headline || '',
                        posted_at: p.posted_at || null,
                        reactions: p.reactions || 0,
                        comments: p.comments || 0,
                      }));
                      console.log('[DevScout] Saving', jobsToSave.length, 'LinkedIn jobs to DB');
                      try {
                        const saveResult = await saveLinkedInJobs(jobsToSave);
                        console.log('[DevScout] Save result:', saveResult);
                      } catch (saveErr) {
                        console.error('[DevScout] Save error:', saveErr);
                        showToast('Found jobs but failed to save: ' + saveErr.message, 'error');
                        return;
                      }
                      // Reload from DB
                      const jobs = await getLinkedInJobs('new');
                      setLinkedInLeads(jobs);

                      // Auto-score with AI
                      if (jobs.length > 0) {
                        setScoringLinkedInJobs(true);
                        try {
                          const scoreResult = await scoreLinkedInJobs(jobs);
                          if (scoreResult.scores && scoreResult.scores.length > 0) {
                            const scoresMap = {};
                            scoreResult.scores.forEach(score => {
                              scoresMap[score.source_id] = score;
                            });
                            setLinkedInJobScores(scoresMap);
                          }
                        } catch (scoreErr) {
                          console.error('[DevScout] Score error:', scoreErr);
                          // Don't show error - scoring is optional enhancement
                        } finally {
                          setScoringLinkedInJobs(false);
                        }
                      }
                    } else {
                      showToast('No job posts found', 'info');
                    }
                  } catch (err) {
                    console.error('LinkedIn jobs fetch error:', err);
                    showToast('Failed to fetch: ' + (err.message || 'Unknown error'), 'error');
                  } finally {
                    setLinkedInLeadsFetching(false);
                  }
                }}
                disabled={linkedInLeadsFetching || scoringLinkedInJobs}
              >
                {linkedInLeadsFetching ? (
                  <>
                    <span className="spinner" style={{ marginRight: '6px' }}>⏳</span>
                    Fetching jobs...
                  </>
                ) : scoringLinkedInJobs ? (
                  <>
                    <span className="spinner" style={{ marginRight: '6px' }}>🤖</span>
                    Scoring with AI...
                  </>
                ) : '🔍 Fetch & Score Jobs'}
              </button>
              {linkedInLeads.length > 0 && (
                <button
                  data-btn="secondary"
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={async () => {
                    await clearLinkedInJobs('dismissed');
                    const jobs = await getLinkedInJobs('new');
                    setLinkedInLeads(jobs);
                    setLinkedInJobScores({});
                    showToast('Cleared', 'success');
                  }}
                >
                  Clear Dismissed
                </button>
              )}
            </div>
          </div>

          {linkedInLeads.length === 0 ? (
            <div style={styles.empty}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
              <div style={{ fontSize: '16px', color: '#888' }}>
                No job opportunities yet. Click "Fetch Jobs" to search LinkedIn.
              </div>
            </div>
          ) : (
            <div style={styles.postList}>
              {linkedInLeads
                .filter(job => job.status === 'new')
                // Sort by AI score if available (highest first)
                .sort((a, b) => {
                  const scoreA = linkedInJobScores[a.source_id]?.fit_score || 0;
                  const scoreB = linkedInJobScores[b.source_id]?.fit_score || 0;
                  return scoreB - scoreA;
                })
                .map((job) => {
                  const score = linkedInJobScores[job.source_id];
                  return (
                <div key={job.source_id || job.id} style={styles.post}>
                  <div style={styles.postHeader}>
                    <span style={{ ...styles.subreddit, background: '#0A66C220', color: '#0A66C2' }}>
                      LinkedIn
                    </span>
                    {score && (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: score.fit_score >= 70 ? '#22c55e20' : score.fit_score >= 40 ? '#f59e0b20' : '#ef444420',
                          color: score.fit_score >= 70 ? '#22c55e' : score.fit_score >= 40 ? '#f59e0b' : '#ef4444',
                        }}>
                          {score.fit_score >= 70 ? '🔥 HOT' : score.fit_score >= 40 ? '⚡ WARM' : '❄️ COOL'} {score.fit_score}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          background: score.remote_confidence >= 70 ? '#3b82f620' : '#64748b20',
                          color: score.remote_confidence >= 70 ? '#3b82f6' : '#64748b',
                        }}>
                          🌐 Remote {score.remote_confidence}%
                        </span>
                        {score.project_type && score.project_type !== 'other' && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            background: '#8b5cf620',
                            color: '#8b5cf6',
                          }}>
                            {score.project_type}
                          </span>
                        )}
                      </div>
                    )}
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      {job.reactions || 0} reactions · {job.comments || 0} comments
                    </span>
                  </div>

                  {/* AI Score Details */}
                  {score && (
                    <div style={{
                      padding: '8px 12px',
                      background: '#1a1a2e',
                      borderRadius: '6px',
                      marginTop: '8px',
                      fontSize: '12px',
                    }}>
                      <div style={{ color: '#22c55e', fontWeight: '500', marginBottom: '4px' }}>
                        💡 {score.key_opportunity}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', color: '#888', flexWrap: 'wrap' }}>
                        {score.budget_signal && score.budget_signal !== 'unknown' && (
                          <span>💰 Budget: {score.budget_signal}</span>
                        )}
                        {score.urgency && score.urgency !== 'unknown' && (
                          <span>⏰ {score.urgency.replace('_', ' ')}</span>
                        )}
                        {score.tech_stack && score.tech_stack.length > 0 && (
                          <span>🛠️ {score.tech_stack.slice(0, 3).join(', ')}</span>
                        )}
                      </div>
                      {score.red_flags && score.red_flags.length > 0 && (
                        <div style={{ color: '#ef4444', marginTop: '4px' }}>
                          ⚠️ {score.red_flags.join(' · ')}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={styles.postTitle}>
                    <a href={job.url} target="_blank" rel="noopener" style={styles.postLink}>
                      {job.author || 'LinkedIn Post'}
                    </a>
                  </div>
                  <div style={styles.postMeta}>
                    {job.author && (
                      <a href={job.author_url} target="_blank" rel="noopener" style={{ color: '#0A66C2' }}>
                        {job.author}
                      </a>
                    )}
                    {job.author_headline && <span> · {job.author_headline}</span>}
                  </div>
                  {job.body && (
                    <div style={{
                      ...styles.postBody,
                      whiteSpace: 'pre-wrap',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      padding: '12px',
                      background: '#1a1a1a',
                      borderRadius: '8px',
                      border: '1px solid #333',
                      marginTop: '8px'
                    }}>
                      {job.body}
                    </div>
                  )}
                  <div style={styles.actions}>
                    <button
                      data-btn="linkedin"
                      style={{ ...styles.btn, ...styles.btnLinkedIn }}
                      onClick={() => {
                        window.open(job.url, '_blank');
                        updateLinkedInJobStatus(job.source_id, 'responded');
                        setLinkedInLeads(prev => prev.map(j =>
                          j.source_id === job.source_id ? { ...j, status: 'responded' } : j
                        ));
                      }}
                    >
                      📋 View & Respond
                    </button>
                    <button
                      data-btn="skip"
                      style={{ ...styles.btn, ...styles.btnSkip }}
                      onClick={() => {
                        updateLinkedInJobStatus(job.source_id, 'dismissed');
                        setLinkedInLeads(prev => prev.map(j =>
                          j.source_id === job.source_id ? { ...j, status: 'dismissed' } : j
                        ));
                      }}
                    >
                      ✕ Dismiss
                    </button>
                  </div>
                </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* LinkedIn > Post Schedule */}
      {mainTab === 'linkedin' && currentSubTab === 'schedule' && (
        <div>
          {/* LinkedIn Auth Status Card - hidden until OAuth enabled */}
          {LINKEDIN_OAUTH_ENABLED && (
            <div style={styles.linkedInAuthCard}>
              <div style={styles.linkedInAuthHeader}>
                <div style={styles.linkedInAuthStatus}>
                  <div style={{
                    ...styles.authDot,
                    background: linkedInAuth?.is_authenticated ? '#22c55e' : '#ef4444'
                  }} />
                  <span style={{ fontWeight: '500' }}>
                    {linkedInAuthLoading ? 'Checking...' :
                      linkedInAuth?.is_authenticated
                        ? `Connected as ${linkedInAuth.person_name}`
                        : 'Not connected'}
                  </span>
                </div>
                <button
                  data-btn="linkedin"
                  style={{ ...styles.btn, ...styles.btnLinkedIn }}
                  onClick={handleLinkedInConnect}
                >
                  {linkedInAuth?.is_authenticated ? 'Reconnect' : 'Connect LinkedIn'}
                </button>
              </div>
              {linkedInAuth?.needs_refresh && (
                <div style={{ color: '#f59e0b', fontSize: '13px', marginTop: '8px' }}>
                  ⚠️ Token expires in {linkedInAuth.expires_in_days} days. Please reconnect soon.
                </div>
              )}
            </div>
          )}

          {/* Quick Generate Buttons */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#fff' }}>
              Generate Post
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <button
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: linkedInPostGenerating ? '#333' : 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: linkedInPostGenerating ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onClick={() => handleGenerateSmartLinkedInPost('random')}
                disabled={linkedInPostGenerating}
              >
                🎲 {linkedInPostGenerating ? 'Generating...' : 'Random Post'}
              </button>
              <button
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  background: linkedInPostGenerating ? '#222' : '#1a1a1a',
                  color: '#e0e0e0',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: linkedInPostGenerating ? 'wait' : 'pointer',
                }}
                onClick={() => handleGenerateSmartLinkedInPost('thought_leadership')}
                disabled={linkedInPostGenerating}
              >
                💡 Insight
              </button>
              <button
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  background: linkedInPostGenerating ? '#222' : '#1a1a1a',
                  color: '#e0e0e0',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: linkedInPostGenerating ? 'wait' : 'pointer',
                }}
                onClick={() => handleGenerateSmartLinkedInPost('soft_sell')}
                disabled={linkedInPostGenerating}
              >
                🎯 Soft Sell
              </button>
              <button
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  background: linkedInPostGenerating ? '#222' : '#1a1a1a',
                  color: '#e0e0e0',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: linkedInPostGenerating ? 'wait' : 'pointer',
                }}
                onClick={() => handleGenerateSmartLinkedInPost('engagement')}
                disabled={linkedInPostGenerating}
              >
                ❓ Question
              </button>
              <button
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  background: linkedInPostGenerating ? '#222' : '#1a1a1a',
                  color: '#e0e0e0',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: linkedInPostGenerating ? 'wait' : 'pointer',
                }}
                onClick={() => handleGenerateSmartLinkedInPost('story')}
                disabled={linkedInPostGenerating}
              >
                📖 Story
              </button>
              <button
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  background: linkedInPostGenerating ? '#222' : '#1a1a1a',
                  color: '#e0e0e0',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: linkedInPostGenerating ? 'wait' : 'pointer',
                }}
                onClick={() => handleGenerateSmartLinkedInPost('quick_tip')}
                disabled={linkedInPostGenerating}
              >
                ⚡ Quick Tip
              </button>
            </div>
          </div>

          {/* Browse Templates (Collapsible) */}
          <div style={{ marginBottom: '16px' }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 0',
              }}
              onClick={() => setLinkedInShowTemplates(!linkedInShowTemplates)}
            >
              {linkedInShowTemplates ? '▼' : '▶'} Browse Templates ({Object.values(LINKEDIN_POST_TEMPLATES).flat().length} ideas)
            </button>

            {linkedInShowTemplates && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', marginTop: '12px' }}>
                  {getLinkedInPostCategories().map((cat) => (
                    <button
                      key={cat}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: 'none',
                        background: linkedInPostCategory === cat ? '#0A66C2' : '#222',
                        color: linkedInPostCategory === cat ? '#fff' : '#888',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                      onClick={() => setLinkedInPostCategory(cat)}
                    >
                      {cat.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                {/* Post Idea Cards */}
                <div style={{ display: 'grid', gap: '12px', marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                  {(LINKEDIN_POST_TEMPLATES[linkedInPostCategory] || []).map((idea, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#e0e0e0', fontSize: '14px', marginBottom: '4px' }}>
                          {idea.title}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {idea.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: '#0A66C220',
                                color: '#0A66C2',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          background: linkedInPostGenerating ? '#333' : '#0A66C2',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: linkedInPostGenerating ? 'wait' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                        onClick={() => handleGenerateLinkedInPost(idea.title)}
                        disabled={linkedInPostGenerating}
                      >
                        {linkedInPostGenerating ? 'Generating...' : 'Generate'}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Compose Post */}
          <div style={{ ...styles.post, marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                  {linkedInPostContent ? 'Edit & Schedule Post' : 'Compose New Post'}
                </div>
                {linkedInPostIdea && (
                  <div style={{ fontSize: '12px', color: '#0A66C2', marginTop: '4px' }}>
                    💡 {linkedInPostIdea}
                  </div>
                )}
              </div>
              {linkedInPostContent && (
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    fontSize: '12px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                  onClick={() => {
                    setLinkedInPostContent('');
                    setLinkedInPostIdea('');
                  }}
                >
                  ✕ Clear
                </button>
              )}
            </div>
            <textarea
              value={linkedInPostContent}
              onChange={(e) => setLinkedInPostContent(e.target.value)}
              placeholder="Click a button above to generate a post, or write your own..."
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #333',
                background: '#0a0a0a',
                color: '#e0e0e0',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: '1.6',
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              {linkedInPostContent.length}/3000 characters
            </div>
            <div style={{ ...styles.actions, marginTop: '12px' }}>
              {/* Post Now button - hidden until OAuth enabled */}
              {LINKEDIN_OAUTH_ENABLED && (
                <button
                  data-btn="linkedin"
                  style={{ ...styles.btn, ...styles.btnLinkedIn }}
                  onClick={handlePublishLinkedInPost}
                  disabled={linkedInPublishing || !linkedInAuth?.is_authenticated}
                >
                  {linkedInPublishing ? 'Publishing...' : 'Post Now'}
                </button>
              )}
              <button
                data-btn="primary"
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={handleScheduleLinkedInPost}
                disabled={linkedInScheduling || !linkedInPostContent.trim()}
              >
                {linkedInScheduling ? 'Scheduling...' : 'Schedule Post'}
              </button>
              {linkedInPostContent && (
                <button
                  style={{ ...styles.btn, background: '#333', color: '#888' }}
                  onClick={() => setLinkedInPostContent('')}
                >
                  Clear
                </button>
              )}
            </div>
            {!LINKEDIN_OAUTH_ENABLED && (
              <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                Posts will be saved and marked "ready" when scheduled time arrives. Copy and post manually to LinkedIn.
              </div>
            )}
          </div>

          {/* Scheduled Posts */}
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#fff' }}>
            Upcoming Posts ({linkedInScheduledPosts.length})
          </div>
          <div style={styles.postList}>
            {linkedInScheduledPosts.length === 0 ? (
              <div style={styles.empty} className="devscout-empty">
                No scheduled posts. Write a post above and click "Schedule Post" to queue it.
              </div>
            ) : (
              linkedInScheduledPosts.map((post) => (
                <div key={post.id} style={styles.post} className="devscout-post">
                  <div style={styles.postHeader}>
                    <span style={{ ...styles.subreddit, color: '#0A66C2', background: '#0A66C220' }}>
                      {new Date(post.scheduled_for + 'Z').toLocaleDateString()} at {new Date(post.scheduled_for + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{
                      ...styles.score,
                      background: post.status === 'scheduled' ? '#3b82f6' : post.status === 'published' ? '#22c55e' : '#ef4444'
                    }}>
                      {post.status}
                    </span>
                  </div>
                  <div style={{ ...styles.postBody, maxHeight: '100px' }}>
                    {post.body}
                  </div>
                  <div style={styles.actions}>
                    <button
                      data-btn="danger"
                      style={{ ...styles.btn, ...styles.btnDanger, fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => handleCancelScheduledPost(post.id, 'linkedin')}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* LinkedIn > Engagement */}
      {mainTab === 'linkedin' && currentSubTab === 'engagement' && (
        <div>
          <div style={styles.controls} className="devscout-controls">
            <button
              data-btn="primary"
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleFetchLinkedInEngagement}
              disabled={linkedInEngagementFetching}
            >
              {linkedInEngagementFetching ? 'Fetching...' : 'Find Posts to Engage With'}
            </button>
            {dismissedLinkedInEngagement.length > 0 && (
              <button
                data-btn="secondary"
                style={{ ...styles.btn, background: '#374151', color: '#9ca3af' }}
                onClick={handleClearDismissedLinkedInEngagement}
              >
                Clear Dismissed ({dismissedLinkedInEngagement.length})
              </button>
            )}
          </div>

          <div style={styles.postList}>
            {linkedInEngagement.length === 0 ? (
              <div style={styles.empty} className="devscout-empty">
                No LinkedIn posts found. Click "Find Posts to Engage With" to discover developer discussions.
              </div>
            ) : (
              linkedInEngagement.map((post) => (
                <div key={post.source_id} style={styles.post} className="devscout-post">
                  <div style={styles.postHeader}>
                    <span style={{ ...styles.subreddit, color: '#0A66C2', background: '#0A66C220' }}>LinkedIn</span>
                    <span style={styles.score}>{post.reactions} reactions</span>
                  </div>
                  <h3 style={styles.postTitle}>
                    <a href={post.url} target="_blank" rel="noopener noreferrer" style={styles.postLink}>
                      {post.author}
                    </a>
                  </h3>
                  <div style={styles.postMeta}>
                    {post.author_headline} · {post.comments} comments
                  </div>
                  <div style={styles.postBody}>{post.body || post.text}</div>

                  {/* Generated Response Area */}
                  {linkedInEngagementResponses[post.source_id] && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#0A66C2', marginBottom: '6px', fontWeight: '500' }}>
                        Generated Response:
                      </div>
                      <textarea
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: '#1a1a2e',
                          border: '1px solid #0A66C2',
                          borderRadius: '8px',
                          color: '#e5e5e5',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                        }}
                        value={linkedInEngagementResponses[post.source_id]}
                        onChange={(e) => setLinkedInEngagementResponses(prev => ({
                          ...prev,
                          [post.source_id]: e.target.value
                        }))}
                        rows={6}
                      />
                    </div>
                  )}

                  <div style={styles.actions}>
                    {!linkedInEngagementResponses[post.source_id] ? (
                      <>
                        <button
                          data-btn="primary"
                          style={{ ...styles.btn, ...styles.btnPrimary }}
                          onClick={() => handleGenerateLinkedInEngagementResponse(post)}
                          disabled={generatingLinkedInEngagement[post.source_id]}
                        >
                          {generatingLinkedInEngagement[post.source_id] ? 'Generating...' : 'Generate Response'}
                        </button>
                        {LINKEDIN_OAUTH_ENABLED && (
                          <button
                            data-btn="like"
                            style={{
                              ...styles.btn,
                              background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)',
                              color: '#fff',
                              fontWeight: '600',
                            }}
                            onClick={() => handleLikeAndDismissLinkedInEngagement(post)}
                            disabled={likingLinkedInPost[post.source_id]}
                          >
                            {likingLinkedInPost[post.source_id] ? '⏳ Liking...' : '👍 Like'}
                          </button>
                        )}
                        <button
                          data-btn="dismiss"
                          style={{ ...styles.btn, background: '#374151', color: '#9ca3af' }}
                          onClick={() => handleDismissLinkedInEngagement(post)}
                        >
                          Dismiss
                        </button>
                      </>
                    ) : (
                      <>
                        {LINKEDIN_OAUTH_ENABLED && (
                          <button
                            data-btn="linkedin-post"
                            style={{
                              ...styles.btn,
                              background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)',
                              color: '#fff',
                              fontWeight: '600',
                            }}
                            onClick={() => handlePostLinkedInComment(post)}
                            disabled={postingLinkedInComment[post.source_id]}
                          >
                            {postingLinkedInComment[post.source_id] ? '⏳ Posting...' : '💬 Post Comment'}
                          </button>
                        )}
                        <button
                          data-btn="linkedin"
                          style={{ ...styles.btn, ...styles.btnLinkedIn }}
                          onClick={async () => {
                            navigator.clipboard.writeText(linkedInEngagementResponses[post.source_id]);
                            window.open(post.url, '_blank');
                            // Update status to responded in database
                            try {
                              await updateLinkedInEngagementStatus(post.source_id, 'responded', linkedInEngagementResponses[post.source_id]);
                            } catch (err) {
                              console.error('Failed to update status:', err);
                            }
                            // Auto-remove from list
                            setLinkedInEngagement(prev => prev.filter(p => p.source_id !== post.source_id));
                            setLinkedInEngagementResponses(prev => {
                              const updated = { ...prev };
                              delete updated[post.source_id];
                              return updated;
                            });
                          }}
                        >
                          📋 Copy & Open
                        </button>
                        <button
                          data-btn="secondary"
                          style={{ ...styles.btn, background: '#6b21a8', color: '#fff' }}
                          onClick={() => handleGenerateLinkedInEngagementResponse(post)}
                          disabled={generatingLinkedInEngagement[post.source_id]}
                        >
                          {generatingLinkedInEngagement[post.source_id] ? 'Regenerating...' : '🔄 Regenerate'}
                        </button>
                        <button
                          data-btn="dismiss"
                          style={{ ...styles.btn, background: '#374151', color: '#9ca3af' }}
                          onClick={() => handleDismissLinkedInEngagement(post)}
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    {!linkedInEngagementResponses[post.source_id] && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...styles.btn, ...styles.btnLinkedIn, textDecoration: 'none' }}
                      >
                        View on LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* LinkedIn > Comments (Unified Activity Tracking) */}
      {/* Track both: your comments on others' posts AND comments on your posts */}
      {mainTab === 'linkedin' && currentSubTab === 'comments' && (
        <div>
          {/* Unified Status Card & Fetch Button */}
          <div style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #0A66C210 0%, #0A66C205 100%)',
            borderRadius: '8px',
            border: '1px solid #0A66C230',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <LinkedInIcon />
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                  {fetchingAllLinkedIn
                    ? 'Fetching LinkedIn activity...'
                    : `${myLinkedInPosts.filter(p => (p.comments || []).filter(c => !c.is_dismissed).length > 0).length} posts with comments · ${myLinkedInComments.filter(c => c.reply_count > 0).length} comments with replies`}
                </div>
                <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>
                  {(() => {
                    const postUnread = myLinkedInPosts.reduce((acc, p) => acc + (p.comments || []).filter(c => !c.is_read && !c.is_dismissed).length, 0);
                    const totalUnread = myLinkedInCommentsUnread + postUnread;
                    return totalUnread > 0 ? `${totalUnread} unread items to respond to` : 'No new activity to respond to';
                  })()}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {myLinkedInCommentsUnread > 0 && (
                <button
                  style={{
                    ...styles.btn,
                    background: 'transparent',
                    border: '1px solid #333',
                    color: '#888',
                    fontSize: '12px',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onClick={handleMarkAllLinkedInCommentsRead}
                >
                  ✓ Mark All Read
                </button>
              )}
              <button
                style={{
                  ...styles.btn,
                  ...styles.btnLinkedIn,
                  fontSize: '12px',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={handleFetchAllLinkedIn}
                disabled={fetchingAllLinkedIn || myLinkedInCommentsLoading || fetchingLinkedInReplies || fetchingPostComments}
                title="Fetch all LinkedIn activity via Apify"
              >
                {fetchingAllLinkedIn || myLinkedInCommentsLoading || fetchingLinkedInReplies || fetchingPostComments
                  ? '⏳ Fetching...'
                  : '🔄 Fetch All'}
              </button>
            </div>
          </div>

          {/* Unified URL Input - auto-detects post or comment URL */}
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '12px',
            background: '#111',
            borderRadius: '8px',
            border: '1px solid #222',
          }}>
            <input
              type="text"
              placeholder="Paste any LinkedIn URL (your post OR your comment on someone's post)..."
              value={addLinkedInUrl}
              onChange={(e) => setAddLinkedInUrl(e.target.value)}
              style={{
                flex: 1,
                background: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '13px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddLinkedInUrl();
              }}
            />
            <button
              style={{
                ...styles.btn,
                background: '#0A66C2',
                color: '#fff',
                fontSize: '12px',
                padding: '10px 16px',
                whiteSpace: 'nowrap',
              }}
              onClick={handleAddLinkedInUrl}
              disabled={addingLinkedInUrl || !addLinkedInUrl.trim()}
            >
              {addingLinkedInUrl ? '⏳ Adding...' : '+ Track'}
            </button>
          </div>

          <div style={styles.postList}>
            {/* Loading state */}
            {(fetchingAllLinkedIn || myLinkedInCommentsLoading) && myLinkedInComments.length === 0 && myLinkedInPosts.length === 0 ? (
              <div style={{ ...styles.post, textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                  Fetching LinkedIn Activity...
                </div>
                <div style={{ color: '#888' }}>This may take 30-60 seconds</div>
              </div>
            ) : myLinkedInComments.filter(c => c.reply_count > 0).length === 0 && myLinkedInPosts.filter(p => (p.comments || []).filter(c => !c.is_dismissed).length > 0).length === 0 ? (
              <div style={{ ...styles.post, textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                  Track Your LinkedIn Activity
                </div>
                <div style={{ color: '#888', lineHeight: '1.6', maxWidth: '450px', margin: '0 auto', marginBottom: '20px' }}>
                  Paste a LinkedIn URL above to start tracking. You can track:
                  <br /><br />
                  <strong style={{ color: '#aaa' }}>• Your posts</strong> — monitor comments people leave<br />
                  <strong style={{ color: '#aaa' }}>• Your comments</strong> — monitor replies to your engagement
                </div>
                <button
                  style={{ ...styles.btn, ...styles.btnLinkedIn }}
                  onClick={handleFetchAllLinkedIn}
                  disabled={fetchingAllLinkedIn}
                >
                  {fetchingAllLinkedIn ? '⏳ Fetching...' : 'Fetch My Activity'}
                </button>
              </div>
            ) : (
              <>
              {/* ============ MY POSTS SECTION ============ */}
              {myLinkedInPosts.filter(p => (p.comments || []).filter(c => !c.is_dismissed).length > 0).length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #222',
                  }}>
                    <span style={{ fontSize: '16px' }}>📝</span>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#fff' }}>
                      My Posts
                    </h3>
                    <span style={{ color: '#888', fontSize: '12px' }}>
                      ({myLinkedInPosts.filter(p => (p.comments || []).filter(c => !c.is_dismissed).length > 0).length} with comments)
                    </span>
                    {myLinkedInPosts.reduce((acc, p) => acc + (p.comments || []).filter(c => !c.is_read && !c.is_dismissed).length, 0) > 0 && (
                      <span style={{
                        background: '#0A66C2',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#fff',
                      }}>
                        {myLinkedInPosts.reduce((acc, p) => acc + (p.comments || []).filter(c => !c.is_read && !c.is_dismissed).length, 0)} new
                      </span>
                    )}
                  </div>

                  {myLinkedInPosts.filter(p => (p.comments || []).filter(c => !c.is_dismissed).length > 0).map(myPost => {
                    const comments = (myPost.comments || []).filter(c => !c.is_dismissed);
                    const unreadComments = comments.filter(c => !c.is_read);

                    return (
                      <div key={`post-${myPost.id}`} style={{
                        ...styles.post,
                        marginBottom: '16px',
                        border: unreadComments.length > 0 ? '1px solid #0A66C250' : '1px solid #222',
                        background: unreadComments.length > 0
                          ? 'linear-gradient(135deg, #0A66C210 0%, #0a0a0a 100%)'
                          : styles.post.background,
                      }}>
                        {/* Post Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          <LinkedInIcon />
                          <span style={{ color: '#888', fontSize: '12px' }}>Your post</span>
                          {unreadComments.length > 0 && (
                            <span style={{
                              background: '#0A66C2',
                              padding: '3px 10px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#fff',
                            }}>
                              {unreadComments.length} NEW
                            </span>
                          )}
                          <span style={{
                            background: '#333',
                            padding: '3px 10px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            color: '#888',
                          }}>
                            {myPost.comment_count || comments.length} comments
                          </span>
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                            {myPost.post_url && (
                              <a
                                href={myPost.post_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ ...styles.btn, fontSize: '11px', padding: '4px 10px', background: '#0A66C2', color: '#fff', textDecoration: 'none' }}
                              >
                                View
                              </a>
                            )}
                            <button
                              style={{ ...styles.btn, fontSize: '11px', padding: '4px 10px', background: '#333', color: '#888' }}
                              onClick={() => handleDeleteTrackedPost(myPost.id)}
                              title="Stop tracking"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Post Text Preview or URL placeholder */}
                        <div style={{
                          padding: '10px',
                          background: '#111',
                          borderRadius: '6px',
                          marginBottom: '12px',
                          borderLeft: '3px solid #0A66C2',
                          color: '#aaa',
                          fontSize: '13px',
                          lineHeight: '1.5',
                        }}>
                          {myPost.post_text ? (
                            myPost.post_text.length > 200 ? myPost.post_text.substring(0, 200) + '...' : myPost.post_text
                          ) : (
                            <div style={{ color: '#666', fontStyle: 'italic' }}>
                              <a href={myPost.post_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0A66C2' }}>
                                {myPost.post_url?.length > 60 ? myPost.post_url.substring(0, 60) + '...' : myPost.post_url}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Comments on this post */}
                        {comments.length > 0 ? (
                          comments.map(comment => {
                            const replyState = linkedInPostCommentReplies[comment.id] || {};
                            return (
                              <div key={comment.id} style={{
                                background: comment.is_read ? '#0a0a0a' : '#0A66C210',
                                border: comment.is_read ? '1px solid #222' : '1px solid #0A66C250',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '10px',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                  {comment.author_image ? (
                                    <img src={comment.author_image} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                  ) : (
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '12px' }}>
                                      {comment.author_name?.charAt(0) || '?'}
                                    </div>
                                  )}
                                  <div>
                                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>
                                      {comment.author_name || 'Unknown'}
                                      {!comment.is_read && <span style={{ marginLeft: '6px', background: '#0A66C2', padding: '2px 6px', borderRadius: '3px', fontSize: '9px' }}>NEW</span>}
                                    </div>
                                    {comment.author_headline && <div style={{ color: '#666', fontSize: '11px' }}>{comment.author_headline}</div>}
                                  </div>
                                </div>
                                <div style={{ color: '#ddd', fontSize: '13px', lineHeight: '1.5', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>
                                  {comment.comment_text || '(No text)'}
                                </div>

                                {/* Generated response area */}
                                {replyState.expanded && (
                                  <div style={{ background: '#111', borderRadius: '6px', padding: '10px', marginBottom: '10px', border: '1px solid #333' }}>
                                    <textarea
                                      value={replyState.generatedReply || ''}
                                      onChange={(e) => handleUpdateLinkedInPostCommentReply(comment.id, e.target.value)}
                                      placeholder={replyState.generating ? 'Generating...' : 'Your response...'}
                                      disabled={replyState.generating}
                                      style={{ width: '100%', minHeight: '70px', padding: '8px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit' }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                      <button
                                        style={{ ...styles.btn, ...styles.btnLinkedIn, fontSize: '11px', padding: '6px 12px', opacity: replyState.generatedReply ? 1 : 0.5 }}
                                        onClick={() => handleCopyAndOpenLinkedInPostComment(comment)}
                                        disabled={!replyState.generatedReply}
                                      >
                                        📋 Copy & Reply
                                      </button>
                                      <button
                                        style={{ ...styles.btn, background: '#6366f1', color: '#fff', fontSize: '11px', padding: '6px 10px' }}
                                        onClick={() => handleGenerateLinkedInPostCommentReply(comment, myPost)}
                                        disabled={replyState.generating}
                                      >
                                        🔄
                                      </button>
                                      <button
                                        style={{ ...styles.btn, background: '#333', color: '#888', fontSize: '11px', padding: '6px 10px' }}
                                        onClick={() => handleClearLinkedInPostCommentReply(comment.id)}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {!replyState.expanded && (
                                    <button
                                      style={{ ...styles.btn, ...styles.btnPrimary, fontSize: '11px', padding: '6px 10px' }}
                                      onClick={() => handleGenerateLinkedInPostCommentReply(comment, myPost)}
                                      disabled={replyState.generating}
                                    >
                                      {replyState.generating ? '⏳' : '✨'} Generate
                                    </button>
                                  )}
                                  <button
                                    style={{ ...styles.btn, ...styles.btnSuccess, fontSize: '11px', padding: '6px 10px' }}
                                    onClick={() => handleLikeAndDismissPostComment(comment.id)}
                                    disabled={likingPostComment[comment.id]}
                                  >
                                    {likingPostComment[comment.id] ? '⏳' : '👍'} Like
                                  </button>
                                  <button
                                    style={{ ...styles.btn, ...styles.btnSkip, fontSize: '11px', padding: '6px 10px' }}
                                    onClick={() => handleDismissLinkedInPostComment(comment.id)}
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '12px', background: '#111', borderRadius: '6px' }}>
                            No comments yet. Click "Fetch All" to check.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ============ MY COMMENTS SECTION ============ */}
              {myLinkedInComments.filter(c => c.reply_count > 0).length > 0 && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #222',
                  }}>
                    <span style={{ fontSize: '16px' }}>💬</span>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#fff' }}>
                      My Comments
                    </h3>
                    <span style={{ color: '#888', fontSize: '12px' }}>
                      ({myLinkedInComments.filter(c => c.reply_count > 0).length} with replies)
                    </span>
                    {myLinkedInCommentsUnread > 0 && (
                      <span style={{
                        background: '#0A66C2',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#fff',
                      }}>
                        {myLinkedInCommentsUnread} new
                      </span>
                    )}
                  </div>

              {/* Show comments that have replies - now with ACTUAL REPLY CONTENT */}
              {myLinkedInComments.filter(c => c.reply_count > 0).map(comment => {
                // Get replies to this comment (actual reply content from database)
                const replies = (comment.replies || []).filter(r => !r.is_dismissed);
                const unreadReplies = replies.filter(r => !r.is_read);

                return (
                  <div key={comment.id} style={{
                    ...styles.post,
                    marginBottom: '20px',
                    border: unreadReplies.length > 0 ? '1px solid #0A66C250' : '1px solid #222',
                    background: unreadReplies.length > 0
                      ? 'linear-gradient(135deg, #0A66C210 0%, #0a0a0a 100%)'
                      : styles.post.background,
                  }}>
                    {/* Header with badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <LinkedInIcon />
                      <span style={{ color: '#888', fontSize: '12px' }}>Your comment</span>
                      {unreadReplies.length > 0 && (
                        <span style={{
                          background: '#0A66C2',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#fff',
                        }}>
                          {unreadReplies.length} NEW {unreadReplies.length === 1 ? 'REPLY' : 'REPLIES'}
                        </span>
                      )}
                      {replies.length > 0 && replies.length !== unreadReplies.length && (
                        <span style={{
                          background: '#333',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: '#aaa',
                        }}>
                          {replies.length} total
                        </span>
                      )}
                      {replies.length === 0 && comment.reply_count > 0 && (
                        <span style={{
                          background: '#444',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: '#888',
                        }}>
                          {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'} (click Fetch Replies)
                        </span>
                      )}
                    </div>

                    {/* My original comment */}
                    <div style={{
                      color: '#fff',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      marginBottom: '12px',
                      whiteSpace: 'pre-wrap',
                      padding: '12px',
                      background: '#0A66C210',
                      borderRadius: '8px',
                      borderLeft: '3px solid #0A66C2',
                    }}>
                      <div style={{ color: '#0A66C2', fontSize: '11px', marginBottom: '6px', fontWeight: '500' }}>
                        Your comment:
                      </div>
                      {comment.comment_text || '(No text available)'}
                    </div>

                    {/* Post context (collapsible) */}
                    {comment.post_text && (
                      <div style={{
                        background: '#111',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '12px',
                        color: '#666',
                      }}>
                        <span style={{ color: '#888' }}>On post by {comment.post_author || 'Unknown'}:</span>
                        <span style={{ color: '#777', marginLeft: '8px' }}>
                          {comment.post_text.length > 150 ? comment.post_text.substring(0, 150) + '...' : comment.post_text}
                        </span>
                      </div>
                    )}

                    {/* === THE ACTUAL REPLIES - This is what we're responding to! === */}
                    {replies.length > 0 ? (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ color: '#10b981', fontSize: '12px', fontWeight: '600', marginBottom: '12px' }}>
                          💬 Replies to respond to:
                        </div>
                        {replies.map(reply => {
                          const replyState = linkedInCommentReplies[reply.id] || {};
                          return (
                            <div key={reply.id} style={{
                              background: reply.is_read ? '#111' : '#10b98110',
                              border: reply.is_read ? '1px solid #222' : '1px solid #10b98130',
                              borderRadius: '10px',
                              padding: '14px',
                              marginBottom: '12px',
                            }}>
                              {/* Reply author */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                {reply.author_image ? (
                                  <img src={reply.author_image} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                                ) : (
                                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                    👤
                                  </div>
                                )}
                                <div>
                                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>
                                    {reply.author_name || 'Unknown'}
                                  </div>
                                  {reply.author_headline && (
                                    <div style={{ color: '#666', fontSize: '11px' }}>
                                      {reply.author_headline.length > 60 ? reply.author_headline.substring(0, 60) + '...' : reply.author_headline}
                                    </div>
                                  )}
                                </div>
                                {!reply.is_read && (
                                  <span style={{
                                    background: '#10b981',
                                    color: '#fff',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    marginLeft: 'auto',
                                  }}>NEW</span>
                                )}
                              </div>

                              {/* THE ACTUAL REPLY TEXT - This is what we need to respond to! */}
                              <div style={{
                                color: '#e0e0e0',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                whiteSpace: 'pre-wrap',
                                marginBottom: '12px',
                              }}>
                                {reply.reply_text || '(No text available)'}
                              </div>

                              {/* Generated response for this specific reply */}
                              {replyState.expanded && (
                                <div style={{
                                  background: '#0a0a0a',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  marginBottom: '12px',
                                  border: '1px solid #333',
                                }}>
                                  <div style={{ color: '#888', fontSize: '11px', marginBottom: '8px' }}>
                                    Your response (edit before posting):
                                  </div>
                                  <textarea
                                    value={replyState.generatedReply || ''}
                                    onChange={(e) => handleUpdateLinkedInReplyText(reply.id, e.target.value)}
                                    placeholder={replyState.generating ? 'Generating...' : 'Your response will appear here...'}
                                    disabled={replyState.generating}
                                    style={{
                                      width: '100%',
                                      minHeight: '80px',
                                      padding: '10px',
                                      background: '#111',
                                      border: '1px solid #333',
                                      borderRadius: '6px',
                                      color: '#fff',
                                      fontSize: '13px',
                                      lineHeight: '1.5',
                                      resize: 'vertical',
                                      fontFamily: 'inherit',
                                    }}
                                  />
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                    <button
                                      style={{
                                        ...styles.btn,
                                        ...styles.btnSuccess,
                                        fontSize: '12px',
                                        padding: '8px 14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        opacity: replyState.generatedReply && !postingReply[reply.id] ? 1 : 0.5,
                                      }}
                                      onClick={() => handlePostLinkedInReply(reply, comment)}
                                      disabled={!replyState.generatedReply || postingReply[reply.id]}
                                    >
                                      <LinkedInIcon /> {postingReply[reply.id] ? 'Posting...' : 'Post Reply'}
                                    </button>
                                    <button
                                      style={{
                                        ...styles.btn,
                                        background: 'transparent',
                                        border: '1px solid #333',
                                        color: '#888',
                                        fontSize: '12px',
                                        padding: '8px 14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        opacity: replyState.generatedReply ? 1 : 0.5,
                                      }}
                                      onClick={() => handleCopyAndOpenLinkedInReply(reply, comment)}
                                      disabled={!replyState.generatedReply}
                                    >
                                      📋 Copy & Open
                                    </button>
                                    <button
                                      style={{ ...styles.btn, background: '#6366f1', color: '#fff', fontSize: '12px', padding: '8px 12px' }}
                                      onClick={() => handleGenerateLinkedInCommentReply(reply, comment)}
                                      disabled={replyState.generating}
                                    >
                                      🔄 Regenerate
                                    </button>
                                    <button
                                      style={{ ...styles.btn, background: 'transparent', border: '1px solid #333', color: '#888', fontSize: '12px', padding: '8px 12px' }}
                                      onClick={() => handleClearLinkedInReply(reply.id)}
                                    >
                                      ✕ Clear
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Action buttons for this reply */}
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {!replyState.expanded && (
                                  <button
                                    style={{ ...styles.btn, ...styles.btnPrimary, fontSize: '12px', padding: '7px 12px' }}
                                    onClick={() => handleGenerateLinkedInCommentReply(reply, comment)}
                                    disabled={replyState.generating}
                                  >
                                    {replyState.generating ? '⏳ Generating...' : '✨ Generate Response'}
                                  </button>
                                )}
                                <button
                                  style={{ ...styles.btn, ...styles.btnSuccess, fontSize: '11px', padding: '6px 10px' }}
                                  onClick={() => handleLikeAndDismissLinkedInReply(reply.id)}
                                  disabled={likingReply[reply.id]}
                                  title="Like on LinkedIn and dismiss"
                                >
                                  {likingReply[reply.id] ? '⏳' : '👍'} Like
                                </button>
                                <button
                                  style={{ ...styles.btn, ...styles.btnSkip, fontSize: '11px', padding: '6px 10px' }}
                                  onClick={() => handleDismissLinkedInReply(reply.id)}
                                >
                                  Dismiss
                                </button>
                                {reply.reply_link && (
                                  <a
                                    href={reply.reply_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ ...styles.btn, ...styles.btnSecondary, fontSize: '11px', padding: '6px 10px', textDecoration: 'none' }}
                                  >
                                    View on LinkedIn
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* No reply content fetched yet */
                      <div style={{
                        background: '#111',
                        border: '1px dashed #333',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '16px',
                        textAlign: 'center',
                      }}>
                        <div style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>
                          {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'} detected
                        </div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          Click "Fetch" above to load the actual reply content
                        </div>
                      </div>
                    )}

                    {/* Comment footer */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                      paddingTop: '12px',
                      borderTop: '1px solid #222',
                    }}>
                      <div style={{ color: '#666', fontSize: '11px' }}>
                        {comment.last_checked_at && `Checked: ${new Date(comment.last_checked_at).toLocaleDateString()}`}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {comment.comment_link && (
                          <a
                            href={comment.comment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              ...styles.btn,
                              fontSize: '11px',
                              padding: '6px 12px',
                              background: '#0A66C2',
                              color: '#fff',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <LinkedInIcon /> View Thread
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ============== OPPORTUNITIES TAB ============== */}

      {/* Opportunities > All Sources */}
      {mainTab === 'opportunities' && currentSubTab === 'all' && (
        <div>
          <div style={styles.controls} className="devscout-controls">
            <button
              data-btn="primary"
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleFetchProspects}
              disabled={aiScoring}
            >
              {aiScoring
                ? aiScoringProgress
                  ? `Scoring ${aiScoringProgress.source} (${aiScoringProgress.current}/${aiScoringProgress.total})`
                  : 'Fetching...'
                : 'Find Opportunities'}
            </button>
            {aiProspects.length > 0 && (
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={async () => {
                  await clearAllProspects();
                  setAiProspects([]);
                  savePersistedData('ai_prospects', []);
                  showToast('Prospects cleared', 'success');
                }}
              >
                Clear All
              </button>
            )}
          </div>

          <div style={styles.postList}>
            {aiProspects.length === 0 ? (
              <div style={styles.empty} className="devscout-empty">
                No opportunities found. Click "Find Opportunities" to search across HN, Craigslist, Dev.to, Indie Hackers, and GitHub.
              </div>
            ) : (
              aiProspects.map((prospect) => (
                <div key={prospect.id} style={styles.post} className="devscout-post">
                  <div style={styles.postHeader}>
                    <span style={{ ...styles.subreddit, color: '#22c55e', textTransform: 'capitalize' }}>
                      {prospect.source || prospect.platform || 'Unknown'}
                      {prospect.platform_detail && ` · ${prospect.platform_detail}`}
                    </span>
                    <span style={{
                      ...styles.score,
                      background: prospect.fit_score >= 70 ? '#ef4444' : prospect.fit_score >= 40 ? '#f59e0b' : '#3b82f6'
                    }}>
                      {prospect.fit_score >= 70 ? 'HOT' : prospect.fit_score >= 40 ? 'WARM' : 'COOL'} {prospect.fit_score}
                    </span>
                  </div>
                  <h3 style={styles.postTitle}>
                    <a href={prospect.url} target="_blank" rel="noopener noreferrer" style={styles.postLink}>
                      {prospect.title}
                    </a>
                  </h3>
                  <div style={styles.postMeta}>
                    {prospect.author} · {prospect.key_need}
                  </div>
                  {prospect.body && (
                    <div style={styles.postBody}>{prospect.body}</div>
                  )}
                  <div style={styles.actions}>
                    <a
                      href={prospect.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...styles.btn, ...styles.btnPrimary, textDecoration: 'none' }}
                    >
                      View Opportunity
                    </a>
                    <button
                      data-btn="skip"
                      style={{ ...styles.btn, ...styles.btnSkip }}
                      onClick={() => handleDismissProspect(prospect.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Opportunities > Tech News */}
      {mainTab === 'opportunities' && currentSubTab === 'tech' && (
        <div>
          <div style={styles.controls} className="devscout-controls">
            <button
              data-btn="primary"
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
            {news.length > 0 && (
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={handleClearNews}
              >
                Clear All
              </button>
            )}
          </div>

          <div style={styles.postList}>
            {news.length === 0 ? (
              <div style={styles.empty} className="devscout-empty">
                No news loaded. Click "Fetch Tech News" to scan HN, Lobsters, Dev.to & Hashnode.
              </div>
            ) : (
              news.map((item) => (
                <div key={item.reddit_id} style={styles.post} className="devscout-post">
                  <div style={styles.postHeader}>
                    <span style={{ ...styles.subreddit, color: '#f97316' }}>{item.subreddit}</span>
                    <span style={styles.score}>Score: {Math.round(item.relevance_score)}</span>
                  </div>
                  <h3 style={styles.postTitle}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={styles.postLink}>
                      {item.title}
                    </a>
                  </h3>
                  <div style={styles.postMeta}>
                    {item.author} · {formatTime(new Date(item.created_utc * 1000).toISOString())} · {item.num_comments} comments
                  </div>
                  {item.body && (
                    <div style={styles.postBody}>{item.body}</div>
                  )}

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
                        }}
                      />
                      <div style={styles.actions}>
                        <button
                          data-btn="primary"
                          style={{ ...styles.btn, ...styles.btnPrimary }}
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
                          onClick={() => handleDismissNews(item)}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.actions}>
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
                        style={{ ...styles.btn, ...styles.btnSecondary, textDecoration: 'none' }}
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
        </div>
      )}

      {/* Opportunities > GitHub */}
      {mainTab === 'opportunities' && currentSubTab === 'github' && (
        <div>
          <div style={styles.controls} className="devscout-controls">
            <button
              data-btn="primary"
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
            {githubIssues.length > 0 && (
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={handleClearGitHub}
              >
                Clear All
              </button>
            )}
          </div>

          <div style={styles.postList}>
            {githubIssues.length === 0 ? (
              <div style={styles.empty} className="devscout-empty">
                No GitHub issues found. Click "Find Contribution Opportunities" to search for good first issues.
              </div>
            ) : (
              githubIssues.map((issue) => (
                <div key={issue.id} style={styles.post} className="devscout-post">
                  <div style={styles.postHeader}>
                    <a
                      href={issue.repository_url?.replace('api.github.com/repos', 'github.com')}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.repoLink}
                    >
                      {issue.repository_url?.split('/').slice(-2).join('/')}
                    </a>
                    <span style={styles.score}>#{issue.number}</span>
                  </div>
                  <h3 style={styles.postTitle}>
                    <a href={issue.html_url} target="_blank" rel="noopener noreferrer" style={styles.postLink}>
                      {issue.title}
                    </a>
                  </h3>
                  <div style={styles.issueLabels}>
                    {issue.labels?.map((label) => (
                      <span
                        key={label.name}
                        style={{
                          ...styles.issueLabel,
                          background: `#${label.color}20`,
                          color: `#${label.color}`,
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                  <div style={styles.postMeta}>
                    by {issue.user?.login} · {issue.comments} comments
                  </div>
                  {issue.body && (
                    <div style={styles.postBody}>{issue.body?.slice(0, 500)}...</div>
                  )}
                  <div style={styles.actions}>
                    <button
                      data-btn="primary"
                      style={{ ...styles.btn, ...styles.btnClaude }}
                      onClick={async () => {
                        const text = formatIssueForClaude(issue);
                        await navigator.clipboard.writeText(text);
                        setCopied((prev) => ({ ...prev, [`gh_${issue.id}`]: true }));
                        setTimeout(() => setCopied((prev) => ({ ...prev, [`gh_${issue.id}`]: false })), 2000);
                      }}
                    >
                      {copied[`gh_${issue.id}`] ? 'Copied!' : 'Copy for Claude'}
                    </button>
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...styles.btn, ...styles.btnSecondary, textDecoration: 'none' }}
                    >
                      View Issue
                    </a>
                    <button
                      data-btn="skip"
                      style={{ ...styles.btn, ...styles.btnSkip }}
                      onClick={() => handleDismissGitHub(issue)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
