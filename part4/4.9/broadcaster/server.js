const { connect, StringCodec } = require('nats');
const axios = require('axios');
const express = require('express');

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3000', 10);
const NATS_URL = process.env.NATS_URL || 'nats://nats:4222';
const NATS_SUBJECT = process.env.NATS_SUBJECT || 'todos.events';
const QUEUE_GROUP = process.env.NATS_QUEUE_GROUP || 'broadcasters';
const EXTERNAL_URL = process.env.EXTERNAL_URL; // optional: forwarding target
const SKIP_FORWARD = (process.env.SKIP_FORWARD || '').toLowerCase() === 'true';

if (!EXTERNAL_URL && !SKIP_FORWARD) {
  console.error('Missing EXTERNAL_URL environment variable and not in SKIP_FORWARD mode');
  // We still start but readiness will fail unless SKIP_FORWARD is true
}

let nc = null;
const sc = StringCodec();

app.get('/healthz', (req, res) => res.sendStatus(200));
app.get('/ready', (req, res) => {
  if (!nc) return res.status(503).json({ ready: false, reason: 'nats-not-connected' });
  if (!SKIP_FORWARD && !EXTERNAL_URL) return res.status(503).json({ ready: false, reason: 'external-url-missing' });
  return res.json({ ready: true, skipForward: SKIP_FORWARD });
});

async function start() {
  try {
    nc = await connect({ servers: NATS_URL });
    console.log('Connected to NATS:', NATS_URL);
  } catch (err) {
    console.error('Failed to connect to NATS:', err.message || err);
    nc = null;
  }

  if (!nc) {
    // Periodically try to reconnect in background
    setTimeout(() => start(), 5000);
    return;
  }

  // subscribe with a queue group so only one replica forwards each message
  (async () => {
    const sub = nc.subscribe(NATS_SUBJECT, { queue: QUEUE_GROUP });
    console.log(`Subscribed to ${NATS_SUBJECT} (queue=${QUEUE_GROUP})`);
    for await (const m of sub) {
      try {
        const str = sc.decode(m.data);
        const obj = JSON.parse(str);
        console.log('Received event:', obj);

        // Format message for external service (Generic)
        const messageText = obj && obj.event ? `${obj.event.toUpperCase()}: todo id=${obj.id} text=${obj.text} done=${obj.done}` : `todo changed: ${str}`;
        const payload = { user: 'bot', message: messageText };

        // Best-effort forward to external service unless running in SKIP_FORWARD mode
        if (SKIP_FORWARD) {
          console.log('SKIP_FORWARD enabled — not forwarding, only logging');
        } else if (!EXTERNAL_URL) {
          console.warn('No EXTERNAL_URL configured — skipping forward');
        } else {
          try {
            await axios.post(EXTERNAL_URL, payload, { timeout: 5000 });
            console.log('Forwarded to external service');
          } catch (err) {
            console.warn('Failed to forward to external service:', err && err.message ? err.message : err);
          }
        }
      } catch (err) {
        console.error('Error handling message:', err && err.message ? err.message : err);
      }
    }
  })().catch(err => console.error('Subscription error:', err));
}

start();

app.listen(PORT, () => {
  console.log(`broadcaster listening on ${PORT}`);
});

process.on('SIGINT', async () => { if (nc) await nc.close(); process.exit(0); });
process.on('SIGTERM', async () => { if (nc) await nc.close(); process.exit(0); });
