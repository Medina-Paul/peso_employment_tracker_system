import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET: Fetch credentials for a specific applicant
router.get('/:applicantId', async (req, res) => {
    try {
        const { applicantId } = req.params;

        const credentials = await pool.query(
            'SELECT * FROM credentials WHERE applicant_id = $1',
            [applicantId]
        );

        res.json(credentials.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST: Add a new credential
router.post('/', async (req, res) => {
    try {
        const { applicant_id, credential_title } = req.body;

        const newCredential = await pool.query(
            `INSERT INTO credentials (applicant_id, credential_title)
       VALUES ($1, $2)
       RETURNING *`,
            [applicant_id, credential_title]
        );

        res.json(newCredential.rows[0]);
    } catch (err) {
        console.error("Error inserting credential:", err.message);
        res.status(500).send('Database Error: Check if applicant_id exists.');
    }
});

export default router;