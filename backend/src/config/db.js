import pg from 'pg';
const { Pool } = pg;

import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Neon requires this for secure connections!
    }
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Failed to connect to the Neon database:', err.message);
    } else {
        console.log('Connected to Neon successfully at:', res.rows[0].now);
    }
});

export default pool;