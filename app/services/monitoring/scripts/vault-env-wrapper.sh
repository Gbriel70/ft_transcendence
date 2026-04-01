#!/bin/sh
set -eu

VAULT_ADDR="${VAULT_ADDR:-http://vault:8200}"
SERVICE_NAME="${SERVICE_NAME:-}"
SECRET_PATH="${VAULT_SECRET_PATH:-}"
ENV_MAP="${VAULT_ENV_MAP:-}"
ROLE_FILE="${VAULT_ROLE_ID_FILE:-/vault-keys/approles/${SERVICE_NAME}_role_id}"
SECRET_FILE="${VAULT_SECRET_ID_FILE:-/vault-keys/approles/${SERVICE_NAME}_secret_id}"

if [ -z "$SERVICE_NAME" ] || [ -z "$SECRET_PATH" ] || [ -z "$ENV_MAP" ]; then
    echo "[vault-wrapper] Missing SERVICE_NAME, VAULT_SECRET_PATH or VAULT_ENV_MAP" >&2
    exit 1
fi

extract_json_value() {
    key="$1"
    payload="$2"
    value=$(echo "$payload" | tr -d '\n' | sed -n "s/.*\"${key}\"[[:space:]]*:[[:space:]]*\"\\([^\"]*\\)\".*/\\1/p")
    if [ -z "$value" ]; then
        echo "[vault-wrapper] Key '${key}' not found in Vault secret '${SECRET_PATH}'" >&2
        exit 1
    fi
    printf '%s' "$value"
}

http_post_json() {
    url="$1"
    body="$2"

    if command -v curl >/dev/null 2>&1; then
        curl -fsS -H "Content-Type: application/json" -X POST -d "$body" "$url"
        return
    fi

    if command -v wget >/dev/null 2>&1; then
        wget -qO- \
            --header="Content-Type: application/json" \
            --post-data="$body" \
            "$url"
        return
    fi

    echo "[vault-wrapper] Neither curl nor wget is available" >&2
    exit 1
}

http_get_with_token() {
    url="$1"
    token="$2"

    if command -v curl >/dev/null 2>&1; then
        curl -fsS -H "X-Vault-Token: ${token}" "$url"
        return
    fi

    if command -v wget >/dev/null 2>&1; then
        wget -qO- --header="X-Vault-Token: ${token}" "$url"
        return
    fi

    echo "[vault-wrapper] Neither curl nor wget is available" >&2
    exit 1
}

if [ ! -f "$ROLE_FILE" ] || [ ! -f "$SECRET_FILE" ]; then
    echo "[vault-wrapper] AppRole credential files not found for service '${SERVICE_NAME}'" >&2
    exit 1
fi

ROLE_ID=$(cat "$ROLE_FILE")
SECRET_ID=$(cat "$SECRET_FILE")

AUTH_PAYLOAD=$(printf '{"role_id":"%s","secret_id":"%s"}' "$(echo "$ROLE_ID" | tr -d '\r\n')" "$(echo "$SECRET_ID" | tr -d '\r\n')")
AUTH_RESPONSE=$(http_post_json "${VAULT_ADDR}/v1/auth/approle/login" "$AUTH_PAYLOAD")
VAULT_TOKEN=$(extract_json_value "client_token" "$AUTH_RESPONSE")

SECRET_RESPONSE=$(http_get_with_token "${VAULT_ADDR}/v1/secret/data/${SECRET_PATH}" "$VAULT_TOKEN")

oldIFS="$IFS"
IFS=','
for mapping in $ENV_MAP; do
    env_key="${mapping%%:*}"
    secret_key="${mapping#*:}"

    if [ -z "$env_key" ] || [ -z "$secret_key" ]; then
        echo "[vault-wrapper] Invalid mapping '${mapping}'. Expected ENV_KEY:secret_key" >&2
        exit 1
    fi

    env_value=$(extract_json_value "$secret_key" "$SECRET_RESPONSE")
    export "$env_key=$env_value"
done
IFS="$oldIFS"

if [ "$#" -eq 0 ]; then
    echo "[vault-wrapper] No command provided after Vault bootstrap" >&2
    exit 1
fi

exec "$@"
