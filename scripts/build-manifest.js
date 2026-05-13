#!/usr/bin/env node
// ============================================================
//  build-manifest.js
//
//  Scans games/<id>/game.json files and writes games.json at
//  the repo root. Run locally with `node scripts/build-manifest.js`,
//  or let the GitHub Action do it on push.
//
//  Rules:
//   - Each games/<dir>/ folder must contain a game.json AND an entry
//     file (default: index.html). Folders without game.json are skipped.
//   - The folder name MUST match the manifest's "id" field.
//   - Entries are sorted by `order` (low first), then alphabetically by title.
//   - The `status` field defaults to "ready" if absent.
//   - The `beta` flag, if true, is preserved in the output. The launcher
//     hides beta games unless ?beta=1 is in the URL.
//
//  Hand-edits to games.json will be OVERWRITTEN by this script.
//  If you want a hand-edit to persist, put it in the per-game game.json instead.
// ============================================================
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const GAMES_DIR = path.join(REPO_ROOT, 'games');
const OUT_FILE  = path.join(REPO_ROOT, 'games.json');

function fail(msg) {
  console.error('ERROR: ' + msg);
  process.exit(1);
}

function warn(msg) {
  console.warn('WARN:  ' + msg);
}

if (!fs.existsSync(GAMES_DIR)) {
  fail(`games/ directory not found at ${GAMES_DIR}`);
}

const entries = [];
const dirs = fs.readdirSync(GAMES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

for (const dir of dirs) {
  const gameJsonPath = path.join(GAMES_DIR, dir, 'game.json');
  if (!fs.existsSync(gameJsonPath)) {
    warn(`games/${dir}/ has no game.json — skipping`);
    continue;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(gameJsonPath, 'utf8'));
  } catch (e) {
    fail(`games/${dir}/game.json is not valid JSON: ${e.message}`);
  }

  if (!data.id) {
    warn(`games/${dir}/game.json has no "id" — using folder name "${dir}"`);
    data.id = dir;
  }
  if (data.id !== dir) {
    fail(`games/${dir}/game.json id="${data.id}" does not match folder name "${dir}"`);
  }

  // Default status
  if (!data.status) data.status = 'ready';

  // Normalize beta to a boolean (or drop the key entirely if false/missing).
  if (data.beta === true) data.beta = true;
  else delete data.beta;

  // Verify entry file exists for "ready" games (warn for "coming")
  const entry = data.entry || 'index.html';
  const entryPath = path.join(GAMES_DIR, dir, entry);
  if (!fs.existsSync(entryPath)) {
    if (data.status === 'ready') {
      fail(`games/${dir}/${entry} not found (game.json says status=ready)`);
    } else {
      warn(`games/${dir}/${entry} not found (status=${data.status}, allowed)`);
    }
  }

  entries.push(data);
}

// Sort by order then title
entries.sort((a, b) => {
  const ao = (typeof a.order === 'number') ? a.order : 999;
  const bo = (typeof b.order === 'number') ? b.order : 999;
  if (ao !== bo) return ao - bo;
  return String(a.title || '').localeCompare(String(b.title || ''));
});

const json = JSON.stringify(entries, null, 2) + '\n';
fs.writeFileSync(OUT_FILE, json, 'utf8');

console.log(`Wrote ${OUT_FILE}: ${entries.length} game(s).`);
for (const e of entries) {
  const tag = e.status === 'coming' ? '[coming]' : '[ready] ';
  const beta = e.beta ? ' [beta]' : '';
  console.log(`  ${tag} ${e.id.padEnd(28)} ${e.title}${beta}${e.subtitle ? ': ' + e.subtitle : ''}`);
}
