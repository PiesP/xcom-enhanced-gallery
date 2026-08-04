// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { chromium, expect, test } from '@playwright/test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  CHROME_EXTENSION_DIR,
  FIREFOX_EXTENSION_DIR,
  MOCK_GALLERY_HTML,
  MOCK_IMAGE,
} from '../fixtures/artifacts';

test.beforeAll(() => {
  for (const directory of [CHROME_EXTENSION_DIR, FIREFOX_EXTENSION_DIR]) {
    if (!existsSync(resolve(directory, 'manifest.json'))) {
      throw new Error(`Extension build missing at ${directory}`);
    }
  }
});

test('loads the Chrome extension and opens the gallery from a content-script click', async ({
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chrome extension loading requires Chromium');
  const userDataDir = mkdtempSync(join(tmpdir(), 'xeg-extension-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [
      `--disable-extensions-except=${CHROME_EXTENSION_DIR}`,
      `--load-extension=${CHROME_EXTENSION_DIR}`,
    ],
  });

  try {
    await context.route('https://x.com/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML });
    });
    await context.route('https://pbs.twimg.com/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'image/png', body: MOCK_IMAGE });
    });

    const background =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker', { timeout: 10_000 }));

    expect(background.url()).toMatch(/^chrome-extension:\/\//);
    const runtime = await background.evaluate(() => {
      return {
        id: chrome.runtime.id,
        name: chrome.runtime.getManifest().name,
      };
    });
    expect(runtime.id).toBeTruthy();
    expect(runtime.name).toBe('X.com Enhanced Gallery');

    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${runtime.id}/manifest.json`);
    const malformedResponse = await extensionPage.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'NOT_A_REAL_MESSAGE' })
    );
    expect(malformedResponse).toEqual({ success: false, error: 'Unknown message type' });
    await extensionPage.close();

    const pageErrors: string[] = [];
    const page = await context.newPage();
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('https://x.com/testuser/status/1234567890123456789');

    const firstPhoto = page.locator('[data-testid="tweetPhoto"] img').first();
    await expect(firstPhoto).toBeVisible();
    await firstPhoto.click();
    await expect(page.locator('[data-xeg-gallery-container]')).toBeVisible();
    await expect(page.locator('[data-xeg-gallery-container] img').first()).toBeVisible();
    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
});

test('Firefox build artifact contains its declared runtime scripts', ({ browserName }) => {
  test.skip(browserName !== 'firefox', 'Firefox artifact validation runs in the Firefox project');
  const manifest = JSON.parse(
    readFileSync(resolve(FIREFOX_EXTENSION_DIR, 'manifest.json'), 'utf8')
  ) as {
    background?: { scripts?: string[] };
    content_scripts?: Array<{ js?: string[] }>;
  };
  const runtimeScripts = [
    ...(manifest.background?.scripts ?? []),
    ...(manifest.content_scripts?.flatMap((entry) => entry.js ?? []) ?? []),
  ];

  expect(runtimeScripts).toContain('background.js');
  expect(runtimeScripts).toContain('content.js');
  for (const script of runtimeScripts) {
    expect(existsSync(resolve(FIREFOX_EXTENSION_DIR, script))).toBe(true);
  }
});

/**
 * Playwright does not support temporary WebExtension installation in Firefox.
 * Execute the exact built background module in the Firefox engine with the
 * WebExtension namespace mocked, which verifies Firefox parsing, startup, and
 * listener registration without claiming a full installation test.
 */
test('executes the Firefox background module and registers its runtime listeners', async ({
  browserName,
  page,
}) => {
  test.skip(browserName !== 'firefox', 'Firefox runtime validation requires Firefox');

  await page.goto('about:blank');
  await page.evaluate(() => {
    const registrations = {
      installed: 0,
      message: 0,
      startup: 0,
      suspend: 0,
    };
    const createEvent = (key: keyof typeof registrations) => ({
      addListener: () => {
        registrations[key] += 1;
      },
      removeListener: () => undefined,
    });
    const downloadChanged = {
      addListener: () => undefined,
      removeListener: () => undefined,
    };

    Object.assign(globalThis, {
      __xegFirefoxRegistrations: registrations,
      browser: {
        runtime: {
          id: 'xcom-enhanced-gallery@piesp.dev',
          onMessage: createEvent('message'),
          onInstalled: createEvent('installed'),
          onStartup: createEvent('startup'),
          onSuspend: createEvent('suspend'),
        },
        downloads: {
          download: async () => 1,
          cancel: async () => undefined,
          search: async () => [],
          onChanged: downloadChanged,
        },
        notifications: {
          create: async () => 'notification-id',
        },
      },
    });
  });

  await page.addScriptTag({ path: resolve(FIREFOX_EXTENSION_DIR, 'background.js'), type: 'module' });

  await expect
    .poll(() =>
      page.evaluate(() => {
        return (globalThis as typeof globalThis & {
          __xegFirefoxRegistrations?: Record<string, number>;
        }).__xegFirefoxRegistrations;
      })
    )
    .toEqual({ installed: 1, message: 1, startup: 1, suspend: 1 });
});
