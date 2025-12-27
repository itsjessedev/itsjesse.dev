import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockupsDir = path.join(__dirname, '..', 'mockups');
const publicDir = path.join(__dirname, '..', 'public', 'projects');

const projects = {
  documind: [
    { file: 'documind-dashboard.html', output: 'dashboard.png' },
  ],
  smartclassify: [
    { file: 'smartclassify-dashboard.html', output: 'dashboard.png' },
  ],
  'itsjesse-mobile': [
    { file: 'itsjesse-mobile-dashboard.html', output: 'dashboard.png' },
  ],
  fieldops: [
    { file: 'fieldops-dashboard.html', output: 'dashboard.png' },
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
  console.log('\nDone! AI/ML screenshots captured.');
}

takeScreenshots().catch(console.error);
