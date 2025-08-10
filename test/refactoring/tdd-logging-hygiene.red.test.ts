/**
 * 🔴 TDD Phase 1: Logging Hygiene - RED
 * 목표: src 전체에서 직접 console 사용을 0건으로 만든다.
 * 허용 예외: 통합 로거 내부 구현 파일(shared/logging/unified-logger.ts)만 허용
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

type Offense = { file: string; line: number; code: string };

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

function isTsSource(file: string): boolean {
  return (file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.d.ts');
}

function walk(dir: string, acc: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      // skip common non-source folders
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
      walk(p, acc);
    } else if (isTsSource(p)) {
      acc.push(p);
    }
  }
  return acc;
}

function findDirectConsoleUsages(files: string[]): Offense[] {
  const ALLOWED = new Set([
    path.normalize(path.join('src', 'shared', 'logging', 'unified-logger.ts')),
  ]);

  const offenders: Offense[] = [];
  const consolePattern = /\bconsole\.(?:log|info|warn|error)\s*\(/;

  for (const file of files) {
    const rel = path.normalize(path.relative(ROOT, file));
    if (ALLOWED.has(rel)) continue;

    const content = fs.readFileSync(file, 'utf8');
    // quick skip to avoid scanning large files that clearly don't contain console.
    if (!content.includes('console.')) continue;

    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      // ignore commented lines to reduce false positives
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
      if (consolePattern.test(line)) {
        offenders.push({ file: rel, line: idx + 1, code: line.trim() });
      }
    });
  }
  return offenders;
}

describe('🔴 TDD: Logging hygiene (no direct console usage in src)', () => {
  it('src 내 직접 console 사용이 없어야 한다 (unified-logger.ts 제외)', () => {
    const files = walk(SRC_DIR);
    const offenders = findDirectConsoleUsages(files);

    const helpful = offenders.map(o => ` - ${o.file}:${o.line} -> ${o.code}`).join('\n');

    expect(offenders, `직접 console 사용 발견:\n${helpful}`)['toHaveLength'](0);
  });
});
