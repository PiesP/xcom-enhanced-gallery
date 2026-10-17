// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from '@playwright/test';
import { restoreStoredVideoSettings } from './live-page.ts';
import { readAppliedVideoGallerySettings } from './video-loading-profile.ts';

test('installed video settings readback runs its callback in the browser realm', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.evaluate(() => {
      Object.assign(globalThis, {
        chrome: {
          storage: {
            local: {
              get: async (key: string) => ({
                [key]: {
                  gallery: { videoClickMode: 'allow-all', preloadCount: 20 },
                },
              }),
            },
          },
        },
      });
    });

    assert.deepEqual(await readAppliedVideoGallerySettings(page), {
      videoClickMode: 'allow-all',
      preloadCount: 20,
    });
  } finally {
    await browser.close();
  }
});

test('settings restoration serializes raw values into separate browser evaluations', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.evaluate(() => {
      const values: Record<string, unknown> = {
        'xeg-app-settings': 'changed',
        unrelated: { retained: true },
      };
      Object.assign(globalThis, {
        __settingsTestValues: values,
        chrome: {
          storage: {
            local: {
              get: async (key: string) =>
                Object.hasOwn(values, key) ? { [key]: values[key] } : {},
              set: async (next: Record<string, unknown>) => Object.assign(values, next),
              remove: async (key: string) => {
                Reflect.deleteProperty(values, key);
              },
            },
          },
        },
      });
    });
    const value = { __xegStorageEnvelope: 1, updatedAt: 42, value: ['raw', null] };
    assert.equal(await restoreStoredVideoSettings(page, { exists: true, value }), true);
    assert.deepEqual(
      await page.evaluate(
        () =>
          (globalThis as unknown as { __settingsTestValues: Record<string, unknown> })
            .__settingsTestValues
      ),
      { 'xeg-app-settings': value, unrelated: { retained: true } }
    );
    assert.equal(await restoreStoredVideoSettings(page, { exists: false, value: null }), true);
    assert.deepEqual(
      await page.evaluate(
        () =>
          (globalThis as unknown as { __settingsTestValues: Record<string, unknown> })
            .__settingsTestValues
      ),
      { unrelated: { retained: true } }
    );
  } finally {
    await browser.close();
  }
});
