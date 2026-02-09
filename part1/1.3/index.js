const { v4: uuidv4 } = require('uuid');

const randomString = uuidv4(); // Generate a random string on startup

function logRandomString() {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp}: ${randomString}`);
}

// Log every 5 seconds
setInterval(logRandomString, 5000);

// Log immediately on startup
logRandomString();
