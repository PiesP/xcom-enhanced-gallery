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

test('loads the Chrome extension background and exposes its runtime metadata', async () => {
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

test('Firefox build artifact contains its declared runtime scripts', () => {
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
