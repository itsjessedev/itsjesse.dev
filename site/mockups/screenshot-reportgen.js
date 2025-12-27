const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const mockupsDir = __dirname;
const outputDir = path.join(__dirname, '..', 'public', 'projects', 'reportgen');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const screenshots = [
  {
    file: 'reportgen-dashboard.html',
    output: 'dashboard.png'
  },
  {
    file: 'reportgen-templates.html',
    output: 'templates.png'
  },
  {
    file: 'reportgen-editor.html',
    output: 'editor.png'
  },
  {
    file: 'reportgen-sources.html',
    output: 'sources.png'
  },
  {
    file: 'reportgen-schedule.html',
    output: 'schedule.png'
  },
  {
    file: 'reportgen-history.html',
    output: 'history.png'
  }
];

async function takeScreenshots() {
  console.log('Starting screenshot capture for ReportGen mockups...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const screenshot of screenshots) {
      const page = await browser.newPage();

      // Set viewport to desktop size
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
      });

      const filePath = `file://${path.join(mockupsDir, screenshot.file)}`;
      console.log(`Capturing: ${screenshot.file}`);

      await page.goto(filePath, {
        waitUntil: 'networkidle0'
      });

      // Wait a bit for fonts and styles to fully load
      await page.waitForTimeout(1000);

      const outputPath = path.join(outputDir, screenshot.output);
      await page.screenshot({
        path: outputPath,
        fullPage: true
      });

      console.log(`✓ Saved: ${screenshot.output}\n`);

      await page.close();
    }

    console.log('All screenshots captured successfully!');
    console.log(`Output directory: ${outputDir}`);

  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
