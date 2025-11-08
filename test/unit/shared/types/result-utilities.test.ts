/**
 * Result 유틸리티 함수 단위 테스트 (Phase 355.2)
 * @description Enhanced Result 유틸리티 함수 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  success,
  failure,
  partial,
  cancelled,
  isSuccess,
  isFailure,
  isPartial,
  unwrapOr,
  safe,
  safeAsync,
  chain,
  map,
  ErrorCode,
} from '../../../../src/shared/types/result.types';

describe('result-utilities: success()', () => {
  it('should create success result', () => {
    const result = success('test');

    expect(result.status).toBe('success');
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data).toBe('test');
    }
    expect(result.code).toBe(ErrorCode.NONE);
  });

  it('should attach meta to success', () => {
    const result = success(42, { source: 'test' });

    expect(result.status).toBe('success');
    if (isSuccess(result)) {
      expect(result.data).toBe(42);
    }
    expect(result.meta).toEqual({ source: 'test' });
  });

  it('should handle complex data types', () => {
    const data = { id: 1, nested: { value: 'test' } };
    const result = success(data);

    if (isSuccess(result)) {
      expect(result.data).toEqual(data);
    }
  });
});

describe('result-utilities: failure()', () => {
  it('should create error result with default code', () => {
    const result = failure('Test error');

    expect(result.status).toBe('error');
    expect(result.error).toBe('Test error');
    expect(result.code).toBe(ErrorCode.UNKNOWN);
  });

  it('should create error result with custom code', () => {
    const result = failure('Not found', ErrorCode.ELEMENT_NOT_FOUND);

    expect(result.status).toBe('error');
    expect(result.error).toBe('Not found');
    expect(result.code).toBe(ErrorCode.ELEMENT_NOT_FOUND);
  });

  it('should attach cause', () => {
    const originalError = new TypeError('Original');
    const result = failure('Wrapped error', ErrorCode.UNKNOWN, {
      cause: originalError,
    });

    expect(result.cause).toBe(originalError);
  });

  it('should attach meta', () => {
    const result = failure('Network error', ErrorCode.NETWORK, {
      meta: { retryCount: 3, url: 'https://example.com' },
    });

    expect(result.meta).toEqual({ retryCount: 3, url: 'https://example.com' });
  });

  it('should attach failures', () => {
    const result = failure('Validation failed', ErrorCode.INVALID_ELEMENT, {
      failures: [
        { url: 'bad1.jpg', error: '404' },
        { url: 'bad2.jpg', error: '500' },
      ],
    });

    expect(result.failures).toHaveLength(2);
    expect(result.failures?.[0]).toEqual({ url: 'bad1.jpg', error: '404' });
  });
});

describe('result-utilities: partial()', () => {
  it('should create partial result', () => {
    const result = partial([1, 2, 3], '1 item failed', [{ url: 'bad.jpg', error: '404' }]);

    // partial returns a complex intersection type, use type guard
    expect(isPartial(result)).toBe(true);
    if (isPartial(result)) {
      expect(result.data).toEqual([1, 2, 3]);
      expect(result.error).toBe('1 item failed');
      expect(result.code).toBe(ErrorCode.PARTIAL_FAILED);
      expect(result.failures).toHaveLength(1);
    }
  });

  it('should attach meta to partial', () => {
    const result = partial(['success1'], 'Some failed', [{ url: 'fail.jpg', error: 'timeout' }], {
      totalAttempted: 2,
    });

    if (isPartial(result)) {
      expect(result.meta).toEqual({ totalAttempted: 2 });
    }
  });
});

describe('result-utilities: cancelled()', () => {
  it('should create cancelled result with default message', () => {
    const result = cancelled();

    expect(result.status).toBe('cancelled');
    expect(result.error).toBe('Operation cancelled');
    expect(result.code).toBe(ErrorCode.CANCELLED);
  });

  it('should create cancelled result with custom message', () => {
    const result = cancelled('User cancelled download');

    expect(result.error).toBe('User cancelled download');
  });

  it('should attach meta to cancelled', () => {
    const result = cancelled('Timeout', { duration: 5000 });

    expect(result.meta).toEqual({ duration: 5000 });
  });
});

describe('result-utilities: isSuccess()', () => {
  it('should return true for success result', () => {
    const result = success('test');
    expect(isSuccess(result)).toBe(true);
  });

  it('should return false for error result', () => {
    const result = failure('error');
    expect(isSuccess(result)).toBe(false);
  });

  it('should return false for partial result', () => {
    const result = partial(['a'], 'failed', [{ url: 'b', error: '404' }]);
    expect(isSuccess(result)).toBe(false);
  });

  it('should narrow type correctly', () => {
    const result = success(42);
    if (isSuccess(result)) {
      const value: number = result.data; // Type should be narrowed
      expect(value).toBe(42);
    }
  });
});

describe('result-utilities: isFailure()', () => {
  it('should return true for error result', () => {
    const result = failure('error');
    expect(isFailure(result)).toBe(true);
  });

  it('should return true for cancelled result', () => {
    const result = cancelled();
    expect(isFailure(result)).toBe(true);
  });

  it('should return false for success result', () => {
    const result = success('test');
    expect(isFailure(result)).toBe(false);
  });

  it('should return false for partial result', () => {
    const result = partial(['a'], 'failed', [{ url: 'b', error: '404' }]);
    expect(isFailure(result)).toBe(false);
  });
});

describe('result-utilities: isPartial()', () => {
  it('should return true for partial result', () => {
    const result = partial(['a'], 'failed', [{ url: 'b', error: '404' }]);
    expect(isPartial(result)).toBe(true);
  });

  it('should return false for success result', () => {
    const result = success('test');
    expect(isPartial(result)).toBe(false);
  });

  it('should return false for error result', () => {
    const result = failure('error');
    expect(isPartial(result)).toBe(false);
  });
});

describe('result-utilities: unwrapOr()', () => {
  it('should return data for success result', () => {
    const result = success(42);
    const value = unwrapOr(result, 0);
    expect(value).toBe(42);
  });

  it('should return default value for error result', () => {
    const result = failure('error');
    const value = unwrapOr(result, 'fallback');
    expect(value).toBe('fallback');
  });

  it('should return default value for cancelled result', () => {
    const result = cancelled();
    const value = unwrapOr(result, 'default');
    expect(value).toBe('default');
  });
});

describe('result-utilities: safe()', () => {
  it('should wrap successful function call', () => {
    const result = safe(() => {
      return 42;
    });

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data).toBe(42);
    }
  });

  it('should catch thrown errors', () => {
    const result = safe(() => {
      throw new Error('Test error');
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error).toBe('Test error');
      expect(result.code).toBe(ErrorCode.UNKNOWN);
    }
  });

  it('should handle non-Error throws', () => {
    const result = safe(() => {
      throw 'String error';
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error).toBe('String error');
    }
  });

  it('should accept custom ErrorCode', () => {
    const result = safe(
      () => {
        throw new Error('Parse error');
      },
      { code: ErrorCode.INVALID_ELEMENT }
    );

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.code).toBe(ErrorCode.INVALID_ELEMENT);
    }
  });

  it('should attach meta', () => {
    const result = safe(() => 'data', { meta: { source: 'test' } });

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.meta).toEqual({ source: 'test' });
    }
  });
});

describe('result-utilities: safeAsync()', () => {
  it('should wrap successful async function call', async () => {
    const result = await safeAsync(async () => {
      return Promise.resolve(42);
    });

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data).toBe(42);
    }
  });

  it('should catch rejected promises', async () => {
    const result = await safeAsync(async () => {
      throw new Error('Async error');
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error).toBe('Async error');
      expect(result.code).toBe(ErrorCode.UNKNOWN);
    }
  });

  it('should handle Promise.reject', async () => {
    const result = await safeAsync(async () => {
      return Promise.reject(new Error('Rejected'));
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error).toBe('Rejected');
    }
  });

  it('should accept custom ErrorCode', async () => {
    const result = await safeAsync(
      async () => {
        throw new Error('Network issue');
      },
      { code: ErrorCode.NETWORK }
    );

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.code).toBe(ErrorCode.NETWORK);
    }
  });

  it('should attach meta', async () => {
    const result = await safeAsync(async () => 'data', {
      meta: { timestamp: 123 },
    });

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.meta).toEqual({ timestamp: 123 });
    }
  });
});

describe('result-utilities: chain()', () => {
  it('should chain success results', () => {
    const result1 = success(5);
    const result2 = chain(result1, value => success(value * 2));

    expect(isSuccess(result2)).toBe(true);
    if (isSuccess(result2)) {
      expect(result2.data).toBe(10);
    }
  });

  it('should short-circuit on error', () => {
    const result1 = failure('Initial error');
    const result2 = chain(result1, value => success(value));

    expect(isFailure(result2)).toBe(true);
    if (isFailure(result2)) {
      expect(result2.error).toBe('Initial error');
    }
  });

  it('should propagate error from chained function', () => {
    const result1 = success(5);
    const result2 = chain(result1, () => failure('Chain error', ErrorCode.NETWORK));

    expect(isFailure(result2)).toBe(true);
    if (isFailure(result2)) {
      expect(result2.error).toBe('Chain error');
      expect(result2.code).toBe(ErrorCode.NETWORK);
    }
  });
});

describe('result-utilities: map()', () => {
  it('should map success result', () => {
    const result1 = success(5);
    const result2 = map(result1, value => value * 2);

    expect(isSuccess(result2)).toBe(true);
    if (isSuccess(result2)) {
      expect(result2.data).toBe(10);
    }
  });

  it('should preserve meta through map', () => {
    const result1 = success(5, { source: 'test' });
    const result2 = map(result1, value => value * 2);

    expect(isSuccess(result2)).toBe(true);
    if (isSuccess(result2)) {
      expect(result2.meta).toEqual({ source: 'test' });
    }
  });

  it('should short-circuit on error', () => {
    const result1 = failure('Initial error');
    const result2 = map(result1, value => value);

    expect(isFailure(result2)).toBe(true);
    if (isFailure(result2)) {
      expect(result2.error).toBe('Initial error');
    }
  });

  it('should transform data type', () => {
    const result1 = success(42);
    const result2 = map(result1, value => `Number: ${value}`);

    expect(isSuccess(result2)).toBe(true);
    if (isSuccess(result2)) {
      expect(result2.data).toBe('Number: 42');
    }
  });
});
