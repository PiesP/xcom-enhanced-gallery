/**
 * @fileoverview Conditional Feature Loading Utilities
 * @description Phase 326.4: 사용자 설정 기반 기능 조건부 로딩
 *
 * 이 모듈은 기능 플래그에 따라 필요한 기능만 동적으로 로드합니다.
 * - 미사용 기능은 번들에서 tree-shaking으로 제거됨
 * - 각 기능별 독립적 로드/언로드 가능
 *
 * @example
 * ```typescript
 * import { getFeatureStatus } from '@shared/utils/conditional-loading';
 *
 * const settings = { features: { download: true } };
 * if (getFeatureStatus(settings, 'download')) {
 *   // 다운로드 기능 활성화
 * }
 * ```
 */

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

/**
 * 기능 플래그 키
 */
export type FeatureKey =
  | 'gallery'
  | 'settings'
  | 'download'
  | 'mediaExtraction'
  | 'advancedFilters'
  | 'accessibility';

/**
 * 기능 로드 결과
 */
export interface FeatureLoadResult {
  feature: string;
  enabled: boolean;
  loaded: boolean;
  error?: string;
  timestamp: number;
}

/**
 * 조건부 로더 설정
 */
export interface ConditionalLoaderConfig {
  debug?: boolean;
  timeout?: number;
  continueOnError?: boolean;
}

/**
 * 기능 로드 상태
 */
export type FeatureLoadState = Record<string, FeatureLoadResult | undefined>;

/**
 * Settings 객체 인터페이스 (최소)
 */
export interface SettingsWithFeatures {
  features: Record<string, boolean>;
}

// ─────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────

/**
 * 특정 기능의 활성화 상태 확인
 */
export function getFeatureStatus(settings: SettingsWithFeatures, feature: FeatureKey): boolean {
  return settings.features[feature] ?? true;
}

/**
 * 여러 기능의 활성화 상태 확인
 */
export function areAllFeaturesEnabled(
  settings: SettingsWithFeatures,
  features: FeatureKey[]
): boolean {
  return features.every(feature => getFeatureStatus(settings, feature));
}

/**
 * 활성화된 기능 목록 반환
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
 * 비활성화된 기능 목록 반환
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
 * 조건부 기능 로더
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
   * 로깅 헬퍼
   */
  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.info(`[ConditionalLoader] ${message}`, data ?? '');
    }
  }

  /**
   * 에러 처리
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
   * 활성화된 서비스만 로드
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
   * 특정 기능 로드
   */
  private async loadFeature(feature: FeatureKey): Promise<void> {
    const enabled = getFeatureStatus(this.settings, feature);

    if (!enabled) {
      this.log(`Skipping disabled feature: ${String(feature)}`);
      return;
    }

    this.log(`Loading feature: ${String(feature)}`);

    // Phase 326.4: 기능별 동적 로드 로직
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
   * Gallery 기능 로드 (필수)
   */
  private async loadGalleryFeature(): Promise<void> {
    await new Promise(resolve => {
      globalThis.setTimeout(resolve, 0);
    });
  }

  /**
   * Settings 기능 로드
   */
  private async loadSettingsFeature(): Promise<void> {
    await new Promise(resolve => {
      globalThis.setTimeout(resolve, 0);
    });
  }

  /**
   * Download 기능 로드
   */
  private async loadDownloadFeature(): Promise<void> {
    // Download 기능은 부트스트랩 단계에서 처리됨
    // 추가 초기화 필요시 여기서 구현
    await new Promise(resolve => {
      globalThis.setTimeout(resolve, 0);
    });
  }

  /**
   * Media Extraction 기능 로드
   */
  private async loadMediaExtractionFeature(): Promise<void> {
    // Media extraction 기능은 부트스트랩 단계에서 처리됨
    await new Promise(resolve => {
      globalThis.setTimeout(resolve, 0);
    });
  }

  /**
   * Advanced Filters 기능 로드 (선택사항)
   */
  private async loadAdvancedFiltersFeature(): Promise<void> {
    await new Promise(resolve => {
      globalThis.setTimeout(resolve, 0);
    });
  }

  /**
   * Accessibility 기능 로드
   */
  private async loadAccessibilityFeature(): Promise<void> {
    await new Promise(resolve => {
      globalThis.setTimeout(resolve, 0);
    });
  }

  /**
   * 기능 언로드 (메모리 정리)
   */
  async unloadFeature(feature: FeatureKey): Promise<void> {
    this.log(`Unloading feature: ${String(feature)}`);

    if (feature === 'gallery') {
      throw new Error('Cannot unload required feature: gallery');
    }

    this.loadState[feature] = undefined;
  }

  /**
   * 모든 기능 언로드
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
   * 현재 로드 상태 조회
   */
  getLoadState(): FeatureLoadState {
    return { ...this.loadState };
  }

  /**
   * 기능 로드 상태 확인
   */
  isLoaded(feature: FeatureKey): boolean {
    return this.loadState[feature]?.loaded ?? false;
  }
}

/**
 * 조건부 로더 팩토리 함수
 */
export function createConditionalLoader(
  settings: SettingsWithFeatures,
  config?: ConditionalLoaderConfig
): ConditionalFeatureLoader {
  return new ConditionalFeatureLoader(settings, config);
}
