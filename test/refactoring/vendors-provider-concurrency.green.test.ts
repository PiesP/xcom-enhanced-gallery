/**
 * 🟢 Vendor Provider Concurrency Safety 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  setVendorProviders,
  resetVendorProviders,
} from '../../src/shared/external/vendors/vendor-providers';
import {
  resetVendorCache,
  getPreactHooks,
  getPreactSignals,
} from '../../src/shared/external/vendors/vendor-api';

function makeHooks(id: string) {
  return { useState: () => [id, () => {}] } as any;
}
function makeSignals(id: string) {
  return { signal: (v: any) => ({ id, value: v }) } as any;
}

describe('🟢 Vendor Provider Concurrency Safety', () => {
  it('빠른 연속 provider 주입 시 마지막 설정이 반영', () => {
    resetVendorCache();
    resetVendorProviders();

    setVendorProviders({
      bundledHooks: () => makeHooks('A'),
      bundledSignals: () => makeSignals('A'),
    });
    setVendorProviders({ bundledHooks: () => makeHooks('B') });
    setVendorProviders({ bundledSignals: () => makeSignals('C') });

    const hooks = getPreactHooks();
    const signals = getPreactSignals();

    expect((hooks.useState() as any)[0]).toBe('B');
    expect(signals.signal('x').id).toBe('C');
  });
});
