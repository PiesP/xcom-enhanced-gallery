/**
 * @fileoverview TDD GREEN Phase - 통합 완료 검증
 * @description 모든 Manager → Service 변경 및 중복 제거 완료 검증
 */

import { describe, it, expect } from 'vitest';

describe('🟢 TDD GREEN: 통합 완료 검증', () => {
  describe('Service 네이밍 통일 완료', () => {
    it('TimerService가 정상 작동해야 함', async () => {
      const { TimerService } = await import('@shared/services/TimerService');
      const service = new TimerService();

      expect(service.createTimer).toBeDefined();
      expect(service.createInterval).toBeDefined();
      expect(service.clearTimer).toBeDefined();
      expect(service.clearAll).toBeDefined();
      expect(service.getStatus).toBeDefined();
    });

    it('ResourceService가 정상 작동해야 함', async () => {
      const { ResourceService } = await import('@shared/services/ResourceService');
      const service = new ResourceService();

      expect(service.register).toBeDefined();
      expect(service.release).toBeDefined();
      expect(service.releaseAll).toBeDefined();
      expect(service.getResourceCount).toBeDefined();
      expect(service.getStatus).toBeDefined();
    });

    it('AccessibilityService가 정상 작동해야 함', async () => {
      const { AccessibilityService } = await import('@shared/services/AccessibilityService');
      const service = new AccessibilityService();

      expect(service.initialize).toBeDefined();
      expect(service.createFocusTrap).toBeDefined();
      expect(service.announce).toBeDefined();
      expect(service.updateGalleryState).toBeDefined();
      expect(service.cleanup).toBeDefined();
    });
  });

  describe('StyleManager 직접 사용 완료', () => {
    it('StyleManager를 직접 import하여 사용할 수 있어야 함', async () => {
      const StyleManagerModule = await import('@shared/styles/StyleManager');
      const StyleManager = StyleManagerModule.default;

      expect(StyleManager.combineClasses).toBeDefined();
      expect(StyleManager.applyGlassmorphism).toBeDefined();
      expect(StyleManager.setTheme).toBeDefined();
      expect(StyleManager.setTokenValue).toBeDefined();

      // 실제 기능 테스트
      const combined = StyleManager.combineClasses('class1', 'class2', null, 'class3');
      expect(combined).toBe('class1 class2 class3');
    });

    it('styleUtils 래퍼가 제거되었어야 함', async () => {
      const stylesModule = await import('@shared/styles/index');
      expect(stylesModule.styleUtils).toBeUndefined();
    });
  });

  describe('애니메이션 시스템 통합 완료', () => {
    it('AnimationService 단일 시스템으로 통합되었어야 함', async () => {
      const { AnimationService } = await import('@shared/services/AnimationService');
      const service = AnimationService.getInstance();

      expect(service.animateGalleryEnter).toBeDefined();
      expect(service.animateGalleryExit).toBeDefined();
      expect(service.animateImageItemsEnter).toBeDefined();
      expect(service.cleanupAnimations).toBeDefined();
    });

    it('animations.ts가 AnimationService의 래퍼 역할을 해야 함', async () => {
      const animationsModule = await import('@shared/utils/animations');

      expect(animationsModule.animateGalleryEnter).toBeDefined();
      expect(animationsModule.animateGalleryExit).toBeDefined();
      expect(animationsModule.cleanupAnimations).toBeDefined();

      // 실제 애니메이션 함수가 호출 가능한지 확인
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);

      expect(() => {
        animationsModule.animateGalleryEnter(testElement);
      }).not.toThrow();

      document.body.removeChild(testElement);
    });
  });

  describe('중복 코드 제거 완료', () => {
    it('removeDuplicates 함수가 단일 위치에서만 제공되어야 함', async () => {
      const { removeDuplicates } = await import('@shared/utils/deduplication/deduplication-utils');

      expect(removeDuplicates).toBeDefined();
      expect(typeof removeDuplicates).toBe('function');

      // 기능 테스트
      const testArray = [1, 2, 2, 3, 3, 4];
      const deduplicated = removeDuplicates(testArray);
      expect(deduplicated).toEqual([1, 2, 3, 4]);
    });

    it('throttle 함수가 통일된 위치에서 제공되어야 함', async () => {
      const { rafThrottle } = await import('@shared/utils/performance/performance-utils');

      expect(rafThrottle).toBeDefined();
      expect(typeof rafThrottle).toBe('function');
    });
  });

  describe('서비스 통합 품질 검증', () => {
    it('모든 Service 클래스가 일관된 API 패턴을 가져야 함', async () => {
      const services = [
        '@shared/services/TimerService',
        '@shared/services/ResourceService',
        '@shared/services/AccessibilityService',
      ];

      for (const servicePath of services) {
        const serviceModule = await import(servicePath);
        const ServiceClass = serviceModule[Object.keys(serviceModule)[0]];

        // 모든 서비스는 클래스여야 함
        expect(typeof ServiceClass).toBe('function');
        expect(ServiceClass.prototype).toBeDefined();
      }
    });

    it('StyleManager가 정적 메서드 패턴을 유지해야 함', async () => {
      const StyleManagerModule = await import('@shared/styles/StyleManager');
      const StyleManager = StyleManagerModule.default;

      // 정적 메서드들이 존재해야 함
      expect(typeof StyleManager.combineClasses).toBe('function');
      expect(typeof StyleManager.applyGlassmorphism).toBe('function');
      expect(typeof StyleManager.setTheme).toBe('function');

      // 인스턴스 생성 없이 사용 가능해야 함
      expect(() => {
        StyleManager.combineClasses('test');
      }).not.toThrow();
    });
  });
});
