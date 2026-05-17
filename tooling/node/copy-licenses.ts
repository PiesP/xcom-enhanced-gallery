/**
 * Post-build script: copies license files to dist/.
 *
 * Replaces the former license-assets Vite plugin.
 * Runs after Vite build to ensure license files are present in the output.
 */

import {
  copyFileSync,
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const DIST = resolve(ROOT, 'dist');
const LICENSES_DIR = resolve(ROOT, 'LICENSES');
const PROJECT_LICENSE = resolve(ROOT, 'LICENSE');

// Copy project LICENSE
if (existsSync(PROJECT_LICENSE)) {
  copyFileSync(PROJECT_LICENSE, resolve(DIST, 'LICENSE'));
}

// Copy third-party licenses directory
if (existsSync(LICENSES_DIR)) {
  const dest = resolve(DIST, 'LICENSES');
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  cpSync(LICENSES_DIR, dest, { recursive: true });
}

// Generate combined LICENSES.txt
const lines: string[] = [];

if (existsSync(PROJECT_LICENSE)) {
  lines.push('X.com Enhanced Gallery License');
  lines.push('==============================');
  lines.push('');
  lines.push(readFileSync(PROJECT_LICENSE, 'utf8').trim());
  lines.push('');
}

if (existsSync(LICENSES_DIR)) {
  const entries = readdirSync(LICENSES_DIR).filter(
    (f) => /\.(txt|md)$/i.test(f) && !/xcom-enhanced-gallery/i.test(f)
  );
  if (entries.length > 0) {
    lines.push('Third-Party Licenses');
    lines.push('====================');
    lines.push('');
    for (const file of entries.sort()) {
      const content = readFileSync(resolve(LICENSES_DIR, file), 'utf8').trim();
      const title = file.replace(/\.(txt|md)$/i, '');
      lines.push(`${title} (${file})`);
      lines.push('-'.repeat(title.length + file.length + 2));
      lines.push('');
      lines.push(content);
      lines.push('');
      lines.push('');
    }
  }
}

writeFileSync(resolve(DIST, 'LICENSES.txt'), `${lines.join('\n').trimEnd()}\n`, 'utf8');
console.log('📄 License files copied to dist/');
