import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const FEATURE_KEYS = ['gallery', 'settings', 'download', 'mediaExtraction', 'accessibility'];

describe('bootstrap feature registration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('exposes the expected feature flags inside DEFAULT_SETTINGS', async () => {
    const { DEFAULT_SETTINGS } = await import('../../src/constants');
    expect(Object.keys(DEFAULT_SETTINGS.features)).toEqual(FEATURE_KEYS);
    FEATURE_KEYS.forEach(key => {
      expect(DEFAULT_SETTINGS.features[key as keyof typeof DEFAULT_SETTINGS.features]).toBe(true);
    });
  });

  it('exports modernized feature helpers', async () => {
    const module = await import('../../src/shared/utils/conditional-loading');
    expect(typeof module.getFeatureStatus).toBe('function');
    expect(typeof module.getEnabledFeatures).toBe('function');
    expect(typeof module.resolveFeatureStates).toBe('function');
    expect(module).not.toHaveProperty('createConditionalLoader');
  });

  it('normalizes stored feature state even when partial data provided', async () => {
    const { resolveFeatureStates } = await import('../../src/shared/utils/conditional-loading');
    const normalized = resolveFeatureStates({
      features: {
        gallery: false,
        mediaExtraction: false,
      },
    });

    expect(normalized.gallery).toBe(false);
    expect(normalized.mediaExtraction).toBe(false);
    expect(normalized.accessibility).toBe(true);
  });

  it('skips media extraction registration when feature disabled in storage', async () => {
    const getMock = vi.fn().mockResolvedValue({
      features: {
        gallery: true,
        settings: true,
        download: true,
        mediaExtraction: false,
        accessibility: true,
      },
    });

    const registerSpy = vi.fn();

    vi.doMock('@shared/services/persistent-storage', () => ({
      getPersistentStorage: () => ({ get: getMock }),
    }));
    vi.doMock('@shared/container', async () => {
      const actual = await vi.importActual<typeof import('@shared/container')>('@shared/container');
      return {
        ...actual,
        registerTwitterTokenExtractor: registerSpy,
      };
    });

    const { registerFeatureServicesLazy } = await import('../../src/bootstrap/features');
    await registerFeatureServicesLazy();

    expect(registerSpy).not.toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledWith('xeg-app-settings');
  });

  it('registers TwitterTokenExtractor when feature is enabled (default)', async () => {
    const getMock = vi.fn().mockResolvedValue(undefined);
    const registerSpy = vi.fn();

    vi.doMock('@shared/services/persistent-storage', () => ({
      getPersistentStorage: () => ({ get: getMock }),
    }));
    vi.doMock('@shared/container', async () => {
      const actual = await vi.importActual<typeof import('@shared/container')>('@shared/container');
      return {
        ...actual,
        registerTwitterTokenExtractor: registerSpy,
      };
    });

    const { registerFeatureServicesLazy } = await import('../../src/bootstrap/features');
    await registerFeatureServicesLazy();

    expect(registerSpy).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith('xeg-app-settings');
  });

  it('retains feature flag typings within AppSettings', async () => {
    const { DEFAULT_SETTINGS } = await import('../../src/constants');
    await import('../../src/features/settings/types/settings.types');
    expect(DEFAULT_SETTINGS.features.gallery).toBe(true);
  });
});
