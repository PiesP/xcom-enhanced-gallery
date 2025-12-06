/**
 * @fileoverview Feature Services Registration
 * @description Lazy registration of features layer services (TwitterTokenExtractor, DOMCache)
 * @module bootstrap/features
 *
 * Phase 326.4: Conditional Feature Loading
 * - Check feature flags based on user settings
 * - Load only enabled features
 * - Remove unused features via tree-shaking
 *
 * Phase 343: Error Handling Standardization
 * - Non-Critical system - warn on error only
 *
 * Phase 346: Declarative Loader Pattern
 * - Remove duplication via declarative loader array (138 lines → 80 lines)
 */

import { reportBootstrapError } from '@bootstrap/types';
import { APP_SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS } from '@constants';
import { logger } from '@shared/logging';
// ─────────────────────────────────────────
// Feature Flag Logic
// ─────────────────────────────────────────

export type FeatureKey = 'gallery' | 'settings' | 'download' | 'mediaExtraction' | 'accessibility';

const FEATURE_KEYS: readonly FeatureKey[] = [
  'gallery',
  'settings',
  'download',
  'mediaExtraction',
  'accessibility',
] as const;

export interface SettingsWithFeatures {
  features: Record<string, boolean | undefined>;
}

const DEFAULT_FEATURE_STATE: Record<FeatureKey, boolean> = {
  gallery: true,
  settings: true,
  download: true,
  mediaExtraction: true,
  accessibility: true,
};

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

function readFlag(settings: SettingsWithFeatures | null | undefined, feature: FeatureKey): boolean {
  const source = settings?.features ?? {};
  return coerceBoolean(source[feature], DEFAULT_FEATURE_STATE[feature]);
}

function resolveFeatureStates(settings?: SettingsWithFeatures | null): Record<FeatureKey, boolean> {
  return FEATURE_KEYS.reduce<Record<FeatureKey, boolean>>(
    (state, key) => {
      state[key] = readFlag(settings ?? undefined, key);
      return state;
    },
    {} as Record<FeatureKey, boolean>,
  );
}

const getDevOverride = (): boolean | undefined => {
  const scopedGlobal = globalThis as { __XEG_DEV__?: boolean } | undefined;
  if (scopedGlobal && typeof scopedGlobal.__XEG_DEV__ === 'boolean') {
    return scopedGlobal.__XEG_DEV__;
  }
  return undefined;
};

const isDevelopmentBuild = (): boolean => {
  const override = getDevOverride();
  if (typeof override === 'boolean') {
    return override;
  }
  return __DEV__;
};

const debug = (message: string) => {
  if (isDevelopmentBuild()) {
    logger.debug(message);
  }
};

/**
 * Feature Loader definition
 * Phase 346: Declarative loader pattern
 */
export interface FeatureLoader {
  flag: FeatureKey;
  name: string;
  load: () => Promise<void>;
  devOnly?: boolean;
}

/**
 * Feature Loaders array
 * Phase 346: Declarative definition to eliminate duplicate code
 */
const featureLoaders: FeatureLoader[] = [];

export function registerFeatureLoader(loader: FeatureLoader): void {
  featureLoaders.push(loader);
}

/**
 * @internal Used exclusively by tests to ensure isolation
 */
export function resetFeatureLoaders(): void {
  featureLoaders.splice(0, featureLoaders.length);
}

const DEFAULT_FEATURE_SETTINGS: Readonly<SettingsWithFeatures> = Object.freeze({
  features: { ...DEFAULT_SETTINGS.features },
});

const cloneDefaultFeatureSettings = (): SettingsWithFeatures => ({
  features: { ...DEFAULT_FEATURE_SETTINGS.features },
});

/**
 * Settings loading helper function
 * Phase 346: Logic separation
 */
async function loadFeatureSettings(): Promise<SettingsWithFeatures> {
  try {
    const { getPersistentStorage } = await import('@shared/services/persistent-storage');
    const storage = getPersistentStorage();
    const stored = await storage.get<Record<string, unknown>>(APP_SETTINGS_STORAGE_KEY);

    if (stored && typeof stored === 'object' && 'features' in stored) {
      const candidate = (stored as Partial<SettingsWithFeatures>).features;

      if (candidate && typeof candidate === 'object') {
        debug('[features] Settings loaded successfully');
        return {
          features: {
            ...DEFAULT_FEATURE_SETTINGS.features,
            ...candidate,
          },
        } satisfies SettingsWithFeatures;
      }
    }
  } catch (error) {
    logger.warn('[features] Settings loading failed - using defaults:', error);
  }

  return cloneDefaultFeatureSettings();
}

/**
 * Lazy registration of feature services
 *
 * Phase 346: Refactored with declarative loader pattern
 * - Iterate based on FEATURE_LOADERS array
 * - Remove duplicate code (138 lines → 80 lines)
 * - Add new features by appending to array only
 *
 * @throws No uncaught errors - all failures handled internally
 */
export async function registerFeatureServicesLazy(): Promise<void> {
  try {
    debug('[features] Registering feature services');

    // Load settings
    const settings = await loadFeatureSettings();
    const featureStates = resolveFeatureStates(settings);

    // Phase 346: Declarative loader pattern
    for (const loader of featureLoaders) {
      if (loader.devOnly && !isDevelopmentBuild()) {
        continue;
      }

      if (!featureStates[loader.flag]) {
        debug(`[features] ℹ️ ${loader.name} disabled (${loader.flag}: false)`);
        continue;
      }

      try {
        await loader.load();
        debug(`[features] ✅ ${loader.name} registered`);
      } catch (error) {
        logger.warn(`[features] ⚠️ ${loader.name} registration failed (continuing):`, error);
      }
    }

    debug('[features] ✅ Feature services registered');
  } catch (error) {
    // Phase 343: Standardized error handling (Non-Critical - warn only)
    reportBootstrapError(error, { context: 'features', logger });
  }
}
