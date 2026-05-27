import express from 'express';
import pool from '../config/db.js';
const router = express.Router();

// GET linguistics for a specific applicant
router.get('/:applicantId', async (req, res) => {
  try {
    const { applicantId } = req.params;
    const linguistics = await pool.query(
      'SELECT * FROM linguistics WHERE applicant_id = $1',
      [applicantId]
    );
    res.json(linguistics.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST a new linguistic entry
router.post('/', async (req, res) => {
  try {
    const { applicant_id, linguistic } = req.body;
    const newLinguistic = await pool.query(
      'INSERT INTO linguistics (applicant_id, linguistic) VALUES ($1, $2) RETURNING *',
      [applicant_id, linguistic]
    );
    res.json(newLinguistic.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;