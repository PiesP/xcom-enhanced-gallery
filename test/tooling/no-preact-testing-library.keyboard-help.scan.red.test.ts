import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_ROOT = join(__dirname, '..');
const PREACT_IMPORT_PATTERN = /@testing-library\/preact/;

function collectTestFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }

    if (entry.isFile() && /\.test\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('Stage D Phase 5 scan — 전체 테스트', () => {
  it('모든 테스트에서 @testing-library/preact import를 제거한다 (RED)', () => {
    const offenders: Array<{ file: string; line: number; content: string }> = [];
    const testFiles = collectTestFiles(TEST_ROOT);

    for (const filePath of testFiles) {
      const source = readFileSync(filePath, 'utf-8');
      const lines = source.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (PREACT_IMPORT_PATTERN.test(line)) {
          offenders.push({ file: filePath, line: index + 1, content: line.trim() });
        }
      });
    }

    const message = offenders
      .map(offender => `${offender.file}:${offender.line} -> ${offender.content}`)
      .join('\n');

    expect(offenders.length, `@testing-library/preact import 발견:\n${message}`).toBe(0);
  });
});
