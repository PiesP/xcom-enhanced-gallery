/**
 * Vendor Providers - 테스트/DI를 위한 번들된 preact hooks & signals 접근자 래핑
 * TDD Phase: vendor 안전 접근 - provider 주입 기능
 */
import { preactHooks as defaultBundledHooks } from '../hooks-bundled';
import { preactSignals as defaultBundledSignals } from '../signals-bundled';
import type { PreactHooksAPI, PreactSignalsAPI } from './types';

interface VendorProviders {
  bundledHooks: () => PreactHooksAPI | null;
  bundledSignals: () => PreactSignalsAPI | null;
}

// 내부 가변 상태 (테스트에서 교체 가능)
let providers: VendorProviders = {
  bundledHooks: () =>
    defaultBundledHooks && typeof defaultBundledHooks.useState === 'function'
      ? defaultBundledHooks
      : null,
  bundledSignals: () =>
    defaultBundledSignals && typeof defaultBundledSignals.signal === 'function'
      ? defaultBundledSignals
      : null,
};

export type PartialVendorProviders = Partial<VendorProviders>;

/**
 * 테스트용 provider 주입 (부분 적용 가능)
 */
export function setVendorProviders(partial: PartialVendorProviders): void {
  providers = { ...providers, ...partial };
}

/**
 * 테스트 리셋용 - 기본 provider로 복귀
 */
export function resetVendorProviders(): void {
  providers = {
    bundledHooks: () =>
      defaultBundledHooks && typeof defaultBundledHooks.useState === 'function'
        ? defaultBundledHooks
        : null,
    bundledSignals: () =>
      defaultBundledSignals && typeof defaultBundledSignals.signal === 'function'
        ? defaultBundledSignals
        : null,
  };
}

export function getBundledHooks(): PreactHooksAPI | null {
  return providers.bundledHooks();
}

export function getBundledSignals(): PreactSignalsAPI | null {
  return providers.bundledSignals();
}
