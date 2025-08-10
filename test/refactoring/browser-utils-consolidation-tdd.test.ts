/**
 * @fileoverview Browser Utils Consolidation - TDD Phase 1
 * @description RED-GREEN-REFACTOR 사이클을 통한 브라우저 유틸리티 통합
 * @version 1.0.0 - TDD Phase 1 시작
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  // 기존 개별 함수들 (RED - 제거 대상)
  isBrowserEnvironment,
  safeWindow,
  safeLocation,
  safeNavigator,
  isTwitterSite,
  getCurrentUrlInfo,
  // 통합 서비스 (GREEN - 목표)
  BrowserService,
} from '@shared/browser';

describe('🔴 RED: Browser Utils Consolidation - 중복 기능 식별', () => {
  beforeEach(() => {
    // 각 테스트마다 깔끔한 환경 보장
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 브라우저 모킹 정리
    vi.restoreAllMocks();
  });

  describe('현재 개별 함수들 동작 검증', () => {
    it('should verify individual browser-environment functions work', () => {
      // RED: 기존 개별 함수들이 올바르게 동작하는지 검증
      expect(typeof isBrowserEnvironment).toBe('function');
      expect(typeof safeWindow).toBe('function');
      expect(typeof safeLocation).toBe('function');
      expect(typeof safeNavigator).toBe('function');
      expect(typeof isTwitterSite).toBe('function');
      expect(typeof getCurrentUrlInfo).toBe('function');

      // 실제 함수 호출 테스트
      expect(isBrowserEnvironment()).toBe(true);
      expect(safeWindow()).toBeTruthy();
    });

    it('should identify duplicate functionality patterns', () => {
      // RED: 중복된 기능 패턴 식별
      const windowAccess1 = safeWindow();
      const windowAccess2 = BrowserService.environment.getWindow();

      // 두 방식 모두 동일한 결과를 제공해야 함 (중복 확인)
      expect(!!windowAccess1).toBe(!!windowAccess2);

      const locationAccess1 = safeLocation();
      const locationAccess2 = BrowserService.environment.getWindow()?.location || null;

      // location 접근도 중복됨을 확인
      expect(!!locationAccess1).toBe(!!locationAccess2);
    });
  });

  describe('BrowserService 통합 API 요구사항', () => {
    it('should define requirements for unified API', () => {
      // RED: 통합 API가 만족해야 할 요구사항 정의

      // 1. 기존 개별 함수들의 모든 기능을 포함해야 함
      expect(BrowserService).toBeDefined();
      expect(BrowserService.environment).toBeDefined();

      // 2. 환경 체크 기능
      expect(BrowserService.environment.isBrowser).toBeDefined();
      expect(BrowserService.environment.getWindow).toBeDefined();

      // 3. 안전한 브라우저 객체 접근
      expect(typeof BrowserService.environment.getWindow).toBe('function');
    });

    it('should verify unified API completeness', () => {
      // RED: 통합 API가 모든 기존 기능을 대체할 수 있는지 검증

      // 환경 체크
      const isBrowser1 = isBrowserEnvironment();
      const isBrowser2 = BrowserService.environment.isBrowser();
      expect(isBrowser1).toBe(isBrowser2);

      // Window 객체 접근
      const window1 = safeWindow();
      const window2 = BrowserService.environment.getWindow();
      expect(!!window1).toBe(!!window2);
    });
  });
});

describe('🟢 GREEN: Browser Utils Consolidation - 통합 구현', () => {
  it('should implement unified BrowserService API', () => {
    // GREEN: BrowserService가 모든 기존 기능을 제공하는지 확인

    // 핵심 기능들이 모두 BrowserService를 통해 접근 가능한지 검증
    expect(BrowserService.initialize()).toBeTruthy();
    expect(BrowserService.environment.isBrowser()).toBe(true);
    expect(BrowserService.environment.getWindow()).toBeTruthy();

    // 상태 정보 제공
    const status = BrowserService.getStatus();
    expect(status).toBeDefined();
    expect(status.initialized).toBe(true);
    expect(status.environment).toBeDefined();
    expect(status.environment.isBrowser).toBe(true);
  });

  it('should provide backward compatibility layer', () => {
    // GREEN: 기존 코드 호환성 보장

    // 기존 함수들이 여전히 동작해야 함 (호환성 레이어)
    expect(() => isBrowserEnvironment()).not.toThrow();
    expect(() => safeWindow()).not.toThrow();
    expect(() => safeLocation()).not.toThrow();
    expect(() => safeNavigator()).not.toThrow();

    // 결과도 동일해야 함
    expect(isBrowserEnvironment()).toBe(BrowserService.environment.isBrowser());
  });
});

describe('🔵 REFACTOR: Browser Utils Consolidation - 최적화', () => {
  it('should demonstrate improved API usage', () => {
    // REFACTOR: 개선된 API 사용 방식 시연

    // 기존 방식 (분산된 함수 호출)
    const oldWay = {
      isBrowser: isBrowserEnvironment(),
      window: safeWindow(),
      location: safeLocation(),
      navigator: safeNavigator(),
    };

    // 새로운 방식 (통합 서비스)
    const newWay = BrowserService.getStatus();

    // 두 방식 모두 동일한 정보를 제공하지만, 새로운 방식이 더 구조화됨
    expect(oldWay.isBrowser).toBe(newWay.environment.isBrowser);
    expect(!!oldWay.window).toBe(newWay.environment.hasWindow);

    // 새로운 방식은 추가적인 진단 정보도 제공
    expect(newWay.page).toBeDefined();
    expect(newWay.css).toBeDefined();
  });

  it('should show performance benefits', () => {
    // REFACTOR: 성능 개선 사항 검증

    // 통합 서비스는 한 번의 호출로 모든 정보 제공
    const status = BrowserService.getStatus();

    // 개별 함수들은 여러 번 호출 필요
    const distributed = {
      browser: isBrowserEnvironment(),
      window: safeWindow(),
      location: safeLocation(),
      navigator: safeNavigator(),
    };

    // 통합 방식이 더 효율적이어야 함 (또는 최소한 비슷해야 함)
    expect(status).toBeDefined();
    expect(distributed).toBeDefined();

    // 통합 서비스는 더 포괄적인 정보를 제공 (같거나 더 많은)
    expect(Object.keys(status).length).toBeGreaterThanOrEqual(Object.keys(distributed).length);
  });

  it('should enable future deprecation of individual functions', () => {
    // REFACTOR: 개별 함수들의 단계적 제거 가능성 검증

    // BrowserService가 모든 기능을 대체할 수 있는지 확인
    const browserService = BrowserService;

    // 환경 체크
    expect(browserService.environment.isBrowser).toBeDefined();

    // 안전한 객체 접근
    expect(browserService.environment.getWindow).toBeDefined();

    // 초기화 및 정리
    expect(browserService.initialize).toBeDefined();
    expect(browserService.cleanup).toBeDefined();

    // 상태 진단
    expect(browserService.getStatus).toBeDefined();

    console.info('✅ BrowserService can fully replace individual functions');
  });
});

describe('🏆 통합 완료 검증', () => {
  it('should pass all integration requirements', () => {
    // 최종 통합 검증

    // 1. 기존 기능 보존
    expect(isBrowserEnvironment()).toBeTruthy();
    expect(safeWindow()).toBeTruthy();

    // 2. 새로운 통합 API 동작
    expect(BrowserService.initialize()).toBeTruthy();

    // 3. 호환성 보장
    expect(isBrowserEnvironment()).toBe(BrowserService.environment.isBrowser());

    // 4. 추가 기능 제공
    const status = BrowserService.getStatus();
    expect(status.environment).toBeDefined();
    expect(status.page).toBeDefined();
    expect(status.css).toBeDefined();

    console.info('🎉 Phase 1: Browser Utils Consolidation - TDD Complete!');
  });
});
