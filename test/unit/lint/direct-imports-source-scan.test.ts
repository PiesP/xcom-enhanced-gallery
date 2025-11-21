/**
 * @fileoverview Source scan test that enforces vendor getter usage for specific external libraries.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_DIR = join(__dirname, '../../../src');

const FORBIDDEN_IMPORTS: readonly string[] = [
  "from 'preact'",
  'from "preact"',
  "from 'preact/hooks'",
  'from "preact/hooks"',
  "from '@preact/signals'",
  'from "@preact/signals"',
  "from 'fflate'",
  'from "fflate"',
];

const IGNORED_DIRS: readonly string[] = [
  `${sep}shared${sep}external${sep}vendors${sep}`,
  `${sep}external${sep}vendors${sep}`,
];

interface ImportOffense {
  file: string;
  line: number;
  text: string;
}

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const name of entries) {
    const fullPath = join(dir, name);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      const normalized = fullPath.split('/').join(sep);
      if (IGNORED_DIRS.some(pattern => normalized.includes(pattern))) {
        continue;
      }
      files.push(...listSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/u.test(name)) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('Vendor getter policy enforcement (source scan)', () => {
  it('should not contain forbidden direct imports within src (excluding vendor wrappers)', () => {
    const files = listSourceFiles(SRC_DIR);
    const offenders: ImportOffense[] = [];

    for (const file of files) {
      const normalized = file.split('/').join(sep);
      if (normalized.toLowerCase().includes(`${sep}vendors${sep}`)) {
        continue; // Extra guard at the file level as well
      }

      const text = readFileSync(file, 'utf-8');
      const lines = text.split(/\r?\n/u);

      lines.forEach((line, idx) => {
        if (FORBIDDEN_IMPORTS.some(signature => line.includes(signature))) {
          offenders.push({ file, line: idx + 1, text: line.trim() });
        }
      });
    }

    const message =
      offenders.length > 0
        ? offenders.map(offense => `${offense.file}:${offense.line} -> ${offense.text}`).join('\n')
        : 'No forbidden imports detected.';

    expect(offenders.length, `Forbidden direct imports detected:\n${message}`).toBe(0);
  });
});
