import type { LanguageStrings } from "@shared/constants/i18n/language-types";
import { TranslationCatalog } from "@shared/i18n/translation-catalog";
import { describe, expect, it } from "vitest";

describe("TranslationCatalog", () => {
  const mockStrings: LanguageStrings = {
    test: "value",
  } as unknown as LanguageStrings;

  const mockBundles = {
    en: mockStrings,
    ko: mockStrings,
  };

  it("should initialize with default options", () => {
    const catalog = new TranslationCatalog();
    expect(catalog.has("en")).toBe(true);
    expect(catalog.get("en")).toBeDefined();
  });

  it("should initialize with custom bundles", () => {
    const catalog = new TranslationCatalog({
      bundles: mockBundles,
      fallbackLanguage: "en",
    });
    expect(catalog.has("en")).toBe(true);
    expect(catalog.has("ko")).toBe(true);
  });

  it("should throw if fallback language is missing", () => {
    expect(() => {
      new TranslationCatalog({
        bundles: {},
        fallbackLanguage: "en",
      });
    }).toThrow("Missing fallback language bundle: en");
  });

  it("should register new bundles", () => {
    const catalog = new TranslationCatalog();
    catalog.register("ja", mockStrings);
    expect(catalog.has("ja")).toBe(true);
    expect(catalog.get("ja")).toBe(mockStrings);
  });

  it("should return fallback bundle if language is missing", () => {
    const catalog = new TranslationCatalog({
      bundles: mockBundles,
      fallbackLanguage: "en",
    });
    expect(catalog.get("ja")).toBe(mockStrings); // "en" bundle
  });

  it("should return requested bundle if exists", () => {
    const catalog = new TranslationCatalog({
      bundles: mockBundles,
      fallbackLanguage: "en",
    });
    expect(catalog.get("ko")).toBe(mockStrings);
  });

  it("should return all registered keys", () => {
    const catalog = new TranslationCatalog({
      bundles: mockBundles,
      fallbackLanguage: "en",
    });
    const keys = catalog.keys();
    expect(keys).toContain("en");
    expect(keys).toContain("ko");
    expect(keys.length).toBe(2);
  });

  it("should convert to record", () => {
    const catalog = new TranslationCatalog({
      bundles: mockBundles,
      fallbackLanguage: "en",
    });
    const record = catalog.toRecord();
    expect(record).toEqual(mockBundles);
  });

  // ...existing code...
  it("should ignore undefined bundles in constructor", () => {
    const catalog = new TranslationCatalog({
      bundles: {
        en: mockStrings,
        ko: undefined,
      } as any,
      fallbackLanguage: "en",
    });
    expect(catalog.has("ko")).toBe(false);
  });
});
