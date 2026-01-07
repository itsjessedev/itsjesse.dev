#!/bin/bash
# Quick script to add Apify API key to VPS .env
#
# Usage: ./add-apify-key.sh apify_api_XXXXX

KEY="$1"

if [[ -z "$KEY" ]]; then
  echo "Usage: ./add-apify-key.sh apify_api_XXXXX"
  exit 1
fi

if [[ ! "$KEY" == apify_api_* ]]; then
  echo "Error: Key must start with 'apify_api_'"
  exit 1
fi

# Find next available key number
CURRENT_MAX=$(ssh junipr-vps "grep -o 'APIFY_API_KEY_[0-9]*' /home/deploy/devscout/backend/.env | sed 's/APIFY_API_KEY_//' | sort -n | tail -1")
NEXT_NUM=$((CURRENT_MAX + 1))

echo "Adding APIFY_API_KEY_${NEXT_NUM}=${KEY}"
ssh junipr-vps "echo 'APIFY_API_KEY_${NEXT_NUM}=${KEY}' >> /home/deploy/devscout/backend/.env"

echo "Done! Key added as APIFY_API_KEY_${NEXT_NUM}"
echo "Restarting DevScout..."
ssh junipr-vps "sudo systemctl restart devscout"
echo "DevScout restarted."
