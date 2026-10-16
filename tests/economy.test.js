'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getJakartaWeekInfo, completeTask, claimWeeklyReward, purchaseTheme,
  WEEKLY_REWARD_XP, REQUIRED_VALID_TASKS, THEME_PRICE_XP, PURCHASABLE_THEMES
} = require('../lib/economy');
const { FakeFirestore } = require('./helpers/fake-firestore');

const UID = 'student-a';
const NOW = Date.parse('2026-10-16T06:30:00.000Z');
const NEXT_WEEK = Date.parse('2026-10-18T17:00:00.000Z');
const base = `users/${UID}`;
const walletPath = `${base}/economy/wallet`;
const weekPath = now => `${base}/weeks/${getJakartaWeekInfo(now).weekKey}`;
const taskPath = id => `${base}/tasks/${id}`;
const receiptPath = id => `${base}/taskCompletions/${id}`;

function seedTask(db, id, changes = {}) {
  db.seed(taskPath(id), { id, title: `Valid task ${id}`, status: 'completed', completedAtMs: NOW, ...changes });
}
function seedWallet(db, xpBalance, changes = {}) {
  db.seed(walletPath, { xpBalance, lifetimeXpEarned: xpBalance, totalXpSpent: 0, purchasedThemes: ['default'], ...changes });
}
async function completeMany(db, count, prefix = 'task', now = NOW) {
  const results = [];
  for (let i = 0; i < count; i++) {
    const id = `${prefix}-${i}`;
    seedTask(db, id);
    results.push(await completeTask(db, UID, id, now));
  }
  return results;
}
const errorCode = (code, statusCode) => error => error.code === code && error.statusCode === statusCode;

test('Asia/Jakarta week changes exactly at Monday 00:00, with stable year rollover', () => {
  const before = getJakartaWeekInfo(Date.parse('2026-10-18T16:59:59.999Z'));
  const after = getJakartaWeekInfo(NEXT_WEEK);
  assert.equal(before.weekKey, '2026-10-12');
  assert.equal(before.weekEndMs, NEXT_WEEK - 1);
  assert.equal(after.weekKey, '2026-10-19');
  assert.equal(after.weekStartMs, NEXT_WEEK);
  assert.equal(after.timezone, 'Asia/Jakarta');
  assert.equal(after.weekEndMs - after.weekStartMs + 1, 7 * 86400000);
  const newYear = getJakartaWeekInfo(Date.parse('2021-01-01T00:00:00+07:00'));
  assert.equal(newYear.weekKey, '2020-12-28');
  assert.equal(newYear.legacyWeekKey, '2020-W53');
  assert.equal(getJakartaWeekInfo(Date.parse('2021-01-04T00:00:00+07:00')).legacyWeekKey, '2021-W01');
  assert.equal(getJakartaWeekInfo(Date.parse('2025-01-01T12:00:00+07:00')).weekKey, '2024-12-30');
  assert.equal(getJakartaWeekInfo(Date.parse('2025-01-01T12:00:00+07:00')).legacyWeekKey, '2025-W01');
  assert.throws(() => getJakartaWeekInfo(NaN), /Invalid server time/);
});

test('five valid completions award exactly +500 XP once; sixth, seventh, and claim retries award zero', async () => {
  assert.equal(WEEKLY_REWARD_XP, 500);
  assert.equal(REQUIRED_VALID_TASKS, 5);
  const db = new FakeFirestore();
  const results = await completeMany(db, 7);
  assert.deepEqual(results.map(result => result.xpAwarded), [0, 0, 0, 0, 500, 0, 0]);
  assert.deepEqual(results.map(result => result.completedCount), [1, 2, 3, 4, 5, 6, 7]);
  for (let i = 0; i < 3; i++) {
    const result = await claimWeeklyReward(db, UID, NOW);
    assert.equal(result.xpAwarded, 0);
    assert.equal(result.completedCount, 7);
    assert.equal(result.rewarded, true);
  }
  assert.equal(db.read(walletPath).xpBalance, 500);
  assert.equal(db.read(walletPath).lifetimeXpEarned, 500);
  assert.equal(db.read(walletPath).walletVersion, 1);
  assert.equal(db.list(`${base}/rewards`).length, 1);
  assert.equal(db.list(`${base}/xpTransactions`).length, 1);
  assert.equal(db.list(`${base}/taskCompletions`).length, 7);
});

test('editable completion timestamps do not determine reward week or create progress on their own', async () => {
  const db = new FakeFirestore();
  for (let i = 0; i < 5; i++) seedTask(db, `forged-${i}`, { completedAtMs: NEXT_WEEK + 999999 });
  const untouched = await claimWeeklyReward(db, UID, NOW);
  assert.equal(untouched.completedCount, 0);
  assert.equal(untouched.xpBalance, 0);
  const result = await completeTask(db, UID, 'forged-0', NOW);
  assert.equal(result.completedCount, 1);
  assert.equal(db.read(receiptPath('forged-0')).completedAtMs, NOW);
  assert.equal(db.read(taskPath('forged-0')).completedAtMs, NOW);
  assert.equal(db.read(receiptPath('forged-0')).weekKey, getJakartaWeekInfo(NOW).weekKey);
});

test('completion receipts survive toggling, task deletion/recreation, refresh, and later weeks', async () => {
  const db = new FakeFirestore();
  await completeMany(db, 5);
  const original = db.read(receiptPath('task-0'));
  seedTask(db, 'task-0', { status: 'pending' });
  assert.equal((await completeTask(db, UID, 'task-0', NOW)).alreadyRecorded, true);
  await db.doc(taskPath('task-0')).delete();
  assert.equal((await completeTask(db, UID, 'task-0', NOW)).alreadyRecorded, true);
  seedTask(db, 'task-0');
  const replay = await completeTask(db, UID, 'task-0', NEXT_WEEK);
  assert.equal(replay.alreadyRecorded, true);
  assert.equal(replay.completedCount, 0);
  assert.equal(replay.xpAwarded, 0);
  assert.deepEqual(db.read(receiptPath('task-0')), original);
  assert.equal((await claimWeeklyReward(db, UID, NEXT_WEEK)).completedCount, 0);
  const next = await completeMany(db, 5, 'new', NEXT_WEEK);
  assert.equal(next.at(-1).xpAwarded, 500);
  assert.equal(db.read(walletPath).xpBalance, 1000);
  assert.equal(db.read(weekPath(NOW)).completedCount, 5);
  assert.equal(db.read(weekPath(NEXT_WEEK)).completedCount, 5);
});

test('simultaneous devices completing the same task only create one permanent receipt', async () => {
  const db = new FakeFirestore();
  seedTask(db, 'same-task');
  const results = await Promise.all(Array.from({ length: 8 }, () => completeTask(db, UID, 'same-task', NOW)));
  assert.equal(results.filter(result => !result.alreadyRecorded).length, 1);
  assert.equal(db.read(weekPath(NOW)).completedCount, 1);
  assert.equal(db.list(`${base}/taskCompletions`).length, 1);
  assert.ok(db.retryCount > 0, 'optimistic conflicts must actually exercise a retry');
});

test('concurrent fifth completions and claim calls cannot duplicate the weekly reward', async () => {
  const db = new FakeFirestore();
  await completeMany(db, 4);
  for (let i = 0; i < 4; i++) seedTask(db, `concurrent-${i}`);
  const results = await Promise.all([
    ...Array.from({ length: 4 }, (_, i) => completeTask(db, UID, `concurrent-${i}`, NOW)),
    claimWeeklyReward(db, UID, NOW), claimWeeklyReward(db, UID, NOW)
  ]);
  assert.equal(results.reduce((sum, result) => sum + result.xpAwarded, 0), 500);
  assert.equal(db.read(walletPath).xpBalance, 500);
  assert.equal(db.read(weekPath(NOW)).completedCount, 8);
  assert.equal(db.list(`${base}/xpTransactions`).length, 1);
  assert.ok(db.retryCount > 0);
});

test('transaction callback retry never commits discarded reward or purchase writes', async () => {
  const db = new FakeFirestore();
  await completeMany(db, 4);
  seedTask(db, 'fifth');
  db.forceRetries = 2;
  assert.equal((await completeTask(db, UID, 'fifth', NOW)).xpAwarded, 500);
  seedWallet(db, 3500, { lifetimeXpEarned: 5000, totalXpSpent: 1500 });
  db.forceRetries = 2;
  const purchase = await purchaseTheme(db, UID, 'christmas', NOW);
  assert.equal(purchase.xpBalance, 500);
  assert.equal(db.read(walletPath).totalXpSpent, 4500);
  assert.equal(db.list(`${base}/purchases`).length, 1);
  assert.equal(db.list(`${base}/xpTransactions`).length, 2);
  assert.equal(db.retryCount, 4);
});

test('each premium theme costs exactly 3000 XP; owned themes stay unlocked on repeated requests', async () => {
  assert.equal(THEME_PRICE_XP, 3000);
  assert.deepEqual(Object.keys(PURCHASABLE_THEMES).sort(), ['antarctica', 'christmas', 'nature']);
  for (const id of Object.keys(PURCHASABLE_THEMES)) {
    const db = new FakeFirestore();
    seedWallet(db, 3500);
    const preference = { profile: { name: 'A', colorMode: 'dark', animationsEnabled: false, themeVibe: 'candy' }, courses: ['English'] };
    db.seed(`${base}/settings/preferences`, preference);
    const first = await purchaseTheme(db, UID, id, NOW);
    assert.equal(first.costXp, 3000);
    assert.equal(first.xpBalance, 500);
    assert.equal(first.lifetimeXpEarned, 3500);
    assert.equal(first.totalXpSpent, 3000);
    assert.ok(first.purchasedThemes.includes(id));
    const repeat = await purchaseTheme(db, UID, id, NEXT_WEEK);
    assert.equal(repeat.costXp, 0);
    assert.equal(repeat.alreadyOwned, true);
    assert.equal(repeat.xpBalance, 500);
    assert.equal(repeat.walletVersion, first.walletVersion);
    assert.equal(repeat.walletVersion, 1);
    assert.equal(db.list(`${base}/purchases`).length, 1);
    assert.equal(db.list(`${base}/xpTransactions`).length, 1);
    assert.deepEqual(db.read(`${base}/settings/preferences`).profile, { ...preference.profile, activeTheme: id });
    assert.deepEqual(db.read(`${base}/settings/preferences`).courses, preference.courses);
  }
});

test('exact 3000 XP reaches zero; insufficient balances never create purchase records', async () => {
  const exact = new FakeFirestore();
  seedWallet(exact, 3000);
  assert.equal((await purchaseTheme(exact, UID, 'nature', NOW)).xpBalance, 0);
  for (const balance of [0, 1, 2999]) {
    const db = new FakeFirestore();
    seedWallet(db, balance);
    await assert.rejects(purchaseTheme(db, UID, 'nature', NOW), errorCode('INSUFFICIENT_XP_BALANCE', 400));
    assert.equal(db.read(walletPath).xpBalance, balance);
    assert.equal(db.list(`${base}/purchases`).length, 0);
    assert.equal(db.list(`${base}/xpTransactions`).length, 0);
  }
});

test('simultaneous duplicate purchases charge once; different purchases cannot overdraw', async () => {
  const duplicate = new FakeFirestore();
  seedWallet(duplicate, 3500);
  const results = await Promise.all(Array.from({ length: 5 }, () => purchaseTheme(duplicate, UID, 'antarctica', NOW)));
  assert.equal(results.reduce((sum, result) => sum + result.costXp, 0), 3000);
  assert.equal(duplicate.read(walletPath).xpBalance, 500);
  assert.equal(duplicate.list(`${base}/purchases`).length, 1);
  assert.ok(duplicate.retryCount > 0);
  const different = new FakeFirestore();
  seedWallet(different, 3500);
  const settled = await Promise.allSettled(['christmas', 'nature'].map(id => purchaseTheme(different, UID, id, NOW)));
  assert.equal(settled.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(settled.find(result => result.status === 'rejected').reason.code, 'INSUFFICIENT_XP_BALANCE');
  assert.equal(different.read(walletPath).xpBalance, 500);
  assert.equal(different.read(walletPath).totalXpSpent, 3000);
  assert.equal(different.list(`${base}/purchases`).length, 1);
});

test('concurrent reward and purchase preserve both wallet changes and separate lifetime totals', async () => {
  const db = new FakeFirestore();
  await completeMany(db, 4);
  seedWallet(db, 3500);
  seedTask(db, 'reward-and-purchase');
  await Promise.all([completeTask(db, UID, 'reward-and-purchase', NOW), purchaseTheme(db, UID, 'nature', NOW)]);
  assert.equal(db.read(walletPath).xpBalance, 1000);
  assert.equal(db.read(walletPath).lifetimeXpEarned, 4000);
  assert.equal(db.read(walletPath).totalXpSpent, 3000);
  assert.equal(db.read(walletPath).walletVersion, 2);
  assert.ok(db.read(walletPath).purchasedThemes.includes('nature'));
  assert.equal(db.list(`${base}/xpTransactions`).length, 2);
  assert.ok(db.retryCount > 0);
});

test('legacy task and ISO-week rewards cannot be claimed a second time', async () => {
  const db = new FakeFirestore();
  seedWallet(db, 500, { rewardedTaskIds: ['old-id'] });
  db.seed(`${base}/rewards/${getJakartaWeekInfo(NOW).legacyWeekKey}`, { xpAwarded: 500 });
  seedTask(db, 'old-id');
  seedTask(db, 'stamped', { xpRewarded: true, rewardedWeekKey: '2026-W41' });
  for (const id of ['old-id', 'stamped']) {
    const result = await completeTask(db, UID, id, NOW);
    assert.equal(result.alreadyRecorded, true);
    assert.equal(result.xpAwarded, 0);
    assert.equal(db.read(receiptPath(id)).legacy, true);
  }
  const result = await claimWeeklyReward(db, UID, NOW);
  assert.equal(result.rewarded, true);
  assert.equal(result.xpAwarded, 0);
  assert.equal(db.read(walletPath).xpBalance, 500);
  assert.equal(db.list(`${base}/xpTransactions`).length, 0);
});

test('identity, task shape, theme identifiers, and corrupted balances are rejected without writes', async () => {
  const db = new FakeFirestore();
  await assert.rejects(completeTask(db, '', 'task', NOW), errorCode('UNAUTHORIZED', 401));
  await assert.rejects(purchaseTheme(db, '../other-user', 'nature', NOW), errorCode('UNAUTHORIZED', 401));
  for (const id of ['', '../task', '.', '..', '__metadata__', 'x'.repeat(129)]) {
    await assert.rejects(completeTask(db, UID, id, NOW), errorCode('INVALID_TASK_ID', 400));
  }
  await assert.rejects(completeTask(db, UID, 'missing', NOW), errorCode('TASK_NOT_FOUND', 404));
  seedTask(db, 'pending', { status: 'pending' });
  await assert.rejects(completeTask(db, UID, 'pending', NOW), errorCode('TASK_NOT_COMPLETED', 409));
  seedTask(db, 'wrong-id', { id: 'another-id' });
  await assert.rejects(completeTask(db, UID, 'wrong-id', NOW), errorCode('INVALID_TASK', 400));
  seedTask(db, 'blank', { title: '  ' });
  await assert.rejects(completeTask(db, UID, 'blank', NOW), errorCode('INVALID_TASK', 400));
  for (const id of ['default', '__proto__', 'constructor', 'NATURE', '', null, { themeId: 'nature' }]) {
    await assert.rejects(purchaseTheme(db, UID, id, NOW), errorCode('INVALID_THEME_ID', 400));
  }
  for (const balance of [-1, NaN, 3000.5, Number.MAX_SAFE_INTEGER + 1]) {
    seedWallet(db, balance);
    await assert.rejects(purchaseTheme(db, UID, 'nature', NOW), errorCode('ECONOMY_DATA_INVALID', 503));
  }
  assert.equal(db.list(`${base}/taskCompletions`).length, 0);
  assert.equal(db.list(`${base}/purchases`).length, 0);
  assert.equal(db.list(`${base}/xpTransactions`).length, 0);
});

test('claim reconciliation counts trusted receipts and honors a legacy ISO ledger without reward document', async () => {
  const db = new FakeFirestore();
  const weekKey = getJakartaWeekInfo(NOW).weekKey;
  for (let i = 0; i < 5; i++) db.seed(receiptPath(`restored-${i}`), { uid: UID, taskId: `restored-${i}`, weekKey });
  const reconciled = await claimWeeklyReward(db, UID, NOW);
  assert.equal(reconciled.completedCount, 5);
  assert.equal(reconciled.xpAwarded, 500);
  assert.equal(db.read(walletPath).walletVersion, 1);
  const legacy = new FakeFirestore();
  seedWallet(legacy, 500);
  legacy.seed(`${base}/xpTransactions/weekly_${getJakartaWeekInfo(NOW).legacyWeekKey}`, { amount: 500 });
  const replay = await claimWeeklyReward(legacy, UID, NOW);
  assert.equal(replay.rewarded, true);
  assert.equal(replay.xpAwarded, 0);
  assert.equal(legacy.read(walletPath).xpBalance, 500);
  assert.equal(legacy.list(`${base}/rewards`).length, 0);
});

test('account operations never read or change another account wallet or receipts', async () => {
  const db = new FakeFirestore();
  seedWallet(db, 3000);
  db.seed('users/student-b/economy/wallet', { xpBalance: 9000, purchasedThemes: ['default', 'christmas'] });
  db.seed('users/student-b/tasks/private-task', { id: 'private-task', title: 'B only', status: 'completed' });
  await assert.rejects(completeTask(db, UID, 'private-task', NOW), errorCode('TASK_NOT_FOUND', 404));
  await purchaseTheme(db, UID, 'nature', NOW);
  assert.deepEqual(db.read('users/student-b/economy/wallet'), { xpBalance: 9000, purchasedThemes: ['default', 'christmas'] });
  assert.equal(db.list('users/student-b/taskCompletions').length, 0);
});
