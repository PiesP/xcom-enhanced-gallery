/**
 * @fileoverview Settings Feature Exports - Feature barrel
 * @version 3.0.0 - Phase 352: Named export optimization
 * @module features/settings
 *
 * @description
 * Type and service initialization entry point for Settings feature.
 * - Types defined in `./types/settings.types.ts`
 * - Services provided via lazy import (bootstrap optimization)
 *
 * @example
 * ```typescript
 * // 1. Use types (type-only import recommended)
 * import type { AppSettings } from '@/features/settings';
 *
 * // 2. Initialize service (dynamic import for tree-shaking)
 * const service = await initializeSettingsService();
 * await service.initialize();
 * ```
 */

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

/**
 * Settings types re-export (type-only)
 * - AppSettings: Complete settings structure
 * - GallerySettings, DownloadSettings, etc.: Category-specific types
 *
 * Default values (DEFAULT_SETTINGS) should be imported directly from @/constants:
 * @example `import { DEFAULT_SETTINGS } from '@/constants'`
 */
export type {
  GallerySettings,
  DownloadSettings,
  TokenSettings,
  PerformanceSettings,
  AccessibilitySettings,
  FeatureFlags,
  AppSettings,
  SettingKey,
  NestedSettingKey,
  SettingChangeEvent,
  SettingValidationResult,
} from './types/settings.types';

// ─────────────────────────────────────────
// Service Initialization (Lazy Import Pattern)
// ─────────────────────────────────────────

/**
 * Initialize Settings service - Dynamic import
 *
 * @description
 * Creates and returns a SettingsService instance.
 * Uses dynamic import for bundle size optimization.
 *
 * @returns Initialized SettingsService instance
 *
 * @example
 * ```typescript
 * // Usage in bootstrap/features.ts
 * const { SettingsService } = await import('@/features/settings/services/settings-service');
 * const service = new SettingsService();
 * await service.initialize();
 * ```
 */
export async function initializeSettingsService() {
  const { SettingsService } = await import('./services/settings-service');
  return new SettingsService();
}
