import { chromium } from 'playwright';

async function recordDemo() {
  console.log('Starting demo recording...');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: '/home/jesse/itsjesse.dev/site/public/videos/',
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Dashboard - main hero view
  console.log('Recording Dashboard...');
  await page.goto('file:///home/jesse/itsjesse.dev/site/mockups/syncflow-dashboard.html');
  await page.waitForTimeout(2000);

  // Hover over stats cards
  const statCards = page.locator('.stat-card');
  for (let i = 0; i < await statCards.count(); i++) {
    await statCards.nth(i).hover();
    await page.waitForTimeout(600);
  }

  // Click Sync Now button
  const syncBtn = page.locator('text=Sync Now');
  if (await syncBtn.count() > 0) {
    await syncBtn.hover();
    await page.waitForTimeout(400);
    await syncBtn.click();
    await page.waitForTimeout(1000);
  }

  // Hover over recent syncs
  const syncRows = page.locator('.sync-row');
  for (let i = 0; i < Math.min(await syncRows.count(), 3); i++) {
    await syncRows.nth(i).hover();
    await page.waitForTimeout(400);
  }

  await page.waitForTimeout(1000);

  // Navigate to Sync History
  console.log('Recording Sync History...');
  await page.goto('file:///home/jesse/itsjesse.dev/site/mockups/syncflow-sync-history.html');
  await page.waitForTimeout(1500);

  // Hover over table rows
  const tableRows = page.locator('tbody tr');
  for (let i = 0; i < Math.min(await tableRows.count(), 5); i++) {
    await tableRows.nth(i).hover();
    await page.waitForTimeout(350);
  }

  // Click filter buttons
  const filters = page.locator('.filter');
  for (let i = 0; i < Math.min(await filters.count(), 3); i++) {
    await filters.nth(i).click();
    await page.waitForTimeout(500);
  }

  await page.waitForTimeout(1000);

  // Navigate to Field Mapping
  console.log('Recording Field Mapping...');
  await page.goto('file:///home/jesse/itsjesse.dev/site/mockups/syncflow-field-mapping.html');
  await page.waitForTimeout(1500);

  // Hover over mapping rows
  const mappingRows = page.locator('.mapping-row');
  for (let i = 0; i < Math.min(await mappingRows.count(), 5); i++) {
    await mappingRows.nth(i).hover();
    await page.waitForTimeout(500);
  }

  // Toggle some mappings
  const toggles = page.locator('.toggle');
  if (await toggles.count() > 0) {
    await toggles.nth(3).click();
    await page.waitForTimeout(600);
    await toggles.nth(3).click();
    await page.waitForTimeout(600);
  }

  // Hover over Save button
  const saveBtn = page.locator('text=Save Mappings');
  if (await saveBtn.count() > 0) {
    await saveBtn.hover();
    await page.waitForTimeout(800);
  }

  await page.waitForTimeout(1000);

  // Navigate to Analytics
  console.log('Recording Analytics...');
  await page.goto('file:///home/jesse/itsjesse.dev/site/mockups/syncflow-analytics.html');
  await page.waitForTimeout(1500);

  // Hover over stat cards
  const analyticsStats = page.locator('.stat-card');
  for (let i = 0; i < await analyticsStats.count(); i++) {
    await analyticsStats.nth(i).hover();
    await page.waitForTimeout(500);
  }

  // Hover over chart bars
  const bars = page.locator('.bar');
  for (let i = 0; i < await bars.count(); i++) {
    await bars.nth(i).hover();
    await page.waitForTimeout(250);
  }

  await page.waitForTimeout(1000);

  // Navigate to Settings
  console.log('Recording Settings...');
  await page.goto('file:///home/jesse/itsjesse.dev/site/mockups/syncflow-settings.html');
  await page.waitForTimeout(1500);

  // Click different nav items
  const navItems = page.locator('.nav-item');
  if (await navItems.count() > 2) {
    await navItems.nth(1).click();
    await page.waitForTimeout(400);
    await navItems.nth(2).click();
    await page.waitForTimeout(400);
    await navItems.nth(0).click();
    await page.waitForTimeout(600);
  }

  // Toggle settings
  const settingsToggles = page.locator('.toggle');
  if (await settingsToggles.count() > 0) {
    await settingsToggles.first().click();
    await page.waitForTimeout(500);
    await settingsToggles.first().click();
    await page.waitForTimeout(500);
  }

  // Interact with dropdown
  const select = page.locator('.select').first();
  if (await select.count() > 0) {
    await select.click();
    await page.waitForTimeout(600);
  }

  await page.waitForTimeout(1000);

  // Navigate to Alerts
  console.log('Recording Alerts...');
  await page.goto('file:///home/jesse/itsjesse.dev/site/mockups/syncflow-alerts.html');
  await page.waitForTimeout(1500);

  // Click filter tabs
  const alertFilters = page.locator('.filter');
  for (let i = 0; i < Math.min(await alertFilters.count(), 4); i++) {
    await alertFilters.nth(i).click();
    await page.waitForTimeout(400);
  }

  // Hover over alert action buttons
  const retryBtn = page.locator('text=Retry Now');
  if (await retryBtn.count() > 0) {
    await retryBtn.hover();
    await page.waitForTimeout(600);
  }

  const reviewBtn = page.locator('text=Review Mapping');
  if (await reviewBtn.count() > 0) {
    await reviewBtn.hover();
    await page.waitForTimeout(600);
  }

  const viewDetails = page.locator('text=View Details');
  if (await viewDetails.count() > 0) {
    await viewDetails.hover();
    await page.waitForTimeout(600);
  }

  // Hover over Mark All Read
  const markAllRead = page.locator('text=Mark All Read');
  if (await markAllRead.count() > 0) {
    await markAllRead.hover();
    await page.waitForTimeout(800);
  }

  await page.waitForTimeout(1000);

  // Return to Dashboard for final shot
  console.log('Final Dashboard shot...');
  await page.goto('file:///home/jesse/itsjesse.dev/site/mockups/syncflow-dashboard.html');
  await page.waitForTimeout(2000);

  // Close context to save video
  console.log('Saving video...');
  const videoPath = await page.video().path();
  await context.close();
  await browser.close();

  console.log('Video saved to:', videoPath);
  return videoPath;
}

recordDemo().catch(console.error);
