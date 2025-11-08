/**
 * @fileoverview Translation Registry & Access API
 * @description Central management of all language translations with runtime resolution
 * @version 2.0.0 - Phase 400: Comprehensive documentation with access patterns
 * @module shared/constants/i18n/translation-registry
 *
 * **System Overview**:
 * This module provides centralized storage and access to all translation strings
 * across supported languages. It acts as the single source of truth for i18n data,
 * ensuring consistent translation lookup throughout the application.
 *
 * **Architecture Pattern**:
 *
 * ### Registry Pattern (Immutable Map)
 *
 * ```
 * TRANSLATION_REGISTRY (Object.freeze - frozen at initialization)
 * ├─ 'en': LanguageStrings (English translations)
 * ├─ 'ko': LanguageStrings (Korean translations)
 * └─ 'ja': LanguageStrings (Japanese translations)
 * ```
 *
 * **Key Properties**:
 * - **Immutable**: Frozen with `Object.freeze()` to prevent mutations
 * - **Type-Safe**: Each entry conforms to `LanguageStrings` interface
 * - **Centralized**: Single object for all language lookups
 * - **Performance**: O(1) lookup by language code
 *
 * ### Access Patterns
 *
 * **Pattern 1: Direct Registry Access** (Low-level)
 * ```typescript
 * import { TRANSLATION_REGISTRY } from '@shared/constants/i18n';
 *
 * const enStrings = TRANSLATION_REGISTRY['en']; // LanguageStrings
 * const koStrings = TRANSLATION_REGISTRY['ko'];
 * ```
 * **When to use**: Testing, validation, internal implementations
 *
 * **Pattern 2: Helper Function** (Recommended - High-level)
 * ```typescript
 * import { getLanguageStrings } from '@shared/constants/i18n';
 *
 * const strings = getLanguageStrings('en');
 * const title = strings.toolbar.previous; // Type-safe string access
 * ```
 * **When to use**: Normal application code, services, components
 *
 * **Pattern 3: Type-Safe Iteration** (Collection operations)
 * ```typescript
 * import { listBaseLanguages, getLanguageStrings } from '@shared/constants/i18n';
 *
 * listBaseLanguages().forEach(lang => {
 *   const strings = getLanguageStrings(lang);
 *   // Process each language
 * });
 * ```
 * **When to use**: UI population, migration, comparison across languages
 *
 * ### Language Resolution Pipeline
 *
 * **User Input → Validation → Language Service → String Access**:
 * ```
 * User Settings ('auto' or 'ko')
 *   ↓
 * LanguageService.resolveLanguage()
 *   ↓
 * BaseLanguageCode ('en' from 'auto', or 'ko' validated)
 *   ↓
 * getLanguageStrings(resolvedLang)
 *   ↓
 * TRANSLATION_REGISTRY[resolvedLang]
 *   ↓
 * LanguageStrings object ready for use
 * ```
 *
 * **Error Handling**:
 * - Type guard: `isBaseLanguageCode()` validates before access
 * - Fallback: Unknown codes should default to DEFAULT_LANGUAGE ('en')
 * - Never throws: Registry lookup always succeeds for valid codes
 *
 * ## Module Contents
 *
 * ### Constants
 *
 * **TRANSLATION_REGISTRY** (Registry object)
 * - Type: `Record<BaseLanguageCode, LanguageStrings>`
 * - Frozen: Yes (Object.freeze applied)
 * - Exports: All supported language strings
 * - Lookup: O(1) by language code
 *
 * **DEFAULT_LANGUAGE** (Fallback language)
 * - Type: `BaseLanguageCode` (specifically 'en')
 * - Purpose: System fallback when language resolution fails
 * - Used by: LanguageService during initialization
 * - Immutable: Yes (const declaration)
 *
 * ### Functions
 *
 * **getLanguageStrings(language: BaseLanguageCode)**
 * - **Purpose**: Retrieve translation strings for a language
 * - **Parameters**: Language code ('en', 'ko', or 'ja')
 * - **Returns**: Complete `LanguageStrings` object
 * - **Type Safety**: Parameter must be BaseLanguageCode
 * - **Performance**: O(1) registry lookup
 * - **Error Handling**: Returns valid object only for supported languages
 *
 * **Example Usage**:
 * ```typescript
 * const koStrings = getLanguageStrings('ko');
 * console.log(koStrings.toolbar.previous); // '이전'
 *
 * const enStrings = getLanguageStrings('en');
 * console.log(enStrings.toolbar.next); // 'Next'
 * ```
 *
 * **listBaseLanguages()**
 * - **Purpose**: Get list of all supported language codes
 * - **Returns**: Immutable array of BaseLanguageCode values
 * - **Type**: `readonly BaseLanguageCode[]`
 * - **Performance**: O(1) - returns constant reference
 * - **Use Case**: UI dropdowns, validation, iteration
 *
 * **Example Usage**:
 * ```typescript
 * const supportedLanguages = listBaseLanguages();
 * // ['en', 'ko', 'ja']
 *
 * // UI dropdown population
 * supportedLanguages.map(lang => ({
 *   code: lang,
 *   strings: getLanguageStrings(lang)
 * }));
 * ```
 *
 * ## Design Patterns
 *
 * ### Immutability Strategy
 * - Registry frozen at creation (Object.freeze)
 * - Individual LanguageStrings are deep-frozen (language files)
 * - Prevents accidental mutations during runtime
 * - Enables safe sharing across components
 *
 * ### Single Source of Truth (SSOT)
 * - All translations centralized in TRANSLATION_REGISTRY
 * - No duplicate language strings in codebase
 * - Version control: One source per language, easy to update
 * - Consistency: Changes automatically propagate
 *
 * ### Type-Safe Access
 * - Type inference: TypeScript auto-completes string keys
 * - Compile-time verification: Missing keys caught before runtime
 * - No string literals: Use language.toolbar.previous instead of 'previous'
 * - Exhaustiveness checking: Refactoring validated at compile time
 *
 * ### Performance Optimization
 * - O(1) lookup: Direct object property access
 * - No parsing: Language codes are simple string keys
 * - No searching: Set-based validation in type guards
 * - Memoization-friendly: Can cache results in selectors
 *
 * ## Integration Points
 *
 * **Language Service**:
 * - Consumes `getLanguageStrings()` for current language
 * - Observes language change events
 * - Provides reactivity via Signal
 *
 * **Settings Service**:
 * - Stores user's language preference ('auto' or BaseLanguageCode)
 * - Passes to LanguageService for resolution
 *
 * **Components & UI**:
 * - Import `getLanguageStrings()` function
 * - Use in JSX templates or computed properties
 * - Type-safe access to all string resources
 *
 * **Tests**:
 * - Can mock TRANSLATION_REGISTRY for testing
 * - Can validate all language keys match schema
 * - Can test translation completeness
 *
 * ## Adding New Languages
 *
 * **Steps to add language 'de' (German)**:
 * 1. Create `src/shared/constants/i18n/languages/de.ts`
 * 2. Implement `LanguageStrings` interface with German translations
 * 3. Add 'de' to `LANGUAGE_CODES` in language-types.ts
 * 4. Import and add to REGISTRY object below
 * 5. Update language-service if special handling needed
 * 6. Update tests to validate new language
 *
 * ## Related Documentation
 * - {@link ./language-types} - Type definitions and validation
 * - {@link ./languages/en} - English translations (reference)
 * - {@link ./languages/ja} - Japanese translations
 * - {@link ./languages/ko} - Korean translations
 * - {@link ../../../services/language-service} - Language switching service
 *
 * @see {@link ./language-types} - Type contract
 * @see {@link ./index} - i18n barrel export
 */

import { LANGUAGE_CODES, type BaseLanguageCode, type LanguageStrings } from './language-types';
import { en } from './languages/en';
import { ko } from './languages/ko';
import { ja } from './languages/ja';

const REGISTRY: Record<BaseLanguageCode, LanguageStrings> = Object.freeze({
  en,
  ko,
  ja,
});

export const TRANSLATION_REGISTRY = REGISTRY;
export const DEFAULT_LANGUAGE: BaseLanguageCode = 'en';

/**
 * 지정된 언어의 번역 문자열을 반환
 *
 * @param language - 조회할 언어 코드
 * @returns 지정된 언어의 번역 문자열 객체
 *
 * @example
 * ```typescript
 * const koStrings = getLanguageStrings('ko');
 * const enStrings = getLanguageStrings('en');
 * ```
 */
export function getLanguageStrings(language: BaseLanguageCode): LanguageStrings {
  return TRANSLATION_REGISTRY[language];
}

/**
 * 지원하는 기본 언어 목록 반환 (읽기 전용)
 *
 * @returns 지원 언어 코드 배열 (읽기 전용)
 *
 * @example
 * ```typescript
 * const languages = listBaseLanguages();
 * // ['en', 'ko', 'ja']
 * ```
 */
export function listBaseLanguages(): readonly BaseLanguageCode[] {
  return LANGUAGE_CODES;
}
