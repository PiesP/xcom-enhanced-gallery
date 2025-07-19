/**
 * @fileoverview 애플리케이션 통합 설정 관리자
 * @version 1.0.0
 *
 * 모든 설정을 중앙에서 관리하여 분산된 설정 관리 문제를 해결합니다.
 */

import { Singleton } from '@core/patterns/Singleton';
import { logger } from '@core/logging/logger';

/**
 * 메모리 관련 설정
 */
export interface MemoryConfig {
  warningThresholdMB: number;
  criticalThresholdMB: number;
  gcTriggerThresholdMB: number;
  enableAutoCleanup: boolean;
}

/**
 * 이벤트 관련 설정
 */
export interface EventConfig {
  debounceDelay: number;
  enableKeyboard: boolean;
  enableGestureDetection: boolean;
  debug: boolean;
}

/**
 * 미디어 관련 설정
 */
export interface MediaConfig {
  maxRetries: number;
  retryDelay: number;
  enableFallback: boolean;
  supportedTypes: ('image' | 'video')[];
}

/**
 * 갤러리 관련 설정
 */
export interface GalleryConfig {
  animationDuration: number;
  enableInfiniteScroll: boolean;
  preloadImages: boolean;
  maxZoomLevel: number;
}

/**
 * 통합 설정 타입
 */
export interface AppConfiguration {
  memory: MemoryConfig;
  events: EventConfig;
  media: MediaConfig;
  gallery: GalleryConfig;
}

/**
 * 기본 설정 값
 */
const DEFAULT_CONFIG: AppConfiguration = {
  memory: {
    warningThresholdMB: 50,
    criticalThresholdMB: 100,
    gcTriggerThresholdMB: 80,
    enableAutoCleanup: true,
  },
  events: {
    debounceDelay: 150,
    enableKeyboard: true,
    enableGestureDetection: true,
    debug: false,
  },
  media: {
    maxRetries: 3,
    retryDelay: 1000,
    enableFallback: true,
    supportedTypes: ['image', 'video'],
  },
  gallery: {
    animationDuration: 300,
    enableInfiniteScroll: true,
    preloadImages: true,
    maxZoomLevel: 5,
  },
};

/**
 * 애플리케이션 통합 설정 관리자
 */
export class AppConfig extends Singleton<AppConfig> {
  private config: AppConfiguration;
  private readonly listeners: Set<(config: AppConfiguration) => void> = new Set();

  protected constructor() {
    super();
    this.config = this.loadConfig();
  }

  /**
   * 설정 로드
   */
  private loadConfig(): AppConfiguration {
    try {
      // 로컬 스토리지에서 설정 로드 시도
      const stored = localStorage.getItem('xeg-config');
      if (stored) {
        const parsed = JSON.parse(stored);
        return this.mergeWithDefaults(parsed);
      }
    } catch (error) {
      logger.warn('[AppConfig] Failed to load stored config, using defaults:', error);
    }

    return { ...DEFAULT_CONFIG };
  }

  /**
   * 기본값과 병합
   */
  private mergeWithDefaults(userConfig: Partial<AppConfiguration>): AppConfiguration {
    return {
      memory: { ...DEFAULT_CONFIG.memory, ...userConfig.memory },
      events: { ...DEFAULT_CONFIG.events, ...userConfig.events },
      media: { ...DEFAULT_CONFIG.media, ...userConfig.media },
      gallery: { ...DEFAULT_CONFIG.gallery, ...userConfig.gallery },
    };
  }

  /**
   * 전체 설정 조회
   */
  public getConfig(): AppConfiguration {
    return { ...this.config };
  }

  /**
   * 메모리 설정 조회
   */
  public getMemoryConfig(): MemoryConfig {
    return { ...this.config.memory };
  }

  /**
   * 이벤트 설정 조회
   */
  public getEventConfig(): EventConfig {
    return { ...this.config.events };
  }

  /**
   * 미디어 설정 조회
   */
  public getMediaConfig(): MediaConfig {
    return { ...this.config.media };
  }

  /**
   * 갤러리 설정 조회
   */
  public getGalleryConfig(): GalleryConfig {
    return { ...this.config.gallery };
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(updates: Partial<AppConfiguration>): void {
    this.config = this.mergeWithDefaults(updates);

    try {
      localStorage.setItem('xeg-config', JSON.stringify(this.config));
      logger.debug('[AppConfig] Configuration updated and saved');
    } catch (error) {
      logger.warn('[AppConfig] Failed to save configuration:', error);
    }

    // 변경 사항 알림
    this.notifyListeners();
  }

  /**
   * 특정 섹션 업데이트
   */
  public updateMemoryConfig(updates: Partial<MemoryConfig>): void {
    this.updateConfig({ memory: { ...this.config.memory, ...updates } });
  }

  public updateEventConfig(updates: Partial<EventConfig>): void {
    this.updateConfig({ events: { ...this.config.events, ...updates } });
  }

  public updateMediaConfig(updates: Partial<MediaConfig>): void {
    this.updateConfig({ media: { ...this.config.media, ...updates } });
  }

  public updateGalleryConfig(updates: Partial<GalleryConfig>): void {
    this.updateConfig({ gallery: { ...this.config.gallery, ...updates } });
  }

  /**
   * 설정 변경 감지자 등록
   */
  public onConfigChange(listener: (config: AppConfiguration) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 리스너들에게 변경 사항 알림
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getConfig());
      } catch (error) {
        logger.error('[AppConfig] Listener error:', error);
      }
    }
  }

  /**
   * 설정 초기화
   */
  public resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };

    try {
      localStorage.removeItem('xeg-config');
      logger.info('[AppConfig] Configuration reset to defaults');
    } catch (error) {
      logger.warn('[AppConfig] Failed to clear stored configuration:', error);
    }

    this.notifyListeners();
  }

  /**
   * 설정 유효성 검증
   */
  public validateConfig(): boolean {
    try {
      const config = this.config;

      // 메모리 설정 검증
      if (
        config.memory.warningThresholdMB <= 0 ||
        config.memory.criticalThresholdMB <= config.memory.warningThresholdMB
      ) {
        return false;
      }

      // 이벤트 설정 검증
      if (config.events.debounceDelay < 0) {
        return false;
      }

      // 미디어 설정 검증
      if (config.media.maxRetries < 0 || config.media.retryDelay < 0) {
        return false;
      }

      // 갤러리 설정 검증
      if (config.gallery.animationDuration < 0 || config.gallery.maxZoomLevel <= 0) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[AppConfig] Configuration validation failed:', error);
      return false;
    }
  }

  /**
   * 디버그 정보 조회
   */
  public getDebugInfo(): {
    config: AppConfiguration;
    isValid: boolean;
    listenerCount: number;
  } {
    return {
      config: this.getConfig(),
      isValid: this.validateConfig(),
      listenerCount: this.listeners.size,
    };
  }
}

// 싱글톤 인스턴스 export
// @ts-expect-error Protected constructor compatibility
export const appConfig = AppConfig.getInstance();

// 편의 함수들
export function getMemoryConfig(): MemoryConfig {
  return appConfig.getMemoryConfig();
}

export function getEventConfig(): EventConfig {
  return appConfig.getEventConfig();
}

export function getMediaConfig(): MediaConfig {
  return appConfig.getMediaConfig();
}

export function getGalleryConfig(): GalleryConfig {
  return appConfig.getGalleryConfig();
}
