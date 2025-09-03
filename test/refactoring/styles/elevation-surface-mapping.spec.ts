import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import * as path from 'path';

/**
 * GREEN: Elevation data-surface-level 매핑 검증 (Phase22)
 * data-surface="base|muted|elevated|overlay|modal" 선택자 존재 및
 * 각 블록이 최소 background / border / box-shadow 선언 포함.
 */

describe('Phase22: elevation surface attribute mapping', () => {
  it('defines attribute selectors mapping surface levels to tokens', () => {
    const root = (globalThis as any).process?.cwd?.() ?? '';
    const file = path.join(root, 'src', 'shared', 'styles', 'design-tokens.css');
    const css = readFileSync(file, 'utf8');

    const selectors = ['base', 'muted', 'elevated', 'overlay', 'modal'];
    for (const s of selectors) {
      const blockRx = new RegExp(`\\[data-surface=['"]${s}['"]\\]\\s*\\{[^}]+\\}`, 'g');
      const match = css.match(blockRx);
      expect(match, `missing selector for ${s}`).toBeTruthy();
      const snippet = match![0];
      expect(snippet).toMatch(/background:/);
      expect(snippet).toMatch(/border:/);
      expect(snippet).toMatch(/box-shadow:/);
    }
  });
});
