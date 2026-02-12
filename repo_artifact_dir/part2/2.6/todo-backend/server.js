const express = require('express');
const cors = require('cors');

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

app.use(cors());
app.use(express.json());

// In-memory todos for now
let todos = [
  { id: 1, text: 'Learn Kubernetes', completed: false },
  { id: 2, text: 'Deploy a Docker app', completed: true }
];

app.get('/todos', (req, res) => {
  res.json(todos);
});

app.post('/todos', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }
  const id = Math.max(...todos.map(t => t.id), 0) + 1;
  const todo = { id, text, completed: false };
  todos.push(todo);
  res.status(201).json(todo);
});

app.listen(PORT, () => {
  console.log(`todo-backend listening on ${PORT}`);
});
