#!/bin/bash

# StockAlert Screenshot Capture Script
# Captures all 6 mockup pages using Chrome in headless mode

OUTPUT_DIR="/home/jesse/itsjesse.dev/site/public/projects/stockalert"
MOCKUP_DIR="/home/jesse/itsjesse.dev/site/mockups"
CHROME="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"

# Array of mockups to capture
declare -a mockups=(
    "stockalert-dashboard"
    "stockalert-inventory"
    "stockalert-locations"
    "stockalert-alerts"
    "stockalert-reorder"
    "stockalert-settings"
)

echo "Starting StockAlert screenshot capture..."
echo "Output directory: $OUTPUT_DIR"
echo ""

# Capture each mockup
for mockup in "${mockups[@]}"
do
    echo "Capturing: ${mockup}.html"
    "$CHROME" --headless --disable-gpu --screenshot="${OUTPUT_DIR}/${mockup}.png" \
        --window-size=1920,1080 \
        --virtual-time-budget=2000 \
        "file://${MOCKUP_DIR}/${mockup}.html" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo "  ✓ Saved: ${mockup}.png"
    else
        echo "  ✗ Failed: ${mockup}.png"
    fi
done

echo ""
echo "Screenshot capture complete!"
echo "Files saved to: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"/*.png 2>/dev/null || echo "No screenshots found"
