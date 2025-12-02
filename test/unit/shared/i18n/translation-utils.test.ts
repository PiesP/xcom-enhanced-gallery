import { resolveTranslationValue, collectTranslationKeys } from '@shared/i18n/translation-utils';
import type { LanguageStrings } from '@shared/constants/i18n/language-types';
import type { TranslationKey } from '@shared/i18n/types';
// Using vitest globals via types

describe("translation-utils", () => {
  describe("resolveTranslationValue", () => {
    const dictionary: LanguageStrings = {
      simple: "Simple Value",
      nested: {
        key: "Nested Value",
        deep: {
          key: "Deep Value",
        },
      },
      mixed: {
        value: "Mixed Value",
      },
    } as unknown as LanguageStrings;

    it("should resolve simple keys", () => {
      expect(
        resolveTranslationValue(dictionary, "simple" as TranslationKey),
      ).toBe("Simple Value");
    });

    it("should resolve nested keys", () => {
      expect(
        resolveTranslationValue(dictionary, "nested.key" as TranslationKey),
      ).toBe("Nested Value");
    });

    it("should resolve deep nested keys", () => {
      expect(
        resolveTranslationValue(
          dictionary,
          "nested.deep.key" as TranslationKey,
        ),
      ).toBe("Deep Value");
    });

    it("should return undefined for missing keys", () => {
      expect(
        resolveTranslationValue(dictionary, "missing" as TranslationKey),
      ).toBeUndefined();
    });

    it("should return undefined for missing nested keys", () => {
      expect(
        resolveTranslationValue(dictionary, "nested.missing" as TranslationKey),
      ).toBeUndefined();
    });

    it("should return undefined when the resolved value is not a string", () => {
      expect(
        resolveTranslationValue(dictionary, "mixed" as TranslationKey),
      ).toBeUndefined();
    });
  });

  describe("collectTranslationKeys", () => {
    const dictionary: LanguageStrings = {
      simple: "Simple Value",
      nested: {
        key: "Nested Value",
        deep: {
          key: "Deep Value",
        },
      },
      section: {
        title: "Section Title",
        items: {
          one: "Item One",
          two: "Item Two",
        },
      },
    } as unknown as LanguageStrings;

    it("should collect all keys from a dictionary", () => {
      const keys = collectTranslationKeys(dictionary);
      expect(keys).toContain("simple");
      expect(keys).toContain("nested.key");
      expect(keys).toContain("nested.deep.key");
      expect(keys).toContain("section.title");
      expect(keys).toContain("section.items.one");
      expect(keys).toContain("section.items.two");
      expect(keys.length).toBe(6);
    });

    it("should handle empty dictionary", () => {
      const keys = collectTranslationKeys({} as LanguageStrings);
      expect(keys).toEqual([]);
    });

    it("should handle flat dictionary", () => {
      const flat = {
        a: "1",
        b: "2",
      } as unknown as LanguageStrings;
      const keys = collectTranslationKeys(flat);
      expect(keys).toEqual(expect.arrayContaining(["a", "b"]));
      expect(keys.length).toBe(2);
    });
  });
});
