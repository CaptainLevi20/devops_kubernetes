const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (CSS, JS)
app.use(express.static('public'));

// Parse JSON requests
app.use(express.json());

// In-memory storage for todos
let todos = [
  { id: 1, text: 'Learn Kubernetes', completed: false },
  { id: 2, text: 'Deploy a Docker app', completed: true }
];

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Todo App - Kubernetes Deployment</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 10px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          width: 100%;
          padding: 40px;
        }
        h1 {
          color: #333;
          margin-bottom: 30px;
          text-align: center;
          font-size: 28px;
        }
        .info {
          background: #e8f5e9;
          border-left: 4px solid #4caf50;
          padding: 15px;
          margin-bottom: 25px;
          border-radius: 4px;
          font-size: 14px;
          color: #2e7d32;
        }
        .input-group {
          display: flex;
          gap: 10px;
          margin-bottom: 25px;
        }
        input[type="text"] {
          flex: 1;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 4px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        input[type="text"]:focus {
          outline: none;
          border-color: #667eea;
        }
        button {
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: background 0.3s;
        }
        button:hover {
          background: #5568d3;
        }
        .todos-list {
          list-style: none;
        }
        .todo-item {
          display: flex;
          align-items: center;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 4px;
          margin-bottom: 10px;
          transition: background 0.3s;
        }
        .todo-item:hover {
          background: #eeeeee;
        }
        .todo-item input[type="checkbox"] {
          margin-right: 15px;
          cursor: pointer;
          width: 18px;
          height: 18px;
        }
        .todo-text {
          flex: 1;
          color: #333;
          transition: all 0.3s;
        }
        .todo-item input:checked + .todo-text {
          text-decoration: line-through;
          color: #999;
        }
        .delete-btn {
          background: #f44336;
          padding: 6px 12px;
          font-size: 14px;
          margin-left: 10px;
        }
        .delete-btn:hover {
          background: #d32f2f;
        }
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>✓ Todo App</h1>
        <div class="info">
          ✓ This app is successfully running in your Kubernetes cluster!
        </div>
        
        <div class="input-group">
          <input 
            type="text" 
            id="todoInput" 
            placeholder="Add a new todo..."
          >
          <button onclick="addTodo()">Add</button>
        </div>

        <ul class="todos-list" id="todosList"></ul>

        <div class="footer">
          Kubernetes Deployment Demo | Port: ${PORT}
        </div>
      </div>

      <script>
        let todos = ${JSON.stringify(todos)};

        function renderTodos() {
          const list = document.getElementById('todosList');
          list.innerHTML = '';
          
          if (todos.length === 0) {
            list.innerHTML = '<div class="empty-state">No todos yet. Add one to get started!</div>';
            return;
          }

          todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'todo-item';
            li.innerHTML = '<input type="checkbox" ' + (todo.completed ? 'checked' : '') + ' onchange="toggleTodo(' + todo.id + ')">' +
              '<span class="todo-text">' + todo.text + '</span>' +
              '<button class="delete-btn" onclick="deleteTodo(' + todo.id + ')">Delete</button>';
            list.appendChild(li);
          });
        }

        function addTodo() {
          const input = document.getElementById('todoInput');
          const text = input.value.trim();
          if (text) {
            const id = Math.max(...todos.map(t => t.id), 0) + 1;
            todos.push({ id, text, completed: false });
            input.value = '';
            renderTodos();
          }
        }

        function toggleTodo(id) {
          const todo = todos.find(t => t.id === id);
          if (todo) {
            todo.completed = !todo.completed;
            renderTodos();
          }
        }

        function deleteTodo(id) {
          todos = todos.filter(t => t.id !== id);
          renderTodos();
        }

        document.getElementById('todoInput').addEventListener('keypress', (e) => {
          if (e.key === 'Enter') addTodo();
        });

        renderTodos();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
