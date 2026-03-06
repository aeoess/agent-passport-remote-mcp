#!/bin/bash
# Upgrade from quick tunnel to named tunnel with mcp.aeoess.com
# Run this ONCE after adding aeoess.com to your Cloudflare account.
#
# Prerequisites:
#   1. Create free Cloudflare account at https://dash.cloudflare.com/sign-up
#   2. Add aeoess.com → Cloudflare will give you two nameservers
#   3. At GoDaddy, change nameservers to the Cloudflare ones
#   4. Wait ~5 min for propagation, Cloudflare dashboard shows "Active"
#   5. Re-add your GitHub Pages DNS records in Cloudflare:
#      - CNAME @ → aeoess.github.io (proxied)
#      - CNAME www → aeoess.github.io (proxied)
#   6. Then run this script.

set -e
CF=/Users/tima/.local/bin/cloudflared

echo "Step 1: Authenticate with Cloudflare..."
$CF tunnel login

echo "Step 2: Create named tunnel..."
$CF tunnel create aeoess-mcp

TUNNEL_ID=$($CF tunnel list | grep aeoess-mcp | awk '{print $1}')
echo "Tunnel ID: $TUNNEL_ID"

echo "Step 3: Create config..."
mkdir -p /Users/tima/.cloudflared
cat > /Users/tima/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /Users/tima/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: mcp.aeoess.com
    service: http://localhost:3002
  - service: http_status:404
EOF

echo "Step 4: Route DNS..."
$CF tunnel route dns aeoess-mcp mcp.aeoess.com

echo "Step 5: Update PM2..."
export PATH="$HOME/.npm-global/bin:$PATH"
pm2 stop cloudflared-tunnel 2>/dev/null || true
pm2 delete cloudflared-tunnel 2>/dev/null || true
pm2 start /Users/tima/.local/bin/cloudflared \
  --name cloudflared-tunnel \
  -- tunnel run aeoess-mcp
pm2 save

echo ""
echo "Done! mcp.aeoess.com is live."
echo "Test: curl https://mcp.aeoess.com/health"
