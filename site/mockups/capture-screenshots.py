#!/usr/bin/env python3
"""
Screenshot capture script for StockAlert mockups
Uses headless Chrome to capture screenshots
"""

import os
import subprocess
from pathlib import Path

# Paths
MOCKUP_DIR = Path("/home/jesse/itsjesse.dev/site/mockups")
OUTPUT_DIR = Path("/home/jesse/itsjesse.dev/site/public/projects/stockalert")
CHROME_PATH = "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"

# Mockups to capture
mockups = [
    "stockalert-dashboard",
    "stockalert-inventory",
    "stockalert-locations",
    "stockalert-alerts",
    "stockalert-reorder",
    "stockalert-settings",
]

def capture_screenshot(mockup_name):
    """Capture a screenshot of a mockup HTML file"""
    html_file = MOCKUP_DIR / f"{mockup_name}.html"
    output_file = OUTPUT_DIR / f"{mockup_name}.png"

    # Convert WSL path to Windows path for Chrome
    html_path = str(html_file).replace('/mnt/c/', 'C:/')
    output_path = str(output_file).replace('/mnt/c/', 'C:/')

    # Chrome command
    cmd = [
        CHROME_PATH,
        "--headless",
        "--disable-gpu",
        f"--screenshot={output_path}",
        "--window-size=1920,1080",
        "--default-background-color=0",
        f"file:///{html_path}",
    ]

    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=10
        )

        if output_file.exists():
            size = output_file.stat().st_size
            print(f"✓ {mockup_name}.png ({size:,} bytes)")
            return True
        else:
            print(f"✗ {mockup_name}.png (file not created)")
            return False

    except Exception as e:
        print(f"✗ {mockup_name}.png (error: {e})")
        return False

def main():
    print("StockAlert Screenshot Capture")
    print("=" * 50)
    print(f"Mockup directory: {MOCKUP_DIR}")
    print(f"Output directory: {OUTPUT_DIR}")
    print()

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Capture all screenshots
    success_count = 0
    for mockup in mockups:
        if capture_screenshot(mockup):
            success_count += 1

    print()
    print(f"Captured {success_count}/{len(mockups)} screenshots")

    # List generated files
    if success_count > 0:
        print("\nGenerated files:")
        for png_file in sorted(OUTPUT_DIR.glob("stockalert-*.png")):
            size = png_file.stat().st_size / 1024
            print(f"  - {png_file.name} ({size:.1f} KB)")

if __name__ == "__main__":
    main()
