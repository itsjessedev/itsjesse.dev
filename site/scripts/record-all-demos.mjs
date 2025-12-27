import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const mockupsDir = '/home/jesse/itsjesse.dev/site/mockups';
const videosDir = '/home/jesse/itsjesse.dev/site/public/videos';

// Project demo configurations - all 15 projects
const projects = {
  syncflow: {
    pages: ['dashboard', 'sync-history', 'field-mapping', 'analytics', 'alerts', 'settings'],
    prefix: 'syncflow'
  },
  orderhub: {
    pages: ['dashboard', 'orders', 'inventory', 'analytics', 'integrations', 'settings'],
    prefix: 'orderhub'
  },
  invoicebot: {
    pages: ['dashboard', 'upload', 'processing', 'review', 'history', 'settings'],
    prefix: 'invoicebot'
  },
  leadscore: {
    pages: ['dashboard', 'leads', 'scoring', 'analytics', 'integrations', 'alerts'],
    prefix: 'leadscore'
  },
  stockalert: {
    pages: ['dashboard', 'inventory', 'locations', 'alerts', 'reorder', 'settings'],
    prefix: 'stockalert'
  },
  reportgen: {
    pages: ['dashboard', 'templates', 'editor', 'sources', 'schedule', 'history'],
    prefix: 'reportgen'
  },
  feedbackpulse: {
    pages: ['dashboard', 'reviews', 'surveys', 'trends', 'alerts', 'sources'],
    prefix: 'feedbackpulse'
  },
  bookingsync: {
    pages: ['dashboard', 'calendar', 'bookings', 'widget', 'reminders', 'settings'],
    prefix: 'bookingsync'
  },
  databridge: {
    pages: ['dashboard', 'sources', 'mapping', 'validation', 'progress', 'history'],
    prefix: 'databridge'
  },
  workflowbot: {
    pages: ['dashboard', 'workflows', 'editor', 'requests', 'approvals', 'audit'],
    prefix: 'workflowbot'
  },
  dealscout: {
    pages: ['deals', 'detail', 'flips', 'profits', 'notifications', 'settings'],
    prefix: 'dealscout'
  },
  documind: {
    pages: ['dashboard', 'documents', 'search', 'chat', 'analytics', 'settings'],
    prefix: 'documind'
  },
  smartclassify: {
    pages: ['dashboard', 'classify', 'batch', 'categories', 'analytics', 'api'],
    prefix: 'smartclassify'
  },
  fieldops: {
    pages: ['dashboard', 'tasks', 'task-detail', 'map', 'photos', 'schedule'],
    prefix: 'fieldops'
  },
  'itsjesse-mobile': {
    pages: ['dashboard', 'projects', 'project-detail', 'services', 'about', 'contact'],
    prefix: 'itsjesse-mobile'
  }
};

async function recordProjectDemo(projectName, config) {
  console.log(`\n=== Recording ${projectName.toUpperCase()} demo ===`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: videosDir,
      size: { width: 1440, height: 900 }
    },
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  for (const pageName of config.pages) {
    const filePath = `file://${mockupsDir}/${config.prefix}-${pageName}.html`;

    // Check if file exists
    const htmlFile = path.join(mockupsDir, `${config.prefix}-${pageName}.html`);
    if (!fs.existsSync(htmlFile)) {
      console.log(`  Skipping ${pageName} (file not found)`);
      continue;
    }

    console.log(`  Recording ${pageName}...`);
    await page.goto(filePath);
    await page.waitForTimeout(1500);

    // Generic interactions
    // Hover over stat cards
    const statCards = page.locator('.stat-card');
    const statCount = await statCards.count();
    for (let i = 0; i < Math.min(statCount, 4); i++) {
      await statCards.nth(i).hover();
      await page.waitForTimeout(400);
    }

    // Hover over table rows
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    for (let i = 0; i < Math.min(rowCount, 4); i++) {
      await tableRows.nth(i).hover();
      await page.waitForTimeout(300);
    }

    // Click filter buttons if present
    const filters = page.locator('.filter, .filter-btn');
    const filterCount = await filters.count();
    for (let i = 0; i < Math.min(filterCount, 3); i++) {
      await filters.nth(i).click();
      await page.waitForTimeout(400);
    }

    // Hover over nav items
    const navItems = page.locator('.nav-item');
    const navCount = await navItems.count();
    for (let i = 0; i < Math.min(navCount, 3); i++) {
      await navItems.nth(i).hover();
      await page.waitForTimeout(250);
    }

    // Interact with buttons
    const actionBtns = page.locator('button, .btn');
    const btnCount = await actionBtns.count();
    for (let i = 0; i < Math.min(btnCount, 2); i++) {
      await actionBtns.nth(i).hover();
      await page.waitForTimeout(300);
    }

    await page.waitForTimeout(500);
  }

  // Return to dashboard for final shot
  const dashboardFile = `${config.prefix}-dashboard.html`;
  if (fs.existsSync(path.join(mockupsDir, dashboardFile))) {
    await page.goto(`file://${mockupsDir}/${dashboardFile}`);
    await page.waitForTimeout(1500);
  }

  // Get video path and close
  const videoPath = await page.video().path();
  await context.close();
  await browser.close();

  // Rename video to project name
  const targetPath = path.join(videosDir, `${projectName}-demo.webm`);
  if (fs.existsSync(videoPath)) {
    fs.renameSync(videoPath, targetPath);
    console.log(`  Saved: ${targetPath}`);
  }

  return targetPath;
}

async function recordAllDemos() {
  console.log('Starting demo recording for all projects...');
  console.log(`Videos will be saved to: ${videosDir}`);

  // Get project to record from command line, or record all
  const targetProject = process.argv[2];

  if (targetProject && projects[targetProject]) {
    await recordProjectDemo(targetProject, projects[targetProject]);
  } else if (targetProject) {
    console.log(`Unknown project: ${targetProject}`);
    console.log(`Available projects: ${Object.keys(projects).join(', ')}`);
    process.exit(1);
  } else {
    // Record all projects
    for (const [name, config] of Object.entries(projects)) {
      try {
        await recordProjectDemo(name, config);
      } catch (error) {
        console.error(`Error recording ${name}: ${error.message}`);
      }
    }
  }

  console.log('\nAll demos recorded!');
}

recordAllDemos().catch(console.error);
