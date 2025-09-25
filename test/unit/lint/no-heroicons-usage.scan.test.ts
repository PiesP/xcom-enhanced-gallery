import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_DIR = join(__dirname, '../../../src');

const FORBIDDEN_IMPORT_SEGMENTS = [
  '@shared/external/vendors/heroicons-react',
  '@heroicons/react/24/outline',
  '@heroicons/react/24/solid',
  '@heroicons/react',
];

const FORBIDDEN_DYNAMIC_SEGMENTS = ['@shared/components/ui/Icon/hero/'];

const IGNORED_DIRECTORIES = new Set([`${sep}.git`, `${sep}node_modules`]);

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const name of entries) {
    const full = join(dir, name);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      const normalized = full.split('/').join(sep);
      if (Array.from(IGNORED_DIRECTORIES).some(p => normalized.includes(p))) continue;
      files.push(...listSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(name)) {
      files.push(full);
    }
  }
  return files;
}

describe('Heroicons vendor usage 스캔', () => {
  it('소스 코드에서 Heroicons vendor 어댑터나 패키지를 더 이상 참조하지 않는다', () => {
    const offenders: Array<{ file: string; line: number; text: string }> = [];
    const sourceFiles = listSourceFiles(SRC_DIR);

    for (const file of sourceFiles) {
      const contents = readFileSync(file, 'utf-8');
      const lines = contents.split(/\r?\n/);

      lines.forEach((line, index) => {
        if (
          FORBIDDEN_IMPORT_SEGMENTS.some(segment => line.includes(segment)) ||
          FORBIDDEN_DYNAMIC_SEGMENTS.some(segment => line.includes(segment))
        ) {
          offenders.push({ file, line: index + 1, text: line.trim() });
        }
      });
    }

    const message = offenders
      .map(offender => `${offender.file}:${offender.line} -> ${offender.text}`)
      .join('\n');

    expect(offenders.length, `허용되지 않는 Heroicons 참조 발견:\n${message}`).toBe(0);
  });
});
