// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { BrowserContext, Page } from '@playwright/test';
import { readExactDownloadFile } from './download-memory.ts';
import { readOwnedNativeBytes, readOwnedNativeFile } from './firefox-install.ts';
import { selectedLivePreferredSource, withFilenameCorrelation } from './filename-correlation.ts';

type NativeItem = {
  id: number;
  state: string;
  filename: string;
  url: string;
  finalUrl?: string;
  mime?: string;
  byExtensionId?: string;
  byExtensionName?: string;
  error?: string;
  bytesReceived?: number;
  totalBytes?: number;
};
declare const chrome: {
  runtime: { id: string };
  downloads: {
    search(query: { limit: number; orderBy: string[] }): Promise<NativeItem[]>;
  };
};
const LIMIT = 4 * 1024 * 1024;
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

/** Independent policy expectation from observed metadata, never gallery position. */
export function expectedLiveFilename(media: Record<string, unknown>, extension: string): string {
  assert(/^(?:jpg|jpeg|png|gif|webp)$/u.test(extension));
  const explicit = media.filename;
  if (typeof explicit === 'string' && explicit.length > 0) {
    assert(/^[A-Za-z0-9_-][A-Za-z0-9_. -]{0,179}\.(?:jpg|jpeg|png|gif|webp)$/u.test(explicit));
    assert(!/^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/iu.test(explicit));
    return explicit;
  }
  const quoted = media.sourceLocation === 'quoted' && media.quotedUsername && media.quotedTweetId;
  const owner = quoted ? media.quotedUsername : media.tweetUsername;
  const post = quoted ? media.quotedTweetId : media.tweetId;
  assert(typeof owner === 'string' && owner !== 'unknown' && /^[A-Za-z0-9_]{1,15}$/u.test(owner));
  assert(typeof post === 'string' && /^\d+$/u.test(post));
  let identity: string;
  if (Number.isSafeInteger(media.attachmentOrdinal) && Number(media.attachmentOrdinal) >= 0) {
    identity = String(media.attachmentOrdinal);
  } else {
    assert(
      typeof media.attachmentSourceKey === 'string' &&
        /^source-[0-9a-f]{16}$/u.test(media.attachmentSourceKey),
      'Live attachment identity is not established'
    );
    identity = media.attachmentSourceKey;
  }
  return `${owner}_${post}_${identity}.${extension}`;
}

export function liveFilenameConforms(actual: string, requested: string): boolean {
  if (actual === requested) {
    return true;
  }
  const dot = requested.lastIndexOf('.');
  const stem = requested.slice(0, dot);
  const extension = requested.slice(dot);
  if (dot < 1 || !actual.startsWith(stem) || !actual.endsWith(extension)) {
    return false;
  }
  return /^ ?\([1-9]\d*\)$/u.test(actual.slice(stem.length, -extension.length));
}

async function ownedDownloads(extensionPage: Page, extensionId: string) {
  return extensionPage.evaluate(async (owner) => {
    if (chrome.runtime.id !== owner) {
      throw new Error('Wrong extension observer origin');
    }
    const rows = await chrome.downloads.search({ limit: 32, orderBy: ['-startTime'] });
    if (rows.length >= 32) {
      throw new Error('Task download inventory exceeded its bound');
    }
    return rows.filter((row) => row.byExtensionId === owner);
  }, extensionId);
}

export function onlyNewLiveDownload(
  items: NativeItem[],
  priorIds: ReadonlySet<number>
): NativeItem | undefined {
  const added = items.filter((item) => !priorIds.has(item.id));
  assert(added.length <= 1, 'One button click created multiple native downloads');
  return added[0];
}

/** Two explicit toolbar clicks: full correlation, then the same path after observer cleanup. */
export async function runReportedLiveFilename(options: {
  context: BrowserContext;
  page: Page;
  extensionId: string;
  root: string;
  output: string;
  downloads: string;
}) {
  const { context, page, extensionId, root, output, downloads } = options;
  const evidence: Record<string, unknown> = {
    schemaVersion: 1,
    status: 'incomplete',
    scope:
      'reported public photo through installed Chrome extension; original profile cause unverified',
    saves: [],
  };
  const extensionPage = await context.newPage();
  try {
    const selection = await page.locator('[data-xeg-gallery-container]').evaluate((gallery) => {
      const toolbar = gallery.querySelector('[data-gallery-element="toolbar"]');
      const index = toolbar?.getAttribute('data-focused-index');
      const item = gallery.querySelector(`[data-gallery-element="item"][data-index="${index}"]`);
      const images = item?.querySelectorAll('img');
      const image = images?.length === 1 ? images[0] : null;
      if (!(image instanceof HTMLImageElement) || !image.complete || image.naturalWidth <= 0) {
        throw new Error('Selected live photo is not loaded');
      }
      if (toolbar?.getAttribute('data-current-index') !== index) {
        throw new Error('Live requested and displayed items differ');
      }
      const display = new URL(image.currentSrc || image.src);
      if (
        display.hostname !== 'pbs.twimg.com' ||
        !/^\/media\/HWXMF0bbcAEnfk6(?:\.(?:jpg|webp))?$/u.test(display.pathname)
      ) {
        throw new Error('Gallery is not displaying the reported attachment');
      }
      return {
        index,
        source: image.currentSrc || image.src,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
    });
    evidence.selection = selection;
    const resolved: { source?: string; original?: Buffer; expected?: string } = {};
    const nativeObservations: unknown[] = [];
    evidence.nativeObservations = nativeObservations;
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    const gallery = page.locator('[data-xeg-gallery-container]');
    const button = gallery.locator(
      '[data-gallery-element="toolbar"] button[aria-label="Download"]'
    );
    const activate = async () => {
      assert.equal(
        await gallery
          .locator('[data-gallery-element="toolbar"]')
          .getAttribute('data-focused-index'),
        selection.index
      );
      const prior = await ownedDownloads(extensionPage, extensionId);
      const ids = new Set(prior.map((row) => row.id));
      let previousState: string | undefined;
      await button.click();
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        const added = onlyNewLiveDownload(await ownedDownloads(extensionPage, extensionId), ids);
        if (added) {
          const record = {
            id: added.id,
            state: added.state,
            filename: basename(added.filename),
            url: added.url,
            finalUrl: added.finalUrl,
            mime: added.mime,
            byExtensionId: added.byExtensionId,
            byExtensionName: added.byExtensionName,
            error: added.error,
            bytesReceived: added.bytesReceived,
            totalBytes: added.totalBytes,
          };
          const serialized = JSON.stringify([added.id, added.state, added.filename, added.error]);
          if (serialized !== previousState) {
            assert(nativeObservations.length < 12, 'Native state observation bound exceeded');
            nativeObservations.push(record);
            previousState = serialized;
          }
        }
        if (added?.state === 'complete') {
          return { item: added, priorIds: [...ids] };
        }
        assert(!added || added.state !== 'interrupted', 'Live native download interrupted');
        assert(
          (await gallery.locator('[data-download-status="error"]').count()) === 0,
          'Product download failed before native completion'
        );
        await page.waitForTimeout(100);
      }
      throw new Error('Live native download did not complete');
    };
    const first = await withFilenameCorrelation({
      context,
      page,
      extensionPage,
      extensionId,
      root,
      output,
      downloads,
      target: 'reported-live-post',
      label: 'live-original',
      action: activate,
      resolveLiveOriginal: async (selected) => {
        const source = selectedLivePreferredSource(selected);
        resolved.source = source;
        const format = new URL(source).searchParams.get('format');
        assert(format && /^(?:jpg|jpeg|png|gif|webp)$/u.test(format));
        resolved.expected = expectedLiveFilename(selected, format);
        evidence.selectedMedia = selected;
        evidence.source = source;
        evidence.expectedFilename = resolved.expected;
        const head = await page.request.head(source, { timeout: 15_000, maxRedirects: 0 });
        let length: number;
        try {
          assert.equal(head.status(), 200, 'Live original HEAD failed');
          length = Number(head.headers()['content-length']);
          assert(
            Number.isSafeInteger(length) && length > 0 && length <= LIMIT,
            'Live original has no bounded size'
          );
        } finally {
          await head.dispose();
        }
        const response = await page.request.get(source, { timeout: 20_000, maxRedirects: 0 });
        try {
          assert.equal(response.status(), 200, 'Live original GET failed');
          assert.equal(Number(response.headers()['content-length']), length);
          const mime = (response.headers()['content-type'] ?? '').split(';')[0]?.toLowerCase();
          assert.equal(mime, `image/${format === 'jpg' ? 'jpeg' : format}`);
          resolved.original = await response.body();
          assert.equal(resolved.original.length, length);
          if (format === 'webp') {
            assert(
              resolved.original.toString('ascii', 0, 4) === 'RIFF' &&
                resolved.original.toString('ascii', 8, 12) === 'WEBP'
            );
          } else if (format === 'jpg' || format === 'jpeg') {
            assert(resolved.original[0] === 0xff && resolved.original[1] === 0xd8);
          }
          evidence.publicOriginal = {
            bytes: resolved.original.length,
            sha256: sha256(resolved.original),
            mime,
          };
          return { url: source, bytes: resolved.original };
        } finally {
          await response.dispose();
        }
      },
    });
    const trace = JSON.parse(
      await readFile(join(output, 'filename-correlation-live-original.json'), 'utf8')
    ) as Record<string, unknown>;
    assert.equal(trace.observationComplete, true);
    assert.equal(trace.cleanupComplete, true, 'Download observers did not clean up before repeat');
    const comparisons = trace.nameComparison as Record<string, unknown>;
    assert.equal(
      comparisons?.generatedEqualsRequest,
      true,
      'MV3 request changed the generated name'
    );
    assert.equal(
      comparisons?.requestEqualsNativeOption,
      true,
      'Native options changed the requested name'
    );
    const calls = trace.nativeCall as Array<{ saveAs?: boolean }>;
    assert.equal(calls?.length, 1);
    assert.equal(calls[0]?.saveAs, false, 'Live save did not use automatic native saving');
    assert.equal(
      trace.generatedFilename,
      resolved.expected,
      'Generated name differs from captured attachment policy'
    );
    assert(
      resolved.source && resolved.original && resolved.expected,
      'Selected live source was not captured'
    );
    const { source, original, expected } = resolved;
    const saves: unknown[] = [];
    evidence.saves = saves;
    const verifySave = async (save: Awaited<ReturnType<typeof activate>>, label: string) => {
      const { item, priorIds } = save;
      assert.equal(item.url, source, 'Native URL differs from captured preferred source');
      const { bytes } = await readOwnedNativeBytes(downloads, item.filename, original.length);
      assert.equal(bytes.length, original.length);
      assert(bytes.equals(original), 'Live saved file differs from independent original GET');
      const actualName = basename(item.filename);
      // The maintained transport accepts flat safe names; retain the native name in evidence.
      const retainedFile = `live-original-${item.id}.bin`;
      await writeFile(join(output, retainedFile), bytes, { flag: 'wx' });
      assert(
        (await readExactDownloadFile(join(output, retainedFile), bytes.length)).bytes.equals(bytes)
      );
      const notice = gallery.locator('[data-gallery-element="download-filename-notice"]');
      await notice.waitFor({ state: 'visible', timeout: 15_000 });
      assert.equal(await notice.locator('bdi').textContent(), actualName);
      const reportedConformance = await notice.getAttribute('data-filename-conforms');
      const noticeText = await notice.textContent();
      assert(noticeText !== null && noticeText.includes('Saved filename'));
      const conforms = liveFilenameConforms(actualName, expected);
      assert.equal(reportedConformance, String(conforms));
      assert.equal(
        noticeText.includes('The saved name differs from the requested name.'),
        !conforms
      );
      await gallery.locator('[data-download-status="handedOff"]').waitFor({ state: 'visible' });
      const screenshot = `live-filename-${item.id}.png`;
      await page.screenshot({ path: join(output, screenshot) });
      await notice.getByRole('button', { name: 'Dismiss filename notice' }).click();
      await notice.waitFor({ state: 'detached' });
      await page.waitForTimeout(750);
      const after = await ownedDownloads(extensionPage, extensionId);
      assert.deepEqual(
        after.map((row) => row.id).sort((a, b) => a - b),
        [...priorIds, item.id].sort((a, b) => a - b),
        'Completion or dismissal created an extra save'
      );
      await readOwnedNativeFile(downloads, item.filename, original);
      saves.push({
        label,
        native: { ...item, filename: actualName },
        originalBrowserPath: item.filename,
        file: {
          basename: actualName,
          bytes: bytes.length,
          sha256: sha256(bytes),
          retainedFile,
          originalInspectedBeforeCopy: true,
        },
        notice: {
          observedFilename: actualName,
          reportedConformance,
          mismatchExplanation: !conforms,
          dismissedWithoutSave: true,
        },
        screenshot,
      });
    };
    evidence.correlation = 'filename-correlation-live-original.json';
    await verifySave(first, 'correlated');
    await verifySave(await activate(), 'observers-removed');
    evidence.status = 'observed';
    return evidence;
  } catch (error) {
    evidence.error =
      error instanceof Error
        ? { name: error.name, message: error.message.split('\n')[0] }
        : { name: 'Error' };
    throw error;
  } finally {
    try {
      await extensionPage.close();
    } finally {
      await writeFile(join(output, 'live-filename.json'), `${JSON.stringify(evidence, null, 2)}\n`);
    }
  }
}
