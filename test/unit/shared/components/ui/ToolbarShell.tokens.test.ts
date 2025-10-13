/**
 * @fileoverview ToolbarShell 토큰 사용 정책 테스트
 * - box-shadow는 semantic 토큰을 직접 사용해야 함
 * - raw oklch 사용 금지
 * - 컴포넌트 레벨 토큰 재정의 금지 (Phase 54.0)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

describe('ToolbarShell Token Policy', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  function readCSS() {
    const filePath = resolve(
      __dirname,
      '../../../../..',
      'src/shared/components/ui/ToolbarShell/ToolbarShell.module.css'
    );
    return readFileSync(filePath, 'utf-8');
  }

  it('uses semantic shadow token directly (no component-level redefinition)', () => {
    const css = readCSS();
    // Phase 54.0: 컴포넌트 토큰 재정의 금지 - semantic 토큰 직접 사용
    expect(css).toContain('var(--xeg-shadow-md)');
    expect(css).not.toContain('--xeg-comp-toolbar-shadow');
    expect(css).not.toContain('--xeg-toolbar-bg:');
    expect(css).not.toContain('--xeg-toolbar-border:');
  });

  it('does not contain raw oklch shadows', () => {
    const css = readCSS();
    expect(css.includes('oklch(')).toBe(false);
  });
});
