const { v4: uuidv4 } = require('uuid');
const express = require('express');

const app = express();
const PORT = 3000;

const randomString = uuidv4(); // Generate a random string on startup

function logRandomString() {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp}: ${randomString}`);
}

// Endpoint to get current status
app.get('/status', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        randomString: randomString
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Log every 5 seconds
setInterval(logRandomString, 5000);

// Log immediately on startup
logRandomString();
