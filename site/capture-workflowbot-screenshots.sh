#!/bin/bash

# Screenshot script for WorkflowBot mockups
# Uses Playwright to capture screenshots of all 6 HTML mockups

MOCKUP_DIR="/home/jesse/itsjesse.dev/site/mockups"
OUTPUT_DIR="/home/jesse/itsjesse.dev/site/public/projects/workflowbot"

echo "Capturing WorkflowBot mockup screenshots..."
echo "Output directory: $OUTPUT_DIR"
echo ""

# Array of mockup files
declare -a mockups=(
    "workflowbot-dashboard.html:dashboard.png"
    "workflowbot-workflows.html:workflows.png"
    "workflowbot-editor.html:editor.png"
    "workflowbot-requests.html:requests.png"
    "workflowbot-approvals.html:approvals.png"
    "workflowbot-audit.html:audit.png"
)

# Create a Node.js script to capture screenshots using Playwright
cat > /tmp/capture-screenshots.js << 'EOF'
const { chromium } = require('playwright');
const path = require('path');

const mockups = [
    { file: 'workflowbot-dashboard.html', output: 'dashboard.png' },
    { file: 'workflowbot-workflows.html', output: 'workflows.png' },
    { file: 'workflowbot-editor.html', output: 'editor.png' },
    { file: 'workflowbot-requests.html', output: 'requests.png' },
    { file: 'workflowbot-approvals.html', output: 'approvals.png' },
    { file: 'workflowbot-audit.html', output: 'audit.png' }
];

const mockupDir = '/home/jesse/itsjesse.dev/site/mockups';
const outputDir = '/home/jesse/itsjesse.dev/site/public/projects/workflowbot';

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1920, height: 1080 }
    });

    for (const mockup of mockups) {
        const filePath = path.join(mockupDir, mockup.file);
        const outputPath = path.join(outputDir, mockup.output);

        console.log(`Capturing ${mockup.file}...`);

        await page.goto(`file://${filePath}`);
        await page.waitForTimeout(1000); // Wait for page to fully render

        await page.screenshot({
            path: outputPath,
            fullPage: true
        });

        console.log(`  ✓ Saved to ${mockup.output}`);
    }

    await browser.close();
    console.log('\nAll screenshots captured successfully!');
})();
EOF

# Run the Node.js script
echo "Running Playwright screenshot capture..."
cd /home/jesse/itsjesse.dev/site
node /tmp/capture-screenshots.js

echo ""
echo "Done! Screenshots saved to:"
ls -lh "$OUTPUT_DIR"/*.png
