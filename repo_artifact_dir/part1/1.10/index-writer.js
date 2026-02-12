const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const SHARED_DIR = '/shared';
const LOG_FILE = path.join(SHARED_DIR, 'output.log');

// Ensure shared directory exists
if (!fs.existsSync(SHARED_DIR)) {
    fs.mkdirSync(SHARED_DIR, { recursive: true });
}

const randomString = uuidv4();

console.log(`[${new Date().toISOString()}] Writer started with UUID: ${randomString}`);

function writeLog() {
    const timestamp = new Date().toISOString();
    const line = `${timestamp}: ${randomString}\n`;
    
    try {
        fs.appendFileSync(LOG_FILE, line);
        console.log(`[${timestamp}] Written to log`);
    } catch (error) {
        console.error(`Error writing to log: ${error.message}`);
    }
}

// Write immediately
writeLog();

// Write every 5 seconds
setInterval(writeLog, 5000);

// Keep process running
process.on('SIGTERM', () => {
    console.log('Writer shutting down');
    process.exit(0);
});
