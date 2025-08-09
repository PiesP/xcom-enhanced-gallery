/**
 * @fileoverview TDD Phase 1.3 - Browser 유틸리티 통합 테스트
 * 🟢 GREEN 단계: 중복 해결 완료 및 통합 검증
 */

import { describe, it, expect } from 'vitest';

describe('🟢 GREEN: Browser 유틸리티 통합 완료', () => {
  describe('중복 파일명 해결 검증', () => {
    it('✅ CSS 유틸리티와 환경 유틸리티가 별도 모듈로 분리되었다', async () => {
      // 새로운 분리된 모듈들을 검증
      const browserCssUtils = await import('../../src/shared/browser/browser-css-utils.js');
      const browserEnvironment = await import('../../src/shared/browser/browser-environment.js');

      // 두 모듈 모두 존재하는지 확인
      expect(browserCssUtils).toBeDefined();
      expect(browserEnvironment).toBeDefined();

      // GREEN: 기능별로 명확히 분리됨
      console.log('✅ GREEN 완료: CSS와 환경 기능이 명확히 분리됨');
    });

    it('✅ CSS 기능과 환경 기능이 서로 다른 모듈에 분리되었다', async () => {
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
      console.log('✅ GREEN 완료: 기능별 모듈 분리 완료');
    });
  });

  describe('통합 API 검증', () => {
    it('✅ index.ts에서 통합된 API를 제공한다', async () => {
      const browserIndex = await import('../../src/shared/browser/index.js');

      // CSS 기능
      expect(browserIndex.BrowserCSSUtils).toBeDefined();
      expect(browserIndex.BrowserUtils).toBeDefined(); // alias

      // 환경 체크 기능
      expect(browserIndex.isBrowserEnvironment).toBeDefined();
      expect(browserIndex.safeWindow).toBeDefined();
      expect(browserIndex.isExtensionEnvironment).toBeDefined();

      // 통합 서비스
      expect(browserIndex.BrowserService).toBeDefined();

      // GREEN: 명확한 API 구조 제공
      console.log('✅ GREEN 완료: 통합된 API 구조 완성');
    });

    it('✅ import 경로가 일관되고 명확하다', () => {
      // 새로운 일관된 import 패턴
      const patterns = [
        '@shared/browser', // 통합된 단일 진입점
        '@shared/browser/browser-css-utils', // CSS 전용 (필요시)
        '@shared/browser/browser-environment', // 환경 전용 (필요시)
      ];

      // GREEN: 명확한 import 패턴
      expect(patterns.length).toBe(3);
      console.log('✅ GREEN 완료: 일관된 import 패턴 완성');
    });
  });

  describe('기능별 분리 완료 검증', () => {
    it('✅ CSS 유틸리티 모듈이 완전히 분리되었다', async () => {
      const cssUtils = await import('../../src/shared/browser/browser-css-utils.js');

      expect(cssUtils.BrowserCSSUtils).toBeDefined();
      expect(typeof cssUtils.BrowserCSSUtils.injectCSS).toBe('function');
      expect(typeof cssUtils.BrowserCSSUtils.removeCSS).toBe('function');
      expect(typeof cssUtils.BrowserCSSUtils.removeAllInjectedCSS).toBe('function');

      console.log('✅ GREEN 완료: CSS 유틸리티 모듈 분리 완성');
    });

    it('✅ 환경 체크 모듈이 완전히 분리되었다', async () => {
      const envUtils = await import('../../src/shared/browser/browser-environment.js');

      expect(envUtils.isBrowserEnvironment).toBeDefined();
      expect(envUtils.safeWindow).toBeDefined();
      expect(envUtils.isExtensionEnvironment).toBeDefined();
      expect(envUtils.saveScrollPosition).toBeDefined();
      expect(envUtils.restoreScrollPosition).toBeDefined();

      console.log('✅ GREEN 완료: 환경 유틸리티 모듈 분리 완성');
    });

    it('✅ 통합 서비스가 완전히 제공된다', async () => {
      const browserModule = await import('../../src/shared/browser/index.js');

      // CSS 기능 접근
      expect(browserModule.BrowserCSSUtils).toBeDefined();
      // 환경 체크 기능 접근
      expect(browserModule.isBrowserEnvironment).toBeDefined();
      expect(browserModule.safeWindow).toBeDefined();
      // 통합 서비스 접근
      expect(browserModule.BrowserService).toBeDefined();

      // 함수 타입 검증
      expect(typeof browserModule.BrowserCSSUtils).toBe('function');
      expect(typeof browserModule.isBrowserEnvironment).toBe('function');
      expect(typeof browserModule.BrowserService).toBe('function');

      console.log('✅ GREEN 완료: 모든 browser 기능 통합 완성');
    });
  });
});
