/**
 * @fileoverview Tests for promise helper utilities
 */
import {
    promisifyCallback,
    promisifyVoidCallback,
    tryWithFallback,
    tryWithFallbackAsync,
} from "@shared/utils/async/promise-helpers";
import { describe, expect, it, vi } from "vitest";

describe("promisifyCallback", () => {
    it("should resolve with result on success", async () => {
        const executor = (callback: (result?: number, error?: string) => void) => {
            callback(42, undefined);
        };

        const result = await promisifyCallback(executor);
        expect(result).toBe(42);
    });

    it("should reject with error on failure", async () => {
        const executor = (callback: (result?: number, error?: string) => void) => {
            callback(undefined, "Something went wrong");
        };

        await expect(promisifyCallback(executor)).rejects.toThrow(
            "Something went wrong",
        );
    });

    it("should use fallback when error occurs", async () => {
        const executor = (callback: (result?: number, error?: string) => void) => {
            callback(undefined, "Error");
        };

        const result = await promisifyCallback(executor, {
            fallback: () => 99,
        });

        expect(result).toBe(99);
    });

    it("should handle thrown exceptions", async () => {
        const executor = () => {
            throw new Error("Sync error");
        };

        await expect(promisifyCallback(executor)).rejects.toThrow("Sync error");
    });

    it("should use fallback on thrown exception", async () => {
        const executor = () => {
            throw new Error("Sync error");
        };

        const result = await promisifyCallback(executor, {
            fallback: () => "fallback value",
        });

        expect(result).toBe("fallback value");
    });

    it("should support async fallback", async () => {
        const executor = (callback: (result?: number, error?: string) => void) => {
            callback(undefined, "Error");
        };

        const result = await promisifyCallback(executor, {
            fallback: async () => {
                return Promise.resolve(999);
            },
        });

        expect(result).toBe(999);
    });
});

describe("promisifyVoidCallback", () => {
    it("should resolve when callback is called without error", async () => {
        const executor = (callback: (error?: string) => void) => {
            callback(undefined);
        };

        await expect(promisifyVoidCallback(executor)).resolves.toBeUndefined();
    });

    it("should reject when callback is called with error", async () => {
        const executor = (callback: (error?: string) => void) => {
            callback("Operation failed");
        };

        await expect(promisifyVoidCallback(executor)).rejects.toThrow(
            "Operation failed",
        );
    });

    it("should handle thrown exceptions", async () => {
        const executor = () => {
            throw new Error("Sync error");
        };

        await expect(promisifyVoidCallback(executor)).rejects.toThrow("Sync error");
    });

    it("should handle null error correctly", async () => {
        const executor = (callback: (error?: string | null) => void) => {
            callback(null);
        };

        await expect(promisifyVoidCallback(executor)).resolves.toBeUndefined();
    });
});

describe("tryWithFallback", () => {
    it("should return result on success", () => {
        const result = tryWithFallback(() => 42, 0);
        expect(result).toBe(42);
    });

    it("should return fallback value on error", () => {
        const result = tryWithFallback(() => {
            throw new Error("Error");
        }, 99);
        expect(result).toBe(99);
    });

    it("should call fallback function on error", () => {
        const fallbackFn = vi.fn(() => "fallback");
        const result = tryWithFallback(() => {
            throw new Error("Error");
        }, fallbackFn);

        expect(result).toBe("fallback");
        expect(fallbackFn).toHaveBeenCalled();
    });
});

describe("tryWithFallbackAsync", () => {
    it("should return result on success", async () => {
        const result = await tryWithFallbackAsync(async () => 42, 0);
        expect(result).toBe(42);
    });

    it("should return fallback value on error", async () => {
        const result = await tryWithFallbackAsync(async () => {
            throw new Error("Error");
        }, 99);
        expect(result).toBe(99);
    });

    it("should call async fallback function on error", async () => {
        const fallbackFn = vi.fn(async () => "async fallback");
        const result = await tryWithFallbackAsync(async () => {
            throw new Error("Error");
        }, fallbackFn);

        expect(result).toBe("async fallback");
        expect(fallbackFn).toHaveBeenCalled();
    });

    it("should handle sync functions", async () => {
        const result = await tryWithFallbackAsync(
            () => 42,
            () => 99,
        );
        expect(result).toBe(42);
    });
});
