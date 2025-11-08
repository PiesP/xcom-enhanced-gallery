/**
 * Result 호환성 레이어 단위 테스트 (Phase 355.2)
 * @description Simple Result ↔ Enhanced Result 변환 함수 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  toEnhancedResult,
  toSimpleResult,
  toEnhancedResults,
  toSimpleResults,
} from '../../../../src/shared/types/result-compat';
import { ErrorCode } from '../../../../src/shared/types/result.types';
import type { Result as SimpleResult } from '../../../../src/shared/types/core/core-types';
import type { Result as EnhancedResult } from '../../../../src/shared/types/result.types';

describe('result-compat: toEnhancedResult', () => {
  it('should convert Simple success to Enhanced success', () => {
    const simple: SimpleResult<string> = { success: true, data: 'test' };
    const enhanced = toEnhancedResult(simple);

    expect(enhanced.status).toBe('success');
    expect((enhanced as { data: string }).data).toBe('test');
    expect(enhanced.code).toBe(ErrorCode.NONE);
  });

  it('should convert Simple failure to Enhanced error', () => {
    const simple: SimpleResult<string> = {
      success: false,
      error: new Error('Test error'),
    };
    const enhanced = toEnhancedResult(simple);

    expect(enhanced.status).toBe('error');
    expect(enhanced.error).toBe('Test error');
    expect(enhanced.code).toBe(ErrorCode.UNKNOWN);
    expect(enhanced.cause).toBeInstanceOf(Error);
  });

  it('should convert Simple failure with string error to Enhanced error', () => {
    const simple: SimpleResult<string> = {
      success: false,
      error: 'String error' as unknown as Error,
    };
    const enhanced = toEnhancedResult(simple);

    expect(enhanced.status).toBe('error');
    expect(enhanced.error).toBe('String error');
    expect(enhanced.code).toBe(ErrorCode.UNKNOWN);
  });

  it('should accept custom ErrorCode', () => {
    const simple: SimpleResult<string> = {
      success: false,
      error: new Error('Not found'),
    };
    const enhanced = toEnhancedResult(simple, {
      code: ErrorCode.ELEMENT_NOT_FOUND,
    });

    expect(enhanced.status).toBe('error');
    expect(enhanced.code).toBe(ErrorCode.ELEMENT_NOT_FOUND);
  });

  it('should attach meta to success result', () => {
    const simple: SimpleResult<number> = { success: true, data: 42 };
    const enhanced = toEnhancedResult(simple, {
      meta: { source: 'test', timestamp: 123 },
    });

    expect(enhanced.status).toBe('success');
    expect(enhanced.meta).toEqual({ source: 'test', timestamp: 123 });
  });

  it('should attach meta to error result', () => {
    const simple: SimpleResult<number> = {
      success: false,
      error: new Error('Fail'),
    };
    const enhanced = toEnhancedResult(simple, {
      meta: { retryCount: 3 },
    });

    expect(enhanced.status).toBe('error');
    expect(enhanced.meta).toEqual({ retryCount: 3 });
  });

  it('should attach custom cause', () => {
    const simple: SimpleResult<string> = {
      success: false,
      error: new Error('Wrapper'),
    };
    const originalError = new TypeError('Original');
    const enhanced = toEnhancedResult(simple, {
      cause: originalError,
    });

    expect(enhanced.cause).toBe(originalError);
  });
});

describe('result-compat: toSimpleResult', () => {
  it('should convert Enhanced success to Simple success', () => {
    const enhanced: EnhancedResult<string> = {
      status: 'success',
      data: 'test',
      code: ErrorCode.NONE,
    };
    const simple = toSimpleResult(enhanced);

    expect(simple.success).toBe(true);
    if (simple.success) {
      expect(simple.data).toBe('test');
    }
  });

  it('should convert Enhanced partial to Simple success', () => {
    const enhanced: EnhancedResult<number[]> = {
      status: 'partial',
      data: [1, 2],
      error: '1 failed',
      code: ErrorCode.PARTIAL_FAILED,
      failures: [{ url: 'bad.jpg', error: '404' }],
    } as EnhancedResult<number[]>;
    const simple = toSimpleResult(enhanced);

    expect(simple.success).toBe(true);
    if (simple.success) {
      expect(simple.data).toEqual([1, 2]);
    }
  });

  it('should convert Enhanced error to Simple failure', () => {
    const enhanced: EnhancedResult<string> = {
      status: 'error',
      error: 'Test error',
      code: ErrorCode.NETWORK,
    };
    const simple = toSimpleResult(enhanced);

    expect(simple.success).toBe(false);
    if (!simple.success) {
      expect(simple.error).toBeInstanceOf(Error);
      expect(simple.error.message).toBe('Test error');
    }
  });

  it('should convert Enhanced cancelled to Simple failure', () => {
    const enhanced: EnhancedResult<void> = {
      status: 'cancelled',
      error: 'User cancelled',
      code: ErrorCode.CANCELLED,
    };
    const simple = toSimpleResult(enhanced);

    expect(simple.success).toBe(false);
    if (!simple.success) {
      expect(simple.error).toBeInstanceOf(Error);
      expect(simple.error.message).toBe('User cancelled');
    }
  });

  it('should attach ErrorCode to Error object', () => {
    const enhanced: EnhancedResult<string> = {
      status: 'error',
      error: 'Not found',
      code: ErrorCode.ELEMENT_NOT_FOUND,
    };
    const simple = toSimpleResult(enhanced);

    expect(simple.success).toBe(false);
    if (!simple.success) {
      expect((simple.error as Error & { code?: ErrorCode }).code).toBe(ErrorCode.ELEMENT_NOT_FOUND);
    }
  });

  it('should handle Enhanced error without error message', () => {
    const enhanced: EnhancedResult<string> = {
      status: 'error',
      code: ErrorCode.UNKNOWN,
    };
    const simple = toSimpleResult(enhanced);

    expect(simple.success).toBe(false);
    if (!simple.success) {
      expect(simple.error.message).toBe('Unknown error');
    }
  });
});

describe('result-compat: toEnhancedResults', () => {
  it('should convert array of Simple results to Enhanced results', () => {
    const simpleArray: Array<SimpleResult<number>> = [
      { success: true, data: 1 },
      { success: false, error: new Error('Fail') },
      { success: true, data: 3 },
    ];

    const enhancedArray = toEnhancedResults(simpleArray);

    expect(enhancedArray).toHaveLength(3);
    expect(enhancedArray[0].status).toBe('success');
    expect(enhancedArray[1].status).toBe('error');
    expect(enhancedArray[2].status).toBe('success');
  });

  it('should apply common options to all results', () => {
    const simpleArray: Array<SimpleResult<string>> = [
      { success: true, data: 'a' },
      { success: true, data: 'b' },
    ];

    const enhancedArray = toEnhancedResults(simpleArray, {
      meta: { batch: 'test-batch' },
    });

    expect(enhancedArray[0].meta).toEqual({ batch: 'test-batch' });
    expect(enhancedArray[1].meta).toEqual({ batch: 'test-batch' });
  });

  it('should handle empty array', () => {
    const enhancedArray = toEnhancedResults([]);
    expect(enhancedArray).toEqual([]);
  });
});

describe('result-compat: toSimpleResults', () => {
  it('should convert array of Enhanced results to Simple results', () => {
    const enhancedArray: Array<EnhancedResult<number>> = [
      { status: 'success', data: 1, code: ErrorCode.NONE },
      { status: 'error', error: 'Fail', code: ErrorCode.UNKNOWN },
      { status: 'success', data: 3, code: ErrorCode.NONE },
    ];

    const simpleArray = toSimpleResults(enhancedArray);

    expect(simpleArray).toHaveLength(3);
    expect(simpleArray[0].success).toBe(true);
    expect(simpleArray[1].success).toBe(false);
    expect(simpleArray[2].success).toBe(true);
  });

  it('should handle partial status as success', () => {
    const enhancedArray: Array<EnhancedResult<string>> = [
      {
        status: 'partial',
        data: 'partial-data',
        error: 'Some failed',
        code: ErrorCode.PARTIAL_FAILED,
        failures: [{ url: 'bad.jpg', error: '404' }],
      } as EnhancedResult<string>,
    ];

    const simpleArray = toSimpleResults(enhancedArray);

    expect(simpleArray).toHaveLength(1);
    expect(simpleArray[0].success).toBe(true);
    if (simpleArray[0].success) {
      expect(simpleArray[0].data).toBe('partial-data');
    }
  });

  it('should handle empty array', () => {
    const simpleArray = toSimpleResults([]);
    expect(simpleArray).toEqual([]);
  });
});

describe('result-compat: round-trip conversion', () => {
  it('should preserve success data through round-trip', () => {
    const original: SimpleResult<string> = { success: true, data: 'test' };
    const enhanced = toEnhancedResult(original);
    const backToSimple = toSimpleResult(enhanced);

    expect(backToSimple.success).toBe(true);
    if (backToSimple.success) {
      expect(backToSimple.data).toBe('test');
    }
  });

  it('should preserve error message through round-trip', () => {
    const original: SimpleResult<string> = {
      success: false,
      error: new Error('Test error'),
    };
    const enhanced = toEnhancedResult(original);
    const backToSimple = toSimpleResult(enhanced);

    expect(backToSimple.success).toBe(false);
    if (!backToSimple.success) {
      expect(backToSimple.error.message).toBe('Test error');
    }
  });

  it('should handle complex data types', () => {
    interface TestData {
      id: number;
      name: string;
      nested: { value: string };
    }

    const original: SimpleResult<TestData> = {
      success: true,
      data: { id: 1, name: 'test', nested: { value: 'nested' } },
    };

    const enhanced = toEnhancedResult(original);
    const backToSimple = toSimpleResult(enhanced);

    expect(backToSimple.success).toBe(true);
    if (backToSimple.success) {
      expect(backToSimple.data).toEqual({
        id: 1,
        name: 'test',
        nested: { value: 'nested' },
      });
    }
  });
});
