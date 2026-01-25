import client from "prom-client";

client.collectDefaultMetrics();

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});

export function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    const route = req.route?.path || req.path || req.originalUrl;
    end({
      method: req.method,
      route,
      status_code: String(res.statusCode),
    });
  });

  next();
}

export async function metricsEndpoint(req, res) {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
}
