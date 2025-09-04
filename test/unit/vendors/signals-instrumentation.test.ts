/**
 * @fileoverview Vendor Signals 계측 유지 테스트
 * @description vendor-api-safe.ts의 signals 계측 기능 유지 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getVendorTestCounters,
  resetVendorTestCounters,
} from '@shared/external/vendors/vendor-test-counters';
import { getPreactSignalsSafe } from '@shared/external/vendors/vendor-api-safe';

describe('Vendor Signals Instrumentation (Maintained)', () => {
  beforeEach(() => {
    // 카운터 활성화
    const g = globalThis as any;
    g.__XEG_ENABLE_VENDOR_COUNTERS__ = true;

    // vendor-api-safe가 사용하는 카운터 구조 설정
    const counters = getVendorTestCounters();
    if (counters) {
      g.__XEG_VENDOR_COUNTERS__ = {
        incrementBatch: () => counters.incrementBatch(),
        incrementSignal: () => counters.incrementSignal(),
        incrementEffect: () => counters.incrementEffect(),
      };
    }

    resetVendorTestCounters();
  });

  it('should maintain signal counter functionality after refactoring', () => {
    const signals = getPreactSignalsSafe();
    const counter = signals.signal(0);

    // signal value 설정 시 카운터 증가 확인
    counter.value = 1;
    counter.value = 2;

    const counters = getVendorTestCounters();
    expect(counters?.getSignalUpdateCount()).toBe(2);
  });

  it('should maintain batch counter functionality', () => {
    const signals = getPreactSignalsSafe();

    // batch 호출 시 카운터 증가 확인
    signals.batch(() => {
      // batch 내부 작업
    });

    signals.batch(() => {
      // 두 번째 batch
    });

    const counters = getVendorTestCounters();
    expect(counters?.getBatchCallCount()).toBe(2);
  });

  it('should maintain effect counter functionality', () => {
    const signals = getPreactSignalsSafe();

    // effect 호출 시 카운터 증가 확인
    signals.effect(() => {
      // effect 내부 작업
    });

    const counters = getVendorTestCounters();
    expect(counters?.getEffectExecutionCount()).toBe(1);
  });

  it('should work normally without instrumentation', () => {
    // 계측 비활성화
    const g = globalThis as any;
    delete g.__XEG_ENABLE_VENDOR_COUNTERS__;
    delete g.__XEG_VENDOR_COUNTERS__;

    const signals = getPreactSignalsSafe();

    const counter = signals.signal(0);
    counter.value = 10;

    expect(counter.value).toBe(10);
  });
});
