/**
 * @fileoverview App Container Interface - Type-Safe DI Contracts
 * @version 1.0.0 - Service interface definitions
 * @phase 402: Enhanced documentation for container architecture
 *
 * Defines complete interface contracts for all services managed by the container.
 * Establishes public APIs that all service implementations must conform to.
 *
 * **Services Defined**:
 * - ILogger: Diagnostic logging (debug, info, warn, error)
 * - IMediaService: Media extraction from DOM
 * - IThemeService: Theme management (light, dark, auto)
 * - IVideoService: Video playback control
 * - ISettingsService: Application settings storage
 * - IGalleryApp: Gallery feature lifecycle
 *
 * **Container Aggregation**: AppContainer groups all services
 * **Factory Pattern**: CreateAppContainer creates container instances
 *
 * **Design Principles**:
 * - Interface segregation: Each service focused
 * - Type safety: No 'any' types, full TS validation
 * - Composability: Services combined in AppContainer
 * - Resource management: Explicit cleanup/dispose
 *
 * @related [Service Accessors](./service-accessors.ts)
 */

import type { AppConfig } from "@shared/types";

/**
 * Logging service interface - diagnostic output routing
 *
 * Supports severity levels: debug, info, warn, error
 * Enables filtering and selective output based on environment
 */
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Media extraction service interface
 * Handles DOM-based media discovery and URL extraction
 */
export interface IMediaService {
  // Required methods (extracted from MediaService)
  extractMediaUrls(element: HTMLElement): Promise<string[]>;
  cleanup(): Promise<void>;
}

/**
 * Theme service interface
 */
export interface IThemeService {
  getCurrentTheme(): "light" | "dark" | "auto";
  setTheme(theme: "light" | "dark" | "auto"): void;
  cleanup(): void;
}

/**
 * Video control service interface
 */
export interface IVideoService {
  pauseAll(): void;
  resumeAll(): void;
  cleanup(): void;
}

/**
 * Settings service interface - application configuration storage
 * Handles both get/set operations and bulk updates
 */
export interface ISettingsService {
  getSettings(): Record<string, unknown>;
  updateSettings(settings: Record<string, unknown>): void;
  get<T = unknown>(key: string): T;
  set<T = unknown>(key: string, value: T): Promise<void>;
  cleanup(): void;
}

/**
 * Gallery app interface
 */
export interface IGalleryApp {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

/**
 * Main application container interface
 * Aggregates all services, configuration, and feature factories
 *
 * Properties:
 * - config: Application configuration
 * - logger: Logging service instance
 * - services: Grouped service instances
 * - features: Feature factory functions
 * - dispose(): Resource cleanup method
 */
export interface AppContainer {
  /** Application configuration */
  config: AppConfig;

  /** Logger instance */
  logger: ILogger;

  /** Core services */
  services: {
    media: IMediaService;
    theme: IThemeService;
    video: IVideoService;
    settings?: ISettingsService; // lazy loading
  };

  /** Feature factories */
  features: {
    loadGallery(): Promise<IGalleryApp>;
  };

  /** Resource cleanup */
  dispose(): Promise<void>;
}

/**
 * Container creation options - customizable configuration
 * Allows partial overrides of default application config
 */
export interface CreateContainerOptions {
  config?: Partial<AppConfig>;
}

/**
 * Factory function type for creating application container
 * Creates container with optional custom configuration
 * Async to support initialization of services
 */
export type CreateAppContainer = (
  options?: CreateContainerOptions,
) => Promise<AppContainer>;
