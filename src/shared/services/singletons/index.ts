/**
 * @fileoverview ES Module Singleton Service Exports
 * @description Direct singleton exports for tree-shakable service access
 * @version 1.0.0 - Refactor from CoreService DI pattern
 *
 * This module exports service singletons directly as ES modules,
 * enabling better tree-shaking and simpler access patterns.
 *
 * **Migration from CoreService**:
 * - Before: `CoreService.getInstance().get<ThemeService>(SERVICE_KEYS.THEME)`
 * - After: `import { themeService } from '@shared/services/singletons'`
 *
 * **Test Mocking**:
 * Use `setServiceInstance()` to inject mocks in test environments.
 */

import { FilenameService } from '@shared/services/filename-service';
import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { ThemeService } from '@shared/services/theme-service';

// ============================================================================
// Service Instance Holders (Mutable for testing)
// ============================================================================

let _themeService: ThemeService | null = null;
let _languageService: LanguageService | null = null;
let _mediaService: MediaService | null = null;
let _filenameService: FilenameService | null = null;

// ============================================================================
// Lazy Singleton Getters
// ============================================================================

/**
 * Get ThemeService singleton instance.
 * Lazily initialized on first access.
 */
export function getThemeServiceInstance(): ThemeService {
  if (!_themeService) {
    _themeService = ThemeService.getInstance();
  }
  return _themeService;
}

/**
 * Get LanguageService singleton instance.
 * Lazily initialized on first access.
 */
export function getLanguageServiceInstance(): LanguageService {
  if (!_languageService) {
    _languageService = LanguageService.getInstance();
  }
  return _languageService;
}

/**
 * Get MediaService singleton instance.
 * Lazily initialized on first access.
 */
export function getMediaServiceInstance(): MediaService {
  if (!_mediaService) {
    _mediaService = MediaService.getInstance();
  }
  return _mediaService;
}

/**
 * Get FilenameService singleton instance.
 * Lazily initialized on first access.
 */
export function getFilenameServiceInstance(): FilenameService {
  if (!_filenameService) {
    _filenameService = FilenameService.getInstance();
  }
  return _filenameService;
}

// ============================================================================
// Test Utilities - Mock Injection
// ============================================================================

/**
 * Set a mock ThemeService instance for testing.
 * @param mock - Mock instance or null to reset
 */
export function setThemeServiceInstance(mock: ThemeService | null): void {
  _themeService = mock;
}

/**
 * Set a mock LanguageService instance for testing.
 * @param mock - Mock instance or null to reset
 */
export function setLanguageServiceInstance(mock: LanguageService | null): void {
  _languageService = mock;
}

/**
 * Set a mock MediaService instance for testing.
 * @param mock - Mock instance or null to reset
 */
export function setMediaServiceInstance(mock: MediaService | null): void {
  _mediaService = mock;
}

/**
 * Set a mock FilenameService instance for testing.
 * @param mock - Mock instance or null to reset
 */
export function setFilenameServiceInstance(mock: FilenameService | null): void {
  _filenameService = mock;
}

/**
 * Reset all service instances to null.
 * Use in test teardown to ensure clean state.
 */
export function resetAllServiceInstances(): void {
  _themeService = null;
  _languageService = null;
  _mediaService = null;
  _filenameService = null;
}

// ============================================================================
// Convenience Exports (Getter-based for lazy initialization)
// ============================================================================

/**
 * Direct service accessors - these are getter functions, not instances.
 * This ensures lazy initialization and allows for test mocking.
 */
export {
  getThemeServiceInstance as themeService,
  getLanguageServiceInstance as languageService,
  getMediaServiceInstance as mediaService,
  getFilenameServiceInstance as filenameService,
};
