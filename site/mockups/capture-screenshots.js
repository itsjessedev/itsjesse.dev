const { chromium } = require('playwright');
const path = require('path');

const mockups = [
  { file: 'bookingsync-dashboard.html', output: 'dashboard.png' },
  { file: 'bookingsync-calendar.html', output: 'calendar.png' },
  { file: 'bookingsync-bookings.html', output: 'bookings.png' },
  { file: 'bookingsync-reminders.html', output: 'reminders.png' },
  { file: 'bookingsync-widget.html', output: 'widget.png' },
  { file: 'bookingsync-settings.html', output: 'settings.png' }
];

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  for (const mockup of mockups) {
    const filePath = path.join(__dirname, mockup.file);
    const outputPath = path.join(__dirname, '../public/projects/bookingsync', mockup.output);

    console.log(`Capturing ${mockup.file}...`);
    await page.goto(`file://${filePath}`);
    await page.waitForTimeout(500); // Wait for any animations
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`✓ Saved ${mockup.output}`);
  }

  await browser.close();
  console.log('\nAll screenshots captured successfully!');
})();
