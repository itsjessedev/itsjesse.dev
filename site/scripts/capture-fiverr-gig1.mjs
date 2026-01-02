import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gigDir = join(__dirname, '../../fiverr/gig-01-ai-integration');

const mockups = [
    { file: 'image-1-chatbot.html', output: 'gig-image-1-chatbot.png' },
    { file: 'image-2-code.html', output: 'gig-image-2-code.png' },
    { file: 'image-3-features.html', output: 'gig-image-3-features.png' }
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
