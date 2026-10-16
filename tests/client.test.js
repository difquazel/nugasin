'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { FakeFirestore } = require('./helpers/fake-firestore');

const root = path.resolve(__dirname, '..');
const snapshot = value => JSON.parse(JSON.stringify(value));

function element(attributes = {}) {
  const values = new Map(Object.entries(attributes));
  const classes = new Set();
  const listeners = {};
  return {
    style: {}, listeners,
    getAttribute: name => values.get(name) ?? null,
    setAttribute: (name, value) => values.set(name, String(value)),
    removeAttribute: name => values.delete(name),
    addEventListener: (event, callback) => { listeners[event] = callback; },
    classList: {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      contains: name => classes.has(name),
      toggle(name, force) {
        const enabled = force ?? !classes.has(name);
        if (enabled) classes.add(name); else classes.delete(name);
        return enabled;
      }
    }
  };
}

function loadClient({ storage = new Map(), systemDark = false, fetch = async () => { throw new Error('offline-test'); } } = {}) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  // Derive buttons from real markup so selector drift is observable.
  const buttons = [...html.matchAll(/<button\b[^>]*\bdata-color-mode-btn="([^"]+)"[^>]*>/g)]
    .map(match => element({ 'data-color-mode-btn': match[1] }));
  const documentRoot = element();
  const mediaListeners = new Map();
  const document = {
    documentElement: documentRoot, body: element(),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: selector => selector === '[data-color-mode-btn]' ? buttons : [],
    addEventListener() {}
  };
  const window = {
    addEventListener() {}, location: { href: 'http://localhost/' }, history: { replaceState() {} },
    matchMedia: query => ({
      matches: query === '(prefers-color-scheme: dark)' && systemDark,
      addEventListener: (_, callback) => mediaListeners.set(query, callback)
    })
  };
  const context = vm.createContext({
    window, document, navigator: { onLine: true }, URL, URLSearchParams,
    performance: { now: () => 1000 },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    fetch, console,
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    btoa: value => Buffer.from(value, 'binary').toString('base64'),
    atob: value => Buffer.from(value, 'base64').toString('binary')
  });
  const exports = `
    window.__test = {
      loadLocalEconomyState, postEconomyOperation, applyServerEconomy,
      executeConfirmedThemePurchase, evaluateAndClaimWeeklyRewardIfEligible,
      getQualifyingWeeklyTasksInfo, getJakartaWeekInfo, applyAppearanceAndTheme,
      bindEvents, ensureValidAppDataShape, toggleTaskCompletion, deleteTask,
      flushPendingTaskCompletions, handleAuthStateTransition,
      get economy() { return economyState; }, set economy(value) { economyState = value; },
      get app() { return appData; },
      get user() { return currentUser; }, set user(value) { currentUser = value; },
      get epoch() { return accountEpoch; }, set epoch(value) { accountEpoch = value; },
      get walletLoaded() { return cloudWalletLoaded; }, set walletLoaded(value) { cloudWalletLoaded = value; },
      get progress() { return weeklyProgress; }, set progress(value) { weeklyProgress = value; },
      get pendingTheme() { return pendingPurchaseThemeId; }, set pendingTheme(value) { pendingPurchaseThemeId = value; },
      get pendingQueue() { return [...pendingCompletions]; },
      get tasksLoaded() { return cloudTasksLoaded; },
      set database(value) { firestoreDb = value; },
      get selectedDate() { return selectedCalendarDate; }, set selectedDate(value) { selectedCalendarDate = value; },
      get calendarMonth() { return currentCalendarMonth; }, set calendarMonth(value) { currentCalendarMonth = value; },
      get calendarYear() { return currentCalendarYear; }, set calendarYear(value) { currentCalendarYear = value; },
      get syncError() { return economySyncError; }
    };
  `;
  // Instrument the original closure only in the VM; production has no test exports.
  const source = fs.readFileSync(path.join(root, 'client.js'), 'utf8');
  const closing = source.lastIndexOf('})();');
  assert.ok(closing > 0, 'client IIFE must have a closing marker');
  vm.runInContext(source.slice(0, closing) + exports + source.slice(closing), context, { filename: 'client.js' });
  return { api: window.__test, documentRoot, buttons, storage, context, mediaListeners };
}

const user = uid => ({ uid, getIdToken: async () => `token-${uid}` });

function firestoreClientFixture(initial) {
  const store = new FakeFirestore(initial);
  const listeners = new Map();
  const wrap = ref => ({
    path: ref.path,
    collection: name => wrap(ref.collection(name)),
    doc: name => wrap(ref.doc(name)),
    get: () => ref.get(),
    set: (...args) => ref.set(...args),
    onSnapshot(...args) {
      const callback = typeof args[0] === 'function' ? args[0] : args[1];
      listeners.set(ref.path, callback);
      return () => { if (listeners.get(ref.path) === callback) listeners.delete(ref.path); };
    }
  });
  return {
    database: { collection: name => wrap(store.collection(name)) },
    async emitTasks(uid, fromCache) {
      const snapshot = await store.collection('users').doc(uid).collection('tasks').get();
      snapshot.metadata = { hasPendingWrites: false, fromCache };
      listeners.get(`users/${uid}/tasks`)(snapshot);
    }
  };
}

test('local task completion, reopening, and deletion preserve other work/calendar dates and never mint XP', async () => {
  const requests = [];
  const { api, storage } = loadClient({ fetch: async (...args) => { requests.push(args); throw new Error('No local XP requests expected'); } });
  const target = { id: 'target', title: 'Essay', status: 'pending', dueDate: '2026-10-20', dueTime: '14:30', priority: 'high', createdAt: '2026-10-01T08:00:00.000Z' };
  const unrelated = { id: 'untouched', title: 'Presentation', status: 'in-progress', dueDate: '2026-11-03', dueTime: '09:15', priority: 'medium', subtasks: [{ id: 'sub', text: 'Outline', done: false }] };
  const notes = [{ id: 'lecture-note', title: 'Lecture', date: '2026-12-08', course: 'English', content: '<p>Preserve this note.</p>', updatedAt: '2026-10-10T08:00:00.000Z' }];
  api.app.tasks = [snapshot(target), snapshot(unrelated)];
  api.app.notes = snapshot(notes);
  api.app.courses = ['English'];
  api.selectedDate = '2026-12-08';
  api.calendarMonth = 11;
  api.calendarYear = 2026;
  const originalEconomy = snapshot(api.economy);
  const assertPreserved = () => {
    assert.deepEqual(snapshot(api.app.tasks.find(task => task.id === 'untouched')), unrelated);
    assert.deepEqual(snapshot(api.app.notes), notes);
    assert.equal(api.selectedDate, '2026-12-08');
    assert.equal(api.calendarMonth, 11);
    assert.equal(api.calendarYear, 2026);
    assert.deepEqual(snapshot(api.economy), originalEconomy);
    assert.equal(api.getQualifyingWeeklyTasksInfo().completedCount, 0);
  };
  for (let i = 0; i < 6; i++) {
    await api.toggleTaskCompletion('target');
    assert.equal(api.app.tasks.find(task => task.id === 'target').status, 'completed');
    assert.ok(api.app.tasks.find(task => task.id === 'target').completedAtMs > 0);
    assert.equal(api.app.tasks.find(task => task.id === 'target').dueDate, target.dueDate);
    assertPreserved();
    await api.toggleTaskCompletion('target');
    assert.equal(api.app.tasks.find(task => task.id === 'target').status, 'pending');
    assert.equal(api.app.tasks.find(task => task.id === 'target').completedAtMs, null);
    assertPreserved();
  }
  api.deleteTask('target');
  assert.equal(api.app.tasks.some(task => task.id === 'target'), false);
  assertPreserved();
  const saved = JSON.parse(storage.get('nugasin_v2_ws_ruang-kuliah'));
  assert.deepEqual(saved.tasks, [unrelated]);
  assert.deepEqual(saved.notes, notes);
  assert.equal(requests.length, 0);
});

test('persisted completion queues wait for a server task snapshot and ignore responses after account changes', async () => {
  const storage = new Map([
    ['nugasin_pending_completions_a', JSON.stringify(['a-task'])],
    ['nugasin_pending_completions_b', JSON.stringify(['b-task'])],
    ['nugasin_migrated_uid_a', 'true'], ['nugasin_migrated_uid_b', 'true']
  ]);
  const fixture = firestoreClientFixture({
    'users/a/tasks/a-task': { id: 'a-task', title: 'A task', status: 'completed', dueDate: '2026-10-20' },
    'users/b/tasks/b-task': { id: 'b-task', title: 'B task', status: 'completed', dueDate: '2026-11-02' }
  });
  const requests = [];
  let finishA;
  let announceA;
  const startedA = new Promise(resolve => { announceA = resolve; });
  const { api } = loadClient({ storage, fetch: async (url, options) => {
    if (url === '/api/claim-weekly-reward') return { ok: false, json: async () => ({ ok: false, error: 'No claim in queue fixture' }) };
    requests.push({ url, token: options.headers.Authorization, body: JSON.parse(options.body) });
    if (options.headers.Authorization === 'Bearer token-a') {
      announceA();
      return new Promise(resolve => { finishA = resolve; });
    }
    return { ok: true, json: async () => ({ ok: true, walletVersion: 0, xpBalance: 0, purchasedThemes: ['default'], completedCount: 1, xpAwarded: 0 }) };
  } });
  api.database = fixture.database;
  await api.handleAuthStateTransition(user('a'));
  assert.deepEqual(snapshot(api.pendingQueue), ['a-task']);
  assert.equal(api.tasksLoaded, false);
  await api.flushPendingTaskCompletions();
  assert.equal(requests.length, 0);
  assert.deepEqual(JSON.parse(storage.get('nugasin_pending_completions_a')), ['a-task']);
  await fixture.emitTasks('a', true);
  await api.flushPendingTaskCompletions();
  assert.equal(api.tasksLoaded, false, 'a cached snapshot cannot establish cloud task readiness');
  assert.equal(requests.length, 0);
  await fixture.emitTasks('a', false);
  await startedA;
  assert.equal(api.tasksLoaded, true);
  assert.deepEqual(requests[0], { url: '/api/complete-task', token: 'Bearer token-a', body: { taskId: 'a-task' } });
  await api.handleAuthStateTransition(user('b'));
  assert.equal(api.tasksLoaded, false);
  assert.deepEqual(snapshot(api.pendingQueue), ['b-task']);
  finishA({ ok: true, json: async () => ({ ok: true, walletVersion: 99, xpBalance: 9999, purchasedThemes: ['default', 'christmas'], xpAwarded: 0 }) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(api.user.uid, 'b');
  assert.equal(api.economy.xpBalance, 0);
  assert.deepEqual(snapshot(api.pendingQueue), ['b-task']);
  assert.deepEqual(JSON.parse(storage.get('nugasin_pending_completions_a')), ['a-task']);
  assert.deepEqual(JSON.parse(storage.get('nugasin_pending_completions_b')), ['b-task']);
  await fixture.emitTasks('b', false);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(requests[1], { url: '/api/complete-task', token: 'Bearer token-b', body: { taskId: 'b-task' } });
  assert.deepEqual(snapshot(api.pendingQueue), []);
  assert.deepEqual(JSON.parse(storage.get('nugasin_pending_completions_b')), []);
  assert.deepEqual(JSON.parse(storage.get('nugasin_pending_completions_a')), ['a-task']);
});

test('tampered local XP/ownership is ignored; editable tasks cannot count as server weekly progress', () => {
  const storage = new Map([
    ['nugasin_economy_state', JSON.stringify({ xpBalance: 999999, purchasedThemes: ['christmas', 'nature', 'antarctica'] })],
    ['nugasin_economy_uid_student-a', JSON.stringify({ xpBalance: 999999 })]
  ]);
  const { api } = loadClient({ storage });
  api.economy = { xpBalance: 999999, purchasedThemes: ['christmas'], rewardedWeeks: {} };
  api.loadLocalEconomyState();
  assert.equal(api.economy.xpBalance, 0);
  assert.deepEqual(snapshot(api.economy.purchasedThemes), ['default']);
  api.app.tasks = Array.from({ length: 7 }, (_, i) => ({ id: `task-${i}`, status: 'completed', completedAtMs: Date.now() }));
  assert.equal(api.getQualifyingWeeklyTasksInfo().completedCount, 0);
  const weekKey = api.getJakartaWeekInfo().weekKey;
  api.progress = { weekKey, completedCount: 3, rewarded: false };
  assert.equal(api.getQualifyingWeeklyTasksInfo().completedCount, 3);
  api.progress = { weekKey: '1999-01-04', completedCount: 5, rewarded: true };
  assert.equal(api.getQualifyingWeeklyTasksInfo().completedCount, 0);
});

test('server failures never fabricate local XP rewards, theme ownership, or balance deductions', async () => {
  const { api } = loadClient({ fetch: async () => ({ ok: false, json: async () => ({ ok: false, code: 'SERVER_NOT_CONFIGURED', error: 'XP server unavailable' }) }) });
  api.user = user('student-a');
  api.walletLoaded = true;
  api.economy.xpBalance = 3500;
  api.economy.lifetimeEarnedXp = 3500;
  api.pendingTheme = 'christmas';
  const before = snapshot(api.economy);
  await api.executeConfirmedThemePurchase();
  assert.deepEqual(snapshot(api.economy), before);
  assert.equal(api.app.profile.activeTheme, 'default');
  assert.equal(api.pendingTheme, 'christmas');
  await api.evaluateAndClaimWeeklyRewardIfEligible();
  assert.deepEqual(snapshot(api.economy), before);
  assert.equal(api.syncError, 'XP server unavailable');
});

test('account changes while obtaining a token prevent requests for the stale account', async () => {
  let releaseToken;
  let fetchCount = 0;
  const { api } = loadClient({ fetch: async () => { fetchCount++; throw new Error('should not fetch'); } });
  const accountA = { uid: 'a', getIdToken: () => new Promise(resolve => { releaseToken = resolve; }) };
  api.user = accountA;
  api.epoch = 1;
  const operation = api.postEconomyOperation('/api/purchase-theme', { themeId: 'nature' }, accountA, 1);
  api.user = user('b');
  api.epoch = 2;
  releaseToken('token-a');
  await assert.rejects(operation, /ACCOUNT_CHANGED/);
  assert.equal(fetchCount, 0);
  assert.equal(api.economy.xpBalance, 0);
});

test('stale purchase responses after an account switch cannot populate another account wallet or theme', async () => {
  let releaseFetch;
  let started;
  const didStart = new Promise(resolve => { started = resolve; });
  const { api } = loadClient({ fetch: () => {
    started();
    return new Promise(resolve => { releaseFetch = resolve; });
  } });
  api.user = user('a');
  api.epoch = 1;
  api.walletLoaded = true;
  api.economy.xpBalance = 3500;
  api.pendingTheme = 'christmas';
  const operation = api.executeConfirmedThemePurchase();
  await didStart;
  api.user = user('b');
  api.epoch = 2;
  api.loadLocalEconomyState();
  api.walletLoaded = false;
  releaseFetch({ ok: true, json: async () => ({ ok: true, xpBalance: 500, lifetimeXpEarned: 3500, totalXpSpent: 3000, purchasedThemes: ['default', 'christmas'], costXp: 3000 }) });
  await operation;
  assert.equal(api.user.uid, 'b');
  assert.equal(api.economy.xpBalance, 0);
  assert.deepEqual(snapshot(api.economy.purchasedThemes), ['default']);
  assert.equal(api.app.profile.activeTheme, 'default');
  assert.equal(api.walletLoaded, false);
});

test('appearance controls bind real HTML attributes and persist mode through a fresh client context', () => {
  const storage = new Map();
  const { api, buttons, documentRoot } = loadClient({ storage });
  assert.equal(buttons.length, 6, 'top bar and shop each expose light, dark, and system controls');
  api.bindEvents();
  const dark = buttons.find(button => button.getAttribute('data-color-mode-btn') === 'dark');
  dark.listeners.click();
  assert.equal(api.app.profile.colorMode, 'dark');
  assert.equal(documentRoot.getAttribute('data-color-mode'), 'dark');
  assert.equal(dark.getAttribute('aria-pressed'), 'true');
  assert.equal(buttons.filter(button => button.getAttribute('aria-pressed') === 'true').length, 2);
  const reloaded = loadClient({ storage });
  reloaded.api.ensureValidAppDataShape();
  reloaded.api.applyAppearanceAndTheme();
  assert.equal(reloaded.documentRoot.getAttribute('data-color-mode'), 'dark');
  assert.equal(reloaded.api.app.profile.colorMode, 'dark');
});

test('older server wallet responses cannot restore spent XP or remove newly purchased themes', () => {
  const { api } = loadClient();
  api.user = user('student-a');
  const weekKey = api.getJakartaWeekInfo().weekKey;
  api.applyServerEconomy({ walletVersion: 2, xpBalance: 500, lifetimeXpEarned: 3500, totalXpSpent: 3000, purchasedThemes: ['default', 'nature'], weekKey, completedCount: 4, rewarded: false });
  api.applyServerEconomy({ walletVersion: 1, xpBalance: 3500, lifetimeXpEarned: 3500, totalXpSpent: 0, purchasedThemes: ['default'], weekKey, completedCount: 2, rewarded: false });
  assert.equal(api.economy.walletVersion, 2);
  assert.equal(api.economy.xpBalance, 500);
  assert.equal(api.economy.lifetimeSpentXp, 3000);
  assert.deepEqual(snapshot(api.economy.purchasedThemes), ['default', 'nature']);
  assert.equal(api.getQualifyingWeeklyTasksInfo().completedCount, 4);
});

test('premium decorative themes remain independent from light/dark/system mode and animation preference', () => {
  const { api, documentRoot } = loadClient({ systemDark: true });
  api.user = user('student-a');
  api.economy.purchasedThemes = ['default', 'christmas', 'nature', 'antarctica'];
  for (const theme of ['christmas', 'nature', 'antarctica']) {
    api.app.profile.activeTheme = theme;
    for (const mode of ['light', 'dark', 'system']) {
      api.app.profile.colorMode = mode;
      api.app.profile.animationsEnabled = false;
      api.applyAppearanceAndTheme();
      assert.equal(documentRoot.getAttribute('data-active-theme'), theme);
      assert.equal(documentRoot.getAttribute('data-color-mode'), mode === 'light' ? 'light' : 'dark');
      assert.equal(documentRoot.getAttribute('data-animations'), 'off');
    }
  }
  api.economy.purchasedThemes = ['default'];
  api.app.profile.activeTheme = 'christmas';
  api.applyAppearanceAndTheme();
  assert.equal(documentRoot.getAttribute('data-active-theme'), 'default');
});

test('initial pre-CSS appearance script restores dark mode before the app initializes', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1];
  assert.ok(script);
  assert.ok(html.indexOf('<script>') < html.indexOf('href="styles.css"'));
  const rootElement = element();
  const meta = {};
  vm.runInNewContext(script, {
    localStorage: { getItem: () => JSON.stringify({ colorMode: 'dark', animationsEnabled: false }) },
    document: { documentElement: rootElement, getElementById: () => meta, addEventListener() {} },
    window: { matchMedia: () => ({ matches: false }) }, setTimeout() {}
  });
  assert.equal(rootElement.getAttribute('data-color-mode'), 'dark');
  assert.equal(rootElement.style.colorScheme, 'dark');
  assert.equal(rootElement.getAttribute('data-animations'), 'off');
});
