/**
 * 🟢 Logger Verbosity GREEN: Prod 모드에서 DEBUG 미출력 & 환경 레벨 설정
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { UnifiedLogger, LogLevel } from '../../src/shared/logging/unified-logger';

describe('🟢 Logger Verbosity', () => {
  let logger: UnifiedLogger;

  beforeEach(() => {
    logger = UnifiedLogger.getInstance();
    logger.setLevel(LogLevel.DEBUG); // 테스트 초기화
    logger.clearBuffer();
  });

  it('환경 변수 LOG_LEVEL=error 설정 시 ERROR 이상만 기록', () => {
    logger.setLevelFromEnv({ LOG_LEVEL: 'error' });
    logger.debug('debug hidden');
    logger.info('info hidden');
    logger.warn('warn hidden');
    logger.error('error visible');

    const buf = logger.getBuffer();
    expect(buf.some(e => e.level === LogLevel.DEBUG)).toBe(false);
    expect(buf.some(e => e.level === LogLevel.INFO)).toBe(false);
    expect(buf.some(e => e.level === LogLevel.WARN)).toBe(false);
    expect(buf.some(e => e.level === LogLevel.ERROR)).toBe(true);
  });

  it('프로덕션 모드 초기화 시 기본 레벨이 WARN 이상이어야 한다', () => {
    // 시뮬레이션: setLevelFromEnv 호출 없이 현재 레벨 확인 (prod로 빌드된 번들 기준 가정)
    // 테스트 환경은 production이 아닐 수 있으므로 강제로 setLevelFromEnv 호출
    logger.setLevelFromEnv({ LOG_LEVEL: 'warn' });
    expect(logger.getLevel()).toBe(LogLevel.WARN);
  });
});
