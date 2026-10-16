'use strict';

const { economyError } = require('./economy');
const MAX_BODY_BYTES = 64 * 1024;

function validatedBody(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw economyError(400, 'INVALID_JSON', 'Isi permintaan harus berupa objek JSON.');
  }
  return value;
}

async function parseJsonBody(req) {
  const contentType = req.headers && (req.headers['content-type'] || req.headers['Content-Type']);
  if (contentType && !/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
    throw economyError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Gunakan Content-Type application/json.');
  }
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      if (Buffer.byteLength(JSON.stringify(req.body), 'utf8') > MAX_BODY_BYTES) {
        throw economyError(413, 'PAYLOAD_TOO_LARGE', 'Isi permintaan terlalu besar.');
      }
      return validatedBody(req.body);
    }
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
    return parseRawBody(raw);
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let rejected = false;
    req.on('data', (chunk) => {
      if (rejected) return;
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) {
        rejected = true;
        reject(economyError(413, 'PAYLOAD_TOO_LARGE', 'Isi permintaan terlalu besar.'));
        return;
      }
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => {
      if (rejected) return;
      try { resolve(parseRawBody(Buffer.concat(chunks).toString('utf8'))); } catch (error) { reject(error); }
    });
    req.on('error', () => reject(economyError(400, 'INVALID_REQUEST', 'Permintaan tidak dapat dibaca.')));
    req.on('aborted', () => reject(economyError(400, 'INVALID_REQUEST', 'Permintaan terputus.')));
  });
}

function parseRawBody(raw) {
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    throw economyError(413, 'PAYLOAD_TOO_LARGE', 'Isi permintaan terlalu besar.');
  }
  let parsed;
  try { parsed = raw.trim() ? JSON.parse(raw) : {}; } catch (_) {
    throw economyError(400, 'INVALID_JSON', 'Isi permintaan bukan JSON yang valid.');
  }
  return validatedBody(parsed);
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  return res.end(JSON.stringify(data));
}

function preparePost(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.statusCode = 204;
    res.end();
    return false;
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    sendJson(res, 405, { ok: false, code: 'METHOD_NOT_ALLOWED', error: 'Method Not Allowed' });
    return false;
  }
  return true;
}

function sendError(res, error) {
  const safe = error && error.isPublic === true && Number.isInteger(error.statusCode) && error.statusCode >= 400
    && error.statusCode <= 599 && /^[A-Z_]+$/.test(error.code || '');
  const payload = {
    ok: false,
    code: safe ? error.code : 'SERVER_ERROR',
    error: safe ? error.message : 'Layanan XP belum dapat memproses permintaan. Silakan coba lagi nanti.'
  };
  if (safe) {
    for (const key of ['currentBalance', 'requiredXp']) {
      if (Number.isSafeInteger(error[key]) && error[key] >= 0) payload[key] = error[key];
    }
  }
  return sendJson(res, safe ? error.statusCode : 500, payload);
}

module.exports = { MAX_BODY_BYTES, parseJsonBody, preparePost, sendJson, sendError };
