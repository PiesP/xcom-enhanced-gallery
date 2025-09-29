import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TARGET_FILES = [
  join(__dirname, '..', 'unit', 'features', 'gallery', 'keyboard-help.overlay.test.tsx'),
  join(__dirname, '..', 'unit', 'features', 'gallery', 'keyboard-help.aria.test.tsx'),
];

const PREACT_IMPORT_PATTERN = /@testing-library\/preact/;

describe('Stage D Phase 5 scan — keyboard help tests', () => {
  it('keyboard help overlay 테스트에서 @test-utils/testing-library import를 사용하지 않는다', () => {
    const offenders: Array<{ file: string; line: number; content: string }> = [];

    for (const filePath of TARGET_FILES) {
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

    expect(offenders.length, `@test-utils/testing-library import 발견:\n${message}`).toBe(0);
  });
});
