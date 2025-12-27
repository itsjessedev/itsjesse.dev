import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const mockupsDir = '/home/jesse/itsjesse.dev/site/mockups';
const outputDir = '/home/jesse/itsjesse.dev/site/public/projects';

// All projects with their mockups
const projectMockups = {
  'syncflow': [
    { file: 'syncflow-dashboard.html', output: 'dashboard.png' },
    { file: 'syncflow-sync-history.html', output: 'sync-history.png' },
    { file: 'syncflow-field-mapping.html', output: 'field-mapping.png' },
    { file: 'syncflow-analytics.html', output: 'analytics.png' },
    { file: 'syncflow-settings.html', output: 'settings.png' },
    { file: 'syncflow-alerts.html', output: 'alerts.png' },
  ],
  'orderhub': [
    { file: 'orderhub-dashboard.html', output: 'dashboard.png' },
    { file: 'orderhub-orders.html', output: 'orders.png' },
    { file: 'orderhub-inventory.html', output: 'inventory.png' },
    { file: 'orderhub-integrations.html', output: 'integrations.png' },
    { file: 'orderhub-analytics.html', output: 'analytics.png' },
    { file: 'orderhub-settings.html', output: 'settings.png' },
  ],
  'invoicebot': [
    { file: 'invoicebot-dashboard.html', output: 'dashboard.png' },
    { file: 'invoicebot-upload.html', output: 'upload.png' },
    { file: 'invoicebot-processing.html', output: 'processing.png' },
    { file: 'invoicebot-review.html', output: 'review.png' },
    { file: 'invoicebot-history.html', output: 'history.png' },
    { file: 'invoicebot-settings.html', output: 'settings.png' },
  ],
  'leadscore': [
    { file: 'leadscore-dashboard.html', output: 'dashboard.png' },
    { file: 'leadscore-leads.html', output: 'leads.png' },
    { file: 'leadscore-scoring.html', output: 'scoring.png' },
    { file: 'leadscore-analytics.html', output: 'analytics.png' },
    { file: 'leadscore-integrations.html', output: 'integrations.png' },
    { file: 'leadscore-alerts.html', output: 'alerts.png' },
    { file: 'leadscore-settings.html', output: 'settings.png' },
  ],
  'stockalert': [
    { file: 'stockalert-dashboard.html', output: 'dashboard.png' },
    { file: 'stockalert-inventory.html', output: 'inventory.png' },
    { file: 'stockalert-locations.html', output: 'locations.png' },
    { file: 'stockalert-alerts.html', output: 'alerts.png' },
    { file: 'stockalert-reorder.html', output: 'reorder.png' },
    { file: 'stockalert-settings.html', output: 'settings.png' },
  ],
  'reportgen': [
    { file: 'reportgen-dashboard.html', output: 'dashboard.png' },
    { file: 'reportgen-templates.html', output: 'templates.png' },
    { file: 'reportgen-editor.html', output: 'editor.png' },
    { file: 'reportgen-sources.html', output: 'sources.png' },
    { file: 'reportgen-schedule.html', output: 'schedule.png' },
    { file: 'reportgen-history.html', output: 'history.png' },
  ],
  'feedbackpulse': [
    { file: 'feedbackpulse-dashboard.html', output: 'dashboard.png' },
    { file: 'feedbackpulse-reviews.html', output: 'reviews.png' },
    { file: 'feedbackpulse-surveys.html', output: 'surveys.png' },
    { file: 'feedbackpulse-trends.html', output: 'trends.png' },
    { file: 'feedbackpulse-alerts.html', output: 'alerts.png' },
    { file: 'feedbackpulse-sources.html', output: 'sources.png' },
  ],
  'bookingsync': [
    { file: 'bookingsync-dashboard.html', output: 'dashboard.png' },
    { file: 'bookingsync-calendar.html', output: 'calendar.png' },
    { file: 'bookingsync-bookings.html', output: 'bookings.png' },
    { file: 'bookingsync-reminders.html', output: 'reminders.png' },
    { file: 'bookingsync-widget.html', output: 'widget.png' },
    { file: 'bookingsync-settings.html', output: 'settings.png' },
  ],
  'databridge': [
    { file: 'databridge-dashboard.html', output: 'dashboard.png' },
    { file: 'databridge-sources.html', output: 'sources.png' },
    { file: 'databridge-mapping.html', output: 'mapping.png' },
    { file: 'databridge-validation.html', output: 'validation.png' },
    { file: 'databridge-progress.html', output: 'progress.png' },
    { file: 'databridge-history.html', output: 'history.png' },
  ],
  'workflowbot': [
    { file: 'workflowbot-dashboard.html', output: 'dashboard.png' },
    { file: 'workflowbot-workflows.html', output: 'workflows.png' },
    { file: 'workflowbot-editor.html', output: 'editor.png' },
    { file: 'workflowbot-requests.html', output: 'requests.png' },
    { file: 'workflowbot-approvals.html', output: 'approvals.png' },
    { file: 'workflowbot-audit.html', output: 'audit.png' },
    { file: 'workflowbot-settings.html', output: 'settings.png' },
  ],
  'dealscout': [
    { file: 'dealscout-deals.html', output: 'deals.png' },
    { file: 'dealscout-flips.html', output: 'flips.png' },
    { file: 'dealscout-profits.html', output: 'profits.png' },
    { file: 'dealscout-settings.html', output: 'settings.png' },
    { file: 'dealscout-detail.html', output: 'detail.png' },
    { file: 'dealscout-notifications.html', output: 'notifications.png' },
  ],
  'documind': [
    { file: 'documind-dashboard.html', output: 'dashboard.png' },
    { file: 'documind-documents.html', output: 'documents.png' },
    { file: 'documind-search.html', output: 'search.png' },
    { file: 'documind-chat.html', output: 'chat.png' },
    { file: 'documind-analytics.html', output: 'analytics.png' },
    { file: 'documind-settings.html', output: 'settings.png' },
  ],
  'smartclassify': [
    { file: 'smartclassify-dashboard.html', output: 'dashboard.png' },
    { file: 'smartclassify-classify.html', output: 'classify.png' },
    { file: 'smartclassify-batch.html', output: 'batch.png' },
    { file: 'smartclassify-categories.html', output: 'categories.png' },
    { file: 'smartclassify-analytics.html', output: 'analytics.png' },
    { file: 'smartclassify-api.html', output: 'api.png' },
  ],
  'fieldops': [
    { file: 'fieldops-dashboard.html', output: 'dashboard.png' },
    { file: 'fieldops-tasks.html', output: 'tasks.png' },
    { file: 'fieldops-task-detail.html', output: 'task-detail.png' },
    { file: 'fieldops-map.html', output: 'map.png' },
    { file: 'fieldops-photos.html', output: 'photos.png' },
    { file: 'fieldops-schedule.html', output: 'schedule.png' },
    { file: 'fieldops-settings.html', output: 'settings.png' },
  ],
  'itsjesse-mobile': [
    { file: 'itsjesse-mobile-dashboard.html', output: 'dashboard.png' },
    { file: 'itsjesse-mobile-projects.html', output: 'projects.png' },
    { file: 'itsjesse-mobile-project-detail.html', output: 'project-detail.png' },
    { file: 'itsjesse-mobile-services.html', output: 'services.png' },
    { file: 'itsjesse-mobile-about.html', output: 'about.png' },
    { file: 'itsjesse-mobile-contact.html', output: 'contact.png' },
  ],
};

// Step 1: Fix viewport in all mockups
function fixViewports() {
  console.log('\n=== Fixing viewports in all mockups ===\n');

  const mockupFiles = fs.readdirSync(mockupsDir).filter(f => f.endsWith('.html'));
  let fixed = 0;

  for (const file of mockupFiles) {
    const filePath = path.join(mockupsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Check if it has the old responsive viewport
    if (content.includes('width=device-width')) {
      // Replace with fixed viewport
      content = content.replace(
        /<meta name="viewport" content="width=device-width, initial-scale=1\.0">/g,
        '<meta name="viewport" content="width=1440, height=900">'
      );
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${file}`);
      fixed++;
    }
  }

  console.log(`\nFixed ${fixed} mockups`);
}

// Step 2: Take all screenshots
async function takeAllScreenshots() {
  console.log('\n=== Taking all screenshots ===\n');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  let totalScreenshots = 0;

  for (const [project, mockups] of Object.entries(projectMockups)) {
    const projectDir = path.join(outputDir, project);

    // Create project directory if it doesn't exist
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
      console.log(`Created directory: ${projectDir}`);
    }

    for (const { file, output } of mockups) {
      const mockupPath = path.join(mockupsDir, file);
      const outputPath = path.join(projectDir, output);

      if (!fs.existsSync(mockupPath)) {
        console.log(`⚠️ Missing mockup: ${file}`);
        continue;
      }

      try {
        await page.goto(`file://${mockupPath}`);
        await page.waitForTimeout(500); // Wait for fonts to load
        await page.screenshot({ path: outputPath });
        console.log(`✓ ${project}/${output}`);
        totalScreenshots++;
      } catch (error) {
        console.log(`✗ Failed: ${project}/${output} - ${error.message}`);
      }
    }
  }

  await browser.close();
  console.log(`\nTotal screenshots taken: ${totalScreenshots}`);
}

// Run both steps
fixViewports();
takeAllScreenshots().catch(console.error);
