import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

/**
 * Modal Token Hardening Test
 * 목적: 다크 모드 회귀(design-tokens.css 재정의로 semantic 토큰 덮어쓰기) 방지.
 * 가드:
 *  1) design-tokens.css 에 --xeg-modal-bg / --xeg-modal-border 변수 재정의(할당) 금지
 *  2) semantic 파일에 light/dark/base 변형 토큰 존재
 *  3) 다크 테마 블록(data-theme='dark')에 rgba(20,20,20,0.98) / rgba(255,255,255,0.15) 정의
 *  4) SettingsModal.module.css 가 background: var(--xeg-modal-bg) 사용
 */

describe('Modal Token Hardening', () => {
  const designTokensCss = readFileSync('src/shared/styles/design-tokens.css', 'utf-8');
  const semanticCss = readFileSync('src/shared/styles/design-tokens.semantic.css', 'utf-8');
  const settingsModalCss = readFileSync(
    'src/shared/components/ui/SettingsModal/SettingsModal.module.css',
    'utf-8'
  );

  it('design-tokens.css MUST NOT reassign --xeg-modal-(bg|border)', () => {
    const reassignmentPattern = /--xeg-modal-(bg|border)\s*:/g; // real variable assignment
    const matches = designTokensCss.match(reassignmentPattern) || [];
    expect(matches.length).toBe(0);
  });

  it('semantic tokens define light/dark modal background & border variants', () => {
    expect(semanticCss).toMatch(/--xeg-modal-bg-light\s*:/);
    expect(semanticCss).toMatch(/--xeg-modal-bg-dark\s*:/);
    expect(semanticCss).toMatch(/--xeg-modal-border-light\s*:/);
    expect(semanticCss).toMatch(/--xeg-modal-border-dark\s*:/);
  });

  it('at least one dark theme block provides concrete rgba values for modal bg & border', () => {
    const darkBlocks = [...semanticCss.matchAll(/\[data-theme='dark']\s*{[^}]*}/g)].map(m => m[0]);
    expect(darkBlocks.length, 'no dark theme blocks found').toBeGreaterThan(0);
    const hasModalBg = darkBlocks.some(b =>
      /--xeg-modal-bg:\s*rgba\(20,\s*20,\s*20,\s*0\.98\)/.test(b)
    );
    const hasModalBorder = darkBlocks.some(b =>
      /--xeg-modal-border:\s*rgba\(255,\s*255,\s*255,\s*0\.15\)/.test(b)
    );
    expect(hasModalBg, 'no dark block defines --xeg-modal-bg expected rgba value').toBe(true);
    expect(hasModalBorder, 'no dark block defines --xeg-modal-border expected rgba value').toBe(
      true
    );
  });

  it('SettingsModal.module.css uses semantic modal background token', () => {
    expect(settingsModalCss).toMatch(/background:\s*var\(--xeg-modal-bg\)/);
  });
});
