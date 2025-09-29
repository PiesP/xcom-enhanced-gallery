import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface UsageEntry {
  readonly file: string;
  readonly apis: readonly string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_DIR = join(__dirname, '../../src');

const EXPECTED_INVENTORY: readonly UsageEntry[] = [];

describe('FRAME-ALT-001 Stage D readiness — Preact API usage inventory', () => {
  it('reports zero modules using Preact vendor wrappers', () => {
    const found = collectPreactUsage(SRC_DIR);
    expect(found).toEqual(EXPECTED_INVENTORY);
  });
});

function collectPreactUsage(sourceDir: string): UsageEntry[] {
  const results: UsageEntry[] = [];

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const fullPath = join(sourceDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectPreactUsage(fullPath));
      continue;
    }

    if (!/\.(ts|tsx)$/.test(entry.name)) {
      continue;
    }

    const text = readFileSync(fullPath, 'utf-8');
    const matches = new Set<string>();
    const regex = /getPreact(?:Hooks|Signals|Compat)?/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      matches.add(match[0]);
    }

    if (matches.size === 0) {
      continue;
    }

    const normalized = fullPath.replace(/\\/g, '/');
    const relative = normalized.slice(normalized.indexOf('/src/'));

    results.push({
      file: relative,
      apis: Array.from(matches).sort(),
    });
  }

  results.sort((a, b) => a.file.localeCompare(b.file));
  return results;
}
