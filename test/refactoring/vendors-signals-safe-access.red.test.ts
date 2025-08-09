/**
 * @fileoverview TDD RED: 벤더 초기화 전에 getPreactSignals 안전 접근
 * 목표: initializeVendors() 이전에도 getPreactSignals() 호출이 예외를 던지지 않아야 한다
 * - 번들된 signals(fallback)를 사용하여 최소 안전 동작 보장
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TDD: 벤더 시그널 안전 접근 (initializeVendors 이전)', () => {
  let vendors: typeof import('../../src/shared/external/vendors/vendor-api');

  beforeEach(async () => {
    vi.resetModules();
    vi.unmock('@shared/external/vendors/vendor-api');
    vendors = await import('../../src/shared/external/vendors/vendor-api');
    vendors.resetVendorCache();
  });

  it('RED: initializeVendors 이전 getPreactSignals 호출은 예외를 던지지 않아야 한다', async () => {
    const { getPreactSignals } = vendors;

    let signals: unknown = null;
    expect(() => {
      signals = getPreactSignals();
    }).not.toThrow();

    // 최소 인터페이스 검증: signal/effect가 함수여야 함
    expect(signals && typeof (signals as any).signal).toBe('function');
    expect(signals && typeof (signals as any).effect).toBe('function');
  });
});
