// SPDX-License-Identifier: MIT
// Translation completeness verification script
// Parses TypeScript language files in src/shared/constants/i18n/languages/*.ts
// and verifies all 6 locales have identical keys

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LANGUAGES_DIR = join(
  ROOT,
  'src',
  'shared',
  'constants',
  'i18n',
  'languages',
);
const LOCALES = ['en', 'ko', 'ja', 'zh-cn', 'es', 'ar'] as const;

type LocaleKeyMap = Record<string, Set<string>>;

/**
 * Extract all leaf keys from a TypeScript LanguageStrings object.
 * The LanguageStrings type has nested structure like { tb: { prev: 'x' } }
 * We flatten to dot-notation keys like "tb.prev"
 */
function extractKeys(content: string): Set<string> {
  const keys = new Set<string>();

  // Find the exported object literal (between first { and last };)
  // We need to parse the nested structure
  const objectMatch = /export\s+const\s+\w+\s*:\s*LanguageStrings\s*=\s*\{/.exec(content);
  if (!objectMatch) return keys;

  const startIdx = objectMatch.index + objectMatch[0].length - 1; // position of opening {
  const extracted = extractObjectContent(content, startIdx);
  if (!extracted) return keys;

  parseObjectLiteral(extracted.content, '', keys);
  return keys;
}

/**
 * Given the index of an opening {, find the matching closing }
 */
function extractObjectContent(content: string, openBraceIdx: number): { content: string } | null {
  if (content[openBraceIdx] !== '{') return null;

  let depth = 0;
  let inString: string | null = null;
  let escaped = false;

  for (let i = openBraceIdx; i < content.length; i++) {
    const ch = content[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }

    if (inString) {
      if (ch === inString) inString = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      continue;
    }

    // Skip single-line comments
    if (ch === '/' && content[i + 1] === '/') {
      const nl = content.indexOf('\n', i);
      if (nl === -1) break;
      // We need to process this differently - use a simpler approach
      continue;
    }

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return { content: content.slice(openBraceIdx + 1, i) };
      }
    }
  }

  return null;
}

/**
 * Recursively parse an object literal content string and collect leaf keys
 */
function parseObjectLiteral(content: string, prefix: string, keys: Set<string>): void {
  let i = 0;
  while (i < content.length) {
    // Skip whitespace
    while (i < content.length && /\s/.test(content[i])) i++;
    if (i >= content.length) break;

    // Skip single-line comments
    if (content[i] === '/' && content[i + 1] === '/') {
      const nl = content.indexOf('\n', i);
      i = nl === -1 ? content.length : nl + 1;
      continue;
    }

    // Skip multi-line comments
    if (content[i] === '/' && content[i + 1] === '*') {
      const end = content.indexOf('*/', i + 2);
      i = end === -1 ? content.length : end + 2;
      continue;
    }

    // Skip whitespace and newlines
    while (i < content.length && /[\s\n\r]/.test(content[i])) i++;
    if (i >= content.length) break;

    // Read key
    let key: string;
    if (content[i] === "'" || content[i] === '"') {
      const quote = content[i];
      let j = i + 1;
      while (j < content.length && content[j] !== quote) {
        if (content[j] === '\\') j++;
        j++;
      }
      key = content.slice(i + 1, j);
      i = j + 1;
    } else {
      // Identifier key
      let j = i;
      while (j < content.length && /[\w$]/.test(content[j])) j++;
      if (j === i) { i++; continue; }
      key = content.slice(i, j);
      i = j;
    }

    // Skip whitespace
    while (i < content.length && /\s/.test(content[i])) i++;

    // Read colon
    if (content[i] === ':') {
      i++;
      // Skip whitespace after colon
      while (i < content.length && /\s/.test(content[i])) i++;
    } else {
      continue;
    }

    if (i >= content.length) break;

    // Read value
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (content[i] === '{') {
      // Nested object
      const nested = extractObjectContent(content, i);
      if (nested) {
        parseObjectLiteral(nested.content, fullKey, keys);
        // Skip past the nested object
        let depth = 1;
        i++;
        while (i < content.length && depth > 0) {
          if (content[i] === '"' || content[i] === "'") {
            const q = content[i];
            i++;
            while (i < content.length && content[i] !== q) {
              if (content[i] === '\\') i++;
              i++;
            }
          }
          if (content[i] === '{') depth++;
          else if (content[i] === '}') depth--;
          if (depth > 0) i++;
        }
        i++; // skip closing }
      }
    } else if (content[i] === "'" || content[i] === '"') {
      // String value - this is a leaf key
      const quote = content[i];
      let j = i + 1;
      while (j < content.length && content[j] !== quote) {
        if (content[j] === '\\') j++;
        j++;
      }
      keys.add(fullKey);
      i = j + 1;
    } else if (content[i] === '`' ) {
      // Template literal - also a leaf
      let j = i + 1;
      while (j < content.length && content[j] !== '`') {
        if (content[j] === '\\') j++;
        else if (content[j] === '$' && content[j + 1] === '{') {
          // Skip template expression - find matching }
          let tdepth = 1;
          j += 2;
          while (j < content.length && tdepth > 0) {
            if (content[j] === '{') tdepth++;
            else if (content[j] === '}') tdepth--;
            if (tdepth > 0) j++;
          }
          if (tdepth === 0) j++;
        }
        if (j < content.length && content[j] !== '`') j++;
      }
      keys.add(fullKey);
      i = j + 1;
    } else {
      // Some other value (number, boolean, etc.) - skip
      i++;
    }

    // Skip comma and whitespace
    while (i < content.length && /[\s,]/.test(content[i])) i++;
  }
}

function main(): void {
  console.log('═══ xcom-enhanced-gallery i18n Verification ═══\n');

  const localeKeys: LocaleKeyMap = {};
  const files = readdirSync(LANGUAGES_DIR).filter((f) => f.endsWith('.ts'));

  for (const locale of LOCALES) {
    const fileName = `${locale}.ts`;
    const filePath = join(LANGUAGES_DIR, fileName);

    if (!files.includes(fileName)) {
      console.error(`❌ Missing locale file: ${fileName}`);
      continue;
    }

    const content = readFileSync(filePath, 'utf-8');
    localeKeys[locale] = extractKeys(content);
    console.log(`  ${locale}: ${localeKeys[locale].size} keys`);
  }

  // Use en as reference
  const reference = localeKeys['en'];
  if (!reference) {
    console.error('\n❌ Reference locale (en) not found!');
    process.exit(1);
  }

  console.log(`\n📊 Reference (en): ${reference.size} keys\n`);

  let allMatch = true;
  const allKeys = new Set<string>();

  for (const locale of LOCALES) {
    if (locale === 'en') continue;
    const keys = localeKeys[locale];
    if (!keys) continue;

    const missingInLocale = [...reference].filter((k) => !keys.has(k));
    const extraInLocale = [...keys].filter((k) => !reference.has(k));

    for (const k of reference) allKeys.add(k);
    for (const k of keys) allKeys.add(k);

    if (missingInLocale.length === 0 && extraInLocale.length === 0) {
      console.log(`✅ ${locale}: MATCH (${keys.size} keys)`);
    } else {
      allMatch = false;
      console.log(`❌ ${locale}: MISMATCH`);
      if (missingInLocale.length > 0) {
        console.log(`   Missing ${missingInLocale.length} key(s): ${missingInLocale.slice(0, 5).map((k) => `"${k}"`).join(', ')}${missingInLocale.length > 5 ? '...' : ''}`);
      }
      if (extraInLocale.length > 0) {
        console.log(`   Extra ${extraInLocale.length} key(s): ${extraInLocale.slice(0, 5).map((k) => `"${k}"`).join(', ')}${extraInLocale.length > 5 ? '...' : ''}`);
      }
    }
  }

  console.log(`\n📈 Total unique keys across all locales: ${allKeys.size}`);

  if (allMatch) {
    console.log('\n✅ ALL LOCALES COMPLETE — all 6 locales have identical key sets.\n');
    process.exit(0);
  } else {
    console.log('\n❌ TRANSLATION COMPLETENESS ISSUES DETECTED.\n');
    process.exit(1);
  }
}

main();
