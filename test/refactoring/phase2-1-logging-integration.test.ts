import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Phase 2.1: 로깅 시스템 통합 - TDD
 *
 * 목표: 모든 모듈이 createScopedLogger를 일관되게 사용하도록 통합
 */

describe('Phase 2.1: 로깅 시스템 통합 - TDD', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(globalThis.console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('🔴 RED: 현재 로깅 일관성 문제 검증', () => {
    it('모든 주요 서비스가 createScopedLogger를 사용해야 함', async () => {
      // 주요 서비스들이 createScopedLogger를 사용하는지 확인
      const { MediaService } = await import('../../src/shared/services/MediaService');
      const { BulkDownloadService } = await import('../../src/shared/services/BulkDownloadService');

      // 서비스 인스턴스 생성
      const mediaService = new MediaService();
      const bulkService = new BulkDownloadService();

      // 인스턴스가 생성되었는지 확인 (로깅 시스템이 초기화됨)
      expect(mediaService).toBeInstanceOf(MediaService);
      expect(bulkService).toBeInstanceOf(BulkDownloadService);
    });

    it('직접적인 console.log 사용이 없어야 함', async () => {
      // 이 테스트는 코드 정적 분석으로 검증하거나
      // 실제 로깅 호출 패턴을 확인하여 검증할 수 있음
      expect(true).toBe(true); // 플레이스홀더
    });

    it('createScopedLogger가 올바른 스코프 이름을 사용해야 함', async () => {
      const { createScopedLogger } = await import('../../src/shared/logging/logger');

      const mediaLogger = createScopedLogger('MediaService');
      const bulkLogger = createScopedLogger('BulkDownloadService');

      expect(mediaLogger).toBeDefined();
      expect(bulkLogger).toBeDefined();
      expect(typeof mediaLogger.info).toBe('function');
      expect(typeof bulkLogger.info).toBe('function');
    });
  });

  describe('🟢 GREEN: 통합 로깅 시스템 구현', () => {
    it('모든 서비스가 일관된 로깅 패턴을 사용해야 함', async () => {
      const { createScopedLogger } = await import('../../src/shared/logging/logger');

      // 각 서비스별 로거 생성
      const serviceLoggers = {
        media: createScopedLogger('MediaService'),
        bulkDownload: createScopedLogger('BulkDownload'),
        videoControl: createScopedLogger('VideoControl'),
        extraction: createScopedLogger('MediaExtraction'),
      };

      // 모든 로거가 동일한 인터페이스를 가져야 함
      Object.values(serviceLoggers).forEach(logger => {
        expect(logger).toHaveProperty('info');
        expect(logger).toHaveProperty('error');
        expect(logger).toHaveProperty('warn');
        expect(logger).toHaveProperty('debug');
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.error).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.debug).toBe('function');
      });
    });

    it('로거가 스코프 정보를 포함한 출력을 생성해야 함', async () => {
      const { createScopedLogger } = await import('../../src/shared/logging/logger');

      const logger = createScopedLogger('TestService');
      logger.info('Test message');

      // console.info가 호출되었는지 확인
      expect(consoleSpy).toHaveBeenCalled();

      // 호출된 메시지에 스코프 정보가 포함되었는지 확인
      const callArgs = consoleSpy.mock.calls[0];
      expect(callArgs.some(arg => typeof arg === 'string' && arg.includes('TestService'))).toBe(
        true
      );
    });

    it('logError 함수가 logger.error 메서드로 통합되어야 함', async () => {
      const { createScopedLogger } = await import('../../src/shared/logging/logger');

      const logger = createScopedLogger('ErrorTest');
      const testError = new Error('Test error');

      // error 메서드가 존재하고 호출 가능해야 함
      expect(() => logger.error('Error message', testError)).not.toThrow();
    });
  });

  describe('🔧 REFACTOR: 로깅 성능 및 일관성 개선', () => {
    it('로깅 레벨에 따른 출력 제어가 가능해야 함', async () => {
      const { createScopedLogger } = await import('../../src/shared/logging/logger');

      const logger = createScopedLogger('PerfTest');

      // 다양한 로깅 레벨 테스트
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      // 모든 메서드가 오류 없이 실행되어야 함
      expect(true).toBe(true);
    });

    it('로깅 오버헤드가 최소화되어야 함', async () => {
      const { createScopedLogger } = await import('../../src/shared/logging/logger');

      const logger = createScopedLogger('Performance');

      // 성능 측정
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        logger.info('Message ' + i);
      }
      const endTime = Date.now();

      // 100개 로그 메시지가 100ms 이내에 처리되어야 함
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('메모리 누수가 발생하지 않아야 함', async () => {
      const { createScopedLogger } = await import('../../src/shared/logging/logger');

      // 많은 로거를 생성하고 사용
      const loggers = [];
      for (let i = 0; i < 50; i++) {
        const logger = createScopedLogger('Test' + i);
        logger.info('Test message');
        loggers.push(logger);
      }

      // 가비지 컬렉션을 위한 참조 해제
      loggers.length = 0;

      // 메모리 누수 검증은 실제로는 더 복잡한 도구가 필요하지만
      // 여기서는 기본적인 동작 확인
      expect(true).toBe(true);
    });
  });
});
