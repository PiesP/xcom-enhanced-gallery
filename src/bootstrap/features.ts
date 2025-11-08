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

import { logger } from '../shared/logging';
import { registerTwitterTokenExtractor } from '../shared/container/service-accessors';
import {
  getFeatureStatus,
  getEnabledFeatures,
  createConditionalLoader,
  type FeatureKey,
} from '@shared/utils/conditional-loading';
import type { SettingsWithFeatures } from '@shared/utils/conditional-loading';
import { NON_CRITICAL_ERROR_STRATEGY, handleBootstrapError } from './types';

/**
 * Feature Loader definition
 * Phase 346: Declarative loader pattern
 */
interface FeatureLoader {
  flag: FeatureKey;
  name: string;
  load: () => Promise<void>;
  optional?: boolean;
}

/**
 * Feature Loaders array
 * Phase 346: Declarative definition to eliminate duplicate code
 */
const FEATURE_LOADERS: FeatureLoader[] = [
  {
    flag: 'mediaExtraction',
    name: 'TwitterTokenExtractor',
    load: async () => {
      const { TwitterTokenExtractor } = await import('../shared/services/token-extraction');
      registerTwitterTokenExtractor(new TwitterTokenExtractor());
    },
  },
  // Download feature currently has no actual loading, so placeholder
  {
    flag: 'download',
    name: 'Download',
    load: async () => {
      // Planned for future implementation
    },
    optional: true,
  },
  // Advanced Filters to be implemented in future
  {
    flag: 'advancedFilters',
    name: 'AdvancedFilters',
    load: async () => {
      // Planned for future implementation
    },
    optional: true,
  },
  // Accessibility to be implemented in future
  {
    flag: 'accessibility',
    name: 'Accessibility',
    load: async () => {
      // Planned for future implementation
    },
    optional: true,
  },
];

/**
 * Settings loading helper function
 * Phase 346: Logic separation
 */
async function loadSettings(): Promise<SettingsWithFeatures> {
  const defaultSettings: SettingsWithFeatures = {
    features: {
      gallery: true,
      settings: true,
      download: true,
      mediaExtraction: true,
      advancedFilters: true,
      accessibility: true,
    },
  };

  try {
    const { PersistentStorage } = await import('@shared/services/persistent-storage');
    const storage = PersistentStorage.getInstance();
    const stored = await storage.get<Record<string, unknown>>('settings');

    if (stored && typeof stored === 'object' && (stored as Record<string, unknown>).features) {
      const settings = stored as unknown as SettingsWithFeatures;
      logger.debug('[features] Settings loaded successfully', {
        features: getEnabledFeatures(settings).join(', '),
      });
      return settings;
    }
  } catch (error) {
    logger.warn('[features] Settings loading failed - using defaults:', error);
  }

  return defaultSettings;
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
    logger.debug('[features] Registering feature services');

    // Load settings
    const settings = await loadSettings();

    // DOMCache initialization (optional)
    try {
      await import('../shared/dom/dom-cache');
    } catch {
      // DOMCache absent or not initialized - ignore
    }

    // Phase 346: Declarative loader pattern
    for (const loader of FEATURE_LOADERS) {
      if (!getFeatureStatus(settings, loader.flag)) {
        logger.debug(`[features] ℹ️ ${loader.name} disabled (${loader.flag}: false)`);
        continue;
      }

      // Optional loaders only log if no actual implementation
      if (loader.optional) {
        logger.debug(`[features] ℹ️ ${loader.name} enabled (loading planned)`);
        continue;
      }

      try {
        await loader.load();
        logger.debug(`[features] ✅ ${loader.name} registered`);
      } catch (error) {
        logger.warn(`[features] ⚠️ ${loader.name} registration failed (continuing):`, error);
      }
    }

    // Start async loading using conditional loader (non-blocking)
    const conditionalLoader = createConditionalLoader(settings, { debug: __DEV__ });
    void conditionalLoader.loadEnabledServices().catch(error => {
      logger.warn('[features] Error during conditional feature loading (continuing):', error);
    });

    logger.debug('[features] ✅ Feature services registered');
  } catch (error) {
    // Phase 343: Standardized error handling (Non-Critical - warn only)
    handleBootstrapError(error, { ...NON_CRITICAL_ERROR_STRATEGY, context: 'features' }, logger);
  }
}
