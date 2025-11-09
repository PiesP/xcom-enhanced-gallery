/**
 * @fileoverview Integrated error message tests after the error-handling simplification.
 * The refactor reduced the module to a small helper, so these scenarios
 * focus on guarding real-world inputs observed in the gallery pipeline.
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { getErrorMessage } from '../../../../src/shared/utils/error-handling';

describe('Error handling integration scenarios', () => {
  setupGlobalTestIsolation();

  it('unwraps standard Error objects produced by Solid effects', () => {
    try {
      throw new Error('Gallery render failed');
    } catch (error) {
      expect(getErrorMessage(error)).toBe('Gallery render failed');
    }
  });

  it('extracts messages from domain specific error payloads', () => {
    const errorPayload = {
      message: 'Download quota exceeded',
      code: 'ERR_DOWNLOAD_QUOTA',
      correlationId: 'corr-1234',
    };

    expect(getErrorMessage(errorPayload)).toBe('Download quota exceeded');
  });

  it('returns empty string when optional error payload is missing', () => {
    const maybeError: unknown = undefined;
    expect(getErrorMessage(maybeError)).toBe('');
  });

  it('coerces unexpected primitive error payloads to strings', () => {
    expect(getErrorMessage(0)).toBe('0');
    expect(getErrorMessage(false)).toBe('false');
  });

  it('handles objects with non-string message fields from vendor APIs', () => {
    const vendorError = {
      message: { text: 'Rate limit reached' },
      status: 429,
    };

    // The helper stringifies non-string message values.
    expect(getErrorMessage(vendorError)).toBe('[object Object]');
  });
});
