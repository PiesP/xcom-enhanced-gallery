/**
 * TDD Red Test: Toast Animation System Consistency
 * @description Toast 컴포넌트의 애니메이션 시스템을 공통 디자인 토큰과 통합하는 테스트
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// 공통 경로 상수
const DESIGN_TOKENS_PATH = 'src/shared/styles/design-tokens.css';
const TOAST_CSS_PATH = 'src/shared/components/ui/Toast/Toast.module.css';
const TOAST_CONTAINER_CSS_PATH = 'src/shared/components/ui/Toast/ToastContainer.module.css';

describe('Toast Animation System Consistency', () => {
  function read(path) {
    return readFileSync(path, 'utf-8');
  }

  describe('Animation Duplication Removal', () => {
    it('Toast.module.css에서 중복 slideIn 키프레임이 제거되어야 함', () => {
      const toastCSS = read(TOAST_CSS_PATH);

      // slideIn 키프레임이 더 이상 존재하지 않아야 함
      expect(
        toastCSS.includes('@keyframes slideIn'),
        'Toast에서 중복 slideIn 키프레임이 아직 존재함'
      ).toBe(false);
    });

    it('Toast는 공통 애니메이션 키프레임을 사용해야 함', () => {
      const toastCSS = read(TOAST_CSS_PATH);

      // 공통 키프레임 사용 확인
      const usesCommonAnimation =
        toastCSS.includes('xeg-fade-scale-in') ||
        toastCSS.includes('xeg-slide-in') ||
        toastCSS.includes('xeg-fade-in');

      expect(usesCommonAnimation, 'Toast가 공통 애니메이션 키프레임을 사용하지 않음').toBe(true);
    });

    it('하드코딩된 애니메이션 지속시간이 제거되어야 함', () => {
      const toastCSS = read(TOAST_CSS_PATH);

      // 하드코딩된 지속시간 (0.4s) 체크
      const hasHardcodedDuration = toastCSS.includes('0.4s') && toastCSS.includes('animation:');

      expect(hasHardcodedDuration, '하드코딩된 애니메이션 지속시간이 아직 존재함').toBe(false);
    });

    it('CSS 변수 기반 애니메이션 매개변수를 사용해야 함', () => {
      const toastCSS = read(TOAST_CSS_PATH);

      // CSS 변수 사용 확인
      const usesCSSVariables =
        toastCSS.includes('var(--xeg-duration-') || toastCSS.includes('var(--xeg-easing-');

      expect(usesCSSVariables, 'Toast가 CSS 변수 기반 애니메이션 매개변수를 사용하지 않음').toBe(
        true
      );
    });
  });

  describe('Toast-specific Animation Requirements', () => {
    it('Toast에 적합한 슬라이드 애니메이션이 design-tokens.css에 정의되어야 함', () => {
      const tokensCSS = read(DESIGN_TOKENS_PATH);

      // 슬라이드 애니메이션 키프레임 확인
      const hasSlideAnimation =
        tokensCSS.includes('@keyframes xeg-slide-in') ||
        tokensCSS.includes('@keyframes xeg-fade-slide-in');

      expect(
        hasSlideAnimation,
        'Toast용 슬라이드 애니메이션이 design-tokens.css에 정의되지 않음'
      ).toBe(true);
    });

    it('Toast 애니메이션 유틸리티 클래스가 정의되어야 함', () => {
      const tokensCSS = read(DESIGN_TOKENS_PATH);

      // 유틸리티 클래스 확인
      const hasUtilityClass =
        tokensCSS.includes('.xeg-anim-slide-in') || tokensCSS.includes('.xeg-anim-fade-slide-in');

      expect(hasUtilityClass, 'Toast 애니메이션 유틸리티 클래스가 정의되지 않음').toBe(true);
    });
  });

  describe('Animation Performance', () => {
    it('Toast 애니메이션이 GPU 가속을 사용해야 함', () => {
      const tokensCSS = read(DESIGN_TOKENS_PATH);

      // GPU 가속 속성 확인 (transform, opacity)
      const hasGPUAcceleration =
        tokensCSS.includes('transform:') &&
        tokensCSS.includes('opacity:') &&
        tokensCSS.includes('@keyframes');

      expect(hasGPUAcceleration, 'Toast 애니메이션이 GPU 가속 속성을 사용하지 않음').toBe(true);
    });

    it('reduced-motion을 고려한 Toast 애니메이션이 있어야 함', () => {
      const toastCSS = read(TOAST_CSS_PATH);
      const tokensCSS = read(DESIGN_TOKENS_PATH);

      // reduced-motion 지원 확인
      const hasReducedMotionSupport =
        toastCSS.includes('prefers-reduced-motion') || tokensCSS.includes('prefers-reduced-motion');

      expect(hasReducedMotionSupport, 'Toast 애니메이션이 reduced-motion을 고려하지 않음').toBe(
        true
      );
    });
  });

  describe('ToastContainer Animation Consistency', () => {
    it('ToastContainer도 공통 애니메이션 시스템을 사용해야 함', () => {
      const containerCSS = read(TOAST_CONTAINER_CSS_PATH);

      // 개별 키프레임이 없어야 함
      const hasIndividualKeyframes = containerCSS.includes('@keyframes');

      expect(hasIndividualKeyframes, 'ToastContainer에 개별 키프레임이 존재함').toBe(false);
    });
  });

  describe('Cross-Component Animation Consistency', () => {
    it('Toast와 SettingsModal이 동일한 애니메이션 패턴을 사용해야 함', () => {
      const toastCSS = read(TOAST_CSS_PATH);
      const tokensCSS = read(DESIGN_TOKENS_PATH);

      // 공통 애니메이션 키프레임 사용 확인
      const commonAnimationPattern = /xeg-[a-z-]+-in/;
      const toastUsesCommon = commonAnimationPattern.test(toastCSS);
      const hasCommonAnimations = commonAnimationPattern.test(tokensCSS);

      expect(
        toastUsesCommon && hasCommonAnimations,
        'Toast와 SettingsModal이 일관된 애니메이션 패턴을 사용하지 않음'
      ).toBe(true);
    });
  });
});
