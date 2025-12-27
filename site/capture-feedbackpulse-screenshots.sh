#!/bin/bash

# FeedbackPulse Screenshot Capture Script
# Captures all 6 mockup pages using Playwright

MOCKUPS_DIR="/home/jesse/itsjesse.dev/site/mockups"
OUTPUT_DIR="/home/jesse/itsjesse.dev/site/public/projects/feedbackpulse"

echo "Starting FeedbackPulse screenshot capture..."
echo "Output directory: $OUTPUT_DIR"
echo ""

# Create a Python script to capture screenshots using Playwright
cat > /tmp/capture_screenshots.py << 'EOF'
from playwright.sync_api import sync_playwright
import time

mockups = [
    ("feedbackpulse-dashboard.html", "dashboard.png"),
    ("feedbackpulse-reviews.html", "reviews.png"),
    ("feedbackpulse-surveys.html", "surveys.png"),
    ("feedbackpulse-trends.html", "trends.png"),
    ("feedbackpulse-alerts.html", "alerts.png"),
    ("feedbackpulse-sources.html", "sources.png"),
]

mockups_dir = "/home/jesse/itsjesse.dev/site/mockups"
output_dir = "/home/jesse/itsjesse.dev/site/public/projects/feedbackpulse"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    for html_file, screenshot_name in mockups:
        file_path = f"file://{mockups_dir}/{html_file}"
        print(f"Capturing {html_file}...")

        page.goto(file_path)

        # Wait for charts to render (they use Chart.js which needs time)
        time.sleep(2)

        # Take full page screenshot
        page.screenshot(path=f"{output_dir}/{screenshot_name}", full_page=True)
        print(f"  ✓ Saved as {screenshot_name}")

    browser.close()

print("\nAll screenshots captured successfully!")
EOF

# Run the Python script
python3 /tmp/capture_screenshots.py

# Clean up
rm /tmp/capture_screenshots.py

echo ""
echo "Screenshot capture complete!"
echo "Files saved to: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"/*.png
