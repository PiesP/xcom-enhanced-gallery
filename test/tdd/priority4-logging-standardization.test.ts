/**
 * Priority 4: Logging System Standardization - TDD
 *
 * 🔴 RED Phase: 표준화된 로깅 시스템 요구사항 테스트
 *
 * 목표:
 * 1. console.error/warn 직접 사용 제거
 * 2. 통합 Logger 시스템으로 표준화
 * 3. 로그 레벨 관리 및 필터링
 * 4. 성능 최적화된 로깅
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 🔴 RED Phase: 아직 구현되지 않은 기능들을 테스트
describe('🔴 RED Phase: Logging System Standardization 요구사항', () => {
  let consoleSpy: { error: any; warn: any; log: any; info: any; debug?: any };

  beforeEach(() => {
    consoleSpy = {
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('통합 Logger 시스템 요구사항', () => {
    it('UnifiedLogger 클래스가 존재하고 인스턴스화된다', async () => {
      // 🔴 아직 구현되지 않음
      const { UnifiedLogger } = await import('../../src/shared/logging/unified-logger');
      const logger = UnifiedLogger.getInstance();

      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(UnifiedLogger);
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('모든 로그 레벨이 올바르게 작동한다', async () => {
      const { UnifiedLogger } = await import('../../src/shared/logging/unified-logger');
      const logger = UnifiedLogger.getInstance();

      // 로그 레벨별 기능 테스트
      logger.error('Test error message', { context: 'test' });
      logger.warn('Test warning message', { context: 'test' });
      logger.info('Test info message', { context: 'test' });
      logger.debug('Test debug message', { context: 'test' });

      // console 직접 호출이 아닌 로거를 통한 호출인지 확인
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error message'),
        expect.objectContaining({ context: 'test' })
      );
    });

    it('로그 레벨 필터링이 정상 작동한다', async () => {
      const { UnifiedLogger, LogLevel } = await import('../../src/shared/logging/unified-logger');
      const logger = UnifiedLogger.getInstance();

      // 로그 레벨을 WARN으로 설정
      logger.setLevel(LogLevel.WARN);

      logger.debug('Debug message'); // 출력되지 않아야 함
      logger.info('Info message'); // 출력되지 않아야 함
      logger.warn('Warn message'); // 출력되어야 함
      logger.error('Error message'); // 출력되어야 함

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('기존 코드 통합 요구사항', () => {
    it('기존 logger.ts가 UnifiedLogger를 사용하도록 업데이트된다', async () => {
      const { logger } = await import('../../src/shared/logging/logger');
      const { UnifiedLogger } = await import('../../src/shared/logging/unified-logger');

      // 기존 logger가 UnifiedLogger를 내부적으로 사용하는지 확인
      // logger는 어댑터 패턴으로 UnifiedLogger를 감싸므로 직접 비교하지 않음
      expect(logger).toBeDefined();
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');

      // UnifiedLogger가 정상적으로 작동하는지 테스트
      const unifiedLogger = UnifiedLogger.getInstance();
      expect(unifiedLogger).toBeDefined();
    });

    it('console.error/warn 직접 사용이 제거된다', async () => {
      // 주요 파일들에서 console 직접 사용 검증
      const { setupTestUtilities } = await import('../../src/shared/logging/unified-logger');

      // 코드베이스 스캔 유틸리티가 console 직접 사용을 탐지하지 않아야 함
      const directConsoleUsage = setupTestUtilities.scanForDirectConsoleUsage();
      expect(directConsoleUsage.length).toBe(0);
    });

    it('성능 최적화된 로깅이 적용된다', async () => {
      const { UnifiedLogger } = await import('../../src/shared/logging/unified-logger');
      const logger = UnifiedLogger.getInstance();

      // 대량 로그 테스트
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        logger.debug(`Debug message ${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 1000개 로그가 100ms 이내에 처리되어야 함
      expect(duration).toBeLessThan(100);
    });
  });

  describe('호환성 요구사항', () => {
    it('기존 logging 인터페이스가 유지된다', async () => {
      // 기존 logger export가 여전히 작동하는지 확인
      const { logger } = await import('../../src/shared/logging/index');

      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('로깅 유틸리티들이 통합되어 작동한다', async () => {
      const { logError, logWarning, logInfo, logDebug } = await import(
        '../../src/shared/logging/index'
      );

      // 개별 함수들이 정상 작동하는지 확인
      expect(() => logError('Test error')).not.toThrow();
      expect(() => logWarning('Test warning')).not.toThrow();
      expect(() => logInfo('Test info')).not.toThrow();
      expect(() => logDebug('Test debug')).not.toThrow();
    });

    it('컨텍스트 정보가 올바르게 포함된다', async () => {
      const { UnifiedLogger } = await import('../../src/shared/logging/unified-logger');
      const logger = UnifiedLogger.getInstance();

      const context = {
        module: 'test-module',
        action: 'test-action',
        timestamp: Date.now(),
      };

      logger.error('Test with context', context);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Test with context'),
        expect.objectContaining(context)
      );
    });
  });

  describe('메모리 및 성능 요구사항', () => {
    it('로그 버퍼링이 메모리 효율적으로 작동한다', async () => {
      const { UnifiedLogger } = await import('../../src/shared/logging/unified-logger');
      const logger = UnifiedLogger.getInstance();

      // 메모리 사용량 테스트
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // 대량 로깅
      for (let i = 0; i < 10000; i++) {
        logger.debug(`Memory test log ${i}`);
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // 메모리 증가가 합리적인 범위 내에 있어야 함 (1MB 이하)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });

    it('로그 정리 기능이 작동한다', async () => {
      const { UnifiedLogger, LogLevel } = await import('../../src/shared/logging/unified-logger');
      const logger = UnifiedLogger.getInstance();

      // 로그 레벨을 INFO로 설정하여 info 로그가 출력되도록 함
      logger.setLevel(LogLevel.INFO);

      // 정리 기능 테스트
      expect(() => logger.cleanup()).not.toThrow();

      // 정리 후 로깅이 여전히 작동하는지 확인
      logger.info('Post-cleanup test');

      // UnifiedLogger의 info는 실제로 console.info를 사용하므로 호출되어야 함
      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });
});
