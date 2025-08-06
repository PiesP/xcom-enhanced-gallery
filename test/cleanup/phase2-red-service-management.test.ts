/**
 * @fileoverview TDD RED Phase: Service Management 중복 제거 테스트
 * @description Service Manager와 Component Manager의 중복 기능 통합 검증
 */

import { describe, it, expect } from 'vitest';

describe('🔴 RED Phase: Service Management 중복 분석', () => {
  describe('CoreService vs ServiceDiagnostics 중복', () => {
    it('진단 기능이 CoreService에만 존재해야 함', async () => {
      // RED: 현재는 ServiceDiagnostics 클래스에도 중복 존재

      const coreServiceMethods = await getClassMethods('CoreService');
      const serviceDiagnosticsMethods = await getClassMethods('ServiceDiagnostics');

      // 진단 기능은 CoreService에만 있어야 함
      expect(coreServiceMethods).toContain('diagnoseServiceManager');
      expect(serviceDiagnosticsMethods).not.toContain('diagnoseServiceManager');
    });

    it('ServiceDiagnostics 클래스가 제거되어야 함', async () => {
      // RED: 현재는 존재함

      const diagnosticsClassExists = await checkClassExists('ServiceDiagnostics');

      expect(diagnosticsClassExists).toBe(false);
    });

    it('core-services.ts 파일이 단순화되어야 함', async () => {
      // RED: 현재는 너무 많은 책임이 혼재

      const coreServicesExports = await analyzeFileExports('src/shared/services/core-services.ts');

      // 단순한 re-export만 있어야 함
      expect(coreServicesExports.classes).toHaveLength(0);
      expect(coreServicesExports.types.length).toBeLessThan(5);
    });
  });

  describe('Component Manager 중복 기능', () => {
    it('DOM 관련 기능이 UnifiedDOMService로 완전 위임되어야 함', async () => {
      // RED: 현재는 component-manager에 DOM 기능이 남아있음

      const componentManagerMethods = await getClassMethods('UnifiedComponentManagerImpl');

      // DOM 관련 메서드가 없어야 함
      expect(componentManagerMethods).not.toContain('createElement');
      expect(componentManagerMethods).not.toContain('addEventListener');
      expect(componentManagerMethods).not.toContain('removeEventListener');
    });

    it('컴포넌트 관리자가 순수한 컴포넌트 기능만 담당해야 함', async () => {
      // RED: 현재는 DOM, 상태, 이벤트가 혼재

      const componentManagerResponsibilities = await analyzeClassResponsibilities(
        'UnifiedComponentManagerImpl'
      );

      expect(componentManagerResponsibilities).toEqual([
        'hooks-management',
        'state-management',
        'event-handling',
      ]);
      expect(componentManagerResponsibilities).not.toContain('dom-manipulation');
    });
  });

  describe('싱글톤 패턴 중복', () => {
    it('싱글톤 구현이 표준화되어야 함', async () => {
      // RED: 현재는 서로 다른 싱글톤 패턴 구현

      const singletonClasses = await findSingletonClasses();
      const singletonPatterns = singletonClasses.map(cls => cls.pattern);
      const uniquePatterns = new Set(singletonPatterns);

      expect(uniquePatterns.size).toBe(1);
    });

    it('메모리 관리 인터페이스가 통일되어야 함', async () => {
      // RED: 현재는 각각 다른 cleanup 방식

      const cleanupMethods = await findCleanupMethods();
      const cleanupSignatures = cleanupMethods.map(method => method.signature);
      const uniqueSignatures = new Set(cleanupSignatures);

      expect(uniqueSignatures.size).toBe(1);
    });
  });

  describe('서비스 초기화 중복', () => {
    it('서비스 등록 로직이 통합되어야 함', async () => {
      // RED: 현재는 여러 파일에 등록 로직 분산

      const registrationLogics = await findServiceRegistrationLogics();

      expect(registrationLogics).toHaveLength(1);
      expect(registrationLogics[0].file).toBe('src/shared/services/service-initialization.ts');
    });

    it('중복된 서비스 키 관리가 제거되어야 함', async () => {
      // RED: 현재는 SERVICE_KEYS가 여러 곳에서 정의

      const serviceKeyDefinitions = await findServiceKeyDefinitions();

      expect(serviceKeyDefinitions).toHaveLength(1);
    });
  });

  describe('테스트 Mock 중복', () => {
    it('ServiceManager 테스트 Mock이 통합되어야 함', async () => {
      // RED: 현재는 여러 테스트 파일에 중복 Mock

      const serviceManagerMocks = await findServiceManagerMocks();

      expect(serviceManagerMocks).toHaveLength(1);
      expect(serviceManagerMocks[0].location).toBe('test/__mocks__/ServiceManager.ts');
    });

    it('TestServiceManager 클래스가 제거되어야 함', async () => {
      // RED: 현재는 integration 테스트에 중복 구현

      const testServiceManagerExists = await checkClassExists('TestServiceManager');

      expect(testServiceManagerExists).toBe(false);
    });
  });
});

// =================================
// Mock 분석 함수들
// =================================

async function getClassMethods(className: string): Promise<string[]> {
  // RED: 실제로는 중복된 메서드들이 발견될 것
  const classMethodMap: Record<string, string[]> = {
    CoreService: [
      'getInstance',
      'register',
      'get',
      'tryGet',
      'has',
      'cleanup',
      'reset',
      'diagnoseServiceManager', // 현재 중복
      'getDiagnostics',
    ],
    ServiceDiagnostics: [
      'diagnoseServiceManager', // 중복!
      'registerGlobalDiagnostic',
    ],
    UnifiedComponentManagerImpl: [
      'createComponent',
      'getHookManager',
      'getStateManager',
      'getEventManager',
      'withHooks',
      'withStateManagement',
      'withEventHandling',
      'createElement', // DOM 기능 - 제거되어야 함
      'addEventListener', // DOM 기능 - 제거되어야 함
      'removeEventListener', // DOM 기능 - 제거되어야 함
    ],
  };

  return classMethodMap[className] || [];
}

async function checkClassExists(className: string): Promise<boolean> {
  // RED: 현재는 제거되어야 할 클래스들이 존재
  const shouldNotExist = ['ServiceDiagnostics', 'TestServiceManager'];
  return shouldNotExist.includes(className);
}

async function analyzeFileExports(filePath: string): Promise<{
  classes: string[];
  functions: string[];
  types: string[];
}> {
  // RED: core-services.ts에 너무 많은 export가 있음
  if (filePath.includes('core-services.ts')) {
    return {
      classes: ['ServiceDiagnostics', 'ConsoleLogger'], // 제거되어야 함
      functions: ['registerCoreServices', 'diagnoseServiceManager'],
      types: ['Logger', 'ILogger', 'ServiceKey', 'ServiceTypeMapping'],
    };
  }

  return { classes: [], functions: [], types: [] };
}

async function analyzeClassResponsibilities(className: string): Promise<string[]> {
  // RED: UnifiedComponentManagerImpl에 DOM 기능이 섞여있음
  if (className === 'UnifiedComponentManagerImpl') {
    return [
      'hooks-management',
      'state-management',
      'event-handling',
      'dom-manipulation', // 제거되어야 함
    ];
  }

  return [];
}

async function findSingletonClasses(): Promise<Array<{ class: string; pattern: string }>> {
  // RED: 서로 다른 싱글톤 패턴
  return [
    { class: 'CoreService', pattern: 'lazy-initialization' },
    { class: 'UnifiedDOMService', pattern: 'lazy-initialization' },
    { class: 'UnifiedMemoryManager', pattern: 'lazy-initialization-with-null-check' },
    { class: 'VendorManager', pattern: 'eager-initialization' },
  ];
}

async function findCleanupMethods(): Promise<Array<{ class: string; signature: string }>> {
  // RED: 서로 다른 cleanup 시그니처
  return [
    { class: 'CoreService', signature: 'cleanup(): void' },
    { class: 'UnifiedDOMService', signature: 'cleanup(): void' },
    { class: 'UnifiedMemoryManager', signature: 'cleanup(): Promise<void>' },
    { class: 'ComponentManager', signature: 'destroy(): void' },
  ];
}

async function findServiceRegistrationLogics(): Promise<Array<{ file: string }>> {
  // RED: 여러 파일에 등록 로직 분산
  return [
    { file: 'src/shared/services/service-initialization.ts' },
    { file: 'src/shared/services/core-services.ts' },
    { file: 'src/main.ts' },
  ];
}

async function findServiceKeyDefinitions(): Promise<Array<{ file: string }>> {
  // RED: SERVICE_KEYS가 여러 곳에서 정의
  return [{ file: 'src/constants.ts' }, { file: 'src/shared/services/core-services.ts' }];
}

async function findServiceManagerMocks(): Promise<Array<{ location: string }>> {
  // RED: 여러 곳에 중복 Mock
  return [
    { location: 'test/core/services/ServiceManager.integration.test.ts' },
    { location: 'test/unit/shared/services/ServiceManager.test.ts' },
    { location: 'test/consolidated/services.consolidated.test.ts' },
  ];
}
