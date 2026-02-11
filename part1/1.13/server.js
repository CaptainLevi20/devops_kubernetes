const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

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

// Image cache configuration
const CACHE_DIR = '/cache';
const IMAGE_CACHE_FILE = path.join(CACHE_DIR, 'current-image.jpg');
const CACHE_METADATA_FILE = path.join(CACHE_DIR, 'cache-metadata.json');
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const PICSUM_URL = 'https://picsum.photos/1200/600';

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  console.log('Cache directory created:', CACHE_DIR);
}

// Function to load cache metadata
function loadCacheMetadata() {
  try {
    if (fs.existsSync(CACHE_METADATA_FILE)) {
      const data = fs.readFileSync(CACHE_METADATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('No valid cache metadata found');
  }
  return { lastUpdated: 0, imageUrl: null };
}

// Function to save cache metadata
function saveCacheMetadata(metadata) {
  fs.writeFileSync(CACHE_METADATA_FILE, JSON.stringify(metadata, null, 2));
}

// Function to fetch and cache image
async function updateImageCache() {
  try {
    console.log('Fetching new image from picsum.photos...');
    const response = await fetch(PICSUM_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    fs.writeFileSync(IMAGE_CACHE_FILE, buffer);
    
    const metadata = {
      lastUpdated: Date.now(),
      imageUrl: response.url,
      size: buffer.length
    };
    
    saveCacheMetadata(metadata);
    console.log('Image cached successfully:', metadata);
    
    return true;
  } catch (error) {
    console.error('Error updating image cache:', error.message);
    return false;
  }
}

// Function to check if cache is valid
function isCacheValid() {
  if (!fs.existsSync(IMAGE_CACHE_FILE)) {
    console.log('No cached image found');
    return false;
  }
  
  const metadata = loadCacheMetadata();
  const now = Date.now();
  const cacheAge = now - metadata.lastUpdated;
  
  console.log(`Cache age: ${cacheAge}ms / ${CACHE_DURATION}ms (valid: ${cacheAge < CACHE_DURATION})`);
  
  return cacheAge < CACHE_DURATION;
}

// Initialize image cache on startup
async function initializeImageCache() {
  if (!isCacheValid()) {
    await updateImageCache();
  } else {
    console.log('Using existing cached image');
  }
  
  // Schedule cache refresh every 10 minutes
  setInterval(async () => {
    console.log('Cache refresh interval reached, fetching new image...');
    await updateImageCache();
  }, CACHE_DURATION);
}

// Initialize on startup
initializeImageCache();

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
        .image-container {
          width: 100%;
          margin-bottom: 25px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .image-container img {
          width: 100%;
          height: auto;
          display: block;
        }
        .image-info {
          background: #f5f5f5;
          padding: 12px;
          font-size: 12px;
          color: #666;
          text-align: center;
          border-top: 1px solid #e0e0e0;
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
        .char-count {
          align-self: center;
          font-size: 12px;
          color: #666;
          margin-left: 8px;
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
        
        <div class="image-container">
          <img id="dailyImage" src="/image" alt="Daily random image from Lorem Picsum" />
          <div class="image-info">
            📸 Changes every 10 minutes | Cached in persistent volume
          </div>
        </div>
        
        <div class="info">
          ✓ This app is successfully running in your Kubernetes cluster!
        </div>
        
        <div class="input-group">
          <input 
            type="text" 
            id="todoInput" 
            placeholder="Add a new todo... (max 140 chars)"
            maxlength="140"
          >
          <button onclick="addTodo()">Send</button>
          <div id="charCount" class="char-count">0/140</div>
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
            li.innerHTML = \`
              <input 
                type="checkbox" 
                \${todo.completed ? 'checked' : ''} 
                onchange="toggleTodo(\${todo.id})">
              <span class="todo-text">\${todo.text}</span>
              <button class="delete-btn" onclick="deleteTodo(\${todo.id})">Delete</button>
            \`;
            list.appendChild(li);
          });
        }

        function addTodo() {
          const input = document.getElementById('todoInput');
          const text = input.value.trim();
          if (!text) return;
          if (text.length > 140) {
            alert('Todo must be 140 characters or less.');
            return;
          }
          if (text) {
            const id = Math.max(...todos.map(t => t.id), 0) + 1;
            todos.push({ id, text, completed: false });
            input.value = '';
            const charCountEl = document.getElementById('charCount');
            if (charCountEl) charCountEl.textContent = \`0/140\`;
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

        const inputEl = document.getElementById('todoInput');
        const charCountEl = document.getElementById('charCount');
        inputEl.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') addTodo();
        });
        inputEl.addEventListener('input', () => {
          if (charCountEl) charCountEl.textContent = \`\${inputEl.value.length}/140\`;
        });

        renderTodos();
      </script>
    </body>
    </html>
  `);
});

// Endpoint to serve the cached image
app.get('/image', (req, res) => {
  try {
    if (fs.existsSync(IMAGE_CACHE_FILE)) {
      const stats = fs.statSync(IMAGE_CACHE_FILE);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=600'); // 10 minutes browser cache
      const fileStream = fs.createReadStream(IMAGE_CACHE_FILE);
      fileStream.pipe(res);
    } else {
      res.status(404).send('Image not available');
    }
  } catch (error) {
    console.error('Error serving image:', error.message);
    res.status(500).send('Error serving image');
  }
});

// Health check endpoint for Kubernetes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', cacheValid: isCacheValid() });
});

// Endpoint to manually refresh the image (for testing)
app.post('/refresh-image', async (req, res) => {
  console.log('Manual image refresh requested');
  const success = await updateImageCache();
  res.json({ success, message: success ? 'Image refreshed' : 'Failed to refresh image' });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
