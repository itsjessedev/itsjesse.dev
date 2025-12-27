import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const mockupsDir = '/home/jesse/itsjesse.dev/site/mockups';
const outputDir = '/home/jesse/itsjesse.dev/site/public/projects';

// Projects that need screenshots from new mockups
const projectMockups = {
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

async function takeScreenshots() {
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

takeScreenshots().catch(console.error);
