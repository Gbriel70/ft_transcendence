#!/bin/sh

set -e

# ===== GERAR CERTIFICADO SSL =====
if [ ! -f /etc/nginx/certs/nginx-selfsigned.crt ]; then
    echo " Generating SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/certs/nginx-selfsigned.key \
        -out /etc/nginx/certs/nginx-selfsigned.crt \
        -subj "/C=BR/ST=SP/L=SP/O=MiniBank/CN=localhost" 2>/dev/null
    
    chmod 600 /etc/nginx/certs/nginx-selfsigned.key
    chmod 644 /etc/nginx/certs/nginx-selfsigned.crt
    echo " SSL certificate created"
fi

# ===== VERIFICAR MODSECURITY =====
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

echo "Testing NGINX configuration..."
nginx -t

echo " Starting NGINX..."
exec nginx -g 'daemon off;'