import { chromium } from 'playwright';
import { mkdir, readFile } from 'fs/promises';
import path from 'path';

async function imageToBase64(imagePath) {
  const fullPath = path.join(process.cwd(), 'public', imagePath);
  const buffer = await readFile(fullPath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

const projects = [
  {
    id: 'syncflow',
    name: 'SyncFlow',
    tag: 'Data Sync',
    headline: ['Salesforce + Jira', 'Unified'],
    description: 'Automated data sync that eliminated 6 hours of weekly manual CSV exports. Real-time synchronization keeps your systems in perfect harmony.',
    features: [
      'Automatic daily sync between platforms',
      'Intelligent conflict resolution',
      'Historical tracking & audit trail',
      'Email alerts for anomalies'
    ],
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accentColor: '#a78bfa',
    isWeb: true,
    screenshot: '/projects/syncflow/dashboard.png'
  },
  {
    id: 'orderhub',
    name: 'OrderHub',
    tag: 'E-Commerce',
    headline: ['Unified Order', 'Management'],
    description: 'Bring all your e-commerce orders from Shopify, Amazon, eBay, and Etsy into one powerful dashboard.',
    features: [
      'Real-time order notifications',
      'Unified inventory sync',
      'One-click status updates',
      'Multi-platform analytics'
    ],
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    accentColor: '#818cf8',
    isWeb: true,
    screenshot: '/projects/orderhub/dashboard.png'
  },
  {
    id: 'invoicebot',
    name: 'InvoiceBot',
    tag: 'OCR Automation',
    headline: ['Receipt to', 'Accounting'],
    description: 'Snap a photo of any receipt, and InvoiceBot reads it, categorizes the expense, and syncs directly to QuickBooks.',
    features: [
      'Reads any receipt format',
      'AI-powered categorization',
      'Direct QuickBooks sync',
      'Audit-ready expense reports'
    ],
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    accentColor: '#6ee7b7',
    isWeb: true,
    screenshot: '/projects/invoicebot/dashboard.png'
  },
  {
    id: 'leadscore',
    name: 'LeadScore',
    tag: 'Sales Intelligence',
    headline: ['Smart Lead', 'Prioritization'],
    description: 'Analyze engagement signals across CRM, email, and website visits to identify your hottest prospects instantly.',
    features: [
      'Real-time lead scoring',
      'Slack alerts for hot leads',
      'Auto-updated priority lists',
      'HubSpot integration'
    ],
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    accentColor: '#fcd34d',
    isWeb: true,
    screenshot: '/projects/leadscore/dashboard.png'
  },
  {
    id: 'stockalert',
    name: 'StockAlert',
    tag: 'Inventory Monitor',
    headline: ['Never Miss a', 'Stockout'],
    description: 'Real-time inventory monitoring across all locations with smart reorder suggestions based on sales velocity.',
    features: [
      'Multi-location visibility',
      'Velocity-based reorder alerts',
      'SMS & Slack notifications',
      'Overstock prevention'
    ],
    gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    accentColor: '#fdba74',
    isWeb: true,
    screenshot: '/projects/stockalert/dashboard.png'
  },
  {
    id: 'reportgen',
    name: 'ReportGen',
    tag: 'Report Automation',
    headline: ['Automated', 'Business Reports'],
    description: 'Pull data from any source, generate beautiful PDF reports, and deliver them on your schedule automatically.',
    features: [
      'Connect any data source',
      'Customizable templates',
      'Scheduled email delivery',
      'Searchable archive'
    ],
    gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
    accentColor: '#67e8f9',
    isWeb: true,
    screenshot: '/projects/reportgen/dashboard.png'
  },
  {
    id: 'feedbackpulse',
    name: 'FeedbackPulse',
    tag: 'Review Analytics',
    headline: ['Customer Feedback', 'Intelligence'],
    description: 'Aggregate reviews from Google, Yelp, and surveys. AI-powered sentiment analysis spots trends before they hurt.',
    features: [
      'Unified feedback view',
      'AI sentiment analysis',
      'Trend detection & alerts',
      'Competitive comparison'
    ],
    gradient: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
    accentColor: '#fda4af',
    isWeb: true,
    screenshot: '/projects/feedbackpulse/dashboard.png'
  },
  {
    id: 'bookingsync',
    name: 'BookingSync',
    tag: 'Appointment Automation',
    headline: ['Reduce No-Shows', 'by 60%'],
    description: 'Online booking, automated reminders, and post-visit follow-ups that build your reputation automatically.',
    features: [
      'Online booking widget',
      'SMS & email reminders',
      'No-show tracking',
      'Automated review requests'
    ],
    gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    accentColor: '#93c5fd',
    isWeb: true,
    screenshot: '/projects/bookingsync/dashboard.png'
  },
  {
    id: 'databridge',
    name: 'DataBridge',
    tag: 'Data Migration',
    headline: ['Legacy to Modern', 'Safely'],
    description: 'Migrate from outdated systems to modern platforms without losing a single record or relationship.',
    features: [
      'Connect legacy databases',
      'Intelligent field mapping',
      'Incremental sync support',
      'Full rollback capability'
    ],
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    accentColor: '#c4b5fd',
    isWeb: true,
    screenshot: '/projects/databridge/dashboard.png'
  },
  {
    id: 'workflowbot',
    name: 'WorkflowBot',
    tag: 'Process Automation',
    headline: ['Slack-Native', 'Workflows'],
    description: 'Turn PTO requests, approvals, and onboarding into trackable Slack conversations with full audit trails.',
    features: [
      'Slack-native interface',
      'Automatic routing',
      'Status tracking',
      'Compliance audit trail'
    ],
    gradient: 'linear-gradient(135deg, #4a1d96 0%, #6d28d9 100%)',
    accentColor: '#a78bfa',
    isWeb: true,
    screenshot: '/projects/workflowbot/dashboard.png'
  },
  {
    id: 'documind',
    name: 'DocuMind',
    tag: 'RAG Intelligence',
    headline: ['Ask Your', 'Documents'],
    description: 'AI-powered document search using Retrieval Augmented Generation. Natural language answers with source citations.',
    features: [
      'Semantic document search',
      'Natural language Q&A',
      'Source attribution',
      'Multi-format support'
    ],
    gradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
    accentColor: '#5eead4',
    isWeb: true,
    screenshot: '/projects/documind/dashboard.png'
  },
  {
    id: 'smartclassify',
    name: 'SmartClassify',
    tag: 'ML Pipeline',
    headline: ['Intelligent Text', 'Classification'],
    description: 'Machine learning pipeline for text categorization, sentiment analysis, and keyword extraction at scale.',
    features: [
      '7-category classification',
      'Sentiment with confidence',
      'Batch processing',
      'RESTful API'
    ],
    gradient: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
    accentColor: '#f9a8d4',
    isWeb: true,
    screenshot: '/projects/smartclassify/dashboard.png'
  },
  {
    id: 'fieldops',
    name: 'FieldOps',
    tag: 'Field Service',
    headline: ['Mobile Field', 'Management'],
    description: 'Native mobile app for field teams with GPS tracking, task management, and offline-first architecture.',
    features: [
      'GPS route optimization',
      'Photo documentation',
      'Offline-first design',
      'Real-time task updates'
    ],
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
    accentColor: '#7dd3fc',
    isWeb: false,
    screenshot: '/projects/fieldops/dashboard.png'
  },
  {
    id: 'itsjesse-mobile',
    name: 'itsjesse.dev Mobile',
    tag: 'Native App',
    headline: ['Website to', 'Native App'],
    description: 'This portfolio converted to a true native Flutter app that auto-syncs with website content.',
    features: [
      'True native performance',
      'Auto-sync with website',
      'Offline caching',
      'Demonstrates W2A service'
    ],
    gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    accentColor: '#93c5fd',
    isWeb: false,
    screenshot: '/projects/itsjesse-mobile/dashboard.png'
  },
  {
    id: 'dealscout',
    name: 'DealScout',
    tag: 'Deal Discovery',
    headline: ['Find Deals,', 'Track Profits'],
    description: 'AI-powered deal discovery from marketplace alerts with real-time eBay price lookups and complete flip lifecycle tracking.',
    features: [
      'AI item classification',
      'Real-time eBay pricing',
      'Push notifications for hot deals',
      'Full flip profit tracking'
    ],
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    accentColor: '#6ee7b7',
    isWeb: false,
    screenshot: '/projects/dealscout/deals.png'
  }
];

function generateBannerHTML(project, screenshotDataUrl) {
  // For mobile apps, the screenshots are already complete mockups - use them directly
  if (!project.isWeb) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1440px;
      height: 900px;
      background: ${project.gradient};
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  </style>
</head>
<body>
  <img src="${screenshotDataUrl}" alt="${project.name}">
</body>
</html>`;
  }

  // Web apps get the browser frame treatment
  const deviceWidth = '520px';
  const deviceStyle = `
    width: ${deviceWidth};
    background: #1a1a2e;
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  `;

  const browserChrome = `
    <div style="background: #2d2d3d; padding: 12px 16px; display: flex; align-items: center; gap: 8px;">
      <div style="display: flex; gap: 6px;">
        <div style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f57;"></div>
        <div style="width: 12px; height: 12px; border-radius: 50%; background: #febc2e;"></div>
        <div style="width: 12px; height: 12px; border-radius: 50%; background: #28c840;"></div>
      </div>
      <div style="flex: 1; background: #1a1a2e; border-radius: 6px; padding: 6px 12px; font-size: 11px; color: #888;">
        ${project.id}.itsjesse.dev
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1440px;
      height: 900px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${project.gradient};
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px;
    }
    .container {
      display: flex;
      align-items: center;
      gap: 80px;
      max-width: 1300px;
    }
    .device {
      ${deviceStyle}
      flex-shrink: 0;
    }
    .screen {
      background: #f5f5f7;
      height: 340px;
      overflow: hidden;
    }
    .screen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top left;
    }
    .content {
      color: white;
    }
    .tag {
      display: inline-block;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .headline {
      font-size: 56px;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 24px;
    }
    .headline .accent {
      color: ${project.accentColor};
    }
    .description {
      font-size: 18px;
      line-height: 1.6;
      opacity: 0.9;
      margin-bottom: 32px;
      max-width: 500px;
    }
    .features {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
    }
    .check {
      width: 20px;
      height: 20px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .check svg {
      width: 12px;
      height: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="device">
      ${browserChrome}
      <div class="screen">
        <img src="${screenshotDataUrl}" alt="${project.name}">
      </div>
    </div>
    <div class="content">
      <div class="tag">${project.tag}</div>
      <h1 class="headline">
        ${project.headline[0]}<br>
        <span class="accent">${project.headline[1]}</span>
      </h1>
      <p class="description">${project.description}</p>
      <div class="features">
        ${project.features.map(f => `
          <div class="feature">
            <div class="check">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span>${f}</span>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  for (const project of projects) {
    console.log(`Generating banner for ${project.name}...`);

    const screenshotDataUrl = await imageToBase64(project.screenshot);
    const page = await context.newPage();
    const html = generateBannerHTML(project, screenshotDataUrl);

    await page.setContent(html, { waitUntil: 'networkidle' });

    // Ensure output directory exists
    const outputDir = `./public/projects/${project.id}`;
    await mkdir(outputDir, { recursive: true });

    // Take screenshot
    await page.screenshot({
      path: `${outputDir}/hero.png`,
      type: 'png'
    });

    await page.close();
    console.log(`  Saved ${outputDir}/hero.png`);
  }

  await browser.close();
  console.log('\nAll banners generated!');
}

main().catch(console.error);
