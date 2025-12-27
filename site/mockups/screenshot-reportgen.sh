#!/bin/bash

# ReportGen Screenshot Script
# Captures screenshots of all 6 mockup pages

MOCKUPS_DIR="/home/jesse/itsjesse.dev/site/mockups"
OUTPUT_DIR="/home/jesse/itsjesse.dev/site/public/projects/reportgen"

echo "ReportGen Screenshot Capture"
echo "============================"
echo ""

# Check if output directory exists
mkdir -p "$OUTPUT_DIR"

# Array of mockup files and output names
declare -A mockups=(
  ["reportgen-dashboard.html"]="dashboard.png"
  ["reportgen-templates.html"]="templates.png"
  ["reportgen-editor.html"]="editor.png"
  ["reportgen-sources.html"]="sources.png"
  ["reportgen-schedule.html"]="schedule.png"
  ["reportgen-history.html"]="history.png"
)

# Check if chromium or google-chrome is available
if command -v chromium &> /dev/null; then
    BROWSER="chromium"
elif command -v google-chrome &> /dev/null; then
    BROWSER="google-chrome"
elif command -v chromium-browser &> /dev/null; then
    BROWSER="chromium-browser"
else
    echo "Error: No Chrome/Chromium browser found."
    echo "Please install chromium or google-chrome to capture screenshots."
    exit 1
fi

echo "Using browser: $BROWSER"
echo ""

# Capture screenshots
for mockup in "${!mockups[@]}"; do
    input_file="$MOCKUPS_DIR/$mockup"
    output_file="${mockups[$mockup]}"
    output_path="$OUTPUT_DIR/$output_file"

    echo "Capturing: $mockup"

    # Use headless Chrome to capture screenshot
    $BROWSER --headless --disable-gpu --screenshot="$output_path" \
        --window-size=1920,1080 \
        --hide-scrollbars \
        "file://$input_file" 2>/dev/null

    if [ -f "$output_path" ]; then
        echo "✓ Saved: $output_file"
        echo ""
    else
        echo "✗ Failed to capture: $mockup"
        echo ""
    fi
done

echo "Screenshot capture complete!"
echo "Output directory: $OUTPUT_DIR"
echo ""
ls -lh "$OUTPUT_DIR"
