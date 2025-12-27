# DevScout - Project Instructions

## Project Overview

DevScout is a credibility-building tool for developers. It finds relevant posts across Reddit, Hacker News, Lobsters, and GitHub where you can provide helpful responses or make contributions.

**URL:** https://devscout.junipr.io
**Location:** ~/itsjesse.dev/devscout/
**VPS Path:** /home/deploy/devscout/
**Port:** 8004

## Features

### Posts Tab
- Scans 75+ subreddits, Hacker News, and Lobsters
- Finds posts matching automation/integration keywords
- Generates AI responses with friendly mentor tone
- Client-side fetching (bypasses VPS IP blocks)

### GitHub Tab
- Finds `good-first-issue`, `help-wanted` labeled issues
- Searches Python, JavaScript, TypeScript, Go, Rust repos
- "Copy for Claude" button formats context for contribution

### Prospects Tab (Outreach)
- Search-based Reddit scraping for hot leads
- Scores prospects by keyword relevance
- Filters out competitor posts
- Shows hot/warm lead categories

## Architecture

1. **Browser fetches sources** - Avoids VPS IP blocks
2. **Frontend filters/scores** - Keyword matching, relevance scoring
3. **Backend stores posts** - SQLite with deduplication
4. **AI response generation** - OpenRouter API with Gemini Flash

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
```

## Environment Variables (VPS)

Located at `/home/deploy/devscout/backend/.env`:
- `OPENROUTER_API_KEY` - For AI response generation
