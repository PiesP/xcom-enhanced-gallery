import { getUserscript } from "@/shared/external/userscript";
import { CookieService } from "@/shared/services/cookie-service";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type Mock,
} from "vitest";

vi.mock("@/shared/external/userscript", () => ({
  getUserscript: vi.fn(),
}));

vi.mock("@/shared/logging", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe("CookieService Coverage", () => {
  let service: CookieService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let gmCookieMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    // @ts-ignore
    CookieService.instance = null;

    gmCookieMock = {
      list: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };

    (getUserscript as Mock).mockReturnValue({
      cookie: gmCookieMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GM_cookie errors", () => {
    it("should fallback to document.cookie when GM_cookie.list returns error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gmCookieMock.list.mockImplementation((_options: any, callback: any) => {
        callback(undefined, "GM Error");
      });

      // Mock document.cookie
      Object.defineProperty(document, "cookie", {
        value: "test=value",
        writable: true,
      });

      service = CookieService.getInstance();
      const cookies = await service.list();

      expect(cookies).toHaveLength(1);
      expect(cookies[0]?.name).toBe("test");
      expect(cookies[0]?.value).toBe("value");
    });

    it("should fallback to document.cookie when GM_cookie.list throws", async () => {
      gmCookieMock.list.mockImplementation(() => {
        throw new Error("GM Exception");
      });

      Object.defineProperty(document, "cookie", {
        value: "test=value",
        writable: true,
      });

      service = CookieService.getInstance();
      const cookies = await service.list();

      expect(cookies).toHaveLength(1);
    });

    it("should reject when GM_cookie.set returns error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gmCookieMock.set.mockImplementation((_details: any, callback: any) => {
        callback("Set Error");
      });

      service = CookieService.getInstance();
      await expect(service.set({ name: "test", value: "val" })).rejects.toThrow(
        "Set Error",
      );
    });

    it("should reject when GM_cookie.set throws", async () => {
      gmCookieMock.set.mockImplementation(() => {
        throw new Error("Set Exception");
      });

      service = CookieService.getInstance();
      await expect(service.set({ name: "test", value: "val" })).rejects.toThrow(
        "Set Exception",
      );
    });

    it("should reject when GM_cookie.delete returns error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gmCookieMock.delete.mockImplementation((_details: any, callback: any) => {
        callback("Delete Error");
      });

      service = CookieService.getInstance();
      await expect(service.delete({ name: "test" })).rejects.toThrow(
        "Delete Error",
      );
    });

    it("should reject when GM_cookie.delete throws", async () => {
      gmCookieMock.delete.mockImplementation(() => {
        throw new Error("Delete Exception");
      });

      service = CookieService.getInstance();
      await expect(service.delete({ name: "test" })).rejects.toThrow(
        "Delete Exception",
      );
    });
  });

  describe("Document undefined scenarios", () => {
    let originalDocument: any;

    beforeEach(() => {
      originalDocument = global.document;
      // @ts-ignore
      delete global.document;
      // @ts-ignore
      global.document = undefined;
    });

    afterEach(() => {
      global.document = originalDocument;
    });

    it("should handle undefined document in listFromDocument (via list fallback)", async () => {
      (getUserscript as Mock).mockReturnValue({}); // No GM_cookie
      service = CookieService.getInstance();

      const cookies = await service.list();
      expect(cookies).toEqual([]);
    });

    it("should handle undefined document in getValueSync", () => {
      service = CookieService.getInstance();
      expect(service.getValueSync("test")).toBeUndefined();
    });

    it("should throw error in set fallback when document is undefined", async () => {
      (getUserscript as Mock).mockReturnValue({}); // No GM_cookie
      service = CookieService.getInstance();

      await expect(service.set({ name: "test", value: "val" })).rejects.toThrow(
        "Cannot set cookie: document is not available",
      );
    });

    it("should handle undefined document in delete fallback (expireDocumentCookie)", async () => {
      (getUserscript as Mock).mockReturnValue({}); // No GM_cookie
      service = CookieService.getInstance();

      // Should not throw
      await service.delete({ name: "test" });
    });
  });

  describe("resolveCookieAPI", () => {
    it("should handle getUserscript throwing error", () => {
      (getUserscript as Mock).mockImplementation(() => {
        throw new Error("Userscript error");
      });

      // Should not throw, just return null (or check global)
      service = CookieService.getInstance();
      expect(service.hasNativeAccess()).toBe(false);
    });
  });
});
