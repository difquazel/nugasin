'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const excluded = new Set(['node_modules', '.npm-cache', '.git', 'dist', '.firebase']);
function collect(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (excluded.has(entry.name) || entry.isSymbolicLink()) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? collect(file) : entry.name.endsWith('.js') ? [file] : [];
  });
}
const sources = collect(root);
for (const file of sources) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    console.error(result.error || result.stderr || result.stdout);
    process.exit(1);
  }
}
for (const file of ['package.json', 'vercel.json', 'firebase.json']) {
  JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}
console.log(`Syntax and configuration checks passed (${sources.length} JavaScript files).`);
