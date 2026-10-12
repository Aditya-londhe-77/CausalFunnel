'use strict';

/**
 * Set standard CORS headers to allow the React dev server and any origin.
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Send a JSON response with the given status code.
 */
function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

/**
 * Parse the JSON body of an incoming request.
 * Enforces a maximum body size (default 64 KB).
 */
function parseBody(req, maxBytes = 65536) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Request body too large.'));
        req.destroy();
        return;
      }
      data += chunk.toString();
    });

    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON in request body.'));
      }
    });

    req.on('error', reject);
  });
}

module.exports = { setCorsHeaders, sendJson, parseBody };
