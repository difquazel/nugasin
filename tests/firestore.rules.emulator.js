'use strict';

// Optional integration suite against a locally running Firestore emulator.
// No SDK/test dependency or production credentials are needed.
// Run via: firebase emulators:exec --only firestore --project demo-nugasin "npm run test:rules"
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

const host = process.env.FIRESTORE_EMULATOR_HOST;
const project = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'demo-nugasin';
const uid = `rules-${randomUUID()}`;
const base = `users/${uid}`;

function jwt(user) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
    aud: project, iss: `https://securetoken.google.com/${project}`, sub: user,
    user_id: user, iat: now, exp: now + 3600, auth_time: now,
    firebase: { sign_in_provider: 'google.com', identities: {} }
  })}.`;
}

function value(data) {
  if (data === null) return { nullValue: null };
  if (typeof data === 'string') return { stringValue: data };
  if (typeof data === 'boolean') return { booleanValue: data };
  if (typeof data === 'number') return Number.isInteger(data) ? { integerValue: String(data) } : { doubleValue: data };
  if (Array.isArray(data)) return { arrayValue: { values: data.map(value) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(data).map(([key, entry]) => [key, value(entry)])) } };
}

async function request(method, document, user, data) {
  const headers = { 'content-type': 'application/json' };
  if (user) headers.authorization = `Bearer ${user === 'admin' ? 'owner' : jwt(user)}`;
  const url = `http://${host}/v1/projects/${project}/databases/(default)/documents/${document}`;
  const res = await fetch(url, { method, headers, body: data === undefined ? undefined : JSON.stringify({ fields: value(data).mapValue.fields }), signal: AbortSignal.timeout(10000) });
  return { status: res.status, text: await res.text() };
}
async function allowed(method, document, user, data) {
  const result = await request(method, document, user, data);
  assert.ok(result.status >= 200 && result.status < 300, `${method} ${document} expected allow; got ${result.status}: ${result.text}`);
}
async function denied(method, document, user, data) {
  const result = await request(method, document, user, data);
  assert.equal(result.status, 403, `${method} ${document} expected deny; got ${result.status}: ${result.text}`);
}

const now = new Date().toISOString();
const task = id => ({
  id, title: 'Valid rule-tested task', course: '', category: 'assignment', dueDate: '2026-10-16', dueTime: '',
  priority: 'medium', status: 'pending', description: '', link: '', subtasks: [],
  createdAt: now, updatedAt: now, updatedAtMs: Date.now(), lastModifiedBy: 'rules-test'
});
const preferences = {
  profile: { onboarded: true, name: 'Student', major: '', campus: '', avatarUrl: '', focusMinutesToday: 0, streakDays: 0, themeVibe: 'default', activeTheme: 'default', colorMode: 'dark', animationsEnabled: false },
  courses: [], updatedAt: now, updatedAtMs: Date.now(), lastModifiedBy: 'rules-test'
};

test('Firestore security rules enforce ownership, trusted economy, immutable receipts, and normal editing', {
  skip: !host ? 'FIRESTORE_EMULATOR_HOST is unset; start the Firestore emulator to verify rules.' : false
}, async t => {
  // All paths are isolated by a unique test UID, with Admin bypass used only for fixtures.
  const privileged = ['economy/wallet', 'weeks/2026-10-12', 'taskCompletions/counted', 'rewards/2026-10-12', 'purchases/theme_nature', 'xpTransactions/weekly_2026-10-12'];
  for (const relative of privileged) await allowed('PATCH', `${base}/${relative}`, 'admin', { xpBalance: 500, purchasedThemes: ['default', 'nature'] });

  await t.test('only the owner can read server-managed data, nobody can write it through client rules', async () => {
    for (const relative of privileged) {
      const document = `${base}/${relative}`;
      await allowed('GET', document, uid);
      await denied('GET', document, 'other-user');
      await denied('GET', document, null);
      await denied('PATCH', document, uid, { xpBalance: 999999, purchasedThemes: ['christmas'] });
      await denied('DELETE', document, uid);
      await denied('PATCH', `${document}-forged`, uid, { xpBalance: 999999 });
    }
  });

  await t.test('task editing and deletion work while reward metadata and stable IDs cannot be forged', async () => {
    const path = `${base}/tasks/editable`;
    await allowed('PATCH', path, uid, task('editable'));
    await allowed('PATCH', path, uid, { ...task('editable'), status: 'completed' });
    await denied('PATCH', path, 'other-user', task('editable'));
    await denied('PATCH', path, uid, { ...task('editable'), id: 'different-id' });
    await denied('PATCH', path, uid, { ...task('editable'), xpRewarded: true });
    await allowed('DELETE', path, uid);
    await denied('PATCH', `${base}/tasks/spoofed`, uid, { ...task('spoofed'), rewardedWeekKey: '2026-10-12' });
    const legacy = { ...task('legacy'), status: 'completed', xpRewarded: true, rewardedWeekKey: '2026-W41', rewardClaimedAtMs: Date.now() };
    await allowed('PATCH', `${base}/tasks/legacy`, 'admin', legacy);
    await allowed('PATCH', `${base}/tasks/legacy`, uid, { ...legacy, status: 'pending' });
    await denied('DELETE', `${base}/tasks/legacy`, uid);
    await allowed('PATCH', `${base}/taskCompletions/legacy`, 'admin', { taskId: 'legacy', weekKey: '2026-W41' });
    await allowed('DELETE', `${base}/tasks/legacy`, uid);
    await denied('DELETE', `${base}/taskCompletions/legacy`, uid);
  });

  await t.test('appearance sync and owned themes work, unowned themes and hidden economy fields fail', async () => {
    const path = `${base}/settings/preferences`;
    await allowed('PATCH', path, uid, preferences);
    await allowed('PATCH', path, uid, { ...preferences, profile: { ...preferences.profile, activeTheme: 'nature', colorMode: 'system' } });
    await denied('PATCH', path, uid, { ...preferences, profile: { ...preferences.profile, activeTheme: 'christmas' } });
    await denied('PATCH', path, uid, { ...preferences, xpBalance: 999999 });
    await denied('PATCH', path, uid, { ...preferences, profile: { ...preferences.profile, xpBalance: 999999 } });
    await denied('GET', path, 'other-user');
  });
});
