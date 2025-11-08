/**
 * @fileoverview Shared Constants & Configuration Barrel Export
 * @description Central re-export of all shared application constants
 * @version 2.0.0 - Phase 400: Comprehensive documentation with module organization
 * @module shared/constants
 *
 * **System Purpose**:
 * This barrel module aggregates all constants used throughout the application,
 * providing a single convenient import point for configuration, constants, and
 * internationalization (i18n) resources. Organized by logical domains.
 *
 * **Architecture Overview**:
 * ```
 * @shared/constants/
 * ├─ index.ts (this file - main barrel export)
 * ├─ i18n/ (Internationalization subsystem)
 * │  ├─ index.ts (i18n barrel)
 * │  ├─ language-types.ts (type definitions)
 * │  ├─ translation-registry.ts (language data)
 * │  └─ languages/
 * │     ├─ en.ts (English)
 * │     ├─ ja.ts (Japanese)
 * │     └─ ko.ts (Korean)
 * └─ [other constant modules]
 * ```
 *
 * **Design Philosophy**:
 *
 * ### Single Import Point (Convenience)
 * Users can import commonly-used constants from one location:
 * ```typescript
 * import {
 *   LANGUAGE_CODES,
 *   getLanguageStrings,
 *   type SupportedLanguage
 * } from '@shared/constants';
 * ```
 *
 * ### Clear Separation of Concerns (Clarity)
 * - **i18n Domain**: All language/translation related exports
 * - **Other Domains**: Application-wide constants, configuration
 * - Logical grouping enables easier discovery and maintenance
 *
 * ### Tree-Shaking Optimization (Performance)
 * - Explicit named exports (not wildcard re-exports)
 * - Type and value exports separated
 * - Enables bundler to remove unused constants
 * - Reduces bundle size for apps using only subset
 *
 * ## Exported Components
 *
 * ### i18n (Internationalization) Domain
 *
 * **From `./i18n`**:
 *
 * **Constants**:
 * - `LANGUAGE_CODES`: Tuple of supported language codes ['en', 'ko', 'ja']
 * - `TRANSLATION_REGISTRY`: Frozen map of all language translations
 * - `DEFAULT_LANGUAGE`: Fallback language ('en')
 * - `moduleVersions`: Version tracking for test integrity
 *
 * **Functions**:
 * - `isBaseLanguageCode()`: Type guard for language validation
 * - `getLanguageStrings()`: Retrieve translation strings for language
 * - `listBaseLanguages()`: Get supported language codes
 * - `resolveModuleKeys()`: Get i18n module identifiers
 * - `buildModuleVersions()`: Build version map with defaults
 *
 * **Types**:
 * - `BaseLanguageCode`: Literal type of supported languages
 * - `SupportedLanguage`: Extended type including 'auto' option
 * - `LanguageStrings`: Translation schema interface
 *
 * ## Module Hierarchy & Imports
 *
 * **Structure**:
 * ```
 * User Application Code
 *   ↓ imports from
 * @shared/constants (this file)
 *   ↓ re-exports
 * @shared/constants/i18n
 *   ↓ imports from
 * ./language-types.ts (types)
 * ./translation-registry.ts (registry)
 *   ↓ imports
 * ./languages/en.ts (data)
 * ./languages/ja.ts (data)
 * ./languages/ko.ts (data)
 * ```
 *
 * **Import Flow** (User perspective):
 * ```
 * import { getLanguageStrings } from '@shared/constants';
 *   ↓ Resolves to: @shared/constants/i18n/index.ts
 *   ↓ Which imports: ./translation-registry.ts
 *   ↓ Which imports: ./languages/en.ts, ./languages/ja.ts, ./languages/ko.ts
 * ```
 *
 * ## Usage Patterns
 *
 * ### Pattern 1: Basic Language Access
 * ```typescript
 * import { getLanguageStrings, type BaseLanguageCode } from '@shared/constants';
 *
 * const lang: BaseLanguageCode = 'ko';
 * const strings = getLanguageStrings(lang);
 * console.log(strings.toolbar.previous); // '이전'
 * ```
 *
 * ### Pattern 2: Type-Safe Language Validation
 * ```typescript
 * import { isBaseLanguageCode, LANGUAGE_CODES } from '@shared/constants';
 *
 * const userInput: string = getUserLanguage();
 * if (isBaseLanguageCode(userInput)) {
 *   // userInput is narrowed to BaseLanguageCode
 *   const strings = getLanguageStrings(userInput);
 * } else {
 *   // Fall back to default
 *   const strings = getLanguageStrings('en');
 * }
 * ```
 *
 * ### Pattern 3: UI Dropdown from Constants
 * ```typescript
 * import { LANGUAGE_CODES, getLanguageStrings } from '@shared/constants';
 *
 * const languageOptions = LANGUAGE_CODES.map(code => ({
 *   value: code,
 *   label: getLanguageStrings(code).settings.title
 * }));
 * ```
 *
 * ### Pattern 4: Language Iteration
 * ```typescript
 * import { listBaseLanguages, getLanguageStrings } from '@shared/constants';
 *
 * listBaseLanguages().forEach(lang => {
 *   const strings = getLanguageStrings(lang);
 *   // Process each language
 * });
 * ```
 *
 * ## Design Principles
 *
 * ### Explicit Over Implicit
 * - Each constant explicitly listed in exports
 * - Not using wildcard re-exports
 * - Forces intentional API design
 * - Makes dependencies clear in imports
 *
 * ### Separation of Concerns
 * - Types exported separately from values
 * - i18n domain isolated in sub-module
 * - Each constant grouped by purpose
 *
 * ### Single Source of Truth (SSOT)
 * - All translations centralized in TRANSLATION_REGISTRY
 * - No duplicate language data in codebase
 * - Changes propagate automatically
 *
 * ### Type Safety
 * - Literal types prevent typos in language codes
 * - Type guards validate at runtime
 * - Interface contracts ensure schema compliance
 *
 * ### Performance Optimization
 * - Explicit exports enable tree-shaking
 * - O(1) lookups in frozen registries
 * - Immutable data prevents mutations
 * - Memoization-friendly API
 *
 * ## Extending Constants
 *
 * **To add a new language**:
 * 1. Create language file: `src/shared/constants/i18n/languages/de.ts`
 * 2. Implement `LanguageStrings` interface
 * 3. Add 'de' to `LANGUAGE_CODES` in language-types.ts
 * 4. Import and add to TRANSLATION_REGISTRY in translation-registry.ts
 * 5. Update tests and documentation
 *
 * **To add other constants**:
 * 1. Create module: `src/shared/constants/my-domain.ts`
 * 2. Export constants and types from module
 * 3. Re-export from this file (index.ts)
 * 4. Update documentation above
 *
 * ## Related Documentation
 * - {@link ./i18n} - Internationalization subsystem (barrel)
 * - {@link ./i18n/language-types} - Language type definitions
 * - {@link ./i18n/translation-registry} - Translation data & access API
 * - {@link ./i18n/languages/en} - English translations
 * - {@link ./i18n/languages/ja} - Japanese translations
 * - {@link ./i18n/languages/ko} - Korean translations
 *
 * @see {@link ./i18n} - i18n subsystem
 */

export {
  LANGUAGE_CODES,
  isBaseLanguageCode,
  TRANSLATION_REGISTRY,
  DEFAULT_LANGUAGE,
  getLanguageStrings,
  moduleVersions,
  resolveModuleKeys,
  buildModuleVersions,
} from './i18n';

export type { BaseLanguageCode, SupportedLanguage, LanguageStrings } from './i18n';
