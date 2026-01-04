import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '../public/branding');

const options = [
  {
    name: 'terminal',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366F1"/>
          <stop offset="100%" style="stop-color:#8B5CF6"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="#1e1e2e"/>
      <text x="100" y="320" font-family="'JetBrains Mono', monospace" font-size="180" font-weight="500" fill="url(#g)">$</text>
      <text x="220" y="320" font-family="'JetBrains Mono', monospace" font-size="180" font-weight="700" fill="#ffffff">j_</text>
    </svg>`
  },
  {
    name: 'curly-braces',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366F1"/>
          <stop offset="100%" style="stop-color:#8B5CF6"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="url(#g)"/>
      <text x="256" y="340" font-family="'Fira Code', monospace" font-size="280" font-weight="500" fill="white" text-anchor="middle">{j}</text>
    </svg>`
  },
  {
    name: 'jsx-tag',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366F1"/>
          <stop offset="100%" style="stop-color:#8B5CF6"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="#0f172a"/>
      <text x="256" y="330" font-family="'Fira Code', monospace" font-size="200" font-weight="500" fill="url(#g)" text-anchor="middle">&lt;j/&gt;</text>
    </svg>`
  },
  {
    name: 'api-route',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366F1"/>
          <stop offset="100%" style="stop-color:#8B5CF6"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="url(#g)"/>
      <text x="256" y="320" font-family="'JetBrains Mono', monospace" font-size="200" font-weight="600" fill="white" text-anchor="middle">/j</text>
    </svg>`
  },
  {
    name: 'function',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366F1"/>
          <stop offset="100%" style="stop-color:#8B5CF6"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="#1e1e2e"/>
      <text x="256" y="320" font-family="'Fira Code', monospace" font-size="160" font-weight="500" text-anchor="middle">
        <tspan fill="#c792ea">j</tspan><tspan fill="#89ddff">()</tspan>
      </text>
    </svg>`
  },
  {
    name: 'hexagon',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366F1"/>
          <stop offset="100%" style="stop-color:#8B5CF6"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="#0f172a"/>
      <polygon points="256,60 420,150 420,330 256,420 92,330 92,150" fill="none" stroke="url(#g)" stroke-width="24"/>
      <text x="256" y="300" font-family="'JetBrains Mono', monospace" font-size="180" font-weight="700" fill="white" text-anchor="middle">J</text>
    </svg>`
  },
  {
    name: 'arrow-fn',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366F1"/>
          <stop offset="100%" style="stop-color:#8B5CF6"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="url(#g)"/>
      <text x="256" y="310" font-family="'Fira Code', monospace" font-size="140" font-weight="500" fill="white" text-anchor="middle">()=&gt;j</text>
    </svg>`
  }
];

async function exportOptions() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const opt of options) {
    console.log(`Exporting ${opt.name}...`);
    await page.setViewportSize({ width: 512, height: 512 });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Fira+Code:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; background: transparent; }
        </style>
      </head>
      <body>${opt.svg}</body>
      </html>
    `);
    // Wait for fonts
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(outputDir, `option-${opt.name}.png`),
      omitBackground: true
    });
  }

  await browser.close();
  console.log('\nDone! Options exported to:', outputDir);
}

exportOptions().catch(console.error);
