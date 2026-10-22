// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { chromium, type Locator } from '@playwright/test';
import { assertQuotedOriginLink } from './install-profile.ts';
import { restoreStoredVideoSettings } from './live-page.ts';
import {
  assertMetadataSourceRequestSettlement,
  readAppliedVideoGallerySettings,
  runVideoLoadingProfile,
} from './video-loading-profile.ts';

const observedRangeHandoff = {
  protocol: [
    { requestId: '4736.11', phase: 'request', atMs: 585, range: 'bytes=0-' },
    { requestId: '4736.11', phase: 'response', atMs: 600, status: 206 },
    {
      requestId: '4736.11',
      phase: 'failed',
      atMs: 1517,
      errorText: 'net::ERR_ABORTED',
    },
    { requestId: '4736.17', phase: 'request', atMs: 1522, range: 'bytes=98304-' },
    { requestId: '4736.17', phase: 'response', atMs: 1533, status: 206 },
    { requestId: '4736.17', phase: 'finished', atMs: 1534 },
  ],
  transfer: [
    {
      requestId: '4736.11',
      chunks: 2,
      dataBytes: 98304,
      encodedBytes: 32768,
      firstAtMs: 600,
      lastAtMs: 1514,
    },
    {
      requestId: '4736.17',
      chunks: 2,
      dataBytes: 18985,
      encodedBytes: 18985,
      firstAtMs: 1533,
      lastAtMs: 1533,
    },
  ],
};

test('a post-release abort followed by an exact byte-complete Range is settled truthfully', () => {
  const settled = assertMetadataSourceRequestSettlement(
    observedRangeHandoff.protocol,
    observedRangeHandoff.transfer,
    117289,
    1512
  );
  assert.deepEqual(settled, {
    outcome: 'aborted-continued',
    requests: [
      { requestId: '4736.11', rangeStart: 0, receivedBytes: 98304, terminal: 'aborted' },
      { requestId: '4736.17', rangeStart: 98304, receivedBytes: 18985, terminal: 'finished' },
    ],
  });
});

test('a single full finished source request remains valid', () => {
  const settled = assertMetadataSourceRequestSettlement(
    [
      { requestId: 'one', phase: 'request', atMs: 1, range: 'bytes=0-' },
      { requestId: 'one', phase: 'response', atMs: 2, status: 206 },
      { requestId: 'one', phase: 'finished', atMs: 4 },
    ],
    [
      {
        requestId: 'one',
        chunks: 1,
        dataBytes: 117289,
        encodedBytes: 117289,
        firstAtMs: 3,
        lastAtMs: 3,
      },
    ],
    117289,
    2
  );
  assert.equal(settled.outcome, 'finished');
  assert.equal(settled.requests[0]?.terminal, 'finished');
});

test('a single no-Range 200 response must finish the complete asset', () => {
  const protocol: Parameters<typeof assertMetadataSourceRequestSettlement>[0] = [
    { requestId: 'full', phase: 'request', atMs: 1, range: null },
    { requestId: 'full', phase: 'response', atMs: 2, status: 200 },
    { requestId: 'full', phase: 'finished', atMs: 4 },
  ];
  const transfer = [
    {
      requestId: 'full',
      chunks: 1,
      dataBytes: 117289,
      encodedBytes: 117289,
      firstAtMs: 3,
      lastAtMs: 3,
    },
  ];
  assert.deepEqual(assertMetadataSourceRequestSettlement(protocol, transfer, 117289, 2), {
    outcome: 'finished',
    requests: [{ requestId: 'full', rangeStart: 0, receivedBytes: 117289, terminal: 'finished' }],
  });
  transfer[0]!.dataBytes--;
  assert.throws(
    () => assertMetadataSourceRequestSettlement(protocol, transfer, 117289, 2),
    { name: 'AssertionError' },
    'partial full-body transfer'
  );
  transfer[0]!.dataBytes++;
  protocol[2] = {
    requestId: 'full',
    phase: 'failed',
    atMs: 4,
    errorText: 'net::ERR_ABORTED',
  };
  assert.throws(
    () => assertMetadataSourceRequestSettlement(protocol, transfer, 117289, 2),
    { name: 'AssertionError' },
    'aborted full-body transfer'
  );
});

test('source request settlement rejects holes, errors, pending, duplicates, and overflows', () => {
  const invalid: Array<{
    name: string;
    change: (sample: typeof observedRangeHandoff) => void;
  }> = [
    {
      name: 'partial coverage',
      change: (sample) => {
        sample.transfer[1]!.dataBytes--;
      },
    },
    {
      name: 'pre-tail abort',
      change: (sample) => {
        sample.protocol[2]!.atMs = 1500;
      },
    },
    {
      name: 'wrong continuation',
      change: (sample) => {
        sample.protocol[3]!.range = 'bytes=98305-';
      },
    },
    {
      name: 'continuation before abort',
      change: (sample) => {
        sample.protocol[3]!.atMs = 1516;
      },
    },
    {
      name: 'wrong response status',
      change: (sample) => {
        sample.protocol[4]!.status = 200;
      },
    },
    {
      name: 'aborted 200 response with continuation',
      change: (sample) => {
        sample.protocol[1]!.status = 200;
      },
    },
    {
      name: 'unknown failure',
      change: (sample) => {
        sample.protocol[2]!.errorText = 'net::ERR_FAILED';
      },
    },
    {
      name: 'pending request',
      change: (sample) => {
        sample.protocol.pop();
      },
    },
    {
      name: 'duplicate terminal',
      change: (sample) => {
        sample.protocol.push({ requestId: '4736.17', phase: 'finished', atMs: 1535 });
      },
    },
    {
      name: 'overflow',
      change: (sample) => {
        sample.transfer[1]!.dataBytes = 117290;
      },
    },
  ];
  for (const { name, change } of invalid) {
    const sample = structuredClone(observedRangeHandoff);
    change(sample);
    assert.throws(
      () => assertMetadataSourceRequestSettlement(sample.protocol, sample.transfer, 117289, 1512),
      { name: 'AssertionError' },
      name
    );
  }
});

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
    await page.evaluate((url) => {
      document.querySelector('#toolbar-tweet-panel a')?.setAttribute('href', url);
    }, `${expected}/video/2`);
    assert.equal(await assertQuotedOriginLink(gallery, expected, true), `${expected}/video/2`);
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

for (const [label, primary] of Object.entries({
  undefined,
  null: null,
  false: false,
  zero: 0,
  empty: '',
  error: new Error('primary observation failed'),
})) {
  for (const cleanupFails of [false, true]) {
    test(`quoted source preserves ${label} failure with ${cleanupFails ? 'failed' : 'successful'} cleanup`, async () => {
      const cleanupError = new Error('panel cleanup failed');
      let clicks = 0;
      const button = {
        count: async () => 1,
        click: async () => {
          clicks++;
          if (cleanupFails && clicks === 2) {
            throw cleanupError;
          }
        },
      };
      const link = { waitFor: async () => {} };
      const gallery = {
        locator: (selector: string) => (selector === '#tweet-text-button' ? button : link),
        evaluate: async () => {
          throw primary;
        },
      } as unknown as Locator;
      let rejectionSeen = false;
      let rejection: unknown;
      try {
        await assertQuotedOriginLink(gallery, 'https://x.com/quote_owner/status/1');
      } catch (error) {
        rejectionSeen = true;
        rejection = error;
      }
      assert.equal(clicks, 2, 'panel cleanup must be attempted after the primary failure');
      assert.equal(rejectionSeen, true, 'the primary failure must reject');
      if (cleanupFails) {
        assert(rejection instanceof AggregateError);
        assert.equal(rejection.errors.length, 2);
        assert.strictEqual(rejection.errors[0], primary);
        assert.strictEqual(rejection.errors[1], cleanupError);
      } else {
        assert.strictEqual(rejection, primary);
      }
    });
  }
}
