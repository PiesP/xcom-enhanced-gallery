/**
 * @fileoverview Regression-style tests for getErrorMessage that model
 * previously complex error factory usage. After Phase 5 refactoring the
 * error-handling module only exposes a minimal helper, so we validate
 * that helper against the kinds of payloads the legacy factories used
 * to emit.
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { getErrorMessage } from '../../../../src/shared/utils/error-handling';

type LegacyErrorPayload = {
  message?: unknown;
  category?: string;
  severity?: string;
  metadata?: Record<string, unknown>;
};

const legacyPayloads: Array<{
  name: string;
  payload: LegacyErrorPayload | Error | string | null;
  expected: string;
}> = [
  {
    name: 'network error payload',
    payload: {
      message: 'Connection failed',
      category: 'network',
      severity: 'high',
      metadata: { operation: 'downloadMedia' },
    },
    expected: 'Connection failed',
  },
  {
    name: 'validation payload with nested message object',
    payload: {
      message: { text: 'Invalid URL format' },
      category: 'validation',
    },
    expected: '[object Object]',
  },
  {
    name: 'processing error string',
    payload: 'Processing failed',
    expected: 'Processing failed',
  },
  {
    name: 'system error instance',
    payload: new Error('Subsystem unavailable'),
    expected: 'Subsystem unavailable',
  },
  {
    name: 'unknown/null payload',
    payload: null,
    expected: '',
  },
  {
    name: 'numeric fallback',
    payload: 504 as unknown as LegacyErrorPayload,
    expected: '504',
  },
];

describe('Error handling – legacy payload regression tests', () => {
  setupGlobalTestIsolation();

  it('maps legacy payloads to displayable messages', () => {
    const results = legacyPayloads.map(({ name, payload, expected }) => ({
      name,
      message: getErrorMessage(payload),
      expected,
    }));

    results.forEach(({ name, message, expected }) => {
      expect(message).toBe(expected);
    });
  });

  it('preserves message strings when aggregating multiple payloads', () => {
    const concatenated = legacyPayloads
      .map(({ payload }) => getErrorMessage(payload))
      .filter(Boolean)
      .join(' | ');

    expect(concatenated).toContain('Connection failed');
    expect(concatenated).toContain('Processing failed');
    expect(concatenated).toContain('Subsystem unavailable');
  });

  it('treats empty messages as silent failures to avoid noisy UI', () => {
    const silentPayloads: Array<LegacyErrorPayload | null> = [null, { message: '' }];
    const messages = silentPayloads.map(value => getErrorMessage(value));

    messages.forEach(message => {
      expect(message).toBe('');
    });
  });
});
