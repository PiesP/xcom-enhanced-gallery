/**
 * @fileoverview Bootstrap Types Unit Tests
 * @description Phase 348: Error handling strategy tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  CRITICAL_ERROR_STRATEGY,
  NON_CRITICAL_ERROR_STRATEGY,
  getErrorStrategy,
  handleBootstrapError,
} from '../../../src/bootstrap/types';

describe('Bootstrap Types', () => {
  describe('Error Strategy Constants', () => {
    it('CRITICAL_ERROR_STRATEGY should throw errors', () => {
      expect(CRITICAL_ERROR_STRATEGY.throwOnError).toBe(true);
      expect(CRITICAL_ERROR_STRATEGY.logLevel).toBe('error');
      expect(CRITICAL_ERROR_STRATEGY.context).toBe('critical');
    });

    it('NON_CRITICAL_ERROR_STRATEGY should not throw errors', () => {
      expect(NON_CRITICAL_ERROR_STRATEGY.throwOnError).toBe(false);
      expect(NON_CRITICAL_ERROR_STRATEGY.logLevel).toBe('warn');
      expect(NON_CRITICAL_ERROR_STRATEGY.context).toBe('non-critical');
    });
  });

  describe('getErrorStrategy', () => {
    it('should return critical strategy for critical system', () => {
      const strategy = getErrorStrategy('critical');
      expect(strategy.throwOnError).toBe(true);
      expect(strategy.logLevel).toBe('error');
    });

    it('should return non-critical strategy for non-critical system', () => {
      const strategy = getErrorStrategy('non-critical');
      expect(strategy.throwOnError).toBe(false);
      expect(strategy.logLevel).toBe('warn');
    });

    it('should use custom context when provided', () => {
      const strategy = getErrorStrategy('critical', 'environment');
      expect(strategy.context).toBe('environment');
    });
  });

  describe('handleBootstrapError', () => {
    it('should log error and throw for critical strategy', () => {
      const mockLogger = {
        error: vi.fn(),
        warn: vi.fn(),
      };

      const error = new Error('Test error');
      const strategy = CRITICAL_ERROR_STRATEGY;

      expect(() => {
        handleBootstrapError(error, strategy, mockLogger);
      }).toThrow('Test error');

      expect(mockLogger.error).toHaveBeenCalledWith('[critical] 초기화 실패: Test error', error);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should log warning and not throw for non-critical strategy', () => {
      const mockLogger = {
        error: vi.fn(),
        warn: vi.fn(),
      };

      const error = new Error('Test error');
      const strategy = NON_CRITICAL_ERROR_STRATEGY;

      expect(() => {
        handleBootstrapError(error, strategy, mockLogger);
      }).not.toThrow();

      expect(mockLogger.warn).toHaveBeenCalledWith('[non-critical] 초기화 실패: Test error', error);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle non-Error objects', () => {
      const mockLogger = {
        error: vi.fn(),
        warn: vi.fn(),
      };

      const error = 'String error';
      const strategy = NON_CRITICAL_ERROR_STRATEGY;

      handleBootstrapError(error, strategy, mockLogger);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[non-critical] 초기화 실패: String error',
        error
      );
    });

    it('should use custom context in log message', () => {
      const mockLogger = {
        error: vi.fn(),
        warn: vi.fn(),
      };

      const error = new Error('Custom error');
      const strategy = { ...NON_CRITICAL_ERROR_STRATEGY, context: 'features' };

      handleBootstrapError(error, strategy, mockLogger);

      expect(mockLogger.warn).toHaveBeenCalledWith('[features] 초기화 실패: Custom error', error);
    });
  });
});
