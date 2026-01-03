import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPosts, fetchStats, fetchFromReddit, fetchNews, submitPosts, generateResponse, generateReplyResponse, generateEngagePost, generateNewsResponse, updatePost, fetchGitHubIssues, formatIssueForClaude, fetchProspects, getProspectSearchCount, getPostsSubredditCount, clearStalePosts, scrapeTrackedPostsForReplies, scrapePostForUserComments, getEngagementSubreddits, getRelatedSubreddits, getIdeasForSubreddit, getPostIdeas, getEngagementCategories, getRandomEngagementSubreddit, ENGAGEMENT_TEMPLATES,
  // AI-Powered Prospects System
  fetchAndScoreProspects, getStoredProspects, getProspectStats, updateProspect as updateProspectAPI, deleteProspect as deleteProspectAPI, clearAllProspects, getAvailablePlatforms, getTotalSourceCount,
  // LinkedIn Post Templates
  LINKEDIN_POST_TEMPLATES, generateLinkedInPost, getLinkedInPostIdeas, getLinkedInPostCategories,
} from './services/api';

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
      { id: 'schedule', label: 'Post Schedule' },
      { id: 'engagement', label: 'Engagement' },
      { id: 'comments', label: 'Comments' },
    ],
    defaultSubTab: 'schedule',
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    subTabs: [
      { id: 'leads', label: 'Job Leads' },
      { id: 'schedule', label: 'Post Schedule' },
      { id: 'engagement', label: 'Engagement' },
      { id: 'comments', label: 'Comments' },
    ],
    defaultSubTab: 'leads',
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
    reddit: 'schedule',    // 'schedule', 'engagement', 'comments'
    linkedin: 'leads',     // 'leads', 'schedule', 'engagement', 'comments'
    opportunities: 'all',  // 'all', 'tech', 'github'
  });

  const currentSubTab = subTabs[mainTab];

  const setSubTab = (tab) => {
    setSubTabs(prev => ({ ...prev, [mainTab]: tab }));
  };

  // ==============================================================================
  // REDDIT TAB STATE
  // ==============================================================================
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
  const [dismissedReplies, setDismissedReplies] = useState(() => loadPersistedData('dismissed_replies', []));
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
  const [linkedInLeads, setLinkedInLeads] = useState(() => loadPersistedData('linkedin_leads'));
  const [linkedInLeadsFetching, setLinkedInLeadsFetching] = useState(false);

  // LinkedIn Engagement - persisted
  const [linkedInEngagement, setLinkedInEngagement] = useState(() => loadPersistedData('linkedin_engagement'));
  const [linkedInEngagementFetching, setLinkedInEngagementFetching] = useState(false);
  const [linkedInEngagementResponses, setLinkedInEngagementResponses] = useState({}); // postId -> response text
  const [generatingLinkedInEngagement, setGeneratingLinkedInEngagement] = useState({}); // postId -> boolean

  // LinkedIn Post Schedule
  const [linkedInScheduledPosts, setLinkedInScheduledPosts] = useState([]);
  const [linkedInPostContent, setLinkedInPostContent] = useState('');
  const [linkedInScheduling, setLinkedInScheduling] = useState(false);
  const [linkedInPublishing, setLinkedInPublishing] = useState(false);
  const [linkedInPostCategory, setLinkedInPostCategory] = useState('lessons_learned');
  const [linkedInPostGenerating, setLinkedInPostGenerating] = useState(false);
  const [redditScheduledPosts, setRedditScheduledPosts] = useState([]);

  // LinkedIn Comments
  const [linkedInComments, setLinkedInComments] = useState([]);

  // ==============================================================================
  // OPPORTUNITIES TAB STATE
  // ==============================================================================
  // AI-Powered Prospects (non-LinkedIn)
  const [aiProspects, setAiProspects] = useState(() => {
    const loaded = loadPersistedData('ai_prospects');
    return Array.isArray(loaded) ? loaded : [];
  });
  const [aiProspectsStats, setAiProspectsStats] = useState(null);
  const [aiScoring, setAiScoring] = useState(false);
  const [aiScoringProgress, setAiScoringProgress] = useState(null);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [prospectNotes, setProspectNotes] = useState({});

  // News (HN, Lobsters, Dev.to, Hashnode)
  const [news, setNews] = useState(() => {
    const loaded = loadPersistedData('news');
    return Array.isArray(loaded) ? loaded : [];
  });
  const [newsFetching, setNewsFetching] = useState(false);
  const [newsProgress, setNewsProgress] = useState(null);
  const [newsResponses, setNewsResponses] = useState({});
  const [generatingNews, setGeneratingNews] = useState({});

  // GitHub Issues - persisted
  const [githubIssues, setGithubIssues] = useState(() => {
    const loaded = loadPersistedData('github_issues');
    return Array.isArray(loaded) ? loaded : [];
  });
  const [githubFetching, setGithubFetching] = useState(false);
  const [githubProgress, setGithubProgress] = useState(null);

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
            alert(`LinkedIn connected successfully as ${data.person_name}!`);
          } else {
            const errorData = await response.json();
            console.error('[LinkedIn OAuth] Callback failed:', errorData);
            alert('Failed to connect LinkedIn: ' + (errorData.detail || 'Unknown error'));
          }
        } catch (err) {
          console.error('[LinkedIn OAuth] Error handling callback:', err);
          alert('Failed to connect LinkedIn: ' + err.message);
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
    } catch {
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

  const handleClearPosts = async () => {
    if (!confirm('Clear all posts? This cannot be undone.')) return;
    try {
      // TODO: Add backend endpoint for clearing posts
      setPosts([]);
      localStorage.removeItem('devscout_checked_posts');
    } catch (err) {
      alert('Failed to clear: ' + err.message);
    }
  };

  const handleAddCustomUrl = async () => {
    if (!customUrlInput.trim()) return;
    setAddingCustomPost(true);
    try {
      // TODO: Implement custom URL adding
      alert('Custom URL adding coming soon!');
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
      alert('Failed to generate: ' + err.message);
    } finally {
      setGeneratingEngage((prev) => ({ ...prev, [ideaKey]: false }));
    }
  };

  // ==============================================================================
  // REDDIT COMMENTS (REPLIES) HANDLERS
  // ==============================================================================
  const getTotalUnreadReplies = useCallback(() => {
    let total = 0;
    Object.values(postRepliesData).forEach(post => {
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
  }, [postRepliesData, dismissedReplies]);

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

  useEffect(() => {
    if (Object.keys(postRepliesData).length > 0) {
      savePersistedData('replies_data', postRepliesData);
    }
  }, [postRepliesData]);

  useEffect(() => {
    savePersistedData('dismissed_replies', dismissedReplies);
  }, [dismissedReplies]);

  // Persist LinkedIn leads
  useEffect(() => {
    savePersistedData('linkedin_leads', linkedInLeads);
  }, [linkedInLeads]);

  // Persist LinkedIn engagement
  useEffect(() => {
    savePersistedData('linkedin_engagement', linkedInEngagement);
  }, [linkedInEngagement]);

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

  const dismissReply = (replyId) => {
    setDismissedReplies(prev => [...prev, replyId]);
  };

  const handleGenerateReply = async (reply, parentComment) => {
    const replyKey = reply.id;
    setGeneratingReply(prev => ({ ...prev, [replyKey]: true }));
    try {
      const result = await generateReplyResponse(parentComment.body, reply.body, reply.author);
      setGeneratedReplies(prev => ({ ...prev, [replyKey]: result.response }));
    } catch (err) {
      alert('Failed to generate: ' + err.message);
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
      alert('Failed to start LinkedIn auth: ' + err.message);
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
          alert('No freelance job leads found. Try again later.');
        }
      } else if (response.status === 503) {
        // VPS blocked by search engines - guide user to Prospects
        alert('LinkedIn Job Leads are temporarily unavailable (VPS IP blocked by search engines). ' +
              'Use the Opportunities → All Sources tab instead - it fetches LinkedIn from your browser.');
      } else {
        const error = await response.json();
        alert('Failed to fetch job leads: ' + (error.detail || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to fetch LinkedIn leads:', err);
      alert('Failed to fetch job leads: ' + err.message);
    } finally {
      setLinkedInLeadsFetching(false);
    }
  };

  const handleFetchLinkedInEngagement = async () => {
    setLinkedInEngagementFetching(true);
    setLinkedInEngagement([]); // Clear old data
    try {
      const response = await fetch('/api/linkedin/engagement?limit=50');
      if (response.ok) {
        const data = await response.json();
        setLinkedInEngagement(data);
        if (data.length === 0) {
          alert('No engagement posts found. Try again later.');
        }
      } else if (response.status === 503) {
        // VPS blocked by search engines - guide user to Prospects
        alert('LinkedIn Engagement is temporarily unavailable (VPS IP blocked by search engines). ' +
              'Use the Opportunities → All Sources tab instead - it fetches LinkedIn from your browser.');
      } else {
        const error = await response.json();
        alert('Failed to fetch engagement posts: ' + (error.detail || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to fetch LinkedIn engagement posts:', err);
      alert('Failed to fetch engagement posts: ' + err.message);
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
          post_text: post.text,
          author: post.author,
          author_headline: post.author_headline,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setLinkedInEngagementResponses(prev => ({ ...prev, [postId]: data.response }));
      } else {
        alert('Failed to generate response');
      }
    } catch (err) {
      console.error('Failed to generate LinkedIn response:', err);
      alert('Failed to generate response: ' + err.message);
    } finally {
      setGeneratingLinkedInEngagement(prev => ({ ...prev, [postId]: false }));
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
      alert('Please enter post content');
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
        alert(`Post scheduled for ${new Date(post.scheduled_for).toLocaleString()}`);
      } else {
        const error = await response.json();
        alert('Failed to schedule: ' + error.detail);
      }
    } catch (err) {
      alert('Failed to schedule post: ' + err.message);
    } finally {
      setLinkedInScheduling(false);
    }
  };

  // Generate a LinkedIn post using AI
  const handleGenerateLinkedInPost = async (ideaTemplate) => {
    setLinkedInPostGenerating(true);
    try {
      const response = await generateLinkedInPost({
        ideaTemplate: ideaTemplate,
        category: linkedInPostCategory,
      });
      setLinkedInPostContent(response);
    } catch (err) {
      alert('Failed to generate post: ' + err.message);
    } finally {
      setLinkedInPostGenerating(false);
    }
  };

  // Publish a LinkedIn post immediately
  const handlePublishLinkedInPost = async () => {
    if (!linkedInPostContent.trim()) {
      alert('Please enter post content');
      return;
    }
    if (!linkedInAuth?.is_authenticated) {
      alert('Please connect your LinkedIn account first');
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
        alert('Post published successfully!');
      } else {
        const error = await response.json();
        alert('Failed to publish: ' + error.detail);
      }
    } catch (err) {
      alert('Failed to publish post: ' + err.message);
    } finally {
      setLinkedInPublishing(false);
    }
  };

  // Cancel a scheduled post
  const handleCancelScheduledPost = async (postId, platform) => {
    if (!confirm('Cancel this scheduled post?')) return;
    try {
      const response = await fetch(`/api/schedule/${postId}`, { method: 'DELETE' });
      if (response.ok) {
        if (platform === 'linkedin') {
          setLinkedInScheduledPosts(prev => prev.filter(p => p.id !== postId));
        } else if (platform === 'reddit') {
          setRedditScheduledPosts(prev => prev.filter(p => p.id !== postId));
        }
      } else {
        alert('Failed to cancel post');
      }
    } catch (err) {
      alert('Failed to cancel: ' + err.message);
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
      setNews(newsData);
      savePersistedData('news', newsData);
    } catch (err) {
      alert('Failed to fetch news: ' + err.message);
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
      alert('Failed to generate: ' + err.message);
    } finally {
      setGeneratingNews(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleDismissNews = (itemId) => {
    setNews(prev => prev.filter(n => n.reddit_id !== itemId));
    savePersistedData('news', news.filter(n => n.reddit_id !== itemId));
  };

  const handleClearNews = () => {
    if (!confirm('Clear all news items?')) return;
    setNews([]);
    setNewsResponses({});
    savePersistedData('news', []);
  };

  const handleFetchGitHub = async () => {
    setGithubFetching(true);
    try {
      const issues = await fetchGitHubIssues((current, total, label) => {
        setGithubProgress({ current, total, label });
      });
      setGithubIssues(issues);
    } catch (err) {
      alert('Failed to fetch GitHub issues: ' + err.message);
    } finally {
      setGithubFetching(false);
      setGithubProgress(null);
    }
  };

  const handleClearGitHub = () => {
    if (!confirm('Clear all GitHub issues?')) return;
    setGithubIssues([]);
  };

  const handleDismissGitHub = (issueId) => {
    setGithubIssues(prev => prev.filter(i => i.id !== issueId));
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
        alert('No opportunities found matching your criteria.');
      }
    } catch (err) {
      alert('Failed to fetch prospects: ' + err.message);
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
      alert('Failed to dismiss: ' + err.message);
    }
  };

  // ==============================================================================
  // GLOBAL NOTIFICATION
  // ==============================================================================
  const totalUnread = getTotalUnreadReplies();

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
                                              onClick={() => handleGenerateReply(reply, comment)}
                                              disabled={generatingReply[replyKey]}
                                            >
                                              {generatingReply[replyKey] ? 'Regenerating...' : 'Regenerate'}
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            style={styles.generateReplyBtn}
                                            onClick={() => handleGenerateReply(reply, comment)}
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

      {/* LinkedIn > Job Leads */}
      {mainTab === 'linkedin' && currentSubTab === 'leads' && (
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

          <div style={styles.controls} className="devscout-controls">
            <button
              data-btn="primary"
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleFetchLinkedInLeads}
              disabled={linkedInLeadsFetching}
            >
              {linkedInLeadsFetching ? 'Fetching...' : 'Find Job Leads'}
            </button>
          </div>

          <div style={styles.postList}>
            {linkedInLeads.length === 0 ? (
              <div style={styles.empty} className="devscout-empty">
                No LinkedIn job leads found. Click "Find Job Leads" to search for people looking for developers.
              </div>
            ) : (
              linkedInLeads.map((lead) => (
                <div key={lead.source_id} style={styles.post} className="devscout-post">
                  <div style={styles.postHeader}>
                    <span style={{ ...styles.subreddit, color: '#0A66C2', background: '#0A66C220' }}>LinkedIn</span>
                    <span style={styles.score}>{lead.reactions} reactions</span>
                  </div>
                  <h3 style={styles.postTitle}>
                    <a href={lead.url} target="_blank" rel="noopener noreferrer" style={styles.postLink}>
                      {lead.title}
                    </a>
                  </h3>
                  <div style={styles.postMeta}>
                    {lead.author} · {lead.author_headline}
                  </div>
                  {lead.body && (
                    <div style={styles.postBody}>{lead.body}</div>
                  )}
                  <div style={styles.actions}>
                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...styles.btn, ...styles.btnLinkedIn, textDecoration: 'none' }}
                    >
                      View on LinkedIn
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
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

          {/* Post Ideas - Category Tabs */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#fff' }}>
              Post Ideas
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
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
            <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
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
          </div>

          {/* Compose Post */}
          <div style={{ ...styles.post, marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#fff' }}>
              {linkedInPostContent ? 'Edit & Schedule Post' : 'Compose New Post'}
            </div>
            <textarea
              value={linkedInPostContent}
              onChange={(e) => setLinkedInPostContent(e.target.value)}
              placeholder="Click 'Generate' on a post idea above, or write your own post here..."
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
                      {new Date(post.scheduled_for).toLocaleDateString()} at {new Date(post.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  <div style={styles.postBody}>{post.text}</div>

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
                      <button
                        data-btn="primary"
                        style={{ ...styles.btn, ...styles.btnPrimary }}
                        onClick={() => handleGenerateLinkedInEngagementResponse(post)}
                        disabled={generatingLinkedInEngagement[post.source_id]}
                      >
                        {generatingLinkedInEngagement[post.source_id] ? 'Generating...' : 'Generate Response'}
                      </button>
                    ) : (
                      <>
                        <button
                          data-btn="linkedin"
                          style={{ ...styles.btn, ...styles.btnLinkedIn }}
                          onClick={() => {
                            navigator.clipboard.writeText(linkedInEngagementResponses[post.source_id]);
                            window.open(post.url, '_blank');
                            // Auto-remove from list
                            setLinkedInEngagement(prev => prev.filter(p => p.source_id !== post.source_id));
                            setLinkedInEngagementResponses(prev => {
                              const updated = { ...prev };
                              delete updated[post.source_id];
                              return updated;
                            });
                          }}
                        >
                          📋 Copy & View on LinkedIn
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
                          onClick={() => setLinkedInEngagement(prev => prev.filter(p => p.source_id !== post.source_id))}
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

      {/* LinkedIn > Comments */}
      {mainTab === 'linkedin' && currentSubTab === 'comments' && (
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
            </div>
          )}

          <div style={styles.postList}>
            <div style={{ ...styles.post, textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                LinkedIn Comment Tracking
              </div>
              <div style={{ color: '#888', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
                {LINKEDIN_OAUTH_ENABLED
                  ? 'Track your LinkedIn comments and replies here. This feature requires LinkedIn API integration which is available after connecting your account.'
                  : 'Comment tracking coming soon. This feature requires LinkedIn API integration.'}
              </div>
              {LINKEDIN_OAUTH_ENABLED && linkedInAuth?.is_authenticated ? (
                <div style={{ marginTop: '20px', color: '#22c55e', fontSize: '14px' }}>
                  ✓ LinkedIn connected. Comment tracking will be available in a future update.
                </div>
              ) : LINKEDIN_OAUTH_ENABLED ? (
                <button
                  data-btn="linkedin"
                  style={{ ...styles.btn, ...styles.btnLinkedIn, marginTop: '20px' }}
                  onClick={handleLinkedInConnect}
                >
                  Connect LinkedIn to Enable
                </button>
              ) : null}
            </div>
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
                onClick={() => {
                  if (confirm('Clear all prospects?')) {
                    clearAllProspects();
                    setAiProspects([]);
                    savePersistedData('ai_prospects', []);
                  }
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
                    <span style={{ ...styles.subreddit, color: '#22c55e' }}>{prospect.platform}</span>
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
                          onClick={() => handleDismissNews(item.reddit_id)}
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
                      onClick={() => handleDismissGitHub(issue.id)}
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
