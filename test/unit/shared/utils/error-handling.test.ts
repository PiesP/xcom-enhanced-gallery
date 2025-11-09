/**
 * @fileoverview Error Handling Utility Tests
 * @description Tests for the simplified getErrorMessage helper.
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { getErrorMessage } from '../../../../src/shared/utils/error-handling';

describe('shared/utils/error-handling', () => {
  setupGlobalTestIsolation();

  describe('getErrorMessage', () => {
    it('returns the message from an Error instance', () => {
      const error = new Error('Network request failed');
      expect(getErrorMessage(error)).toBe('Network request failed');
    });

    it('returns string inputs verbatim', () => {
      expect(getErrorMessage('plain string error')).toBe('plain string error');
    });

    it('extracts message property from plain objects', () => {
      const message = getErrorMessage({ message: 'Service reported failure' });
      expect(message).toBe('Service reported failure');
    });

    it('coerces non-string message values to strings', () => {
      expect(getErrorMessage({ message: 404 })).toBe('404');
      expect(getErrorMessage({ message: null })).toBe('');
    });

    it('falls back to string conversion for arbitrary values', () => {
      expect(getErrorMessage(123)).toBe('123');
      expect(getErrorMessage(true)).toBe('true');
      expect(getErrorMessage(Symbol.for('x'))).toBe('Symbol(x)');
    });

    it('returns an empty string for nullish values', () => {
      expect(getErrorMessage(null)).toBe('');
      expect(getErrorMessage(undefined)).toBe('');
    });

    it('reads error-like objects produced by external services', () => {
      const externalError = {
        message: 'Quota exceeded',
        code: 'ERR_QUOTA',
        context: { remaining: 0 },
      };

      expect(getErrorMessage(externalError)).toBe('Quota exceeded');
    });
  });
});
