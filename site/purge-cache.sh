#!/bin/bash
# Purge Cloudflare cache for itsjesse.dev
# Zone ID: 41890a82db39a3d4c0cae401a562d9c5

curl -s -X POST "https://api.cloudflare.com/client/v4/zones/41890a82db39a3d4c0cae401a562d9c5/purge_cache" \
  -H "X-Auth-Email: jesse@junipr.io" \
  -H "X-Auth-Key: 15aac9cea093411d5bcc2a5721ed3dd793863" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

echo ""
echo "Cache purge requested. May take 30-60 seconds to propagate."
