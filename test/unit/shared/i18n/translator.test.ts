import { describe, expect, it } from 'vitest';
import { Translator, type TranslationKey, type TranslationBundleInput } from '@shared/i18n';
import {
  DEFAULT_LANGUAGE,
  TRANSLATION_REGISTRY,
} from '@shared/constants/i18n/translation-registry';

describe('Translator', () => {
  const translator = new Translator({
    bundles: TRANSLATION_REGISTRY,
    fallbackLanguage: DEFAULT_LANGUAGE,
  });

  it('returns keys when translation is missing', () => {
    const missingKey = 'messages.gallery.__missing__' as TranslationKey;
    const result = translator.translate('ko', missingKey);
    expect(result).toBe(missingKey);
  });

  it('formats parameters using the provided map', () => {
    const message = translator.translate('en', 'messages.download.partial.body', { count: 3 });
    expect(message).toContain('3');
  });

  it('falls back to default language for unsupported locales', () => {
    const enOnlyBundles: TranslationBundleInput = { en: TRANSLATION_REGISTRY.en };
    const localizedTranslator = new Translator({ bundles: enOnlyBundles, fallbackLanguage: 'en' });
    const fallback = localizedTranslator.translate('ko', 'toolbar.next');
    const english = localizedTranslator.translate('en', 'toolbar.next');
    expect(fallback).toBe(english);
  });
});
