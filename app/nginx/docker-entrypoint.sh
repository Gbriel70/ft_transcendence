#!/bin/sh
set -e

mkdir -p /var/log/nginx
mkdir -p /tmp

if [ ! -f /etc/nginx/certs/nginx-selfsigned.crt ]; then
    echo "❌ SSL certificates NOT found"
    exit 1
fi

if [ -f /etc/nginx/modsecurity/modsecurity.conf ]; then
    echo "✓ ModSecurity configuration found"
else
    echo "✗ ModSecurity configuration NOT found"
    exit 1
fi

echo "Testing nginx configuration..."
nginx -t

echo "Starting Nginx..."
exec nginx -g "daemon off;"