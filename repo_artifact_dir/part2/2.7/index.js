const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = 3000;

const PGHOST = process.env.PGHOST || 'postgres';
const PGPORT = parseInt(process.env.PGPORT || '5432', 10);
const PGUSER = process.env.PGUSER || 'pingpong_user';
const PGPASSWORD = process.env.PGPASSWORD || 'pingpong_pass';
const PGDATABASE = process.env.PGDATABASE || 'pingpong_db';

const pool = new Pool({ host: PGHOST, port: PGPORT, user: PGUSER, password: PGPASSWORD, database: PGDATABASE });

async function initDb() {
    // Create table if not exists and ensure a row exists
    await pool.query(`CREATE TABLE IF NOT EXISTS counter (id INT PRIMARY KEY, value BIGINT)`);
    const res = await pool.query('SELECT value FROM counter WHERE id = 1');
    if (res.rowCount === 0) {
        await pool.query('INSERT INTO counter(id, value) VALUES (1, 0)');
    }
}

async function getCurrentValue() {
    const res = await pool.query('SELECT value FROM counter WHERE id = 1');
    return res.rows[0].value;
}

async function incrementAndGetOld() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const sel = await client.query('SELECT value FROM counter WHERE id = 1 FOR UPDATE');
        const current = parseInt(sel.rows[0].value, 10);
        await client.query('UPDATE counter SET value = value + 1 WHERE id = 1');
        await client.query('COMMIT');
        return current;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

console.log(`[${new Date().toISOString()}] Ping-Pong server starting on port ${PORT}`);

// Endpoint for ping-pong (increments counter in DB)
app.get('/pingpong', async (req, res) => {
    try {
        const current = await incrementAndGetOld();
        const response = `pong ${current}`;
        console.log(`[${new Date().toISOString()}] ${response}`);
        res.send(response);
    } catch (err) {
        console.error('Error updating counter', err.message || err);
        res.status(500).send('error');
    }
});

// Endpoint to return current counter without incrementing
app.get('/count', async (req, res) => {
    try {
        const value = await getCurrentValue();
        res.json({ count: parseInt(value, 10) });
    } catch (err) {
        console.error('Error reading counter', err.message || err);
        res.status(500).json({ error: 'db error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Start the server after DB init
initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Ping-Pong server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize DB', err.message || err);
    process.exit(1);
});
