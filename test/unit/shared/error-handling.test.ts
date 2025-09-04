import { describe, it, expect } from 'vitest';

import {
  standardizeError,
  getErrorMessage,
  isRetryableError,
  isFatalError,
  serializeError,
  withFallback,
  withRetry,
} from '@shared/utils/error-handling';

describe('error-handling utils', () => {
  it('standardizeError wraps Error and preserves message', () => {
    const err = new Error('boom');
    const res = standardizeError(err, { operation: 'op', timestamp: Date.now() });
    expect(res.message).toBe('boom');
    expect(res.context.operation).toBe('op');
  });

  it('getErrorMessage handles string and objects', () => {
    expect(getErrorMessage('plain')).toBe('plain');
    expect(getErrorMessage(new Error('err'))).toBe('err');
    expect(getErrorMessage({ message: 'obj' })).toBe('obj');
  });

  it('isRetryableError and isFatalError heuristics', () => {
    expect(isRetryableError(new Error('network error: timeout'))).toBe(true);
    expect(isRetryableError('not an error')).toBe(false);
    expect(isFatalError(new Error('out of memory'))).toBe(true);
    expect(isFatalError('string')).toBe(false);
  });

  it('serializeError handles Error and plain objects', () => {
    const err = new Error('s');
    const s = serializeError(err);
    expect(s).toHaveProperty('message');
    const obj = { a: 1 };
    expect(serializeError(obj)).toEqual(obj);
  });

  it('withFallback uses fallback on failure', async () => {
    const op = async () => {
      throw new Error('fail');
    };

    const fallback = async () => 'ok';

    const res = await withFallback(op, fallback, { operation: 't' });
    expect(res).toBe('ok');
  });

  it('withRetry retries and eventually fails when unretryable', async () => {
    const op = async () => {
      throw new Error('out of memory');
    };

    await expect(withRetry(op, 1, 1, { operation: 'x' })).rejects.toHaveProperty('message');
  });
});
