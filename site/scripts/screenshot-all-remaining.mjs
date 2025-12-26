import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockupsDir = path.join(__dirname, '..', 'mockups');
const publicDir = path.join(__dirname, '..', 'public', 'projects');

const projects = {
  invoicebot: [
    { file: 'invoicebot-dashboard.html', output: 'dashboard.png' },
    { file: 'invoicebot-upload.html', output: 'upload.png' },
    { file: 'invoicebot-processing.html', output: 'processing.png' },
    { file: 'invoicebot-review.html', output: 'review.png' },
    { file: 'invoicebot-history.html', output: 'history.png' },
    { file: 'invoicebot-settings.html', output: 'settings.png' },
  ],
  leadscore: [
    { file: 'leadscore-dashboard.html', output: 'dashboard.png' },
    { file: 'leadscore-leads.html', output: 'leads.png' },
    { file: 'leadscore-scoring.html', output: 'scoring.png' },
    { file: 'leadscore-analytics.html', output: 'analytics.png' },
    { file: 'leadscore-integrations.html', output: 'integrations.png' },
    { file: 'leadscore-settings.html', output: 'settings.png' },
  ],
  stockalert: [
    { file: 'stockalert-dashboard.html', output: 'dashboard.png' },
    { file: 'stockalert-inventory.html', output: 'inventory.png' },
    { file: 'stockalert-locations.html', output: 'locations.png' },
    { file: 'stockalert-alerts.html', output: 'alerts.png' },
    { file: 'stockalert-reorder.html', output: 'reorder.png' },
    { file: 'stockalert-settings.html', output: 'settings.png' },
  ],
  feedbackpulse: [
    { file: 'feedbackpulse-dashboard.html', output: 'dashboard.png' },
    { file: 'feedbackpulse-reviews.html', output: 'reviews.png' },
    { file: 'feedbackpulse-surveys.html', output: 'surveys.png' },
    { file: 'feedbackpulse-trends.html', output: 'trends.png' },
    { file: 'feedbackpulse-alerts.html', output: 'alerts.png' },
    { file: 'feedbackpulse-sources.html', output: 'sources.png' },
  ],
  databridge: [
    { file: 'databridge-dashboard.html', output: 'dashboard.png' },
    { file: 'databridge-sources.html', output: 'sources.png' },
    { file: 'databridge-mapping.html', output: 'mapping.png' },
    { file: 'databridge-validation.html', output: 'validation.png' },
    { file: 'databridge-progress.html', output: 'progress.png' },
    { file: 'databridge-history.html', output: 'history.png' },
  ],
  workflowbot: [
    { file: 'workflowbot-dashboard.html', output: 'dashboard.png' },
    { file: 'workflowbot-workflows.html', output: 'workflows.png' },
    { file: 'workflowbot-editor.html', output: 'editor.png' },
    { file: 'workflowbot-requests.html', output: 'requests.png' },
    { file: 'workflowbot-approvals.html', output: 'approvals.png' },
    { file: 'workflowbot-settings.html', output: 'settings.png' },
  ],
};

async function takeScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  for (const [projectName, pages] of Object.entries(projects)) {
    console.log(`\n=== ${projectName.toUpperCase()} ===`);
    const outputDir = path.join(publicDir, projectName);

    for (const { file, output } of pages) {
      const filePath = `file://${path.join(mockupsDir, file)}`;
      const outputPath = path.join(outputDir, output);

      try {
        console.log(`  Capturing ${file}...`);
        await page.goto(filePath);
        await page.waitForTimeout(500);
        await page.screenshot({
          path: outputPath,
          fullPage: false
        });
        console.log(`    Saved ${output}`);
      } catch (error) {
        console.error(`    ERROR: ${error.message}`);
      }
    }
  }

  await browser.close();
  console.log('\nDone! All screenshots captured.');
}

takeScreenshots().catch(console.error);
