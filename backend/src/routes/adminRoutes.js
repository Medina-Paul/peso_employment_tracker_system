import express from 'express';
import pool from '../config/db.js';
const router = express.Router();


// 1. GET: Fetch all applicants for the summary table
router.get('/applicants', async (req, res) => {
  try {
    const query = `
      SELECT 
        a.applicant_id, a.name, a.address, a.birthdate, a.sex, 
        a.civil_status, a.mobile_no, a.email_address, a.application_status as status,
        (SELECT current_position FROM employment WHERE applicant_id = a.applicant_id ORDER BY employment_id DESC LIMIT 1) as current_position,
        (SELECT educ_level || ' - ' || school_name FROM education_level WHERE applicant_id = a.applicant_id ORDER BY year_graduated DESC LIMIT 1) as highest_education
      FROM applicant a
      ORDER BY a.applicant_id DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching dashboard data:", err.message);
    res.status(500).send('Server Error');
  }
});

// 2. PUT: Update an applicant's status (Hire/Reject)
router.put('/applicants/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const update = await pool.query(
      'UPDATE applicant SET application_status = $1 WHERE applicant_id = $2 RETURNING *',
      [status, id]
    );

    res.json(update.rows[0]);
  } catch (err) {
    console.error("Error updating status:", err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 2. THE BLIND RECRUITMENT SCREENING ROUTE
// ==========================================
// This route purposely omits the name, exact address, birthdate, and sex.
// It joins the education table so the admin only sees raw qualifications.
router.get('/blind-screening', async (req, res) => {
  try {
    const blindQuery = `
      SELECT 
        a.applicant_id, 
        a.application_status,
        e.educ_level, 
        e.school_name, 
        e.highest_level_comp, 
        e.year_graduated
      FROM applicant a
      LEFT JOIN education_level e ON a.applicant_id = e.applicant_id
      WHERE a.application_status = 'Pending'
      ORDER BY a.applicant_id ASC
    `;

    const candidates = await pool.query(blindQuery);
    res.json(candidates.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 3. THE STATUS UPDATER (PATCH Route)
// ==========================================
// Admins use this to change a candidate from 'Pending' to 'Shortlisted', etc.
router.patch('/status/:applicantId', async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { new_status } = req.body;

    const updateQuery = await pool.query(
      `UPDATE applicant 
       SET application_status = $1 
       WHERE applicant_id = $2 
       RETURNING applicant_id, application_status`,
      [new_status, applicantId]
    );

    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    res.json(updateQuery.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Database Error: Check if the status matches the CHECK constraint.');
  }
});

export default router;