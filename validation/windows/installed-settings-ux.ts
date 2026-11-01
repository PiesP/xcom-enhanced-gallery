// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CDPSession, Page } from '@playwright/test';
import { decodeStoredValue } from './live-page.ts';

declare const chrome: {
  storage: { local: { get(keys: string | string[]): Promise<Record<string, unknown>> } };
};

const FIT_KEY = 'xeg-app-settings:field:gallery.imageFitMode';
const FALLBACK_KEY = `xeg-fallback:${FIT_KEY}`;
const MARKER = '__xegInstalledSettingsFaults445';

type ContentRealm = {
  cdp: CDPSession;
  realm: { id: number; name: string; origin: string };
};

type FaultSnapshot = {
  phase: string;
  primaryAttempts: number;
  primaryDenials: number;
  fallbackAttempts: number;
  fallbackDenials: number;
  held: boolean;
  overflow: boolean;
  wrappersIntact: boolean;
  events: Array<{ phase: string; path: string; outcome: string }>;
};

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function waitFor<T>(read: () => Promise<T | undefined>, label: string): Promise<T> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const value = await read();
    if (value !== undefined) {
      return value;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function readPrimaryFit(
  extensionPage: Page
): Promise<{ exists: boolean; raw: unknown; mode: string | null }> {
  const stored = await extensionPage.evaluate(async (key) => {
    const values = await chrome.storage.local.get(key);
    return { exists: Object.hasOwn(values, key), raw: values[key] ?? null };
  }, FIT_KEY);
  const decoded = decodeStoredValue(stored.raw);
  return { ...stored, mode: typeof decoded === 'string' ? decoded : null };
}

async function readFallbackFit(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), FALLBACK_KEY);
}

/** Exercises the installed extension's content-world storage boundary on the current owned fixture document. */
export async function runInstalledSettingsUx({
  page,
  extensionPage,
  extensionId,
  output,
  contentRealm,
}: {
  page: Page;
  extensionPage: Page;
  extensionId: string;
  output: string;
  contentRealm: ContentRealm;
}): Promise<Record<string, unknown>> {
  assert.equal(contentRealm.realm.origin.replace(/\/$/, ''), `chrome-extension://${extensionId}`);
  const { cdp, realm } = contentRealm;
  const evidence: Record<string, unknown> = {
    status: 'failed',
    scope: 'installed extension content-script storage boundary on an owned X fixture',
    realm: { name: realm.name, origin: realm.origin },
  };
  const cleanupErrors: string[] = [];
  let primaryError: unknown;
  let fallbackBefore: string | null = null;
  let fallbackSnapshotTaken = false;
  let installed = false;

  const evaluateRealm = async <T>(expression: string, label: string): Promise<T> => {
    const response = await cdp.send('Runtime.evaluate', {
      contextId: realm.id,
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    assert.equal(response.exceptionDetails, undefined, `${label} threw in installed content realm`);
    return response.result.value as T;
  };

  const snapshot = async (): Promise<FaultSnapshot> => {
    const result = await evaluateRealm<FaultSnapshot>(
      `(() => {
      const state = globalThis.${MARKER};
      if (!state) throw new Error('Installed settings fault marker is missing');
      return {
        phase: state.phase, primaryAttempts: state.primaryAttempts,
        primaryDenials: state.primaryDenials, fallbackAttempts: state.fallbackAttempts,
        fallbackDenials: state.fallbackDenials, held: state.held,
        overflow: state.overflow, wrappersIntact:
          state.storage.set === state.setWrapper && Storage.prototype.setItem === state.fallbackWrapper,
        events: state.events
      };
    })()`,
      'fault snapshot'
    );
    assert.equal(result.wrappersIntact, true, 'Installed storage fault wrapper was replaced');
    assert.equal(result.overflow, false, 'Installed storage fault event limit was exceeded');
    return result;
  };

  const configure = async (
    phase: string,
    denyPrimary: boolean,
    denyFallback: boolean,
    holdNext = false
  ): Promise<void> => {
    const config = JSON.stringify({ phase, denyPrimary, denyFallback, holdNext });
    const changed = await evaluateRealm<boolean>(
      `(() => {
      const state = globalThis.${MARKER};
      if (!state) throw new Error('Installed settings fault marker is missing');
      Object.assign(state, ${config});
      return state.storage.set === state.setWrapper && Storage.prototype.setItem === state.fallbackWrapper;
    })()`,
      'fault configuration'
    );
    assert.equal(changed, true, 'Installed storage fault wrapper was replaced');
  };

  try {
    const origin = await page.evaluate(() => ({
      protocol: location.protocol,
      host: location.hostname,
    }));
    assert.equal(origin.protocol, 'https:', 'Settings fixture must use HTTPS X origin');
    assert(['x.com', 'twitter.com'].includes(origin.host), 'Settings fixture must use an X origin');
    fallbackBefore = await readFallbackFit(page);
    fallbackSnapshotTaken = true;
    const installation = await evaluateRealm<{
      installed: boolean;
      runtimeId: string;
      topFrame: boolean;
    }>(
      `(() => {
      if (Object.hasOwn(globalThis, '${MARKER}')) throw new Error('Settings fault marker already exists');
      const api = globalThis.browser ?? chrome;
      const storage = api.storage?.local;
      const runtimeId = api.runtime?.id;
      const topFrame = window.top === window;
      if (runtimeId !== ${JSON.stringify(extensionId)} || !topFrame || !storage) {
        throw new Error('Content realm is not the installed extension top frame');
      }
      const setDescriptor = Object.getOwnPropertyDescriptor(storage, 'set');
      const fallbackDescriptor = Object.getOwnPropertyDescriptor(Storage.prototype, 'setItem');
      const originalSet = storage.set;
      const originalFallback = Storage.prototype.setItem;
      if (typeof originalSet !== 'function' || typeof originalFallback !== 'function') {
        throw new Error('Storage methods are unavailable');
      }
      if ((setDescriptor && !setDescriptor.configurable && !setDescriptor.writable) ||
          (!setDescriptor && !Object.isExtensible(storage)) ||
          (fallbackDescriptor && !fallbackDescriptor.configurable && !fallbackDescriptor.writable)) {
        throw new Error('Storage methods are not patchable');
      }
      const restoreProperty = (owner, name, descriptor) => {
        if (descriptor) Object.defineProperty(owner, name, descriptor);
        else delete owner[name];
      };
      const state = {
        storage, setDescriptor, fallbackDescriptor, originalSet, originalFallback,
        setWrapper: null, fallbackWrapper: null, phase: 'installed',
        denyPrimary: false, denyFallback: false, holdNext: false,
        primaryAttempts: 0, primaryDenials: 0, fallbackAttempts: 0, fallbackDenials: 0,
        held: false, release: null, events: [], overflow: false,
      };
      const record = (path, outcome) => {
        if (state.events.length >= 32) state.overflow = true;
        else state.events.push({ phase: state.phase, path, outcome });
      };
      state.setWrapper = function(items, ...rest) {
        const keys = items && typeof items === 'object' ? Object.keys(items) : [];
        if (!keys.includes(${JSON.stringify(FIT_KEY)})) {
          return Reflect.apply(originalSet, this, [items, ...rest]);
        }
        if (keys.length !== 1) throw new Error('Unexpected multi-key fit storage write');
        state.primaryAttempts++;
        if (state.holdNext) {
          state.holdNext = false;
          state.held = true;
          record('primary', 'held');
          return new Promise((resolve, reject) => {
            state.release = () => {
              if (!state.held) return false;
              state.held = false;
              state.release = null;
              if (state.denyPrimary) {
                state.primaryDenials++;
                record('primary', 'denied-after-hold');
                reject(new Error('controlled installed primary denial'));
              } else {
                record('primary', 'accepted-after-hold');
                Promise.resolve().then(() => Reflect.apply(originalSet, this, [items, ...rest])).then(resolve, reject);
              }
              return true;
            };
          });
        }
        if (state.denyPrimary) {
          state.primaryDenials++;
          record('primary', 'denied');
          return Promise.reject(new Error('controlled installed primary denial'));
        }
        record('primary', 'accepted');
        return Reflect.apply(originalSet, this, [items, ...rest]);
      };
      state.fallbackWrapper = function(key, value) {
        if (key !== ${JSON.stringify(FALLBACK_KEY)}) {
          return Reflect.apply(originalFallback, this, [key, value]);
        }
        state.fallbackAttempts++;
        if (state.denyFallback) {
          state.fallbackDenials++;
          record('fallback', 'denied');
          throw new Error('controlled installed fallback denial');
        }
        record('fallback', 'accepted');
        return Reflect.apply(originalFallback, this, [key, value]);
      };
      try {
        storage.set = state.setWrapper;
        Storage.prototype.setItem = state.fallbackWrapper;
        if (storage.set !== state.setWrapper || Storage.prototype.setItem !== state.fallbackWrapper) {
          throw new Error('Storage wrapper identity mismatch');
        }
        globalThis.${MARKER} = state;
      } catch (error) {
        restoreProperty(storage, 'set', setDescriptor);
        restoreProperty(Storage.prototype, 'setItem', fallbackDescriptor);
        throw error;
      }
      return { installed: true, runtimeId, topFrame };
    })()`,
      'fault installation'
    );
    installed = installation.installed === true;
    assert.deepEqual(installation, { installed: true, runtimeId: extensionId, topFrame: true });

    const settingsButton = page.locator('#settings-button');
    const panel = page.locator('#toolbar-settings-panel');
    const outerCue = page.locator('[data-xeg-settings-unsaved-indicator]');
    const innerCue = page.locator('[data-xeg-settings-unsaved]');
    const fitHeight = page.locator('button[aria-label="Fit Height"]');
    const fitWidth = page.locator('button[aria-label="Fit Width"]');
    assert.equal(await settingsButton.getAttribute('aria-expanded'), 'true');
    assert.equal(await panel.isVisible(), true);
    const readUnrelated = () =>
      extensionPage.evaluate(async () =>
        chrome.storage.local.get(['xeg-app-settings', 'xeg-app-settings:field:gallery.theme'])
      );
    const unrelatedBefore = await readUnrelated();
    const baseline = decodeStoredValue(unrelatedBefore['xeg-app-settings']);
    assert(baseline && typeof baseline === 'object' && '__schemaHash' in baseline);
    assert.equal(
      baseline.__schemaHash,
      '1',
      'Installed fault fixture needs a recognized stored baseline'
    );
    assert.equal(await page.locator('#settings-theme-select').inputValue(), 'dark');
    evidence.healthyBaseline = { recognizedSchema: '1', unrelatedTheme: 'dark' };

    await configure('healthy-primary', false, false);
    const healthyStart = await snapshot();
    await fitHeight.click();
    await waitFor(async () => {
      const stored = await readPrimaryFit(extensionPage);
      return stored.mode === 'fitHeight' ? stored : undefined;
    }, 'healthy installed fit persistence');
    const healthy = await snapshot();
    assert.equal(healthy.primaryAttempts, healthyStart.primaryAttempts + 1);
    assert.equal(await readFallbackFit(page), null);
    assert.equal(await outerCue.count(), 0);
    assert.equal(await innerCue.count(), 0);
    evidence.healthyPrimary = { storedFit: 'fitHeight', primaryAttempts: 1, fallbackAbsent: true };

    await configure('primary-fallback', true, false);
    const fallbackStart = await snapshot();
    const primaryBeforeFallback = await readPrimaryFit(extensionPage);
    await fitWidth.click();
    await waitFor(async () => {
      const raw = await readFallbackFit(page);
      return decodeStoredValue(raw) === 'fitWidth' ? (raw ?? undefined) : undefined;
    }, 'installed fallback fit persistence');
    const fallback = await snapshot();
    assert.equal(fallback.primaryAttempts, fallbackStart.primaryAttempts + 1);
    assert.equal(fallback.primaryDenials, fallbackStart.primaryDenials + 1);
    assert.equal(fallback.fallbackAttempts, fallbackStart.fallbackAttempts + 1);
    assert.deepEqual(await readPrimaryFit(extensionPage), primaryBeforeFallback);
    assert.equal(await outerCue.count(), 0, 'Successful fallback showed an unsaved cue');
    assert.equal(await innerCue.count(), 0, 'Successful fallback showed Settings failure');
    evidence.primaryFallback = { fallbackFit: 'fitWidth', primaryUnchanged: true, cueAbsent: true };

    await settingsButton.click();
    assert.equal(await settingsButton.getAttribute('aria-expanded'), 'false');
    await configure('closed-both-denied', true, true);
    const deniedStart = await snapshot();
    const primaryBeforeDenial = await readPrimaryFit(extensionPage);
    const fallbackBeforeDenial = await readFallbackFit(page);
    await fitHeight.click();
    await outerCue.waitFor({ state: 'visible', timeout: 5_000 });
    const denied = await snapshot();
    assert.equal(denied.primaryAttempts, deniedStart.primaryAttempts + 1);
    assert.equal(denied.primaryDenials, deniedStart.primaryDenials + 1);
    assert.equal(denied.fallbackDenials, deniedStart.fallbackDenials + 1);
    assert.deepEqual(await readPrimaryFit(extensionPage), primaryBeforeDenial);
    assert.equal(await readFallbackFit(page), fallbackBeforeDenial);
    await page.screenshot({ path: join(output, 'installed-settings-closed-denied.png') });
    await outerCue.getByRole('button').click();
    await innerCue.waitFor({ state: 'visible', timeout: 5_000 });
    const retryStart = await snapshot();
    await innerCue.getByRole('button').click();
    await waitFor(async () => {
      const current = await snapshot();
      return current.fallbackDenials > retryStart.fallbackDenials ? current : undefined;
    }, 'repeated installed fit denial');
    assert.equal(await innerCue.isVisible(), true);
    assert.equal(await readFallbackFit(page), fallbackBeforeDenial);
    await configure('closed-retry', false, false);
    await innerCue.getByRole('button').click();
    await innerCue.waitFor({ state: 'detached', timeout: 5_000 });
    await waitFor(async () => {
      const stored = await readPrimaryFit(extensionPage);
      return stored.mode === 'fitHeight' && (await readFallbackFit(page)) === null
        ? true
        : undefined;
    }, 'installed closed Settings retry persistence');
    assert.equal(await outerCue.count(), 0);
    evidence.closedDeniedRetry = {
      deniedPrimaryAndFallback: true,
      repeatedDenial: true,
      storedFit: 'fitHeight',
      fallbackAbsent: true,
    };

    await configure('late-held', false, false, true);
    const lateStart = await snapshot();
    const primaryBeforeLate = await readPrimaryFit(extensionPage);
    await fitWidth.click();
    await waitFor(async () => {
      const current = await snapshot();
      return current.held ? current : undefined;
    }, 'held installed fit write');
    assert.equal(await outerCue.count(), 0, 'Pending installed fit write showed failure');
    assert.equal(await innerCue.count(), 0, 'Pending installed fit write showed Settings failure');
    assert.deepEqual(await readPrimaryFit(extensionPage), primaryBeforeLate);
    await settingsButton.click();
    assert.equal(await settingsButton.getAttribute('aria-expanded'), 'false');
    assert.equal(
      await outerCue.count(),
      0,
      'Closing Settings while write was pending showed failure'
    );
    await configure('late-denied', true, true);
    const released = await evaluateRealm<boolean>(
      `(() => {
      const state = globalThis.${MARKER};
      return state?.release?.() === true;
    })()`,
      'held fit release'
    );
    assert.equal(released, true);
    await outerCue.waitFor({ state: 'visible', timeout: 5_000 });
    const lateDenied = await snapshot();
    assert.equal(lateDenied.primaryAttempts, lateStart.primaryAttempts + 1);
    assert.equal(lateDenied.primaryDenials, lateStart.primaryDenials + 1);
    assert.equal(lateDenied.fallbackDenials, lateStart.fallbackDenials + 1);
    assert.deepEqual(await readPrimaryFit(extensionPage), primaryBeforeLate);
    assert.equal(await readFallbackFit(page), null);
    await page.screenshot({ path: join(output, 'installed-settings-late-denied.png') });
    await outerCue.getByRole('button').click();
    await innerCue.waitFor({ state: 'visible', timeout: 5_000 });
    await configure('late-retry', false, false);
    await innerCue.getByRole('button').click();
    await innerCue.waitFor({ state: 'detached', timeout: 5_000 });
    await waitFor(async () => {
      const stored = await readPrimaryFit(extensionPage);
      return stored.mode === 'fitWidth' && (await readFallbackFit(page)) === null
        ? true
        : undefined;
    }, 'installed late fit retry persistence');
    assert.equal(await outerCue.count(), 0);
    evidence.lateDeniedRetry = {
      pendingCueAbsent: true,
      closedBeforeDenial: true,
      storedFit: 'fitWidth',
      fallbackAbsent: true,
    };
    assert.deepEqual(
      await readUnrelated(),
      unrelatedBefore,
      'Fit failures or retries changed the base or unrelated theme'
    );
    evidence.unrelatedPreferencesPreserved = true;
    evidence.faults = await snapshot();
    evidence.status = 'passed';
  } catch (error) {
    primaryError = error;
    evidence.error = errorText(error);
    await page
      .screenshot({ path: join(output, 'installed-settings-ux-failure.png') })
      .catch((screenshotError: unknown) => {
        evidence.failureScreenshotError = errorText(screenshotError);
      });
  } finally {
    if (installed) {
      try {
        const disposal = await evaluateRealm<{ restored: boolean; heldReleased: boolean }>(
          `(async () => {
          const state = globalThis.${MARKER};
          if (!state) throw new Error('Installed settings fault marker is missing at cleanup');
          state.denyPrimary = true;
          state.denyFallback = true;
          const fallbackDenialsBefore = state.fallbackDenials;
          const heldReleased = state.release?.() === true;
          if (heldReleased) {
            const deadline = Date.now() + 5_000;
            while (state.fallbackDenials === fallbackDenialsBefore && Date.now() < deadline) {
              await new Promise(resolve => setTimeout(resolve, 0));
            }
            if (state.fallbackDenials === fallbackDenialsBefore) {
              throw new Error('Held fit write did not reach fallback before cleanup');
            }
          }
          if (state.storage.set !== state.setWrapper || Storage.prototype.setItem !== state.fallbackWrapper) {
            throw new Error('Storage wrapper identity changed before cleanup');
          }
          const sameDescriptor = (left, right) => {
            if (!left || !right) return left === right;
            return Reflect.ownKeys(left).length === Reflect.ownKeys(right).length &&
              Reflect.ownKeys(left).every(key => left[key] === right[key]);
          };
          if (state.setDescriptor) Object.defineProperty(state.storage, 'set', state.setDescriptor);
          else delete state.storage.set;
          if (state.fallbackDescriptor) Object.defineProperty(Storage.prototype, 'setItem', state.fallbackDescriptor);
          else delete Storage.prototype.setItem;
          const restored = state.storage.set === state.originalSet &&
            Storage.prototype.setItem === state.originalFallback &&
            sameDescriptor(Object.getOwnPropertyDescriptor(state.storage, 'set'), state.setDescriptor) &&
            sameDescriptor(Object.getOwnPropertyDescriptor(Storage.prototype, 'setItem'), state.fallbackDescriptor);
          delete globalThis.${MARKER};
          return { restored: restored && !Object.hasOwn(globalThis, '${MARKER}'), heldReleased };
        })()`,
          'fault disposal'
        );
        assert.equal(
          disposal.restored,
          true,
          'Installed storage methods/descriptors were not restored'
        );
        evidence.faultMethodsRestored = true;
        evidence.heldReleasedDuringCleanup = disposal.heldReleased;
      } catch (error) {
        cleanupErrors.push(`content realm: ${errorText(error)}`);
      }
    }
    if (fallbackSnapshotTaken) {
      try {
        await page.evaluate(
          ({ key, raw }) => {
            if (raw === null) {
              localStorage.removeItem(key);
            } else {
              localStorage.setItem(key, raw);
            }
          },
          { key: FALLBACK_KEY, raw: fallbackBefore }
        );
        assert.equal(
          await readFallbackFit(page),
          fallbackBefore,
          'X-origin fallback was not restored'
        );
        evidence.originFallbackRestored = true;
      } catch (error) {
        cleanupErrors.push(`X-origin fallback: ${errorText(error)}`);
      }
    }
    evidence.cleanupErrors = cleanupErrors;
    if (cleanupErrors.length) {
      evidence.status = 'failed';
    }
    try {
      await writeFile(
        join(output, 'installed-settings-ux.json'),
        JSON.stringify(evidence, null, 2)
      );
    } catch (error) {
      cleanupErrors.push(`receipt: ${errorText(error)}`);
    }
  }
  if (primaryError && cleanupErrors.length) {
    throw new AggregateError(
      [primaryError, ...cleanupErrors],
      'Installed settings UX and cleanup failed'
    );
  }
  if (primaryError) {
    throw primaryError;
  }
  if (cleanupErrors.length) {
    throw new Error(`Installed settings UX cleanup failed: ${cleanupErrors.join('; ')}`);
  }
  return evidence;
}
