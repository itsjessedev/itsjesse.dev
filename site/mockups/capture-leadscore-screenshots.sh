#!/bin/bash

# Screenshot script for LeadScore mockups
# Uses Playwright to capture screenshots

OUTPUT_DIR="/home/jesse/itsjesse.dev/site/public/projects/leadscore"
MOCKUP_DIR="/home/jesse/itsjesse.dev/site/mockups"

# Array of mockup files
declare -a mockups=(
    "leadscore-dashboard"
    "leadscore-leads"
    "leadscore-scoring"
    "leadscore-analytics"
    "leadscore-integrations"
    "leadscore-alerts"
)

echo "Starting screenshot capture for LeadScore mockups..."

# Capture screenshots using Playwright
for mockup in "${mockups[@]}"
do
    echo "Capturing: $mockup.html"
    npx playwright screenshot \
        "file://$MOCKUP_DIR/${mockup}.html" \
        "$OUTPUT_DIR/${mockup}.png" \
        --viewport-size=1920,1080 \
        --full-page

    if [ $? -eq 0 ]; then
        echo "✓ Successfully captured: ${mockup}.png"
    else
        echo "✗ Failed to capture: ${mockup}.png"
    fi
done

echo ""
echo "Screenshot capture complete!"
echo "Screenshots saved to: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"
