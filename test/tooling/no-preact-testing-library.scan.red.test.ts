/**
 * @fileoverview RED scan ensuring @test-utils/testing-library is fully removed.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..', '..');
const TARGET_DIRECTORIES = ['src', 'test'];
const PREACT_TESTING_LIBRARY_IDENTIFIER = '@testing-library/preact';

interface Offender {
  readonly file: string;
  readonly line: number;
  readonly content: string;
}

describe('FRAME-ALT-001 Stage D Phase 5 — @testing-library/preact usage scan (RED)', () => {
  it('fails while modules still import @testing-library/preact', () => {
    const offenders: Offender[] = [];

    for (const dir of TARGET_DIRECTORIES) {
      const root = join(ROOT_DIR, dir);
      scanDirectory(root, offenders);
    }

    const message = offenders
      .map(offender => `${offender.file}:${offender.line} -> ${offender.content}`)
      .join('\n');

    expect(offenders.length, `@testing-library/preact usage detected:\n${message}`).toBe(0);
  });
});

function scanDirectory(directory: string, offenders: Offender[]): void {
  const entries = readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      scanDirectory(entryPath, offenders);
      continue;
    }

    if (!/\.(c|m)?[tj]sx?$/.test(entry.name) || entry.name.endsWith('.d.ts')) {
      continue;
    }

    const content = readFileSync(entryPath, 'utf-8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (line.includes(PREACT_TESTING_LIBRARY_IDENTIFIER)) {
        offenders.push({
          file: entryPath,
          line: index + 1,
          content: line.trim(),
        });
      }
    });
  }
}
