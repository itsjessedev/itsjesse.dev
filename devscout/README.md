# Reddit Scout

Personal tool for finding relevant Reddit posts and generating helpful responses to build Reddit credibility.

**URL:** https://rscout.junipr.io (non-indexed, stealth mode)

## Architecture

```
Browser → Fetches Reddit JSON → Sends to Backend → OpenRouter AI → Suggested Response
                                      ↓
                               SQLite (history)
```

**Why client-side fetching:** VPS IP is blocked by Reddit. Browser fetches Reddit directly, sends posts to backend for storage and AI response generation.

## Tech Stack

- **Backend:** FastAPI + SQLite + OpenRouter (Gemini Flash)
- **Frontend:** React (Vite)
- **Hosting:** VPS at rscout.junipr.io (port 8004)

## Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Deployment

```bash
# Build frontend
cd frontend && npm run build

# Deploy to VPS
rsync -avz --exclude '__pycache__' --exclude 'venv' --exclude '*.db' --exclude '.env' \
  backend/ junipr-vps:/home/deploy/reddit-scout/backend/

rsync -avz frontend/dist/ junipr-vps:/home/deploy/reddit-scout/frontend/

# Restart service
ssh junipr-vps "sudo systemctl restart reddit-scout"
```

## Target Subreddits

- r/webdev, r/programming, r/learnprogramming
- r/automation, r/zapier, r/n8n
- r/smallbusiness, r/Entrepreneur
- r/freelance, r/SaaS, r/startups

## Stealth Features

- `robots.txt` blocks all crawlers
- `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
- `<meta name="robots">` in HTML
- No OpenAPI/docs endpoints
- No auth (obscurity only)
- DNS not proxied through Cloudflare

## Credibility Strategy

1. **Weeks 1-4:** Pure value, zero self-promo
2. **Weeks 5-8:** Subtle "I built similar" mentions
3. **Week 9+:** Profile link, occasional project shares
