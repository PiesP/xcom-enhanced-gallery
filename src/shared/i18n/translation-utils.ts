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

function collectTranslationKeys(dictionary: LanguageStrings): TranslationKey[] {
  const stack: Array<{ node: Record<string, unknown>; prefix: string }> = [
    { node: dictionary as unknown as Record<string, unknown>, prefix: '' },
  ];
  const keys: string[] = [];

  while (stack.length > 0) {
    const { node, prefix } = stack.pop()!;

    for (const [segment, value] of Object.entries(node)) {
      const path = prefix ? `${prefix}.${segment}` : segment;

      if (typeof value === 'string') {
        keys.push(path);
        continue;
      }

      if (value && typeof value === 'object') {
        stack.push({ node: value as Record<string, unknown>, prefix: path });
      }
    }
  }

  return keys as TranslationKey[];
}
