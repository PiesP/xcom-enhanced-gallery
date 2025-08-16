/**
 * 🟢 Logger Flush Hook 테스트
 */
import { describe, it, expect } from 'vitest';
import { UnifiedLogger, LogLevel } from '../../src/shared/logging/unified-logger';

describe('🟢 Logger Flush', () => {
  it('flush() 호출 시 버퍼가 반환되고 비워진다', () => {
    const logger = UnifiedLogger.getInstance();
    logger.setLevel(LogLevel.DEBUG);
    logger.clearBuffer();

    logger.debug('a');
    logger.info('b');
    logger.error('c');

    const before = logger.getBuffer().length;
    expect(before).toBe(3);

    const flushed = logger.flush();
    expect(flushed.map(e => e.message)).toEqual(['a', 'b', 'c']);
    expect(logger.getBuffer().length).toBe(0);
  });
});
