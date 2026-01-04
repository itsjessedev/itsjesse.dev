import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '../public/branding');

// Enhanced modular design with more pop
const modularIcon = `
<svg width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="#0f172a"/>

  <!-- Glowing connection lines -->
  <line x1="220" y1="150" x2="292" y2="150" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>
  <line x1="150" y1="220" x2="150" y2="292" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>
  <line x1="362" y1="220" x2="362" y2="292" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>
  <line x1="220" y1="362" x2="292" y2="362" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>

  <!-- Connection nodes (dots at line endpoints) -->
  <circle cx="220" cy="150" r="10" fill="#a78bfa" filter="url(#softGlow)"/>
  <circle cx="292" cy="150" r="10" fill="#a78bfa" filter="url(#softGlow)"/>
  <circle cx="150" cy="220" r="10" fill="#a78bfa" filter="url(#softGlow)"/>
  <circle cx="150" cy="292" r="10" fill="#a78bfa" filter="url(#softGlow)"/>
  <circle cx="362" cy="220" r="10" fill="#a78bfa" filter="url(#softGlow)"/>
  <circle cx="362" cy="292" r="10" fill="#a78bfa" filter="url(#softGlow)"/>
  <circle cx="220" cy="362" r="10" fill="#a78bfa" filter="url(#softGlow)"/>
  <circle cx="292" cy="362" r="10" fill="#a78bfa" filter="url(#softGlow)"/>

  <!-- Top-left module (gradient) -->
  <rect x="70" y="70" width="150" height="150" rx="24" fill="url(#brandGrad)" filter="url(#softGlow)"/>

  <!-- Top-right module (white) -->
  <rect x="292" y="70" width="150" height="150" rx="24" fill="#ffffff"/>

  <!-- Bottom-left module (white) -->
  <rect x="70" y="292" width="150" height="150" rx="24" fill="#ffffff"/>

  <!-- Bottom-right module (gradient) -->
  <rect x="292" y="292" width="150" height="150" rx="24" fill="url(#brandGrad)" filter="url(#softGlow)"/>
</svg>
`;

// Logo with dark text (for light backgrounds)
const logoLightBg = `
<svg width="340" height="120" viewBox="0 0 340 120">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Icon (scaled down) -->
  <g transform="translate(10, 10) scale(0.195)">
    <rect width="512" height="512" rx="96" fill="#0f172a"/>
    <line x1="220" y1="150" x2="292" y2="150" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="150" y1="220" x2="150" y2="292" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="362" y1="220" x2="362" y2="292" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="220" y1="362" x2="292" y2="362" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>
    <circle cx="220" cy="150" r="10" fill="#a78bfa"/>
    <circle cx="292" cy="150" r="10" fill="#a78bfa"/>
    <circle cx="150" cy="220" r="10" fill="#a78bfa"/>
    <circle cx="150" cy="292" r="10" fill="#a78bfa"/>
    <circle cx="362" cy="220" r="10" fill="#a78bfa"/>
    <circle cx="362" cy="292" r="10" fill="#a78bfa"/>
    <circle cx="220" cy="362" r="10" fill="#a78bfa"/>
    <circle cx="292" cy="362" r="10" fill="#a78bfa"/>
    <rect x="70" y="70" width="150" height="150" rx="24" fill="url(#brandGrad)"/>
    <rect x="292" y="70" width="150" height="150" rx="24" fill="#ffffff"/>
    <rect x="70" y="292" width="150" height="150" rx="24" fill="#ffffff"/>
    <rect x="292" y="292" width="150" height="150" rx="24" fill="url(#brandGrad)"/>
  </g>

  <!-- Text - dark for light backgrounds -->
  <text x="130" y="72" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="42" font-weight="600" fill="#1f2937">itsjesse</text>
  <text x="130" y="100" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="400" fill="#6366F1">.dev</text>
</svg>
`;

// Logo with white text (for dark backgrounds)
const logoDarkBg = `
<svg width="340" height="120" viewBox="0 0 340 120">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Icon (scaled down) -->
  <g transform="translate(10, 10) scale(0.195)">
    <rect width="512" height="512" rx="96" fill="#0f172a"/>
    <line x1="220" y1="150" x2="292" y2="150" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="150" y1="220" x2="150" y2="292" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="362" y1="220" x2="362" y2="292" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="220" y1="362" x2="292" y2="362" stroke="#8B5CF6" stroke-width="14" stroke-linecap="round" filter="url(#glow)"/>
    <circle cx="220" cy="150" r="10" fill="#a78bfa"/>
    <circle cx="292" cy="150" r="10" fill="#a78bfa"/>
    <circle cx="150" cy="220" r="10" fill="#a78bfa"/>
    <circle cx="150" cy="292" r="10" fill="#a78bfa"/>
    <circle cx="362" cy="220" r="10" fill="#a78bfa"/>
    <circle cx="362" cy="292" r="10" fill="#a78bfa"/>
    <circle cx="220" cy="362" r="10" fill="#a78bfa"/>
    <circle cx="292" cy="362" r="10" fill="#a78bfa"/>
    <rect x="70" y="70" width="150" height="150" rx="24" fill="url(#brandGrad)"/>
    <rect x="292" y="70" width="150" height="150" rx="24" fill="#ffffff"/>
    <rect x="70" y="292" width="150" height="150" rx="24" fill="#ffffff"/>
    <rect x="292" y="292" width="150" height="150" rx="24" fill="url(#brandGrad)"/>
  </g>

  <!-- Text - white for dark backgrounds -->
  <text x="130" y="72" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="42" font-weight="600" fill="#ffffff">itsjesse</text>
  <text x="130" y="100" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="400" fill="#a78bfa">.dev</text>
</svg>
`;

async function exportAssets() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Export 512x512 icon (transparent)
  console.log('Exporting stripe-icon.png (512x512)...');
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<!DOCTYPE html><html><head><style>body{margin:0;padding:0;background:transparent;}</style></head><body>${modularIcon}</body></html>`);
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(outputDir, 'stripe-icon.png'), omitBackground: true });

  // Export 128x128 icon (transparent)
  console.log('Exporting stripe-icon-128.png...');
  await page.setViewportSize({ width: 128, height: 128 });
  await page.setContent(`<!DOCTYPE html><html><head><style>body{margin:0;padding:0;background:transparent;}</style></head><body><div style="width:128px;height:128px;">${modularIcon.replace('width="512" height="512"', 'width="128" height="128"')}</div></body></html>`);
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(outputDir, 'stripe-icon-128.png'), omitBackground: true });

  // Export logo for light backgrounds (transparent)
  console.log('Exporting stripe-logo-light.png (for light backgrounds)...');
  await page.setViewportSize({ width: 340, height: 120 });
  await page.setContent(`<!DOCTYPE html><html><head><style>body{margin:0;padding:0;background:transparent;}</style></head><body>${logoLightBg}</body></html>`);
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(outputDir, 'stripe-logo-light.png'), omitBackground: true });

  // Export logo for dark backgrounds (transparent)
  console.log('Exporting stripe-logo-dark.png (for dark backgrounds)...');
  await page.setContent(`<!DOCTYPE html><html><head><style>body{margin:0;padding:0;background:transparent;}</style></head><body>${logoDarkBg}</body></html>`);
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(outputDir, 'stripe-logo-dark.png'), omitBackground: true });

  await browser.close();

  // Save SVG sources
  fs.writeFileSync(path.join(outputDir, 'stripe-icon.svg'), modularIcon.trim());
  fs.writeFileSync(path.join(outputDir, 'stripe-logo-light.svg'), logoLightBg.trim());
  fs.writeFileSync(path.join(outputDir, 'stripe-logo-dark.svg'), logoDarkBg.trim());

  console.log('\nDone! Files created:');
  console.log('  - stripe-icon.png (512x512, transparent)');
  console.log('  - stripe-icon-128.png (128x128, transparent)');
  console.log('  - stripe-logo-light.png (dark text, for light backgrounds)');
  console.log('  - stripe-logo-dark.png (white text, for dark backgrounds)');
}

exportAssets().catch(console.error);
