import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '../public/branding');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function exportAssets() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set transparent background
  await page.setViewportSize({ width: 600, height: 600 });

  // Export 512x512 icon
  console.log('Exporting stripe-icon-512.png...');
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: transparent; display: flex; align-items: center; justify-content: center; width: 512px; height: 512px; }
      </style>
    </head>
    <body>
      <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366F1"/>
            <stop offset="100%" style="stop-color:#8B5CF6"/>
          </linearGradient>
        </defs>
        <circle cx="256" cy="256" r="256" fill="url(#g)"/>
        <text x="256" y="340" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="280" font-weight="700" fill="white" text-anchor="middle">J</text>
      </svg>
    </body>
    </html>
  `);
  await page.setViewportSize({ width: 512, height: 512 });
  await page.screenshot({
    path: path.join(outputDir, 'stripe-icon-512.png'),
    omitBackground: true
  });

  // Export 128x128 icon (common size)
  console.log('Exporting stripe-icon-128.png...');
  await page.setViewportSize({ width: 128, height: 128 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: transparent; display: flex; align-items: center; justify-content: center; width: 128px; height: 128px; }
      </style>
    </head>
    <body>
      <svg width="128" height="128" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366F1"/>
            <stop offset="100%" style="stop-color:#8B5CF6"/>
          </linearGradient>
        </defs>
        <circle cx="256" cy="256" r="256" fill="url(#g)"/>
        <text x="256" y="340" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="280" font-weight="700" fill="white" text-anchor="middle">J</text>
      </svg>
    </body>
    </html>
  `);
  await page.screenshot({
    path: path.join(outputDir, 'stripe-icon-128.png'),
    omitBackground: true
  });

  // Export full logo (light)
  console.log('Exporting stripe-logo-light.png...');
  await page.setViewportSize({ width: 400, height: 120 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: white; display: flex; align-items: center; justify-content: center; width: 400px; height: 120px; }
      </style>
    </head>
    <body>
      <svg width="400" height="120" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366F1"/>
            <stop offset="100%" style="stop-color:#8B5CF6"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="50" fill="url(#g)"/>
        <text x="60" y="82" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="60" font-weight="700" fill="white" text-anchor="middle">J</text>
        <text x="130" y="75" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="600" fill="#1f2937">itsjesse.dev</text>
      </svg>
    </body>
    </html>
  `);
  await page.screenshot({
    path: path.join(outputDir, 'stripe-logo-light.png')
  });

  // Export full logo (dark/transparent)
  console.log('Exporting stripe-logo-dark.png...');
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: transparent; display: flex; align-items: center; justify-content: center; width: 400px; height: 120px; }
      </style>
    </head>
    <body>
      <svg width="400" height="120" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366F1"/>
            <stop offset="100%" style="stop-color:#8B5CF6"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="50" fill="url(#g)"/>
        <text x="60" y="82" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="60" font-weight="700" fill="white" text-anchor="middle">J</text>
        <text x="130" y="75" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="600" fill="#ffffff">itsjesse.dev</text>
      </svg>
    </body>
    </html>
  `);
  await page.screenshot({
    path: path.join(outputDir, 'stripe-logo-dark.png'),
    omitBackground: true
  });

  await browser.close();
  console.log('\nAll assets exported to:', outputDir);
  console.log('\nFiles created:');
  console.log('  - stripe-icon-512.png  (upload to Stripe)');
  console.log('  - stripe-icon-128.png  (smaller version)');
  console.log('  - stripe-logo-light.png (for invoices)');
  console.log('  - stripe-logo-dark.png  (transparent, for dark backgrounds)');
}

exportAssets().catch(console.error);
