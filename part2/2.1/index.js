const express = require('express');
const app = express();
const PORT = 3000;

let counter = 0;

console.log(`[${new Date().toISOString()}] Ping-Pong server starting on port ${PORT}`);

// Endpoint for ping-pong (increments counter)
app.get('/pingpong', (req, res) => {
    const response = `pong ${counter}`;
    console.log(`[${new Date().toISOString()}] ${response}`);
    res.send(response);
    counter++;
});

// Endpoint to return current counter without incrementing
app.get('/count', (req, res) => {
    res.json({ count: counter });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Ping-Pong server running on port ${PORT}`);
});
