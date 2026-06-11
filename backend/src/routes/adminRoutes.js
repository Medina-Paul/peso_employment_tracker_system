import express from 'express';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { sendStatusEmail } from '../utils/emailService.js';
const router = express.Router();

// ==========================================
// 1. GET: Fetch all applicants for the summary table
// ==========================================
router.get('/applicants', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ON (a.applicant_id)
        a.*,
        a.application_status AS status, -- Aliased for React frontend compatibility
        emp.employment_status,
        o.if_overseas_filipino,
        ed.educ_level AS highest_education,
        ed.school_name,
        COALESCE(s.total_skills, 0) AS total_skills,
        COALESCE(l.total_languages, 0) AS total_languages,
        COALESCE(c.total_certificates, 0) AS total_certificates
      FROM applicant a
      
      -- 1. Join Employment Status (use subquery to get one row per applicant)
      LEFT JOIN (
        SELECT DISTINCT ON (applicant_id) applicant_id, employment_status 
        FROM employment
        ORDER BY applicant_id, employment_id DESC
      ) emp ON a.applicant_id = emp.applicant_id
      
      -- 2. Join Overseas Status (use subquery to get one row per applicant)
      LEFT JOIN (
        SELECT DISTINCT ON (applicant_id) applicant_id, if_overseas_filipino 
        FROM overseas_filipino
        ORDER BY applicant_id
      ) o ON a.applicant_id = o.applicant_id

      -- 3. Join Education Level (get the highest/latest education record)
      LEFT JOIN (
        SELECT DISTINCT ON (applicant_id) applicant_id, educ_level, school_name
        FROM education_level
        ORDER BY applicant_id, year_graduated DESC
      ) ed ON a.applicant_id = ed.applicant_id
      
      -- 4. Aggregate Skills count
      LEFT JOIN (
        SELECT applicant_id, COUNT(*) as total_skills 
        FROM trainings 
        GROUP BY applicant_id
      ) s ON a.applicant_id = s.applicant_id
      
      -- 5. Aggregate Languages count
      LEFT JOIN (
        SELECT applicant_id, COUNT(*) as total_languages 
        FROM linguistics 
        GROUP BY applicant_id
      ) l ON a.applicant_id = l.applicant_id
      
      -- 6. Aggregate Credentials count
      LEFT JOIN (
        SELECT applicant_id, COUNT(*) as total_certificates 
        FROM credentials 
        GROUP BY applicant_id
      ) c ON a.applicant_id = c.applicant_id
      
      ORDER BY a.applicant_id DESC;
    `;

    // Fixed: Changed 'db.query' to 'pool.query' to match your import
    const result = await pool.query(query);
    
    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error fetching dashboard applicants:", error);
    res.status(500).json({ error: "Internal server error fetching applicants." });
  }
});

// ==========================================
// Fetch admin user details
// ==========================================
router.get('/admin-user', verifyToken, async (req, res) => {
  try {
    const admin = await pool.query(
      'SELECT admin_id, username FROM admin_users WHERE admin_id = $1',
      [req.user.admin_id]
    );

    if (admin.rows.length === 0) return res.status(404).json({ error: 'Admin not found' });

    res.json(admin.rows[0]);
  } catch (err) {
    console.error('Error fetching admin user:', err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// GET: Fetch full details of a specific applicant by ID
// ==========================================
router.get('/applicants/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `SELECT * FROM applicant WHERE applicant_id = $1`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Applicant not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching single applicant profile:", err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 2. PUT: Update an applicant's status (Hire/Reject)
// ==========================================
router.put('/applicants/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const update = await pool.query(
      'UPDATE applicant SET application_status = $1 WHERE applicant_id = $2 RETURNING *',
      [status, id]
    );

    const appRes = await pool.query('SELECT email_address FROM applicant WHERE applicant_id = $1', [id]);
    const email = appRes.rows[0]?.email_address;

    if (email) {
      await sendStatusEmail(email, status);
      console.log(`Notification email logic triggered for ${email}`);
    }

    res.json({ message: "Status updated and email handled" });
  } catch (err) {
    console.error("Error updating status:", err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// DELETE: Remove an applicant record
// ==========================================
router.delete('/applicants/:id/delete', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('BEGIN');

    // Delete dependent records first
    await pool.query('DELETE FROM education_level WHERE applicant_id = $1', [id]);
    await pool.query('DELETE FROM credentials WHERE applicant_id = $1', [id]);
    await pool.query('DELETE FROM trainings WHERE applicant_id = $1', [id]);
    await pool.query('DELETE FROM linguistics WHERE applicant_id = $1', [id]);
    await pool.query('DELETE FROM employment WHERE applicant_id = $1', [id]);
    await pool.query('DELETE FROM overseas_filipino WHERE applicant_id = $1', [id]);

    // Finally, delete the applicant
    const result = await pool.query('DELETE FROM applicant WHERE applicant_id = $1', [id]);

    await pool.query('COMMIT');

    if (result.rowCount === 0) return res.status(404).json({ error: "Applicant not found" });

    res.json({ message: "Applicant and related data deleted successfully" });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error("Delete Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// THE BLIND RECRUITMENT SCREENING ROUTE
// ==========================================
router.get('/blind-screening', verifyToken, async (req, res) => {
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
// THE STATUS UPDATER (PATCH Route)
// ==========================================
router.patch('/status/:applicantId', verifyToken, async (req, res) => {
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