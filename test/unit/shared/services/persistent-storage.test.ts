// Vitest globals (describe/it/expect/vi) are provided by tsconfig "vitest/globals"; avoid importing runtime helpers here

import { logger } from "@shared/logging";
import {
  PersistentStorage,
  getPersistentStorage,
} from "@shared/services/persistent-storage";

// Mock dependencies
const mockUserscript = {
  setValue: vi.fn(),
  getValue: vi.fn(),
  deleteValue: vi.fn(),
};

vi.mock("@shared/external/userscript", () => ({
  getUserscript: () => mockUserscript,
}));

vi.mock("@shared/logging", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("PersistentStorage", () => {
  let storage: PersistentStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (PersistentStorage as any).instance = null;
    storage = PersistentStorage.getInstance();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (PersistentStorage as any).instance = null;
  });

  describe("Singleton", () => {
    it("should return the same instance", () => {
      const instance1 = PersistentStorage.getInstance();
      const instance2 = getPersistentStorage();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(storage);
    });
  });

  describe("set", () => {
    it("should store string values directly", async () => {
      await storage.set("key", "value");
      expect(mockUserscript.setValue).toHaveBeenCalledWith("key", "value");
    });

    it("should serialize objects to JSON", async () => {
      const data = { foo: "bar" };
      await storage.set("key", data);
      expect(mockUserscript.setValue).toHaveBeenCalledWith(
        "key",
        JSON.stringify(data),
      );
    });

    it("should log error and rethrow on failure", async () => {
      const error = new Error("Storage failed");
      mockUserscript.setValue.mockRejectedValue(error);

      await expect(storage.set("key", "value")).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("failed"),
        error,
      );
    });
  });

  describe("get", () => {
    it("should return parsed JSON object", async () => {
      const data = { foo: "bar" };
      mockUserscript.getValue.mockResolvedValue(JSON.stringify(data));

      const result = await storage.get("key");
      expect(result).toEqual(data);
    });

    it("should return raw string if parsing fails", async () => {
      const raw = "not-json";
      mockUserscript.getValue.mockResolvedValue(raw);

      const result = await storage.get("key");
      expect(result).toBe(raw);
    });

    it("should return default value if undefined", async () => {
      mockUserscript.getValue.mockResolvedValue(undefined);

      const result = await storage.get("key", "default");
      expect(result).toBe("default");
    });

    it("should return default value if null", async () => {
      mockUserscript.getValue.mockResolvedValue(null);

      const result = await storage.get("key", "default");
      expect(result).toBe("default");
    });

    it("should return default value on GM missing error", async () => {
      mockUserscript.getValue.mockRejectedValue(
        new Error("GM_getValue not available"),
      );

      const result = await storage.get("key", "default");
      expect(result).toBe("default");
      // Should not log an error when GM_getValue is missing (fallback behavior)
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should log error and return default value on other errors", async () => {
      const error = new Error("Unknown error");
      mockUserscript.getValue.mockRejectedValue(error);

      const result = await storage.get("key", "default");
      expect(result).toBe("default");
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("failed"),
        error,
      );
    });
  });

  describe("has", () => {
    it("should return true if value exists", async () => {
      mockUserscript.getValue.mockResolvedValue("value");
      expect(await storage.has("key")).toBe(true);
    });

    it("should return false if value is undefined", async () => {
      mockUserscript.getValue.mockResolvedValue(undefined);
      expect(await storage.has("key")).toBe(false);
    });

    it("should return false on error", async () => {
      mockUserscript.getValue.mockRejectedValue(new Error("Error"));
      expect(await storage.has("key")).toBe(false);
    });

    it("should return false if value is null", async () => {
      mockUserscript.getValue.mockResolvedValue(null);
      expect(await storage.has("key")).toBe(false);
    });
  });

  describe("remove", () => {
    it("should delete value", async () => {
      await storage.remove("key");
      expect(mockUserscript.deleteValue).toHaveBeenCalledWith("key");
    });

    it("should log error and rethrow on failure", async () => {
      const error = new Error("Delete failed");
      mockUserscript.deleteValue.mockRejectedValue(error);

      await expect(storage.remove("key")).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("failed"),
        error,
      );
    });
  });

  describe("getSync", () => {
    it("should return default if GM_getValue is undefined", () => {
      // Ensure GM_getValue is undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).GM_getValue = undefined;

      expect(storage.getSync("key", "default")).toBe("default");
    });

    it("should return parsed value from GM_getValue", () => {
      const data = { foo: "bar" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).GM_getValue = vi
        .fn()
        .mockReturnValue(JSON.stringify(data));

      expect(storage.getSync("key")).toEqual(data);
    });

    it("should return raw value if parsing fails", () => {
      const raw = "raw-value";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).GM_getValue = vi.fn().mockReturnValue(raw);

      expect(storage.getSync("key")).toBe(raw);
    });

    it("should return default if GM_getValue returns promise (async)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).GM_getValue = vi
        .fn()
        .mockReturnValue(Promise.resolve("value"));

      expect(storage.getSync("key", "default")).toBe("default");
    });

    it("should return default on error", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).GM_getValue = vi.fn().mockImplementation(() => {
        throw new Error("Sync error");
      });

      expect(storage.getSync("key", "default")).toBe("default");
    });

    it("should return default if GM_getValue returns null", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).GM_getValue = vi.fn().mockReturnValue(null);

      expect(storage.getSync("key", "default")).toBe("default");
    });
  });
});
