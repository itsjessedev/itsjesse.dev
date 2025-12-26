import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockupsDir = path.join(__dirname, '..', 'mockups');
const outputDir = path.join(__dirname, '..', 'public', 'projects', 'orderhub');

const pages = [
  { file: 'orderhub-dashboard.html', output: 'dashboard.png' },
  { file: 'orderhub-orders.html', output: 'orders.png' },
  { file: 'orderhub-inventory.html', output: 'inventory.png' },
  { file: 'orderhub-integrations.html', output: 'integrations.png' },
  { file: 'orderhub-analytics.html', output: 'analytics.png' },
  { file: 'orderhub-settings.html', output: 'settings.png' },
];

async function takeScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  for (const { file, output } of pages) {
    const filePath = `file://${path.join(mockupsDir, file)}`;
    console.log(`Capturing ${file}...`);
    await page.goto(filePath);
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, output),
      fullPage: false
    });
    console.log(`  Saved ${output}`);
  }

  await browser.close();
  console.log('Done! All OrderHub screenshots captured.');
}

takeScreenshots().catch(console.error);
