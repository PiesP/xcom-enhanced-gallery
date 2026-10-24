// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Page } from '@playwright/test';

interface FaultControl {
  denyPrimary: boolean;
  denyFallback: boolean;
}

type StorageHost = Window & {
  GM_setValue?: (key: string, value: unknown) => void | Promise<void>;
  GM_getValue?: <T>(key: string) => T | undefined;
  __xegStorageFaults?: FaultControl;
};

/** Install before the built userscript captures its GM adapter functions. */
export async function installStorageFaultControl(page: Page): Promise<void> {
  await page.evaluate(() => {
    const host = window as StorageHost;
    const faults: FaultControl = { denyPrimary: false, denyFallback: false };
    host.__xegStorageFaults = faults;
    const originalSet = host.GM_setValue;
    if (!originalSet) {
      throw new Error('GM storage fixture is unavailable');
    }
    const originalFallbackSet = Storage.prototype.setItem;
    host.GM_setValue = (key, value) => {
      if (faults.denyPrimary) {
        throw new Error('controlled primary denial');
      }
      return originalSet(key, value);
    };
    Storage.prototype.setItem = function (key, value) {
      if (faults.denyFallback && key.startsWith('xeg-fallback:')) {
        throw new Error('controlled fallback denial');
      }
      return originalFallbackSet.call(this, key, value);
    };
  });
}

export async function runSettingsPersistenceFixture({
  page,
  output,
  browserVersion,
  runtimeErrors,
  installGMMock,
  installMediaFixture,
  script,
}: {
  page: Page;
  output: string;
  browserVersion: string;
  runtimeErrors: Array<{ source: string; message: string }>;
  installGMMock: (page: Page, options: { persistentStorage: boolean }) => Promise<void>;
  installMediaFixture: () => Promise<void>;
  script: string;
}): Promise<Record<string, unknown>> {
  const evidence: Record<string, unknown> = {
    status: 'failed',
    scope:
      'built userscript with controlled GM/localStorage boundary; no manager or extension installation',
    browserVersion,
  };
  try {
    await page.locator('[data-testid="tweetPhoto"] img').first().click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: 15_000 });
    await gallery
      .locator('[data-gallery-element="toolbar"] button[aria-label*="Settings" i]')
      .click();
    const panel = gallery.locator('[data-gallery-element="settings-panel"]');
    const theme = panel.locator('select').first();
    const unsaved = panel.locator('[data-xeg-settings-unsaved]');
    await page.evaluate(() => {
      const faults = (window as StorageHost).__xegStorageFaults;
      if (!faults) {
        throw new Error('Storage fault control is unavailable');
      }
      faults.denyPrimary = true;
      faults.denyFallback = true;
    });
    await theme.selectOption('dark');
    await unsaved.waitFor({ state: 'visible', timeout: 5_000 });
    assert.equal(await gallery.getAttribute('data-theme'), 'dark');
    const banner = await unsaved.boundingBox();
    const panelBounds = await panel.boundingBox();
    assert(banner && panelBounds, 'Unsaved feedback must have visible geometry');
    assert(
      banner.y >= panelBounds.y && banner.y + banner.height <= panelBounds.y + panelBounds.height,
      'Unsaved feedback must appear within the visible settings panel'
    );
    evidence.denied = {
      sessionTheme: await gallery.getAttribute('data-theme'),
      unsavedVisible: await unsaved.isVisible(),
      feedbackInsidePanel: true,
      persistedTheme: await page.evaluate(() => {
        const raw = (window as StorageHost).GM_getValue?.<string>('xeg-app-settings');
        if (typeof raw !== 'string') {
          return null;
        }
        return (
          (JSON.parse(raw) as { value?: { gallery?: { theme?: string } } }).value?.gallery?.theme ??
          null
        );
      }),
    };
    await page.screenshot({ path: path.join(output, 'settings-unsaved.png') });
    await theme.selectOption('light');
    assert.equal(await gallery.getAttribute('data-theme'), 'light');
    assert.equal(await unsaved.isVisible(), true);
    await page.evaluate(() => {
      const faults = (window as StorageHost).__xegStorageFaults;
      if (!faults) {
        throw new Error('Storage fault control is unavailable');
      }
      faults.denyPrimary = false;
      faults.denyFallback = false;
    });
    await unsaved.getByRole('button').click();
    await unsaved.waitFor({ state: 'detached', timeout: 5_000 });
    const persisted = await page.evaluate(() => {
      const raw = (window as StorageHost).GM_getValue?.<string>('xeg-app-settings');
      if (typeof raw !== 'string') {
        return null;
      }
      return (
        (JSON.parse(raw) as { value?: { gallery?: { theme?: string } } }).value?.gallery?.theme ??
        null
      );
    });
    assert.equal(persisted, 'light', 'Retry must save the latest intended theme');
    evidence.retry = { persistedTheme: persisted, unsavedVisible: false };
    await page.reload({ waitUntil: 'domcontentloaded' });
    await installGMMock(page, { persistentStorage: true });
    await installMediaFixture();
    await page.addScriptTag({ content: script });
    await page.waitForFunction(
      () => document.documentElement.getAttribute('data-xeg-gallery-ready') === 'true',
      undefined,
      { timeout: 15_000 }
    );
    await page.waitForFunction(
      () => {
        const image = document.querySelector('[data-testid="tweetPhoto"] img');
        return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 1;
      },
      undefined,
      { timeout: 10_000 }
    );
    evidence.reloadBeforeClick = {
      url: page.url(),
      ready: true,
      firstImageLoaded: true,
      mediaFixtureReinstalled: true,
    };
    await page.locator('[data-testid="tweetPhoto"] img').first().click();
    const reloadedGallery = page.locator('[data-xeg-gallery-container]');
    await reloadedGallery.waitFor({ state: 'visible', timeout: 15_000 });
    assert.equal(await reloadedGallery.getAttribute('data-theme'), 'light');
    evidence.reload = { theme: 'light', freshDocument: true };
    assert.deepEqual(runtimeErrors, []);
    evidence.status = 'passed';
    return evidence;
  } catch (error) {
    evidence.error = error instanceof Error ? error.message : String(error);
    evidence.failureSnapshot = await page
      .evaluate(() => ({
        url: location.href,
        ready: document.documentElement.getAttribute('data-xeg-gallery-ready'),
        imageCount: document.querySelectorAll('[data-testid="tweetPhoto"] img').length,
        firstImageLoaded: (() => {
          const image = document.querySelector('[data-testid="tweetPhoto"] img');
          return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 1;
        })(),
        galleryCount: document.querySelectorAll('[data-xeg-gallery-container]').length,
      }))
      .catch(() => null);
    await page
      .screenshot({ path: path.join(output, 'settings-failure.png') })
      .catch(() => undefined);
    throw error;
  } finally {
    evidence.runtimeErrors = [...runtimeErrors];
    await writeFile(
      path.join(output, 'settings-persistence-observations.json'),
      JSON.stringify(evidence, null, 2)
    );
  }
}
