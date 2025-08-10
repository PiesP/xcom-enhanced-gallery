/**
 * @fileoverview GREEN 단계: 통합 Mock 시스템 기능 검증 테스트
 * @description 통합된 Mock 시스템이 제대로 동작하는지 확인하는 테스트
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  UnifiedMockFactory,
  UnifiedMockUtils,
  VendorLibsMock,
  DOMEnvironmentMock,
  TwitterAPIMock,
  UserScriptAPIMock,
  unifiedMockFactory,
  createMock,
  getMock,
  resetAllMocks,
  resetDomainMocks,
  type MockConfig,
} from '@shared/testing/unified-mocks';

describe('🟢 TDD Phase 3: Mock 통합 - GREEN 단계', () => {
  beforeEach(() => {
    // 각 테스트 전 상태 초기화
    UnifiedMockFactory.resetInstance();
  });

  afterEach(() => {
    // 각 테스트 후 정리
    resetAllMocks();
  });

  describe('통합 Mock 팩토리 기능 검증', () => {
    test('should create unified mock factory successfully', () => {
      const factory = UnifiedMockFactory.getInstance();
      expect(factory).toBeDefined();
      expect(typeof factory.createMock).toBe('function');
      expect(typeof factory.getMock).toBe('function');
      expect(typeof factory.resetAll).toBe('function');
    });

    test('should create mocks with unified interface', () => {
      const factory = UnifiedMockFactory.getInstance();

      const mockConfig: MockConfig = {
        domain: 'test-domain',
        debugMode: true,
      };

      const testMock = factory.createMock('test-mock', mockConfig, () => ({
        testMethod: () => 'test result',
        testProperty: 42,
      }));

      // IUnifiedMock 인터페이스 검증
      expect(testMock.id).toBe('test-mock');
      expect(testMock.domain).toBe('test-domain');
      expect(testMock.state).toBeDefined();
      expect(typeof testMock.reset).toBe('function');
      expect(typeof testMock.getCallCount).toBe('function');
      expect(typeof testMock.getDebugInfo).toBe('function');

      // 원본 기능도 유지되는지 확인
      expect(testMock.testMethod()).toBe('test result');
      expect(testMock.testProperty).toBe(42);
    });

    test('should prevent duplicate mock creation', () => {
      const factory = UnifiedMockFactory.getInstance();

      const mock1 = factory.createMock('duplicate-test', { domain: 'test' }, () => ({ value: 1 }));
      const mock2 = factory.createMock('duplicate-test', { domain: 'test' }, () => ({ value: 2 }));

      // 같은 인스턴스가 반환되어야 함
      expect(mock1).toBe(mock2);
      expect(mock1.value).toBe(1); // 첫 번째 구현이 유지됨
    });

    test('should manage mock state correctly', () => {
      const factory = UnifiedMockFactory.getInstance();

      const testMock = factory.createMock('state-test', { domain: 'test' }, () => ({}));

      // 초기 상태 확인
      expect(testMock.state.isActive).toBe(true);
      expect(testMock.state.callCount).toBe(0);

      // 상태 변경 테스트
      testMock.deactivate();
      expect(testMock.state.isActive).toBe(false);

      testMock.activate();
      expect(testMock.state.isActive).toBe(true);

      testMock.reset();
      expect(testMock.state.callCount).toBe(0);
    });
  });

  describe('도메인별 Mock 구현 검증', () => {
    test('should create vendor libs mock with standard interface', () => {
      const vendorMock = VendorLibsMock.create();

      expect(vendorMock).toBeDefined();
      expect(vendorMock.domain).toBe('vendor-libs');
      expect(vendorMock.preact).toBeDefined();
      expect(vendorMock.hooks).toBeDefined();
      expect(vendorMock.signals).toBeDefined();
      expect(vendorMock.motionOne).toBeDefined();
      expect(vendorMock.tanStackQuery).toBeDefined();

      // Preact Mock 기능 테스트
      const element = vendorMock.preact.createElement('div', { className: 'test' });
      expect(element.type).toBe('div');
      expect(element.props.className).toBe('test');
    });

    test('should create DOM environment mock with standard interface', () => {
      const domMock = DOMEnvironmentMock.create();

      expect(domMock).toBeDefined();
      expect(domMock.domain).toBe('dom-environment');
      expect(domMock.document).toBeDefined();
      expect(domMock.window).toBeDefined();
      expect(domMock.storage).toBeDefined();

      // DOM Mock 기능 테스트
      const element = domMock.document.createElement('span');
      expect(element.tagName).toBe('span');
    });

    test('should create Twitter API mock with standard interface', () => {
      const twitterMock = TwitterAPIMock.create();

      expect(twitterMock).toBeDefined();
      expect(twitterMock.domain).toBe('twitter-api');
      expect(twitterMock.selectors).toBeDefined();
      expect(twitterMock.api).toBeDefined();
      expect(twitterMock.pageStructures).toBeDefined();

      // Twitter API Mock 기능 테스트
      expect(twitterMock.selectors.tweet).toBe('[data-testid="tweet"]');
    });

    test('should create UserScript API mock with standard interface', () => {
      const userscriptMock = UserScriptAPIMock.create();

      expect(userscriptMock).toBeDefined();
      expect(userscriptMock.domain).toBe('userscript-api');
      expect(userscriptMock.GM).toBeDefined();
      expect(userscriptMock.unsafeWindow).toBeDefined();
      expect(userscriptMock.GM_info).toBeDefined();

      // UserScript Mock 기능 테스트
      expect(userscriptMock.GM_info.script.name).toBe('Test Script');
    });
  });

  describe('Mock 상태 관리 및 격리 검증', () => {
    test('should isolate mock state between tests', () => {
      // 첫 번째 테스트에서 Mock 생성
      const mock1 = createMock('isolation-test', 'test', () => ({ count: 0 }));
      mock1.state.callCount = 5;

      // Mock 상태 격리
      UnifiedMockUtils.isolateTests();

      // 새로운 Mock 생성 시 상태가 격리되어야 함
      const mock2 = createMock('isolation-test', 'test', () => ({ count: 0 }));
      expect(mock2.state.callCount).toBe(0);
    });

    test('should reset mocks consistently', () => {
      const mock1 = createMock('reset-test-1', 'domain1', () => ({ value: 1 }));
      const mock2 = createMock('reset-test-2', 'domain2', () => ({ value: 2 }));

      // 상태 변경
      mock1.state.callCount = 10;
      mock2.state.callCount = 20;

      // 전체 리셋
      resetAllMocks();

      expect(mock1.state.callCount).toBe(0);
      expect(mock2.state.callCount).toBe(0);
    });

    test('should reset domain-specific mocks', () => {
      const mock1 = createMock('domain-test-1', 'domain1', () => ({ value: 1 }));
      const mock2 = createMock('domain-test-2', 'domain2', () => ({ value: 2 }));

      // 상태 변경
      mock1.state.callCount = 10;
      mock2.state.callCount = 20;

      // domain1만 리셋
      resetDomainMocks('domain1');

      expect(mock1.state.callCount).toBe(0);
      expect(mock2.state.callCount).toBe(20); // domain2는 유지
    });
  });

  describe('Mock 유틸리티 기능 검증', () => {
    test('should create all standard mocks successfully', () => {
      const allMocks = UnifiedMockUtils.createAllStandardMocks();

      expect(allMocks).toBeDefined();
      expect(allMocks.vendorLibs).toBeDefined();
      expect(allMocks.domEnvironment).toBeDefined();
      expect(allMocks.twitterAPI).toBeDefined();
      expect(allMocks.userScriptAPI).toBeDefined();

      // 모든 Mock이 IUnifiedMock 인터페이스를 구현하는지 확인
      Object.values(allMocks).forEach(mock => {
        expect(typeof mock.reset).toBe('function');
        expect(typeof mock.getCallCount).toBe('function');
        expect(mock.state).toBeDefined();
      });
    });

    test('should create lightweight mocks for performance', () => {
      const lightMock = UnifiedMockUtils.createLightweightMock('light-test', 'performance', () => ({
        fastMethod: () => 'fast',
      }));

      expect(lightMock).toBeDefined();
      expect(lightMock.domain).toBe('performance');
      expect(lightMock.state.config.performance).toBe(true);
      expect(lightMock.state.config.autoReset).toBe(true);
      expect(lightMock.fastMethod()).toBe('fast');
    });

    test('should create debuggable mocks with detailed info', () => {
      const debugMock = UnifiedMockUtils.createDebuggableMock('debug-test', 'debugging', () => ({
        debugMethod: () => 'debug',
      }));

      expect(debugMock).toBeDefined();
      expect(debugMock.domain).toBe('debugging');
      expect(debugMock.state.config.debugMode).toBe(true);
      expect(debugMock.state.config.persistent).toBe(true);

      // 디버그 정보 확인
      const debugInfo = debugMock.getDebugInfo();
      expect(debugInfo.id).toBe('debug-test');
      expect(debugInfo.domain).toBe('debugging');
      expect(typeof debugInfo.callCount).toBe('number');
    });

    test('should provide performance report', () => {
      // 여러 Mock 생성
      createMock('perf-1', 'domain1', () => ({}));
      createMock('perf-2', 'domain1', () => ({}));
      createMock('perf-3', 'domain2', () => ({}));

      const report = UnifiedMockUtils.getPerformanceReport();

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report).toContain('Total Mocks:');
      expect(report).toContain('Active Mocks:');
      expect(report).toContain('domain1');
      expect(report).toContain('domain2');
    });
  });

  describe('편의 함수 검증', () => {
    test('should work with convenience functions', () => {
      // createMock 편의 함수 테스트
      const mock = createMock('convenience-test', 'test', () => ({ value: 'test' }));

      expect(mock).toBeDefined();
      expect(mock.domain).toBe('test');
      expect(mock.value).toBe('test');

      // getMock 편의 함수 테스트
      const retrievedMock = getMock<{ value: string }>('convenience-test');
      expect(retrievedMock).toBe(mock);
      expect(retrievedMock?.value).toBe('test');

      // 존재하지 않는 Mock 조회
      const nonExistent = getMock('non-existent');
      expect(nonExistent).toBeNull();
    });

    test('should work with global mock factory', () => {
      // 전역 팩토리 인스턴스 테스트
      expect(unifiedMockFactory).toBeDefined();

      const mock = unifiedMockFactory.createMock('global-test', { domain: 'global' }, () => ({
        global: true,
      }));

      expect(mock.global).toBe(true);
      expect(mock.domain).toBe('global');

      // 성능 통계 확인
      const stats = unifiedMockFactory.getPerformanceStats();
      expect(stats.totalMocks).toBeGreaterThan(0);
      expect(stats.domains.global).toBe(1);
    });
  });

  describe('하위 호환성 검증', () => {
    test('should maintain backward compatibility with legacy aliases', () => {
      // 별칭들이 정상적으로 export되는지 확인
      expect(UnifiedMockFactory).toBeDefined();
      expect(UnifiedMockUtils).toBeDefined();

      // 기존 Mock 생성 패턴 호환성
      const legacyMock = createMock('legacy-test', 'legacy', () => ({
        legacyMethod: () => 'legacy works',
      }));

      expect(legacyMock.legacyMethod()).toBe('legacy works');
      expect(legacyMock.domain).toBe('legacy');
    });

    test('should work in test environments requiring state isolation', () => {
      // beforeEach/afterEach 패턴 시뮬레이션
      const beforeEachMock = () => {
        UnifiedMockUtils.isolateTests();
      };

      const afterEachMock = () => {
        UnifiedMockUtils.globalReset();
      };

      beforeEachMock();

      const testMock = createMock('isolation-pattern', 'test', () => ({ isolated: true }));
      testMock.state.callCount = 100;

      afterEachMock();

      // 새로운 테스트 환경에서 상태가 초기화되는지 확인
      beforeEachMock();

      const freshMock = createMock('isolation-pattern', 'test', () => ({ isolated: true }));
      expect(freshMock.state.callCount).toBe(0);
    });
  });
});
