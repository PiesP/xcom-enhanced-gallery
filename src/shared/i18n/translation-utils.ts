import type { LanguageStrings } from '@shared/constants/i18n/language-types';
import type { TranslationKey } from './types';

/**
 * Resolves a nested translation value from a language dictionary using dot notation.
 *
 * @param dictionary - The language strings dictionary to search in
 * @param key - The translation key in dot notation (e.g., 'msg.welcome.title')
 * @returns The resolved string value, or undefined if not found or not a string
 *
 * @example
 * ```typescript
 * const dict = { msg: { welcome: 'Hello' } };
 * resolveTranslationValue(dict, 'msg.welcome'); // 'Hello'
 * resolveTranslationValue(dict, 'msg.missing'); // undefined
 * ```
 */
export function resolveTranslationValue(
  dictionary: LanguageStrings,
  key: TranslationKey
): string | undefined {
  const segments = key.split('.');
  let current: unknown = dictionary;

  for (const segment of segments) {
    // Early return if current is nullish or not an object
    if (current == null || typeof current !== 'object') {
      return undefined;
    }

    // Safe property access with type assertion
    current = (current as Record<string, unknown>)[segment];
  }

  // Return only if the final value is a string
  return typeof current === 'string' ? current : undefined;
}
