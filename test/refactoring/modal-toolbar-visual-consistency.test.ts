/**
 * TDD Red Test: Modal-Toolbar Visual Consistency
 * @description 설정 모달과 툴바의 시각적 일관성을 검증하는 테스트
 * 포커스 링, 애니메이션, (이제 제거된) 고대비 모드 흐름을 점검
 */
import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';

// 공통 경로 상수
const DESIGN_TOKENS_PATH = 'src/shared/styles/design-tokens.semantic.css';
const TOOLBAR_CSS_PATH = 'src/shared/components/ui/Toolbar/Toolbar.module.css';
const SETTINGS_MODAL_CSS_PATH = 'src/shared/components/ui/SettingsModal/SettingsModal.module.css';

describe('Modal-Toolbar Visual Consistency', () => {
  setupGlobalTestIsolation();

  function read(path) {
    return readFileSync(path, 'utf-8');
  }

  describe('Focus Ring Consistency', () => {
    it('design-tokens.css에 공통 focus ring 유틸리티 클래스가 정의되어야 함', () => {
      const tokensCSS = read(DESIGN_TOKENS_PATH);

      // .xeg-focus-ring 클래스가 정의되어 있어야 함
      expect(
        tokensCSS.includes('.xeg-focus-ring'),
        'xeg-focus-ring 유틸리티 클래스가 정의되지 않음'
      ).toBe(true);

      // focus-visible 상태 정의 확인
      expect(
        tokensCSS.includes('.xeg-focus-ring:focus-visible'),
        'focus-visible 상태가 정의되지 않음'
      ).toBe(true);
    });

    it('SettingsModal의 interactive 요소들이 공통 focus ring을 사용해야 함', () => {
      const modalCSS = read(SETTINGS_MODAL_CSS_PATH);

      // closeButton과 select가 focus 스타일을 가져야 함
      const hasFocusStyles = modalCSS.includes(':focus') || modalCSS.includes('focus-visible');
      expect(hasFocusStyles, 'SettingsModal 요소들에 focus 스타일이 없음').toBe(true);
    });
  });

  describe('Animation Consistency', () => {
    it('design-tokens.css에 공통 애니메이션 토큰과 키프레임이 정의되어야 함', () => {
      const tokensCSS = read(DESIGN_TOKENS_PATH);

      // 애니메이션 지속시간 토큰
      expect(
        tokensCSS.includes('--xeg-anim-duration') || tokensCSS.includes('--xeg-duration'),
        '애니메이션 지속시간 토큰이 정의되지 않음'
      ).toBe(true);

      // 애니메이션 easing 토큰
      expect(
        tokensCSS.includes('--xeg-anim-ease') || tokensCSS.includes('--xeg-easing'),
        '애니메이션 easing 토큰이 정의되지 않음'
      ).toBe(true);
    });

    it('중복 애니메이션 키프레임이 제거되어야 함', () => {
      const tokensCSS = read(DESIGN_TOKENS_PATH);
      const modalCSS = read(SETTINGS_MODAL_CSS_PATH);

      // slideIn과 fadeIn 중복 체크
      const slideInCount = (modalCSS.match(/slideIn/g) || []).length;
      const fadeInCount = (modalCSS.match(/fadeIn/g) || []).length;

      // 하나의 일관된 애니메이션만 사용해야 함
      expect(
        slideInCount === 0 || fadeInCount === 0,
        'slideIn과 fadeIn 애니메이션이 중복으로 사용됨'
      ).toBe(true);
    });

    it('모든 컴포넌트가 공통 애니메이션 토큰을 사용해야 함', () => {
      const modalCSS = read(SETTINGS_MODAL_CSS_PATH);
      const toolbarCSS = read(TOOLBAR_CSS_PATH);

      // CSS 변수를 사용한 애니메이션 지속시간 확인
      const modalUsesVariables = modalCSS.includes('var(--xeg-') && modalCSS.includes('transition');
      const toolbarUsesVariables =
        toolbarCSS.includes('var(--xeg-') && toolbarCSS.includes('transition');

      expect(modalUsesVariables, 'SettingsModal이 CSS 변수 기반 애니메이션을 사용하지 않음').toBe(
        true
      );
      expect(toolbarUsesVariables, 'Toolbar가 CSS 변수 기반 애니메이션을 사용하지 않음').toBe(true);
    });
  });

  describe('High Contrast Mode Removal', () => {
    it('고대비 모드 전용 미디어 쿼리가 컴포넌트에서 제거되어야 함', () => {
      const modalCSS = read(SETTINGS_MODAL_CSS_PATH);
      const toolbarCSS = read(TOOLBAR_CSS_PATH);

      const modalHasHighContrast =
        modalCSS.includes('prefers-contrast: high') || modalCSS.includes('highContrast');
      const toolbarHasHighContrast =
        toolbarCSS.includes('prefers-contrast: high') || toolbarCSS.includes('highContrast');

      expect(modalHasHighContrast || toolbarHasHighContrast).toBe(false);
    });
  });

  describe('Elevation and Shadow Consistency', () => {
    it('공통 elevation 토큰이 정의되어야 함', () => {
      const tokensCSS = read(DESIGN_TOKENS_PATH);

      // 여러 레벨의 elevation 토큰 확인
      const elevationTokens = ['--xeg-shadow-sm', '--xeg-shadow-md', '--xeg-shadow-lg'];

      elevationTokens.forEach(token => {
        expect(tokensCSS.includes(token), `${token} elevation 토큰이 정의되지 않음`).toBe(true);
      });
    });

    it('하드코딩된 box-shadow 값이 제거되고 토큰을 사용해야 함', () => {
      const modalCSS = read(SETTINGS_MODAL_CSS_PATH);
      const toolbarCSS = read(TOOLBAR_CSS_PATH);

      // 하드코딩된 box-shadow 검사 (rgba 값 직접 사용)
      const modalHardcodedShadow =
        modalCSS.includes('box-shadow:') &&
        modalCSS.includes('rgba(') &&
        !modalCSS.includes('var(--xeg-shadow');
      const toolbarHardcodedShadow =
        toolbarCSS.includes('box-shadow:') &&
        toolbarCSS.includes('rgba(') &&
        !toolbarCSS.includes('var(--xeg-shadow');

      expect(!modalHardcodedShadow, 'SettingsModal에 하드코딩된 box-shadow 값이 있음').toBe(true);
      expect(!toolbarHardcodedShadow, 'Toolbar에 하드코딩된 box-shadow 값이 있음').toBe(true);
    });
  });

  describe('Reduced Motion Support', () => {
    it('모든 컴포넌트가 reduced motion을 지원해야 함', () => {
      const tokensCSS = read(DESIGN_TOKENS_PATH);
      const modalCSS = read(SETTINGS_MODAL_CSS_PATH);
      const toolbarCSS = read(TOOLBAR_CSS_PATH);

      // prefers-reduced-motion 미디어 쿼리 확인
      const hasReducedMotionSupport =
        tokensCSS.includes('prefers-reduced-motion') ||
        modalCSS.includes('prefers-reduced-motion') ||
        toolbarCSS.includes('prefers-reduced-motion');

      expect(hasReducedMotionSupport, 'reduced motion 지원이 구현되지 않음').toBe(true);
    });
  });

  describe('Z-Index Layer Management', () => {
    it('z-index 값이 토큰으로 관리되어야 함', () => {
      const tokensCSS = read(DESIGN_TOKENS_PATH);
      const modalCSS = read(SETTINGS_MODAL_CSS_PATH);
      const toolbarCSS = read(TOOLBAR_CSS_PATH);

      // z-index 토큰 정의 확인
      expect(
        tokensCSS.includes('--xeg-z-modal') && tokensCSS.includes('--xeg-z-toolbar'),
        'z-index 토큰이 정의되지 않음'
      ).toBe(true);

      // 하드코딩된 z-index 사용 검사
      const modalUsesZToken = modalCSS.includes('var(--xeg-z-');
      const toolbarUsesZToken = toolbarCSS.includes('var(--xeg-z-');

      expect(modalUsesZToken, 'SettingsModal이 z-index 토큰을 사용하지 않음').toBe(true);
      expect(toolbarUsesZToken, 'Toolbar가 z-index 토큰을 사용하지 않음').toBe(true);
    });
  });
});
