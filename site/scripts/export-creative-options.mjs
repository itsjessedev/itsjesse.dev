import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '../public/branding');

const options = [
  {
    name: 'connect-nodes',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="#0f172a"/><line x1="160" y1="160" x2="352" y2="256" stroke="url(#g)" stroke-width="16" stroke-linecap="round"/><line x1="160" y1="352" x2="352" y2="256" stroke="url(#g)" stroke-width="16" stroke-linecap="round"/><circle cx="160" cy="160" r="48" fill="url(#g)"/><circle cx="160" cy="352" r="48" fill="url(#g)"/><circle cx="352" cy="256" r="56" fill="#fff"/><circle cx="160" cy="160" r="16" fill="#0f172a"/><circle cx="160" cy="352" r="16" fill="#0f172a"/><circle cx="352" cy="256" r="20" fill="url(#g)"/></svg>`
  },
  {
    name: 'flow-merge',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="url(#g)"/><path d="M 100 160 Q 200 160 256 256 Q 312 352 412 352" stroke="white" stroke-width="24" fill="none" stroke-linecap="round"/><path d="M 100 352 Q 200 352 256 256 Q 312 160 412 160" stroke="white" stroke-width="24" fill="none" stroke-linecap="round"/><circle cx="256" cy="256" r="40" fill="white"/><circle cx="256" cy="256" r="16" fill="url(#g)"/></svg>`
  },
  {
    name: 'brackets-abstract',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="#0f172a"/><path d="M 180 120 L 120 120 L 120 256 L 180 256" stroke="url(#g)" stroke-width="28" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M 180 256 L 120 256 L 120 392 L 180 392" stroke="url(#g)" stroke-width="28" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M 332 120 L 392 120 L 392 256 L 332 256" stroke="#fff" stroke-width="28" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M 332 256 L 392 256 L 392 392 L 332 392" stroke="#fff" stroke-width="28" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="256" cy="256" r="24" fill="url(#g)"/></svg>`
  },
  {
    name: 'pipeline',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="url(#g)"/><rect x="80" y="140" width="100" height="40" rx="8" fill="white"/><rect x="80" y="236" width="100" height="40" rx="8" fill="white"/><rect x="80" y="332" width="100" height="40" rx="8" fill="white"/><path d="M 200 160 L 240 256 L 200 352" stroke="white" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/><rect x="280" y="200" width="152" height="112" rx="16" fill="white"/><rect x="300" y="220" width="60" height="12" rx="4" fill="url(#g)"/><rect x="300" y="244" width="112" height="12" rx="4" fill="url(#g)" opacity="0.5"/><rect x="300" y="268" width="80" height="12" rx="4" fill="url(#g)" opacity="0.3"/></svg>`
  },
  {
    name: 'circuit',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="#0f172a"/><path d="M 100 256 H 180" stroke="url(#g)" stroke-width="12" stroke-linecap="round"/><path d="M 332 256 H 412" stroke="url(#g)" stroke-width="12" stroke-linecap="round"/><path d="M 256 100 V 180" stroke="url(#g)" stroke-width="12" stroke-linecap="round"/><path d="M 256 332 V 412" stroke="url(#g)" stroke-width="12" stroke-linecap="round"/><rect x="180" y="180" width="152" height="152" rx="24" fill="url(#g)"/><rect x="212" y="212" width="88" height="88" rx="12" fill="#0f172a"/><circle cx="256" cy="256" r="24" fill="url(#g)"/></svg>`
  },
  {
    name: 'sync-arrows',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="url(#g)"/><path d="M 256 100 A 156 156 0 0 1 412 256" stroke="white" stroke-width="32" fill="none" stroke-linecap="round"/><path d="M 256 412 A 156 156 0 0 1 100 256" stroke="white" stroke-width="32" fill="none" stroke-linecap="round"/><polygon points="412,256 372,216 372,296" fill="white"/><polygon points="100,256 140,296 140,216" fill="white"/><circle cx="256" cy="256" r="48" fill="white"/><circle cx="256" cy="256" r="20" fill="url(#g)"/></svg>`
  },
  {
    name: 'api-connect',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="#0f172a"/><rect x="80" y="200" width="120" height="112" rx="16" fill="url(#g)"/><rect x="180" y="224" width="40" height="24" rx="4" fill="url(#g)"/><rect x="180" y="264" width="40" height="24" rx="4" fill="url(#g)"/><rect x="312" y="200" width="120" height="112" rx="16" fill="#fff"/><rect x="292" y="224" width="40" height="24" rx="4" fill="#fff"/><rect x="292" y="264" width="40" height="24" rx="4" fill="#fff"/><circle cx="256" cy="236" r="8" fill="#a5b4fc"/><circle cx="256" cy="276" r="8" fill="#a5b4fc"/></svg>`
  },
  {
    name: 'bolt',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="url(#g)"/><polygon points="296,80 176,240 248,240 216,432 336,272 264,272" fill="white"/></svg>`
  },
  {
    name: 'transform',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="#0f172a"/><rect x="80" y="180" width="100" height="152" rx="12" fill="url(#g)"/><rect x="96" y="200" width="68" height="8" rx="2" fill="white" opacity="0.6"/><rect x="96" y="220" width="52" height="8" rx="2" fill="white" opacity="0.4"/><rect x="96" y="240" width="60" height="8" rx="2" fill="white" opacity="0.4"/><path d="M 200 256 H 300" stroke="url(#g)" stroke-width="20" stroke-linecap="round"/><polygon points="320,256 280,220 280,292" fill="url(#g)"/><rect x="332" y="180" width="100" height="152" rx="12" fill="#fff"/><circle cx="382" cy="230" r="24" fill="url(#g)"/><rect x="348" y="270" width="68" height="8" rx="2" fill="url(#g)" opacity="0.4"/><rect x="348" y="290" width="52" height="8" rx="2" fill="url(#g)" opacity="0.3"/></svg>`
  },
  {
    name: 'webhook',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="url(#g)"/><path d="M 336 140 L 336 280 Q 336 360 256 360 Q 176 360 176 280 L 176 320" stroke="white" stroke-width="48" fill="none" stroke-linecap="round"/><circle cx="336" cy="140" r="32" fill="white"/></svg>`
  },
  {
    name: 'modular',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="#0f172a"/><rect x="80" y="80" width="140" height="140" rx="20" fill="url(#g)"/><rect x="292" y="80" width="140" height="140" rx="20" fill="#fff"/><rect x="80" y="292" width="140" height="140" rx="20" fill="#fff"/><rect x="292" y="292" width="140" height="140" rx="20" fill="url(#g)"/><line x1="220" y1="150" x2="292" y2="150" stroke="#8B5CF6" stroke-width="12" stroke-linecap="round"/><line x1="150" y1="220" x2="150" y2="292" stroke="#8B5CF6" stroke-width="12" stroke-linecap="round"/><line x1="362" y1="220" x2="362" y2="292" stroke="#8B5CF6" stroke-width="12" stroke-linecap="round"/><line x1="220" y1="362" x2="292" y2="362" stroke="#8B5CF6" stroke-width="12" stroke-linecap="round"/></svg>`
  },
  {
    name: 'cursor-blink',
    svg: `<svg width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="#1e1e2e"/><rect x="80" y="200" width="120" height="16" rx="4" fill="#6366F1" opacity="0.5"/><rect x="240" y="160" width="32" height="192" rx="4" fill="url(#g)"/><rect x="300" y="244" width="100" height="24" rx="4" fill="#fff" opacity="0.2"/></svg>`
  }
];

async function exportOptions() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 512, height: 512 });

  for (const opt of options) {
    console.log(`Exporting ${opt.name}...`);
    await page.setContent(`<!DOCTYPE html><html><head><style>body{margin:0;padding:0;}</style></head><body>${opt.svg}</body></html>`);
    await page.waitForTimeout(100);
    await page.screenshot({
      path: path.join(outputDir, `creative-${opt.name}.png`)
    });
  }

  await browser.close();
  console.log('\nDone!');
}

exportOptions().catch(console.error);
