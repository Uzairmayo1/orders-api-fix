class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function notFoundHandler(req, res, next) {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} was not found`));
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  console.error(error);
  return res.status(statusCode).json({
    error: error.message || 'Internal server error'
  });
}

module.exports = { AppError, notFoundHandler, errorHandler };
