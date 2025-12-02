import {
    detectEnvironment,
    isGMAPIAvailable,
} from "@shared/external/userscript/environment-detector";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Environment Detector", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("detectEnvironment", () => {
    it("should detect light mode by default", () => {
      const env = detectEnvironment();
      expect(env.colorScheme).toBe("light");
    });

    it("should detect dark mode", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(prefers-color-scheme: dark)",
          media: query,
          onchange: null,
          addListener: vi.fn(), // deprecated
          removeListener: vi.fn(), // deprecated
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const env = detectEnvironment();
      expect(env.colorScheme).toBe("dark");
    });

    it("should detect language", () => {
      Object.defineProperty(navigator, "language", {
        value: "ko-KR",
        configurable: true,
      });
      const env = detectEnvironment();
      expect(env.language).toBe("ko");
    });

    it("should fallback to default language", () => {
      Object.defineProperty(navigator, "language", {
        value: "fr-FR",
        configurable: true,
      });
      const env = detectEnvironment();
      expect(env.language).toBe("en");
    });

    it("should fallback to light mode if matchMedia is missing", () => {
      Object.defineProperty(window, "matchMedia", {
        value: undefined,
        writable: true,
      });
      const env = detectEnvironment();
      expect(env.colorScheme).toBe("light");
    });

    it("should fallback to light mode if matchMedia throws", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => {
          throw new Error("Access denied");
        }),
      });
      const env = detectEnvironment();
      expect(env.colorScheme).toBe("light");
    });
  });

  describe("isGMAPIAvailable", () => {
    it("should return false for unknown API", () => {
      expect(isGMAPIAvailable("unknown")).toBe(false);
    });

    it("should return true if API is available", () => {
      vi.stubGlobal("GM_download", vi.fn());
      expect(isGMAPIAvailable("download")).toBe(true);
    });

    it("should return false if API is not available", () => {
      expect(isGMAPIAvailable("download")).toBe(false);
    });

    it("should check GM_cookie correctly", () => {
      vi.stubGlobal("GM_cookie", { list: vi.fn() });
      expect(isGMAPIAvailable("cookie")).toBe(true);
    });

    it("should return false if GM_cookie is missing list method", () => {
      vi.stubGlobal("GM_cookie", {});
      expect(isGMAPIAvailable("cookie")).toBe(false);
    });

    it("should check all supported APIs", () => {
      const apis = [
        "getValue",
        "setValue",
        "download",
        "notification",
        "setClipboard",
        "registerMenuCommand",
        "deleteValue",
        "listValues",
      ];

      apis.forEach((api) => {
        const gmName = `GM_${api}`;
        vi.stubGlobal(gmName, vi.fn());
        expect(isGMAPIAvailable(api)).toBe(true);
        vi.unstubAllGlobals();
        expect(isGMAPIAvailable(api)).toBe(false);
      });
    });
  });
});
