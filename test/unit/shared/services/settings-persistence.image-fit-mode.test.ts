/**
 * Settings persistence: imageFitMode via settings-access bridge
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Use real tryGet through service-bridge by wiring a minimal CoreService registration
import { registerSettingsManager } from '@/shared/container/service-accessors';
import { SettingsService } from '@/features/settings/services/SettingsService';
import { getSetting, setSetting } from '@/shared/container/settings-access';
import getUserscript from '@/shared/external/userscript/adapter';

// Basic localStorage polyfill to operate in JSDOM
const memoryStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('localStorage', memoryStorage as any);

describe('Settings persistence – gallery.imageFitMode', () => {
  beforeEach(async () => {
    // Fresh service each test
    const svc = new SettingsService();
    await svc.initialize();
    registerSettingsManager(svc);
  });

  it('persists imageFitMode immediately and loads back', async () => {
    // default should be fitWidth (from constants)
    const initial = getSetting('gallery.imageFitMode', 'fitContainer');
    expect(initial).toBeTypeOf('string');

    await setSetting('gallery.imageFitMode', 'fitHeight');

    // Verify persisted content reflects change (GM storage → fallback localStorage)
    const us = getUserscript();
    const gmRaw = await us.storage.get('xeg-app-settings');
    const raw = gmRaw ?? (globalThis as any).localStorage.getItem('xeg-app-settings');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed?.gallery?.imageFitMode).toBe('fitHeight');

    // Simulate new service reading the value
    const svc2 = new SettingsService();
    await svc2.initialize();
    registerSettingsManager(svc2);

    const loaded = getSetting('gallery.imageFitMode', 'fitContainer');
    expect(loaded).toBe('fitHeight');
  });
});
