/**
 * @fileoverview TDZ 문제 해결 검증 테스트
 * @description 정적 import 기반 vendor 시스템이 TDZ 문제를 해결했는지 검증
 *
 * TDD Phase: GREEN - 정적 import 기반 시스템이 TDZ 문제를 해결했는지 확인
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TDZ 문제 해결 검증', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // 각 테스트 후 vendor manager 리셋
    try {
      const { resetVendorManagerInstance } = await import(
        '@shared/external/vendors/vendor-api-safe'
      );
      resetVendorManagerInstance();
    } catch {
      // 모듈 로드 실패 시 무시 (테스트 환경에서는 문제없음)
    }
  });

  describe('정적 import 기반 시스템', () => {
    it('정적 import로 TDZ 문제 없이 vendor 초기화가 성공한다', async () => {
      // 정적 import 기반 vendor 시스템 테스트
      const { initializeVendorsSafe, isVendorsInitializedSafe } = await import(
        '@shared/external/vendors/vendor-api-safe'
      );

      // 초기화 실행 - TDZ 에러 없이 성공해야 함 (중복 초기화도 안전)
      await expect(initializeVendorsSafe()).resolves.not.toThrow();

      // 초기화 후 상태 확인 - 초기화되어 있어야 함
      expect(isVendorsInitializedSafe()).toBe(true);

      // TDZ 문제가 없음을 확인하기 위해 추가 검증
      expect(() => {
        // 여러 번 호출해도 안전해야 함
        isVendorsInitializedSafe();
        isVendorsInitializedSafe();
      }).not.toThrow();
    });

    it('초기화 없이 getter 호출 시 자동 초기화가 안전하게 작동한다', async () => {
      // 정적 import 기반에서는 자동 초기화가 안전하게 작동
      const { getSolidSafe } = await import('@shared/external/vendors/vendor-api-safe');

      // 초기화 없이 직접 호출해도 TDZ 에러 없이 작동
      expect(() => {
        const compat = getSolidSafe();
        expect(compat).toBeDefined();
        expect(compat.memo).toBeDefined();
        expect(compat.forwardRef).toBeDefined();
        expect(typeof compat.memo).toBe('function');
        expect(typeof compat.forwardRef).toBe('function');
      }).not.toThrow();
    });

    it('모든 vendor getter가 TDZ 에러 없이 작동한다', async () => {
      const {
        getFflateSafe,
        getSolidSafe,
        getSolidSafe,
        getSolidSafe,
        getSolidSafe,
        getNativeDownloadSafe,
      } = await import('@shared/external/vendors/vendor-api-safe');

      // 모든 getter가 TDZ 에러 없이 작동해야 함
      expect(() => {
        const fflate = getFflateSafe();
        expect(fflate.deflate).toBeDefined();
        expect(typeof fflate.deflate).toBe('function');
      }).not.toThrow();

      expect(() => {
        const preact = getSolidSafe();
        expect(preact.render).toBeDefined();
        expect(typeof preact.render).toBe('function');
      }).not.toThrow();

      expect(() => {
        const hooks = getSolidSafe();
        expect(hooks.createSignal).toBeDefined();
        expect(typeof hooks.createSignal).toBe('function');
      }).not.toThrow();

      expect(() => {
        const signals = getSolidSafe();
        expect(signals.signal).toBeDefined();
        expect(typeof signals.signal).toBe('function');
      }).not.toThrow();

      expect(() => {
        const compat = getSolidSafe();
        expect(compat.memo).toBeDefined();
        expect(typeof compat.memo).toBe('function');
      }).not.toThrow();

      expect(() => {
        const download = getNativeDownloadSafe();
        expect(download.downloadBlob).toBeDefined();
        expect(typeof download.downloadBlob).toBe('function');
      }).not.toThrow();
    });

    it('병렬 초기화 호출이 안전하게 처리된다', async () => {
      // 여러 초기화 호출이 동시에 발생해도 안전해야 함
      const { initializeVendorsSafe, isVendorsInitializedSafe } = await import(
        '@shared/external/vendors/vendor-api-safe'
      );

      // 병렬로 여러 번 초기화 호출
      const initPromises = [
        initializeVendorsSafe(),
        initializeVendorsSafe(),
        initializeVendorsSafe(),
        initializeVendorsSafe(),
        initializeVendorsSafe(),
      ];

      // 모든 호출이 성공해야 함
      await expect(Promise.all(initPromises)).resolves.not.toThrow();

      // 초기화 상태 확인
      expect(isVendorsInitializedSafe()).toBe(true);
    });

    it('라이브러리 검증이 정상적으로 작동한다', async () => {
      const { validateVendorsSafe } = await import('@shared/external/vendors/vendor-api-safe');

      const result = await validateVendorsSafe();

      expect(result.success).toBe(true);
      expect(result.loadedLibraries).toContain('fflate');
      expect(result.loadedLibraries).toContain('Preact');
      expect(result.loadedLibraries).toContain('PreactHooks');
      expect(result.loadedLibraries).toContain('PreactSignals');
      expect(result.loadedLibraries).toContain('PreactCompat');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('번들 환경 호환성', () => {
    it('번들된 환경에서도 정적 import가 안전하게 작동한다', async () => {
      // 번들 환경 시뮬레이션 (정적 import 사용)
      const staticImportBasedCode = async () => {
        // 이제는 정적 import이므로 TDZ 문제 없음
        const fflate = await import('fflate');
        const solid = await import('solid-js');
        const solidStore = await import('solid-js/store');

        // 즉시 사용 가능
        return {
          fflate: fflate.deflate,
          solid: solid.createSignal,
          solidStore: solidStore.createStore,
        };
      };

      // 정적 import 기반에서는 즉시 사용 가능
      const result = await staticImportBasedCode();
      expect(result.fflate).toBeDefined();
      expect(result.solid).toBeDefined();
      expect(result.solidStore).toBeDefined();
    });

    it('inlineDynamicImports 설정과 무관하게 안정적으로 작동한다', async () => {
      // 정적 import는 번들러 설정과 무관하게 안정적
      const { getSolidSafe } = await import('@shared/external/vendors/vendor-api-safe');

      // 번들 환경에서도 안전하게 작동
      for (let i = 0; i < 10; i++) {
        expect(() => {
          const compat = getSolidSafe();
          expect(compat.memo).toBeDefined();
        }).not.toThrow();
      }
    });

    it('모듈 초기화 순서와 무관하게 안전하다', async () => {
      // 정적 import는 모듈 평가 시점에 이미 사용 가능
      const testModuleOrder = async () => {
        // 순서를 바꿔서 여러 번 테스트
        const orders = [
          ['vendor-api-safe', 'vendor-manager-static'],
          ['vendor-manager-static', 'vendor-api-safe'],
        ];

        for (const order of orders) {
          for (const moduleName of order) {
            try {
              if (moduleName === 'vendor-api-safe') {
                const { getSolidSafe } = await import('@shared/external/vendors/vendor-api-safe');
                const compat = getSolidSafe();
                expect(compat.memo).toBeDefined();
              }
            } catch (error) {
              // 에러 발생 시 테스트 실패
              throw new Error(`모듈 순서 테스트 실패: ${moduleName}, ${error}`);
            }
          }
        }
      };

      await expect(testModuleOrder()).resolves.not.toThrow();
    });
  });

  describe('기존 시스템과의 호환성', () => {
    it('기존 컴포넌트에서 안전한 API를 사용할 수 있다', async () => {
      // 기존 컴포넌트에서 memo 사용 패턴 테스트
      const { getSolidSafe } = await import('@shared/external/vendors/vendor-api-safe');

      const createMemoizedComponent = () => {
        const compat = getSolidSafe();

        // 실제 컴포넌트 정의
        const TestComponent = props => {
          return props.children;
        };

        // memo 적용
        const MemoizedComponent = compat.memo(TestComponent);

        return MemoizedComponent;
      };

      expect(() => {
        const Component = createMemoizedComponent();
        expect(Component).toBeDefined();
        expect(typeof Component).toBe('function');
      }).not.toThrow();
    });

    it('상태 보고서가 정확한 정보를 제공한다', async () => {
      const { getVendorInitializationReportSafe } = await import(
        '@shared/external/vendors/vendor-api-safe'
      );

      const report = getVendorInitializationReportSafe();

      expect(report).toHaveProperty('isInitialized');
      expect(report).toHaveProperty('availableAPIs');
      expect(report).toHaveProperty('versions');
      expect(report).toHaveProperty('initializationRate');
      expect(report.totalCount).toBe(5);

      if (report.isInitialized) {
        expect(report.initializationRate).toBe(100);
        expect(report.initializedCount).toBe(5);
        expect(report.availableAPIs).toContain('fflate');
        expect(report.availableAPIs).toContain('preact');
      }
    });
  });

  describe('메모리 관리', () => {
    it('cleanup이 안전하게 작동한다', async () => {
      const { initializeVendorsSafe, cleanupVendorsSafe, isVendorsInitializedSafe } = await import(
        '@shared/external/vendors/vendor-api-safe'
      );

      // 초기화
      await initializeVendorsSafe();
      expect(isVendorsInitializedSafe()).toBe(true);

      // 정리
      expect(() => {
        cleanupVendorsSafe();
      }).not.toThrow();

      // 정리 후 상태 확인
      expect(isVendorsInitializedSafe()).toBe(false);
    });
  });
});
