import {
    cleanupVendors,
    getSolid,
    getVendorInitializationReport,
    getVendorStatuses,
    getVendorVersions,
    initializeVendors,
    isVendorInitialized,
    isVendorsInitialized,
    registerVendorCleanupOnUnload,
    resetVendorManagerInstance,
    validateVendors,
} from "@shared/external/vendors";
import { describe, expect, it } from "vitest";

describe("Vendor Layer", () => {
  it("should export Solid API", () => {
    const solid = getSolid();
    expect(solid).toBeDefined();
    expect(solid.createSignal).toBeDefined();
    expect(solid.createEffect).toBeDefined();
    expect(solid.createMemo).toBeDefined();
  });

  it("should handle initialization stubs", async () => {
    await expect(initializeVendors()).resolves.toBeUndefined();
  });

  it("should handle cleanup stubs", () => {
    expect(() => cleanupVendors()).not.toThrow();
  });

  it("should handle cleanup on unload registration", () => {
    expect(() => registerVendorCleanupOnUnload()).not.toThrow();
  });

  it("should validate vendors", () => {
    const result = validateVendors();
    expect(result.success).toBe(true);
    expect(result.loadedLibraries).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("should return empty vendor versions", () => {
    expect(getVendorVersions()).toEqual({});
  });

  it("should return empty initialization report", () => {
    expect(getVendorInitializationReport()).toEqual({});
  });

  it("should return empty vendor statuses", () => {
    expect(getVendorStatuses()).toEqual({});
  });

  it("should return true for initialization checks", () => {
    expect(isVendorInitialized()).toBe(true);
    expect(isVendorsInitialized()).toBe(true);
  });

  it("should handle reset vendor manager", () => {
    expect(() => resetVendorManagerInstance()).not.toThrow();
  });
});
