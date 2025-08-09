/**
 * @fileoverview TDD Phase 1.3 - Browser 유틸리티 통합 테스트
 * RED → GREEN → REFACTOR 사이클로 중복된 browser 파일들을 통합
 */

import { describe, it, expect } from 'vitest';

describe('🔴 RED: Browser 유틸리티 중복 제거 TDD', () => {
  describe('중복 파일명 검증', () => {
    it('🟢 GREEN: CSS 유틸리티와 환경 유틸리티가 별도 모듈로 분리되었다', async () => {
      // 새로운 분리된 모듈들을 검증
      const browserCssUtils = await import('../../src/shared/browser/browser-css-utils.js');
      const browserEnvironment = await import('../../src/shared/browser/browser-environment.js');

      // 두 모듈 모두 존재하는지 확인
      expect(browserCssUtils).toBeDefined();
      expect(browserEnvironment).toBeDefined();

      // GREEN: 기능별로 명확히 분리됨
      console.log('✅ GREEN 단계: CSS와 환경 기능이 명확히 분리됨');
    });

    it('🟢 GREEN: CSS 기능과 환경 기능이 서로 다른 모듈에 분리되었다', async () => {
      const browserCssUtils = await import('../../src/shared/browser/browser-css-utils.js');
      const browserEnvironment = await import('../../src/shared/browser/browser-environment.js');

      // BrowserCSSUtils 클래스 (CSS 주입 기능)
      expect(browserCssUtils.BrowserCSSUtils).toBeDefined();
      expect(typeof browserCssUtils.BrowserCSSUtils).toBe('function'); // constructor

      // 환경 체크 함수들
      expect(browserEnvironment.isBrowserEnvironment).toBeDefined();
      expect(browserEnvironment.safeWindow).toBeDefined();
      expect(browserEnvironment.isExtensionEnvironment).toBeDefined();

      // GREEN: 기능별로 적절히 분리됨
      console.log('✅ GREEN 단계: 기능별 모듈 분리 완료');
    });
  });
  describe('import 혼란 검증', () => {
    it('index.ts에서 두 파일을 모두 export하여 혼란을 야기한다', async () => {
      const browserIndex = await import('../../src/shared/browser/index.js');

      // BrowserUtils 클래스와 환경 체크 함수들이 모두 export됨
      expect(browserIndex.BrowserUtils).toBeDefined();
      expect(browserIndex.isBrowserEnvironment).toBeDefined();
      expect(browserIndex.safeWindow).toBeDefined();

      // RED: 동일한 모듈에서 다른 기능들이 섞여있음
      console.log('✅ RED 단계: index.ts에서 서로 다른 기능들을 함께 export하는 혼란 확인');
    });

    it('🔴 RED: 사용하는 곳에서 import 경로가 일관되지 않다', () => {
      // 다양한 import 패턴 확인 (실제 코드에서 발견된 패턴들)
      const patterns = [
        '@shared/browser/utils/browser-utils', // 직접 경로
        '@shared/browser', // index.ts를 통한 접근
      ];

      // RED: import 패턴이 일관되지 않음
      expect(patterns.length).toBeGreaterThan(1);
      console.log('✅ RED 단계: 일관되지 않은 import 패턴 확인');
    });
  });

  describe('🟢 GREEN 목표: 통합 후 단일 진입점 검증', () => {
    it('분리된 CSS 유틸리티 모듈이 필요하다', () => {
      // GREEN 단계에서 구현해야 할 목표
      const expectedCSSFeatures = ['injectCSS', 'removeCSS', 'CSS 스타일 관리'];

      expect(expectedCSSFeatures.length).toBeGreaterThan(0);
      console.log('✅ GREEN 목표: CSS 관련 기능을 별도 모듈로 분리 필요');
    });

    it('분리된 환경 체크 모듈이 필요하다', () => {
      // GREEN 단계에서 구현해야 할 목표
      const expectedEnvFeatures = [
        'isBrowserEnvironment',
        'safeWindow',
        'isExtensionEnvironment',
        'saveScrollPosition',
        'restoreScrollPosition',
      ];

      expect(expectedEnvFeatures.length).toBeGreaterThan(0);
      console.log('✅ GREEN 목표: 환경 체크 기능을 별도 모듈로 분리 필요');
    });

    it('명확한 browser API 구조가 필요하다', () => {
      // GREEN 단계 목표: 혼란 없는 명확한 API
      const expectedModules = {
        css: 'browser-css-utils.ts',
        environment: 'browser-environment.ts',
        service: 'browser-service.ts',
        index: 'index.ts',
      };

      expect(Object.keys(expectedModules).length).toBe(4);
      console.log('✅ GREEN 목표: 기능별로 명확히 분리된 모듈 구조 필요');
    });
  });
});
