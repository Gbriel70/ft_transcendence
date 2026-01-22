#!/bin/sh
set -e

mkdir -p /etc/nginx/certs

if [ ! -f /etc/nginx/certs/nginx-selfsigned.crt ] || [ ! -f /etc/nginx/certs/nginx-selfsigned.key ]; then
    echo "Generating self-signed SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/certs/nginx-selfsigned.key \
        -out /etc/nginx/certs/nginx-selfsigned.crt \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=FtTranscendence/CN=localhost"
    echo "SSL certificates generated successfully!"
else
    echo "SSL certificate and key already exist. Skipping generation."
fi

echo "Testing nginx configuration..."
nginx -t

echo "Starting Nginx..."
exec nginx -g "daemon off;"