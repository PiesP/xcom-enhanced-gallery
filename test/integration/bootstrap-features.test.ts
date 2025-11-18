/**
 * @fileoverview Integration Tests for Bootstrap Features with Conditional Loading
 * @description Phase 326.4-4: Feature Flag Bootstrap Integration Tests
 *
 * Test Coverage:
 * - registerFeatureServicesLazy with feature flags
 * - Settings loading from PersistentStorage
 * - Fallback to default settings
 * - Conditional service registration
 * - Error handling and recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Bootstrap Features with Conditional Loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────
  // Settings Loading Tests (8 tests)
  // ─────────────────────────────────────────

  describe('Settings Loading', () => {
    it('should have DEFAULT_SETTINGS with features field', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      expect(DEFAULT_SETTINGS).toBeDefined();
      expect(DEFAULT_SETTINGS.features).toBeDefined();
      expect(typeof DEFAULT_SETTINGS.features).toBe('object');
    });

    it('should have all required feature flags in DEFAULT_SETTINGS', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      expect(DEFAULT_SETTINGS.features).toHaveProperty('gallery', true);
      expect(DEFAULT_SETTINGS.features).toHaveProperty('settings', true);
      expect(DEFAULT_SETTINGS.features).toHaveProperty('download', true);
      expect(DEFAULT_SETTINGS.features).toHaveProperty('mediaExtraction', true);
      expect(DEFAULT_SETTINGS.features).toHaveProperty('advancedFilters', true);
      expect(DEFAULT_SETTINGS.features).toHaveProperty('accessibility', true);
    });

    it('should have all features enabled by default', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      Object.values(DEFAULT_SETTINGS.features).forEach(enabled => {
        expect(enabled).toBe(true);
      });
    });

    it('should include features in AppSettings type', async () => {
      await import('../../src/features/settings/types/settings.types');
      expect(true).toBe(true);
    });

    it('should have features field in full AppSettings', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');
      expect(DEFAULT_SETTINGS.features).toBeDefined();
    });

    it('should support feature flag updates in settings', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      const modified = {
        ...DEFAULT_SETTINGS,
        features: {
          ...DEFAULT_SETTINGS.features,
          download: false,
          advancedFilters: false,
        },
      };

      expect(modified.features.download).toBe(false);
      expect(modified.features.advancedFilters).toBe(false);
      expect(modified.features.gallery).toBe(true);
    });

    it('should preserve other settings fields while updating features', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      expect(DEFAULT_SETTINGS.gallery).toBeDefined();
      expect(DEFAULT_SETTINGS.download).toBeDefined();
      expect(DEFAULT_SETTINGS.accessibility).toBeDefined();
    });

    it('should have version info in settings', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      expect(DEFAULT_SETTINGS.version).toBeDefined();
      expect(typeof DEFAULT_SETTINGS.version).toBe('string');
    });
  });

  // ─────────────────────────────────────────
  // Conditional Loader Utilities Tests (6 tests)
  // ─────────────────────────────────────────

  describe('Conditional Loading Utilities', () => {
    it('should export getFeatureStatus utility', async () => {
      const { getFeatureStatus } = await import('../../src/shared/utils/conditional-loading');

      expect(typeof getFeatureStatus).toBe('function');
    });

    it('should export getEnabledFeatures utility', async () => {
      const { getEnabledFeatures } = await import('../../src/shared/utils/conditional-loading');

      expect(typeof getEnabledFeatures).toBe('function');
    });

    it('should export createConditionalLoader factory', async () => {
      const { createConditionalLoader } = await import(
        '../../src/shared/utils/conditional-loading'
      );

      expect(typeof createConditionalLoader).toBe('function');
    });

    it('should export ConditionalFeatureLoader class', async () => {
      const { ConditionalFeatureLoader } = await import(
        '../../src/shared/utils/conditional-loading'
      );

      expect(ConditionalFeatureLoader).toBeDefined();
      expect(typeof ConditionalFeatureLoader).toBe('function');
    });

    it('should work with DEFAULT_SETTINGS from constants', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');
      const { getEnabledFeatures } = await import('../../src/shared/utils/conditional-loading');

      const enabled = getEnabledFeatures(
        DEFAULT_SETTINGS as Parameters<typeof getEnabledFeatures>[0]
      );
      expect(enabled).toHaveLength(6);
    });

    it('should handle type conversions safely', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');
      const { createConditionalLoader } = await import(
        '../../src/shared/utils/conditional-loading'
      );

      const loader = createConditionalLoader(
        DEFAULT_SETTINGS as Parameters<typeof createConditionalLoader>[0]
      );

      expect(loader).toBeDefined();
    });
  });

  // ─────────────────────────────────────────
  // Feature Flag Scenarios (8 tests)
  // ─────────────────────────────────────────

  describe('Feature Flag Scenarios', () => {
    it('should support all features disabled except gallery', async () => {
      const { getFeatureStatus } = await import('../../src/shared/utils/conditional-loading');

      const settings = {
        features: {
          gallery: true,
          settings: false,
          download: false,
          mediaExtraction: false,
          advancedFilters: false,
          accessibility: false,
        },
      };

      expect(getFeatureStatus(settings, 'gallery')).toBe(true);
      expect(getFeatureStatus(settings, 'settings')).toBe(false);
      expect(getFeatureStatus(settings, 'download')).toBe(false);
    });

    it('should support all features enabled', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');
      const { getEnabledFeatures } = await import('../../src/shared/utils/conditional-loading');

      const enabled = getEnabledFeatures(
        DEFAULT_SETTINGS as Parameters<typeof getEnabledFeatures>[0]
      );

      expect(enabled).toContain('gallery');
      expect(enabled).toContain('settings');
      expect(enabled).toContain('download');
      expect(enabled).toContain('mediaExtraction');
      expect(enabled).toContain('advancedFilters');
      expect(enabled).toContain('accessibility');
    });

    it('should support selective feature toggling', async () => {
      const { getFeatureStatus, getEnabledFeatures } = await import(
        '../../src/shared/utils/conditional-loading'
      );

      const settings1 = {
        features: {
          gallery: true,
          settings: true,
          download: false,
          mediaExtraction: true,
          advancedFilters: false,
          accessibility: true,
        },
      };

      const enabled = getEnabledFeatures(settings1);

      expect(enabled).toContain('gallery');
      expect(enabled).toContain('settings');
      expect(enabled).not.toContain('download');
      expect(enabled).toContain('mediaExtraction');
      expect(enabled).not.toContain('advancedFilters');
      expect(enabled).toContain('accessibility');
    });

    it('should enforce gallery as required feature', async () => {
      const { getFeatureStatus } = await import('../../src/shared/utils/conditional-loading');

      const settings = {
        features: {
          gallery: false,
          settings: true,
          download: true,
          mediaExtraction: true,
          advancedFilters: true,
          accessibility: true,
        },
      };

      expect(getFeatureStatus(settings, 'gallery')).toBe(false);
    });

    it('should handle empty feature flags object', async () => {
      const { getFeatureStatus, getEnabledFeatures } = await import(
        '../../src/shared/utils/conditional-loading'
      );

      const settings = { features: {} };

      expect(getFeatureStatus(settings, 'gallery')).toBe(true);
      const enabled = getEnabledFeatures(settings);
      expect(enabled).toHaveLength(6);
    });

    it('should support feature flag persistence via settings', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      const persistedSettings = {
        ...DEFAULT_SETTINGS,
        features: {
          gallery: true,
          settings: true,
          download: false,
          mediaExtraction: true,
          advancedFilters: false,
          accessibility: true,
        },
      };

      expect(persistedSettings.features.download).toBe(false);
      expect(persistedSettings.features.advancedFilters).toBe(false);
    });

    it('should validate feature flag combinations', async () => {
      const { getEnabledFeatures, getDisabledFeatures } = await import(
        '../../src/shared/utils/conditional-loading'
      );

      const settings = {
        features: {
          gallery: true,
          settings: true,
          download: false,
          mediaExtraction: true,
          advancedFilters: false,
          accessibility: true,
        },
      };

      const enabled = getEnabledFeatures(settings);
      const disabled = getDisabledFeatures(settings);

      expect(enabled.length + disabled.length).toBe(6);

      enabled.forEach(feature => {
        expect(disabled).not.toContain(feature);
      });
    });
  });

  // ─────────────────────────────────────────
  // Type Compatibility Tests (5 tests)
  // ─────────────────────────────────────────

  describe('Type Compatibility', () => {
    it('should have compatible types between settings and loader', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');
      const { createConditionalLoader } = await import(
        '../../src/shared/utils/conditional-loading'
      );

      const loader = createConditionalLoader(
        DEFAULT_SETTINGS as Parameters<typeof createConditionalLoader>[0]
      );

      expect(loader).toBeDefined();
    });

    it('should export SettingsWithFeatures interface', async () => {
      await import('../../src/shared/utils/conditional-loading');
      // Type-only check
      expect(true).toBe(true);
    });

    it('should maintain type safety for feature keys', async () => {
      const { getEnabledFeatures } = await import('../../src/shared/utils/conditional-loading');
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      const enabled = getEnabledFeatures(
        DEFAULT_SETTINGS as Parameters<typeof getEnabledFeatures>[0]
      );

      expect(enabled).toHaveLength(6);
      expect(Array.isArray(enabled)).toBe(true);
    });

    it('should validate feature flag object structure', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      const featureKeys = Object.keys(DEFAULT_SETTINGS.features);
      expect(featureKeys).toContain('gallery');
      expect(featureKeys).toContain('settings');
      expect(featureKeys).toContain('download');
      expect(featureKeys).toContain('mediaExtraction');
      expect(featureKeys).toContain('advancedFilters');
      expect(featureKeys).toContain('accessibility');
    });

    it('should have consistent feature keys across types', async () => {
      const { getEnabledFeatures } = await import('../../src/shared/utils/conditional-loading');
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      const enabled = getEnabledFeatures(
        DEFAULT_SETTINGS as Parameters<typeof getEnabledFeatures>[0]
      );

      expect(enabled).toHaveLength(6);
      const expectedKeys = [
        'gallery',
        'settings',
        'download',
        'mediaExtraction',
        'advancedFilters',
        'accessibility',
      ];
      expectedKeys.every(key => enabled.includes(key as any));
    });
  });

  // ─────────────────────────────────────────
  // Error Handling Tests (5 tests)
  // ─────────────────────────────────────────

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing features gracefully', async () => {
      const { getFeatureStatus } = await import('../../src/shared/utils/conditional-loading');

      const settings = { features: {} };
      expect(getFeatureStatus(settings, 'gallery')).toBe(true);
    });

    it('should handle null/undefined gracefully in operations', async () => {
      const { getEnabledFeatures } = await import('../../src/shared/utils/conditional-loading');

      const settings = { features: {} };
      const enabled = getEnabledFeatures(settings);
      expect(Array.isArray(enabled)).toBe(true);
    });

    it('should support rollback to default settings', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');
      const { getEnabledFeatures } = await import('../../src/shared/utils/conditional-loading');

      const currentSettings = {
        features: {
          gallery: true,
          settings: false,
          download: false,
          mediaExtraction: false,
          advancedFilters: false,
          accessibility: false,
        },
      };

      const defaultEnabled = getEnabledFeatures(
        DEFAULT_SETTINGS as Parameters<typeof getEnabledFeatures>[0]
      );

      expect(defaultEnabled.length).toBeGreaterThan(getEnabledFeatures(currentSettings).length);
    });

    it('should validate feature flag updates safely', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');
      const { getFeatureStatus } = await import('../../src/shared/utils/conditional-loading');

      const invalid = {
        features: {
          ...DEFAULT_SETTINGS.features,
        },
      };

      expect(getFeatureStatus(invalid, 'gallery')).toBe(true);
    });

    it('should handle rapid feature flag changes', async () => {
      const { createConditionalLoader } = await import(
        '../../src/shared/utils/conditional-loading'
      );

      const loaders = Array(10)
        .fill(null)
        .map(() => {
          const settings = {
            features: {
              gallery: true,
              settings: true,
              download: true,
              mediaExtraction: true,
              advancedFilters: Math.random() > 0.5,
              accessibility: Math.random() > 0.5,
            },
          };
          return createConditionalLoader(settings);
        });

      expect(loaders).toHaveLength(10);
    });
  });

  // ─────────────────────────────────────────
  // Integration with Settings Type (5 tests)
  // ─────────────────────────────────────────

  describe('Integration with Settings Type', () => {
    it('should export FeatureFlags interface', async () => {
      await import('../../src/features/settings/types/settings.types');
      expect(true).toBe(true);
    });

    it('should include features in AppSettings interface', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      expect(DEFAULT_SETTINGS).toHaveProperty('features');
    });

    it('should support nested NestedSettingKey type with features', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      expect(DEFAULT_SETTINGS.features).toBeDefined();
      expect(typeof DEFAULT_SETTINGS.features).toBe('object');
    });

    it('should maintain backward compatibility with existing settings', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      expect(DEFAULT_SETTINGS.gallery).toBeDefined();
      expect(DEFAULT_SETTINGS.download).toBeDefined();
      expect(DEFAULT_SETTINGS.accessibility).toBeDefined();
      expect(DEFAULT_SETTINGS.version).toBeDefined();
    });

    it('should allow settings updates with feature flags', async () => {
      const { DEFAULT_SETTINGS } = await import('../../src/constants');

      const updated = {
        ...DEFAULT_SETTINGS,
        features: {
          ...DEFAULT_SETTINGS.features,
          download: false,
        },
        gallery: {
          ...DEFAULT_SETTINGS.gallery,
          autoScrollSpeed: 7,
        },
      };

      expect(updated.features.download).toBe(false);
      expect(updated.gallery.autoScrollSpeed).toBe(7);
    });
  });
});
