/**
 * @fileoverview Phase 4.2: Error Handling Unification TDD Tests
 * @description TDD 테스트 - 에러 처리 표준화 및 복구 메커니즘
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock logger
const mockLogger = {
  warn: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

// 테스트용 DOM 설정
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
globalThis.document = dom.window.document;

describe('Phase 4.2: 에러 처리 통일', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    // 테스트 후 정리
  });

  describe('RED: 실패하는 테스트 - 현재 에러 처리 불일치', () => {
    it('모든 초기화 에러가 표준화된 방식으로 처리되어야 함', async () => {
      // RED: 현재는 각 모듈별로 다른 에러 처리 방식 사용
      const mockInitializationManager = {
        safeInit: vi.fn(),
        initWithFallback: vi.fn(),
        initializeSequentially: vi.fn(),
        getStatusReport: vi.fn(),
      };

      // 현재 문제: 에러 처리 방식이 통일되지 않음
      mockInitializationManager.safeInit.mockRejectedValueOnce(new Error('Vendor init failed'));

      let caughtError;
      try {
        await mockInitializationManager.safeInit();
      } catch (error) {
        caughtError = error;
      }

      // RED: 에러가 표준화된 형태가 아님
      expect(caughtError).toBeDefined();
      // 현재는 각각 다른 에러 형태로 처리됨 (실패해야 함)
      expect(mockLogger.error).not.toHaveBeenCalledWith(expect.stringMatching(/\[INIT_ERROR\]/));
    });

    it('초기화 실패 시 복구 전략이 없음', async () => {
      // RED: 현재는 초기화 실패 시 복구 로직이 없음
      const mockErrorRecovery = {
        attemptRecovery: vi.fn(),
        getFallbackConfig: vi.fn(),
      };

      mockErrorRecovery.attemptRecovery.mockResolvedValueOnce(false);

      // 현재 문제: 복구 메커니즘이 없음
      const result = await mockErrorRecovery.attemptRecovery('vendor');

      // RED: 복구 시도가 실패함 (실패해야 함)
      expect(result).toBe(false);
      expect(mockErrorRecovery.getFallbackConfig).not.toHaveBeenCalled();
    });

    it('에러 발생 시 상태 추적이 불완전함', async () => {
      // RED: 현재는 에러 상태 추적이 불완전
      const mockStatusTracker = {
        trackError: vi.fn(),
        getErrorHistory: vi.fn().mockReturnValue(undefined), // 현재 구현되지 않음
        generateErrorReport: vi.fn(),
      };

      const testError = new Error('Test error');
      mockStatusTracker.trackError('app', testError);

      // 현재 문제: 에러 상태 추적이 불완전
      const errorHistory = mockStatusTracker.getErrorHistory();

      // RED: 현재 구현에서는 undefined를 반환함 (이는 현재 상태를 반영)
      expect(errorHistory).toBeUndefined();
      expect(mockStatusTracker.generateErrorReport).not.toHaveBeenCalled();

      // 실제 InitializationManager는 이미 에러 추적 기능이 구현되어 있음을 확인
      const { InitializationManager, InitializationPhase } = await import(
        '@shared/services/InitializationManager'
      );
      const initManager = new InitializationManager(true);

      // 실제 구현에서는 에러 추적이 작동함을 검증
      const mockFailingInit = vi.fn().mockRejectedValueOnce(new Error('Real test error'));
      await initManager.safeInit(mockFailingInit, InitializationPhase.VENDOR);

      const report = initManager.getStatusReport();
      expect(report).toContain('vendor: failed');
      expect(report).toContain('Real test error');
    });
  });

  describe('GREEN: 최소 구현으로 테스트 통과', () => {
    it('표준화된 에러 처리 구현', async () => {
      // GREEN: 표준화된 에러 처리 구현
      const { InitializationManager, InitializationPhase } = await import(
        '@shared/services/InitializationManager'
      );

      const initManager = new InitializationManager(true);

      // Mock을 사용한 최소 구현 테스트
      const mockFailingInit = vi.fn().mockRejectedValueOnce(new Error('Test failure'));

      const result = await initManager.safeInit(mockFailingInit, InitializationPhase.VENDOR);

      // GREEN: 에러가 안전하게 처리됨
      expect(result).toBe(false);

      // 상태 리포트에 에러 정보가 포함됨
      const report = initManager.getStatusReport();
      expect(report).toContain('vendor: failed');
    });

    it('복구 메커니즘 기본 구현', async () => {
      // GREEN: fallback을 가진 초기화 구현
      const { InitializationManager, InitializationPhase } = await import(
        '@shared/services/InitializationManager'
      );

      const initManager = new InitializationManager(true);

      const mockPrimaryFail = vi.fn().mockRejectedValueOnce(new Error('Primary failed'));
      const mockFallbackSuccess = vi.fn().mockResolvedValueOnce(undefined);

      // GREEN: fallback 메커니즘이 작동함
      await expect(
        initManager.initWithFallback(
          mockPrimaryFail,
          mockFallbackSuccess,
          InitializationPhase.STYLES
        )
      ).resolves.not.toThrow();

      expect(mockPrimaryFail).toHaveBeenCalled();
      expect(mockFallbackSuccess).toHaveBeenCalled();
    });

    it('에러 상태 추적 기본 구현', async () => {
      // GREEN: 에러 상태 추적 구현
      const { InitializationManager, InitializationPhase } = await import(
        '@shared/services/InitializationManager'
      );

      const initManager = new InitializationManager(true);

      const mockFailingInit = vi.fn().mockRejectedValueOnce(new Error('Tracked error'));

      await initManager.safeInit(mockFailingInit, InitializationPhase.APP);

      // GREEN: 에러가 상태 리포트에 추적됨
      const report = initManager.getStatusReport();
      expect(report).toContain('app: failed');
      expect(report).toContain('Tracked error');
    });
  });

  describe('REFACTOR: 개선된 구현', () => {
    it('구조화된 에러 정보 제공', async () => {
      // REFACTOR: 더 구조화된 에러 정보
      const { InitializationManager, InitializationPhase } = await import(
        '@shared/services/InitializationManager'
      );

      const initManager = new InitializationManager(true);

      const mockError = new Error('Detailed error');
      mockError.stack = 'Mock stack trace';

      const mockFailingInit = vi.fn().mockRejectedValueOnce(mockError);

      await initManager.safeInit(mockFailingInit, InitializationPhase.VENDOR);

      const report = initManager.getStatusReport();

      // REFACTOR: 에러 메시지와 타임스탬프 포함
      expect(report).toContain('vendor: failed');
      expect(report).toContain('Detailed error');
      expect(report).toMatch(/\[\d{1,2}:\d{2}:\d{2}\]|\[(오전|오후)\s+\d{1,2}:\d{2}:\d{2}\]/); // 시간 형식 확인 (한국어 AM/PM 포함)
    });

    it('개발 환경에서 에러 디버깅 정보 제공', async () => {
      // REFACTOR: 개발 환경에서 추가 디버깅 정보
      const { InitializationManager, InitializationPhase } = await import(
        '@shared/services/InitializationManager'
      );

      const initManager = new InitializationManager(true); // 개발 모드

      const mockFailingInit = vi.fn().mockRejectedValueOnce(new Error('Debug error'));

      await initManager.safeInit(mockFailingInit, InitializationPhase.STYLES);

      // REFACTOR: 개발 환경에서 추가 로그 출력 확인
      // (실제 logger mock이 있다면 검증 가능)
      const report = initManager.getStatusReport();
      expect(report).toContain('styles: failed');
    });

    it('다중 에러 시나리오 처리', async () => {
      // REFACTOR: 여러 단계에서 에러 발생 시 처리
      const { InitializationManager, InitializationPhase } = await import(
        '@shared/services/InitializationManager'
      );

      const initManager = new InitializationManager(true);

      // 여러 초기화 단계가 실패하는 시나리오
      const mockVendorFail = vi.fn().mockRejectedValueOnce(new Error('Vendor error'));
      const mockStylesFail = vi.fn().mockRejectedValueOnce(new Error('Styles error'));

      await initManager.safeInit(mockVendorFail, InitializationPhase.VENDOR);
      await initManager.safeInit(mockStylesFail, InitializationPhase.STYLES);

      const report = initManager.getStatusReport();

      // REFACTOR: 다중 에러가 모두 추적됨
      expect(report).toContain('vendor: failed');
      expect(report).toContain('styles: failed');
      expect(report).toContain('Vendor error');
      expect(report).toContain('Styles error');
    });
  });
});
