'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { buildStatic, checkLocalReferences } = require('../scripts/build');

test('production build only includes approved browser assets, never server or local data', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nugasin-build-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'api'));
  await fs.mkdir(path.join(root, 'data'));
  await fs.mkdir(path.join(root, 'assets'));
  await Promise.all([
    fs.writeFile(path.join(root, 'index.html'), '<link href="styles.css"><script src="client.js"></script><img src="assets/otter.svg">'),
    fs.writeFile(path.join(root, 'styles.css'), 'body{}'),
    fs.writeFile(path.join(root, 'client.js'), 'console.log("browser");'),
    fs.writeFile(path.join(root, 'assets', 'otter.svg'), '<svg/>'),
    fs.writeFile(path.join(root, 'api', 'private.js'), 'private'),
    fs.writeFile(path.join(root, 'data', 'workspaces.json'), 'private'),
    fs.writeFile(path.join(root, '.env'), 'FIREBASE_PRIVATE_KEY=private'),
    fs.writeFile(path.join(root, 'local-server.js'), 'private')
  ]);
  const { destination, files } = await buildStatic(root);
  assert.deepEqual(files.sort(), ['index.html', 'styles.css', 'client.js', path.join('assets', 'otter.svg')].sort());
  assert.deepEqual((await fs.readdir(destination)).sort(), ['assets', 'client.js', 'index.html', 'styles.css']);
  assert.equal(await fs.readFile(path.join(destination, 'assets', 'otter.svg'), 'utf8'), '<svg/>');
});

test('broken public references fail the build instead of publishing missing files', () => {
  assert.throws(() => checkLocalReferences('<script src="api/private.js"></script>', ['index.html']), /excluded/);
  assert.throws(() => checkLocalReferences('<img src="../.env">', ['index.html']), /excluded/);
  assert.doesNotThrow(() => checkLocalReferences('<a href="#wallet">wallet</a><script src="https://example.test/sdk.js"></script>', ['index.html']));
});

test('credentials placed inside the artwork folder are rejected', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nugasin-assets-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'assets'));
  await fs.writeFile(path.join(root, 'assets', 'service-account.json'), '{"private_key":"secret"}');
  await assert.rejects(buildStatic(root), /Unsupported public asset/);
});
