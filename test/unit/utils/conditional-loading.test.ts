/**
 * @fileoverview Unit tests for feature flag utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  FEATURE_KEYS,
  areAllFeaturesEnabled,
  getDisabledFeatures,
  getEnabledFeatures,
  getFeatureStatus,
  resolveFeatureStates,
  type FeatureKey,
  type SettingsWithFeatures,
} from '../../../src/shared/utils/conditional-loading';

const fullFlags: SettingsWithFeatures = {
  features: {
    gallery: true,
    settings: true,
    download: true,
    mediaExtraction: true,
    accessibility: true,
  },
};

const partialFlags: SettingsWithFeatures = {
  features: {
    gallery: true,
    settings: false,
    download: false,
    mediaExtraction: true,
    accessibility: true,
  },
};

describe('shared/utils/conditional-loading', () => {
  describe('getFeatureStatus', () => {
    it('returns stored state when explicitly set', () => {
      expect(getFeatureStatus(fullFlags, 'download')).toBe(true);
      expect(getFeatureStatus(partialFlags, 'download')).toBe(false);
    });

    it('falls back to defaults when key missing', () => {
      const settings: SettingsWithFeatures = { features: {} };
      FEATURE_KEYS.forEach(key => {
        expect(getFeatureStatus(settings, key)).toBe(true);
      });
    });
  });

  describe('getEnabledFeatures / getDisabledFeatures', () => {
    it('returns deterministic ordering', () => {
      const first = getEnabledFeatures(fullFlags);
      const second = getEnabledFeatures(fullFlags);
      expect(first).toEqual(second);
      expect(first).toEqual(FEATURE_KEYS.slice());
    });

    it('splits flags correctly for partial settings', () => {
      expect(getEnabledFeatures(partialFlags)).toEqual([
        'gallery',
        'mediaExtraction',
        'accessibility',
      ]);
      expect(getDisabledFeatures(partialFlags)).toEqual(['settings', 'download']);
    });
  });

  describe('areAllFeaturesEnabled', () => {
    it('returns true when every requested flag is enabled', () => {
      expect(areAllFeaturesEnabled(fullFlags, ['gallery', 'download'])).toBe(true);
    });

    it('returns false if any requested flag is disabled', () => {
      expect(areAllFeaturesEnabled(partialFlags, ['gallery', 'download'])).toBe(false);
    });

    it('handles empty input gracefully', () => {
      expect(areAllFeaturesEnabled(partialFlags, [])).toBe(true);
    });
  });

  describe('resolveFeatureStates', () => {
    it('normalizes unknown data', () => {
      const settings: SettingsWithFeatures = {
        features: {
          gallery: false,
          mediaExtraction: false,
        },
      };

      const normalized = resolveFeatureStates(settings);
      const disabledKeys = Object.entries(normalized)
        .filter(([, enabled]) => !enabled)
        .map(([key]) => key as FeatureKey);

      expect(disabledKeys).toEqual(['gallery', 'mediaExtraction']);
      expect(normalized.accessibility).toBe(true);
    });
  });
});
