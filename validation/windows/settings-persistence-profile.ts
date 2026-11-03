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
  holdNextFitPrimary: boolean;
  fitPrimaryHeld: boolean;
  fitFallbackDenials: number;
  releaseHeldFitPrimary?: () => Promise<void>;
  restore: () => Promise<void>;
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
    const originalSet = host.GM_setValue;
    const originalGet = host.GM_getValue;
    if (!originalSet || !originalGet) {
      throw new Error('GM storage fixture is unavailable');
    }
    const originalFallbackSet = Storage.prototype.setItem;
    const controlledGet = <T>(key: string): T | undefined => {
      if (faults.denyNextRead > 0) {
        faults.denyNextRead--;
        throw new Error('controlled initial read denial');
      }
      return originalGet<T>(key);
    };
    const controlledSet = (key: string, value: unknown): void | Promise<void> => {
      const write = (): void | Promise<void> => {
        if (faults.denyPrimary) {
          throw new Error('controlled primary denial');
        }
        return originalSet(key, value);
      };
      if (key !== 'xeg-app-settings:field:gallery.imageFitMode' || !faults.holdNextFitPrimary) {
        return write();
      }
      faults.holdNextFitPrimary = false;
      faults.fitPrimaryHeld = true;
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const result = gate.then(write);
      faults.releaseHeldFitPrimary = () => {
        faults.fitPrimaryHeld = false;
        delete faults.releaseHeldFitPrimary;
        release();
        // The application still receives the original result, including denial.
        return result.then(
          () => undefined,
          () => undefined
        );
      };
      return result;
    };
    const controlledFallbackSet = function (this: Storage, key: string, value: string): void {
      if (faults.denyFallback && key.startsWith('xeg-fallback:')) {
        if (key === 'xeg-fallback:xeg-app-settings:field:gallery.imageFitMode') {
          faults.fitFallbackDenials++;
        }
        throw new Error('controlled fallback denial');
      }
      return originalFallbackSet.call(this, key, value);
    };
    const faults: FaultControl = {
      denyPrimary: false,
      denyFallback: false,
      denyNextRead: 0,
      holdNextFitPrimary: false,
      fitPrimaryHeld: false,
      fitFallbackDenials: 0,
      restore: async () => {
        faults.holdNextFitPrimary = false;
        if (faults.releaseHeldFitPrimary) {
          const fallbackDenialsBefore = faults.fitFallbackDenials;
          faults.denyPrimary = true;
          faults.denyFallback = true;
          await faults.releaseHeldFitPrimary();
          const deadline = Date.now() + 5_000;
          while (faults.fitFallbackDenials === fallbackDenialsBefore && Date.now() < deadline) {
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
          }
          if (faults.fitFallbackDenials === fallbackDenialsBefore) {
            throw new Error('Held fit write did not attempt fallback during cleanup');
          }
        }
        faults.denyPrimary = false;
        faults.denyFallback = false;
        if (host.GM_getValue === controlledGet) {
          host.GM_getValue = originalGet;
        }
        if (host.GM_setValue === controlledSet) {
          host.GM_setValue = originalSet;
        }
        if (Storage.prototype.setItem === controlledFallbackSet) {
          Storage.prototype.setItem = originalFallbackSet;
        }
        if (host.__xegStorageFaults === faults) {
          delete host.__xegStorageFaults;
        }
      },
    };
    host.__xegStorageFaults = faults;
    host.GM_getValue = controlledGet;
    host.GM_setValue = controlledSet;
    Storage.prototype.setItem = controlledFallbackSet;
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

async function readDurableFit(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const raw = (window as StorageHost).GM_getValue?.<string>(
      'xeg-app-settings:field:gallery.imageFitMode'
    );
    return typeof raw === 'string' ? ((JSON.parse(raw) as { value?: string }).value ?? null) : null;
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
  const failures: unknown[] = [];
  try {
    await page.locator('[data-testid="tweetPhoto"] img').first().click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: 15_000 });
    await gallery.locator('#settings-button').click();
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
    await installStorageFaultControl(page);
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

    const fitBefore = await readDurableFit(page);
    await page.evaluate(() => {
      const faults = (window as StorageHost).__xegStorageFaults!;
      faults.denyPrimary = true;
      faults.denyFallback = true;
    });
    const fitButton = reloadedGallery.locator('button[aria-label="Fit Height"]');
    await fitButton.click();
    assert.equal(await fitButton.getAttribute('aria-pressed'), 'true');
    const outerCue = reloadedGallery.locator('[data-xeg-settings-unsaved-indicator]');
    await outerCue.waitFor({ state: 'visible' });
    assert.equal(
      await reloadedGallery.locator('#settings-button').getAttribute('aria-expanded'),
      'false'
    );
    assert.match((await outerCue.textContent()) ?? '', /not saved|unsaved/i);
    assert.equal(
      await readDurableFit(page),
      fitBefore,
      'Closed Settings denied fit save reached storage'
    );
    await outerCue.getByRole('button').click();
    await reloadedGallery
      .locator('[data-gallery-element="settings-panel"]')
      .waitFor({ state: 'visible' });
    const fitUnsaved = reloadedGallery.locator('[data-xeg-settings-unsaved]');
    await fitUnsaved.waitFor({ state: 'visible' });
    await page.evaluate(() => {
      const faults = (window as StorageHost).__xegStorageFaults!;
      faults.denyPrimary = false;
      faults.denyFallback = false;
    });
    await fitUnsaved.getByRole('button').click();
    await fitUnsaved.waitFor({ state: 'detached' });
    assert.equal(await outerCue.count(), 0, 'Saved fit left the toolbar unsaved cue');
    assert.equal(await readDurableFit(page), 'fitHeight');
    evidence.closedSettingsFitRecovery = {
      priorDurableFit: fitBefore,
      deniedDurableFit: fitBefore,
      cueVisible: true,
      reopenedFromCue: true,
      retriedDurableFit: 'fitHeight',
    };

    const delayedFitBefore = await readDurableFit(page);
    assert.equal(delayedFitBefore, 'fitHeight');
    await page.evaluate(() => {
      const faults = (window as StorageHost).__xegStorageFaults!;
      faults.holdNextFitPrimary = true;
    });
    const settingsButton = reloadedGallery.locator('#settings-button');
    assert.equal(await settingsButton.getAttribute('aria-expanded'), 'true');
    const delayedFitButton = reloadedGallery.locator('button[aria-label="Fit Width"]');
    await delayedFitButton.click();
    assert.equal(await delayedFitButton.getAttribute('aria-pressed'), 'true');
    await page.waitForFunction(
      () => (window as StorageHost).__xegStorageFaults?.fitPrimaryHeld === true
    );
    assert.equal(await outerCue.count(), 0, 'Pending fit save was labelled as failed');
    assert.equal(await fitUnsaved.count(), 0, 'Pending fit save showed failed Settings status');
    assert.equal(await readDurableFit(page), delayedFitBefore);
    await settingsButton.click();
    assert.equal(await settingsButton.getAttribute('aria-expanded'), 'false');
    assert.equal(
      await outerCue.count(),
      0,
      'Closing Settings while save is pending showed failure'
    );
    await page.evaluate(async () => {
      const faults = (window as StorageHost).__xegStorageFaults!;
      faults.denyPrimary = true;
      faults.denyFallback = true;
      const release = faults.releaseHeldFitPrimary;
      if (!release) {
        throw new Error('Held fit write was not available for release');
      }
      await release();
    });
    await outerCue.waitFor({ state: 'visible', timeout: 5_000 });
    assert.equal(await settingsButton.getAttribute('aria-expanded'), 'false');
    assert.equal(await readDurableFit(page), delayedFitBefore);
    await page.screenshot({ path: path.join(output, 'settings-late-fit-failure.png') });
    await outerCue.getByRole('button').click();
    await fitUnsaved.waitFor({ state: 'visible', timeout: 5_000 });
    await page.evaluate(() => {
      const faults = (window as StorageHost).__xegStorageFaults!;
      faults.denyPrimary = false;
      faults.denyFallback = false;
    });
    await fitUnsaved.getByRole('button').click();
    await fitUnsaved.waitFor({ state: 'detached', timeout: 5_000 });
    assert.equal(await outerCue.count(), 0, 'Successful delayed-fit retry left failure cue');
    assert.equal(await readDurableFit(page), 'fitWidth');
    evidence.lateSettingsFitRecovery = {
      pendingCueAbsent: true,
      failedAfterPanelClosed: true,
      deniedDurableFit: delayedFitBefore,
      retriedDurableFit: 'fitWidth',
    };
    await page.evaluate(() => {
      const faults = (window as StorageHost).__xegStorageFaults!;
      faults.denyPrimary = true;
      faults.denyFallback = true;
    });
    const language = reloadedGallery.locator('#settings-language-select');
    const languageUnsaved = reloadedGallery.locator('[data-xeg-settings-unsaved]');
    await language.selectOption('ko');
    await languageUnsaved.waitFor({ state: 'visible' });
    assert.equal(
      await reloadedGallery.locator('label[for="settings-language-select"]').textContent(),
      '언어'
    );
    await language.selectOption('ja');
    await languageUnsaved.getByRole('button').click();
    assert.equal(await languageUnsaved.isVisible(), true);
    await page.screenshot({ path: path.join(output, 'language-unsaved.png') });
    await page.evaluate(() => {
      const faults = (window as StorageHost).__xegStorageFaults!;
      faults.denyPrimary = false;
      faults.denyFallback = false;
    });
    await languageUnsaved.getByRole('button').click();
    await languageUnsaved.waitFor({ state: 'detached' });
    const durableLanguage = await page.evaluate(() => {
      const raw = (window as StorageHost).GM_getValue?.<string>('xeg-language');
      return typeof raw === 'string' ? (JSON.parse(raw) as { value: string }).value : null;
    });
    assert.equal(durableLanguage, 'ja');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await installGMMock(page, { persistentStorage: true });
    await installMediaFixture();
    await page.addScriptTag({ content: script });
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor();
    await page.locator('[data-testid="tweetPhoto"] img').first().click();
    await page.locator('[data-xeg-gallery-container]').waitFor({ state: 'visible' });
    await page.locator('#settings-button').click();
    assert.equal(await page.locator('#settings-language-select').inputValue(), 'ja');
    evidence.languageRecovery = {
      deniedFeedback: true,
      repeatedDenial: true,
      latest: durableLanguage,
      freshSelection: 'ja',
    };
    // Restore English for the remaining baseline/read-recovery fixture.
    await page.locator('#settings-language-select').selectOption('en');
    await page.waitForFunction(() => {
      const raw = (window as StorageHost).GM_getValue?.<string>('xeg-language');
      return typeof raw === 'string' && (JSON.parse(raw) as { value: string }).value === 'en';
    });

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
    await recoveredGallery.locator('#settings-button').click();
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
    const unsupportedRaw = JSON.stringify({
      __schemaHash: 'unsupported-fixture',
      version: 'unknown',
      futureRoot: { retained: true },
      gallery: { theme: 'dark', futureField: 42 },
    });
    await page.evaluate((raw) => {
      const host = window as StorageHost;
      host.GM_deleteValue?.('xeg-app-settings:field:gallery.theme');
      host.GM_setValue?.('xeg-app-settings', raw);
    }, unsupportedRaw);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await installGMMock(page, { persistentStorage: true });
    await installMediaFixture();
    await page.addScriptTag({ content: script });
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor();
    await page.locator('[data-testid="tweetPhoto"] img').first().click();
    await page.locator('[data-xeg-gallery-container]').waitFor({ state: 'visible' });
    await page.locator('#settings-button').click();
    const protectedStatus = page.locator('[data-xeg-settings-unsaved]');
    await protectedStatus.waitFor({ state: 'visible' });
    await page.locator('#settings-theme-select').selectOption('light');
    await protectedStatus.getByRole('button').click();
    assert.equal(await protectedStatus.isVisible(), true);
    assert.equal(
      await page.evaluate(() => (window as StorageHost).GM_getValue?.('xeg-app-settings')),
      unsupportedRaw
    );
    assert.equal(await readDurableTheme(page), null);
    await page.screenshot({ path: path.join(output, 'unsupported-schema-unsaved.png') });
    evidence.unsupportedSchema = {
      rawPreserved: true,
      editInSession: true,
      retryStillUnsaved: true,
      leafAbsent: true,
    };
    assert.deepEqual(runtimeErrors, []);
    evidence.status = 'passed';
  } catch (error) {
    failures.push(error);
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
  } finally {
    await page
      .evaluate(async () => {
        await (window as StorageHost).__xegStorageFaults?.restore();
      })
      .catch((error: unknown) => {
        failures.push(error);
        evidence.faultCleanupError = error instanceof Error ? error.message : String(error);
        evidence.status = 'failed';
      });
    evidence.runtimeErrors = [...runtimeErrors];
    await writeFile(
      path.join(output, 'settings-persistence-observations.json'),
      JSON.stringify(evidence, null, 2)
    ).catch((error: unknown) => failures.push(error));
  }
  if (failures.length) {
    throw new AggregateError(failures, 'Settings persistence validation or cleanup failed');
  }
  return evidence;
}
