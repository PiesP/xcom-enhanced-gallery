/* eslint @typescript-eslint/no-unused-vars: off */
// Generalized Barrel Export Hygiene (TDD)
// 목표: src/shared 하위의 모든 index.ts 배럴에서 '@shared/*' 대상으로의
//  - 와일드카드 재수출(`export * from '...';`)
//  - default 재수출(`export { default } from '...';`)
// 을 금지한다. (명시적 named re-export는 허용)

import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import { resolve, sep } from 'node:path';

async function collectIndexTs(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = resolve(dir, e.name);
    if (e.isDirectory()) {
      await collectIndexTs(full, acc);
    } else if (e.isFile() && full.endsWith(`${sep}index.ts`)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('Barrel Export Hygiene (generalized)', () => {
  it("shared barrels must not wildcard/default re-export from '@shared/*'", async () => {
    const root = process.cwd();
    const sharedRoot = resolve(root, 'src', 'shared');
    const indexFiles = await collectIndexTs(sharedRoot);

    const violations: Array<{ file: string; line: number; code: string }> = [];
    const wildcardRe = /export\s*\*\s*from\s*['"](@shared\/[^'"\n]+)['"];?/;
    const defaultRe = /export\s*\{\s*default\s*\}\s*from\s*['"](@shared\/[^'"\n]+)['"];?/;

    for (const file of indexFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split(/\r?\n/);
      lines.forEach((l, i) => {
        if (wildcardRe.test(l) || defaultRe.test(l)) {
          violations.push({ file, line: i + 1, code: l.trim() });
        }
      });
    }

    if (violations.length) {
      // 디버그 출력을 돕기 위해 콘솔에 위반 목록을 남김
      console.warn('❌ Generalized barrel hygiene violations:', violations);
    }

    expect(violations.length).toBe(0);
  });
});
