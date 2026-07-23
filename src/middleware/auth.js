const jwt = require('jsonwebtoken');
const { AppError } = require('../errors');

function authenticate(req, res, next) {
  const authorization = req.get('authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication token is required'));
  }

  const token = authorization.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (error) {
    return next(new AppError(401, 'Invalid or expired authentication token'));
  }
}

module.exports = { authenticate };
