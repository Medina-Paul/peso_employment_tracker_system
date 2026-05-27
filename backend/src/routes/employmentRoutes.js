import express from 'express';
import pool from '../config/db.js';
const router = express.Router();

// =======================
// EMPLOYER ROUTES
// =======================

// POST a new employer (Find or Create Logic)
router.post('/employer', async (req, res) => {
  try {
    const { employer_name, employer_address, business_nature } = req.body;

    // 1. Check if this exact employer already exists
    const existingEmployer = await pool.query(
      `SELECT * FROM employer WHERE employer_name = $1 AND employer_address = $2`,
      [employer_name, employer_address]
    );

    // 2. If they exist, return the existing ID!
    if (existingEmployer.rows.length > 0) {
      return res.json(existingEmployer.rows[0]);
    }

    // 3. If they do NOT exist, insert them as a new employer
    const newEmployer = await pool.query(
      `INSERT INTO employer (employer_name, employer_address, business_nature)
       VALUES ($1, $2, $3) RETURNING *`,
      [employer_name, employer_address, business_nature || null]
    );

    res.json(newEmployer.rows[0]);
  } catch (err) {
    console.error("Employer Insert Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// =======================
// EMPLOYMENT HISTORY ROUTES
// =======================

router.get('/:applicantId', async (req, res) => {
  try {
    const { applicantId } = req.params;
    const query = `
      SELECT emp.*, e.employer_name, e.employer_address, e.business_nature
      FROM employment emp
      JOIN employer e ON emp.employer_id = e.employer_id
      WHERE emp.applicant_id = $1
    `;
    const history = await pool.query(query, [applicantId]);
    res.json(history.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      applicant_id, employment_status, position_last_employer,
      current_position, employer_id
    } = req.body;

    const newJob = await pool.query(
      `INSERT INTO employment
        (applicant_id, employment_status, position_last_employer, current_position, employer_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [applicant_id, employment_status, position_last_employer || null, current_position, employer_id]
    );
    res.json(newJob.rows[0]);
  } catch (err) {
    console.error("Employment Insert Error:", err.message);
    res.status(500).send('Database Error: Make sure employer_id exists first!');
  }
});

export default router;