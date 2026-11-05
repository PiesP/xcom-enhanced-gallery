// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { basename, isAbsolute, join } from 'node:path';
import type { BrowserContext, CDPSession, Page } from '@playwright/test';

declare const chrome: {
  runtime: { id: string; sendMessage(message: { kind: string }): Promise<unknown> };
  storage: {
    local: {
      get(keys: string | string[]): Promise<Record<string, unknown>>;
      set(values: Record<string, unknown>): Promise<void>;
    };
  };
};

export type FilenameDecisionMode = 'passive' | 'passive-undefined' | 'filename' | 'conflict-action';

export interface FilenameDecisionObservation {
  readonly id: number;
  readonly determinedAt?: number;
  readonly mode: FilenameDecisionMode;
  readonly tentativeBasename: string;
  readonly suggestedFilename: string | null;
  readonly conflictAction: 'uniquify' | null;
  readonly sourcePath: string;
  readonly mime: string | null;
  readonly initiatorMatches: true;
}

export interface FilenameDecisionControl {
  readonly id: string;
  setMode(mode: FilenameDecisionMode): Promise<void>;
  readObservations(): Promise<{
    observations: FilenameDecisionObservation[];
    overflow: boolean;
    controlError: string | null;
  }>;
  dispose(): Promise<void>;
}

const PROFILE_PREFIX = 'xeg-chrome-install-';
const MAX_OBSERVATIONS = 12;

export function createFilenameDecisionControlWorkerSource(
  targetExtensionId: string,
  expectedUrl: string,
  suggestedFilename: string
): string {
  const config = JSON.stringify({ targetExtensionId, expectedUrl, suggestedFilename });
  return `// Task-owned filename-decision control. No product code is replaced.
const { targetExtensionId, expectedUrl, suggestedFilename } = ${config};
const maxObservations = ${MAX_OBSERVATIONS};
const basename = (value) => String(value || '').split(/[\\\\/]/u).at(-1) || '';
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  if (item.byExtensionId !== targetExtensionId || item.url !== expectedUrl) {
    suggest();
    return;
  }
  // The callback stays alive while storage is read; every path calls suggest once.
  void (async () => {
    let suggestion;
    let mode;
    try {
      ({ mode } = await chrome.storage.local.get('mode'));
      if (mode === 'filename') {
        suggestion = { filename: suggestedFilename };
      } else if (mode === 'conflict-action') {
        // Explicit uniquify cannot overwrite a preexisting same-name file.
        suggestion = { filename: suggestedFilename, conflictAction: 'uniquify' };
      }
      if (mode === 'passive' || mode === 'passive-undefined' || mode === 'filename' || mode === 'conflict-action') {
        const { observations = [], overflow = false } = await chrome.storage.local.get([
          'observations', 'overflow',
        ]);
        if (observations.length < maxObservations) {
          observations.push({
            id: item.id,
            determinedAt: Date.now(),
            mode,
            tentativeBasename: basename(item.filename),
            suggestedFilename: suggestion?.filename ?? null,
            conflictAction: suggestion?.conflictAction ?? null,
            sourcePath: new URL(item.url).pathname,
            mime: typeof item.mime === 'string' ? item.mime : null,
            initiatorMatches: true,
          });
          await chrome.storage.local.set({ observations });
        } else if (!overflow) {
          await chrome.storage.local.set({ overflow: true });
        }
      }
    } catch {
      // Keep the transfer alive, but make the failed observation visible to the harness.
      await chrome.storage.local.set({ controlError: 'filename-control-storage-failed' }).catch(() => {});
      suggestion = undefined;
    } finally {
      if (suggestion === undefined && mode !== 'passive-undefined') {
        suggest();
      } else {
        suggest(suggestion);
      }
    }
  })();
  return true;
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.kind !== 'xeg-filename-control-ping') return false;
  sendResponse({ ready: true });
  return false;
});
`;
}

/** Installs a separate, task-owned MV3 listener for one exact fixture source and initiator. */
export async function installFilenameDecisionControl({
  context,
  browserCdp,
  profile,
  targetExtensionId,
  expectedUrl,
  suggestedFilename,
}: {
  context: BrowserContext;
  browserCdp: CDPSession;
  profile: string;
  targetExtensionId: string;
  expectedUrl: string;
  suggestedFilename: string;
}): Promise<FilenameDecisionControl> {
  assert(isAbsolute(profile) && basename(profile).startsWith(PROFILE_PREFIX));
  assert(/^[a-p]{32}$/u.test(targetExtensionId), 'Target extension ID is invalid');
  const url = new URL(expectedUrl);
  assert(
    url.protocol === 'https:' &&
      url.hostname === 'pbs.twimg.com' &&
      url.pathname.startsWith('/media/') &&
      !url.username &&
      !url.password &&
      !url.hash,
    'Filename control requires one synthetic photo source'
  );
  assert(
    suggestedFilename.length <= 255 && /^[A-Za-z0-9_-]+\.jpg$/u.test(suggestedFilename),
    'Suggested filename is not bounded'
  );

  const directory = await mkdtemp(join(profile, 'filename-control-'));
  let id: string | undefined;
  let page: Page | undefined;
  let loadAttempted = false;
  try {
    await writeFile(
      join(directory, 'manifest.json'),
      JSON.stringify({
        manifest_version: 3,
        name: 'XEG filename decision control',
        version: '1.0.0',
        permissions: ['downloads', 'storage'],
        background: { service_worker: 'worker.js' },
      })
    );
    await writeFile(
      join(directory, 'worker.js'),
      createFilenameDecisionControlWorkerSource(targetExtensionId, expectedUrl, suggestedFilename)
    );
    loadAttempted = true;
    ({ id } = await browserCdp.send('Extensions.loadUnpacked', { path: directory }));
    assert(typeof id === 'string' && /^[a-p]{32}$/u.test(id) && id !== targetExtensionId);
    page = await context.newPage();
    await page.goto(`chrome-extension://${id}/manifest.json`);
    assert.equal(await page.evaluate(() => chrome.runtime.id), id);
    await page.evaluate(() =>
      chrome.storage.local.set({
        mode: 'passive',
        observations: [],
        overflow: false,
        controlError: null,
      })
    );
    assert.deepEqual(
      await page.evaluate(() => chrome.runtime.sendMessage({ kind: 'xeg-filename-control-ping' })),
      { ready: true }
    );
  } catch (error) {
    const cleanup = await Promise.allSettled([
      page?.close(),
      id ? browserCdp.send('Extensions.uninstall', { id }) : Promise.resolve(),
    ]);
    const cleanupFailures = cleanup
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason);
    if (!cleanupFailures.length && (!loadAttempted || id)) {
      await rm(directory, { recursive: true });
    }
    if (cleanupFailures.length) {
      throw new AggregateError(
        [error, ...cleanupFailures],
        'Filename control setup cleanup failed'
      );
    }
    throw error;
  }

  assert(id && page, 'Filename control setup did not produce an installed page');
  const controlId = id;
  const controlPage = page;
  let disposed = false;
  const assertReady = async (): Promise<void> => {
    assert.deepEqual(
      await controlPage.evaluate(() =>
        chrome.runtime.sendMessage({ kind: 'xeg-filename-control-ping' })
      ),
      { ready: true }
    );
  };
  return {
    id: controlId,
    async setMode(mode) {
      assert(!disposed, 'Filename control is disposed');
      assert(['passive', 'passive-undefined', 'filename', 'conflict-action'].includes(mode));
      await controlPage.evaluate((value) => chrome.storage.local.set({ mode: value }), mode);
      assert.equal(
        await controlPage.evaluate(async () => (await chrome.storage.local.get('mode')).mode),
        mode
      );
      await assertReady();
    },
    async readObservations() {
      assert(!disposed, 'Filename control is disposed');
      const observed = await controlPage.evaluate(async () => {
        const { observations, overflow, controlError } = await chrome.storage.local.get([
          'observations',
          'overflow',
          'controlError',
        ]);
        return { observations, overflow, controlError };
      });
      assert(Array.isArray(observed.observations));
      assert(typeof observed.overflow === 'boolean');
      assert(observed.controlError === null || typeof observed.controlError === 'string');
      return {
        observations: observed.observations as FilenameDecisionObservation[],
        overflow: observed.overflow,
        controlError: observed.controlError,
      };
    },
    async dispose() {
      if (disposed) {
        return;
      }
      const failures: unknown[] = [];
      await controlPage.close().catch((error: unknown) => failures.push(error));
      let uninstalled = false;
      await browserCdp.send('Extensions.uninstall', { id: controlId }).then(
        () => {
          uninstalled = true;
        },
        (error: unknown) => failures.push(error)
      );
      if (uninstalled) {
        await rm(directory, { recursive: true }).catch((error: unknown) => failures.push(error));
      }
      disposed = uninstalled;
      if (failures.length) {
        throw new AggregateError(failures, 'Filename control cleanup failed');
      }
    },
  };
}
