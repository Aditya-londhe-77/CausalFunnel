'use strict';

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const { connect, close } = require('./db');
const { setCorsHeaders, sendJson } = require('./helpers');
const {
  handlePostEvent,
  handleGetSessions,
  handleGetSessionEvents,
  handleGetHeatmap,
  handleHealth,
} = require('./routes/api');

const PORT = parseInt(process.env.PORT || '5000', 10);

// Path to the tracker script that the demo page loads
const TRACKER_PATH = path.join(__dirname, '..', 'client', 'public', 'tracker.js');
const DEMO_PATH = path.join(__dirname, '..', 'client', 'public', 'demo.html');

const server = http.createServer(async (req, res) => {
  const baseUrl = `http://${req.headers.host || 'localhost'}`;
  let parsed;
  try {
    parsed = new URL(req.url, baseUrl);
  } catch {
    setCorsHeaders(res);
    return sendJson(res, 400, { error: 'Invalid request URL.' });
  }

  const pathname = parsed.pathname;
  const method = req.method.toUpperCase();

  // Always set CORS headers
  setCorsHeaders(res);

  // Handle preflight
  if (method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Serve demo.html
  if (method === 'GET' && pathname === '/demo.html') {
    try {
      const content = fs.readFileSync(DEMO_PATH, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(content),
      });
      return res.end(content);
    } catch (err) {
      console.error('[server] Could not read demo.html:', err.message);
      return sendJson(res, 500, { error: 'demo.html not found.' });
    }
  }

  // Serve tracker.js
  if (method === 'GET' && pathname === '/tracker.js') {
    try {
      const content = fs.readFileSync(TRACKER_PATH, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache',
        'Content-Length': Buffer.byteLength(content),
      });
      return res.end(content);
    } catch (err) {
      console.error('[server] Could not read tracker.js:', err.message);
      return sendJson(res, 500, { error: 'tracker.js not found.' });
    }
  }

  // API routing
  try {
    // POST /api/events
    if (method === 'POST' && pathname === '/api/events') {
      return await handlePostEvent(req, res);
    }

    // GET /api/sessions
    if (method === 'GET' && pathname === '/api/sessions') {
      return await handleGetSessions(req, res);
    }

    // GET /api/sessions/:sessionId/events
    const sessionEventsMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/events$/);
    if (method === 'GET' && sessionEventsMatch) {
      const sessionId = decodeURIComponent(sessionEventsMatch[1]);
      return await handleGetSessionEvents(req, res, sessionId);
    }

    // GET /api/heatmap
    if (method === 'GET' && pathname === '/api/heatmap') {
      return await handleGetHeatmap(req, res, parsed.searchParams);
    }

    // GET /api/health
    if (method === 'GET' && pathname === '/api/health') {
      return handleHealth(req, res);
    }

    // 404 fallback
    return sendJson(res, 404, { error: `Cannot ${method} ${pathname}` });
  } catch (err) {
    console.error('[server] Unhandled error:', err.message);
    return sendJson(res, 500, { error: 'Internal server error.' });
  }
});

async function start() {
  try {
    await connect();
  } catch (err) {
    console.error('[server] Failed to connect to MongoDB:', err.message);
    console.error('  Make sure MongoDB is running and MONGODB_URI is set in .env');
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`[server] Listening on http://localhost:${PORT}`);
    console.log(`[server] Tracker script available at http://localhost:${PORT}/tracker.js`);
  });
}

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n[server] Received ${signal}, shutting down...`);
  server.close(async () => {
    await close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
