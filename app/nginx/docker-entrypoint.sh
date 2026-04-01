#!/bin/sh
set -e

echo "NGINX Entrypoint"

# ===== GERAR CERTIFICADO SSL =====
if [ ! -f /etc/nginx/certs/minibank.crt ]; then
    echo "Generating SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/certs/minibank.key \
        -out /etc/nginx/certs/minibank.crt \
        -subj "/C=BR/ST=SP/L=SP/O=MiniBank/CN=localhost" 2>/dev/null
    
    chmod 600 /etc/nginx/certs/minibank.key
    chmod 644 /etc/nginx/certs/minibank.crt
    echo "SSL certificate created"
else
    echo "SSL certificate already exists"
fi

# ===== VERIFICAR MODSECURITY =====
echo ""
echo "ModSecurity Status:"
if [ -f /etc/modsecurity.d/modsecurity.conf ]; then
    grep "SecRuleEngine" /etc/modsecurity.d/modsecurity.conf | head -1 || true
    echo "ModSecurity config loaded"
else
    echo "ModSecurity config not found!"
fi

# ===== VERIFICAR OWASP CRS =====
if [ -d /etc/modsecurity.d/owasp-crs/rules ]; then
    RULE_COUNT=$(ls -1 /etc/modsecurity.d/owasp-crs/rules/*.conf 2>/dev/null | wc -l)
    echo "OWASP CRS loaded with $RULE_COUNT rule files"
fi

# ===== VERIFICAR REGRAS CUSTOMIZADAS =====
if [ -d /etc/modsecurity.d/user-conf ]; then
    CUSTOM_COUNT=$(ls -1 /etc/modsecurity.d/user-conf/*.conf 2>/dev/null | wc -l)
    echo "Custom rules loaded: $CUSTOM_COUNT files"
fi

echo ""
echo "Testing NGINX configuration..."
nginx -t

echo ""
echo "Starting NGINX..."
exec "$@"