/**
 * App Container Interface - Type-Safe DI Contracts
 *
 * Defines interface contracts for all container-managed services.
 * Each service has a clear responsibility, enabling proper composition
 * and testability.
 *
 * **Services**: ILogger, IMediaService, IThemeService, IVideoService,
 * ISettingsService, IGalleryApp
 *
 * NOTE: Architectural documentation file. Defines service contracts.
 * Only IGalleryApp is actively used; others serve as reference documentation.
 */

import type { AppConfig } from '@shared/types/app.types';

type ThemeMode = 'light' | 'dark' | 'auto';

export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface IMediaService {
  extractMediaUrls(element: HTMLElement): Promise<string[]>;
  cleanup(): Promise<void>;
}

export interface IThemeService {
  getCurrentTheme(): ThemeMode;
  setTheme(theme: ThemeMode): void;
  cleanup(): void;
}

export interface IVideoService {
  pauseAll(): void;
  resumeAll(): void;
  cleanup(): void;
}

export interface ISettingsService {
  getSettings(): Record<string, unknown>;
  updateSettings(settings: Record<string, unknown>): void;
  get<T = unknown>(key: string): T;
  set<T = unknown>(key: string, value: T): Promise<void>;
  cleanup(): void;
}

export interface IGalleryApp {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

export interface AppContainerServices {
  readonly media: IMediaService;
  readonly theme: IThemeService;
  readonly video: IVideoService;
  readonly settings?: ISettingsService;
}

export interface AppContainerFeatures {
  loadGallery(): Promise<IGalleryApp>;
}

export interface AppContainer {
  readonly config: AppConfig;
  readonly logger: ILogger;
  readonly services: AppContainerServices;
  readonly features: AppContainerFeatures;
  dispose(): Promise<void>;
}
