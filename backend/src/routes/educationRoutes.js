// src/routes/educationRoutes.js
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// 1. GET ROUTE: Fetch education for ONE specific applicant
// Notice the /:applicantId in the URL!
router.get('/:applicantId', async (req, res) => {
  try {
    const { applicantId } = req.params; // Grab the ID from the URL

    const educationHistory = await pool.query(
      'SELECT * FROM education_level WHERE applicant_id = $1',
      [applicantId]
    );

    res.json(educationHistory.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 2. POST ROUTE: Add a new education level
router.post('/', async (req, res) => {
  try {
    const {
      applicant_id, educ_level, school_name,
      highest_level_comp, year_graduated
    } = req.body;

    const newEducation = await pool.query(
      `INSERT INTO education_level 
        (applicant_id, educ_level, school_name, highest_level_comp, year_graduated) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [applicant_id, educ_level, school_name, highest_level_comp, year_graduated]
    );

    res.json(newEducation.rows[0]);
  } catch (err) {
    console.error(err.message);
    // If you send an applicant_id that doesn't exist, Postgres will throw an error here!
    res.status(500).send('Database Error: Check if applicant exists.');
  }
});

export default router;