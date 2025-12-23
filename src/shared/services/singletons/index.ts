/**
 * @fileoverview ES Module Singleton Service Exports
 * @description Direct singleton exports for tree-shakable service access
 * @version 4.0.0 - Modernized with createSingleton pattern
 *
 * This module exports service singletons directly as ES modules,
 * enabling better tree-shaking and simpler access patterns.
 *
 * **Modern Singleton Pattern**:
 * All services now use `createSingleton` helper for consistent lifecycle management.
 * Each service class provides:
 * - `getInstance()`: Get singleton instance
 * - `resetForTests()`: Reset singleton for test isolation
 *
 * **Migration from CoreService**:
 * - Before: `CoreService.getInstance().get<ThemeService>(SERVICE_KEYS.THEME)`
 * - After: `import { getThemeServiceInstance } from '@shared/services/singletons'`
 *
 * **Test Mocking**:
 * Use `resetAllServiceInstances()` in test teardown for clean state.
 * Services now use internal createSingleton pattern - use class static reset methods.
 *
 * **FilenameService (REMOVED)**:
 * FilenameService singleton has been removed in v3.0.0.
 * Use functional API instead:
 * ```typescript
 * import { generateMediaFilename, generateZipFilename } from '@shared/services/filename';
 * ```
 */

import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { ThemeService } from '@shared/services/theme-service';

// ============================================================================
// Lazy Singleton Getters (Delegate to class static methods)
// ============================================================================

/**
 * Get ThemeService singleton instance.
 * Lazily initialized on first access via createSingleton pattern.
 */
export function getThemeServiceInstance(): ThemeService {
  return ThemeService.getInstance();
}

/**
 * Get LanguageService singleton instance.
 * Lazily initialized on first access via createSingleton pattern.
 */
export function getLanguageServiceInstance(): LanguageService {
  return LanguageService.getInstance();
}

/**
 * Get MediaService singleton instance.
 * Lazily initialized on first access via createSingleton pattern.
 */
export function getMediaServiceInstance(): MediaService {
  return MediaService.getInstance();
}

// ============================================================================
// Test Utilities - Singleton Reset
// ============================================================================

/**
 * Reset all service instances for test isolation.
 * Use in test teardown to ensure clean state.
 */
export function resetAllServiceInstances(): void {
  ThemeService.resetForTests();
  LanguageService.resetForTests();
  MediaService.resetForTests();
}
