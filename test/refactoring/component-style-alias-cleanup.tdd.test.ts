import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
/* eslint-disable no-unused-vars */

type PathFilter = (path: string) => boolean;

function listFilesRecursive(dir: string, filter: PathFilter): string[] {
  const out: string[] = [];
  const entries = readdirSync(dir);
  for (const e of entries) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...listFilesRecursive(p, filter));
    else if (filter(p)) out.push(p);
  }
  return out;
}

describe('Phase 3: Component styles should avoid legacy alias tokens', () => {
  it('should not use --xeg-color-border-light in component CSS (use --xeg-border-light)', () => {
    const base = join(process.cwd(), 'src', 'features');
    const files = listFilesRecursive(base, p => p.endsWith('.css'));
    const offenders: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      if (text.includes('var(--xeg-color-border-light)'))
        offenders.push(f.replace(process.cwd() + '\\', ''));
    }
    expect(offenders).toEqual([]);
  });
});
