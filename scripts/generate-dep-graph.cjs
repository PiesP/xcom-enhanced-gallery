#!/usr/bin/env node
/**
 * Generate dependency graph SVG if Graphviz is available; otherwise skip gracefully.
 * This prevents CI failures on runners without `dot`/`sfdp` installed.
 */

const { spawnSync } = require('node:child_process');
const { existsSync, mkdirSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const ROOT = resolve(__dirname, '..');
const DOCS_DIR = resolve(ROOT, 'docs');
const DOT_PATH = resolve(DOCS_DIR, 'dependency-graph.dot');
const SVG_PATH = resolve(DOCS_DIR, 'dependency-graph.svg');

function which(cmd) {
  const res = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], {
    stdio: 'ignore',
  });
  return res.status === 0;
}

function run(cmd, args, input) {
  const res = spawnSync(cmd, args, {
    input,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (res.error) throw res.error;
  if (res.status !== 0)
    throw new Error(`${cmd} ${args.join(' ')} failed: ${res.stderr || res.stdout}`);
  return res.stdout;
}

function main() {
  if (!existsSync(DOCS_DIR)) mkdirSync(DOCS_DIR, { recursive: true });

  // Always (re)generate DOT first
  run('node', [
    resolve(ROOT, 'node_modules/.bin/dependency-cruiser'),
    '--config',
    resolve(ROOT, '.dependency-cruiser.cjs'),
    '--output-type',
    'dot',
    'src',
    '>',
    DOT_PATH,
  ]);
  // The above with '>' won't work via spawnSync; generate to stdout and write ourselves
}

try {
  // Generate DOT by capturing stdout
  const dotStdout = spawnSync(
    process.execPath,
    [
      resolve(ROOT, 'node_modules/dependency-cruiser/src/cli/index.mjs'),
      '--config',
      resolve(ROOT, '.dependency-cruiser.cjs'),
      '--output-type',
      'dot',
      'src',
    ],
    {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    }
  );
  if (dotStdout.error) throw dotStdout.error;
  if (dotStdout.status !== 0)
    throw new Error(dotStdout.stderr || 'dependency-cruiser dot generation failed');
  if (!existsSync(DOCS_DIR)) mkdirSync(DOCS_DIR, { recursive: true });
  writeFileSync(DOT_PATH, dotStdout.stdout, 'utf-8');

  const hasDot = which('dot');
  const hasSfdp = which('sfdp');

  if (!hasDot && !hasSfdp) {
    // Graceful skip: write a minimal SVG placeholder with a note
    const placeholder = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120">\n  <rect width="100%" height="100%" fill="#ffffff"/>\n  <text x="20" y="60" font-family="Arial, sans-serif" font-size="16" fill="#333">Graphviz (dot/sfdp) not found. Skipping SVG generation.</text>\n</svg>`;
    writeFileSync(SVG_PATH, placeholder, 'utf-8');
    console.log('Graphviz not found; generated DOT only and wrote placeholder SVG.');
    process.exit(0);
  }

  // Prefer dot; fallback to sfdp
  const engine = hasDot ? 'dot' : 'sfdp';
  const svgOut = run(engine, ['-T', 'svg', DOT_PATH]);
  writeFileSync(SVG_PATH, svgOut, 'utf-8');
  console.log(`Dependency graph SVG generated with ${engine}.`);
} catch (err) {
  // Do not fail CI if graph rendering fails; emit warning and continue
  console.warn('[deps:graph] Warning:', err && err.message ? err.message : err);
  try {
    if (!existsSync(SVG_PATH)) {
      const placeholder = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120">\n  <rect width="100%" height="100%" fill="#ffffff"/>\n  <text x="20" y="60" font-family="Arial, sans-serif" font-size="16" fill="#333">Dependency graph rendering failed. See logs.</text>\n</svg>`;
      writeFileSync(SVG_PATH, placeholder, 'utf-8');
    }
  } catch {}
  process.exit(0);
}
