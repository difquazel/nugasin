const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'workspaces.json');

// Ensure data directory and database file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ workspaces: {} }, null, 2), 'utf8');
}

// Load database into memory with safe write-back
let db = { workspaces: {} };
try {
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  db = JSON.parse(raw);
  if (!db.workspaces) db.workspaces = {};
} catch (err) {
  console.error('Failed to read DB file, initializing empty DB:', err.message);
  db = { workspaces: {} };
}

let saveTimeout = null;
function persistDb() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err.message);
    }
  }, 80);
}

// Server-Sent Events (SSE) clients for real-time multi-tab / multi-device sync
const sseClients = new Map(); // spaceId -> Set<res>

function broadcastToSpace(spaceId, payload, excludeClientId) {
  const clients = sseClients.get(spaceId);
  if (!clients) return;
  const message = `data: ${JSON.stringify({ ...payload, excludeClientId })}\n\n`;
  for (const client of clients) {
    try {
      client.write(message);
    } catch (e) {
      clients.delete(client);
    }
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

function sanitizeSpaceId(rawId) {
  return String(rawId || 'kampus-utama')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64) || 'kampus-utama';
}

const server = http.createServer((req, res) => {
  // CORS headers so link works from any origin or webview
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Client-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Real-time SSE stream endpoint: /api/stream/:spaceId
  if (pathname.startsWith('/api/stream/') && req.method === 'GET') {
    const spaceId = sanitizeSpaceId(pathname.replace('/api/stream/', ''));
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`data: ${JSON.stringify({ type: 'connected', spaceId, timestamp: Date.now() })}\n\n`);

    if (!sseClients.has(spaceId)) {
      sseClients.set(spaceId, new Set());
    }
    sseClients.get(spaceId).add(res);

    req.on('close', () => {
      const set = sseClients.get(spaceId);
      if (set) {
        set.delete(res);
        if (set.size === 0) sseClients.delete(spaceId);
      }
    });
    return;
  }

  // Workspace Cloud Sync API: /api/workspace/:spaceId
  if (pathname.startsWith('/api/workspace/')) {
    const spaceId = sanitizeSpaceId(pathname.replace('/api/workspace/', ''));

    if (req.method === 'GET') {
      const record = db.workspaces[spaceId] || null;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ok: true,
        spaceId,
        exists: Boolean(record),
        data: record ? record.data : null,
        updatedAt: record ? record.updatedAt : null
      }));
      return;
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 5 * 1024 * 1024) {
          req.destroy();
        }
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          const updatedAt = new Date().toISOString();
          const clientId = req.headers['x-client-id'] || parsed.clientId || '';

          db.workspaces[spaceId] = {
            spaceId,
            updatedAt,
            data: parsed.data || parsed
          };
          persistDb();

          // Broadcast update to any other open tabs/devices on the same workspace link
          broadcastToSpace(spaceId, {
            type: 'sync_update',
            spaceId,
            updatedAt,
            data: db.workspaces[spaceId].data
          }, clientId);

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            ok: true,
            spaceId,
            updatedAt
          }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }));
        }
      });
      return;
    }
  }

  // Health / status check
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok: true,
      status: 'online',
      spacesCount: Object.keys(db.workspaces).length,
      serverTime: new Date().toISOString()
    }));
    return;
  }

  // Static files
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\' || safePath === '') {
    safePath = '/index.html';
  }

  const filePath = path.join(__dirname, safePath);
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      const indexFile = path.join(__dirname, 'index.html');
      fs.readFile(indexFile, (readErr, content) => {
        if (readErr) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Internal Server Error');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n✨ Nugasin Campus Workspace Server aktif!`);
  console.log(`🌐 Buka di browser: http://localhost:${PORT}`);
  console.log(`☁️  Database Cloud Lokal: ${DB_FILE}\n`);
});
