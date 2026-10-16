'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

// Deliberately allowlist browser files: credentials, local data, tests, source
// utilities, and Admin SDK code must never become static production assets.
const ENTRY_FILES = ['index.html', 'styles.css', 'client.js'];
const ASSET_EXTENSIONS = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.woff', '.woff2']);

async function collectAssets(root, relative = 'assets') {
  let entries;
  try {
    const folder = await fs.lstat(path.join(root, relative));
    if (!folder.isDirectory() || folder.isSymbolicLink()) throw new Error(`Not a regular public asset directory: ${relative}`);
    entries = await fs.readdir(path.join(root, relative), { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT' && relative === 'assets') return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const name = path.join(relative, entry.name);
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) {
      throw new Error(`Hidden files and symlinks are not public assets: ${name}`);
    }
    if (entry.isDirectory()) files.push(...await collectAssets(root, name));
    else if (entry.isFile() && ASSET_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(name);
    else throw new Error(`Unsupported public asset: ${name}`);
  }
  return files;
}

function checkLocalReferences(html, files) {
  const allowed = new Set(files.map(file => file.split(path.sep).join('/')));
  for (const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']*)["']/gi)) {
    const reference = match[1].split(/[?#]/)[0];
    if (!reference || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) continue;
    const normalized = path.posix.normalize(reference.replace(/^\//, ''));
    if (!allowed.has(normalized)) throw new Error(`HTML refers to an asset excluded from the build: ${reference}`);
  }
}

async function buildStatic(root = path.resolve(__dirname, '..')) {
  root = path.resolve(root);
  const destination = path.resolve(root, 'dist');
  // Keep destructive cleanup constrained to this project's fixed dist folder.
  if (path.dirname(destination) !== root || path.basename(destination) !== 'dist') {
    throw new Error('Refusing to clean a directory outside the project dist folder');
  }
  const files = [...ENTRY_FILES, ...await collectAssets(root)];
  const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
  checkLocalReferences(html, files);
  // Validate every source before removing a previous usable build.
  for (const file of files) {
    const stat = await fs.lstat(path.join(root, file));
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Not a regular public file: ${file}`);
  }
  await fs.rm(destination, { recursive: true, force: true });
  for (const file of files) {
    const target = path.join(destination, file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(path.join(root, file), target);
  }
  return { destination, files };
}

if (require.main === module) {
  buildStatic().then(({ files }) => {
    console.log(`Production static build ready: dist/ (${files.length} allowlisted files).`);
  }).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { buildStatic, checkLocalReferences };
