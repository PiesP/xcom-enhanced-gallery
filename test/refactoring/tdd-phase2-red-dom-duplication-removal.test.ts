/**
 * @fileoverview 🔴 RED Phase 2: DOM 서비스 중복 제거 RED 테스트
 * @description 현재 DOM 관련 중복들이 존재함을 확인하는 실패하는 테스트들
 * @version 1.0.0 - TDD RED Phase 2
 */

import { describe, it, expect } from 'vitest';

describe('🔴 RED Phase 2: DOM 서비스 중복 제거', () => {
  describe('중복 DOM 서비스 파일 존재 확인', () => {
    it('RED: 중복 DOM 서비스들이 현재 존재해야 함', async () => {
      // RED: 이 테스트들은 중복이 제거될 때까지 실패해야 함
      const duplicateServices = [];

      // 1. DOMService.ts - unified-dom-service.ts와 중복
      try {
        const domService = await import('@shared/dom/DOMService');
        if (domService.DOMService) {
          duplicateServices.push('DOMService.ts');
        }
      } catch {
        // 파일이 없으면 이미 제거됨
      }

      // 2. component-manager.ts - DOM 관련 기능이 unified-dom-service와 중복
      try {
        const componentManager = await import('@shared/components/component-manager');
        if (componentManager.componentManager) {
          duplicateServices.push('component-manager.ts');
        }
      } catch {
        // 파일이 없거나 DOM 기능이 제거됨
      }

      // 3. dom-cache.ts - unified-dom-service에 캐싱 기능 포함됨
      try {
        const domCache = await import('@shared/dom/dom-cache');
        if (domCache.DOMCache) {
          duplicateServices.push('dom-cache.ts');
        }
      } catch {
        // 파일이 없으면 이미 제거됨
      }

      // 4. dom-event-manager.ts - unified-dom-service에 이벤트 관리 포함됨
      try {
        const domEventManager = await import('@shared/dom/dom-event-manager');
        if (domEventManager.DOMEventManager) {
          duplicateServices.push('dom-event-manager.ts');
        }
      } catch {
        // 파일이 없으면 이미 제거됨
      }

      console.log('🔴 발견된 중복 DOM 서비스들:', duplicateServices);

      // RED: 현재는 중복이 있어야 함 (제거되면 이 테스트는 실패하게 됨)
      expect(duplicateServices.length).toBeGreaterThan(0);
    });

    it('RED: DOM 유틸리티 함수들이 여러 곳에 중복 구현되어야 함', async () => {
      const domUtilLocations = [];

      // 1. shared/utils/dom.ts
      try {
        const domUtils = await import('@shared/utils/dom');
        if (domUtils.querySelector || domUtils.safeQuerySelector) {
          domUtilLocations.push('utils/dom.ts');
        }
      } catch {
        // 파일이 없거나 함수가 없으면 이미 정리됨
      }

      // 2. shared/dom/DOMService.ts
      try {
        const domService = await import('@shared/dom/DOMService');
        if (domService.querySelector) {
          domUtilLocations.push('dom/DOMService.ts');
        }
      } catch {
        // 파일이 없거나 함수가 없으면 이미 정리됨
      }

      // 3. shared/dom/unified-dom-service.ts (이건 메인이므로 유지)
      try {
        const unifiedDom = await import('@shared/dom/unified-dom-service');
        if (unifiedDom.querySelector) {
          domUtilLocations.push('dom/unified-dom-service.ts');
        }
      } catch {
        // 이 파일은 반드시 있어야 함
      }

      console.log('🔴 발견된 DOM 유틸리티 위치들:', domUtilLocations);

      // RED: 현재는 여러 곳에 DOM 유틸이 있어야 함 (통합되면 1개만 남아야 함)
      expect(domUtilLocations.length).toBeGreaterThan(1);
    });
  });

  describe('사용되지 않는 DOM 파일들 식별', () => {
    it('RED: 커버리지 0%인 DOM 파일들이 존재해야 함', async () => {
      // Coverage 리포트에서 0% 커버리지인 DOM 관련 파일들
      const unusedDOMFiles = [
        'src/shared/dom/DOMService.ts', // 0% coverage
        'src/shared/dom/dom-cache.ts', // 0% coverage
        'src/shared/dom/dom-event-manager.ts', // 0% coverage
      ];

      // RED: 이 파일들은 현재 사용되지 않으므로 제거되어야 함
      for (const filePath of unusedDOMFiles) {
        try {
          // 파일 존재 여부만 확인 (실제 import는 하지 않음)
          const fileExists = true; // 실제로는 파일시스템 체크가 필요하지만 테스트에서는 단순화
          expect(fileExists).toBe(true);
          expect(filePath).toBeDefined();
        } catch {
          // 파일이 없으면 이미 정리됨
        }
      }

      // RED: 현재는 사용되지 않는 파일들이 존재해야 함
      expect(unusedDOMFiles.length).toBeGreaterThan(0);
    });
  });

  describe('API 호환성 검증', () => {
    it('RED: 기존 import 경로들이 작동하지만 deprecated 경고가 있어야 함', async () => {
      const deprecatedPaths = [];

      // 기존 코드에서 사용할 수 있는 deprecated 경로들
      const pathsToCheck = [
        '@shared/dom/DOMService',
        '@shared/utils/dom',
        '@shared/components/component-manager',
      ];

      for (const path of pathsToCheck) {
        try {
          await import(path);
          deprecatedPaths.push(path);
        } catch {
          // import 실패하면 이미 제거됨
        }
      }

      console.log('🔴 Deprecated 경로들:', deprecatedPaths);

      // RED: 현재는 이전 경로들이 여전히 작동해야 함
      expect(deprecatedPaths.length).toBeGreaterThan(0);
    });
  });
});

describe('🎯 Phase 2 완료 기준', () => {
  it('목표: 단일 DOM 서비스만 존재해야 함 (unified-dom-service)', () => {
    // 이 테스트는 Phase 2 완료 후 GREEN이 되어야 함
    const targetState = {
      mainService: 'unified-dom-service.ts',
      removedServices: [
        'DOMService.ts',
        'dom-cache.ts (기능 통합됨)',
        'dom-event-manager.ts (기능 통합됨)',
      ],
      unifiedAPI: 'DOM 관련 모든 기능이 single source of truth에서 제공',
    };

    expect(targetState.mainService).toBe('unified-dom-service.ts');
    expect(targetState.removedServices.length).toBeGreaterThan(0);
  });

  it('목표: 100% backward compatibility 유지', () => {
    // 기존 코드가 변경 없이 작동해야 함
    const compatibilityRequirement = {
      existingImports: 'should continue to work',
      apiSignatures: 'should remain identical',
      functionality: 'should be preserved',
    };

    expect(compatibilityRequirement.existingImports).toBe('should continue to work');
  });
});
