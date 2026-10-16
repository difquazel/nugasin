const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env file if present for local development
const ENV_FILE = path.join(__dirname, '.env');
if (fs.existsSync(ENV_FILE)) {
  try {
    const envLines = fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/);
    for (const line of envLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch (e) {}
}

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Client-Id, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Trusted Server-Side Economy Endpoints (Firebase Admin SDK)
  if (pathname === '/api/complete-task') {
    const completionHandler = require('./api/complete-task');
    return completionHandler(req, res);
  }
  if (pathname === '/api/claim-weekly-reward') {
    const claimHandler = require('./api/claim-weekly-reward');
    return claimHandler(req, res);
  }

  if (pathname === '/api/purchase-theme') {
    const purchaseHandler = require('./api/purchase-theme');
    return purchaseHandler(req, res);
  }

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

  // Firebase public client configuration endpoint
  if (pathname === '/api/firebase-config') {
    const env = process.env || {};
    const apiKey = env.FIREBASE_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY || '';
    const authDomain = env.FIREBASE_AUTH_DOMAIN || env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || env.VITE_FIREBASE_AUTH_DOMAIN || '';
    const projectId = env.FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || '';
    const storageBucket = env.FIREBASE_STORAGE_BUCKET || env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || env.VITE_FIREBASE_STORAGE_BUCKET || '';
    const messagingSenderId = env.FIREBASE_MESSAGING_SENDER_ID || env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
    const appId = env.FIREBASE_APP_ID || env.NEXT_PUBLIC_FIREBASE_APP_ID || env.VITE_FIREBASE_APP_ID || '';
    const configured = Boolean(apiKey && authDomain && projectId && appId);

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      ok: true,
      configured,
      config: configured
        ? { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }
        : null
    }));
    return;
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
  let safePath;
  try { safePath = decodeURIComponent(pathname); }
  catch (error) { res.writeHead(400); res.end('Invalid path'); return; }
  if (safePath === '/' || safePath === '\\' || safePath === '') {
    safePath = '/index.html';
  }

  // Serve only browser assets. In particular, never expose .env, data, or Admin code.
  const relativeAsset = safePath.replace(/^[\/\\]+/, '').replace(/\\/g, '/');
  const isPublicFile = ['index.html', 'client.js', 'styles.css'].includes(relativeAsset);
  const isPublicAsset = /^(assets|public)\/[a-zA-Z0-9_./-]+\.(svg|png|jpe?g|webp|avif|ico|woff2?|css|js)$/.test(relativeAsset)
    && !relativeAsset.split('/').some((part) => part.startsWith('.'));
  if (!isPublicFile && !isPublicAsset) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const filePath = path.resolve(__dirname, relativeAsset);
  if (!filePath.startsWith(__dirname + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('Not found');
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
