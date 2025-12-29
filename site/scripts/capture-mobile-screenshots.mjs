import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MOCKUPS_DIR = join(__dirname, '../mockups');
const OUTPUT_DIR = join(__dirname, '../public/projects/itsjesse-mobile');

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const screens = [
  { name: 'dashboard', file: 'itsjesse-mobile-dashboard.html', output: 'dashboard.png', isHero: true },
  { name: 'projects', file: 'itsjesse-mobile-projects.html', output: 'projects.png' },
  { name: 'services', file: 'itsjesse-mobile-services.html', output: 'services.png' },
  { name: 'resume', file: 'itsjesse-mobile-resume.html', output: 'resume.png' },
  { name: 'about', file: 'itsjesse-mobile-about.html', output: 'about.png' },
  { name: 'contact', file: 'itsjesse-mobile-contact.html', output: 'contact.png' },
  { name: 'project-detail', file: 'itsjesse-mobile-project-detail.html', output: 'project-detail.png' },
];

async function captureScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  for (const screen of screens) {
    console.log(`Capturing ${screen.name}...`);
    const page = await context.newPage();
    const filePath = join(MOCKUPS_DIR, screen.file);

    await page.goto(`file://${filePath}`);
    await page.waitForTimeout(500);

    // Take screenshot
    const outputPath = join(OUTPUT_DIR, screen.output);
    await page.screenshot({ path: outputPath });
    console.log(`  Saved: ${outputPath}`);

    // Also save as hero.png if this is the home screen
    if (screen.isHero) {
      const heroPath = join(OUTPUT_DIR, 'hero.png');
      await page.screenshot({ path: heroPath });
      console.log(`  Saved: ${heroPath}`);
    }

    await page.close();
  }

  await browser.close();
  console.log('\nAll screenshots captured!');
  console.log('Output directory:', OUTPUT_DIR);
}

captureScreenshots().catch(console.error);
