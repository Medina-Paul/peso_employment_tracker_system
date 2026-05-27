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
      name, address, birthdate, place_birth, sex, 
      height, weight, religion, civil_status, 
      landline_no, mobile_no, email_address
    } = req.body;

    // Helper 1: For numbers and text that don't need lowercasing
    const cleanNull = (val) => (val === "" || val === undefined ? null : val);
    
    // Helper 2: For strict CHECK constraints (Forces lowercase)
    const cleanLower = (val) => {
        if (val === "" || val === undefined || val === null) return null;
        return String(val).toLowerCase();
    };

    const newApplicant = await pool.query(
      `INSERT INTO applicant 
        (name, address, birthdate, place_birth, sex, height, weight, religion, civil_status, landline_no, mobile_no, email_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        name, address, birthdate, place_birth, 
        sex, // Sex is 'M', 'F', 'O' in your DB, so we leave it alone!
        cleanNull(height), cleanNull(weight), cleanNull(religion), 
        cleanLower(civil_status), // Forced to lowercase!
        cleanNull(landline_no), mobile_no, cleanNull(email_address)
      ]
    );

    res.json(newApplicant.rows[0]);
  } catch (err) {
    console.error("Applicant Insert Error:", err.message);
    res.status(500).send('Server Error');
  }
});

export default router;