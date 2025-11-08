/**
 * Logger 출력 채널 분리 테스트
 * 각 로그 레벨이 적절한 console 메소드를 사용하는지 확인
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { createLogger } from '@/shared/logging/logger';

describe('Logger Output Channels', () => {
  setupGlobalTestIsolation();

  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Console 메소드들을 spy로 모킹
    infoSpy = vi.spyOn(console, 'info') as unknown as ReturnType<typeof vi.spyOn>;
    infoSpy.mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn') as unknown as ReturnType<typeof vi.spyOn>;
    warnSpy.mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error') as unknown as ReturnType<typeof vi.spyOn>;
    errorSpy.mockImplementation(() => {});
    debugSpy = vi.spyOn(console, 'debug') as unknown as ReturnType<typeof vi.spyOn>;
    debugSpy.mockImplementation(() => {});
    logSpy = vi.spyOn(console, 'log') as unknown as ReturnType<typeof vi.spyOn>;
    logSpy.mockImplementation(() => {});
  });

  afterEach(() => {
    // 모든 spy 복원
    vi.restoreAllMocks();
  });

  it('should use console.info for info level logs', () => {
    const testLogger = createLogger({ level: 'debug' });

    testLogger.info('Test info message');

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should use console.warn for warn level logs', () => {
    const testLogger = createLogger({ level: 'debug' });

    testLogger.warn('Test warning message');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it('should use console.error for error level logs', () => {
    const testLogger = createLogger({ level: 'debug' });

    testLogger.error('Test error message');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should use console.info for debug level logs (ESLint compliance)', () => {
    const testLogger = createLogger({ level: 'debug' });

    testLogger.debug('Test debug message');

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should use different output channels for different log levels', () => {
    const testLogger = createLogger({ level: 'debug' });

    testLogger.info('Info message');
    testLogger.warn('Warning message');
    testLogger.error('Error message');
    testLogger.debug('Debug message');

    expect(infoSpy).toHaveBeenCalledTimes(2); // info + debug
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('should format messages consistently across all levels', () => {
    const testLogger = createLogger({
      level: 'debug',
      prefix: '[TEST]',
      includeTimestamp: false,
    });

    testLogger.info('Test message');
    testLogger.warn('Test message');
    testLogger.error('Test message');
    testLogger.debug('Test message');

    // 모든 레벨에서 같은 형식의 메시지가 나와야 함
    expect(infoSpy).toHaveBeenNthCalledWith(1, '[TEST] [INFO]', 'Test message');
    expect(warnSpy).toHaveBeenCalledWith('[TEST] [WARN]', 'Test message');
    expect(errorSpy).toHaveBeenCalledWith('[TEST] [ERROR]', 'Test message');
    expect(infoSpy).toHaveBeenNthCalledWith(2, '[TEST] [DEBUG]', 'Test message');
  });
});
