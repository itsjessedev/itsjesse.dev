import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pages = [
  { name: 'invoicebot-dashboard', file: 'invoicebot-dashboard.html' },
  { name: 'invoicebot-upload', file: 'invoicebot-upload.html' },
  { name: 'invoicebot-processing', file: 'invoicebot-processing.html' },
  { name: 'invoicebot-review', file: 'invoicebot-review.html' },
  { name: 'invoicebot-history', file: 'invoicebot-history.html' },
  { name: 'invoicebot-settings', file: 'invoicebot-settings.html' },
];

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const page of pages) {
      console.log(`Capturing ${page.name}...`);

      const browserPage = await browser.newPage();
      await browserPage.setViewport({ width: 1920, height: 1080 });

      const filePath = join(__dirname, 'mockups', page.file);
      await browserPage.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

      // Wait a bit for fonts and animations to settle
      await new Promise(resolve => setTimeout(resolve, 1000));

      const outputPath = join(__dirname, 'public', 'projects', 'invoicebot', `${page.name}.png`);
      await browserPage.screenshot({
        path: outputPath,
        fullPage: false
      });

      console.log(`✓ Saved ${page.name}.png`);
      await browserPage.close();
    }
  } finally {
    await browser.close();
  }

  console.log('\n✅ All screenshots captured successfully!');
}

captureScreenshots().catch(console.error);
