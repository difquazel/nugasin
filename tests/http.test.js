'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { parseJsonBody, MAX_BODY_BYTES, sendError } = require('../lib/http');
const { verifyBearerToken } = require('../api/_firebase-admin');
const { FakeFirestore } = require('./helpers/fake-firestore');
const { economyError } = require('../lib/economy');

const endpointNames = ['complete-task', 'claim-weekly-reward', 'purchase-theme'];

function response() {
  return {
    headers: {}, statusCode: 200, raw: undefined,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(value = '') { this.raw = value; },
    json() { return this.raw ? JSON.parse(this.raw) : null; }
  };
}

// Keep real transport and service code, replacing only Firebase token/database
// access. No test needs Admin credentials or contacts a production project.
function handlerWithDatabase(name, db, authError) {
  const adminPath = require.resolve('../api/_firebase-admin');
  const handlerPath = require.resolve(`../api/${name}`);
  const savedAdmin = require.cache[adminPath];
  const savedHandler = require.cache[handlerPath];
  require.cache[adminPath] = {
    id: adminPath, filename: adminPath, loaded: true,
    exports: {
      verifyBearerToken: async () => {
        if (authError) throw authError;
        return { uid: 'verified-user' };
      },
      getAdminFirestore: () => db
    }
  };
  delete require.cache[handlerPath];
  try { return require(handlerPath); }
  finally {
    if (savedAdmin) require.cache[adminPath] = savedAdmin;
    else delete require.cache[adminPath];
    if (savedHandler) require.cache[handlerPath] = savedHandler;
    else delete require.cache[handlerPath];
  }
}

test('all economy endpoints require POST and return no-store responses', async () => {
  for (const name of endpointNames) {
    const handler = require(`../api/${name}`);
    const res = response();
    await handler({ method: 'GET', headers: {} }, res);
    assert.equal(res.statusCode, 405, name);
    assert.equal(res.headers['cache-control'], 'no-store');
    assert.equal(res.headers['allow'], 'POST, OPTIONS');
    assert.equal(res.json().code, 'METHOD_NOT_ALLOWED');
    const options = response();
    await handler({ method: 'OPTIONS', headers: {} }, options);
    assert.equal(options.statusCode, 204);
  }
});

test('missing or malformed bearer tokens are rejected before loading Firebase credentials', async () => {
  for (const authorization of [undefined, '', 'Basic abc', 'Bearer ', ['Bearer abc'], 'Bearer token another', `Bearer ${'x'.repeat(8193)}`]) {
    await assert.rejects(verifyBearerToken({ headers: { authorization } }), error => error.statusCode === 401 && error.code === 'UNAUTHORIZED');
  }
  for (const name of endpointNames) {
    const res = response();
    await require(`../api/${name}`)({ method: 'POST', headers: {}, body: {} }, res);
    assert.equal(res.statusCode, 401, name);
    assert.equal(res.json().code, 'UNAUTHORIZED');
  }
});

test('JSON parsing validates type, encoding, media type and request size', async () => {
  assert.deepEqual(await parseJsonBody({ headers: {}, body: '{"taskId":"a"}' }), { taskId: 'a' });
  assert.deepEqual(await parseJsonBody({ headers: { 'content-type': 'application/json; charset=utf-8' }, body: Buffer.from('{"themeId":"nature"}') }), { themeId: 'nature' });
  assert.deepEqual(await parseJsonBody({ headers: {}, body: '' }), {});
  for (const body of ['{', '[]', 'null', '"text"', '123', []]) {
    await assert.rejects(parseJsonBody({ headers: {}, body }), error => error.statusCode === 400 && error.code === 'INVALID_JSON');
  }
  await assert.rejects(parseJsonBody({ headers: { 'content-type': 'text/plain' }, body: '{}' }), error => error.statusCode === 415);
  await assert.rejects(parseJsonBody({ headers: {}, body: { text: 'x'.repeat(MAX_BODY_BYTES) } }), error => error.statusCode === 413);
  const stream = Readable.from([Buffer.from('{"taskId":'), Buffer.from('"streamed"}')]);
  stream.headers = {};
  assert.deepEqual(await parseJsonBody(stream), { taskId: 'streamed' });
  const largeStream = Readable.from([Buffer.alloc(MAX_BODY_BYTES + 1, 'a')]);
  largeStream.headers = {};
  await assert.rejects(parseJsonBody(largeStream), error => error.statusCode === 413);
});

test('authorized malformed endpoint requests return safe 400/413/415 errors without writes', async () => {
  for (const name of endpointNames) {
    const db = new FakeFirestore();
    const handler = handlerWithDatabase(name, db);
    for (const [body, headers, expected] of [
      ['{broken', {}, 400],
      [[], {}, 400],
      [{ text: 'x'.repeat(MAX_BODY_BYTES) }, {}, 413],
      [{}, { 'content-type': 'text/html' }, 415]
    ]) {
      const res = response();
      await handler({ method: 'POST', headers, body }, res);
      assert.equal(res.statusCode, expected, name);
      assert.equal(res.json().ok, false);
      assert.equal(db.documents.size, 0);
    }
  }
});

test('endpoint operations use only the verified token identity and ignore forged XP or user IDs', async () => {
  const db = new FakeFirestore({
    'users/verified-user/economy/wallet': { xpBalance: 3000, lifetimeXpEarned: 3000, purchasedThemes: ['default'] },
    'users/victim/economy/wallet': { xpBalance: 9000, lifetimeXpEarned: 9000, purchasedThemes: ['default', 'christmas'] },
    'users/verified-user/tasks/real-task': { id: 'real-task', title: 'Legitimate task', status: 'completed' }
  });
  const purchase = response();
  await handlerWithDatabase('purchase-theme', db)({ method: 'POST', headers: {}, body: {
    themeId: 'nature', uid: 'victim', userId: 'victim', costXp: 0, xpBalance: 999999, purchasedThemes: ['christmas']
  } }, purchase);
  assert.equal(purchase.statusCode, 200);
  assert.equal(purchase.json().xpBalance, 0);
  assert.equal(purchase.json().costXp, 3000);
  assert.deepEqual(db.read('users/victim/economy/wallet'), { xpBalance: 9000, lifetimeXpEarned: 9000, purchasedThemes: ['default', 'christmas'] });
  const complete = response();
  await handlerWithDatabase('complete-task', db)({ method: 'POST', headers: {}, body: { taskId: 'real-task', uid: 'victim', completedCount: 5 } }, complete);
  assert.equal(complete.statusCode, 200);
  assert.equal(complete.json().completedCount, 1);
  assert.ok(db.read('users/verified-user/taskCompletions/real-task'));
  assert.equal(db.read('users/victim/taskCompletions/real-task'), undefined);
});

test('authentication failures and unexpected backend errors never expose credentials', async () => {
  const db = new FakeFirestore();
  for (const name of endpointNames) {
    const res = response();
    await handlerWithDatabase(name, db, economyError(401, 'UNAUTHORIZED', 'Session invalid'))({ method: 'POST', headers: {}, body: {} }, res);
    assert.equal(res.statusCode, 401);
  }
  const res = response();
  sendError(res, new Error('private_key=secret-private-key; service-account@example.test'));
  assert.equal(res.statusCode, 500);
  assert.equal(res.json().code, 'SERVER_ERROR');
  assert.doesNotMatch(res.raw, /private_key|secret-private-key|service-account/);
});
