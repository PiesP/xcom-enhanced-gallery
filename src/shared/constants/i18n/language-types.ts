/**
 * @fileoverview Language Type Definitions & Validation
 * @description Complete type system for internationalization (i18n) subsystem
 * @version 2.0.0 - Phase 400: Comprehensive documentation with validation patterns
 * @module shared/constants/i18n/language-types
 *
 * **System Overview**:
 * This module defines the complete type contract for the i18n system, ensuring
 * type-safe language handling across the application. All language implementations
 * must conform to the `LanguageStrings` interface for consistency.
 *
 * **Core Concepts**:
 *
 * ### Language Codes (Hierarchical)
 *
 * **Primary Types**:
 * - `BaseLanguageCode`: Actual language implementations ('en', 'ko', 'ja')
 *   - Each represents a complete translation in a specific language
 *   - Must be included in `LANGUAGE_CODES` constant
 *   - Can be used with `getLanguageStrings()` for direct access
 *
 * - `SupportedLanguage`: Includes 'auto' selector + `BaseLanguageCode`
 *   - 'auto' = System default language selection
 *   - Used in settings/preferences UI
 *   - Resolves to a `BaseLanguageCode` at runtime via `LanguageService`
 *
 * **Code Structure**:
 * - Format: ISO 639-1 codes (2-letter)
 * - Examples: 'en' (English), 'ko' (Korean), 'ja' (Japanese)
 * - Extensions: Could support 'en-US', 'en-GB' in future via region codes
 *
 * ### Translation String Schema (`LanguageStrings` Interface)
 *
 * **Hierarchical Organization**:
 *
 * ```
 * LanguageStrings (root)
 * ├─ toolbar (6 UI control strings)
 * │  ├─ previous, next, download, downloadAll, settings, close
 * │  └─ Context: Toolbar button labels for media navigation
 * │
 * ├─ settings (11 configuration strings)
 * │  ├─ title, theme, language, themeAuto, themeLight, themeDark
 * │  ├─ languageAuto, languageKo, languageEn, languageJa, close
 * │  ├─ gallery.sectionTitle
 * │  └─ Context: Settings panel labels and options
 * │
 * └─ messages (5 notification categories)
 *    ├─ errorBoundary (crash handler)
 *    │  ├─ title, body (with {error} placeholder)
 *    │  └─ Shows when unexpected errors occur
 *    │
 *    ├─ keyboardHelp (shortcut reference)
 *    │  ├─ title, navPrevious, navNext, close, toggleHelp
 *    │  └─ Explains keyboard shortcuts (Arrow keys, Escape, ?)
 *    │
 *    ├─ download (multi-state feedback)
 *    │  ├─ single.error: Single file failure
 *    │  ├─ allFailed: All items failed
 *    │  ├─ partial: Partial failure (with {count} placeholder)
 *    │  ├─ retry.action, retry.success: Retry states
 *    │  └─ cancelled: User cancelled operation
 *    │
 *    └─ gallery (empty/error states)
 *       ├─ emptyTitle, emptyDescription: Empty gallery
 *       ├─ failedToLoadImage: Load failure (with {type} placeholder)
 *       └─ Context: Gallery UI feedback
 * ```
 *
 * **Placeholder Pattern**:
 * - `{error}`: Error message details from exception
 * - `{count}`: Numeric value (e.g., failed item count)
 * - `{type}`: Media type classifier ('Image', 'Video', etc.)
 * - Runtime resolution: Handled by message formatting service
 *
 * **Type-Safety Enforcement**:
 * - All string properties marked `readonly` (immutability)
 * - Nested objects also `readonly` (deep immutability)
 * - Prevents accidental mutations in service code
 * - Enables exhaustiveness checking in TypeScript
 *
 * ### Validation & Runtime Checks
 *
 * **Type Guards**:
 * - `isBaseLanguageCode()`: Validates if value is valid language code
 * - Uses `Set` lookup (O(1) performance vs array search)
 * - Null/undefined safe (returns false for invalid inputs)
 *
 * **Usage Patterns**:
 * ```typescript
 * // ✅ Type-safe access after validation
 * if (isBaseLanguageCode(userInput)) {
 *   const strings: LanguageStrings = getLanguageStrings(userInput);
 *   // userInput is narrowed to BaseLanguageCode
 * }
 *
 * // ✅ Direct access with known types
 * const enStrings = getLanguageStrings('en'); // Type inferred as LanguageStrings
 *
 * // ❌ Avoid
 * const strings = TRANSLATION_REGISTRY[unknownValue]; // Type error if not BaseLanguageCode
 * ```
 *
 * ## Module Exports
 *
 * **Constants**:
 * - `LANGUAGE_CODES`: Immutable tuple of supported language codes
 *   - Type: `readonly ['en', 'ko', 'ja']`
 *   - Used for: Iteration, UI dropdowns, validation
 *   - Immutable to prevent accidental mutations
 *
 * **Types**:
 * - `BaseLanguageCode`: Literal type of supported languages
 * - `SupportedLanguage`: Extended type including 'auto' option
 * - `LanguageStrings`: Interface for translation schema
 *
 * **Functions**:
 * - `isBaseLanguageCode()`: Type guard function
 *   - Signature: `(value: string | null | undefined) => value is BaseLanguageCode`
 *   - Returns: true if value is valid language code
 *   - Performance: O(1) Set lookup
 *
 * ## Design Rationale
 *
 * **Immutability**:
 * - All string properties are `readonly` to prevent mutations
 * - Nested objects are deeply immutable (frozen at creation)
 * - Ensures consistency across application runtime
 *
 * **Type Safety**:
 * - Exhaustiveness checking: TypeScript catches missing string keys
 * - Literal types: Prevents typos in language code strings
 * - Union types: Clear intent of 'auto' vs BaseLanguageCode distinction
 *
 * **Performance**:
 * - Set-based validation (O(1) lookup)
 * - No regex parsing or array searching
 * - Suitable for frequent validation (settings UI)
 *
 * **Extensibility**:
 * - `LANGUAGE_CODES` can be extended with new language codes
 * - New language implementations must conform to `LanguageStrings` interface
 * - `isBaseLanguageCode()` automatically recognizes new codes
 *
 * ## Related Documentation
 * - {@link ./translation-registry} - Language registry and access API
 * - {@link ./languages/en} - English translations (reference)
 * - {@link ./languages/ja} - Japanese translations
 * - {@link ./languages/ko} - Korean translations
 * - {@link ../../../services/language-service} - Runtime language switching
 *
 * @see {@link ./translation-registry} - Translation data source
 * @see {@link ./index} - i18n barrel export
 */

export const LANGUAGE_CODES = ['en', 'ko', 'ja'] as const;
export type BaseLanguageCode = (typeof LANGUAGE_CODES)[number];
export type SupportedLanguage = 'auto' | BaseLanguageCode;

/**
 * 번역 문자열 스키마 (모든 언어가 준수해야 할 인터페이스)
 */
export interface LanguageStrings {
  readonly toolbar: {
    readonly previous: string;
    readonly next: string;
    readonly download: string;
    readonly downloadAll: string;
    readonly settings: string;
    readonly close: string;
    readonly tweetText: string;
    readonly tweetTextPanel: string;
  };
  readonly settings: {
    readonly title: string;
    readonly theme: string;
    readonly language: string;
    readonly themeAuto: string;
    readonly themeLight: string;
    readonly themeDark: string;
    readonly languageAuto: string;
    readonly languageKo: string;
    readonly languageEn: string;
    readonly languageJa: string;
    readonly close: string;
    readonly gallery: {
      readonly sectionTitle: string;
    };
  };
  readonly messages: {
    readonly errorBoundary: {
      readonly title: string;
      readonly body: string;
    };
    readonly keyboardHelp: {
      readonly title: string;
      readonly navPrevious: string;
      readonly navNext: string;
      readonly close: string;
      readonly toggleHelp: string;
    };
    readonly download: {
      readonly single: {
        readonly error: {
          readonly title: string;
          readonly body: string;
        };
      };
      readonly allFailed: {
        readonly title: string;
        readonly body: string;
      };
      readonly partial: {
        readonly title: string;
        readonly body: string;
      };
      readonly retry: {
        readonly action: string;
        readonly success: {
          readonly title: string;
          readonly body: string;
        };
      };
      readonly cancelled: {
        readonly title: string;
        readonly body: string;
      };
    };
    readonly gallery: {
      readonly emptyTitle: string;
      readonly emptyDescription: string;
      readonly failedToLoadImage: string;
    };
  };
}

const LANGUAGE_CODE_LOOKUP = new Set<string>(LANGUAGE_CODES);

/**
 * 주어진 값이 유효한 기본 언어 코드인지 확인
 *
 * @param value - 검증할 값
 * @returns value가 BaseLanguageCode이면 true, 아니면 false
 *
 * @example
 * ```typescript
 * if (isBaseLanguageCode('en')) {
 *   // ✅ true - 유효한 언어 코드
 * }
 *
 * if (isBaseLanguageCode('de')) {
 *   // ❌ false - 지원하지 않는 언어 코드
 * }
 * ```
 */
export function isBaseLanguageCode(value: string | null | undefined): value is BaseLanguageCode {
  return value != null && LANGUAGE_CODE_LOOKUP.has(value);
}
