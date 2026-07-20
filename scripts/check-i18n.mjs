/**
 * check-i18n: Verify all locale TS files have the same number of leaf string values.
 * Run via: node scripts/check-i18n.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const langsDir = resolve(__dirname, '..', 'src', 'shared', 'constants', 'i18n', 'languages');

const files = readdirSync(langsDir).filter((f) => f.endsWith('.ts'));
if (files.length === 0) {
  console.error('No locale TS files found');
  process.exit(1);
}

/** Count leaf string values in a TS locale file. */
function countLeafValues(content) {
  // Match any line ending with a quoted string value: key: 'value',
  const matches = content.match(/:\s*'(?:[^'\\]|\\.)*'/g);
  return matches ? matches.length : 0;
}

const referenceFile = files.find((f) => f === 'en.ts');
if (!referenceFile) {
  console.error('No en.ts reference file found');
  process.exit(1);
}

const referenceCount = countLeafValues(readFileSync(resolve(langsDir, 'en.ts'), 'utf-8'));
let hasErrors = false;

for (const file of files) {
  if (file === 'en.ts') continue;
  const count = countLeafValues(readFileSync(resolve(langsDir, file), 'utf-8'));
  if (count !== referenceCount) {
    console.error(`❌ ${file}: ${count} values vs ${referenceCount} in en.ts`);
    hasErrors = true;
  }
}

if (hasErrors) process.exit(1);
console.log(`✅ All ${files.length} locale files have ${referenceCount} leaf values`);
