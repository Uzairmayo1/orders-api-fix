const express = require('express');
const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/orders.routes');
const { notFoundHandler, errorHandler } = require('./errors');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
