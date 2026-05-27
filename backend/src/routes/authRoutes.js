// src/routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = express.Router();

// 1. TEMPORARY REGISTER ROUTE (Use this once to create your admin account)
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // "Salt" and hash the password (scrambles it securely)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2) RETURNING admin_id, username',
      [username, hashedPassword]
    );

    res.json({ message: 'Admin created successfully!', user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 2. LOGIN ROUTE (Generates the JWT VIP Token)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the admin exists
    const user = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    // Compare the typed password with the scrambled one in the database
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    // Generate the JWT Token (Valid for 1 hour)
    const token = jwt.sign(
      { admin_id: user.rows[0].admin_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;