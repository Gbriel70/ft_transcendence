const express = require('express');
const client = require('prom-client');
const { initVault } = require('./vault');

const app = express();
const PORT = process.env.SERVICE_PORT || 3004;

app.use(express.json());

const register = client.register;
register.setDefaultLabels({ service: process.env.SERVICE_NAME || 'blockchain' });
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  if (req.path === '/metrics')
  {
    return next();
  }

  const endTimer = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = req.route && req.route.path ? `${req.baseUrl || ''}${req.route.path}` : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode
    };

    httpRequestsTotal.inc(labels);
    endTimer(labels);
  });

  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

async function bootstrap()
{
  await initVault();

  app.listen(PORT, () => {
    console.log(`✅ Blockchain service running on port ${PORT}`);
  });
}

bootstrap();
