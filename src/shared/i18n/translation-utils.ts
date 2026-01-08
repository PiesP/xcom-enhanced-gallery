import type { LanguageStrings } from '@shared/constants/i18n/i18n.types';
import type { TranslationKey } from './types';

/**
 * Resolve nested translation value using dot notation
 * @param dictionary Language strings dictionary
 * @param key Translation key (e.g., 'msg.welcome.title')
 * @returns Resolved string or undefined if not found
 */
export function resolveTranslationValue(
  dictionary: LanguageStrings,
  key: TranslationKey
): string | undefined {
  const segments = key.split('.');
  let current: unknown = dictionary;

  for (const segment of segments) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'string' ? current : undefined;
}
