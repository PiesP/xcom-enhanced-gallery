/**
 * 🟢 TDD GREEN: Vendor Providers 주입/불변성 테스트
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetVendorCache,
  initializeVendors,
  getPreactHooks,
  getPreactSignals,
} from '../../src/shared/external/vendors/vendor-api';
import {
  setVendorProviders,
  resetVendorProviders,
  getBundledHooks,
  getBundledSignals,
} from '../../src/shared/external/vendors/vendor-providers';

// 간단 Mock 구현
function makeHooksMock() {
  return { useState: () => ['mock', () => {}] } as any;
}
function makeSignalsMock() {
  return { signal: (v: any) => ({ value: v }) } as any;
}

describe('🟢 Vendor Providers GREEN', () => {
  beforeEach(() => {
    resetVendorCache();
    resetVendorProviders();
  });

  it('provider 주입 시 getPreactHooks/Signals가 커스텀 mock을 반환한다 (initializeVendors 이전)', () => {
    const hooksMock = makeHooksMock();
    const signalsMock = makeSignalsMock();

    setVendorProviders({
      bundledHooks: () => hooksMock,
      bundledSignals: () => signalsMock,
    });

    expect(getPreactHooks()).toBe(hooksMock);
    expect(getPreactSignals()).toBe(signalsMock);
  });

  it('initializeVendors 이후 provider 주입이 기존 cache를 덮어쓰지 않는다', async () => {
    await initializeVendors().catch(() => {}); // 실패해도 캐시 채워질 수 있음
    const hooksCached = getPreactHooks();
    const signalsCached = getPreactSignals();

    const hooksMock = makeHooksMock();
    const signalsMock = makeSignalsMock();
    setVendorProviders({
      bundledHooks: () => hooksMock,
      bundledSignals: () => signalsMock,
    });

    // 이미 cache가 있으므로 동일 참조 유지해야 함
    expect(getPreactHooks()).toBe(hooksCached);
    expect(getPreactSignals()).toBe(signalsCached);
  });

  it('resetVendorProviders 후 기본 provider로 복구된다', () => {
    const originalHooks = getBundledHooks();
    const originalSignals = getBundledSignals();

    setVendorProviders({
      bundledHooks: () => makeHooksMock(),
    });
    resetVendorProviders();

    expect(getBundledHooks()).toBe(originalHooks);
    expect(getBundledSignals()).toBe(originalSignals);
  });
});
