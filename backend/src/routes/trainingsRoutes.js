import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET: Fetch trainings for a specific applicant
router.get('/:applicantId', async (req, res) => {
  try {
    const { applicantId } = req.params;

    const trainings = await pool.query(
      'SELECT * FROM trainings WHERE applicant_id = $1',
      [applicantId]
    );

    res.json(trainings.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST: Add a new training/skill
router.post('/', async (req, res) => {
  try {
    const { applicant_id, training_cert, skills, training_period } = req.body;

    const newTraining = await pool.query(
      `INSERT INTO trainings (applicant_id, training_cert, skills, training_period)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [applicant_id, training_cert, skills, training_period]
    );

    res.json(newTraining.rows[0]);
  } catch (err) {
    console.error("Error inserting training:", err.message);
    res.status(500).send('Database Error: Check if applicant_id exists.');
  }
});

export default router;