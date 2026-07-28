// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { chromium, expect, test } from '@playwright/test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');
const chromeExtensionDir = resolve(root, 'dist-extension');
const firefoxExtensionDir = resolve(root, 'dist-extension-firefox');

test.beforeAll(() => {
  for (const directory of [chromeExtensionDir, firefoxExtensionDir]) {
    if (!existsSync(resolve(directory, 'manifest.json'))) {
      throw new Error(`Extension build missing at ${directory}`);
    }
  }
});

test('loads the Chrome extension background and exposes its runtime metadata', async ({
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Chrome extension loading requires Chromium');
  const userDataDir = mkdtempSync(join(tmpdir(), 'xeg-extension-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [
      `--disable-extensions-except=${chromeExtensionDir}`,
      `--load-extension=${chromeExtensionDir}`,
    ],
  });

  try {
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
  } finally {
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
});

test('Firefox build artifact contains its declared runtime scripts', ({ browserName }) => {
  test.skip(browserName !== 'firefox', 'Firefox artifact validation runs in the Firefox project');
  const manifest = JSON.parse(
    readFileSync(resolve(firefoxExtensionDir, 'manifest.json'), 'utf8')
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
    expect(existsSync(resolve(firefoxExtensionDir, script))).toBe(true);
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

  await page.addScriptTag({ path: resolve(firefoxExtensionDir, 'background.js'), type: 'module' });

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
