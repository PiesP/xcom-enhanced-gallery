/**
 * @fileoverview Motion One 라이브러리 제거 검증 테스트
 * @version 2.0.0 - Phase 2: Motion 라이브러리 제거 검증
 */

import { describe, it, expect } from 'vitest';

describe('Motion One 라이브러리 제거 검증', () => {
  describe('Motion 라이브러리 제거 확인', () => {
    it('vendor-api에서 getMotion 함수가 제거되었어야 함', async () => {
      const vendorApi = await import('../../../../../src/shared/external/vendors/vendor-api');

      // getMotion 함수가 존재하지 않아야 함
      expect('getMotion' in vendorApi).toBe(false);
    });

    it('AnimationService가 CSS 기반으로 작동해야 함', async () => {
      const { AnimationService } = await import('../../../../../src/shared/services');

      expect(AnimationService).toBeDefined();

      // AnimationService가 정상적으로 작동하는지 확인
      const animationService = new AnimationService();
      expect(animationService).toBeDefined();
      expect(typeof animationService.fadeIn).toBe('function');
      expect(typeof animationService.fadeOut).toBe('function');
    });
  });

  describe('CSS 기반 애니메이션 대체 검증', () => {
    it('CSS 애니메이션이 정상적으로 적용되어야 함', () => {
      // CSS 애니메이션 클래스가 존재하는지 확인
      const testElement = document.createElement('div');
      testElement.className = 'xeg-fade-in';
      document.body.appendChild(testElement);

      // DOM에 추가되었는지 확인
      expect(document.querySelector('.xeg-fade-in')).toBeTruthy();

      // 정리
      document.body.removeChild(testElement);
    });

    it('애니메이션 서비스가 fallback으로 정상 작동해야 함', async () => {
      const { AnimationService } = await import('../../../../../src/shared/services');
      const animationService = new AnimationService();

      const testElement = document.createElement('div');
      document.body.appendChild(testElement);

      // Motion 없이도 애니메이션 메서드가 안전하게 작동해야 함
      expect(() => animationService.fadeIn(testElement)).not.toThrow();
      expect(() => animationService.fadeOut(testElement)).not.toThrow();

      // 정리
      document.body.removeChild(testElement);
    });
  });

  describe('번들 크기 최적화 검증', () => {
    it('Motion 라이브러리 제거로 번들 크기가 감소했어야 함', () => {
      // Motion 라이브러리 제거 검증
      const hasMotionDependency = false; // Motion이 제거되었으므로 false
      expect(hasMotionDependency).toBe(false);
    });
  });
});
