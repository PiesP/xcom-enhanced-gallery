// Using vitest globals (describe, it, expect) via types
import { Translator, createTranslationFunction } from '@shared/i18n/translator';
import { TranslationCatalog } from '@shared/i18n/translation-catalog';
// Local types

describe('Translator class and helpers', () => {
  it('creates instance and lists languages', () => {
    const catalog = new TranslationCatalog();
    const translator = new Translator(catalog);
    const langs = translator.languages;
    expect(Array.isArray(langs)).toBe(true);
    expect(langs).toContain('en');
  });

  it('translates known and unknown keys and interpolates params', () => {
    const translator = new Translator();
    expect(translator.translate('en', 'toolbar.next')).toBe('Next');
    expect(translator.translate('en', 'toolbar.previous')).toBe('Previous');
    expect(translator.translate('ko', 'toolbar.previous')).toBe('이전');
    expect(translator.translate('ja', 'toolbar.previous')).toBe('前へ');

    // missing key should return key string
    // Cast to TranslationKey to satisfy the strict key union type
    expect(translator.translate('en', 'does.not.exist' as unknown as TranslationKey)).toBe(
      'does.not.exist',
    );

    const body = translator.translate('en', 'messages.download.single.error.body', { error: 'X' });
    expect(body).toContain('Could not download the file');
    expect(body).toContain('X');
  });

  it('createTranslationFunction resolves language at call time', () => {
    const translator = new Translator();
    const fn = createTranslationFunction(translator, () => 'en');
    expect(fn('toolbar.previous')).toBe('Previous');
  });
});
// Additional, more detailed translator tests
import type { LanguageStrings } from '@shared/constants/i18n/language-types';
import type { TranslationKey } from '@shared/i18n/types';

describe("Translator", () => {
  const mockStrings: LanguageStrings = {
    simple: "Simple Value",
    param: "Value with {param}",
    multi: "{a} + {b} = {c}",
    nested: {
      key: "Nested Value",
    },
  } as unknown as LanguageStrings;

  const mockBundles = {
    en: mockStrings,
  };

  const catalog = new TranslationCatalog({
    bundles: mockBundles,
    fallbackLanguage: "en",
  });

  it("should initialize with catalog instance", () => {
    const translator = new Translator(catalog);
    expect(translator.languages).toEqual(catalog.keys());
  });

  it("should initialize with catalog options", () => {
    const translator = new Translator({
      bundles: mockBundles,
      fallbackLanguage: "en",
    });
    expect(translator.languages).toContain("en");
  });

  describe("translate", () => {
    const translator = new Translator(catalog);

    it("should translate simple keys", () => {
      expect(translator.translate("en", "simple" as TranslationKey)).toBe(
        "Simple Value",
      );
    });

    it("should translate nested keys", () => {
      expect(translator.translate("en", "nested.key" as TranslationKey)).toBe(
        "Nested Value",
      );
    });

    it("should return key if translation missing", () => {
      expect(translator.translate("en", "missing" as TranslationKey)).toBe(
        "missing",
      );
    });

    it("should replace parameters", () => {
      expect(
        translator.translate("en", "param" as TranslationKey, {
          param: "test",
        }),
      ).toBe("Value with test");
    });

    it("should replace multiple parameters", () => {
      expect(
        translator.translate("en", "multi" as TranslationKey, {
          a: 1,
          b: 2,
          c: 3,
        }),
      ).toBe("1 + 2 = 3");
    });

    it("should keep placeholder if param missing", () => {
      expect(translator.translate("en", "param" as TranslationKey, {})).toBe(
        "Value with {param}",
      );
    });

    it("should ignore extra params", () => {
      expect(
        translator.translate("en", "simple" as TranslationKey, {
          extra: "value",
        }),
      ).toBe("Simple Value");
    });

    it("should use fallback language if language missing", () => {
      expect(translator.translate("ja", "simple" as TranslationKey)).toBe(
        "Simple Value",
      );
    });
  });

  describe("createTranslationFunction", () => {
    const translator = new Translator(catalog);

    it("should create a function bound to language resolver", () => {
      const t = createTranslationFunction(translator, () => "en");
      expect(t("simple" as TranslationKey)).toBe("Simple Value");
    });

    it("should use current language from resolver", () => {
      let lang = "en";
      const t = createTranslationFunction(translator, () => lang as any);
      expect(t("simple" as TranslationKey)).toBe("Simple Value");

      // If we had another language, we could test switching.
      // Since we only have 'en' in mock, it falls back to 'en' anyway,
      // but let's verify it calls translate with the resolved language.
      // We can't easily spy on translator.translate without mocking,
      // but the integration works.
    });
  });
});
