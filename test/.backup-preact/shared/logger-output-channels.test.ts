/**
 * Logger 출력 채널 분리 테스트
 * 각 로그 레벨이 적절한 console 메소드를 사용하는지 확인
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, createLogger } from '@/shared/logging/logger';

describe('Logger Output Channels', () => {
  let consoleSpy: any;

  beforeEach(() => {
    // Console 메소드들을 spy로 모킹
    consoleSpy = {
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    // 모든 spy 복원
    vi.restoreAllMocks();
  });

  it('should use console.info for info level logs', () => {
    const testLogger = createLogger({ level: 'debug' });

    testLogger.info('Test info message');

    expect(consoleSpy.info).toHaveBeenCalledTimes(1);
    expect(consoleSpy.warn).not.toHaveBeenCalled();
  });

  it('should use console.warn for warn level logs', () => {
    const testLogger = createLogger({ level: 'debug' });

    testLogger.warn('Test warning message');

    expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    expect(consoleSpy.info).not.toHaveBeenCalled();
  });

  it('should use console.error for error level logs', () => {
    const testLogger = createLogger({ level: 'debug' });

    testLogger.error('Test error message');

    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    expect(consoleSpy.warn).not.toHaveBeenCalled();
  });

  it('should use console.info for debug level logs (ESLint compliance)', () => {
    const testLogger = createLogger({ level: 'debug' });

    testLogger.debug('Test debug message');

    expect(consoleSpy.info).toHaveBeenCalledTimes(1);
    expect(consoleSpy.warn).not.toHaveBeenCalled();
  });

  it('should use different output channels for different log levels', () => {
    const testLogger = createLogger({ level: 'debug' });

    testLogger.info('Info message');
    testLogger.warn('Warning message');
    testLogger.error('Error message');
    testLogger.debug('Debug message');

    expect(consoleSpy.info).toHaveBeenCalledTimes(2); // info + debug
    expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
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
    expect(consoleSpy.info).toHaveBeenNthCalledWith(1, '[TEST] [INFO]', 'Test message');
    expect(consoleSpy.warn).toHaveBeenCalledWith('[TEST] [WARN]', 'Test message');
    expect(consoleSpy.error).toHaveBeenCalledWith('[TEST] [ERROR]', 'Test message');
    expect(consoleSpy.info).toHaveBeenNthCalledWith(2, '[TEST] [DEBUG]', 'Test message');
  });
});
