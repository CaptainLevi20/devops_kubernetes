const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const fs = require('fs');

const LOG_FILE = process.env.LOG_FILE || 'backend.log';
function appendLog(line) {
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (err) {
    console.error('Failed to write log file:', err);
  }
}

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var ${name}`);
    process.exit(1);
  }
  return v;
}

const PORT = parseInt(requiredEnv('PORT'), 10);

// máximo tamaño de un todo (puede ajustarse con la variable de entorno MAX_TODO_LENGTH)
const MAX_TODO_LENGTH = parseInt(process.env.MAX_TODO_LENGTH || '140', 10);

const PGHOST = process.env.PGHOST || process.env.POSTGRES_HOST || 'localhost';
const PGPORT = parseInt(process.env.PGPORT || process.env.POSTGRES_PORT || '5432', 10);
const PGUSER = process.env.PGUSER || process.env.POSTGRES_USER;
const PGPASSWORD = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
const PGDATABASE = process.env.PGDATABASE || process.env.POSTGRES_DB;

let useInMemory = false;
let pool = null;
if (!PGUSER || !PGPASSWORD || !PGDATABASE) {
  console.warn('Database credentials not fully provided — falling back to in-memory storage for local testing.');
  useInMemory = true;
  // simple in-memory store
  const _todos = [];
  let _nextId = 1;
  // provide a minimal async-compatible API so the rest of the code can remain similar
  pool = {
    query: async (text, params) => {
      if (text.startsWith('SELECT')) {
        return { rows: _todos.slice() };
      }
      if (text.startsWith('INSERT')) {
        const todo = { id: _nextId++, text: params[0], completed: params[1] };
        _todos.push(todo);
        return { rows: [todo] };
      }
      if (text.startsWith('UPDATE')) {
        // expected params: [completed, id]
        const id = Number(params[1]);
        const todo = _todos.find(t => t.id === id);
        if (!todo) return { rows: [] };
        todo.completed = params[0];
        return { rows: [todo] };
      }
      return { rows: [] };
    }
  };
} else {
  pool = new Pool({
    host: PGHOST,
    port: PGPORT,
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
  });
}

app.use(cors());
app.use(express.json());

// Logging middleware: registra método, ruta, tiempo y cuerpo (si existe).
app.use((req, res, next) => {
  const now = new Date().toISOString();
  const body = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : '';
  const line = `[${now}] ${req.method} ${req.originalUrl}${body ? ` body=${body}` : ''}`;
  console.log(line);
  appendLog(line);
  next();
});

// Liveness endpoint: simple check that the process is up
app.get('/healthz', (req, res) => {
  res.sendStatus(200);
});

// Readiness endpoint: ensure we can reach the database
app.get('/ready', async (req, res) => {
  if (useInMemory) {
    return res.status(503).json({ ready: false, reason: 'no-db-credentials' });
  }
  try {
    // quick DB query to assert connectivity
    await pool.query('SELECT 1');
    return res.json({ ready: true });
  } catch (err) {
    console.error('Readiness check failed:', err);
    return res.status(503).json({ ready: false, error: 'db-unavailable' });
  }
});

async function initDb() {
  if (!useInMemory) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          text TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT FALSE
        );
      `);
      return true;
    } catch (err) {
      console.error('Database initialization failed (will continue, readiness will report failure):', err);
      return false;
    }
  }
  return true;
}

app.get('/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, text, completed FROM todos ORDER BY id');
    // map DB shape (completed) to API shape (done)
    const rows = result.rows.map(r => ({ id: r.id, text: r.text, done: !!r.completed }));
    res.json(rows);
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
  if (text.length > MAX_TODO_LENGTH) {
    const warnLine = `TODO_REJECTED_TOO_LONG length=${text.length} limit=${MAX_TODO_LENGTH} text=${text}`;
    console.warn(warnLine);
    appendLog(warnLine);
    return res.status(400).json({ error: `text must be ${MAX_TODO_LENGTH} characters or less` });
  }
  try {
    const result = await pool.query('INSERT INTO todos(text, completed) VALUES($1, $2) RETURNING id, text, completed', [text, false]);
    // Registrar el todo aceptado
    const created = result.rows[0];
    const okLine = `TODO_CREATED id=${created.id} text=${created.text}`;
    console.log(okLine);
    appendLog(okLine);
    res.status(201).json({ id: created.id, text: created.text, done: !!created.completed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Update todo (mark done/undone or update other fields in future)
app.put('/todos/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });
  const { done } = req.body;
  if (typeof done !== 'boolean') return res.status(400).json({ error: 'done must be boolean' });
  try {
    const result = await pool.query('UPDATE todos SET completed=$1 WHERE id=$2 RETURNING id, text, completed', [done, id]);
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ error: 'not found' });
    const row = result.rows[0];
    const okLine = `TODO_UPDATED id=${row.id} done=${row.completed}`;
    console.log(okLine);
    appendLog(okLine);
    res.json({ id: row.id, text: row.text, done: !!row.completed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Initialize DB if possible but always start the HTTP server so readiness
// endpoint can report DB availability to Kubernetes.
(async () => {
  await initDb();
  app.listen(PORT, () => {
    console.log(`todo-backend listening on ${PORT}`);
  });
})();
