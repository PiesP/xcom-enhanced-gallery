/**
 * @fileoverview TDD RED: 벤더 초기화 전에 getPreactHooks 안전 접근
 * 목표: initializeVendors() 이전에도 getPreactHooks() 호출이 예외를 던지지 않아야 한다
 * - 번들된 hooks(fallback)를 사용하여 최소 안전 동작 보장
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TDD: 벤더 훅 안전 접근 (initializeVendors 이전)', () => {
  let vendors: typeof import('../../src/shared/external/vendors/vendor-api');

  beforeEach(async () => {
    // 글로벌 모킹을 해제하고 실제 모듈을 불러온다
    vi.resetModules();
    vi.unmock('@shared/external/vendors/vendor-api');
    vendors = await import('../../src/shared/external/vendors/vendor-api');
    vendors.resetVendorCache();
  });

  it('RED: initializeVendors 이전 getPreactHooks 호출은 예외를 던지지 않아야 한다', async () => {
    const { getPreactHooks } = vendors;

    let hooks: unknown = null;
    // 현재 구현에서는 throw가 발생해야 하므로 본 기대는 실패(RED)해야 한다
    expect(() => {
      hooks = getPreactHooks();
    }).not.toThrow();

    // 최소 인터페이스 검증: useState가 함수여야 함
    expect(hooks && typeof (hooks as any).useState).toBe('function');
  });
});
