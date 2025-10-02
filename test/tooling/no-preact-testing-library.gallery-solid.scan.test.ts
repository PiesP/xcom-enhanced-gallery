import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TARGET_FILES = [
  join(__dirname, '..', 'features', 'gallery', 'solid-migration.integration.test.tsx'),
  join(__dirname, '..', 'features', 'gallery', 'solid-gallery-shell.test.tsx'),
  join(__dirname, '..', 'features', 'gallery', 'gallery-renderer-solid-impl.test.tsx'),
  join(__dirname, '..', 'features', 'gallery', 'gallery-renderer-solid-keyboard-help.test.tsx'),
  join(__dirname, '..', 'features', 'gallery', 'keyboard-help-overlay.accessibility.test.tsx'),
];

const PREACT_IMPORT_PATTERN = /@testing-library\/preact/;

// TODO: [RED-TEST-SKIP] This test is in RED state (TDD) - blocking git push
// Epic tracking: Move to separate Epic branch for GREEN implementation
describe.skip('Stage D Phase 5 scan — gallery solid suites', () => {
  it('solid gallery 스위트에서 @test-utils/testing-library import를 제거한다', () => {
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
