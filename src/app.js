const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/orders.routes');
const { notFoundHandler, errorHandler } = require('./errors');

const app = express();

app.disable('x-powered-by');

// Enable CORS for cross-origin requests
app.use(cors());

// Body parser with size limits
app.use(express.json({ limit: '100kb' }));

// Health and static endpoints
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;