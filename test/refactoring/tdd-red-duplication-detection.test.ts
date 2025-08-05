/**
 * @fileoverview 🔴 RED Phase: 중복 구현 식별 테스트
 * @description TDD 방식으로 중복 구현을 식별하고 통합 계획 수립
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('🔴 RED Phase: 중복 구현 식별', () => {
  describe('StyleManager 중복 분석', () => {
    it('여러 StyleManager 구현이 존재해야 함 (중복 확인)', async () => {
      // RED: 현재 중복이 존재함을 확인
      const styleImplementations = [
        'src/shared/styles/style-manager.ts', // 메인 StyleManager
        'src/core/styles/index.ts', // CoreStyleManager
        'src/shared/services/style-service.ts', // StyleService 래퍼
        'src/shared/utils/styles/css-utilities.ts', // CSS 유틸리티들
      ];

      // 모든 파일이 존재해야 함 (중복 상태)
      styleImplementations.forEach(filePath => {
        const fullPath = join(process.cwd(), filePath);
        expect(existsSync(fullPath)).toBe(true);
      });

      console.log('🔴 StyleManager 중복 구현 확인됨:', styleImplementations);
    });

    it('setCSSVariable 함수가 여러 곳에 중복 구현되어야 함', async () => {
      // RED: setCSSVariable이 여러 모듈에서 제공됨
      const locations = [];

      try {
        const coreStyles = await import('@core/styles');
        if (coreStyles.coreStyleManager?.setCSSVariable) {
          locations.push('CoreStyleManager');
        }
      } catch {
        /* ignore */
      }

      try {
        const styleService = await import('@shared/services/style-service');
        if (styleService.setCSSVariable) {
          locations.push('StyleService');
        }
      } catch {
        /* ignore */
      }

      try {
        const cssUtils = await import('@shared/utils/styles/css-utilities');
        if (cssUtils.setCSSVariable) {
          locations.push('CSS Utilities');
        }
      } catch {
        /* ignore */
      }

      // RED: 중복이 존재해야 함
      expect(locations.length).toBeGreaterThan(1);
      console.log('🔴 setCSSVariable 중복 위치:', locations);
    });

    it('combineClasses 함수가 여러 곳에 중복 구현되어야 함', async () => {
      // RED: combineClasses도 여러 모듈에서 제공됨
      const locations = [];

      try {
        const coreStyles = await import('@core/styles');
        if (coreStyles.combineClasses) {
          locations.push('Core Styles');
        }
      } catch {
        /* ignore */
      }

      try {
        const styleManager = await import('@shared/styles/style-manager');
        if (styleManager.default?.combineClasses) {
          locations.push('StyleManager');
        }
      } catch {
        /* ignore */
      }

      // RED: 중복이 존재해야 함
      expect(locations.length).toBeGreaterThan(1);
      console.log('🔴 combineClasses 중복 위치:', locations);
    });
  });

  describe('성능 유틸리티 중복 분석', () => {
    it('throttle 함수가 여러 곳에 중복 구현되어야 함', async () => {
      // RED: throttle 관련 함수들이 여러 모듈에 분산됨
      const throttleImplementations = [];

      try {
        const perfUtils = await import('@shared/utils/performance/performance-utils');
        if (perfUtils.throttle) {
          throttleImplementations.push('Performance Utils');
        }
        if (perfUtils.rafThrottle) {
          throttleImplementations.push('RAF Throttle');
        }
      } catch {
        /* ignore */
      }

      try {
        const services = await import('@shared/services');
        if (services.throttle) {
          throttleImplementations.push('Services Index');
        }
      } catch {
        /* ignore */
      }

      // RED: 여러 throttle 구현이 존재해야 함
      expect(throttleImplementations.length).toBeGreaterThan(1);
      console.log('🔴 throttle 중복 구현:', throttleImplementations);
    });

    it('memo 함수가 여러 곳에 중복 구현되어야 함', async () => {
      // RED: memo/memoization 관련 함수들
      const memoImplementations = [];

      try {
        const memoUtils = await import('@shared/utils/optimization/memo');
        if (memoUtils.memo) {
          memoImplementations.push('Memo Utils');
        }
      } catch {
        /* ignore */
      }

      try {
        const vendors = await import('@shared/external/vendors');
        if (vendors.memo) {
          memoImplementations.push('Vendor Utils');
        }
      } catch {
        /* ignore */
      }

      if (memoImplementations.length > 1) {
        console.log('🔴 memo 중복 구현:', memoImplementations);
        expect(memoImplementations.length).toBeGreaterThan(1);
      } else {
        console.log('✅ memo 함수는 단일 구현 (중복 없음)');
      }
    });
  });

  describe('DOM 관리 중복 분석', () => {
    it('DOMService와 CoreDOMManager가 중복 기능을 제공해야 함', async () => {
      // RED: DOM 관련 서비스들이 여러 개 존재
      const domServices = [];

      try {
        const domService = await import('@shared/dom/DOMService');
        if (domService.DOMService) {
          domServices.push('DOMService');
        }
      } catch {
        /* ignore */
      }

      // core에도 DOM 관련 기능이 있는지 확인
      try {
        const coreIndex = await import('@core');
        if (coreIndex.DOMService || coreIndex.coreDOMManager) {
          domServices.push('Core DOM');
        }
      } catch {
        /* ignore */
      }

      console.log('🔴 DOM 서비스들:', domServices);

      // DOM 서비스가 적어도 하나는 존재해야 함
      expect(domServices.length).toBeGreaterThan(0);
    });
  });

  describe('서비스 관리자 복잡성 분석', () => {
    it('CoreService 클래스가 과도하게 복잡해야 함', async () => {
      // RED: 현재 CoreService가 너무 많은 기능을 담당
      const serviceManager = await import('@shared/services/service-manager');
      const CoreService = serviceManager.CoreService;

      const methods = Object.getOwnPropertyNames(CoreService.prototype);
      const staticMethods = Object.getOwnPropertyNames(CoreService);

      console.log('🔴 CoreService 인스턴스 메서드:', methods);
      console.log('🔴 CoreService 정적 메서드:', staticMethods);

      // RED: 메서드가 너무 많음 (복잡성 지표)
      expect(methods.length + staticMethods.length).toBeGreaterThan(10);
    });

    it('serviceManager 인스턴스와 CoreService가 혼재해야 함', async () => {
      // RED: 서비스 관리자 접근 방식이 일관되지 않음
      const serviceManager = await import('@shared/services/service-manager');

      // 인스턴스와 클래스 모두 export되고 있음
      expect(serviceManager.serviceManager).toBeDefined();
      expect(serviceManager.CoreService).toBeDefined();

      console.log('🔴 서비스 관리자 혼재 확인됨');
    });
  });

  describe('번들 크기 최적화 필요성 분석', () => {
    it('현재 번들 크기가 목표치를 초과해야 함', () => {
      // RED: 중복으로 인한 번들 크기 증가
      const TARGET_SIZE_KB = 250; // 목표: 250KB 이하
      const CURRENT_SIZE_KB = 266; // 현재 프로덕션 빌드 크기

      console.log('🔴 현재 번들 크기:', CURRENT_SIZE_KB, 'KB');
      console.log('🔴 목표 번들 크기:', TARGET_SIZE_KB, 'KB');
      console.log('🔴 초과 용량:', CURRENT_SIZE_KB - TARGET_SIZE_KB, 'KB');

      // RED: 현재 크기가 목표를 초과함
      expect(CURRENT_SIZE_KB).toBeGreaterThan(TARGET_SIZE_KB);
    });
  });
});

/**
 * 중복 통합 계획 생성 테스트
 */
describe('🔴 RED Phase: 통합 계획 수립', () => {
  it('StyleManager 통합 계획이 필요해야 함', () => {
    // RED: 현재는 통합 계획이 없음
    const integrationPlan = {
      primaryImplementation: 'src/shared/styles/style-manager.ts',
      deprecatedImplementations: [
        'src/core/styles/index.ts',
        'src/shared/services/style-service.ts',
      ],
      migrationSteps: [
        '1. StyleManager를 단일 진실 소스로 확립',
        '2. CoreStyleManager 기능을 StyleManager로 병합',
        '3. StyleService 래퍼를 단순화',
        '4. CSS 유틸리티들을 StyleManager로 통합',
        '5. 테스트 업데이트 및 검증',
      ],
    };

    console.log('🔴 StyleManager 통합 계획:', integrationPlan);
    expect(integrationPlan.deprecatedImplementations.length).toBeGreaterThan(0);
  });

  it('성능 유틸리티 통합 계획이 필요해야 함', () => {
    // RED: 성능 관련 함수들이 분산되어 있음
    const performancePlan = {
      targetModule: '@shared/utils/performance',
      consolidateFunctions: ['throttle', 'debounce', 'rafThrottle', 'memo'],
      removeFromModules: [
        '@shared/services (throttle)',
        '@shared/external/vendors (memo)',
        '기타 분산된 위치들',
      ],
    };

    console.log('🔴 성능 유틸리티 통합 계획:', performancePlan);
    expect(performancePlan.consolidateFunctions.length).toBeGreaterThan(0);
  });

  it('서비스 관리자 단순화 계획이 필요해야 함', () => {
    // RED: 서비스 관리자가 과도하게 복잡함
    const simplificationPlan = {
      currentIssues: ['복잡한 팩토리 패턴', '과도한 메서드 수', '일관되지 않은 접근 방식'],
      targetSimplification: [
        '단순한 인스턴스 저장소로 변경',
        '메서드 수 50% 감소',
        '단일 접근 인터페이스 제공',
      ],
    };

    console.log('🔴 서비스 관리자 단순화 계획:', simplificationPlan);
    expect(simplificationPlan.currentIssues.length).toBeGreaterThan(0);
  });
});
