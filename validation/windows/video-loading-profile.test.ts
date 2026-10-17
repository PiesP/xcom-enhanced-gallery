// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { chromium } from '@playwright/test';
import { assertQuotedOriginLink } from './install-profile.ts';
import { restoreStoredVideoSettings } from './live-page.ts';
import {
  readAppliedVideoGallerySettings,
  runVideoLoadingProfile,
} from './video-loading-profile.ts';

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

test('video loading retains primary and restoration failures in its receipt and aggregate', async () => {
  const output = mkdtempSync(join(tmpdir(), 'xeg-video-restoration-'));
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const extensionPage = await context.newPage();
    await extensionPage.evaluate(() => {
      const values: Record<string, unknown> = {
        'xeg-app-settings': { gallery: { videoClickMode: 'block-all' } },
      };
      let reads = 0;
      let writes = 0;
      Object.assign(globalThis, {
        chrome: {
          storage: {
            local: {
              get: async (key: string) => {
                reads++;
                if (reads === 2) {
                  throw new Error('primary read failed');
                }
                return Object.hasOwn(values, key) ? { [key]: values[key] } : {};
              },
              set: async (next: Record<string, unknown>) => {
                writes++;
                if (writes === 2) {
                  throw new Error('restore write failed');
                }
                Object.assign(values, next);
              },
              remove: async (key: string) => {
                Reflect.deleteProperty(values, key);
              },
            },
          },
        },
      });
    });
    const nativeLoopback = {
      setRecoveryPayloads: () => {},
      mark: () => {},
      since: () => [],
      snapshot: () => ({}),
    } as unknown as Parameters<typeof runVideoLoadingProfile>[0]['nativeLoopback'];
    await assert.rejects(
      runVideoLoadingProfile({
        context,
        page,
        extensionPage,
        fixtureUrl: 'https://x.com/videofixture/status/4666000111222333444',
        tweetId: '4666000111222333444',
        videoPayloads: { valid: Buffer.from('fixture') },
        downloads: output,
        output,
        nativeLoopback,
        root: output,
      }),
      (error: unknown) => {
        assert(error instanceof AggregateError);
        assert.equal(error.errors.length, 2);
        assert.match(String(error.errors[0]), /primary read failed/);
        assert.match(String(error.errors[1]), /restore write failed/);
        return true;
      }
    );
    const receipt = JSON.parse(
      readFileSync(join(output, 'video-loading-failure.json'), 'utf8')
    ) as {
      error: string;
      cleanup: {
        routeRemoved: boolean;
        settingsRestored: boolean;
        settingsError: string;
        viewportRestored: boolean;
      };
    };
    assert.match(receipt.error, /primary read failed/);
    assert.match(receipt.cleanup.settingsError, /restore write failed/);
    assert.equal(receipt.cleanup.settingsRestored, false);
    assert.equal(receipt.cleanup.routeRemoved, true);
    assert.equal(receipt.cleanup.viewportRestored, true);
  } finally {
    await browser.close();
    rmSync(output, { recursive: true, force: true });
  }
});

test('quoted source link waits for selected owner and reports persistent mismatch', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const installPanel = async () => {
      await page.setContent(`
        <div data-xeg-gallery-container>
          <div data-gallery-element="toolbar" data-current-index="0" data-focused-index="1">
            <span id="xeg-toolbar-counter" data-position="2" data-total="2" data-focused-index="1"></span>
            <button id="tweet-text-button">Post source</button>
            <div id="toolbar-tweet-panel" hidden>
              <a href="https://x.com/stale/status/1">Stale source</a>
            </div>
          </div>
        </div>
      `);
      await page.evaluate(() => {
        const button = document.querySelector('#tweet-text-button');
        const panel = document.querySelector('#toolbar-tweet-panel');
        if (!(button instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) {
          throw new Error('Quoted source fixture is incomplete');
        }
        button.addEventListener('click', () => {
          panel.hidden = !panel.hidden;
        });
      });
    };
    const gallery = page.locator('[data-xeg-gallery-container]');
    const expected = 'https://x.com/quote_owner/status/9333333333333333333';
    await installPanel();
    await page.evaluate((url) => {
      setTimeout(() => {
        document.querySelector('#toolbar-tweet-panel a')?.setAttribute('href', url);
      }, 150);
    }, expected);
    assert.equal(await assertQuotedOriginLink(gallery, expected), expected);
    assert.equal(await page.locator('#toolbar-tweet-panel').isHidden(), true);

    await installPanel();
    await assert.rejects(assertQuotedOriginLink(gallery, expected), (error: unknown) => {
      assert(error instanceof Error);
      assert.equal(
        error.message,
        `Toolbar source link must identify the selected post: ${JSON.stringify({
          expectedUrl: expected,
          allowMediaPath: false,
          observed: {
            href: 'https://x.com/stale/status/1',
            currentIndex: '0',
            focusedIndex: '1',
            position: '2',
            total: '2',
            counterFocusedIndex: '1',
          },
        })}`
      );
      return true;
    });
    assert.equal(await page.locator('#toolbar-tweet-panel').isHidden(), true);
  } finally {
    await browser.close();
  }
});
