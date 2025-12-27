# DevScout - Project Instructions

## Project Overview

DevScout is a credibility-building tool for developers. It finds relevant posts across Reddit, Hacker News, Lobsters, Dev.to, Hashnode, and GitHub where you can provide helpful responses or make contributions.

**URL:** https://devscout.junipr.io
**Location:** ~/itsjesse.dev/devscout/
**VPS Path:** /home/deploy/devscout/
**Port:** 8004
**Reddit Username:** u/jessedev_

## Features

### Posts Tab (Reddit Only)
- Scans 75+ subreddits for automation/integration keywords
- Generates AI responses with friendly mentor tone (Gemini via OpenRouter)
- Client-side fetching (bypasses VPS IP blocks)
- Clears stale posts on fetch (keeps responded)
- Subreddit badges link to actual subreddit
- **Auto-mark responded**: 60s periodic check detects user's comments on "new" posts
- **Reply on Reddit button**: Reddit orange with Snoo icon, copies response + opens link

### News Tab (HN, Lobsters, Dev.to, Hashnode)
- Scans 4 tech community sources for relevant posts
- **Generate Response button** (Gemini) - replaces Copy for Claude
- Editable text area for generated responses
- Copy & View Post button (copies + opens link)

### GitHub Tab
- Finds `good-first-issue`, `help-wanted` labeled issues
- Searches Python, JavaScript, TypeScript, Go, Rust repos
- "Copy for Claude" button formats context for contribution
- Dismiss button to skip issues

### Prospects Tab (Outreach)
- Search-based Reddit scraping for hot leads
- **45+ subreddit/keyword combinations** including:
  - Direct hiring (forhire, slavelabour, jobbit)
  - Business owners (smallbusiness, Entrepreneur, startups, indiehackers)
  - SaaS/NoCode (SaaS, microsaas, nocode, lowcode)
  - Ecommerce (shopify, woocommerce, Etsy, ecommerce)
  - Industry verticals (realestateinvesting, accounting, Bookkeeping)
  - Marketing/Sales (hubspot, Salesforce, marketing)
  - Productivity tools (zapier, Notion, Airtable)
- Scores prospects by keyword relevance (HOT/WARM/COOL)
- Filters out competitor posts

### Replies Tab (Reply Tracking)
- Auto-scrapes responded posts for user's comments (u/jessedev_)
- Shows full thread structure: post -> my comment -> replies -> branches
- Collapsible UI for each tracked post
- Animated red glow for posts needing attention
- "Generate Response" button for unreplied comments (uses Gemini)
- Editable text area for generated responses
- **Combined Reply on Reddit button**: copies response + opens link
- Real-time polling: 30s on Replies tab, 60s background
- Global notification badge visible on ALL pages
- Click notification -> navigate to Replies + scroll to first unreplied
- **Auto-cleanup**: Posts responded >48hrs with no comments found auto-revert to skipped

### Engage Tab (Community Content) - DEFAULT TAB
- Expert-level post idea templates (no novice content)
- Categories: deep_dives, hard_lessons, technical_opinions, how_i_debug, war_stories, industry_insights, comparisons
- Subreddit selector with related subreddit suggestions
- "Generate Post" button uses Gemini
- Editable text area for generated content
- Direct link to create post on Reddit

## AI Response Generation

Uses OpenRouter API with Gemini Flash (google/gemini-2.0-flash-001).

**Response variety system**: 10 distinct opening styles randomly selected per request:
- direct_technical, shared_experience, genuine_question, specific_callout
- practical_advice, acknowledgment_pivot, observation, validation_plus
- mini_story, contrarian_curious

**Banned phrases**: "Really interesting...", "Ah,", "Great question!", "Cool project!", etc.

## Architecture

1. **Browser fetches sources** - Avoids VPS IP blocks
2. **Frontend filters/scores** - Keyword matching, relevance scoring
3. **Backend stores posts** - SQLite with deduplication
4. **AI response generation** - OpenRouter API with Gemini Flash

## IMPORTANT: VPS IP is Blocked by Reddit

**The VPS IP (204.152.223.104) is blocked by Reddit's API.**

- Direct requests from VPS to reddit.com return 403 Forbidden
- This is why Posts and Prospects fetch client-side (from browser)
- Auto-mark responded uses CORS proxies (corsproxy.io, allorigins.win) as fallback
- Never try to proxy Reddit requests through the backend - it won't work

## Database Schema (posts table)

```sql
-- Core fields
id, reddit_id, subreddit, title, body, url, author, score, num_comments, created_utc

-- Analysis
relevance_score, keywords_matched, suggested_response

-- Status
status (new/skipped/responded), responded_at

-- Reply tracking
my_comment_url, last_reply_check, unread_replies

-- Timestamps
discovered_at, updated_at
```

## Common Commands

```bash
# Deploy both frontend and backend
cd frontend && npm run build
rsync -avz --delete frontend/dist/ junipr-vps:/home/deploy/devscout/frontend/
rsync -avz --exclude '__pycache__' --exclude 'venv' --exclude '*.db' backend/ junipr-vps:/home/deploy/devscout/backend/
ssh junipr-vps "sudo systemctl restart devscout"

# Check logs
ssh junipr-vps "sudo journalctl -u devscout -f"
```

## API Endpoints

- `POST /api/posts/generate-reply` - Generate response to a reply
- `POST /api/posts/generate-engage` - Generate engagement post content
- `POST /api/posts/generate-news` - Generate response for news post (HN/Lobsters/Dev.to/Hashnode)

## Key Files

- `frontend/src/App.jsx` - Main React app (~1900 lines)
- `frontend/src/services/api.js` - All API calls, scraping, engagement templates
- `backend/app/routers/posts.py` - All API endpoints
- `backend/app/services/response_generator.py` - Gemini prompt engineering with opening styles

## Session Notes (2025-12-27)

### Completed (Latest)
- **Gemini honest feedback mode**: New `honest_review` opening style for feedback-seeking posts
- Auto-detects posts asking for feedback/critique/roast and uses balanced, honest tone
- Prompts updated to encourage real feedback (positives AND concerns) not just hype
- **Mobile responsiveness fixes**: No horizontal scroll on any screen size
- Added `overflow-x: hidden` to html/body, word-break to post titles/bodies
- Updated global notification for mobile (full width, smaller font on xs screens)
- Extra small device (380px) improvements: smaller buttons, flexible widths
- Fixed `hasCheckedPosts` undefined error in Posts fetch

### Previous Micro-Session
- Fixed subreddit badge height (override 44px min-height in CSS)
- Auto-resume fetch on reload for Posts and Prospects (no manual Resume button)
- Notification banner auto-fades after 10s of no new activity
- Stricter prospect scoring: filters out stories/tips/advice/discussions
- HOT score (40+) only for [Hiring]/[Task] tags or explicit hiring phrases
- Proxy-first fetching for all Reddit requests (corsproxy.io first, then allorigins.win)
- Significantly faster desktop fetching (skip failing direct CORS attempts)
- Fixed Reddit CORS in Prospects search
- Fixed HN timestamp display (Unix timestamp conversion)

### Previous Session
- Combined Copy + Reply on Reddit into single button (Replies + Posts tabs)
- Added Reddit orange (#ff4500) and Snoo icon to Reply buttons
- Added 60s periodic auto-mark responded on Posts tab
- Added auto-cleanup for stale posts (48hr no comments -> skipped)
- Added Dev.to and Hashnode to News tab (now 4 sources)
- Replaced "Copy for Claude" with Gemini generation on News tab
- Expanded Prospects with 30+ more subreddit/keyword searches
- Updated Engage templates to expert-level content (removed novice)
- Fixed Gemini response variety (10 random opening styles)
- Added button colors (purple Regenerate, gray Skip) with hover animations
- Reply on Reddit now scrolls to comments (#comments anchor)
- Fixed CORS issue with auto-mark by using fallback proxies (corsproxy.io, allorigins.win)
- Fixed auto-mark speed: parallel batch checking (5 at a time) instead of sequential
- Added localStorage persistence for checked posts (survives page reload)
- Added Indie Hackers and Tildes to News tab (now 6 sources)
- Expanded Prospects with 100+ subreddit/keyword searches
- Enhanced prospect scoring with tiered keywords (gold +15, high +10, medium +5)
- Dynamic Gemini response length based on post complexity (200-450 tokens)
- Full mobile-responsive CSS (768px breakpoint + 380px extra small)
- Horizontal scroll mode toggle on mobile
- Touch-friendly buttons (44px min targets)
- localStorage persistence for Prospects and News (survives reload)
- Resume button for interrupted Prospects fetch
- Clear All buttons for Prospects and News
- Enhanced auto-mark debugging logs

### Technical Notes
- **Proxy-first approach**: All Reddit fetches use corsproxy.io first (avoids CORS failures on desktop)
- **44px touch targets**: Global CSS sets min-height on buttons/links, but `.devscout-subreddit` overrides this
- **Prospect scoring**: Returns 0 for posts matching "not hiring" patterns (tips, stories, advice, etc.)
- **Auto-resume**: Saves progress to localStorage during fetch, auto-resumes on page reload
