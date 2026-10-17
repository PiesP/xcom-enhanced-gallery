// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from '@playwright/test';
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
