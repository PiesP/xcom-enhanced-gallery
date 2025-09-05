/**
 * @fileoverview App Container Interface - 타입 안전한 의존성 주입 계약
 * @description CoreService 대체를 위한 타입 안전한 컨테이너 인터페이스
 */

import type { AppConfig } from '@/types';

/**
 * 로거 인터페이스
 */
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * 미디어 서비스 인터페이스 (기존 MediaService 기반)
 */
export interface IMediaService {
  // 필수 메서드들 (기존 MediaService에서 추출)
  extractMediaUrls(element: HTMLElement): Promise<string[]>;
  cleanup(): Promise<void>;
}

/**
 * 테마 서비스 인터페이스
 */
export interface IThemeService {
  getCurrentTheme(): 'light' | 'dark' | 'auto';
  setTheme(theme: 'light' | 'dark' | 'auto'): void;
  cleanup(): void;
}

/**
 * 토스트 서비스 인터페이스
 */
export interface IToastService {
  show(
    message: string,
    options?: { type?: 'info' | 'success' | 'warning' | 'error'; duration?: number }
  ): void;
  cleanup(): void;
}

/**
 * 비디오 제어 서비스 인터페이스
 */
export interface IVideoService {
  pauseAll(): void;
  resumeAll(): void;
  cleanup(): void;
}

/**
 * 설정 서비스 인터페이스 (Lazy)
 */
export interface ISettingsService {
  getSettings(): Record<string, unknown>;
  updateSettings(settings: Record<string, unknown>): void;
  get<T = unknown>(key: string): T;
  set<T = unknown>(key: string, value: T): Promise<void>;
  cleanup(): void;
}

/**
 * 갤러리 앱 인터페이스
 */
export interface IGalleryApp {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

/**
 * 메인 애플리케이션 컨테이너 인터페이스
 */
export interface AppContainer {
  /** 애플리케이션 설정 */
  config: AppConfig;

  /** 로거 인스턴스 */
  logger: ILogger;

  /** 핵심 서비스들 */
  services: {
    media: IMediaService;
    theme: IThemeService;
    toast: IToastService;
    video: IVideoService;
    settings?: ISettingsService; // lazy 로딩
  };

  /** Feature 팩토리들 */
  features: {
    loadGallery(): Promise<IGalleryApp>;
  };

  /** 리소스 정리 */
  dispose(): Promise<void>;
}

/**
 * 컨테이너 생성 옵션
 */
export interface CreateContainerOptions {
  config?: Partial<AppConfig>;
  enableLegacyAdapter?: boolean;
}

/**
 * 컨테이너 팩토리 함수 타입
 */
export type CreateAppContainer = (options?: CreateContainerOptions) => Promise<AppContainer>;
