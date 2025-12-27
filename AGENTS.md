# Project Instructions (Codex)

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

## Portfolio Projects (15 Total)

All project source code is in `/home/jesse/itsjesse.dev/portfolio/`:

| # | Project | Description | Category |
|---|---------|-------------|----------|
| 1 | SyncFlow | Salesforce + Jira sync | automation |
| 2 | OrderHub | E-commerce aggregator | integration |
| 3 | InvoiceBot | Receipt OCR automation | automation |
| 4 | LeadScore | ML lead scoring | dashboard |
| 5 | StockAlert | Inventory monitoring | dashboard |
| 6 | ReportGen | Report automation | automation |
| 7 | FeedbackPulse | Review analyzer | integration |
| 8 | BookingSync | Appointment automation | automation |
| 9 | DataBridge | Data migration toolkit | migration |
| 10 | WorkflowBot | Slack workflow automation | automation |
| 11 | itsjesse-mobile | Flutter portfolio app | native-apps |
| 12 | FieldOps | React Native field service | native-apps |
| 13 | DocuMind | RAG document intelligence | ai-ml |
| 14 | SmartClassify | ML text classification | ai-ml |
| 15 | DealScout | Deal discovery & flip tracking | automation |

**Requirements per project:**
- 6+ screenshots (taken from HTML mockups at 1440x900)
- 1 demo video (recorded from same mockups)
- GitHub repo with real source code
- Live demo at {project}.itsjesse.dev

## Live Demo Deployment

Demo apps are deployed to VPS at `/srv/portfolio-demos/{project}/frontend/dist/`:

```bash
# Copy demo HTML to VPS
scp portfolio/{project}/frontend/dist/index.html junipr-vps:/srv/portfolio-demos/{project}/frontend/dist/

# Caddy serves from /srv/portfolio-demos/{project}/frontend/dist/
```

DNS A records point subdomains to 204.152.223.104 (Cloudflare proxied).

## Cloudflare Zone Info

**itsjesse.dev Zone ID:** `41890a82db39a3d4c0cae401a562d9c5`

```bash
# List DNS records for itsjesse.dev
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/41890a82db39a3d4c0cae401a562d9c5/dns_records?type=A" \
  -H "X-Auth-Email: jesse@junipr.io" \
  -H "X-Auth-Key: 15aac9cea093411d5bcc2a5721ed3dd793863"

# Add new subdomain
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/41890a82db39a3d4c0cae401a562d9c5/dns_records" \
  -H "X-Auth-Email: jesse@junipr.io" \
  -H "X-Auth-Key: 15aac9cea093411d5bcc2a5721ed3dd793863" \
  -H "Content-Type: application/json" \
  --data '{"type":"A","name":"subdomain.itsjesse.dev","content":"204.152.223.104","proxied":true}'
```

## Work In Progress (Session: 2025-12-26)

### Banner Generation
- Need to create professional hero banners for all 15 projects
- Banner should be first image (push screenshots back)
- Script started: `site/scripts/generate-banners.mjs`
- Using Playwright to render HTML templates at 1440x900

### Completed This Session
- Fixed all mockup viewports to 1440x900
- Re-took 93 screenshots with consistent styling
- Re-recorded 15 demo videos matching screenshots
- Created 4 GitHub repos (itsjesse-mobile, fieldops, documind, smartclassify)
- Pushed real source code to all 15 repos
- Created light-themed demo apps (OrderHub, FeedbackPulse, StockAlert, BookingSync)
- Added DealScout DNS record and APK download
- Added resume link to all pages
- Added cursor:pointer to APK download button
