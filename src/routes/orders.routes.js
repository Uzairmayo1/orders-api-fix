const express = require('express');
const { pool } = require('../db');
const { AppError } = require('../errors');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const allowedStatuses = new Set(['pending', 'processing', 'shipped', 'cancelled']);

function parseOrderId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new AppError(400, 'Order id must be a positive integer');
  }
  return id;
}

function validateOrderInput(productName, quantity, status, partial = false) {
  if (!partial || productName !== undefined) {
    if (typeof productName !== 'string' || productName.trim().length < 1 || productName.trim().length > 200) {
      throw new AppError(400, 'Product name must contain 1 to 200 characters');
    }
  }

  if (!partial || quantity !== undefined) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new AppError(400, 'Quantity must be a positive integer');
    }
  }

  if (status !== undefined && !allowedStatuses.has(status)) {
    throw new AppError(400, 'Status is invalid');
  }
}

router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const { productName, quantity, status = 'pending', userId = req.user.id } = req.body;
    validateOrderInput(productName, quantity, status);

    const [result] = await pool.execute(
      'INSERT INTO orders (user_id, product_name, quantity, status) VALUES (?, ?, ?, ?)',
      [userId, productName.trim(), quantity, status]
    );
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [result.insertId]);
    return res.status(201).json({ order: orders[0] });
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseOrderId(req.params.id);
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (!orders[0]) {
      throw new AppError(404, 'Order was not found');
    }
    return res.json({ order: orders[0] });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseOrderId(req.params.id);
    const { productName, quantity, status } = req.body;
    if (productName === undefined && quantity === undefined && status === undefined) {
      throw new AppError(400, 'Provide at least one field to update');
    }
    validateOrderInput(productName, quantity, status, true);

    const updates = [];
    const values = [];
    if (productName !== undefined) { updates.push('product_name = ?'); values.push(productName.trim()); }
    if (quantity !== undefined) { updates.push('quantity = ?'); values.push(quantity); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    values.push(id);

    const [result] = await pool.execute(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) {
      throw new AppError(404, 'Order was not found');
    }
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    return res.json({ order: orders[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseOrderId(req.params.id);
    const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new AppError(404, 'Order was not found');
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
