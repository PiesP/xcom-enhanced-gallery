import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function listFilesRecursive(dir: string): string[] {
  try {
    if (!statSync(dir)) return [] as any;
  } catch {
    return [] as any;
  }
  const stack: string[] = [dir];
  const files: string[] = [];
  while (stack.length) {
    const cur = stack.pop()!;
    const entries = readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const p = join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (/\.(ts|tsx)$/.test(p)) files.push(p.replace(/\\/g, '/'));
    }
  }
  return files;
}

describe('Utils → Services boundary policy', () => {
  it('must not import from services in src/shared/utils/**', () => {
    const files = listFilesRecursive('src/shared/utils');
    const offenders: string[] = [];
    for (const f of files) {
      const content = readFileSync(f, 'utf8');
      // disallow imports like from '../services/..' or '@shared/services/..'
      const hasBad =
        /from\s+['"](\.\.\/)+services\//.test(content) ||
        /from\s+['"]@shared\/services\//.test(content);
      if (hasBad) offenders.push(f);
    }
    expect(
      offenders,
      'utils 레이어에서 services로의 import 금지(경계 위반). 필요한 경우 service-accessors 경유.'
    ).toEqual([]);
  });
});
