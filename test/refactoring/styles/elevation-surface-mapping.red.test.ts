import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import * as path from 'path';

/**
 * RED: Elevation data-surface-level 매핑 테스트 (Phase22)
 * 목표: data-surface="base|muted|elevated|overlay|modal" 속성을 가진 요소에
 * 대응하는 표면 토큰 변수들이 CSS로 선언되어야 함.
 * 현재 design-tokens.css 에 해당 attribute selector 블록이 없으므로 실패 예상.
 */

describe('Phase22: elevation surface attribute mapping (RED)', () => {
  it('should define attribute selectors mapping data-surface levels to surface tokens', () => {
    const root = (globalThis as any).process?.cwd?.() ?? '';
    const file = path.join(root, 'src', 'shared', 'styles', 'design-tokens.css');
    const css = readFileSync(file, 'utf8');

    const required: Array<[string, RegExp]> = [
      ['base', /\[data-surface=['"]base['"]\]\s*\{/],
      ['muted', /\[data-surface=['"]muted['"]\]\s*\{/],
      ['elevated', /\[data-surface=['"]elevated['"]\]\s*\{/],
      ['overlay', /\[data-surface=['"]overlay['"]\]\s*\{/],
      ['modal', /\[data-surface=['"]modal['"]\]\s*\{/],
    ];

    const missing = required.filter(([, rx]) => !rx.test(css)).map(r => r[0]);

    // RED 단계: 아직 selector 들이 없으므로 missing.length > 0 예상 → 실패시 GREEN으로 전환 후 수정
    expect(missing).toEqual([]);
  });
});
