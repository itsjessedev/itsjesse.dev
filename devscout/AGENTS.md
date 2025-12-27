# Project Instructions (Codex)
## Project Overview

Reddit Scout is a personal tool for building Reddit credibility by finding relevant posts and generating helpful responses.

**URL:** https://rscout.junipr.io
**Location:** ~/projects/reddit-scout/
**VPS Path:** /home/deploy/reddit-scout/
**Port:** 8004

## Current State (Session: 2025-12-26)

### What's Working
- Backend deployed and running on VPS
- Frontend deployed at rscout.junipr.io
- OpenRouter integration for AI response generation
- SQLite database for tracking posts

### Known Issue
- **VPS IP is blocked by Reddit** - Cannot fetch Reddit JSON from server
- **Solution in progress:** Switch to client-side fetching (browser fetches Reddit, sends to backend)

### Work in Progress
1. Implement client-side Reddit fetching in React frontend
2. Backend endpoint to receive posts from frontend
3. Test end-to-end flow

## Key Technical Decisions

1. **No Reddit API keys needed** - Uses public JSON endpoints (append .json to any Reddit URL)
2. **Client-side fetching** - Browser fetches Reddit to avoid VPS IP blocks
3. **OpenRouter API** - Reuses key from DealScout, uses Gemini Flash model
4. **Stealth mode** - All anti-indexing measures (nofollow, noindex, X-Robots-Tag)

## Common Commands

```bash
# Deploy backend
rsync -avz --exclude '__pycache__' --exclude 'venv' --exclude '*.db' \
  backend/ junipr-vps:/home/deploy/reddit-scout/backend/

# Deploy frontend
cd frontend && npm run build
rsync -avz frontend/dist/ junipr-vps:/home/deploy/reddit-scout/frontend/

# Restart service
ssh junipr-vps "sudo systemctl restart reddit-scout"

# Check logs
ssh junipr-vps "sudo journalctl -u reddit-scout -f"
```

## Environment Variables (VPS)

Located at `/home/deploy/reddit-scout/backend/.env`:
- `OPENROUTER_API_KEY` - From DealScout
- `TARGET_SUBREDDITS` - Comma-separated list
- `TARGET_KEYWORDS` - Comma-separated list
