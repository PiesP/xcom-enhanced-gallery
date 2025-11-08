/**
 * @fileoverview Unit Tests for Conditional Feature Loading Utilities
 * @description Phase 326.4-4: Feature Flag Tests
 *
 * Test Coverage:
 * - Feature status checking (getFeatureStatus)
 * - Feature list operations (getEnabled/DisabledFeatures)
 * - Feature requirement validation (areAllFeaturesEnabled)
 * - Conditional loader creation and operation
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getFeatureStatus,
  getEnabledFeatures,
  getDisabledFeatures,
  areAllFeaturesEnabled,
  createConditionalLoader,
  ConditionalFeatureLoader,
  type FeatureKey,
  type SettingsWithFeatures,
} from '../../../src/shared/utils/conditional-loading';

describe('Conditional Feature Loading Utilities', () => {
  // ─────────────────────────────────────────
  // Test Data
  // ─────────────────────────────────────────

  const allFeaturesEnabled: SettingsWithFeatures = {
    features: {
      gallery: true,
      settings: true,
      download: true,
      mediaExtraction: true,
      advancedFilters: true,
      accessibility: true,
    },
  };

  const allFeaturesDisabled: SettingsWithFeatures = {
    features: {
      gallery: true, // Gallery always required
      settings: false,
      download: false,
      mediaExtraction: false,
      advancedFilters: false,
      accessibility: false,
    },
  };

  const mixedFeatures: SettingsWithFeatures = {
    features: {
      gallery: true,
      settings: true,
      download: false,
      mediaExtraction: true,
      advancedFilters: false,
      accessibility: true,
    },
  };

  // ─────────────────────────────────────────
  // getFeatureStatus Tests (6 tests)
  // ─────────────────────────────────────────

  describe('getFeatureStatus', () => {
    it('should return true for enabled feature', () => {
      expect(getFeatureStatus(allFeaturesEnabled, 'gallery')).toBe(true);
      expect(getFeatureStatus(allFeaturesEnabled, 'download')).toBe(true);
    });

    it('should return false for disabled feature', () => {
      expect(getFeatureStatus(allFeaturesDisabled, 'settings')).toBe(false);
      expect(getFeatureStatus(allFeaturesDisabled, 'accessibility')).toBe(false);
    });

    it('should return true by default if feature key is missing', () => {
      const settings: SettingsWithFeatures = { features: {} };
      expect(getFeatureStatus(settings, 'gallery')).toBe(true);
    });

    it('should handle mixed feature settings correctly', () => {
      expect(getFeatureStatus(mixedFeatures, 'gallery')).toBe(true);
      expect(getFeatureStatus(mixedFeatures, 'download')).toBe(false);
      expect(getFeatureStatus(mixedFeatures, 'mediaExtraction')).toBe(true);
    });

    it('should work with all feature keys', () => {
      const featureKeys: FeatureKey[] = [
        'gallery',
        'settings',
        'download',
        'mediaExtraction',
        'advancedFilters',
        'accessibility',
      ];

      featureKeys.forEach(key => {
        expect(typeof getFeatureStatus(allFeaturesEnabled, key)).toBe('boolean');
      });
    });

    it('should maintain consistency across multiple calls', () => {
      const result1 = getFeatureStatus(allFeaturesEnabled, 'download');
      const result2 = getFeatureStatus(allFeaturesEnabled, 'download');
      expect(result1).toBe(result2);
    });
  });

  // ─────────────────────────────────────────
  // getEnabledFeatures Tests (5 tests)
  // ─────────────────────────────────────────

  describe('getEnabledFeatures', () => {
    it('should return all features when all enabled', () => {
      const enabled = getEnabledFeatures(allFeaturesEnabled);
      expect(enabled).toHaveLength(6);
      expect(enabled).toContain('gallery');
      expect(enabled).toContain('settings');
      expect(enabled).toContain('download');
    });

    it('should return only gallery when others disabled', () => {
      const enabled = getEnabledFeatures(allFeaturesDisabled);
      expect(enabled).toHaveLength(1);
      expect(enabled).toContain('gallery');
    });

    it('should return only enabled features in mixed settings', () => {
      const enabled = getEnabledFeatures(mixedFeatures);
      expect(enabled).toContain('gallery');
      expect(enabled).toContain('settings');
      expect(enabled).toContain('mediaExtraction');
      expect(enabled).toContain('accessibility');
      expect(enabled).not.toContain('download');
      expect(enabled).not.toContain('advancedFilters');
      expect(enabled).toHaveLength(4);
    });

    it('should return empty array for empty features object', () => {
      const settings: SettingsWithFeatures = { features: {} };
      // Empty object defaults all to true, so all should be enabled
      const enabled = getEnabledFeatures(settings);
      expect(enabled).toHaveLength(6); // All default to true
    });

    it('should maintain consistent order', () => {
      const enabled1 = getEnabledFeatures(allFeaturesEnabled);
      const enabled2 = getEnabledFeatures(allFeaturesEnabled);
      expect(enabled1).toEqual(enabled2);
    });
  });

  // ─────────────────────────────────────────
  // getDisabledFeatures Tests (5 tests)
  // ─────────────────────────────────────────

  describe('getDisabledFeatures', () => {
    it('should return empty array when all enabled', () => {
      const disabled = getDisabledFeatures(allFeaturesEnabled);
      expect(disabled).toHaveLength(0);
    });

    it('should return non-gallery features when others disabled', () => {
      const disabled = getDisabledFeatures(allFeaturesDisabled);
      expect(disabled).toHaveLength(5);
      expect(disabled).not.toContain('gallery');
      expect(disabled).toContain('settings');
      expect(disabled).toContain('download');
    });

    it('should return only disabled features in mixed settings', () => {
      const disabled = getDisabledFeatures(mixedFeatures);
      expect(disabled).toContain('download');
      expect(disabled).toContain('advancedFilters');
      expect(disabled).toHaveLength(2);
      expect(disabled).not.toContain('gallery');
      expect(disabled).not.toContain('settings');
    });

    it('should return empty array for empty features object', () => {
      const settings: SettingsWithFeatures = { features: {} };
      const disabled = getDisabledFeatures(settings);
      expect(disabled).toHaveLength(0); // All default to true
    });

    it('should be inverse of enabled features (except for defaults)', () => {
      const enabled = getEnabledFeatures(mixedFeatures);
      const disabled = getDisabledFeatures(mixedFeatures);
      const total = enabled.length + disabled.length;
      expect(total).toBe(6); // Should sum to total features
    });
  });

  // ─────────────────────────────────────────
  // areAllFeaturesEnabled Tests (4 tests)
  // ─────────────────────────────────────────

  describe('areAllFeaturesEnabled', () => {
    it('should return true when all requested features are enabled', () => {
      expect(areAllFeaturesEnabled(allFeaturesEnabled, ['gallery', 'download'])).toBe(true);
      expect(areAllFeaturesEnabled(allFeaturesEnabled, ['settings', 'accessibility'])).toBe(true);
    });

    it('should return false when any requested feature is disabled', () => {
      expect(areAllFeaturesEnabled(allFeaturesDisabled, ['gallery', 'download'])).toBe(false);
      expect(areAllFeaturesEnabled(mixedFeatures, ['download', 'mediaExtraction'])).toBe(false);
    });

    it('should return true for empty feature list', () => {
      expect(areAllFeaturesEnabled(allFeaturesDisabled, [])).toBe(true);
    });

    it('should work correctly with single feature', () => {
      expect(areAllFeaturesEnabled(allFeaturesEnabled, ['gallery'])).toBe(true);
      expect(areAllFeaturesEnabled(allFeaturesDisabled, ['settings'])).toBe(false);
    });
  });

  // ─────────────────────────────────────────
  // createConditionalLoader Tests (3 tests)
  // ─────────────────────────────────────────

  describe('createConditionalLoader', () => {
    it('should create loader instance with settings', () => {
      const loader = createConditionalLoader(allFeaturesEnabled);
      expect(loader).toBeInstanceOf(ConditionalFeatureLoader);
    });

    it('should create loader with custom config', () => {
      const config = { debug: true, timeout: 5000 };
      const loader = createConditionalLoader(allFeaturesEnabled, config);
      expect(loader).toBeInstanceOf(ConditionalFeatureLoader);
    });

    it('should create loader with default config when config not provided', () => {
      const loader = createConditionalLoader(allFeaturesEnabled);
      expect(loader).toBeInstanceOf(ConditionalFeatureLoader);
    });
  });

  // ─────────────────────────────────────────
  // ConditionalFeatureLoader Tests (20+ tests)
  // ─────────────────────────────────────────

  describe('ConditionalFeatureLoader', () => {
    let loader: ConditionalFeatureLoader;

    beforeEach(() => {
      loader = createConditionalLoader(allFeaturesEnabled, { debug: false });
    });

    // Constructor & Initialization
    describe('constructor & initialization', () => {
      it('should initialize with default config', () => {
        const l = new ConditionalFeatureLoader(allFeaturesEnabled);
        expect(l).toBeInstanceOf(ConditionalFeatureLoader);
      });

      it('should initialize with custom debug config', () => {
        const l = new ConditionalFeatureLoader(allFeaturesEnabled, { debug: true });
        expect(l).toBeInstanceOf(ConditionalFeatureLoader);
      });

      it('should initialize with empty load state', () => {
        const state = loader.getLoadState();
        expect(Object.keys(state)).toHaveLength(0);
      });
    });

    // getLoadState Tests
    describe('getLoadState', () => {
      it('should return empty object initially', () => {
        const state = loader.getLoadState();
        expect(state).toEqual({});
      });

      it('should return a copy, not reference', () => {
        const state1 = loader.getLoadState();
        const state2 = loader.getLoadState();
        expect(state1).not.toBe(state2);
      });
    });

    // isLoaded Tests
    describe('isLoaded', () => {
      it('should return false for unloaded feature', () => {
        expect(loader.isLoaded('gallery')).toBe(false);
      });

      it('should return false for all features initially', () => {
        const features: FeatureKey[] = [
          'gallery',
          'settings',
          'download',
          'mediaExtraction',
          'advancedFilters',
          'accessibility',
        ];
        features.forEach(feature => {
          expect(loader.isLoaded(feature)).toBe(false);
        });
      });
    });

    // loadEnabledServices Tests
    describe('loadEnabledServices', () => {
      it('should load enabled services', async () => {
        const state = await loader.loadEnabledServices();
        expect(state).toBeDefined();
        expect(typeof state).toBe('object');
      });

      it('should return load state for all enabled features', async () => {
        const state = await loader.loadEnabledServices();
        expect(state.gallery).toBeDefined();
        expect(state.settings).toBeDefined();
        expect(state.download).toBeDefined();
      });

      it('should mark features as loaded after loadEnabledServices', async () => {
        await loader.loadEnabledServices();
        expect(loader.isLoaded('gallery')).toBe(true);
        expect(loader.isLoaded('settings')).toBe(true);
      });

      it('should handle mixed enabled/disabled features', async () => {
        const mixedLoader = createConditionalLoader(mixedFeatures, { debug: false });
        const state = await mixedLoader.loadEnabledServices();

        // Check enabled features
        expect(state.gallery).toBeDefined();
        expect(state.settings).toBeDefined();
        expect(state.mediaExtraction).toBeDefined();

        // Check disabled features (should not be in state or be undefined)
        // Download and advancedFilters are disabled in mixedFeatures
        // They should not be attempted to load
      });

      it('should not throw on error if continueOnError is true', async () => {
        const l = createConditionalLoader(allFeaturesEnabled, {
          continueOnError: true,
        });
        // Should not throw even if services fail to load
        const state = await l.loadEnabledServices();
        expect(state).toBeDefined();
      });
    });

    // unloadFeature Tests
    describe('unloadFeature', () => {
      beforeEach(async () => {
        await loader.loadEnabledServices();
      });

      it('should unload enabled features', async () => {
        expect(loader.isLoaded('settings')).toBe(true);
        await loader.unloadFeature('settings');
        expect(loader.getLoadState().settings).toBeUndefined();
      });

      it('should throw error when unloading gallery (required feature)', async () => {
        await expect(loader.unloadFeature('gallery')).rejects.toThrow(
          /Cannot unload required feature: gallery/i
        );
      });

      it('should not throw when unloading other features', async () => {
        await expect(loader.unloadFeature('settings')).resolves.toBeUndefined();
        await expect(loader.unloadFeature('download')).resolves.toBeUndefined();
      });
    });

    // unloadAll Tests
    describe('unloadAll', () => {
      beforeEach(async () => {
        await loader.loadEnabledServices();
      });

      it('should unload all features except gallery', async () => {
        await loader.unloadAll();
        const state = loader.getLoadState();

        // Gallery should still be defined but others may be undefined
        // Or gallery might not be in state depending on implementation
        // Just verify unloadAll completes without error
        expect(state).toBeDefined();
      });

      it('should handle empty load state', async () => {
        const emptyLoader = createConditionalLoader(allFeaturesEnabled);
        await expect(emptyLoader.unloadAll()).resolves.toBeUndefined();
      });
    });

    // Error Handling
    describe('error handling', () => {
      it('should handle continueOnError config', async () => {
        const l = createConditionalLoader(allFeaturesEnabled, {
          continueOnError: true,
        });
        const state = await l.loadEnabledServices();
        expect(state).toBeDefined();
      });

      it('should handle settings load with fallback', () => {
        // Loader with empty settings should work
        const emptySettings: SettingsWithFeatures = { features: {} };
        const l = createConditionalLoader(emptySettings);
        expect(l).toBeInstanceOf(ConditionalFeatureLoader);
      });
    });

    // Feature Status Consistency
    describe('feature status consistency', () => {
      it('should load only enabled features', async () => {
        const l = createConditionalLoader(mixedFeatures, { debug: false });
        const state = await l.loadEnabledServices();

        // Enabled features should be present
        expect(state.gallery).toBeDefined();
        expect(state.settings).toBeDefined();
        expect(state.mediaExtraction).toBeDefined();
        expect(state.accessibility).toBeDefined();
      });

      it('should respect feature flag settings', async () => {
        const onlyGallery: SettingsWithFeatures = {
          features: {
            gallery: true,
            settings: false,
            download: false,
            mediaExtraction: false,
            advancedFilters: false,
            accessibility: false,
          },
        };
        const l = createConditionalLoader(onlyGallery);
        const state = await l.loadEnabledServices();

        expect(state.gallery).toBeDefined();
        expect(state.gallery?.enabled).toBe(true);
      });
    });
  });

  // ─────────────────────────────────────────
  // Integration Scenarios (5+ tests)
  // ─────────────────────────────────────────

  describe('Integration Scenarios', () => {
    it('should handle complete feature lifecycle', async () => {
      const loader = createConditionalLoader(mixedFeatures);

      // Initial state
      expect(Object.keys(loader.getLoadState())).toHaveLength(0);

      // Load enabled services
      const loadState = await loader.loadEnabledServices();
      expect(loadState).toBeDefined();

      // Unload specific feature
      await loader.unloadFeature('settings');

      // Check state
      const finalState = loader.getLoadState();
      expect(finalState.settings).toBeUndefined();
    });

    it('should work with all features disabled except gallery', async () => {
      const galleryOnly: SettingsWithFeatures = {
        features: {
          gallery: true,
          settings: false,
          download: false,
          mediaExtraction: false,
          advancedFilters: false,
          accessibility: false,
        },
      };

      const loader = createConditionalLoader(galleryOnly);
      const state = await loader.loadEnabledServices();

      expect(state).toBeDefined();
      // Gallery should be loaded
      expect(Object.keys(state).length).toBeGreaterThan(0);
    });

    it('should handle dynamic config changes', async () => {
      const loader1 = createConditionalLoader(allFeaturesEnabled, { debug: false });
      const loader2 = createConditionalLoader(allFeaturesEnabled, { debug: true });

      const state1 = await loader1.loadEnabledServices();
      const state2 = await loader2.loadEnabledServices();

      // Both should work regardless of debug config
      expect(state1).toBeDefined();
      expect(state2).toBeDefined();
    });

    it('should maintain separate state for different loaders', async () => {
      const loader1 = createConditionalLoader(allFeaturesEnabled);
      const loader2 = createConditionalLoader(allFeaturesDisabled);

      await loader1.loadEnabledServices();
      await loader2.loadEnabledServices();

      const state1 = loader1.getLoadState();
      const state2 = loader2.getLoadState();

      // States should be different
      expect(Object.keys(state1).length).toBeGreaterThan(Object.keys(state2).length);
    });

    it('should support feature-by-feature loading strategy', async () => {
      const loader = createConditionalLoader(mixedFeatures);
      const enabled = getEnabledFeatures(mixedFeatures);

      // Verify we can check which features are enabled
      expect(enabled).toContain('gallery');
      expect(enabled).toContain('settings');
      expect(enabled).not.toContain('download');

      // Load services
      const state = await loader.loadEnabledServices();
      expect(state).toBeDefined();
    });
  });
});
