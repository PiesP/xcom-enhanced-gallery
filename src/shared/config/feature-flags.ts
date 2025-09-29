/**
 * @fileoverview Feature flag helper utilities
 */

import { FEATURE_FLAGS } from '@/constants';

export type FeatureFlagName = keyof typeof FEATURE_FLAGS;

type FeatureFlagOverrides = Partial<Record<FeatureFlagName, boolean>>;

type FeatureFlagOverrideHost = {
  __XEG_FLAGS__?: FeatureFlagOverrides;
};

function getHost(): FeatureFlagOverrideHost {
  return globalThis as FeatureFlagOverrideHost;
}

function getOverrides(): FeatureFlagOverrides | undefined {
  try {
    return getHost().__XEG_FLAGS__;
  } catch {
    return undefined;
  }
}

export function isFeatureFlagEnabled(name: FeatureFlagName): boolean {
  const overrides = getOverrides();
  const overrideValue = overrides?.[name];
  if (typeof overrideValue === 'boolean') {
    return overrideValue;
  }
  return FEATURE_FLAGS[name];
}

export function setFeatureFlagOverride(name: FeatureFlagName, value: boolean | undefined): void {
  try {
    const host = getHost();
    if (!host.__XEG_FLAGS__) {
      host.__XEG_FLAGS__ = {};
    }
    if (typeof value === 'undefined') {
      delete host.__XEG_FLAGS__?.[name];
      if (host.__XEG_FLAGS__ && Object.keys(host.__XEG_FLAGS__).length === 0) {
        delete host.__XEG_FLAGS__;
      }
      return;
    }
    host.__XEG_FLAGS__![name] = value;
  } catch {
    // ignore override errors
  }
}

export function resetFeatureFlagOverrides(): void {
  try {
    const host = getHost();
    if (host.__XEG_FLAGS__) {
      delete host.__XEG_FLAGS__;
    }
  } catch {
    // ignore reset errors
  }
}
