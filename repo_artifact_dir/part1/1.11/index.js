const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const SHARED_DIR = '/shared';
const COUNTER_FILE = path.join(SHARED_DIR, 'pingpong-counter.txt');

// Ensure shared directory exists
if (!fs.existsSync(SHARED_DIR)) {
    fs.mkdirSync(SHARED_DIR, { recursive: true });
}

let counter = 0;

// Initialize counter from file if it exists
if (fs.existsSync(COUNTER_FILE)) {
    try {
        const data = fs.readFileSync(COUNTER_FILE, 'utf-8');
        counter = parseInt(data.trim(), 10) || 0;
        console.log(`[${new Date().toISOString()}] Counter initialized from file: ${counter}`);
    } catch (error) {
        console.error(`Error reading counter file: ${error.message}`);
    }
}

// Endpoint for ping-pong
app.get('/pingpong', (req, res) => {
    const response = `pong ${counter}`;
    console.log(`[${new Date().toISOString()}] ${response}`);
    res.send(response);
    
    // Increment and save to file
    counter++;
    try {
        fs.writeFileSync(COUNTER_FILE, counter.toString());
    } catch (error) {
        console.error(`Error writing counter to file: ${error.message}`);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Ping-Pong server running on port ${PORT}`);
});
