const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');

function listFilesRecursive(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

function stripCommentsAndStrings(src) {
  let text = src.replace(/\/\*[\s\S]*?\*\//g, '');
  text = text.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '$1');
  text = text.replace(/(['"`])(?:\\.|(?!\1)[\s\S])*\1/g, '');
  return text;
}

(function main() {
  const ROOT = join(process.cwd(), 'src');
  if (!statSync(ROOT).isDirectory()) {
    console.error('src not found');
    process.exit(2);
  }
  const ALLOWLIST = new Set([
    'src/shared/utils/timer-management.ts',
    'src/shared/utils/performance/performance-utils.ts',
    'src/shared/types/core/userscript.d.ts',
  ]);
  const RE = /\b(setTimeout|setInterval|clearTimeout|clearInterval)\s*\(/;
  const offenders = [];
  for (const file of listFilesRecursive(ROOT)) {
    if (!/\.(ts|tsx|d\.ts)$/.test(file)) continue;
    const rel = relative(process.cwd(), file).replace(/\\/g, '/');
    if (ALLOWLIST.has(rel)) continue;
    const raw = readFileSync(file, 'utf8');
    const text = stripCommentsAndStrings(raw);
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (RE.test(line)) {
        offenders.push({ file: rel, line: line.trim() });
        break;
      }
    }
  }
  if (offenders.length) {
    console.log('Found offenders:', offenders.length);
    for (const o of offenders) {
      console.log(`- ${o.file}: ${o.line}`);
    }
    process.exit(1);
  } else {
    console.log('No direct timer offenders.');
  }
})();
