const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var ${name}`);
    process.exit(1);
  }
  return v;
}

const PORT = parseInt(requiredEnv('PORT'), 10);

const PGHOST = process.env.PGHOST || process.env.POSTGRES_HOST || 'localhost';
const PGPORT = parseInt(process.env.PGPORT || process.env.POSTGRES_PORT || '5432', 10);
const PGUSER = process.env.PGUSER || process.env.POSTGRES_USER;
const PGPASSWORD = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
const PGDATABASE = process.env.PGDATABASE || process.env.POSTGRES_DB;

if (!PGUSER || !PGPASSWORD || !PGDATABASE) {
  console.error('Database credentials are not fully provided (PGUSER/PGPASSWORD/PGDATABASE).');
  process.exit(1);
}

const pool = new Pool({
  host: PGHOST,
  port: PGPORT,
  user: PGUSER,
  password: PGPASSWORD,
  database: PGDATABASE,
});

app.use(cors());
app.use(express.json());

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);
}

app.get('/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, text, completed FROM todos ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/todos', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }
  try {
    const result = await pool.query('INSERT INTO todos(text, completed) VALUES($1, $2) RETURNING id, text, completed', [text, false]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`todo-backend listening on ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
