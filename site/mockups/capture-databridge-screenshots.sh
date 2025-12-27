#!/bin/bash

# DataBridge Screenshot Capture Script
# Captures screenshots of all 6 HTML mockups

MOCKUP_DIR="/home/jesse/itsjesse.dev/site/mockups"
OUTPUT_DIR="/home/jesse/itsjesse.dev/site/public/projects/databridge"

echo "Starting DataBridge screenshot capture..."
echo "Mockup directory: $MOCKUP_DIR"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Array of mockup files
mockups=(
    "databridge-dashboard.html"
    "databridge-sources.html"
    "databridge-mapping.html"
    "databridge-validation.html"
    "databridge-progress.html"
    "databridge-history.html"
)

# Capture each mockup
for mockup in "${mockups[@]}"; do
    # Extract name without extension
    name="${mockup%.html}"

    echo "Capturing: $mockup"

    # Use playwright to capture screenshot
    npx playwright screenshot \
        "file://$MOCKUP_DIR/$mockup" \
        "$OUTPUT_DIR/${name}.png" \
        --viewport-size=1920,1080 \
        --full-page

    if [ $? -eq 0 ]; then
        echo "✓ Successfully captured $name.png"
    else
        echo "✗ Failed to capture $name.png"
    fi

    echo ""
done

echo "Screenshot capture complete!"
echo "Screenshots saved to: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"
