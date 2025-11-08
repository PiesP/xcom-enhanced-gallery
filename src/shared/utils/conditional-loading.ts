/**
 * @fileoverview Conditional Feature Loading Utilities
 * @description Phase 326.4: Feature-flag-based conditional feature loading
 *
 * This module dynamically loads only required features based on feature flags.
 * - Unused features are removed via tree-shaking from bundle
 * - Each feature can be independently loaded/unloaded
 *
 * @example
 * ```typescript
 * import { getFeatureStatus } from '@shared/utils/conditional-loading';
 *
 * const settings = { features: { download: true } };
 * if (getFeatureStatus(settings, 'download')) {
 *   // Enable download feature
 * }
 * ```
 */

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

/**
 * Feature flag key
 */
export type FeatureKey =
  | 'gallery'
  | 'settings'
  | 'download'
  | 'mediaExtraction'
  | 'advancedFilters'
  | 'accessibility';

/**
 * Feature load result
 */
export interface FeatureLoadResult {
  feature: string;
  enabled: boolean;
  loaded: boolean;
  error?: string;
  timestamp: number;
}

/**
 * Conditional loader configuration
 */
export interface ConditionalLoaderConfig {
  debug?: boolean;
  timeout?: number;
  continueOnError?: boolean;
}

/**
 * Feature load state
 */
export type FeatureLoadState = Record<string, FeatureLoadResult | undefined>;

/**
 * Settings object interface (minimal)
 */
export interface SettingsWithFeatures {
  features: Record<string, boolean>;
}

// ─────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────

/**
 * Check if a specific feature is enabled
 */
export function getFeatureStatus(settings: SettingsWithFeatures, feature: FeatureKey): boolean {
  return settings.features[feature] ?? true;
}

/**
 * Check if all features are enabled
 */
export function areAllFeaturesEnabled(
  settings: SettingsWithFeatures,
  features: FeatureKey[]
): boolean {
  return features.every(feature => getFeatureStatus(settings, feature));
}

/**
 * Get list of enabled features
 */
export function getEnabledFeatures(settings: SettingsWithFeatures): FeatureKey[] {
  const featureKeys: FeatureKey[] = [
    'gallery',
    'settings',
    'download',
    'mediaExtraction',
    'advancedFilters',
    'accessibility',
  ];
  return featureKeys.filter(key => getFeatureStatus(settings, key));
}

/**
 * Get list of disabled features
 */
export function getDisabledFeatures(settings: SettingsWithFeatures): FeatureKey[] {
  const featureKeys: FeatureKey[] = [
    'gallery',
    'settings',
    'download',
    'mediaExtraction',
    'advancedFilters',
    'accessibility',
  ];
  return featureKeys.filter(key => !getFeatureStatus(settings, key));
}

// ─────────────────────────────────────────
// Conditional Loader Class
// ─────────────────────────────────────────

/**
 * Conditional feature loader
 */
export class ConditionalFeatureLoader {
  private readonly settings: SettingsWithFeatures;
  private readonly config: Required<ConditionalLoaderConfig>;
  private loadState: FeatureLoadState = {};

  constructor(settings: SettingsWithFeatures, config: ConditionalLoaderConfig = {}) {
    this.settings = settings;
    this.config = {
      debug: config.debug ?? false,
      timeout: config.timeout ?? 10000,
      continueOnError: config.continueOnError ?? true,
    };
  }

  /**
   * Logging helper
   */
  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.info(`[ConditionalLoader] ${message}`, data ?? '');
    }
  }

  /**
   * Error handling
   */
  private handleError(error: Error, feature: string): FeatureLoadResult {
    const result: FeatureLoadResult = {
      feature,
      enabled: getFeatureStatus(this.settings, feature as FeatureKey),
      loaded: false,
      error: error.message,
      timestamp: Date.now(),
    };

    this.log(`Failed to load feature: ${String(feature)}`, result);

    if (!this.config.continueOnError) {
      throw error;
    }

    return result;
  }

  /**
   * Load only enabled services
   */
  async loadEnabledServices(): Promise<FeatureLoadState> {
    const enabledFeatures = getEnabledFeatures(this.settings);

    this.log('Starting conditional feature loading', {
      enabled: enabledFeatures,
      disabled: getDisabledFeatures(this.settings),
    });

    for (const feature of enabledFeatures) {
      try {
        await this.loadFeature(feature);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.loadState[feature] = this.handleError(err, feature);
      }
    }

    this.log('Feature loading complete', this.loadState);
    return this.loadState;
  }

  /**
   * Load a specific feature
   */
  private async loadFeature(feature: FeatureKey): Promise<void> {
    const enabled = getFeatureStatus(this.settings, feature);

    if (!enabled) {
      this.log(`Skipping disabled feature: ${String(feature)}`);
      return;
    }

    this.log(`Loading feature: ${String(feature)}`);

    // Phase 326.4: Dynamic loading logic per feature
    switch (feature) {
      case 'gallery': {
        await this.loadGalleryFeature();
        break;
      }

      case 'settings': {
        await this.loadSettingsFeature();
        break;
      }

      case 'download': {
        await this.loadDownloadFeature();
        break;
      }

      case 'mediaExtraction': {
        await this.loadMediaExtractionFeature();
        break;
      }

      case 'advancedFilters': {
        await this.loadAdvancedFiltersFeature();
        break;
      }

      case 'accessibility': {
        await this.loadAccessibilityFeature();
        break;
      }

      default: {
        const msg: never = feature;
        throw new Error(`Unknown feature: ${String(msg)}`);
      }
    }

    this.loadState[feature] = {
      feature,
      enabled: true,
      loaded: true,
      timestamp: Date.now(),
    };
  }

  /**
   * Load gallery feature (required)
   */
  private async loadGalleryFeature(): Promise<void> {
    await new Promise(resolve => {
      globalThis.setTimeout(resolve, 0);
    });
  }

  /**
   * Load settings feature
   */
  private async loadSettingsFeature(): Promise<void> {
    await new Promise(resolve => {
      globalThis.setTimeout(resolve, 0);
    });
  }

  /**
   * Load download feature
   */
  private async loadDownloadFeature(): Promise<void> {
    // Download feature is handled in bootstrap phase
    // Implement additional initialization here if needed
    await new Promise(resolve => {
      globalThis.setTimeout(resolve, 0);
    });
  }

  /**
   * Load media extraction feature
   */
  private async loadMediaExtractionFeature(): Promise<void> {
    // Media extraction feature is handled in bootstrap phase
    await new Promise(resolve => {
      globalThis.setTimeout(resolve, 0);
    });
  }

  /**
   * Load advanced filters feature (optional)
   */
  private async loadAdvancedFiltersFeature(): Promise<void> {
    await new Promise(resolve => {
      globalThis.setTimeout(resolve, 0);
    });
  }

  /**
   * Load accessibility feature
   */
  private async loadAccessibilityFeature(): Promise<void> {
    await new Promise(resolve => {
      globalThis.setTimeout(resolve, 0);
    });
  }

  /**
   * Unload a feature (memory cleanup)
   */
  async unloadFeature(feature: FeatureKey): Promise<void> {
    this.log(`Unloading feature: ${String(feature)}`);

    if (feature === 'gallery') {
      throw new Error('Cannot unload required feature: gallery');
    }

    this.loadState[feature] = undefined;
  }

  /**
   * Unload all features
   */
  async unloadAll(): Promise<void> {
    this.log('Unloading all features');
    const features: FeatureKey[] = [
      'gallery',
      'settings',
      'download',
      'mediaExtraction',
      'advancedFilters',
      'accessibility',
    ];
    for (const feature of features) {
      if (feature !== 'gallery') {
        await this.unloadFeature(feature);
      }
    }
  }

  /**
   * Get current load state
   */
  getLoadState(): FeatureLoadState {
    return { ...this.loadState };
  }

  /**
   * Check if a feature is loaded
   */
  isLoaded(feature: FeatureKey): boolean {
    return this.loadState[feature]?.loaded ?? false;
  }
}

/**
 * Conditional loader factory function
 */
export function createConditionalLoader(
  settings: SettingsWithFeatures,
  config?: ConditionalLoaderConfig
): ConditionalFeatureLoader {
  return new ConditionalFeatureLoader(settings, config);
}
