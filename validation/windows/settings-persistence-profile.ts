// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Page } from '@playwright/test';

interface FaultControl {
  denyPrimary: boolean;
  denyFallback: boolean;
  denyNextRead: number;
}

type StorageHost = Window & {
  GM_setValue?: (key: string, value: unknown) => void | Promise<void>;
  GM_getValue?: <T>(key: string) => T | undefined;
  GM_deleteValue?: (key: string) => void;
  __xegStorageFaults?: FaultControl;
};

/** Install before the built userscript captures its GM adapter functions. */
export async function installStorageFaultControl(page: Page): Promise<void> {
  await page.evaluate(() => {
    const host = window as StorageHost;
    const faults: FaultControl = { denyPrimary: false, denyFallback: false, denyNextRead: 0 };
    host.__xegStorageFaults = faults;
    const originalSet = host.GM_setValue;
    const originalGet = host.GM_getValue;
    if (!originalSet || !originalGet) {
      throw new Error('GM storage fixture is unavailable');
    }
    const originalFallbackSet = Storage.prototype.setItem;
    host.GM_getValue = <T>(key: string): T | undefined => {
      if (faults.denyNextRead > 0) {
        faults.denyNextRead--;
        throw new Error('controlled initial read denial');
      }
      return originalGet<T>(key);
    };
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

async function readDurableTheme(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const raw = (window as StorageHost).GM_getValue?.<string>(
      'xeg-app-settings:field:gallery.theme'
    );
    if (typeof raw !== 'string') {
      return null;
    }
    return (JSON.parse(raw) as { value?: string }).value ?? null;
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
    const initialPersistedTheme = await readDurableTheme(page);
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
    const deniedPersistedTheme = await readDurableTheme(page);
    assert.equal(
      deniedPersistedTheme,
      initialPersistedTheme,
      'Denied writes must leave durable theme unchanged'
    );
    evidence.denied = {
      sessionTheme: await gallery.getAttribute('data-theme'),
      unsavedVisible: await unsaved.isVisible(),
      feedbackInsidePanel: true,
      persistedTheme: deniedPersistedTheme,
    };
    await page.screenshot({ path: path.join(output, 'settings-unsaved.png') });
    await theme.selectOption('light');
    assert.equal(await gallery.getAttribute('data-theme'), 'light');
    assert.equal(await unsaved.isVisible(), true);
    assert.equal(await readDurableTheme(page), initialPersistedTheme);
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
    const persisted = await readDurableTheme(page);
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

    await page.evaluate(() => {
      const host = window as StorageHost;
      host.GM_deleteValue?.('xeg-app-settings:field:gallery.theme');
      localStorage.removeItem('xeg-fallback:xeg-app-settings:field:gallery.theme');
      host.GM_setValue?.(
        'xeg-app-settings',
        JSON.stringify({
          __xegStorageEnvelope: 1,
          updatedAt: 1_001,
          value: {
            __schemaHash: '1',
            gallery: { theme: 'dark', imageFitMode: 'fitHeight', videoVolume: 0.8 },
          },
        })
      );
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await installGMMock(page, { persistentStorage: true });
    await installStorageFaultControl(page);
    await installMediaFixture();
    await page.evaluate(() => {
      const faults = (window as StorageHost).__xegStorageFaults;
      if (!faults) {
        throw new Error('Storage fault control is unavailable');
      }
      faults.denyNextRead = 1;
    });
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
    await page.locator('[data-testid="tweetPhoto"] img').first().click();
    const recoveredGallery = page.locator('[data-xeg-gallery-container]');
    await recoveredGallery.waitFor({ state: 'visible', timeout: 15_000 });
    await recoveredGallery
      .locator('[data-gallery-element="toolbar"] button[aria-label*="Settings" i]')
      .click();
    const recoveredPanel = recoveredGallery.locator('[data-gallery-element="settings-panel"]');
    const initialUnsaved = recoveredPanel.locator('[data-xeg-settings-unsaved]');
    await initialUnsaved.waitFor({ state: 'visible', timeout: 5_000 });
    await recoveredPanel.locator('select').first().selectOption('light');
    await initialUnsaved.waitFor({ state: 'detached', timeout: 5_000 });
    const recovered = await page.evaluate(() => {
      const host = window as StorageHost;
      const rawBase = host.GM_getValue?.<string>('xeg-app-settings');
      const rawTheme = host.GM_getValue?.<string>('xeg-app-settings:field:gallery.theme');
      if (typeof rawBase !== 'string' || typeof rawTheme !== 'string') {
        return null;
      }
      const base = (
        JSON.parse(rawBase) as {
          value: { gallery: { theme: string; imageFitMode: string; videoVolume: number } };
        }
      ).value.gallery;
      const theme = (JSON.parse(rawTheme) as { value: string }).value;
      return { base, theme };
    });
    assert(recovered, 'Recovered baseline and explicit theme must both be stored');
    assert.equal(recovered.base.theme, 'dark');
    assert.equal(recovered.base.imageFitMode, 'fitHeight');
    assert.equal(recovered.base.videoVolume, 0.8);
    assert.equal(recovered.theme, 'light');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await installGMMock(page, { persistentStorage: true });
    await installMediaFixture();
    await page.addScriptTag({ content: script });
    await page.waitForFunction(
      () => document.documentElement.getAttribute('data-xeg-gallery-ready') === 'true',
      undefined,
      { timeout: 15_000 }
    );
    await page.locator('[data-testid="tweetPhoto"] img').first().click();
    const finalGallery = page.locator('[data-xeg-gallery-container]');
    await finalGallery.waitFor({ state: 'visible', timeout: 15_000 });
    assert.equal(await finalGallery.getAttribute('data-theme'), 'light');
    evidence.initialReadRecovery = {
      initialUnsavedVisible: true,
      editedTheme: recovered.theme,
      preservedImageFitMode: recovered.base.imageFitMode,
      preservedVideoVolume: recovered.base.videoVolume,
      freshTheme: 'light',
    };
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
