import {
    createDefaultSettings,
    DEFAULT_SETTINGS,
} from "@/constants/default-settings";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

describe("default-settings", () => {
  describe("createDefaultSettings", () => {
    it("should return a deep copy of default settings", () => {
      const settings = createDefaultSettings();

      expect(settings).toEqual(
        expect.objectContaining({
          gallery: DEFAULT_SETTINGS.gallery,
          toolbar: DEFAULT_SETTINGS.toolbar,
          download: DEFAULT_SETTINGS.download,
          tokens: DEFAULT_SETTINGS.tokens,
          accessibility: DEFAULT_SETTINGS.accessibility,
          features: DEFAULT_SETTINGS.features,
          version: DEFAULT_SETTINGS.version,
        }),
      );

      // Verify deep copy
      expect(settings.gallery).not.toBe(DEFAULT_SETTINGS.gallery);
      expect(settings.toolbar).not.toBe(DEFAULT_SETTINGS.toolbar);
    });

    it("should use provided timestamp", () => {
      const timestamp = 1234567890;
      const settings = createDefaultSettings(timestamp);
      expect(settings.lastModified).toBe(timestamp);
    });

    it("should use current time if no timestamp provided", () => {
      const before = Date.now();
      const settings = createDefaultSettings();
      const after = Date.now();

      expect(settings.lastModified).toBeGreaterThanOrEqual(before);
      expect(settings.lastModified).toBeLessThanOrEqual(after);
    });
  });

  describe("cloneValue fallback", () => {
    let originalStructuredClone: typeof globalThis.structuredClone;

    beforeEach(() => {
      originalStructuredClone = globalThis.structuredClone;
    });

    afterEach(() => {
      globalThis.structuredClone = originalStructuredClone;
    });

    it("should use JSON.parse/stringify when structuredClone is unavailable", () => {
      // @ts-expect-error - intentionally removing structuredClone for fallback test
      delete globalThis.structuredClone;

      const settings = createDefaultSettings(1000);

      // Verify settings are correctly created via JSON fallback
      expect(settings.gallery).toEqual(DEFAULT_SETTINGS.gallery);
      expect(settings.toolbar).toEqual(DEFAULT_SETTINGS.toolbar);
      expect(settings.download).toEqual(DEFAULT_SETTINGS.download);
      expect(settings.tokens).toEqual(DEFAULT_SETTINGS.tokens);
      expect(settings.accessibility).toEqual(DEFAULT_SETTINGS.accessibility);
      expect(settings.features).toEqual(DEFAULT_SETTINGS.features);
      expect(settings.lastModified).toBe(1000);

      // Verify deep copy still works
      expect(settings.gallery).not.toBe(DEFAULT_SETTINGS.gallery);
    });

    it("should handle nested objects correctly in JSON fallback", () => {
      // @ts-expect-error - intentionally removing structuredClone for fallback test
      delete globalThis.structuredClone;

      const settings1 = createDefaultSettings(2000);
      const settings2 = createDefaultSettings(3000);

      // Mutations to one should not affect the other
      expect(settings1.lastModified).toBe(2000);
      expect(settings2.lastModified).toBe(3000);
      expect(settings1.gallery).toEqual(settings2.gallery);
      expect(settings1.gallery).not.toBe(settings2.gallery);
    });
  });
});
