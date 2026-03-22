import client from 'prom-client';

client.collectDefaultMetrics();

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

export const register = client.register;
