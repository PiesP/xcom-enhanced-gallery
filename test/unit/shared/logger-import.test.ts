/**
 * @fileoverview 런타임 에러 테스트 - logger 사용 가능성 확인
 * @description logger가 main.ts에서 undefined가 되는 원인을 파악
 */

describe('Logger Import Issue Debug', () => {
  it('should import logger correctly from @/utils', async () => {
    // 직접 logger import 테스트
    try {
      const { logger } = await import('@/utils/index');

      expect(logger).toBeDefined();
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.warn).toBe('function');

      // 실제 logger 메서드 호출 테스트
      expect(() => {
        logger.info('Logger import test successful');
      }).not.toThrow();
    } catch (error) {
      throw new Error(`Logger import failed: ${error}`);
    }
  });

  it('should import logger directly from shared/logging', async () => {
    try {
      const { logger } = await import('@/shared/logging/logger');

      expect(logger).toBeDefined();
      expect(typeof logger.error).toBe('function');

      // 실제 logger 메서드 호출 테스트
      expect(() => {
        logger.debug('Direct logger import test successful');
      }).not.toThrow();
    } catch (error) {
      throw new Error(`Direct logger import failed: ${error}`);
    }
  });

  it('should test logger usage in isolation', () => {
    const mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      time: vi.fn(),
      timeEnd: vi.fn(),
    };

    // logger 메서드 호출 테스트
    expect(() => {
      mockLogger.error('Test error message');
      mockLogger.info('Test info message');
    }).not.toThrow();

    expect(mockLogger.error).toHaveBeenCalledWith('Test error message');
    expect(mockLogger.info).toHaveBeenCalledWith('Test info message');
  });
});
