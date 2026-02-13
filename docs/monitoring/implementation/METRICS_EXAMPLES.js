// Example: How to use metrics in a Node.js microservice
// This shows the pattern used in auth_service and user_service

const express = require('express');
const {
  metricsMiddleware,
  metricsEndpoint,
  trackDbQuery,
  recordError
} = require('../../shared/metrics');

const app = express();

// 1. Add metrics middleware to track all HTTP requests
app.use(express.json());
app.use(metricsMiddleware);

// 2. Add the /metrics endpoint that Prometheus scrapes
app.get('/metrics', metricsEndpoint);

// 3. Example: Track a database query
app.get('/users/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    // Create a timer for this database operation
    const dbTimer = trackDbQuery('SELECT', 'users');

    // Execute query
    const result = await database.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    // Mark the query as successful and stop the timer
    // This records it in the db_query_duration_seconds histogram
    // and increments db_queries_total counter
    dbTimer.end('success');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    // Record that an error occurred
    recordError('db_query', 'user_service');

    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Example: Track authentication failures
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Track the query
    const dbTimer = trackDbQuery('SELECT', 'users');
    const user = await database.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    dbTimer.end('success');

    if (!user.rows.length) {
      // Record the failure - this increments errors_total counter
      recordError('login_failed', 'auth_service');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ token: 'jwt_token_here' });
  } catch (error) {
    recordError('login_error', 'auth_service');
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3001, () => {
  console.log('Service started on port 3001');
  console.log('Metrics available at http://localhost:3001/metrics');
});

// ============================================================
// WHAT GETS RECORDED:
// ============================================================
//
// metricsMiddleware automatically tracks:
// - http_requests_total{method="GET",route="/users/:id",status_code="200"} 1
// - http_request_duration_seconds_bucket{method="GET",route="/users/:id"} 0.045
//
// trackDbQuery('SELECT', 'users') records:
// - db_query_duration_seconds_bucket{operation="SELECT",table="users"} 0.023
// - db_queries_total{operation="SELECT",table="users",status="success"} 1
//
// recordError('login_failed', 'auth_service') records:
// - errors_total{error_type="login_failed",service="auth_service"} 1
//
// ============================================================
// VIEW METRICS:
// ============================================================
//
// 1. See raw metrics:
//    curl http://localhost:3001/metrics
//
// 2. Query in Prometheus:
//    - http_requests_total{job="user_service"}
//    - rate(http_requests_total[5m])  # requests per second
//    - histogram_quantile(0.95, http_request_duration_seconds_bucket)  # p95 latency
//    - db_query_duration_seconds_sum / db_queries_total  # avg query time
//    - rate(errors_total[5m])  # errors per second
//
// 3. View in Grafana dashboards:
//    - System Overview: Request rates, latency, errors
//    - Services: Per-service breakdown
//    - Database: Query performance and connections
//
// ============================================================
