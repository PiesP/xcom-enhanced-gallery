/**
 * SettingsService security hardening tests
 */

import { afterEach, describe, expect, it } from 'vitest';
import {
  SettingsSecurityError,
  SettingsService,
} from '@/features/settings/services/SettingsService';
import type { NestedSettingKey } from '@/features/settings/types/settings.types';

const MALICIOUS_KEY = 'tokens.__proto__.polluted' as NestedSettingKey;

describe('SettingsService prototype pollution guards', () => {
  afterEach(() => {
    Reflect.deleteProperty(Object.prototype as Record<string, unknown>, 'polluted');
  });

  it('rejects prototype pollution via set()', async () => {
    const service = new SettingsService();

    await expect(service.set(MALICIOUS_KEY, true)).rejects.toBeInstanceOf(SettingsSecurityError);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('rejects prototype pollution via updateBatch()', async () => {
    const service = new SettingsService();
    const updates = Object.create(null) as Partial<Record<NestedSettingKey, unknown>>;
    updates[MALICIOUS_KEY] = true;

    await expect(service.updateBatch(updates)).rejects.toBeInstanceOf(SettingsSecurityError);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('rejects prototype pollution attempts during importSettings()', async () => {
    const service = new SettingsService();
    const exported = service.exportSettings();
    const payload = exported.replace(
      '"tokens": {',
      '"tokens": {"__proto__": {"polluted": true }, '
    );

    await expect(service.importSettings(payload)).rejects.toBeInstanceOf(SettingsSecurityError);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
