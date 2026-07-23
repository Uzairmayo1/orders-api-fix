const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { AppError } = require('../errors');

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(name, email, password, needsName) {
  if ((needsName && (!name || name.trim().length < 2)) ||
      !email || !EMAIL_PATTERN.test(email) || !password || password.length < 8) {
    throw new AppError(400, 'Provide a valid name, email, and password of at least 8 characters');
  }
}

function createToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET
  );
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    validateCredentials(name, email, password, true);

    const normalizedEmail = email.trim().toLowerCase();
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existingUsers.length > 0) {
      throw new AppError(409, 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = { id: result.insertId, name: name.trim(), email: normalizedEmail };
    return res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    validateCredentials(null, email, password, false);

    const normalizedEmail = email.trim().toLowerCase();
    const [users] = await pool.execute(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [normalizedEmail]
    );
    const user = users[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError(401, 'Invalid email or password');
    }

    return res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token: createToken(user)
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
