# itsjesse.dev Project Instructions

## CRITICAL: No AI Attribution

**NEVER include Claude co-author tags or AI attribution in commits to this repository.**

This is Jesse's professional portfolio - it should appear as his own work with no visible AI assistance on GitHub. When committing changes:
- Do NOT add "Co-Authored-By: Claude" lines
- Do NOT add "Generated with Claude Code" signatures
- Keep commit messages professional and author-neutral

This applies to all itsjesse.dev repositories and portfolio project repos.

## Project Overview
Personal portfolio website and demo projects showcasing automation & integration development services.

**Live Site:** https://itsjesse.dev
**Repository:** git@github.com:itsjessedev/itsjesse.dev.git

## Directory Structure

```
itsjesse.dev/
├── site/                    # Next.js static website
│   ├── src/                 # Source code
│   │   ├── app/             # Next.js app router pages
│   │   ├── components/      # React components
│   │   └── data/            # Project data
│   ├── public/              # Static assets
│   │   ├── api/             # portfolio.json API for mobile app
│   │   ├── projects/        # Project screenshots
│   │   ├── videos/          # Demo videos
│   │   └── downloads/       # APK files
│   └── mockups/             # HTML mockups for screenshots
├── portfolio/               # Demo project source code
│   ├── syncflow/            # Salesforce + Jira sync
│   ├── orderhub/            # E-commerce aggregator
│   ├── invoicebot/          # Receipt OCR
│   ├── leadscore/           # Lead scoring
│   ├── stockalert/          # Inventory monitoring
│   ├── reportgen/           # Report automation
│   ├── feedbackpulse/       # Review analyzer
│   ├── bookingsync/         # Appointment automation
│   ├── databridge/          # Data migration
│   └── workflowbot/         # Slack workflows
├── outreach/                # Client outreach tracking
├── prospects/               # Lead generation data
├── templates/               # Email/proposal templates
└── tools/                   # Utility scripts
```

## Deployment

**IMPORTANT:** Deploy to the correct Caddy directory!

```bash
# Build
cd site && npm run build

# Deploy (correct path!)
rsync -avz --delete out/ junipr-vps:/home/deploy/itsjesse.dev/

# Purge Cloudflare cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/6e68590648d9b0e45f630ee5c236f5eb/purge_cache" \
  -H "X-Auth-Email: jesse@junipr.io" \
  -H "X-Auth-Key: 15aac9cea093411d5bcc2a5721ed3dd793863" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

**VPS paths:**
- Website: `/home/deploy/itsjesse.dev/` (served by Caddy)
- NOT `/var/www/itsjesse.dev/` (that's unused)

## Mobile App Sync

The portfolio.json API at `/public/api/portfolio.json` powers the Flutter mobile app.
- App pulls from: `https://itsjesse.dev/api/portfolio.json`
- Update portfolio.json → App auto-updates on next launch
- Screenshots use absolute URLs: `https://itsjesse.dev/projects/...`

## Key Files

- `site/src/data/projects.ts` - Project definitions for website
- `site/public/api/portfolio.json` - API for mobile app (MUST stay in sync)
- `site/src/app/projects/[id]/page.tsx` - Project detail pages with carousel
- `site/src/components/ImageCarousel.tsx` - Screenshot carousel component

## Adding New Project Screenshots

1. Create mockup HTML files in `site/mockups/`
2. Take screenshots with Playwright or manually
3. Save to `site/public/projects/{project-name}/`
4. Update project data in both:
   - `site/src/app/projects/[id]/page.tsx` (projectDetails object)
   - `site/public/api/portfolio.json` (for mobile app)
5. Build and deploy

## Demo Video Creation

Use Playwright to record interactive demos:

```bash
cd site
node scripts/record-demo.mjs
# Video saves to public/videos/
```

## Related Repositories (NOT in this repo)

These are in `~/portfolio/`, not here:
- `itsjesse_mobile` - Flutter mobile app
- `fieldops` - React Native field service app
- `documind` - RAG document intelligence
- `smartclassify` - ML text classification
