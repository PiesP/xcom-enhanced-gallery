/**
 * @fileoverview Solid vendor initialization verification
 * @description Ensures the primary vendor surface initializes Solid APIs without reintroducing Preact getters.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const VENDOR_ENTRY = '@shared/external/vendors' as const;

describe('FRAME-ALT-001 Stage D Phase 3 — solid vendor initialization', () => {
  beforeEach(async () => {
    vi.resetModules();
    const { cleanupVendors, resetVendorManagerInstance } = await import(VENDOR_ENTRY);
    cleanupVendors();
    resetVendorManagerInstance();
  });

  afterEach(async () => {
    const { cleanupVendors, resetVendorManagerInstance } = await import(VENDOR_ENTRY);
    cleanupVendors();
    resetVendorManagerInstance();
    vi.resetModules();
  });

  it('initializes the solid vendor surface and exposes solid APIs', async () => {
    const {
      initializeVendors,
      isVendorsInitialized,
      getSolidCore,
      getSolidStore,
      getSolidWeb,
      getVendorStatuses,
      validateVendors,
    } = await import(VENDOR_ENTRY);

    expect(isVendorsInitialized()).toBe(false);

    await expect(initializeVendors()).resolves.toBeUndefined();

    expect(isVendorsInitialized()).toBe(true);

    const solidCore = getSolidCore();
    expect(solidCore).toBeDefined();
    expect(typeof solidCore.createSignal).toBe('function');
    expect(typeof solidCore.onCleanup).toBe('function');

    const solidStore = getSolidStore();
    expect(solidStore).toBeDefined();
    expect(typeof solidStore.createStore).toBe('function');

    const solidWeb = getSolidWeb();
    expect(solidWeb).toBeDefined();
    expect(typeof solidWeb.render).toBe('function');

    const statuses = getVendorStatuses();
    expect(statuses.solidCore).toBe(true);
    expect(statuses.solidStore).toBe(true);
    expect(statuses.solidWeb).toBe(true);

    const validation = await validateVendors();
    expect(validation.success).toBe(true);
    expect(validation.loadedLibraries).toEqual(
      expect.arrayContaining(['SolidCore', 'SolidStore', 'SolidWeb'])
    );
    expect(validation.skippedLibraries).toContain('fflate');
  });
});
