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

// CREATE ORDER (Security Fix: Lock userId to authenticated user)
router.post('/', async (req, res, next) => {
  try {
    const { productName, quantity, status = 'pending' } = req.body;
    const userId = req.user.id; // Force using logged-in user ID
    
    validateOrderInput(productName, quantity, status);

    const [result] = await pool.execute(
      'INSERT INTO orders (user_id, product_name, quantity, status) VALUES (?, ?, ?, ?)',
      [userId, productName.trim(), quantity, status]
    );
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ? AND user_id = ?', [result.insertId, userId]);
    return res.status(201).json({ order: orders[0] });
  } catch (error) {
    return next(error);
  }
});

// GET ALL ORDERS FOR USER
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

// GET SINGLE ORDER (Authorization Fix: Restrict to owner)
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseOrderId(req.params.id);
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!orders[0]) {
      throw new AppError(404, 'Order was not found');
    }
    return res.json({ order: orders[0] });
  } catch (error) {
    return next(error);
  }
});

// UPDATE ORDER (Authorization Fix: Restrict update to owner)
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
    
    values.push(id, req.user.id);

    const [result] = await pool.execute(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, 
      values
    );
    
    if (result.affectedRows === 0) {
      throw new AppError(404, 'Order was not found or unauthorized');
    }
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, req.user.id]);
    return res.json({ order: orders[0] });
  } catch (error) {
    return next(error);
  }
});

// DELETE ORDER (Authorization Fix: Restrict deletion to owner)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseOrderId(req.params.id);
    const [result] = await pool.execute('DELETE FROM orders WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (result.affectedRows === 0) {
      throw new AppError(404, 'Order was not found or unauthorized');
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;