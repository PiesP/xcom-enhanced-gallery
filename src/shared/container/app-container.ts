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

import type { AppConfig } from '@shared/types/app.types';

/**
 * Theme type literals supported by the application
 * - 'light': Light theme mode
 * - 'dark': Dark theme mode
 * - 'auto': System preference-based theme
 */
type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Logging service interface - diagnostic output routing
 *
 * Supports severity levels: debug, info, warn, error.
 * Enables filtering and selective output based on environment.
 *
 * @example
 * ```typescript
 * logger.debug('Initialization started', { service: 'theme' });
 * logger.error('Failed to load settings', error);
 * ```
 */
interface ILogger {
  /**
   * Debug-level logging for development diagnostics
   * @param message - Primary log message
   * @param args - Additional context data
   */
  debug(message: string, ...args: unknown[]): void;

  /**
   * Info-level logging for general information
   * @param message - Primary log message
   * @param args - Additional context data
   */
  info(message: string, ...args: unknown[]): void;

  /**
   * Warning-level logging for potential issues
   * @param message - Primary log message
   * @param args - Additional context data
   */
  warn(message: string, ...args: unknown[]): void;

  /**
   * Error-level logging for failures and exceptions
   * @param message - Primary log message
   * @param args - Error objects and context data
   */
  error(message: string, ...args: unknown[]): void;
}

/**
 * Media extraction service interface
 * Handles DOM-based media discovery and URL extraction
 *
 * @example
 * ```typescript
 * const urls = await mediaService.extractMediaUrls(tweetElement);
 * ```
 */
interface IMediaService {
  /**
   * Extract media URLs from a DOM element
   * @param element - Target HTML element to scan
   * @returns Promise resolving to array of extracted media URLs
   */
  extractMediaUrls(element: HTMLElement): Promise<string[]>;

  /**
   * Cleanup service resources and event listeners
   * @returns Promise resolving when cleanup is complete
   */
  cleanup(): Promise<void>;
}

/**
 * Theme service interface - UI theme management
 *
 * Controls application visual theme mode (light/dark/auto).
 * Handles system preference detection and theme switching.
 *
 * @example
 * ```typescript
 * themeService.setTheme('dark');
 * const current = themeService.getCurrentTheme();
 * ```
 */
interface IThemeService {
  /**
   * Get the current active theme mode
   * @returns Current theme setting
   */
  getCurrentTheme(): ThemeMode;

  /**
   * Set the application theme mode
   * @param theme - Target theme mode to apply
   */
  setTheme(theme: ThemeMode): void;

  /**
   * Cleanup theme observers and listeners
   */
  cleanup(): void;
}

/**
 * Video control service interface
 *
 * Manages video playback state across the application.
 * Supports bulk pause/resume operations.
 *
 * @example
 * ```typescript
 * videoService.pauseAll(); // Pause all active videos
 * videoService.resumeAll(); // Resume all videos
 * ```
 */
interface IVideoService {
  /**
   * Pause all active video elements
   */
  pauseAll(): void;

  /**
   * Resume all paused video elements
   */
  resumeAll(): void;

  /**
   * Cleanup video references and listeners
   */
  cleanup(): void;
}

/**
 * Settings service interface - application configuration storage
 *
 * Handles persistent settings storage, retrieval, and updates.
 * Supports both individual key operations and bulk updates.
 *
 * @example
 * ```typescript
 * const value = settingsService.get<string>('theme');
 * await settingsService.set('theme', 'dark');
 * const all = settingsService.getSettings();
 * ```
 */
interface ISettingsService {
  /**
   * Retrieve all settings as a record
   * @returns Complete settings object
   */
  getSettings(): Record<string, unknown>;

  /**
   * Bulk update multiple settings
   * @param settings - Settings object with values to update
   */
  updateSettings(settings: Record<string, unknown>): void;

  /**
   * Get a single setting value by key
   * @typeParam T - Expected type of the setting value
   * @param key - Setting key identifier
   * @returns Setting value or undefined if not found
   */
  get<T = unknown>(key: string): T;

  /**
   * Set a single setting value by key
   * @typeParam T - Type of the setting value
   * @param key - Setting key identifier
   * @param value - Value to store
   * @returns Promise resolving when setting is saved
   */
  set<T = unknown>(key: string, value: T): Promise<void>;

  /**
   * Cleanup settings observers and pending operations
   */
  cleanup(): void;
}

/**
 * Gallery application interface
 *
 * Controls gallery feature lifecycle and initialization.
 * Handles rendering, state management, and cleanup.
 *
 * @example
 * ```typescript
 * await galleryApp.initialize();
 * // ... use gallery
 * await galleryApp.cleanup();
 * ```
 */
export interface IGalleryApp {
  /**
   * Initialize gallery components and state
   * @returns Promise resolving when initialization is complete
   */
  initialize(): Promise<void>;

  /**
   * Cleanup gallery resources and unmount components
   * @returns Promise resolving when cleanup is complete
   */
  cleanup(): Promise<void>;
}

/**
 * Core services group interface
 * Aggregates all required application services
 */
interface AppContainerServices {
  /** Media extraction service instance */
  readonly media: IMediaService;

  /** Theme management service instance */
  readonly theme: IThemeService;

  /** Video control service instance */
  readonly video: IVideoService;

  /** Settings service instance (lazy-loaded) */
  readonly settings?: ISettingsService;
}

/**
 * Feature factories group interface
 * Provides async factory functions for feature loading
 */
interface AppContainerFeatures {
  /**
   * Load gallery feature instance
   * @returns Promise resolving to initialized gallery app
   */
  loadGallery(): Promise<IGalleryApp>;
}

/**
 * Main application container interface
 * Aggregates all services, configuration, and feature factories
 *
 * Follows dependency injection pattern with service grouping.
 * Provides centralized access to all application-level dependencies.
 *
 * @example
 * ```typescript
 * const container = await createAppContainer();
 * container.logger.info('App started');
 * const gallery = await container.features.loadGallery();
 * await container.dispose();
 * ```
 */
interface AppContainer {
  /** Application configuration */
  readonly config: AppConfig;

  /** Logger service instance */
  readonly logger: ILogger;

  /** Core service instances */
  readonly services: AppContainerServices;

  /** Feature factory functions */
  readonly features: AppContainerFeatures;

  /**
   * Dispose all resources and cleanup services
   * @returns Promise resolving when all resources are released
   */
  dispose(): Promise<void>;
}

/**
 * Container creation options - customizable configuration
 *
 * Allows partial overrides of default application config
 * when creating a new container instance.
 *
 * @example
 * ```typescript
 * const container = await createAppContainer({
 *   config: { debug: true }
 * });
 * ```
 */
interface CreateContainerOptions {
  /** Partial application configuration overrides */
  readonly config?: Partial<AppConfig>;
}

/**
 * Factory function type for creating application container
 *
 * Creates a fully initialized container with optional custom configuration.
 * Async to support initialization of services that require async setup.
 *
 * @param options - Optional container creation configuration
 * @returns Promise resolving to initialized container instance
 *
 * @example
 * ```typescript
 * const createContainer: CreateAppContainer = async (options) => {
 *   // Implementation
 * };
 * ```
 */
type CreateAppContainer = (options?: CreateContainerOptions) => Promise<AppContainer>;

// NOTE: This is intentionally unused for now (documentation/reference type).
// Biome treats underscore-prefixed declarations as intentionally unused.
type _CreateAppContainer = CreateAppContainer;
