const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const SHARED_DIR = '/shared';
const LOG_FILE = path.join(SHARED_DIR, 'output.log');

console.log(`[${new Date().toISOString()}] Reader server starting on port ${PORT}`);

// Endpoint to get log content
app.get('/status', (req, res) => {
    try {
        if (fs.existsSync(LOG_FILE)) {
            const content = fs.readFileSync(LOG_FILE, 'utf-8');
            const lines = content.trim().split('\n').filter(line => line.length > 0);
            const lastLine = lines.length > 0 ? lines[lines.length - 1] : 'No data yet';
            
            res.json({
                timestamp: new Date().toISOString(),
                lastEntry: lastLine,
                totalEntries: lines.length,
                allEntries: lines
            });
        } else {
            res.json({
                timestamp: new Date().toISOString(),
                message: 'Log file not found yet',
                totalEntries: 0
            });
        }
    } catch (error) {
        res.status(500).json({
            error: `Error reading log: ${error.message}`
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Reader server running on port ${PORT}`);
});
