Here’s a quick, practical checklist to validate the new metrics, dashboard, and alerts:

1. Rebuild and start: `docker compose up -d --build`
2. Confirm metrics endpoints respond:
   - `curl http://localhost:3001/metrics | head -20`
   - `curl http://localhost:3002/metrics | head -20`
   - `curl http://localhost:3003/metrics | head -20`
   - `curl http://localhost:3004/metrics | head -20`
3. Verify Prometheus sees targets:
   - `curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health, scrapeUrl: .scrapeUrl}'`
4. Generate traffic and confirm counters move:
   - `curl -X POST http://localhost:3001/register -H 'Content-Type: application/json' -d '{"email":"test@example.com","password":"pass","name":"Test"}'`
   - Then query in Prometheus UI: `rate(http_requests_total[1m])`
5. Check Grafana dashboards:
   - Open `http://localhost:3000`, log in, and load “Services Overview”
   - Look for non-zero request rate and latency
6. Validate alert rules are loaded:
   - `curl http://localhost:9090/api/v1/rules | jq '.data.groups[] | {name: .name, rules: [.rules[].name]}'`
7. (Optional) Force an alert to see it fire:
   - Stop a service: `docker compose stop user_service`
   - Wait 2–3 minutes and check `http://localhost:9090/alerts`
   - Start it again: `docker compose start user_service`


we have a tiny load script to drive traffic and produce clearer graphs and alerts.

Created [](file:///home/fde-alen/2/scripts/load-test.sh)

Added a small load script to generate traffic against the auth service: load-test.sh.

Run it like this:
```bash
chmod +x scripts/load-test.sh
./scripts/load-test.sh
```

Optional overrides:
```bash
BASE_URL=http://localhost:3001 REQUESTS=200 SLEEP=0.01 ./scripts/load-test.sh
```

Next steps:
1. Run the script.
2. Open Prometheus and query `rate(http_requests_total[1m])`.
3. Open Grafana and check the “Services Overview” dashboard for request rate and p95 latency.

Made changes.
