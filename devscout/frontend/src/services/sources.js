/**
 * AI-Enhanced Prospect Sources Configuration
 *
 * This file contains all source configurations for the expanded prospect scraping system.
 * 150+ searches across 15+ platforms for maximum lead coverage.
 */

// API base for backend calls
export const API_BASE = import.meta.env.PROD ? '' : '';

// ============================================================================
// TIER 1: REDDIT - DIRECT HIRING SUBREDDITS (15 subreddits)
// ============================================================================

export const REDDIT_HIRING_SUBREDDITS = [
  { subreddit: 'forhire', queries: ['[Hiring]', '[Task]'] },
  { subreddit: 'slavelabour', queries: ['[TASK]', 'offer'] },
  { subreddit: 'jobbit', queries: ['hiring', 'freelance'] },
  { subreddit: 'remotejs', queries: ['hiring', 'contract'] },
  { subreddit: 'remotepython', queries: ['hiring', 'freelance'] },
  { subreddit: 'hiring', queries: ['all'] },
  { subreddit: 'Jobs4Bitcoins', queries: ['[HIRING]'] },
  { subreddit: 'freelance_forhire', queries: ['[Hiring]'] },
  { subreddit: 'DesignJobs', queries: ['developer', 'coder'] },
  { subreddit: 'gameDevJobs', queries: ['programmer', 'developer'] },
  { subreddit: 'ProgrammingBuddies', queries: ['paid', 'hire'] },
  { subreddit: 'techjobs', queries: ['contract', 'freelance'] },
  { subreddit: 'WorkOnline', queries: ['developer', 'programmer'] },
  { subreddit: 'beermoney', queries: ['task', 'coding'] },
  { subreddit: 'signupsforpay', queries: ['developer'] },
];

// ============================================================================
// TIER 1: REDDIT - BUSINESS OWNER SUBREDDITS (20 subreddits)
// ============================================================================

export const REDDIT_BUSINESS_SUBREDDITS = [
  { subreddit: 'Entrepreneur', queries: ['looking for developer', 'need programmer', 'hire coder'] },
  { subreddit: 'startups', queries: ['looking for developer', 'technical cofounder', 'need dev help'] },
  { subreddit: 'smallbusiness', queries: ['need website', 'developer help', 'automate'] },
  { subreddit: 'SaaS', queries: ['looking for developer', 'need technical help', 'mvp'] },
  { subreddit: 'indiehackers', queries: ['looking for', 'need help', 'hire'] },
  { subreddit: 'ecommerce', queries: ['developer', 'shopify expert', 'custom'] },
  { subreddit: 'dropship', queries: ['developer', 'automate', 'custom app'] },
  { subreddit: 'RealEstate', queries: ['developer', 'automation', 'crm'] },
  { subreddit: 'realtors', queries: ['website', 'crm', 'automation'] },
  { subreddit: 'Insurance', queries: ['developer', 'automation', 'api'] },
  { subreddit: 'Accounting', queries: ['automation', 'developer', 'integration'] },
  { subreddit: 'tax', queries: ['automation', 'software', 'developer'] },
  { subreddit: 'legaltech', queries: ['developer', 'automation'] },
  { subreddit: 'HealthIT', queries: ['developer', 'integration', 'api'] },
  { subreddit: 'restaurateur', queries: ['pos', 'automation', 'developer'] },
  { subreddit: 'FulfillmentByAmazon', queries: ['automation', 'developer', 'api'] },
  { subreddit: 'AmazonSeller', queries: ['automation', 'tool', 'developer'] },
  { subreddit: 'eBaySellers', queries: ['automation', 'listing', 'developer'] },
  { subreddit: 'Etsy', queries: ['automation', 'developer', 'custom'] },
  { subreddit: 'WooCommerce', queries: ['developer', 'custom', 'help'] },
];

// ============================================================================
// TIER 1: REDDIT - TOOL-SPECIFIC SUBREDDITS (20 subreddits)
// ============================================================================

export const REDDIT_TOOL_SUBREDDITS = [
  { subreddit: 'Salesforce', queries: ['developer', 'integration', 'help needed', 'consultant'] },
  { subreddit: 'hubspot', queries: ['developer', 'integration', 'custom', 'api'] },
  { subreddit: 'zapier', queries: ['alternative', 'custom', 'developer', 'complex'] },
  { subreddit: 'n8n', queries: ['help', 'developer', 'custom', 'stuck'] },
  { subreddit: 'Airtable', queries: ['developer', 'custom', 'script', 'automation'] },
  { subreddit: 'Notion', queries: ['api', 'integration', 'developer', 'automation'] },
  { subreddit: 'clickup', queries: ['integration', 'automation', 'developer'] },
  { subreddit: 'monday', queries: ['integration', 'developer', 'api'] },
  { subreddit: 'asana', queries: ['integration', 'developer', 'automation'] },
  { subreddit: 'trello', queries: ['power-up', 'developer', 'custom'] },
  { subreddit: 'stripe', queries: ['integration', 'developer', 'help', 'webhook'] },
  { subreddit: 'shopify', queries: ['developer', 'app', 'custom', 'theme'] },
  { subreddit: 'webflow', queries: ['developer', 'custom', 'integration'] },
  { subreddit: 'bubble', queries: ['developer', 'custom', 'plugin'] },
  { subreddit: 'retool', queries: ['help', 'developer', 'custom'] },
  { subreddit: 'supabase', queries: ['help', 'developer', 'integration'] },
  { subreddit: 'firebase', queries: ['help', 'developer', 'functions'] },
  { subreddit: 'aws', queries: ['help needed', 'developer', 'lambda'] },
  { subreddit: 'googlecloud', queries: ['help', 'developer', 'integration'] },
  { subreddit: 'django', queries: ['freelance', 'hire', 'help needed'] },
];

// ============================================================================
// TIER 2: HACKER NEWS
// ============================================================================

export const HACKERNEWS_SOURCES = [
  { type: 'monthly_hiring', name: 'Who is Hiring (Monthly)' },
  { type: 'freelancer', name: 'Freelancer Thread' },
  { type: 'search', query: 'hiring', name: 'HN Search: hiring' },
  { type: 'search', query: 'looking for developer', name: 'HN Search: looking for' },
  { type: 'search', query: 'need developer', name: 'HN Search: need developer' },
];

// ============================================================================
// TIER 3: CRAIGSLIST (10 major cities)
// ============================================================================

export const CRAIGSLIST_CITIES = [
  { code: 'newyork', name: 'New York' },
  { code: 'sfbay', name: 'San Francisco' },
  { code: 'losangeles', name: 'Los Angeles' },
  { code: 'chicago', name: 'Chicago' },
  { code: 'austin', name: 'Austin' },
  { code: 'seattle', name: 'Seattle' },
  { code: 'denver', name: 'Denver' },
  { code: 'boston', name: 'Boston' },
  { code: 'atlanta', name: 'Atlanta' },
  { code: 'miami', name: 'Miami' },
];

// ============================================================================
// TIER 3: REMOTE JOB BOARDS
// ============================================================================

export const REMOTE_JOB_SOURCES = [
  { id: 'remoteok', name: 'RemoteOK', hasApi: true },
  { id: 'weworkremotely', name: 'We Work Remotely', hasApi: false },
  { id: 'remotive', name: 'Remotive', hasApi: true },
  { id: 'workingnomaads', name: 'Working Nomads', hasApi: false },
  { id: 'justremote', name: 'JustRemote', hasApi: false },
  { id: 'remoteco', name: 'Remote.co', hasApi: false },
];

// ============================================================================
// TIER 3: FREELANCE MARKETPLACES
// ============================================================================

export const FREELANCE_SOURCES = [
  { id: 'upwork', name: 'Upwork', type: 'rss' },
  { id: 'freelancer', name: 'Freelancer.com', type: 'scrape' },
  { id: 'guru', name: 'Guru.com', type: 'scrape' },
  { id: 'peopleperhour', name: 'PeoplePerHour', type: 'scrape' },
];

// ============================================================================
// TIER 3: COMMUNITIES
// ============================================================================

export const COMMUNITY_SOURCES = [
  { id: 'indiehackers', name: 'Indie Hackers' },
  { id: 'producthunt', name: 'Product Hunt' },
  { id: 'devto', name: 'Dev.to' },
  { id: 'wellfound', name: 'Wellfound (AngelList)' },
  { id: 'github', name: 'GitHub Discussions' },
];

// ============================================================================
// TIER 3: LINKEDIN (via Apify)
// ============================================================================

export const LINKEDIN_CONFIG = {
  // Apify LinkedIn Jobs Scraper
  apifyActorId: 'practicaltools~linkedin-jobs',
  // Search terms for freelance/contract work
  searchTerms: [
    'freelance developer',
    'contract developer',
    'automation developer',
    'api integration',
    'python freelance',
    'javascript freelance',
  ],
  // Filters
  filters: {
    datePosted: 'past-week',
    workType: ['remote', 'contract'],
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate all Reddit searches (flattens subreddit configs into individual searches)
 */
export function getAllRedditSearches() {
  const searches = [];

  // Hiring subreddits
  for (const config of REDDIT_HIRING_SUBREDDITS) {
    for (const query of config.queries) {
      searches.push({
        subreddit: config.subreddit,
        query: query === 'all' ? '' : query,
        tier: 'hiring',
      });
    }
  }

  // Business owner subreddits
  for (const config of REDDIT_BUSINESS_SUBREDDITS) {
    for (const query of config.queries) {
      searches.push({
        subreddit: config.subreddit,
        query,
        tier: 'business',
      });
    }
  }

  // Tool-specific subreddits
  for (const config of REDDIT_TOOL_SUBREDDITS) {
    for (const query of config.queries) {
      searches.push({
        subreddit: config.subreddit,
        query,
        tier: 'tools',
      });
    }
  }

  return searches;
}

/**
 * Get total source count for progress tracking
 */
export function getTotalSourceCount() {
  const redditSearches = getAllRedditSearches().length;
  const hnSources = HACKERNEWS_SOURCES.length;
  const craigslistCities = CRAIGSLIST_CITIES.length;
  const remoteBoards = REMOTE_JOB_SOURCES.length;
  const freelance = FREELANCE_SOURCES.length;
  const communities = COMMUNITY_SOURCES.length;

  return {
    reddit: redditSearches,
    hackernews: hnSources,
    craigslist: craigslistCities,
    remote: remoteBoards,
    freelance: freelance,
    communities: communities,
    total: redditSearches + hnSources + craigslistCities + remoteBoards + freelance + communities,
  };
}

/**
 * Get sources by platform for selective fetching
 */
export function getSourcesByPlatform(platform) {
  switch (platform) {
    case 'reddit':
      return getAllRedditSearches();
    case 'hackernews':
      return HACKERNEWS_SOURCES;
    case 'craigslist':
      return CRAIGSLIST_CITIES;
    case 'remote':
      return REMOTE_JOB_SOURCES;
    case 'freelance':
      return FREELANCE_SOURCES;
    case 'communities':
      return COMMUNITY_SOURCES;
    default:
      return [];
  }
}
