# DataBridge HTML Mockups

Professional HTML mockups for the DataBridge legacy system migration tool portfolio project.

## Project Overview

**DataBridge** is a Legacy System Migration tool designed to solve a critical business problem:
- **Problem**: Businesses stuck on 15-year-old Access databases, unable to move to modern CRMs without losing historical data
- **Solution**: Custom migration pipeline with data profiling, field mapping, validation, and incremental sync with rollback capability
- **Tech Stack**: Python, Pandas, ODBC, HubSpot API, Airtable API

## Mockup Files

### HTML Mockups (in `/mockups/`)

1. **databridge-dashboard.html** - Migration overview dashboard
   - Overall stats (total records, migrated, errors, success rate)
   - Active migration progress with real-time status
   - Recent activity feed
   - Multiple migration project cards

2. **databridge-sources.html** - Data source configuration
   - Source systems (Access DB, Excel)
   - Destination systems (HubSpot CRM, Airtable)
   - Connection details and health checks
   - Test connection and schema refresh capabilities

3. **databridge-mapping.html** - Field mapping interface
   - Visual source → destination field mapping
   - Transformation indicators (split, format, direct)
   - Unmapped field warnings
   - Auto-mapping suggestions

4. **databridge-validation.html** - Data validation rules and errors
   - Validation statistics (passed, errors, warnings)
   - Active validation rules configuration
   - Recent validation errors with details
   - Error summary by type with visual charts

5. **databridge-progress.html** - Real-time migration progress
   - Overall progress with time estimates
   - Batch-by-batch processing status
   - Live activity log with record-level detail
   - Current/queued/completed batch tracking

6. **databridge-history.html** - Migration history and rollback
   - Complete migration timeline
   - Success/failure/rollback status indicators
   - Detailed migration statistics
   - Rollback capabilities for completed migrations

### Screenshots (in `/public/projects/databridge/`)

All 6 mockups captured at 1920x1080 resolution:

- `databridge-dashboard.png` (117 KB)
- `databridge-sources.png` (148 KB)
- `databridge-mapping.png` (113 KB)
- `databridge-validation.png` (159 KB)
- `databridge-progress.png` (261 KB)
- `databridge-history.png` (119 KB)

## Design Features

- **Framework**: TailwindCSS (CDN)
- **Typography**: Inter font (Google Fonts)
- **Theme**: Slate/gray professional color scheme
- **Navigation**: Consistent sidebar across all pages
- **Data**: Realistic migration scenarios and field mappings
- **Polish**: Professional, modern UI suitable for portfolio

## Usage

### Viewing Mockups

Open any HTML file directly in a browser:

```bash
# Using default browser
xdg-open /home/jesse/itsjesse.dev/site/mockups/databridge-dashboard.html

# Using specific browser
google-chrome /home/jesse/itsjesse.dev/site/mockups/databridge-dashboard.html
```

### Re-capturing Screenshots

Run the included screenshot script:

```bash
cd /home/jesse/itsjesse.dev/site
bash mockups/capture-databridge-screenshots.sh
```

## Portfolio Integration

These mockups are ready to be featured in your portfolio website to demonstrate:
- Complex data migration problem-solving
- Professional UI/UX design skills
- Understanding of enterprise data challenges
- Python backend + API integration expertise
- Real-world business impact

## File Locations

```
/home/jesse/itsjesse.dev/site/
├── mockups/
│   ├── databridge-dashboard.html
│   ├── databridge-sources.html
│   ├── databridge-mapping.html
│   ├── databridge-validation.html
│   ├── databridge-progress.html
│   ├── databridge-history.html
│   ├── capture-databridge-screenshots.sh
│   └── DATABRIDGE-README.md (this file)
└── public/
    └── projects/
        └── databridge/
            ├── databridge-dashboard.png
            ├── databridge-sources.png
            ├── databridge-mapping.png
            ├── databridge-validation.png
            ├── databridge-progress.png
            └── databridge-history.png
```

## Next Steps

1. Add these screenshots to your portfolio project page
2. Write a detailed case study explaining the migration challenges
3. Include technical details about the Python pipeline
4. Highlight the business impact and ROI
5. Link to GitHub repository if code is available
