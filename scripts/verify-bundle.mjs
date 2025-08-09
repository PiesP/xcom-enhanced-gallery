// ESM script to verify production userscript bundle is CSP-safe
// Checks: no dynamic import(), no script tag injection, no raw preact/compat specifier
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const distFile = resolve(root, 'dist', 'xcom-enhanced-gallery.user.js');

function fail(msg) {
  console.error(`❌ verify-bundle: ${msg}`);
  process.exitCode = 1;
}

function pass(msg) {
  console.log(`✅ verify-bundle: ${msg}`);
}

async function main() {
  if (!existsSync(distFile)) {
    fail(`dist file not found: ${distFile}. Run build:prod first.`);
    return;
  }

  const code = await readFile(distFile, 'utf8');

  const checks = [
    { pattern: /import\s*\(/, desc: 'no dynamic import() in bundle' },
    {
      pattern: /document\.createElement\(\s*['\"]script['\"]\s*\)/,
      desc: 'no script tag injection',
    },
    { pattern: /new\s+Function\s*\(\s*['\"]import['\"]/i, desc: 'no new Function("import") shim' },
    { pattern: /preact\/compat/, desc: 'no raw preact/compat specifier left' },
  ];

  let failed = false;
  for (const { pattern, desc } of checks) {
    if (pattern.test(code)) {
      fail(`${desc} — pattern found: ${pattern}`);
      failed = true;
    } else {
      pass(`${desc}`);
    }
  }

  if (!failed) {
    pass('bundle verification completed successfully');
  }
}

main().catch(err => {
  fail(`exception during verification: ${err?.message || err}`);
});
