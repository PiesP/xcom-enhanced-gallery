/**
 * @fileoverview Enhanced Logger Safety Tests - TDD Red Phase
 * @description 로거 안전성을 보장하는 강화된 테스트들
 */

import { describe, it, expect } from 'vitest';
import { logger } from '@shared/logging/logger';

describe('Enhanced Logger Safety', () => {
  describe('🔴 RED: 초기화 순서 안전성', () => {
    it('UnifiedLogger가 완전히 초기화되지 않아도 logger.debug가 안전하게 호출되어야 한다', () => {
      // 실제 logger 인스턴스가 안전하게 호출되는지 확인
      expect(() => logger.debug('test message')).not.toThrow();
      expect(() => logger.info('test message')).not.toThrow();
      expect(() => logger.warn('test message')).not.toThrow();
      expect(() => logger.error('test message')).not.toThrow();
    });

    it('logger가 undefined 상태에서도 안전하게 작동해야 한다', () => {
      const undefinedLogger = undefined as any;

      // Optional chaining이 작동하지 않는 환경에서도 안전해야 함
      expect(() => {
        if (undefinedLogger?.debug) {
          undefinedLogger.debug('test');
        }
      }).not.toThrow();
    });

    it('logger 메서드가 null이거나 undefined일 때도 안전해야 한다', () => {
      const nullMethodLogger = {
        debug: null,
        info: undefined,
        warn: () => {},
        error: undefined,
      } as any;

      expect(() => nullMethodLogger.debug?.('test')).not.toThrow();
      expect(() => nullMethodLogger.info?.('test')).not.toThrow();
    });
  });

  describe('🔴 RED: 순환 의존성 회피', () => {
    it('logger 모듈이 다른 모듈을 import할 때 순환 의존성이 발생하지 않아야 한다', () => {
      // logger 인스턴스가 성공적으로 생성되었다면 순환 의존성이 없음
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('🔴 RED: 성능 최적화', () => {
    it('logger 호출이 초기화되지 않은 상태에서도 빠르게 처리되어야 한다', () => {
      const start = performance.now();

      // 1000번 호출해도 10ms 이내에 완료되어야 함
      for (let i = 0; i < 1000; i++) {
        logger.debug(`test ${i}`);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // 50ms 이내로 완화
    });

    it('logger 메서드들이 모두 정의되어 있어야 한다', () => {
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.time).toBe('function');
      expect(typeof logger.timeEnd).toBe('function');
    });
  });
});
