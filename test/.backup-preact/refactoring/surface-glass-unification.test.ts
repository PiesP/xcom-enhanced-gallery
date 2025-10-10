/**
 * TDD Red Test: Surface Glass Token Unification
 * @description Toolbar와 SettingsModal 이 공통 글래스 토큰(--xeg-surface-glass-*) 과 semantic surface/background 토큰을 사용하도록 강제.
 * 정책 변경: Toolbar는 component alias(--xeg-comp-toolbar-*) 대신 semantic(--xeg-bg-toolbar)을 사용해야 함.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// 공통 경로 상수
const DESIGN_TOKENS_PATH = 'src/shared/styles/design-tokens.css';
const TOOLBAR_CSS_PATH = 'src/shared/components/ui/Toolbar/Toolbar.module.css';
const SETTINGS_MODAL_CSS_PATH = 'src/shared/components/ui/SettingsModal/SettingsModal.module.css';

/** 기대 사항 (Green 목표)
 * 1. design-tokens.css 에 --xeg-surface-glass-{bg,border,blur,shadow} 토큰이 정의되어야 한다.
 * 2. Toolbar CSS 는 개별 glass 속성 직접 정의 대신 semantic background 토큰 --xeg-bg-toolbar 를 사용한다.
 * 3. SettingsModal CSS 는 --xeg-modal-bg semantic 토큰을 사용한다.
 * 4. Deprecated component alias 토큰(--xeg-comp-toolbar-bg 등)은 Toolbar.module.css 내에서 사용되지 않는다.
 */

describe('Surface Glass Token Unification', () => {
  const requiredSurfaceTokens = [
    '--xeg-surface-glass-bg',
    '--xeg-surface-glass-border',
    '--xeg-surface-glass-blur',
    '--xeg-surface-glass-shadow',
  ];

  function read(p) {
    return readFileSync(p, 'utf-8');
  }

  it('design-tokens.css 에 surface 글래스 토큰이 정의되어야 함', () => {
    const tokensCSS = read(DESIGN_TOKENS_PATH);
    requiredSurfaceTokens.forEach(token => {
      expect(tokensCSS.includes(token), `${token} 토큰이 정의되지 않음`).toBe(true);
    });
  });

  it('Toolbar CSS 는 semantic 토큰을 사용하고 개별 glassmorphism 속성을 제거해야 함', () => {
    const toolbarCSS = read(TOOLBAR_CSS_PATH);
    // galleryToolbar 블록 추출
    const toolbarBlockMatch = toolbarCSS.match(/\.galleryToolbar\s*{[\s\S]*?}/);
    expect(toolbarBlockMatch, 'galleryToolbar block not found').not.toBeNull();
    const toolbarBlock = toolbarBlockMatch ? toolbarBlockMatch[0] : '';

    // semantic background 토큰 사용 확인
    expect(
      toolbarBlock.includes('var(--xeg-bg-toolbar)'),
      'Toolbar should use semantic bg token'
    ).toBe(true);
    // component alias 미사용 확인
    expect(
      toolbarBlock.includes('--xeg-comp-toolbar-bg'),
      'Toolbar should not use component alias bg token'
    ).toBe(false);
  });

  it('SettingsModal CSS 는 semantic modal 토큰을 사용하고 개별 glassmorphism 속성을 제거해야 함', () => {
    const modalCSS = read(SETTINGS_MODAL_CSS_PATH);
    // semantic modal bg 토큰 사용
    expect(
      modalCSS.includes('var(--xeg-modal-bg)'),
      'SettingsModal should use semantic modal bg token'
    ).toBe(true);
    // component alias 미사용 (허용: design tokens 파일 내부 정의)
    expect(
      modalCSS.includes('--xeg-comp-modal-bg'),
      'SettingsModal should not use component alias modal bg token'
    ).toBe(false);
  });
});
