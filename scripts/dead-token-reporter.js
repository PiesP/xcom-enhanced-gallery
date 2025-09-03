/* eslint-env node */
/* global process, console */
/**
 * Dead Token Reporter (Phase22)
 * Scans design-tokens.css for --xeg-* variable definitions and reports unused (dead) tokens
 * by searching through src/ (ts/tsx/css) files. Outputs JSON to stdout and saves to reports/dead-tokens.json.
 */
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

const DESIGN_TOKENS_PATH = join(process.cwd(), 'src', 'shared', 'styles', 'design-tokens.css');
const SRC_DIR = join(process.cwd(), 'src');
const OUTPUT_DIR = join(process.cwd(), 'reports');
const OUTPUT_PATH = join(OUTPUT_DIR, 'dead-tokens.json');

function collectTokens(css) {
  const varRegex = /--xeg-[a-z0-9-]+(?=\s*:)/g; // capture variable names before ':'
  const set = new Set();
  let m;
  while ((m = varRegex.exec(css))) set.add(m[0]);
  return Array.from(set).sort();
}

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const e of entries) {
    const p = join(dir, e);
    try {
      const st = statSync(p);
      if (st.isDirectory()) files.push(...walk(p));
      else if (st.isFile()) files.push(p);
    } catch {
      // ignore filesystem race
    }
  }
  return files;
}

function isCodeFile(p) {
  const ex = extname(p);
  return ['.ts', '.tsx', '.css', '.js', '.jsx'].includes(ex);
}

function main() {
  const css = readFileSync(DESIGN_TOKENS_PATH, 'utf-8');
  const tokens = collectTokens(css);
  const files = walk(SRC_DIR).filter(isCodeFile);
  // Preload file contents once
  const contents = files.map(f => ({ f, c: readFileSync(f, 'utf-8') }));
  const usage = {};
  for (const t of tokens) {
    let count = 0;
    const pattern = new RegExp(
      t.replace(/[-/\\^$*+?.()|[\]{}]/g, m => `\\${m}`),
      'g'
    );
    for (const { c } of contents) {
      const matches = c.match(pattern);
      if (matches) count += matches.length;
      if (count > 0) break; // early exit if referenced at least once
    }
    usage[t] = count;
  }
  const dead = Object.entries(usage)
    .filter(([, c]) => c === 0)
    .map(([k]) => k)
    .sort();
  const report = {
    generatedAt: new Date().toISOString(),
    totalTokens: tokens.length,
    deadCount: dead.length,
    deadTokens: dead,
    sample: tokens.slice(0, 5),
  };
  try {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  } catch {
    // ignore mkdir race
  }
  writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  console.log(JSON.stringify(report, null, 2));
}

main();
