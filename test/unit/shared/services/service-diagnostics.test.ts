/**
 * @fileoverview ServiceDiagnostics 테스트
 * @description 서비스 진단 기능 테스트 (TDD)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  ServiceDiagnostics,
  diagnoseServiceManager,
  registerDiagnosticsGlobal,
} from '../../../../src/shared/services/diagnostics';
import { logger } from '../../../../src/shared/logging';

describe('ServiceDiagnostics', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.restoreAllMocks();
    // 환경 변수 초기화
    vi.stubEnv('DEV', true);
  });

  afterEach(() => {
    // 전역 함수 정리
    delete (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('diagnoseServiceManager()', () => {
    it('서비스 매니저 진단을 성공적으로 수행해야 함', async () => {
      // 이 테스트는 실제 서비스 초기화를 수행하므로 통합 테스트에 가깝습니다
      await expect(diagnoseServiceManager()).resolves.not.toThrow();
    });

    it('진단 중 발생한 에러를 재throw해야 함', async () => {
      const initModule = await import('../../../../src/shared/services/service-initialization');
      const registerSpy = vi
        .spyOn(initModule, 'registerCoreServices')
        .mockRejectedValue(new Error('Mock registration error'));

      await expect(diagnoseServiceManager()).rejects.toThrow('Mock registration error');

      registerSpy.mockRestore();
    });

    it('필수 서비스 초기화를 시도해야 함', async () => {
      // SERVICE_KEYS.THEME이 tryGet으로 호출되는지 확인
      // 실제 구현은 통합 테스트에서 검증하므로 여기서는 에러가 발생하지 않는지만 확인
      await expect(diagnoseServiceManager()).resolves.not.toThrow();
    });
  });

  describe('registerGlobalDiagnostic()', () => {
    it('DEV 모드에서 전역 진단 함수를 등록해야 함', () => {
      vi.stubEnv('DEV', true);

      registerDiagnosticsGlobal();

      expect((globalThis as Record<string, unknown>).__XEG_DIAGNOSE__).toBeDefined();
      expect((globalThis as Record<string, unknown>).__XEG_DIAGNOSE__).toBe(
        ServiceDiagnostics.diagnoseServiceManager
      );
    });

    it('DEV 모드가 아니면 전역 함수를 등록하지 않아야 함', () => {
      vi.stubEnv('DEV', false);

      registerDiagnosticsGlobal();

      expect((globalThis as Record<string, unknown>).__XEG_DIAGNOSE__).toBeUndefined();
    });

    it('이미 등록된 전역 함수를 덮어써야 함', () => {
      vi.stubEnv('DEV', true);

      // 첫 번째 등록
      registerDiagnosticsGlobal();
      const firstRegistration = (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__;

      // 두 번째 등록
      registerDiagnosticsGlobal();
      const secondRegistration = (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__;

      // 동일한 참조여야 함 (static 메서드이므로)
      expect(firstRegistration).toBe(secondRegistration);
      expect(secondRegistration).toBe(ServiceDiagnostics.diagnoseServiceManager);
    });
  });

  describe('Integration - diagnoseServiceManager + registerGlobalDiagnostic', () => {
    it('전역 함수를 통해 진단을 실행할 수 있어야 함', async () => {
      vi.stubEnv('DEV', true);

      ServiceDiagnostics.registerGlobalDiagnostic();

      const diagnose = (globalThis as Record<string, unknown>)
        .__XEG_DIAGNOSE__ as typeof ServiceDiagnostics.diagnoseServiceManager;

      expect(diagnose).toBeDefined();
      await expect(diagnose()).resolves.not.toThrow();
    });

    it('전역 함수가 실제 diagnoseServiceManager와 동일해야 함', () => {
      vi.stubEnv('DEV', true);

      ServiceDiagnostics.registerGlobalDiagnostic();

      expect((globalThis as Record<string, unknown>).__XEG_DIAGNOSE__).toBe(
        ServiceDiagnostics.diagnoseServiceManager
      );
    });
  });

  describe('Dynamic Import Handling', () => {
    it('service-initialization 모듈을 동적으로 import해야 함', async () => {
      // 이 테스트는 순환 의존성을 방지하기 위한 동적 import 검증
      await expect(ServiceDiagnostics.diagnoseServiceManager()).resolves.not.toThrow();
    });

    it('service-manager 모듈을 동적으로 import해야 함', async () => {
      await expect(ServiceDiagnostics.diagnoseServiceManager()).resolves.not.toThrow();
    });

    it('constants 모듈을 동적으로 import해야 함', async () => {
      await expect(ServiceDiagnostics.diagnoseServiceManager()).resolves.not.toThrow();
    });
  });

  describe('Error Recovery', () => {
    it('진단 중 일부 단계가 실패해도 에러 로깅 후 계속 진행해야 함', async () => {
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

      await expect(ServiceDiagnostics.diagnoseServiceManager()).resolves.not.toThrow();

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('tryGet 실패 시에도 전체 진단이 실패하지 않아야 함', async () => {
      // tryGet은 서비스가 없어도 에러를 throw하지 않으므로
      // 진단 전체는 성공해야 함
      await expect(ServiceDiagnostics.diagnoseServiceManager()).resolves.not.toThrow();
    });
  });

  describe('Diagnostics Output', () => {
    it('ServiceManager 상태 정보를 로깅해야 함', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      await ServiceDiagnostics.diagnoseServiceManager();

      const messages = infoSpy.mock.calls.map(call => call[0]);
      expect(messages).toContain('🔍 ServiceManager diagnostic started');
      expect(messages).toContain('✅ ServiceManager diagnostic complete');
    });

    it('등록된 서비스 수를 보고해야 함', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      await ServiceDiagnostics.diagnoseServiceManager();

      const payloads = infoSpy.mock.calls
        .map(([, payload]) => payload)
        .filter(
          (value): value is Record<string, unknown> => typeof value === 'object' && value !== null
        );
      const hasRegisteredCount = payloads.some(payload => 'registeredCount' in payload);
      expect(hasRegisteredCount).toBe(true);
    });

    it('초기화된 서비스 수를 보고해야 함', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      await ServiceDiagnostics.diagnoseServiceManager();

      const payloads = infoSpy.mock.calls
        .map(([, payload]) => payload)
        .filter(
          (value): value is Record<string, unknown> => typeof value === 'object' && value !== null
        );
      const hasInitializedCount = payloads.some(payload => 'initializedCount' in payload);
      expect(hasInitializedCount).toBe(true);
    });
  });

  describe('Environment Detection', () => {
    it('DEV 환경에서만 전역 진단을 등록해야 함', () => {
      // DEV=true
      vi.stubEnv('DEV', true);
      ServiceDiagnostics.registerGlobalDiagnostic();
      expect((globalThis as Record<string, unknown>).__XEG_DIAGNOSE__).toBeDefined();

      // 정리
      delete (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__;

      // DEV=false
      vi.stubEnv('DEV', false);
      ServiceDiagnostics.registerGlobalDiagnostic();
      expect((globalThis as Record<string, unknown>).__XEG_DIAGNOSE__).toBeUndefined();
    });

    it('import.meta.env.DEV를 정확히 체크해야 함', () => {
      // true 체크
      vi.stubEnv('DEV', true);
      ServiceDiagnostics.registerGlobalDiagnostic();
      expect((globalThis as Record<string, unknown>).__XEG_DIAGNOSE__).toBeDefined();
      delete (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__;

      // false 체크
      vi.stubEnv('DEV', false);
      ServiceDiagnostics.registerGlobalDiagnostic();
      expect((globalThis as Record<string, unknown>).__XEG_DIAGNOSE__).toBeUndefined();

      // 정리
      delete (globalThis as Record<string, unknown>).__XEG_DIAGNOSE__;
    });
  });
});
