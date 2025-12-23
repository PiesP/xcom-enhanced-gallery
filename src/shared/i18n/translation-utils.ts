import type { LanguageStrings } from '@shared/constants/i18n/language-types';
import type { TranslationKey } from './types';

export function resolveTranslationValue(
  dictionary: LanguageStrings,
  key: TranslationKey
): string | undefined {
  const segments = key.split('.');
  let current: unknown = dictionary;

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'string' ? current : undefined;
}
