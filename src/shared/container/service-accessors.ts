/**
 * @fileoverview Service Accessors - Type-Safe Named Service Getters
 * @version 1.0.0 - Named accessor functions for service retrieval
 * @phase 402: Enhanced documentation for accessor pattern
 *
 * Provides type-safe named getter functions that hide SERVICE_KEYS from
 * features layer. All access routes through CoreServiceRegistry caching.
 *
 * **Design Pattern**: Named accessor pattern for type safety + convenience
 * **Architecture Role**: Feature-facing API layer (public interface)
 * **Performance**: Leverages CoreServiceRegistry caching (no repeated lookups)
 * **Recommended Usage**: Features should import and call named getters
 *
 * **Access Patterns**:
 * - Required services: `getServiceName()` - throws if missing
 * - Optional services: `tryGetServiceName()` - returns null if missing
 * - Internal registry: Use CoreServiceRegistry directly (bridge pattern)
 *
 * **Layer Integration**:
 * Features Layer
 *   ↓ (imports from)
 * Service Accessors (named getters, this file)
 *   ↓ (delegates to)
 * CoreServiceRegistry (caching layer)
 *   ↓ (retrieves from)
 * CoreService (singleton)
 *   ↓ (provides)
 * Service Implementations
 *
 * @related [CoreServiceRegistry](./core-service-registry.ts), [Service Bridge](./service-bridge.ts)
 */
import type { FilenameService } from '../services/file-naming';
import type { ThemeService } from '../services/theme-service';
import type { ToastManager } from '../services/unified-toast-manager';
import type { GalleryRenderer } from '../interfaces/gallery.interfaces';

// Phase 237: Core Base 서비스들을 static import로 변경 (require 제거)
// Phase 414: AnimationService 제거 (optional feature)
import { themeService } from '../services/theme-service';
import { languageService } from '../services/language-service';

import { CoreServiceRegistry } from './core-service-registry';
import { bridgeRegisterBaseService, bridgeInitializeAllBaseServices } from './service-bridge';
import { SERVICE_KEYS } from '../../constants';

// ============================================================================
// Required Service Getters
// ============================================================================
// These throw if service not found. Use for guaranteed services.

/**
 * Get toast manager for user notifications.
 *
 * @returns ToastManager for displaying UI notifications
 * @throws CoreService throws if toast service not registered
 *
 * @example
 * const toast = getToastManager();
 * toast.show({ message: 'Operation complete', type: 'success' });
 */
export function getToastManager(): ToastManager {
  return CoreServiceRegistry.get<ToastManager>(SERVICE_KEYS.TOAST);
}

/**
 * Get theme service for UI styling.
 *
 * @returns ThemeService for theme management
 * @throws CoreService throws if theme service not registered
 */
export function getThemeService(): ThemeService {
  return CoreServiceRegistry.get<ThemeService>(SERVICE_KEYS.THEME);
}

/**
 * Get media filename service for filename generation.
 *
 * @returns FilenameService for media file naming
 * @throws CoreService throws if filename service not registered
 */
export function getMediaFilenameService(): FilenameService {
  return CoreServiceRegistry.get<FilenameService>(SERVICE_KEYS.MEDIA_FILENAME);
}

/**
 * Get media service (untyped to avoid circular dependency).
 *
 * @returns Media service instance (unknown type due to cyclic import)
 * @throws CoreService throws if media service not registered
 */
export function getMediaServiceFromContainer(): unknown {
  return CoreServiceRegistry.get<unknown>(SERVICE_KEYS.MEDIA_SERVICE);
}

/**
 * Get gallery renderer for media display.
 *
 * @returns GalleryRenderer for rendering gallery UI
 * @throws CoreService throws if gallery renderer not registered
 */
export function getGalleryRenderer(): GalleryRenderer {
  return CoreServiceRegistry.get<GalleryRenderer>(SERVICE_KEYS.GALLERY_RENDERER);
}

// ============================================================================
// Service Registration Helpers
// ============================================================================
// Helper functions for registering services in the registry.

/**
 * Register gallery renderer in service registry.
 *
 * @param renderer - GalleryRenderer instance to register
 *
 * @example
 * const renderer = new GalleryRenderer(config);
 * registerGalleryRenderer(renderer);
 */
export function registerGalleryRenderer(renderer: unknown): void {
  CoreServiceRegistry.register(SERVICE_KEYS.GALLERY_RENDERER, renderer);
}

/**
 * Register settings manager in service registry.
 *
 * @param settings - Settings manager instance to register
 */
export function registerSettingsManager(settings: unknown): void {
  CoreServiceRegistry.register(SERVICE_KEYS.SETTINGS, settings);
}

/**
 * Register Twitter token extractor in service registry.
 *
 * @param instance - Token extractor instance to register
 */
export function registerTwitterTokenExtractor(instance: unknown): void {
  CoreServiceRegistry.register(SERVICE_KEYS.TWITTER_TOKEN_EXTRACTOR, instance);
}

// ============================================================================
// Optional Service Getters (Return null if missing)
// ============================================================================

/**
 * Get settings manager safely (returns null if not registered).
 *
 * @template T - Settings manager type (defaults to unknown)
 * @returns Settings manager instance or null if not found
 *
 * @example
 * const settings = tryGetSettingsManager<ISettingsManager>();
 * if (settings) {
 *   const value = settings.get('key');
 * }
 */
export function tryGetSettingsManager<T = unknown>(): T | null {
  return CoreServiceRegistry.tryGet<T>(SERVICE_KEYS.SETTINGS);
}

// ============================================================================
// BaseService Initialization (Framework setup)
// ============================================================================

/**
 * Initialize base services (infrastructure layer).
 *
 * **Services**: Theme, Language (PC-only, core infrastructure)
 * **Note**: AnimationService removed in Phase 414 (optional feature)
 *
 * @internal Called from app bootstrap phase
 * @throws If any base service initialization fails
 *
 * @example
 * // During app startup
 * await initializeBaseServices();
 */
export async function initializeBaseServices(): Promise<void> {
  await bridgeInitializeAllBaseServices([SERVICE_KEYS.THEME, SERVICE_KEYS.LANGUAGE]);
}

/**
 * Register base service in registry.
 *
 * @internal Called from app bootstrap or service initialization
 * @param key - Service key from SERVICE_KEYS
 * @param service - Service instance to register
 */
export function registerBaseService(key: string, service: unknown): void {
  bridgeRegisterBaseService(key, service as Parameters<typeof bridgeRegisterBaseService>[1]);
}

// ============================================================================
// Service Warmup (Lazy initialization attempts)
// ============================================================================

/**
 * Pre-initialize critical services (best-effort, no error throwing).
 *
 * **Services**: MediaService, ToastManager
 * **Behavior**: Silently fails if service not available
 * **Use Case**: Eager initialization for performance (optional)
 */
export function warmupCriticalServices(): void {
  try {
    void getMediaServiceFromContainer();
  } catch {
    // noop: Only needed in browser environment
  }
  try {
    void getToastManager();
  } catch {
    // noop
  }
}

/**
 * Pre-initialize non-critical services (best-effort, no error throwing).
 *
 * **Services**: ThemeService, MediaFilenameService
 * **Behavior**: Silently fails if service not available
 * **Use Case**: Eager initialization for performance (optional)
 */
export function warmupNonCriticalServices(): void {
  try {
    void getThemeService();
  } catch {
    // noop
  }
  try {
    void getMediaFilenameService();
  } catch {
    // noop
  }
}

/**
 * Register core base services (ThemeService, LanguageService).
 * Phase 414: AnimationService removed (optional feature)
 * @internal
 */
export function registerCoreBaseServices(): void {
  // Allow registration errors to surface so bootstrap can fail fast.
  registerBaseService(SERVICE_KEYS.THEME, themeService);
  registerBaseService(SERVICE_KEYS.LANGUAGE, languageService);
}
