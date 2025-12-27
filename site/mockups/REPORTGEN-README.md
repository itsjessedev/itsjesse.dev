# ReportGen Mockups

Automated Business Reports System mockups created for portfolio showcase.

## Project Overview

**Problem:** Operations manager spent every Monday morning pulling data from 5 sources to build a weekly report

**Solution:** Automated report generation with configurable templates, multiple data source connectors, and scheduled email delivery

**Tech Stack:** Python, Pandas, WeasyPrint, SendGrid, FastAPI

## Mockup Files

All mockups are built with TailwindCSS (CDN) and Inter font, featuring a violet/purple theme with consistent sidebar navigation.

### 1. Dashboard (`reportgen-dashboard.html`)
- Overview with stats cards (247 total reports, 12 active templates, 8 scheduled jobs, 5 data sources)
- Recent reports section with delivery status
- Upcoming scheduled jobs timeline
- Quick action buttons

### 2. Templates (`reportgen-templates.html`)
- Template library with preview cards
- 6 templates displayed: Weekly Sales, Operations Dashboard, Financial Summary, Team Performance, Inventory Analysis, Customer Analytics
- Search and filter functionality
- Edit/Duplicate actions for each template

### 3. Template Editor (`reportgen-editor.html`)
- Drag-and-drop component panel (sections, visualizations, layout)
- Live canvas preview with editable sections
- Properties panel for configuring data sources, chart types, colors
- Weekly Sales Report example with header, summary cards, line chart, and data table

### 4. Data Sources (`reportgen-sources.html`)
- 5 connected sources: PostgreSQL (Sales Database), Google Sheets (Q4 Sales), Shopify API, QuickBooks (Financial Data), CSV (Inventory)
- Connection status indicators (Connected/Stale)
- Test/configure actions
- Available integrations gallery (MySQL, Salesforce, Airtable, REST API, Google Analytics, SendGrid)

### 5. Schedule (`reportgen-schedule.html`)
- 4 active schedules with frequency, time, and recipient details
- Schedule builder with cron expression support
- Frequency options: Daily, Weekly, Monthly, Quarterly, Custom
- Next run and last run timestamps

### 6. History (`reportgen-history.html`)
- Report archive table with 247 total reports
- Filters: template, status, date range
- Download and view actions
- Status indicators (Delivered/Failed)
- Pagination (8 per page)

## Screenshots

All screenshots captured at 1920x1080 resolution and saved to:
`/home/jesse/itsjesse.dev/site/public/projects/reportgen/`

- `dashboard.png` (134KB)
- `templates.png` (412KB)
- `editor.png` (149KB)
- `sources.png` (135KB)
- `schedule.png` (138KB)
- `history.png` (164KB)

## Regenerating Screenshots

To regenerate screenshots:

```bash
cd /home/jesse/itsjesse.dev/site/mockups
./screenshot-reportgen.sh
```

Requires Chrome/Chromium browser installed.

## Design Features

- Modern, professional UI with TailwindCSS
- Violet/purple color scheme (violet-600 to violet-800)
- Consistent sidebar navigation across all pages
- Realistic data and examples
- Status indicators (Active, Delivered, Failed, etc.)
- Hover states and transitions
- Responsive grid layouts
- Icon usage from Heroicons

## Use Case Examples

1. **Weekly Sales Report** - Every Monday at 9:00 AM to operations team
2. **Daily Inventory Check** - Every day at 6:00 AM to warehouse
3. **Monthly Operations Dashboard** - First Monday of month to leadership
4. **Quarterly Financial Summary** - Quarterly to CFO and investors

## Data Source Integrations

Connected:
- PostgreSQL (Sales Database)
- Google Sheets (Q4 Sales Data)
- Shopify API (Store Analytics)
- QuickBooks Online (Financial Data)
- CSV Upload (Inventory Data)

Available:
- MySQL
- Salesforce
- Airtable
- REST API
- Google Analytics
- SendGrid
