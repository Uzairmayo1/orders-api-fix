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

  // Handle MySQL Duplicate Entry Errors
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  // Handle Syntax/JSON parsing errors from express.json()
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  // Log all unhandled or 500 errors for debugging
  console.error('[Error Details]:', error);

  // Security Fix: Do not leak internal server error messages to clients
  const clientMessage = error.isOperational
    ? error.message
    : 'Internal server error';

  return res.status(statusCode).json({
    error: clientMessage
  });
}

module.exports = { AppError, notFoundHandler, errorHandler };