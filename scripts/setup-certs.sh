#!/bin/bash
set -e

CERTS_DIR="$(cd "$(dirname "$0")/.." && pwd)/certs"
CA_KEY="$CERTS_DIR/rootCA.key"
CA_CERT="$CERTS_DIR/rootCA.crt"
SERVER_KEY="$CERTS_DIR/minibank.key"
SERVER_CERT="$CERTS_DIR/minibank.crt"
SERVER_CSR="$CERTS_DIR/minibank.csr"
REGENERATE=false

mkdir -p "$CERTS_DIR"

echo "[certs] Checking certificates..."

# ── Root CA ────────────────────────────────────────────────────────────────────
if [ ! -f "$CA_CERT" ] || [ ! -f "$CA_KEY" ]; then
    echo "[certs] Generating Root CA..."
    openssl genrsa -out "$CA_KEY" 4096 2>/dev/null
    openssl req -x509 -new -nodes \
        -key "$CA_KEY" \
        -sha256 -days 1825 \
        -out "$CA_CERT" \
        -subj "/C=BR/ST=SP/L=SP/O=MiniBank/CN=MiniBank Root CA" 2>/dev/null
    chmod 600 "$CA_KEY"
    chmod 644 "$CA_CERT"
    REGENERATE=true
    echo "[certs] Root CA generated."
fi

# ── Server certificate signed by the CA ────────────────────────────────────────
if [ ! -f "$SERVER_CERT" ] || [ ! -f "$SERVER_KEY" ] || [ "$REGENERATE" = true ]; then
    echo "[certs] Generating server certificate (signed by Root CA)..."

    EXT_FILE=$(mktemp)
    cat > "$EXT_FILE" <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1  = 127.0.0.1
EOF

    openssl genrsa -out "$SERVER_KEY" 2048 2>/dev/null
    openssl req -new \
        -key "$SERVER_KEY" \
        -out "$SERVER_CSR" \
        -subj "/C=BR/ST=SP/L=SP/O=MiniBank/CN=localhost" 2>/dev/null
    openssl x509 -req \
        -in "$SERVER_CSR" \
        -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial \
        -out "$SERVER_CERT" \
        -days 825 -sha256 \
        -extfile "$EXT_FILE" 2>/dev/null

    rm -f "$EXT_FILE" "$SERVER_CSR"
    chmod 600 "$SERVER_KEY"
    chmod 644 "$SERVER_CERT"
    echo "[certs] Server certificate generated."
fi

# ── Trust Root CA on the system ────────────────────────────────────────────────
echo "[certs] Trusting Root CA on the system (requires sudo)..."

if command -v update-ca-certificates &>/dev/null; then
    sudo cp "$CA_CERT" /usr/local/share/ca-certificates/minibank-rootCA.crt
    sudo update-ca-certificates --fresh 2>/dev/null | grep -E 'added|updated|minibank' || true
    echo "[certs] Root CA trusted (Debian/Ubuntu system store)."
elif command -v update-ca-trust &>/dev/null; then
    sudo cp "$CA_CERT" /etc/pki/ca-trust/source/anchors/minibank-rootCA.crt
    sudo update-ca-trust extract
    echo "[certs] Root CA trusted (RHEL/Fedora/Alpine system store)."
else
    echo "[certs] WARNING: Could not find update-ca-certificates or update-ca-trust."
fi

# ── Trust in NSS database (Chrome / Chromium / Firefox on Linux) ───────────────
if command -v certutil &>/dev/null; then

    _trust_nss() {
        local DB="$1"
        local LABEL="$2"
        if [ -d "$DB" ]; then
            certutil -d sql:"$DB" -D -n "minibank-rootCA" 2>/dev/null || true
            certutil -d sql:"$DB" -A -t "C,," -n "minibank-rootCA" -i "$CA_CERT" 2>/dev/null && \
                echo "[certs] Root CA trusted in NSS: $LABEL." || \
                echo "[certs] WARNING: could not trust in NSS DB at $DB"
        fi
    }

    # Chrome / Chromium
    NSS_DB="$HOME/.pki/nssdb"
    if [ ! -d "$NSS_DB" ]; then
        mkdir -p "$NSS_DB"
        certutil -d sql:"$NSS_DB" -N --empty-password 2>/dev/null || true
    fi
    _trust_nss "$NSS_DB" "Chrome/Chromium"

    # Firefox (every profile found)
    for FF_DIR in \
        "$HOME/.mozilla/firefox" \
        "$HOME/snap/firefox/common/.mozilla/firefox"
    do
        if [ -d "$FF_DIR" ]; then
            while IFS= read -r -d '' PROF; do
                _trust_nss "$PROF" "Firefox ($(basename "$PROF"))"
            done < <(find "$FF_DIR" -maxdepth 1 -mindepth 1 -type d -print0 2>/dev/null)
        fi
    done
else
    echo "[certs] certutil not found – skipping browser NSS trust."
    echo "        Install with: sudo apt install libnss3-tools"
fi

echo "[certs] Done!"
