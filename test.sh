#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C

BASE_URL="${BASE_URL:-https://localhost:8443}"
USERS="${USERS:-10}"
TX_COUNT="${TX_COUNT:-200}"
CONCURRENCY="${CONCURRENCY:-5}"   # menor por causa do rate-limit do nginx
PASSWORD="${PASSWORD:-123456}"
PREFIX="${PREFIX:-loadtest}"
AMOUNT="${AMOUNT:-1}"

for cmd in curl jq shuf mktemp; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Erro: '$cmd' não encontrado"; exit 1; }
done

TMP_DIR="$(mktemp -d)"
USERS_FILE="$TMP_DIR/users.txt"     # email|token|user_id
RESULTS_FILE="$TMP_DIR/results.txt"
trap 'rm -rf "$TMP_DIR"' EXIT

request_post() {
  local endpoint="$1"
  local payload="$2"
  local token="${3:-}"
  local body_file code
  body_file="$(mktemp)"

  if [[ -n "$token" ]]; then
    code="$(curl -k -sS -o "$body_file" -w "%{http_code}" \
      -X POST "${BASE_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${token}" \
      -d "$payload" || echo "000")"
  else
    code="$(curl -k -sS -o "$body_file" -w "%{http_code}" \
      -X POST "${BASE_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -d "$payload" || echo "000")"
  fi

  printf '%s\n' "$code"
  cat "$body_file"
  rm -f "$body_file"
}

request_get() {
  local endpoint="$1"
  local token="${2:-}"
  local body_file code
  body_file="$(mktemp)"

  if [[ -n "$token" ]]; then
    code="$(curl -k -sS -o "$body_file" -w "%{http_code}" \
      -X GET "${BASE_URL}${endpoint}" \
      -H "Authorization: Bearer ${token}" || echo "000")"
  else
    code="$(curl -k -sS -o "$body_file" -w "%{http_code}" \
      -X GET "${BASE_URL}${endpoint}" || echo "000")"
  fi

  printf '%s\n' "$code"
  cat "$body_file"
  rm -f "$body_file"
}

with_retry_post() {
  local endpoint="$1" payload="$2" token="${3:-}"
  local tries=6 wait_ms=200 code body

  for _ in $(seq 1 "$tries"); do
    { read -r code; body="$(cat)"; } < <(request_post "$endpoint" "$payload" "$token")

    if [[ "$code" =~ ^2 ]]; then
      printf '%s\n%s' "$code" "$body"
      return 0
    fi

    if [[ "$code" == "429" || "$code" =~ ^5 || "$code" == "000" ]]; then
      sleep "$(printf '%d.%03d' $((wait_ms/1000)) $((wait_ms%1000)))"
      wait_ms=$(( wait_ms * 18 / 10 ))
      (( wait_ms > 5000 )) && wait_ms=5000
      continue
    fi

    printf '%s\n%s' "$code" "$body"
    return 0
  done

  printf '%s\n%s' "$code" "$body"
}

with_retry_tx() {
  local token="$1" to_user_id="$2" amount="$3"
  local tries=6 wait_ms=200 code body_file err payload

  payload="{\"to_user_id\":${to_user_id},\"amount\":${amount}}"

  for _ in $(seq 1 "$tries"); do
    body_file="$(mktemp)"
    code="$(
      curl -k -sS -o "$body_file" -w "%{http_code}" \
        -X POST "${BASE_URL}/api/tx/transactions" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d "$payload" || echo "000"
    )"

    if [[ "$code" =~ ^2 ]]; then
      cat "$body_file"
      rm -f "$body_file"
      return 0
    fi

    if [[ "$code" == "429" || "$code" =~ ^5 || "$code" == "000" ]]; then
      rm -f "$body_file"
      sleep "$(printf '%d.%03d' $((wait_ms/1000)) $((wait_ms%1000)))"
      wait_ms=$(( wait_ms * 18 / 10 ))
      (( wait_ms > 5000 )) && wait_ms=5000
      continue
    fi

    err="$(tr -d '\n' < "$body_file" 2>/dev/null || true)"
    rm -f "$body_file"
    echo "FAIL|${code}|${err}"
    return 1
  done

  echo "FAIL|${code}|retry_exceeded"
  return 1
}

echo "===> Criando ${USERS} usuários..."
TS="$(date +%s)"

for i in $(seq 1 "$USERS"); do
  email="${PREFIX}_${TS}_${i}@test.local"
  name="${PREFIX}_${i}"

  # register
  reg_code=""
  reg_body=""
  { read -r reg_code; reg_body="$(cat)"; } < <(
    with_retry_post "/api/auth/register" \
    "{\"name\":\"${name}\",\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}"
  )

  # segue apenas se criou (2xx) ou já existia (409)
  if [[ ! "$reg_code" =~ ^2 ]] && [[ "$reg_code" != "409" ]]; then
    echo "Falha no register: $email (HTTP $reg_code)"
    continue
  fi

  # login
  code=""
  body=""
  { read -r code; body="$(cat)"; } < <(
    with_retry_post "/api/auth/login" \
    "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}"
  )

  if [[ ! "$code" =~ ^2 ]] || ! jq -e . >/dev/null 2>&1 <<<"$body"; then
    echo "Falha no login: $email (HTTP $code)"
    continue
  fi

  token="$(jq -r '.token // empty' <<<"$body")"
  if [[ -z "$token" ]]; then
    echo "Falha no login: $email (sem token)"
    continue
  fi

  # cria wallet (ignora se já existir)
  with_retry_post "/api/users/me/wallet" "{}" "$token" >/dev/null || true

  # pega user_id
  me_code=""
  me_body=""
  { read -r me_code; me_body="$(cat)"; } < <(request_get "/api/users/me" "$token")
  if [[ ! "$me_code" =~ ^2 ]] || ! jq -e . >/dev/null 2>&1 <<<"$me_body"; then
    echo "Falha /users/me: $email (HTTP $me_code)"
    continue
  fi

  user_id="$(jq -r '.id // .user.id // empty' <<<"$me_body")"
  if [[ -z "$user_id" ]]; then
    echo "Falha ao extrair user_id: $email"
    continue
  fi

  echo "${email}|${token}|${user_id}" >> "$USERS_FILE"
  sleep 0.05
done

created_users="$(wc -l < "$USERS_FILE" | tr -d ' ')"
if (( created_users < 2 )); then
  echo "Erro: menos de 2 usuários válidos."
  exit 1
fi

echo "===> Usuários prontos: ${created_users}"
echo "===> Disparando ${TX_COUNT} transferências (concorrência ${CONCURRENCY})..."

export BASE_URL USERS_FILE RESULTS_FILE AMOUNT
export -f with_retry_tx

run_one_tx() {
  local sender recipient s_email s_token s_id r_email r_token r_id tx_res

  sender="$(shuf -n 1 "$USERS_FILE")"
  while true; do
    recipient="$(shuf -n 1 "$USERS_FILE")"
    [[ "$recipient" != "$sender" ]] && break
  done

  IFS='|' read -r s_email s_token s_id <<<"$sender"
  IFS='|' read -r r_email r_token r_id <<<"$recipient"

  if tx_res="$(with_retry_tx "$s_token" "$r_id" "$AMOUNT")"; then
    echo "OK|${s_email}->${r_email}" >> "$RESULTS_FILE"
  else
    echo "FAIL|${s_email}->${r_email}|${tx_res}" >> "$RESULTS_FILE"
  fi
}
export -f run_one_tx

seq 1 "$TX_COUNT" | xargs -I{} -P "$CONCURRENCY" bash -c 'run_one_tx'

ok_count="$(grep -c '^OK|' "$RESULTS_FILE" || true)"
fail_count="$(grep -c '^FAIL|' "$RESULTS_FILE" || true)"
fail_429="$(grep -c 'FAIL|.*|FAIL|429|' "$RESULTS_FILE" || true)"
fail_401="$(grep -c 'FAIL|.*|FAIL|401|' "$RESULTS_FILE" || true)"
fail_400="$(grep -c 'FAIL|.*|FAIL|400|' "$RESULTS_FILE" || true)"

echo
echo "===== RESUMO ====="
echo "Usuários criados: ${created_users}"
echo "Transferências OK: ${ok_count}"
echo "Transferências FAIL: ${fail_count}"
echo "  - 429: ${fail_429}"
echo "  - 401: ${fail_401}"
echo "  - 400: ${fail_400}"

if (( fail_count > 0 )); then
  echo
  echo "Exemplos de falha:"
  grep '^FAIL|' "$RESULTS_FILE" | head -n 10
fi