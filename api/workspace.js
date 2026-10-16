const fs = require('fs');
const os = require('os');
const path = require('path');

// On Vercel Serverless, only os.tmpdir() (/tmp) is writable
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'nugasin-data')
  : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'workspaces.json');

// Global in-memory cache across warm serverless invocations
global.__nugasinDbCache = global.__nugasinDbCache || { workspaces: {} };

function loadDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.workspaces) {
        global.__nugasinDbCache.workspaces = {
          ...global.__nugasinDbCache.workspaces,
          ...parsed.workspaces
        };
      }
    }
  } catch (err) {
    // Fallback to in-memory cache if filesystem is restricted
  }
  return global.__nugasinDbCache;
}

function saveDb(db) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    // Keep in global memory cache
  }
}

function sanitizeSpaceId(rawId) {
  return String(rawId || 'kampus-utama')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64) || 'kampus-utama';
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Client-Id');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const db = loadDb();
  const rawSpace = (req.query && req.query.spaceId) || req.url.split('/').pop().split('?')[0];
  const spaceId = sanitizeSpaceId(rawSpace);

  if (req.method === 'GET') {
    const record = db.workspaces[spaceId] || null;
    res.status(200).json({
      ok: true,
      spaceId,
      exists: Boolean(record),
      data: record ? record.data : null,
      updatedAt: record ? record.updatedAt : null,
      provider: 'vercel-serverless'
    });
    return;
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const updatedAt = new Date().toISOString();

      db.workspaces[spaceId] = {
        spaceId,
        updatedAt,
        data: body.data || body
      };
      saveDb(db);

      res.status(200).json({
        ok: true,
        spaceId,
        updatedAt,
        provider: 'vercel-serverless'
      });
    } catch (err) {
      res.status(400).json({ ok: false, error: 'Invalid JSON payload' });
    }
    return;
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
};
