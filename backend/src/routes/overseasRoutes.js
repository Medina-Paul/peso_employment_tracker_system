import express from 'express';
import pool from '../config/db.js';
const router = express.Router();

router.get('/:applicantId', async (req, res) => {
  try {
    const { applicantId } = req.params;
    const overseasData = await pool.query(
      'SELECT * FROM overseas_filipino WHERE applicant_id = $1',
      [applicantId]
    );
    res.json(overseasData.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      applicant_id, if_overseas_filipino, of_dependent,
      of_location, of_status
    } = req.body;

    // Helper for strict CHECK constraints
    const cleanLower = (val) => {
        if (val === "" || val === undefined || val === null) return null;
        return String(val).toLowerCase();
    };

    const newOverseas = await pool.query(
      `INSERT INTO overseas_filipino
        (applicant_id, if_overseas_filipino, of_dependent, of_location, of_status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        applicant_id, 
        cleanLower(if_overseas_filipino), 
        cleanLower(of_dependent), 
        cleanLower(of_location), 
        cleanLower(of_status)
      ]
    );
    
    res.json(newOverseas.rows[0]);
  } catch (err) {
    console.error("Overseas Insert Error:", err.message);
    res.status(500).send('Database Error: Check your constraint exact wording.');
  }
});

export default router;