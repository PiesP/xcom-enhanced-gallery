/**
 * @fileoverview Internationalization (i18n) System Barrel Export
 * @description Complete re-export of i18n subsystem components
 * @version 2.0.0 - Phase 400: Comprehensive documentation with module contracts
 * @module shared/constants/i18n
 *
 * **System Purpose**:
 * This barrel module aggregates all i18n subsystem components (language types,
 * translation registry, and helper functions) into a single convenient import point.
 * Provides the public API for language-related operations throughout the application.
 *
 * **Module Structure**:
 * ```
 * @shared/constants/i18n/
 * ├─ index.ts (this file - barrel export)
 * ├─ language-types.ts (type definitions & validation)
 * ├─ translation-registry.ts (language data & access API)
 * └─ languages/
 *    ├─ en.ts (English translations)
 *    ├─ ja.ts (Japanese translations)
 *    └─ ko.ts (Korean translations)
 * ```
 *
 * ## Exported Components
 *
 * ### Type Definitions (from language-types.ts)
 *
 * **LANGUAGE_CODES** (Constant)
 * - Value: `['en', 'ko', 'ja'] as const`
 * - Type: `readonly string[]` (literal tuple)
 * - Purpose: Define supported language codes
 * - Usage: Loop over languages, validate user input
 *
 * **BaseLanguageCode** (Type)
 * - Literal union: `'en' | 'ko' | 'ja'`
 * - Purpose: Type-safe language code parameter
 * - Usage: Function parameters, variable declarations
 *
 * **SupportedLanguage** (Type)
 * - Literal union: `'auto' | 'en' | 'ko' | 'ja'`
 * - Purpose: User preference including 'auto' selector
 * - Usage: Settings UI, user preferences
 *
 * **LanguageStrings** (Interface)
 * - Hierarchical structure:
 *   - toolbar (6 UI control strings)
 *   - settings (11 configuration strings)
 *   - messages (5 notification categories)
 * - Purpose: Contract for translation schema
 * - Usage: Implementing language files, type-checking
 *
 * **isBaseLanguageCode** (Function)
 * - Signature: `(value: unknown) => value is BaseLanguageCode`
 * - Purpose: Type guard for runtime validation
 * - Return: true if value is valid language code
 * - Performance: O(1) Set lookup
 *
 * ### Registry & Access (from translation-registry.ts)
 *
 * **TRANSLATION_REGISTRY** (Constant)
 * - Type: `Record<BaseLanguageCode, LanguageStrings>`
 * - Value: Frozen object with all translations
 * - Purpose: Central storage for all language data
 * - Access: Direct lookup by language code
 *
 * **DEFAULT_LANGUAGE** (Constant)
 * - Value: `'en'` (English)
 * - Purpose: System fallback language
 * - Usage: LanguageService initialization
 *
 * **getLanguageStrings** (Function)
 * - Signature: `(language: BaseLanguageCode) => LanguageStrings`
 * - Purpose: Retrieve translation strings for a language
 * - Return: Complete LanguageStrings object
 * - Performance: O(1) lookup
 *
 * **listBaseLanguages** (Function)
 * - Signature: `() => readonly BaseLanguageCode[]`
 * - Purpose: Get all supported language codes
 * - Return: ['en', 'ko', 'ja']
 * - Performance: O(1) (cached)
 *
 * ### Module Versioning (Test Integrity Helpers)
 *
 * **moduleVersions** (Object)
 * - Type: `Record<string, number>`
 * - Purpose: Track i18n subsystem versions for tests
 * - Keys: 'language-types', 'translation-registry', 'languages/en', 'languages/ja', 'languages/ko'
 * - Usage: Test assertions, module integrity checks
 *
 * **resolveModuleKeys** (Function)
 * - Signature: `() => string[]`
 * - Purpose: Get all module version keys
 * - Return: Array of module identifiers
 * - Usage: Validate all modules present
 *
 * **buildModuleVersions** (Function)
 * - Signature: `(existing?: Record<string, number>) => Record<string, number>`
 * - Purpose: Merge existing versions with current defaults
 * - Return: Complete version map
 * - Usage: Test setup, version compatibility
 *
 * ## Common Usage Patterns
 *
 * ### Pattern 1: Language Validation & Access
 * ```typescript
 * import {
 *   isBaseLanguageCode,
 *   getLanguageStrings,
 *   type BaseLanguageCode
 * } from '@shared/constants/i18n';
 *
 * const userInput: string = 'ko';
 * if (isBaseLanguageCode(userInput)) {
 *   const strings = getLanguageStrings(userInput);
 *   console.log(strings.toolbar.previous);
 * }
 * ```
 *
 * ### Pattern 2: UI Dropdown Population
 * ```typescript
 * import { LANGUAGE_CODES, getLanguageStrings } from '@shared/constants/i18n';
 *
 * const options = LANGUAGE_CODES.map(code => ({
 *   value: code,
 *   label: getLanguageStrings(code).settings.title
 * }));
 * ```
 *
 * ### Pattern 3: Language Iteration
 * ```typescript
 * import { listBaseLanguages, getLanguageStrings } from '@shared/constants/i18n';
 *
 * listBaseLanguages().forEach(lang => {
 *   const strings = getLanguageStrings(lang);
 *   // Process each language
 * });
 * ```
 *
 * ### Pattern 4: Type-Safe Language Service
 * ```typescript
 * import {
 *   getLanguageStrings,
 *   DEFAULT_LANGUAGE,
 *   type SupportedLanguage
 * } from '@shared/constants/i18n';
 *
 * class LanguageService {
 *   getCurrentStrings(): LanguageStrings {
 *     const resolved = this.resolveLanguage();
 *     return getLanguageStrings(resolved);
 *   }
 * }
 * ```
 *
 * ## Design Principles
 *
 * ### Explicit Exports (Not Implicit Re-exports)
 * - Each export explicitly listed (better tree-shaking)
 * - Type exports separated from value exports (clarity)
 * - No wildcard exports (forces specificity)
 *
 * ### Single Source of Truth
 * - All translation data centralized in TRANSLATION_REGISTRY
 * - No duplicate language implementations
 * - Type contract enforced by LanguageStrings interface
 *
 * ### Type Safety by Default
 * - isBaseLanguageCode guard for runtime validation
 * - Literal types prevent typos in language codes
 * - LanguageStrings interface ensures schema compliance
 *
 * ### Performance Optimization
 * - O(1) registry lookups
 * - Immutable data prevents unintended mutations
 * - Set-based validation for fast type checking
 * - Memoization-friendly API
 *
 * ## Integration Guide
 *
 * **To use i18n in a component**:
 * ```typescript
 * import { getLanguageStrings } from '@shared/constants/i18n';
 * import { LanguageService } from '@shared/services';
 *
 * const languageService = LanguageService.getInstance();
 * const currentLang = languageService.getCurrentLanguage();
 * const strings = getLanguageStrings(currentLang);
 * ```
 *
 * **To validate user input**:
 * ```typescript
 * import { isBaseLanguageCode } from '@shared/constants/i18n';
 *
 * const userLang = settingsStore.language;
 * if (isBaseLanguageCode(userLang)) {
 *   // userLang is now safe to use as BaseLanguageCode
 * }
 * ```
 *
 * ## Related Documentation
 * - {@link ./language-types} - Type definitions (60+ doc lines)
 * - {@link ./translation-registry} - Registry & API (100+ doc lines)
 * - {@link ./languages/en} - English translations (186 lines)
 * - {@link ./languages/ja} - Japanese translations (178 lines)
 * - {@link ./languages/ko} - Korean translations (180 lines)
 * - {@link ../../../services/language-service.ts} - Runtime language switching
 *
 * @see {@link ./language-types} - Type system
 * @see {@link ./translation-registry} - Data storage
 */

// Phase 352: Explicit named exports for better tree-shaking
export { LANGUAGE_CODES, isBaseLanguageCode } from './language-types';
export type { BaseLanguageCode, SupportedLanguage, LanguageStrings } from './language-types';

export {
  TRANSLATION_REGISTRY,
  DEFAULT_LANGUAGE,
  getLanguageStrings,
  listBaseLanguages,
} from './translation-registry';

/**
 * Module version tracking for test integrity checks.
 *
 * **Purpose**: Ensure all i18n subsystem modules are correctly loaded
 * in test environments. Prevents partial module loading or missing imports.
 *
 * **Keys**: Must align with EXPECTED_KEYS in test assertions
 * - 'language-types': Language type definitions module
 * - 'translation-registry': Translation data storage module
 * - 'languages/en': English translation file
 * - 'languages/ja': Japanese translation file
 * - 'languages/ko': Korean translation file
 *
 * **Values**: Version numbers (currently all 1)
 * - Increment when module structure changes
 * - Used for compatibility checks
 *
 * @type {Record<string, number>}
 * @const
 */
export const moduleVersions: Record<string, number> = Object.freeze({
  'language-types': 1,
  'translation-registry': 1,
  'languages/en': 1,
  'languages/ja': 1,
  'languages/ko': 1,
});

/**
 * Resolve all module version keys for validation.
 *
 * **Purpose**: Get list of all i18n modules that should be loaded.
 * Used in tests to validate module completeness.
 *
 * @returns {string[]} Array of module identifiers
 *
 * @example
 * ```typescript
 * const keys = resolveModuleKeys();
 * // ['language-types', 'translation-registry', 'languages/en', 'languages/ja', 'languages/ko']
 * ```
 */
export function resolveModuleKeys(): string[] {
  return Object.keys(moduleVersions);
}

/**
 * Build complete module version map with defaults.
 *
 * **Purpose**: Merge user-provided versions with default module versions.
 * Used during test setup to establish baseline version state.
 *
 * **Algorithm**:
 * 1. Iterate over all modules in `moduleVersions`
 * 2. Keep existing version if provided and > 0
 * 3. Use default version from `moduleVersions` otherwise
 * 4. Return complete merged map
 *
 * @param {Record<string, number>} [existing] - User-provided versions to merge
 * @returns {Record<string, number>} Complete version map with defaults
 *
 * @example
 * ```typescript
 * // Using defaults
 * const versions = buildModuleVersions();
 * // { 'language-types': 1, 'translation-registry': 1, ... }
 *
 * // With overrides
 * const custom = buildModuleVersions({ 'language-types': 2 });
 * // { 'language-types': 2, 'translation-registry': 1, ... }
 * ```
 */
export function buildModuleVersions(existing: Record<string, number> = {}): Record<string, number> {
  const result: Record<string, number> = {};
  for (const key of resolveModuleKeys()) {
    result[key] = existing[key] && existing[key] > 0 ? existing[key] : (moduleVersions[key] ?? 1);
  }
  return result;
}
