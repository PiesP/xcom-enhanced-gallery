import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_DIR = join(__dirname, '..', '..', 'src');

const IGNORED_SEGMENTS = [
  `${sep}shared${sep}external${sep}vendors${sep}`,
  `${sep}external${sep}vendors${sep}`,
];

const DYNAMIC_PREACT_PATTERNS = [/require\(['"]@?preact/, /import\(['"]@?preact/];

function shouldIgnore(filePath: string): boolean {
  const normalized = filePath.split('/').join(sep);
  return IGNORED_SEGMENTS.some(segment => normalized.includes(segment));
}

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!shouldIgnore(fullPath)) {
        files.push(...listSourceFiles(fullPath));
      }
      continue;
    }

    if (/\.(ts|tsx|js|jsx|mts|cts)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('no-preact-usage scan', () => {
  it('동적 import/require로 preact 계열 모듈을 직접 참조하지 않는다', () => {
    const sourceFiles = listSourceFiles(SRC_DIR);
    const offenders: Array<{ file: string; line: number; content: string }> = [];

    for (const file of sourceFiles) {
      const normalized = file.split('/').join(sep);
      if (shouldIgnore(normalized)) continue;

      const text = readFileSync(file, 'utf-8');
      const lines = text.split(/\r?\n/);

      lines.forEach((line, index) => {
        if (DYNAMIC_PREACT_PATTERNS.some(pattern => pattern.test(line))) {
          offenders.push({ file, line: index + 1, content: line.trim() });
        }
      });
    }

    const message = offenders
      .map(offender => `${offender.file}:${offender.line} -> ${offender.content}`)
      .join('\n');

    expect(offenders.length, `preact 동적 참조 발견:\n${message}`).toBe(0);
  });
});
