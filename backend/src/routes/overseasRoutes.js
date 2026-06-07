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
    const { applicant_id, if_overseas_filipino, of_status, of_location, dependents } = req.body;

    if (if_overseas_filipino !== 'yes' || !dependents || dependents.length === 0) {
      return res.status(400).json({ error: 'No dependent data provided' });
    }

    // Loop through the dependents array and create an insert query for EACH ONE
    const insertPromises = dependents.map(dep => {
      return pool.query(
        `INSERT INTO overseas_filipino
          (applicant_id, if_overseas_filipino, of_dependent, of_location, of_status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          applicant_id,
          if_overseas_filipino,
          dep.of_dependent, // Extracted from the array
          of_location,      // Top-level value
          of_status         // Top-level value
        ]
      );
    });

    // Execute all queries in parallel
    const results = await Promise.all(insertPromises);
    
    // Return the inserted rows back to frontend
    res.json(results.map(result => result.rows[0]));
    
  } catch (err) {
    console.error("Overseas Insert Error:", err.message);
    res.status(500).json({ error: 'Database Error' });
  }
});

export default router;