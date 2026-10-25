// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { chromium, type BrowserContext } from '@playwright/test';
import {
  observeLiveUrls,
  resolveBorrowedVideoClickMode,
  type BorrowedHostDiagnosticProof,
} from './live-page.ts';

const liveUrl = 'https://x.com/tester/status/12345';
const borrowedProof: BorrowedHostDiagnosticProof = {
  schemaVersion: 1,
  kind: 'BorrowedHostDiagnosticProof',
  baseline: {
    receiptSha256: '1'.repeat(64),
    sourceSha: 'a'.repeat(40),
    coreSha: 'b'.repeat(40),
    bundleSha256: 'c'.repeat(64),
    browserPid: 123,
    browserBirthUtcTicks: '639284716450486670',
    browserSessionId: 2,
    browserSidSha256: '6'.repeat(64),
    profilePathSha256: '2'.repeat(64),
    portReceiptSha256: '3'.repeat(64),
    status: 'baseline-observed',
    completedAtUtc: new Date().toISOString(),
    ownedPagesClosed: true,
    originalPagesPreserved: true,
    focusRestored: true,
    disconnected: true,
    inventory: { count: 5, developerMode: false, relatedCount: 0, unrelatedDigest: '4'.repeat(64) },
    pages: [
      {
        requestedUrl: liveUrl,
        finalUrl: liveUrl,
        responseStatus: 200,
        articleVisible: true,
        closed: true,
        consoleErrors: [],
        consoleOverflow: 0,
        pageErrorCount: 0,
        pageErrorOverflow: 0,
      },
    ],
  },
  current: {
    sourceSha: 'a'.repeat(40),
    coreSha: 'b'.repeat(40),
    bundleSha256: 'c'.repeat(64),
    browserPid: 123,
    browserBirthUtcTicks: '639284716450486670',
    browserSessionId: 2,
    browserSidSha256: '6'.repeat(64),
    profilePathSha256: '2'.repeat(64),
    portReceiptSha256: '3'.repeat(64),
    unrelatedCount: 5,
    unrelatedDigest: '4'.repeat(64),
    targetCount: 1,
    runtimeResourceCount: 12,
    runtimeResourceBinding: 'matched',
    extensionSourcePathVerified: true,
  },
};

test('borrowed mode uses the canonical default only when storage is absent', async () => {
  const { DEFAULT_SETTINGS } = (await import(
    new URL('../../src/constants/settings.ts', import.meta.url).href
  )) as { DEFAULT_SETTINGS: { gallery: { videoClickMode: string } } };
  assert.deepEqual(
    resolveBorrowedVideoClickMode({ exists: false, value: null, settings: null }, null),
    {
      mode: DEFAULT_SETTINGS.gallery.videoClickMode,
      source: 'unset-default',
    }
  );
  assert.deepEqual(
    resolveBorrowedVideoClickMode(
      {
        exists: true,
        value: { gallery: { videoClickMode: 'allow-all' } },
        settings: { gallery: { videoClickMode: 'allow-all' } },
      },
      null
    ),
    { mode: 'allow-all', source: 'primary-valid' }
  );
  assert.throws(
    () =>
      resolveBorrowedVideoClickMode(
        {
          exists: true,
          value: { gallery: { videoClickMode: 'surprise' } },
          settings: { gallery: { videoClickMode: 'surprise' } },
        },
        null
      ),
    /unknown or invalid/
  );
  const oldPrimary = {
    exists: true,
    value: {
      __xegStorageEnvelope: 1,
      updatedAt: 10,
      value: { gallery: { videoClickMode: 'block-all' } },
    },
    settings: { gallery: { videoClickMode: 'block-all' } },
  };
  const newerFallback = JSON.stringify({
    __xegStorageEnvelope: 1,
    updatedAt: 20,
    value: { gallery: { videoClickMode: 'allow-all' } },
  });
  assert.deepEqual(resolveBorrowedVideoClickMode(oldPrimary, newerFallback), {
    mode: 'allow-all',
    source: 'fallback-valid',
  });
  assert.deepEqual(
    resolveBorrowedVideoClickMode({ exists: false, value: null, settings: null }, newerFallback),
    { mode: 'allow-all', source: 'fallback-valid' }
  );
  assert.deepEqual(
    resolveBorrowedVideoClickMode(
      { ...oldPrimary, value: { ...oldPrimary.value, updatedAt: 30 } },
      newerFallback
    ),
    { mode: 'block-all', source: 'primary-valid' }
  );
});

test('borrowed observation reads installed settings without writing or closing the context', async () => {
  const browser = await chromium.launch();
  const output = mkdtempSync(join(tmpdir(), 'xeg-borrowed-live-'));
  try {
    for (const stored of [
      {
        exists: false,
        value: null,
        fallback: null,
        mode: 'block-controls-only',
        source: 'unset-default',
      },
      {
        exists: true,
        value: {
          __xegStorageEnvelope: 1,
          updatedAt: 42,
          value: { gallery: { videoClickMode: 'allow-all' } },
        },
        fallback: null,
        mode: 'allow-all',
        source: 'primary-valid',
      },
      {
        exists: false,
        value: null,
        fallback: JSON.stringify({
          __xegStorageEnvelope: 1,
          updatedAt: 42,
          value: { gallery: { videoClickMode: 'block-all' } },
        }),
        mode: 'block-all',
        source: 'fallback-valid',
      },
      {
        exists: true,
        value: {
          __xegStorageEnvelope: 1,
          updatedAt: 10,
          value: { gallery: { videoClickMode: 'block-all' } },
        },
        fallback: JSON.stringify({
          __xegStorageEnvelope: 1,
          updatedAt: 20,
          value: { gallery: { videoClickMode: 'allow-all' } },
        }),
        mode: 'allow-all',
        source: 'fallback-valid',
      },
    ]) {
      const context = await browser.newContext();
      const writes: string[] = [];
      let createdPages = 0;
      await context.exposeBinding('recordSettingsWrite', (_source, operation: string) => {
        writes.push(operation);
      });
      await context.addInitScript((fallback) => {
        if (location.hostname === 'x.com' && fallback !== null) {
          localStorage.setItem('xeg-fallback:xeg-app-settings', fallback);
        }
      }, stored.fallback);
      await context.route(liveUrl, async (route) => {
        await route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><html><body>This post is unavailable</body></html>',
        });
      });
      const borrowedContext = {
        newPage: async () => {
          createdPages += 1;
          const page = await context.newPage();
          const goto = page.goto.bind(page);
          Object.defineProperty(page, 'goto', {
            value: async (url: string, options?: Parameters<typeof page.goto>[1]) => {
              if (url.startsWith('chrome-extension://')) {
                await page.evaluate(({ exists, value }) => {
                  Object.assign(globalThis, {
                    chrome: {
                      storage: {
                        local: {
                          get: async (key: string) => (exists ? { [key]: value } : {}),
                          set: async () => {
                            await (
                              globalThis as unknown as {
                                recordSettingsWrite: (operation: string) => Promise<void>;
                              }
                            ).recordSettingsWrite('set');
                          },
                          remove: async () => {
                            await (
                              globalThis as unknown as {
                                recordSettingsWrite: (operation: string) => Promise<void>;
                              }
                            ).recordSettingsWrite('remove');
                          },
                        },
                      },
                    },
                  });
                }, stored);
                return null;
              }
              return goto(url, options);
            },
          });
          return page;
        },
      } as unknown as BrowserContext;

      await assert.rejects(
        observeLiveUrls({
          context: borrowedContext,
          extensionId: 'installed-extension',
          liveUrls: [liveUrl],
          output,
          session: 'borrowed',
          borrowedHostProof: borrowedProof,
        }),
        (error: unknown) => {
          assert.ok(error instanceof AggregateError);
          return true;
        }
      );
      const summary = JSON.parse(readFileSync(join(output, 'live-observations.json'), 'utf8'));
      assert.equal(summary.status, 'failed');
      assert.equal(summary.hostProofStatus, 'validated');
      assert.equal(summary.hostBaselineReceiptSha256, borrowedProof.baseline.receiptSha256);
      assert.equal(summary.borrowedMode.mode, stored.mode);
      assert.equal(summary.borrowedMode.source, stored.source);
      assert.equal(summary.pages[0].videoClickMode, stored.mode);
      assert.equal(summary.pages[0].extension.videoClickModeSource, stored.source);
      assert.equal(summary.pages[0].controlledProbe, undefined);
      assert.equal(summary.pages[0].status, 'failed');
      assert.equal(createdPages, 2);
      assert.deepEqual(writes, []);
      assert.equal(context.pages().length, 0);
      const stillUsable = await context.newPage();
      await stillUsable.close();
      await context.close();
    }
  } finally {
    await browser.close();
    rmSync(output, { recursive: true, force: true });
  }
});

test('borrowed observation fails closed on unverified stored mode and retains a receipt', async () => {
  const browser = await chromium.launch();
  const output = mkdtempSync(join(tmpdir(), 'xeg-borrowed-mode-'));
  try {
    const context = await browser.newContext();
    let createdPages = 0;
    await context.route(liveUrl, async (route) => {
      await route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html><body>This post is unavailable</body></html>',
      });
    });
    const borrowedContext = {
      newPage: async () => {
        createdPages += 1;
        const page = await context.newPage();
        const goto = page.goto.bind(page);
        Object.defineProperty(page, 'goto', {
          value: async (url: string, options?: Parameters<typeof page.goto>[1]) => {
            if (url.startsWith('chrome-extension://')) {
              await page.evaluate(() => {
                Object.assign(globalThis, {
                  chrome: {
                    storage: {
                      local: {
                        get: async () => ({
                          'xeg-app-settings': { gallery: { videoClickMode: 'unknown' } },
                        }),
                      },
                    },
                  },
                });
              });
              return null;
            }
            return goto(url, options);
          },
        });
        return page;
      },
    } as unknown as BrowserContext;
    await assert.rejects(
      observeLiveUrls({
        context: borrowedContext,
        extensionId: 'installed-extension',
        liveUrls: [liveUrl],
        output,
        session: 'borrowed',
      }),
      /missed required assertions/
    );
    const summary = JSON.parse(readFileSync(join(output, 'live-observations.json'), 'utf8'));
    assert.equal(summary.status, 'failed');
    assert.match(summary.pages[0].error, /unknown or invalid/);
    assert.equal(summary.pages[0].videoClickMode, 'unverified');
    assert.equal(summary.borrowedMode, null);
    assert.equal(createdPages, 2);
    assert.equal(context.pages().length, 0);
    await context.close();
  } finally {
    await browser.close();
    rmSync(output, { recursive: true, force: true });
  }
});

test('borrowed observation stops when the X-origin fallback drifts after readiness', async () => {
  const browser = await chromium.launch();
  const output = mkdtempSync(join(tmpdir(), 'xeg-borrowed-drift-'));
  try {
    const context = await browser.newContext();
    let writes = 0;
    await context.addInitScript(() => {
      if (location.hostname !== 'x.com') {
        return;
      }
      let reads = 0;
      const originalGet = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key: string) {
        if (key === 'xeg-fallback:xeg-app-settings') {
          reads += 1;
          return JSON.stringify({
            __xegStorageEnvelope: 1,
            updatedAt: reads === 1 ? 20 : 30,
            value: { gallery: { videoClickMode: reads === 1 ? 'allow-all' : 'block-all' } },
          });
        }
        return originalGet.call(this, key);
      };
    });
    await context.exposeBinding('recordSettingsWrite', () => {
      writes += 1;
    });
    await context.route(liveUrl, async (route) => {
      await route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><html data-xeg-gallery-ready="true"><body>
          <article><a href="${liveUrl}">Post</a>
          <video style="width:320px;height:180px" poster="https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/poster.jpg"
            src="https://video.twimg.com/ext_tw_video/1/pu/vid/320x180/video.mp4"></video>
          </article></body></html>`,
      });
    });
    const borrowedContext = {
      newPage: async () => {
        const page = await context.newPage();
        const goto = page.goto.bind(page);
        Object.defineProperty(page, 'goto', {
          value: async (url: string, options?: Parameters<typeof page.goto>[1]) => {
            if (url.startsWith('chrome-extension://')) {
              await page.evaluate(() => {
                Object.assign(globalThis, {
                  chrome: {
                    storage: {
                      local: {
                        get: async () => ({
                          'xeg-app-settings': {
                            __xegStorageEnvelope: 1,
                            updatedAt: 10,
                            value: { gallery: { videoClickMode: 'block-controls-only' } },
                          },
                        }),
                        set: async () => {
                          await (
                            globalThis as unknown as {
                              recordSettingsWrite: () => Promise<void>;
                            }
                          ).recordSettingsWrite();
                        },
                        remove: async () => {
                          await (
                            globalThis as unknown as {
                              recordSettingsWrite: () => Promise<void>;
                            }
                          ).recordSettingsWrite();
                        },
                      },
                    },
                  },
                });
              });
              return null;
            }
            return goto(url, options);
          },
        });
        return page;
      },
    } as unknown as BrowserContext;

    await assert.rejects(
      observeLiveUrls({
        context: borrowedContext,
        extensionId: 'installed-extension',
        liveUrls: [liveUrl],
        output,
        session: 'borrowed',
      }),
      /missed required assertions/
    );
    const summary = JSON.parse(readFileSync(join(output, 'live-observations.json'), 'utf8'));
    assert.equal(writes, 0);
    assert.equal(summary.pages[0].videoClickMode, 'allow-all');
    assert.equal(summary.pages[0].extension.videoClickModeSource, 'fallback-valid');
    assert.match(summary.pages[0].error, /changed during observation/);
    assert.equal(summary.pages[0].controlledProbe, undefined);
    assert.equal(context.pages().length, 0);
    await context.close();
  } finally {
    await browser.close();
    rmSync(output, { recursive: true, force: true });
  }
});

test('borrowed observation preserves a failure receipt when X-origin fallback cannot be read', async () => {
  const browser = await chromium.launch();
  const output = mkdtempSync(join(tmpdir(), 'xeg-borrowed-fallback-read-'));
  try {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      if (location.hostname === 'x.com') {
        Storage.prototype.getItem = () => {
          throw new Error('fallback read denied');
        };
      }
    });
    await context.route(liveUrl, async (route) => {
      await route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html><body>This post is unavailable</body></html>',
      });
    });
    const borrowedContext = {
      newPage: async () => {
        const page = await context.newPage();
        const goto = page.goto.bind(page);
        Object.defineProperty(page, 'goto', {
          value: async (url: string, options?: Parameters<typeof page.goto>[1]) => {
            if (url.startsWith('chrome-extension://')) {
              await page.evaluate(() => {
                Object.assign(globalThis, {
                  chrome: {
                    storage: {
                      local: {
                        get: async () => ({
                          'xeg-app-settings': {
                            gallery: { videoClickMode: 'block-controls-only' },
                          },
                        }),
                      },
                    },
                  },
                });
              });
              return null;
            }
            return goto(url, options);
          },
        });
        return page;
      },
    } as unknown as BrowserContext;
    await assert.rejects(
      observeLiveUrls({
        context: borrowedContext,
        extensionId: 'installed-extension',
        liveUrls: [liveUrl],
        output,
        session: 'borrowed',
      }),
      /missed required assertions/
    );
    const summary = JSON.parse(readFileSync(join(output, 'live-observations.json'), 'utf8'));
    assert.equal(summary.status, 'failed');
    assert.equal(summary.pages[0].videoClickMode, 'unverified');
    assert.match(summary.pages[0].error, /fallback read denied/);
    assert.equal(summary.borrowedMode, null);
    assert.equal(context.pages().length, 0);
    await context.close();
  } finally {
    await browser.close();
    rmSync(output, { recursive: true, force: true });
  }
});

test('borrowed native playback never starts the owned allow-all settings probe', async () => {
  const browser = await chromium.launch();
  const output = mkdtempSync(join(tmpdir(), 'xeg-borrowed-native-'));
  const videoBytes = readFileSync(
    new URL('../../test/e2e/fixtures/installed-metadata-readiness.mp4', import.meta.url)
  );
  try {
    for (const session of ['borrowed', 'owned'] as const) {
      const context = await browser.newContext();
      const originalSettings = { gallery: { videoClickMode: 'block-controls-only' } };
      const settings: Record<string, unknown> = { 'xeg-app-settings': originalSettings };
      const writes: string[] = [];
      let pagesCreated = 0;
      let liveRequests = 0;
      await context.exposeBinding('readExtensionStorage', (_source, key: string) =>
        Object.hasOwn(settings, key) ? { [key]: settings[key] } : {}
      );
      await context.exposeBinding(
        'setExtensionStorage',
        (_source, next: Record<string, unknown>) => {
          writes.push('set');
          Object.assign(settings, next);
        }
      );
      await context.exposeBinding('removeExtensionStorage', (_source, key: string) => {
        writes.push('remove');
        Reflect.deleteProperty(settings, key);
      });
      await context.route(liveUrl, async (route) => {
        liveRequests += 1;
        await route.fulfill({
          contentType: 'text/html',
          body:
            liveRequests === 1
              ? `<!doctype html><html data-xeg-gallery-ready="true"><body>
                  <div style="height:1100px"></div><article>
                    <a href="${liveUrl}">Post</a>
                    <div style="position:relative;width:320px;height:180px">
                      <video preload="auto" poster="https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/poster.jpg"
                        src="https://video.twimg.com/ext_tw_video/1/pu/vid/320x192/video.mp4"
                        style="width:320px;height:180px"></video>
                      <button type="button" aria-label="Play video"
                        style="position:absolute;inset:0;width:320px;height:180px"
                        onclick="document.querySelector('video').play()">Play</button>
                    </div>
                  </article></body></html>`
              : '<!doctype html><html><body>This post is unavailable</body></html>',
        });
      });
      await context.route('https://video.twimg.com/**', async (route) => {
        await route.fulfill({ contentType: 'video/mp4', body: videoBytes });
      });
      await context.route('https://pbs.twimg.com/**', async (route) => {
        await route.fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"/>',
        });
      });
      const routedContext = {
        newPage: async () => {
          pagesCreated += 1;
          const page = await context.newPage();
          const goto = page.goto.bind(page);
          Object.defineProperty(page, 'goto', {
            value: async (url: string, options?: Parameters<typeof page.goto>[1]) => {
              if (url.startsWith('chrome-extension://')) {
                await page.evaluate(() => {
                  const bindings = globalThis as unknown as {
                    readExtensionStorage: (key: string) => Promise<Record<string, unknown>>;
                    setExtensionStorage: (next: Record<string, unknown>) => Promise<void>;
                    removeExtensionStorage: (key: string) => Promise<void>;
                  };
                  Object.assign(globalThis, {
                    chrome: {
                      storage: {
                        local: {
                          get: bindings.readExtensionStorage,
                          set: bindings.setExtensionStorage,
                          remove: bindings.removeExtensionStorage,
                        },
                      },
                    },
                  });
                });
                return null;
              }
              return goto(url, options);
            },
          });
          return page;
        },
      } as unknown as BrowserContext;

      await assert.rejects(
        observeLiveUrls({
          context: routedContext,
          extensionId: 'installed-extension',
          liveUrls: [liveUrl],
          output,
          session,
        }),
        /missed required assertions/
      );
      const summary = JSON.parse(readFileSync(join(output, 'live-observations.json'), 'utf8'));
      const page = summary.pages[0];
      assert.equal(page.classification, 'native-play-observed-gallery-action-unavailable');
      assert.equal(page.target.nativePlayback.status, 'playing');
      if (session === 'borrowed') {
        assert.equal(page.controlledProbe, undefined);
        assert.deepEqual(writes, []);
        assert.equal(liveRequests, 1);
        assert.equal(pagesCreated, 2);
      } else {
        assert.equal(page.controlledProbe.kind, 'task-owned-extension-setting-probe');
        assert.equal(page.controlledProbe.appliedMode, 'allow-all');
        assert.equal(page.controlledProbe.cleanup.restored, true);
        assert.deepEqual(writes, ['set', 'set']);
        assert.equal(liveRequests, 2);
        assert.equal(pagesCreated, 3);
      }
      assert.deepEqual(settings['xeg-app-settings'], originalSettings);
      assert.equal(context.pages().length, 0);
      await context.close();
    }
  } finally {
    await browser.close();
    rmSync(output, { recursive: true, force: true });
  }
});
