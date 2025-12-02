import { DEFAULT_LANGUAGE } from "@shared/constants/i18n/translation-registry";
import { LanguageService } from "@shared/services/language-service";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
const { mockStorage } = vi.hoisted(() => ({
  mockStorage: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock("@shared/services/persistent-storage", () => ({
  getPersistentStorage: () => mockStorage,
}));

vi.mock("@shared/logging", () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock i18n modules
const { mockTranslate } = vi.hoisted(() => ({
  mockTranslate: vi.fn(),
}));

vi.mock("@shared/i18n", () => {
  return {
    Translator: class {
      languages = ["en", "ko", "ja"];
      translate = mockTranslate;
    },
    TranslationCatalog: class {},
  };
});

describe("LanguageService", () => {
  let service: LanguageService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LanguageService();

    Object.defineProperty(globalThis, "navigator", {
      value: { language: "en-US" },
      writable: true,
      configurable: true,
    });
  });

  describe("Initialization", () => {
    it("should initialize with default language 'auto'", () => {
      expect(service.getCurrentLanguage()).toBe("auto");
    });

    it("should restore language from storage on initialize", async () => {
      mockStorage.get.mockResolvedValue("ko");
      await service.initialize();
      expect(service.getCurrentLanguage()).toBe("ko");
    });

    it("should fallback to 'auto' if storage returns null", async () => {
      mockStorage.get.mockResolvedValue(null);
      await service.initialize();
      expect(service.getCurrentLanguage()).toBe("auto");
    });

    it("should normalize invalid language from storage", async () => {
      mockStorage.get.mockResolvedValue("invalid-lang");
      await service.initialize();
      expect(service.getCurrentLanguage()).toBe(DEFAULT_LANGUAGE);
    });
  });

  describe("Language Detection", () => {
    it("should detect browser language", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { language: "ko-KR" },
        writable: true,
        configurable: true,
      });
      expect(service.detectLanguage()).toBe("ko");
    });

    it("should fallback to default if browser language is not supported", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { language: "fr-FR" },
        writable: true,
        configurable: true,
      });
      expect(service.detectLanguage()).toBe(DEFAULT_LANGUAGE);
    });

    it("should handle undefined navigator", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(service.detectLanguage()).toBe(DEFAULT_LANGUAGE);
    });
  });

  describe("Language Management", () => {
    it("should set language and persist it", async () => {
      await service.setLanguage("ja");
      expect(service.getCurrentLanguage()).toBe("ja");
      expect(mockStorage.set).toHaveBeenCalledWith("xeg-language", "ja");
    });

    it("should notify listeners on language change", () => {
      const listener = vi.fn();
      service.onLanguageChange(listener);

      service.setLanguage("ko");
      expect(listener).toHaveBeenCalledWith("ko");
    });

    it("should not notify if language is unchanged", () => {
      service.setLanguage("en"); // Set initial
      const listener = vi.fn();
      service.onLanguageChange(listener);

      service.setLanguage("en"); // Set same
      expect(listener).not.toHaveBeenCalled();
      // mockStorage.set called once for the first setLanguage
      expect(mockStorage.set).toHaveBeenCalledTimes(1);
    });

    it("should normalize unsupported language when setting", () => {
      // @ts-expect-error Testing runtime validation
      service.setLanguage("fr");
      expect(service.getCurrentLanguage()).toBe(DEFAULT_LANGUAGE);
    });
  });

  describe("Translation", () => {
    it("should delegate translation to translator", () => {
      mockTranslate.mockReturnValue("Translated Text");
      service.setLanguage("ko");

      // @ts-expect-error Testing with arbitrary key for mock
      const result = service.translate("test.key", { param: "value" });

      expect(result).toBe("Translated Text");
      expect(mockTranslate).toHaveBeenCalledWith("ko", "test.key", {
        param: "value",
      });
    });

    it("should use detected language when current language is 'auto'", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { language: "ja-JP" },
        writable: true,
        configurable: true,
      });
      service.setLanguage("auto");

      // @ts-expect-error Testing with arbitrary key for mock
      service.translate("test.key");

      expect(mockTranslate).toHaveBeenCalledWith("ja", "test.key", undefined);
    });
  });

  describe("Cleanup", () => {
    it("should clear listeners on destroy", () => {
      const listener = vi.fn();
      service.onLanguageChange(listener);

      // Call onDestroy directly
      // @ts-expect-error Accessing protected method for testing
      service.onDestroy();

      // Setting language after destroy should not call listener
      // @ts-expect-error Accessing private property
      service.currentLanguage = "auto"; // reset to trigger change
      service.setLanguage("ko");

      // The listener was added before destroy, but cleared
      // After clearing, setting language won't notify it
      expect(listener).not.toHaveBeenCalled();
    });

    it("should unsubscribe listener when callback is called", () => {
      const listener = vi.fn();
      const unsubscribe = service.onLanguageChange(listener);

      service.setLanguage("ko");
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      // @ts-expect-error Accessing private property
      service.currentLanguage = "auto"; // reset to trigger change
      service.setLanguage("ja");

      // Should not be called again after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle storage.get failure in onInitialize", async () => {
      mockStorage.get.mockRejectedValue(new Error("Storage error"));

      // Should not throw
      await service.initialize();

      // Should keep default value
      expect(service.getCurrentLanguage()).toBe("auto");
    });

    it("should handle storage.set failure in persistLanguage", async () => {
      mockStorage.set.mockRejectedValue(new Error("Storage error"));

      // Should not throw
      service.setLanguage("ko");

      // Language should still be set internally
      expect(service.getCurrentLanguage()).toBe("ko");
    });

    it("should handle listener throwing error", () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error("Listener error");
      });
      const normalListener = vi.fn();

      service.onLanguageChange(errorListener);
      service.onLanguageChange(normalListener);

      // Should not throw and should call all listeners
      service.setLanguage("ko");

      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();
    });

    it("should log warning for unsupported language", async () => {
      const { logger } = await import("@shared/logging");

      // @ts-expect-error Testing runtime validation
      service.setLanguage("unsupported-lang");

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unsupported language")
      );
    });
  });

  describe("Available Languages", () => {
    it("should return available languages", () => {
      const languages = service.getAvailableLanguages();
      expect(languages).toEqual(["en", "ko", "ja"]);
    });
  });
});
