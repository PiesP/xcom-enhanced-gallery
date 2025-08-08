import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Phase 2 (RED): Deprecated glass tokens MUST be removed.
 * 대상:
 *  - --xeg-color-glass-light / medium / dark (alias set)
 *  - --xeg-glass-bg-ultra-dark (unused background)
 *
 * 현재 단계: RED (토큰이 아직 CSS에 존재하므로 실패 -> 제거 후 GREEN 예정)
 */

const DEPRECATED_TOKENS = [
  '--xeg-color-glass-light',
  '--xeg-color-glass-medium',
  '--xeg-color-glass-dark',
  '--xeg-glass-bg-ultra-dark',
];

describe('design-tokens deprecations removal (Phase 2)', () => {
  it('should NOT contain deprecated glass tokens (Phase 2)', () => {
    const cssPath = join(process.cwd(), 'src', 'shared', 'styles', 'design-tokens.css');
    const css = readFileSync(cssPath, 'utf8');
    for (const token of DEPRECATED_TOKENS) {
      const present = css.includes(token + ':');
      expect(present).toBe(false);
    }
  });
});
