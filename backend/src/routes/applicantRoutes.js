import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const allApplicants = await pool.query('SELECT * FROM applicant');
    res.json(allApplicants.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name, address, birthdate, place_birth, sex, height, weight,
      civil_status, landline_no, mobile_no, email_address
    } = req.body;

    // 1. CHECK IF EMAIL ALREADY EXISTS
    if (email_address) {
      const emailCheck = await pool.query(
        'SELECT * FROM applicant WHERE email_address = $1',
        [email_address]
      );

      if (emailCheck.rows.length > 0) {
        // Return a 400 status with a specific error message
        return res.status(400).json({ error: 'An application with this email address already exists.' });
      }
    }

    // 2. IF EMAIL IS UNIQUE, INSERT APPLICANT
    const newApplicant = await pool.query(
      `INSERT INTO applicant 
        (name, address, birthdate, place_birth, sex, height, weight, civil_status, landline_no, mobile_no, email_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [name, address, birthdate, place_birth, sex, height, weight, civil_status, landline_no, mobile_no, email_address]
    );

    res.json(newApplicant.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;