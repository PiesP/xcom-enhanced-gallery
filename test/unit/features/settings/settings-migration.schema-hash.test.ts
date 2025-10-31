import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsService } from '@/features/settings/services/settings-service';
import { DEFAULT_SETTINGS } from '@/constants';
import { InMemoryStorageAdapter } from '../../../__mocks__/in-memory-storage-adapter';

const STORAGE_KEY = 'xeg-app-settings';

function stripVolatile(obj: any) {
  const { lastModified, __schemaHash, ...rest } = obj;
  return rest;
}

describe('SettingsService – SETTINGS-MIG-HASH-01', () => {
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    vi.useFakeTimers();
  });

  it('migrates and saves when stored __schemaHash mismatches current', async () => {
    // Simulate older stored settings missing some keys and with old hash
    const legacy: any = {
      version: '0.9.0',
      gallery: { enableKeyboardNav: false },
      __schemaHash: 'deadbeef',
      lastModified: Date.now() - 1000,
    };
    await storage.setItem(STORAGE_KEY, JSON.stringify(legacy));

    const svc = new SettingsService(storage);
    await svc.initialize();

    const savedJson = await storage.getItem(STORAGE_KEY);
    expect(savedJson).toBeDefined();
    const saved = JSON.parse(savedJson!) as any;
    expect(saved.__schemaHash).toBeTypeOf('string');
    // The service should have filled defaults while preserving explicit values
    expect(saved.gallery.enableKeyboardNav).toBe(false);
    expect(saved.download).toBeDefined();
    expect(saved.tokens).toBeDefined();
  });

  it('first-run initializes defaults and writes current __schemaHash', async () => {
    const svc = new SettingsService(storage);
    await svc.initialize();
    const savedJson = await storage.getItem(STORAGE_KEY);
    expect(savedJson).toBeDefined();
    const saved = JSON.parse(savedJson!) as any;
    expect(saved.__schemaHash).toBeTypeOf('string');
    expect(stripVolatile(saved)).toEqual(stripVolatile(DEFAULT_SETTINGS));
  });

  it('idempotent: repeated initialize does not change persisted structure', async () => {
    const svc = new SettingsService(storage);
    await svc.initialize();
    const firstJson = await storage.getItem(STORAGE_KEY);
    expect(firstJson).toBeDefined();
    const first = JSON.parse(firstJson!) as any;
    await svc.cleanup();

    const svc2 = new SettingsService(storage);
    await svc2.initialize();
    const secondJson = await storage.getItem(STORAGE_KEY);
    expect(secondJson).toBeDefined();
    const second = JSON.parse(secondJson!) as any;

    expect(stripVolatile(second)).toEqual(stripVolatile(first));
    expect(second.__schemaHash).toEqual(first.__schemaHash);
  });
});
