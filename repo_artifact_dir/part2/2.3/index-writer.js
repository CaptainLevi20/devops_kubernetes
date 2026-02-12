const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const http = require('http');

const SHARED_DIR = process.env.SHARED_DIR || '/shared';
const LOG_FILE = path.join(SHARED_DIR, 'output.log');

// Ensure shared directory exists
if (!fs.existsSync(SHARED_DIR)) {
    fs.mkdirSync(SHARED_DIR, { recursive: true });
}

const randomString = uuidv4();

console.log(`[${new Date().toISOString()}] Writer started with UUID: ${randomString}`);

function getPingPongCounter() {
    const host = process.env.PINGPONG_HOST || 'ping-pong';
    const port = parseInt(process.env.PINGPONG_PORT || '80', 10);

    return new Promise((resolve) => {
        const options = {
            hostname: host,
            port: port,
            path: '/count',
            method: 'GET',
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const obj = JSON.parse(data);
                    resolve(parseInt(obj.count, 10) || 0);
                } catch (e) {
                    // fallback: try to parse digits from text
                    const m = data.match(/(\d+)/);
                    resolve(m ? parseInt(m[1], 10) : 0);
                }
            });
        });

        req.on('error', (err) => {
            console.error(`Error fetching ping-pong counter: ${err.message}`);
            resolve(0);
        });
        req.on('timeout', () => {
            req.destroy();
            resolve(0);
        });
        req.end();
    });
}

async function writeLog() {
    const timestamp = new Date().toISOString();
    const pingpongCounter = await getPingPongCounter();
    const line = `${timestamp}: ${randomString}.\nPing / Pongs: ${pingpongCounter}\n`;

    try {
        fs.appendFileSync(LOG_FILE, line);
        console.log(`[${timestamp}] Written to log (requests: ${pingpongCounter})`);
    } catch (error) {
        console.error(`Error writing to log: ${error.message}`);
    }
}

// Write immediately and every 5 seconds
writeLog();
setInterval(() => { writeLog().catch(() => {}); }, 5000);

// Keep process running
process.on('SIGTERM', () => {
    console.log('Writer shutting down');
    process.exit(0);
});
