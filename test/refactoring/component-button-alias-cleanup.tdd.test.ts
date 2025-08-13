/* eslint-disable no-unused-vars */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

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

describe('Phase 3: Component code should avoid legacy button alias tokens', () => {
  it('should not use --xeg-button-* and --xeg-bg-primary in component CSS', () => {
    const roots = [join(process.cwd(), 'src', 'features')];

    const offenders: string[] = [];
    const legacyPatterns = [
      'var(--xeg-button-bg)',
      'var(--xeg-button-text)',
      'var(--xeg-button-bg-hover)',
      'var(--xeg-bg-primary)',
    ];

    for (const root of roots) {
      const files = listFilesRecursive(root, p => /\.css$/.test(p));
      for (const f of files) {
        // 허용: 디자인 토큰 소스 파일은 제외 (호환성 alias 보관 용도)
        const normalized = f.replace(/\\/g, '/');
        const isDesignTokensSource = /shared\/styles\/design-tokens\.css$/.test(normalized);
        if (isDesignTokensSource) continue;

        const text = readFileSync(f, 'utf8');
        if (legacyPatterns.some(pat => text.includes(pat))) {
          offenders.push(normalized.replace(process.cwd().replace(/\\/g, '/') + '/', ''));
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
