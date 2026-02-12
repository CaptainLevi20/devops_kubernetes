const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const SHARED_DIR = '/shared';
const LOG_FILE = path.join(SHARED_DIR, 'output.log');
const COUNTER_FILE = path.join(SHARED_DIR, 'pingpong-counter.txt');

// Ensure shared directory exists
if (!fs.existsSync(SHARED_DIR)) {
    fs.mkdirSync(SHARED_DIR, { recursive: true });
}

const randomString = uuidv4();

console.log(`[${new Date().toISOString()}] Writer started with UUID: ${randomString}`);

function getPingPongCounter() {
    try {
        if (fs.existsSync(COUNTER_FILE)) {
            const data = fs.readFileSync(COUNTER_FILE, 'utf-8');
            return parseInt(data.trim(), 10) || 0;
        }
    } catch (error) {
        console.error(`Error reading ping-pong counter: ${error.message}`);
    }
    return 0;
}

function writeLog() {
    const timestamp = new Date().toISOString();
    const pingpongCounter = getPingPongCounter();
    const line = `${timestamp}: ${randomString} [ping-pong requests: ${pingpongCounter}]\n`;
    
    try {
        fs.appendFileSync(LOG_FILE, line);
        console.log(`[${timestamp}] Written to log (requests: ${pingpongCounter})`);
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
