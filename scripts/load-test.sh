#!/usr/bin/env sh
set -eu

BASE_URL=${BASE_URL:-http://localhost:3001}
REQUESTS=${REQUESTS:-50}
SLEEP=${SLEEP:-0.05}

payload='{"email":"loadtest@example.com","password":"pass123","name":"Load Test"}'

run_once() {
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Content-Type: application/json" \
    -X POST "${BASE_URL}/register" \
    -d "$payload"
}

i=1
while [ "$i" -le "$REQUESTS" ]; do
  run_once >/dev/null 2>&1 || true
  i=$((i + 1))
  sleep "$SLEEP"
done

echo "Sent ${REQUESTS} requests to ${BASE_URL}/register"
