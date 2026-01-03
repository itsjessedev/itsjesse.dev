/**
 * Prospects Service - Integrates client-side scraping with backend AI scoring
 *
 * Flow:
 * 1. Client fetches raw prospects from multiple sources
 * 2. Apply quick client-side filter (loose - catch all possibles)
 * 3. Send promising prospects to backend for AI scoring
 * 4. Backend returns scored/qualified leads
 * 5. Optionally store qualified leads in database
 */

import { API_BASE } from './sources.js';
import { fetchAllProspects, fetchQuickProspects } from './scrapers/index.js';

/**
 * Score a batch of prospects using the backend AI
 *
 * @param {Object[]} prospects Array of raw prospect objects
 * @returns {Promise<Object>} Scoring results
 */
export async function scoreProspects(prospects) {
  try {
    const response = await fetch(`${API_BASE}/api/prospects/score-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospects }),
    });

    if (!response.ok) {
      throw new Error(`AI scoring failed: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error scoring prospects:', err);
    throw err;
  }
}

/**
 * Store a qualified prospect in the database
 */
export async function storeProspect(prospect) {
  try {
    const response = await fetch(`${API_BASE}/api/prospects/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prospect),
    });

    if (response.status === 409) {
      // Already exists, not an error
      return { exists: true };
    }

    if (!response.ok) {
      throw new Error(`Store failed: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error storing prospect:', err);
    throw err;
  }
}

/**
 * Store multiple prospects at once
 */
export async function storeProspectsBatch(prospects) {
  try {
    const response = await fetch(`${API_BASE}/api/prospects/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prospects),
    });

    if (!response.ok) {
      throw new Error(`Batch store failed: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error storing prospects batch:', err);
    throw err;
  }
}

/**
 * Get stored prospects from database
 */
export async function getStoredProspects(filters = {}) {
  try {
    const params = new URLSearchParams();

    if (filters.status) params.set('status', filters.status);
    if (filters.source) params.set('source', filters.source);
    if (filters.is_lead !== undefined) params.set('is_lead', filters.is_lead);
    if (filters.min_fit_score) params.set('min_fit_score', filters.min_fit_score);
    if (filters.limit) params.set('limit', filters.limit);
    if (filters.offset) params.set('offset', filters.offset);

    const response = await fetch(`${API_BASE}/api/prospects/?${params}`);

    if (!response.ok) {
      throw new Error(`Get prospects failed: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error getting prospects:', err);
    throw err;
  }
}

/**
 * Get prospect statistics
 */
export async function getProspectStats() {
  try {
    const response = await fetch(`${API_BASE}/api/prospects/stats`);

    if (!response.ok) {
      throw new Error(`Get stats failed: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error getting prospect stats:', err);
    throw err;
  }
}

/**
 * Update a prospect's status or notes
 */
export async function updateProspect(prospectId, updates) {
  try {
    const response = await fetch(`${API_BASE}/api/prospects/${prospectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Update failed: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error updating prospect:', err);
    throw err;
  }
}

/**
 * Delete a prospect
 */
export async function deleteProspect(prospectId) {
  try {
    const response = await fetch(`${API_BASE}/api/prospects/${prospectId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error deleting prospect:', err);
    throw err;
  }
}

/**
 * Clear all prospects from database
 */
export async function clearAllProspects(keepContacted = false) {
  try {
    const response = await fetch(
      `${API_BASE}/api/prospects/clear/all?keep_contacted=${keepContacted}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      throw new Error(`Clear failed: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error('Error clearing prospects:', err);
    throw err;
  }
}

// =============================================================================
// FULL PIPELINE FUNCTIONS
// =============================================================================

/**
 * Quick client-side filter to reduce noise before AI scoring
 *
 * This is a loose filter - we want to catch all possibles and let AI decide.
 */
function quickFilter(prospects) {
  return prospects.filter(prospect => {
    const text = `${prospect.title} ${prospect.body || ''}`.toLowerCase();

    // Skip obvious non-leads
    const skipPatterns = [
      // Competitors offering services
      '[for hire]', 'for hire', 'available for hire', 'hire me',
      'my services', 'i will build', 'i will create',
      'looking for clients', 'seeking clients',
      // Pure discussion/advice posts
      'my experience with', 'tips for', 'how i learned',
      'unpopular opinion', 'rant', 'psa:',
    ];

    if (skipPatterns.some(p => text.includes(p))) {
      return false;
    }

    return true;
  });
}

/**
 * Fetch and score prospects - the main pipeline
 *
 * @param {Object} options Configuration
 * @param {Function} options.onFetchProgress Progress callback for fetching
 * @param {Function} options.onScoreProgress Progress callback for scoring
 * @param {Function} options.onPartialResults Callback with partial results
 * @param {boolean} options.quickMode Only fetch Reddit (faster)
 * @param {boolean} options.storeLeads Store qualified leads in database
 * @returns {Promise<Object>} Results with leads and stats
 */
export async function fetchAndScoreProspects(options = {}) {
  const {
    onFetchProgress = null,
    onScoreProgress = null,
    onPartialResults = null,
    quickMode = false,
    storeLeads = false,
  } = options;

  // Step 1: Fetch raw prospects
  if (onFetchProgress) onFetchProgress(0, 100, 'Starting fetch...');

  const rawProspects = quickMode
    ? await fetchQuickProspects(onFetchProgress)
    : await fetchAllProspects({ onProgress: onFetchProgress });

  if (onFetchProgress) onFetchProgress(100, 100, `Fetched ${rawProspects.length} raw prospects`);

  // Step 2: Quick client-side filter
  const filtered = quickFilter(rawProspects);
  console.log(`[Prospects] Filtered ${rawProspects.length} → ${filtered.length}`);

  if (filtered.length === 0) {
    return {
      total_processed: 0,
      leads_found: 0,
      results: [],
      leads: [],
    };
  }

  // Step 3: Send to backend for AI scoring (in batches)
  const BATCH_SIZE = 20;
  const allResults = [];
  const allLeads = [];

  for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
    const batch = filtered.slice(i, i + BATCH_SIZE);

    if (onScoreProgress) {
      const progress = Math.min(100, Math.round((i / filtered.length) * 100));
      onScoreProgress(progress, 100, `Scoring batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
    }

    try {
      const result = await scoreProspects(batch);

      allResults.push(...(result.results || []));
      allLeads.push(...(result.leads || []));

      // Report partial results
      if (onPartialResults) {
        onPartialResults({
          total_processed: allResults.length,
          leads_found: allLeads.length,
          results: allResults,
          leads: allLeads,
        });
      }
    } catch (err) {
      console.error(`Error scoring batch at ${i}:`, err);
    }

    // Rate limiting
    if (i + BATCH_SIZE < filtered.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  if (onScoreProgress) onScoreProgress(100, 100, 'Scoring complete!');

  // Step 4: Optionally store qualified leads
  if (storeLeads && allLeads.length > 0) {
    try {
      await storeProspectsBatch(allLeads);
      console.log(`[Prospects] Stored ${allLeads.length} leads in database`);
    } catch (err) {
      console.error('Error storing leads:', err);
    }
  }

  return {
    total_processed: allResults.length,
    leads_found: allLeads.length,
    results: allResults,
    leads: allLeads,
  };
}

export default {
  scoreProspects,
  storeProspect,
  storeProspectsBatch,
  getStoredProspects,
  getProspectStats,
  updateProspect,
  deleteProspect,
  clearAllProspects,
  fetchAndScoreProspects,
};
