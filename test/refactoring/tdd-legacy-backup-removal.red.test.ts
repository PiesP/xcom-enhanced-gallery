/**
 * 🔴 TDD Phase 1: Legacy/Backup file removal - RED
 * 목표: src 내 *.backup 파일이 존재하지 않아야 한다.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

function walk(dir: string, acc: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
      walk(p, acc);
    } else {
      acc.push(p);
    }
  }
  return acc;
}

describe('🔴 TDD: Legacy/Backup files must be removed', () => {
  it("src 내 '*.backup' 파일이 존재하지 않아야 한다", () => {
    const files = walk(SRC_DIR);
    const backups = files.filter(f => f.endsWith('.backup')).map(f => path.relative(ROOT, f));

    const helpful = backups.map(f => ` - ${f}`).join('\n');
    expect(backups, `백업 파일 발견:\n${helpful}`)['toHaveLength'](0);
  });
});
