import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gigDir = join(__dirname, '../../fiverr/gig-05-bug-fixes');

const mockups = [
    { file: 'image-1-main.html', output: 'gig-image-1-main.png' },
    { file: 'image-2-types.html', output: 'gig-image-2-types.png' },
    { file: 'image-3-process.html', output: 'gig-image-3-process.png' }
];

async function captureImages() {
    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: 1280, height: 769 },
        deviceScaleFactor: 1
    });

    const page = await context.newPage();
    await mkdir(join(gigDir, 'images'), { recursive: true });

    for (const mockup of mockups) {
        const filePath = `file://${join(gigDir, 'mockups', mockup.file)}`;
        console.log(`Capturing ${mockup.file}...`);
        await page.goto(filePath);
        await page.waitForTimeout(1000);
        await page.screenshot({
            path: join(gigDir, 'images', mockup.output),
            fullPage: false
        });
        console.log(`  -> Saved ${mockup.output}`);
    }

    await browser.close();
    console.log(`\nDone! Images saved to ${join(gigDir, 'images')}`);
}

captureImages().catch(console.error);
