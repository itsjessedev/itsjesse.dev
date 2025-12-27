# DevScout - Project Instructions

## Project Overview

DevScout is a credibility-building tool for developers. It finds relevant posts across Reddit, Hacker News, Lobsters, and GitHub where you can provide helpful responses or make contributions.

**URL:** https://devscout.junipr.io
**Location:** ~/itsjesse.dev/devscout/
**VPS Path:** /home/deploy/devscout/
**Port:** 8004
**Reddit Username:** u/jessedev_

## Features

### Posts Tab (Reddit Only)
- Scans 75+ subreddits for automation/integration keywords
- Generates AI responses with friendly mentor tone
- Client-side fetching (bypasses VPS IP blocks)
- Clears stale posts on fetch (keeps responded)
- Subreddit badges link to actual subreddit

### News Tab (HN + Lobsters)
- Separate tab for Hacker News and Lobsters
- "Copy for Claude" button for response help
- Same keyword matching as Reddit

### GitHub Tab
- Finds `good-first-issue`, `help-wanted` labeled issues
- Searches Python, JavaScript, TypeScript, Go, Rust repos
- "Copy for Claude" button formats context for contribution
- Dismiss button to skip issues

### Prospects Tab (Outreach)
- Search-based Reddit scraping for hot leads
- Scores prospects by keyword relevance (HOT/WARM/COOL)
- Filters out competitor posts
- Sorted by score (hottest first)

### Replies Tab (Reply Tracking) - Refactored 2025-12-27
- Auto-scrapes responded posts for user's comments (u/jessedev_)
- Shows full thread structure: post → my comment → replies → branches
- Collapsible UI for each tracked post
- Animated red glow for posts needing attention
- "Generate Response" button for unreplied comments (uses Gemini via OpenRouter)
- Editable text area for generated responses
- Real-time polling: 30s on Replies tab, 60s background on all other tabs
- Global notification badge visible on ALL pages when new replies exist
- Click notification → auto-navigate to Replies and scroll to first unreplied
- Custom URL input to manually add posts to track

### Engage Tab (Community Content) - Updated 2025-12-27
- Post idea templates for starting discussions
- Categories: experience_sharing, questions_discussions, help_resources, project_feedback, industry_trends, problem_solving, weekly_threads, comparisons
- Subreddit selector with related subreddit suggestions
- **"Generate Post" button uses Gemini** to create full post content (not Copy for Claude)
- Editable text area for generated content
- Direct link to create post on Reddit
- **DEFAULT TAB** - App now loads to Engage first

## AI Response Generation

Uses OpenRouter API with Gemini Flash. The prompt detects POST TYPE and responds appropriately:

1. **HELP-SEEKING** - Give specific, actionable advice
2. **SHARING/JOURNEY** - Engage with ideas, ask questions (don't give unsolicited advice)
3. **DISCUSSION/OPINION** - Add perspective, build on points
4. **SHOWCASE** - Give genuine feedback, ask about technical choices

Key rules:
- NEVER start with "Ah, ..." (was repetitive)
- Vary opening styles
- Match response type to post type

## Architecture

1. **Browser fetches sources** - Avoids VPS IP blocks
2. **Frontend filters/scores** - Keyword matching, relevance scoring
3. **Backend stores posts** - SQLite with deduplication
4. **AI response generation** - OpenRouter API with Gemini Flash

## Database Schema (posts table)

```sql
-- Core fields
id, reddit_id, subreddit, title, body, url, author, score, num_comments, created_utc

-- Analysis
relevance_score, keywords_matched, suggested_response

-- Status
status (new/skipped/responded), responded_at

-- Reply tracking (added 2025-12-27)
my_comment_url, last_reply_check, unread_replies

-- Timestamps
discovered_at, updated_at
```

## Common Commands

```bash
# Deploy backend
rsync -avz --exclude '__pycache__' --exclude 'venv' --exclude '*.db' \
  backend/ junipr-vps:/home/deploy/devscout/backend/

# Deploy frontend
cd frontend && npm run build
rsync -avz frontend/dist/ junipr-vps:/home/deploy/devscout/frontend/

# Restart service
ssh junipr-vps "sudo systemctl restart devscout"

# Check logs
ssh junipr-vps "sudo journalctl -u devscout -f"

# Run DB migration
ssh junipr-vps "cd /home/deploy/devscout/backend && sqlite3 devscout.db 'ALTER TABLE...'"
```

## Environment Variables (VPS)

Located at `/home/deploy/devscout/backend/.env`:
- `OPENROUTER_API_KEY` - For AI response generation

## Work In Progress (Session: 2025-12-27)

### Completed This Session
- ✅ Replies Tab complete refactor (full thread structure, collapsible UI, animations)
- ✅ Global notification badge for replies (visible on all pages)
- ✅ Click notification → navigate + scroll to reply
- ✅ Generate Response button for unreplied comments (with editable text area)
- ✅ Engage Tab with post idea templates by category
- ✅ Real-time polling (30s on Replies, 60s background)
- ✅ Removed "responded" filter from Posts tab (Replies handles it now)
- ✅ Moved Replies tab next to Posts in navigation
- ✅ Moved Engage tab to first position in nav (default tab)
- ✅ Moved custom URL input to Posts tab (for adding posts scraper missed)
- ✅ Engage tab now uses Gemini generation (not "Copy for Claude")

### CRITICAL BUG #1 - Replies Not Loading
**Issue:** Replies tab shows posts but user comments/replies aren't displaying
- Posts with "responded" status appear in collapsible cards
- When expanded, shows "No comments by u/jessedev_ found on this post yet"
- Debug logging added to `handleFetchReplies` and `scrapePostForUserComments`
- User says replies WERE working before Gemini generation feature was added
- Need to check browser console for `[DevScout]` logs to debug

**Debugging approach:**
1. Check browser console for scraping logs
2. Verify `scrapePostForUserComments()` is finding comments
3. Check if Reddit API response structure changed
4. Verify TARGET_USERNAME = 'jessedev_' matches actual username

### CRITICAL BUG #2 - Posts Not Auto-Marking Responded
**Issue:** Posts should auto-detect when user has replied on Reddit
- Currently requires manual "Mark Responded" button click
- User wants: reply on Reddit → auto-detect → auto-mark as responded
- The scraping logic (`scrapePostForUserComments`) should find user's comments
- If scraping worked, could use it to auto-detect responses on Posts tab too

**Solution approach:**
1. Fix the scraping first (Bug #1)
2. Then use same scraping to check if user has commented on "new" posts
3. Auto-mark as responded when user's comment is detected

### Next Up
- **FIX SCRAPING** - Priority #1 (both bugs depend on this)
- Add "Dismiss" or "Don't Reply" button to clear reply notifications
- Auto-detect when user has replied (requires working scraper)

### API Endpoints Added
- `POST /api/posts/generate-reply` - Generate response to a reply (uses Gemini)
  - Request: `{ subreddit, my_comment, their_reply }`
  - Response: `{ response }`
- `POST /api/posts/generate-engage` - Generate engagement post content (uses Gemini)
  - Request: `{ subreddit, idea_template, category }`
  - Response: `{ response }`

### Frontend Functions Added (api.js)
- `scrapePostForUserComments(postUrl)` - Find user's comments and replies
- `scrapeTrackedPostsForReplies(posts)` - Batch scrape multiple posts
- `generateReplyResponse({ subreddit, myComment, theirReply })` - Generate reply via API
- `generateEngagePost({ subreddit, ideaTemplate, category })` - Generate engage post via API
- `getEngagementSubreddits()`, `getRelatedSubreddits()`, `getIdeasForSubreddit()` - Engage tab helpers
- `ENGAGEMENT_TEMPLATES` - Post idea templates by category
