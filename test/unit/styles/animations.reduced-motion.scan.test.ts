/**
 * Guard: Every CSS file that declares animations must include a reduced-motion media query.
 * Policy: If a file contains `@keyframes` or `animation:` declarations, it must also contain
 * `@media (prefers-reduced-motion: reduce)` within the same file.
 *
 * Rationale: Accessibility — respect user preference for reduced motion at the source.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { cwd } from 'node:process';

function walk(dir: string): string[] {
  return readdirSync(dir)
    .flatMap(name => {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) return walk(p);
      return [p];
    })
    .filter(Boolean);
}

function isCss(file: string) {
  return extname(file) === '.css';
}

describe('CSS reduced-motion static scan', () => {
  it('All animation-declaring CSS files have a reduced-motion guard', () => {
    const root = join(cwd(), 'src');
    const files = walk(root).filter(isCss);

    const offenders: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const hasAnimation = /@keyframes|\banimation\s*:/m.test(content);
      if (!hasAnimation) continue;

      const hasReducedMotion = /@media\s*\(prefers-reduced-motion:\s*reduce\)/m.test(content);
      if (!hasReducedMotion) {
        offenders.push(file.replace(cwd() + '\\', ''));
      }
    }

    expect(offenders, `Files missing reduced-motion guard:\n${offenders.join('\n')}`).toEqual([]);
  });
});
