/**
 * TDD Red Test: Surface Glass Token Unification
 * @description Toolbar와 SettingsModal 이 공통 글래스 토큰(--xeg-surface-glass-*)을 사용하도록 강제.
 * 현재 구현은 각각 --xeg-toolbar-glass-* 토큰을 직접 참조하므로 이 테스트는 실패(Red)해야 함.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// 공통 경로 상수
const DESIGN_TOKENS_PATH = 'src/shared/styles/design-tokens.css';
const TOOLBAR_CSS_PATH = 'src/shared/components/ui/Toolbar/Toolbar.module.css';
const SETTINGS_MODAL_CSS_PATH = 'src/shared/components/ui/SettingsModal/SettingsModal.module.css';

/** 기대 사항 (Green 목표)
 * 1. design-tokens.css 에 --xeg-surface-glass-{bg,border,blur,shadow} 토큰이 정의되어야 한다.
 * 2. Toolbar / SettingsModal CSS는 --xeg-toolbar-glass-* 직접 참조 대신 --xeg-surface-glass-* 를 사용해야 한다.
 * 3. (선택) 하위 호환 위해 design-tokens.css 에서 toolbar 토큰은 surface 토큰을 재사용하도록 매핑될 수 있다.
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

  it('Toolbar CSS 는 컴포넌트 토큰을 사용하고 개별 glassmorphism 속성을 제거해야 함', () => {
    const toolbarCSS = read(TOOLBAR_CSS_PATH);
    // 새로운 조건: toolbarCSS에서 개별 glassmorphism 속성이 제거되어야 함
    expect(
      toolbarCSS.match(/\.galleryToolbar.*var\(--xeg-surface-glass-bg\)/s),
      'Toolbar에서 개별 glassmorphism 속성이 제거되지 않음'
    ).toBeNull();

    // 대신 컴포넌트 토큰 사용을 확인
    expect(
      toolbarCSS.match(/var\(--xeg-comp-toolbar-bg\)/),
      'Toolbar CSS에서 컴포넌트 토큰을 사용하지 않음'
    ).not.toBeNull();
  });

  it('SettingsModal CSS 는 테마 토큰을 사용하고 개별 glassmorphism 속성을 제거해야 함', () => {
    const modalCSS = read(SETTINGS_MODAL_CSS_PATH);
    expect(
      modalCSS.match(/--xeg-toolbar-glass-bg/),
      'SettingsModal이 아직 toolbar 전용 토큰을 직접 사용'
    ).toBeNull();

    // 개별 glassmorphism 속성이 제거되어야 함
    expect(
      modalCSS.match(/\.modal.*var\(--xeg-surface-glass-bg\)/s),
      'SettingsModal에서 개별 glassmorphism 속성이 제거되지 않음'
    ).toBeNull();

    // 대신 테마 토큰 사용을 확인
    expect(
      modalCSS.match(/var\(--xeg-modal-bg\)/),
      'SettingsModal CSS에서 테마 토큰을 사용하지 않음'
    ).not.toBeNull();
  });
});
