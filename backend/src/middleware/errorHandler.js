/**
 * Global error handling middleware.
 * Catches anything passed to next(err)
 */
const errorHandler = (err, req, res, next) => {
  console.error("[UNHANDLED ERROR]", err);

  const status = err.status || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
