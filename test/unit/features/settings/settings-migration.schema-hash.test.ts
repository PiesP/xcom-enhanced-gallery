import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { SettingsService } from '@/features/settings/services/settings-service';
import { DEFAULT_SETTINGS } from '@/features/settings/types/settings.types';

const STORAGE_KEY = 'xeg-app-settings';

function stripVolatile(obj: any) {
  const { lastModified, __schemaHash, ...rest } = obj;
  return rest;
}

describe('SettingsService – SETTINGS-MIG-HASH-01', () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
      url: 'https://x.com/home',
      runScripts: 'outside-only',
      resources: 'usable',
    });

    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      location: dom.window.location,
      localStorage: dom.window.localStorage,
      sessionStorage: dom.window.sessionStorage,
    });

    vi.useFakeTimers();
    dom.window.localStorage.clear();
  });

  it('migrates and saves when stored __schemaHash mismatches current', async () => {
    // Simulate older stored settings missing some keys and with old hash
    const legacy: any = {
      version: '0.9.0',
      gallery: { enableKeyboardNav: false },
      __schemaHash: 'deadbeef',
      lastModified: Date.now() - 1000,
    };
    dom.window.localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));

    const svc = new SettingsService();
    await svc.initialize();

    const saved = JSON.parse(dom.window.localStorage.getItem(STORAGE_KEY)!) as any;
    expect(saved.__schemaHash).toBeTypeOf('string');
    // The service should have filled defaults while preserving explicit values
    expect(saved.gallery.enableKeyboardNav).toBe(false);
    expect(saved.download).toBeDefined();
    expect(saved.tokens).toBeDefined();
  });

  it('first-run initializes defaults and writes current __schemaHash', async () => {
    const svc = new SettingsService();
    await svc.initialize();
    const saved = JSON.parse(dom.window.localStorage.getItem(STORAGE_KEY)!) as any;
    expect(saved.__schemaHash).toBeTypeOf('string');
    expect(stripVolatile(saved)).toEqual(stripVolatile(DEFAULT_SETTINGS));
  });

  it('idempotent: repeated initialize does not change persisted structure', async () => {
    const svc = new SettingsService();
    await svc.initialize();
    const first = JSON.parse(dom.window.localStorage.getItem(STORAGE_KEY)!) as any;
    await svc.cleanup();

    const svc2 = new SettingsService();
    await svc2.initialize();
    const second = JSON.parse(dom.window.localStorage.getItem(STORAGE_KEY)!) as any;

    expect(stripVolatile(second)).toEqual(stripVolatile(first));
    expect(second.__schemaHash).toEqual(first.__schemaHash);
  });
});
