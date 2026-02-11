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

async function initDb() {
  if (!useInMemory) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);
  }
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
  if (text.length > MAX_TODO_LENGTH) {
    const warnLine = `TODO_REJECTED_TOO_LONG length=${text.length} limit=${MAX_TODO_LENGTH} text=${text}`;
    console.warn(warnLine);
    appendLog(warnLine);
    return res.status(400).json({ error: `text must be ${MAX_TODO_LENGTH} characters or less` });
  }
  try {
    const result = await pool.query('INSERT INTO todos(text, completed) VALUES($1, $2) RETURNING id, text, completed', [text, false]);
    // Registrar el todo aceptado
    const okLine = `TODO_CREATED id=${result.rows[0].id} text=${result.rows[0].text}`;
    console.log(okLine);
    appendLog(okLine);
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
