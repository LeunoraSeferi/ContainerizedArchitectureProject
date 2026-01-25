export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    error: err.code || "INTERNAL_ERROR",
    message: err.message || "Unexpected error",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}
