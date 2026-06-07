import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET: Fetch trainings for a specific applicant (including the skill name)
router.get('/:applicantId', async (req, res) => {
  try {
    const { applicantId } = req.params;

    // JOINed with the new skills table so you get the actual skill name, not just the ID
    const trainings = await pool.query(
      `SELECT t.*, s.skill_name 
       FROM trainings t
       LEFT JOIN skills s ON t.skillcd = s.skillcd
       WHERE t.applicant_id = $1`,
      [applicantId]
    );

    res.json(trainings.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST: Add a new training and link/create a skill
router.post('/', async (req, res) => {
  try {
    // Accept several possible keys from different frontends: `skills` (name), `skill_acquired`, or `skillcd` (id)
    const { applicant_id, training_cert, training_period } = req.body;
    console.log('trainings POST body:', req.body);
    const rawSkillName = (req.body.skills || req.body.skill_acquired || '')?.trim();
    const providedSkillId = req.body.skillcd ? parseInt(req.body.skillcd) : null;

    let skillId = null;

    if (providedSkillId && Number.isInteger(providedSkillId)) {
      // If caller provided an integer skill id, use it directly
      skillId = providedSkillId;
    } else if (rawSkillName) {
      // Otherwise, resolve by name (create if missing).
      // Use case-insensitive match and trim to avoid duplicates due to casing/spaces.
      const trimmed = rawSkillName.trim();
      const checkSkill = await pool.query('SELECT skillcd FROM skills WHERE LOWER(skill_name) = LOWER($1) LIMIT 1', [trimmed]);
      console.log('checkSkill rows:', checkSkill.rows);
      if (checkSkill.rows.length > 0) {
        skillId = checkSkill.rows[0].skillcd;
        console.log('resolved existing skillId:', skillId);
      } else {
        const newSkill = await pool.query('INSERT INTO skills (skill_name) VALUES ($1) RETURNING skillcd', [trimmed]);
        skillId = newSkill.rows[0].skillcd;
        console.log('created new skillId:', skillId);
      }
    } else {
      // No skill info provided; leave skillId null (DB column must allow null)
      skillId = null;
    }

    console.log('inserting training with skillId:', skillId);
    const newTraining = await pool.query(
      `INSERT INTO trainings (applicant_id, training_cert, skillcd, training_period)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [applicant_id, training_cert, skillId, training_period]
    );

    console.log('inserted training:', newTraining.rows[0]);
    res.json(newTraining.rows[0]);

  } catch (err) {
    console.error("Error inserting training:", err.message);
    res.status(500).send('Database Error: Check your data.');
  }
});

export default router;