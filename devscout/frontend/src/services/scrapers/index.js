/**
 * Scrapers Index - Unified interface for all prospect scrapers
 *
 * This module provides a single entry point for fetching prospects
 * from all configured sources. Results are then sent to the backend
 * for AI scoring and storage.
 */

import { getAllRedditSearches, getTotalSourceCount } from '../sources.js';
import { batchSearchReddit } from './reddit.js';
import { fetchAllHN } from './hackernews.js';
import { fetchAllCraigslist } from './craigslist.js';
import { fetchRemoteOK } from './remoteok.js';
import { fetchDevTo } from './devto.js';
import { fetchIndieHackers } from './indiehackers.js';
import { fetchAllGitHub } from './github.js';
import { fetchAllLinkedIn } from './linkedin.js';
import { fetchWellfound } from './wellfound.js';

// Re-export individual scrapers
export { batchSearchReddit } from './reddit.js';
export { fetchAllHN } from './hackernews.js';
export { fetchAllCraigslist } from './craigslist.js';
export { fetchRemoteOK } from './remoteok.js';
export { fetchDevTo } from './devto.js';
export { fetchIndieHackers } from './indiehackers.js';
export { fetchAllGitHub } from './github.js';
export { fetchAllLinkedIn } from './linkedin.js';
export { fetchWellfound } from './wellfound.js';

/**
 * Platform configuration for selective fetching
 */
export const PLATFORMS = {
  reddit: {
    name: 'Reddit',
    enabled: true,
    fetch: async (onProgress) => {
      const searches = getAllRedditSearches();
      return batchSearchReddit(searches, onProgress);
    },
  },
  hackernews: {
    name: 'Hacker News',
    enabled: true,
    fetch: fetchAllHN,
  },
  craigslist: {
    name: 'Craigslist',
    enabled: true,
    fetch: fetchAllCraigslist,
  },
  remoteok: {
    name: 'RemoteOK',
    enabled: false, // Job board, not direct clients
    fetch: fetchRemoteOK,
  },
  devto: {
    name: 'Dev.to',
    enabled: true,
    fetch: fetchDevTo,
  },
  indiehackers: {
    name: 'Indie Hackers',
    enabled: true,
    fetch: fetchIndieHackers,
  },
  github: {
    name: 'GitHub',
    enabled: true,
    fetch: fetchAllGitHub,
  },
  linkedin: {
    name: 'LinkedIn',
    enabled: false, // Job board, not direct clients
    fetch: fetchAllLinkedIn,
  },
  wellfound: {
    name: 'Wellfound',
    enabled: false, // Not yet implemented
    fetch: fetchWellfound,
  },
};

/**
 * Fetch prospects from all enabled platforms
 *
 * @param {Object} options Configuration options
 * @param {Function} options.onProgress Progress callback (current, total, message)
 * @param {Function} options.onPartialResults Callback with partial results
 * @param {string[]} options.platforms Specific platforms to fetch (default: all enabled)
 * @returns {Promise<Object[]>} Array of prospect objects
 */
export async function fetchAllProspects(options = {}) {
  const {
    onProgress = null,
    onPartialResults = null,
    platforms = null,
  } = options;

  const allProspects = [];
  const seenIds = new Set();

  // Determine which platforms to fetch
  const platformsToFetch = platforms
    ? platforms.filter(p => PLATFORMS[p]?.enabled)
    : Object.entries(PLATFORMS)
        .filter(([_, config]) => config.enabled)
        .map(([id]) => id);

  // Calculate total steps for progress
  let totalSteps = 0;
  if (platformsToFetch.includes('reddit')) {
    totalSteps += getAllRedditSearches().length;
  }
  if (platformsToFetch.includes('hackernews')) totalSteps += 4;
  if (platformsToFetch.includes('craigslist')) totalSteps += 10;
  if (platformsToFetch.includes('remoteok')) totalSteps += 1;
  if (platformsToFetch.includes('devto')) totalSteps += 1;
  if (platformsToFetch.includes('indiehackers')) totalSteps += 1;
  if (platformsToFetch.includes('github')) totalSteps += 2;

  let currentStep = 0;

  // Helper to add prospects and dedupe
  const addProspects = (prospects) => {
    for (const prospect of prospects) {
      if (!seenIds.has(prospect.source_id)) {
        seenIds.add(prospect.source_id);
        allProspects.push(prospect);
      }
    }
  };

  // Fetch from each platform
  for (const platformId of platformsToFetch) {
    const platform = PLATFORMS[platformId];

    try {
      // Create a progress wrapper that updates global progress
      const platformProgress = (step, total, message) => {
        currentStep++;
        if (onProgress) {
          onProgress(currentStep, totalSteps, `${platform.name}: ${message}`);
        }
      };

      const prospects = await platform.fetch(platformProgress);
      addProspects(prospects);

      // Report partial results after each platform
      if (onPartialResults) {
        onPartialResults([...allProspects]);
      }
    } catch (err) {
      console.error(`Error fetching from ${platform.name}:`, err);
    }

    // Small delay between platforms
    await new Promise(r => setTimeout(r, 300));
  }

  return allProspects;
}

/**
 * Fetch prospects from a single platform
 */
export async function fetchFromPlatform(platformId, onProgress = null) {
  const platform = PLATFORMS[platformId];

  if (!platform) {
    throw new Error(`Unknown platform: ${platformId}`);
  }

  if (!platform.enabled) {
    console.warn(`Platform ${platformId} is disabled`);
    return [];
  }

  return platform.fetch(onProgress);
}

/**
 * Get list of available platforms
 */
export function getAvailablePlatforms() {
  return Object.entries(PLATFORMS).map(([id, config]) => ({
    id,
    name: config.name,
    enabled: config.enabled,
  }));
}

/**
 * Quick prospect fetch (Reddit only - fastest)
 */
export async function fetchQuickProspects(onProgress = null) {
  const searches = getAllRedditSearches();
  return batchSearchReddit(searches, onProgress);
}

export default {
  PLATFORMS,
  fetchAllProspects,
  fetchFromPlatform,
  fetchQuickProspects,
  getAvailablePlatforms,
};
