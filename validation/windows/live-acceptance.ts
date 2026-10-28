// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { open, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import type { BrowserContext, ElementHandle, Page } from '@playwright/test';
import { verifyStoredZip } from './download-memory.ts';
import {
  inspectHitTestedAction,
  inspectLiveTargetDocument,
  isBoundLiveImageOwnerDocument,
  resolveLiveImageActionDocument,
  resolveLiveImageDocument,
} from './live-page-document.ts';
import type { Identity, ImageTarget } from './live-page-document.ts';

declare const chrome: {
  downloads: {
    search(query: { orderBy: string[] }): Promise<DownloadItem[]>;
    cancel(id: number): Promise<void>;
  };
};

const MAX_MEDIA = 4;
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_RETAINED_BYTES = 128 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 60_000;

type StoredField = { exists: boolean; value: unknown };
type StoredSettings = {
  exists: boolean;
  value: unknown;
  settings: unknown;
  fields?: Record<string, StoredField>;
};
type DownloadItem = {
  id: number;
  state: string;
  filename: string;
  url: string;
  finalUrl?: string;
  bytesReceived: number;
  totalBytes: number;
  exists: boolean;
  error?: string;
};
type Selection = {
  position: number;
  total: number;
  currentIndex: number;
  focusedIndex: number;
  path: string;
};

export function parseActualSiteAcceptanceSelector(
  text: string | null,
  context: {
    liveUrls: readonly string[];
    installation: string;
    otherFocusedInput: boolean;
  }
): boolean {
  if (text === null) {
    return false;
  }
  assert.deepEqual(JSON.parse(text), { scenario: 'actual-site-acceptance' });
  assert.equal(context.installation, 'extension', 'Actual-site acceptance requires an extension');
  assert(context.liveUrls.length > 0, 'Actual-site acceptance requires public live URLs');
  assert(!context.otherFocusedInput, 'Actual-site acceptance cannot share a focused selector');
  return true;
}

function identityFromUrl(value: string): Identity {
  const match = /^https:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/([1-9]\d*)$/u.exec(
    value
  );
  assert(match?.[1] && match[2], 'Validated status identity is missing');
  return { handle: match[1], statusId: match[2] };
}

function selectedGalleryImageDocument(): Selection | null {
  const gallery = document.querySelector('[data-xeg-gallery-container]');
  const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
  const counter = toolbar?.querySelector('#xeg-toolbar-counter[data-gallery-element="position"]');
  const position = Number(counter?.getAttribute('data-position'));
  const total = Number(counter?.getAttribute('data-total'));
  const currentIndex = Number(toolbar?.getAttribute('data-current-index'));
  const focusedIndex = Number(toolbar?.getAttribute('data-focused-index'));
  const item = gallery?.querySelector(
    `[data-gallery-element="item"][data-index="${currentIndex}"]`
  );
  const image = item?.querySelector('img');
  if (
    !gallery ||
    !toolbar ||
    !counter ||
    !Number.isSafeInteger(position) ||
    !Number.isSafeInteger(total) ||
    total < 1 ||
    !Number.isSafeInteger(currentIndex) ||
    currentIndex !== position - 1 ||
    focusedIndex !== currentIndex ||
    counter.getAttribute('data-current-index') !== String(currentIndex) ||
    counter.getAttribute('data-focused-index') !== String(focusedIndex) ||
    !(image instanceof HTMLImageElement) ||
    !image.complete ||
    image.naturalWidth <= 0
  ) {
    return null;
  }
  try {
    const url = new URL(image.currentSrc || image.src);
    return url.protocol === 'https:' &&
      url.hostname === 'pbs.twimg.com' &&
      url.pathname.startsWith('/media/')
      ? { position, total, currentIndex, focusedIndex, path: url.pathname }
      : null;
  } catch {
    return null;
  }
}

async function waitSelection(page: Page, position: number): Promise<Selection> {
  await page.waitForFunction(
    (expected) => {
      const counter = document.querySelector(
        '#xeg-toolbar-counter[data-gallery-element="position"]'
      );
      const toolbar = counter?.closest('[data-gallery-element="toolbar"]');
      return (
        counter?.getAttribute('data-position') === String(expected) &&
        counter.getAttribute('data-current-index') === String(expected - 1) &&
        counter.getAttribute('data-focused-index') === String(expected - 1) &&
        toolbar?.getAttribute('data-current-index') === String(expected - 1) &&
        toolbar.getAttribute('data-focused-index') === String(expected - 1)
      );
    },
    position,
    { timeout: 10_000 }
  );
  const deadline = Date.now() + 5_000;
  let selected = await page.evaluate(selectedGalleryImageDocument);
  while ((!selected || selected.position !== position) && Date.now() < deadline) {
    await new Promise((done) => setTimeout(done, 100));
    selected = await page.evaluate(selectedGalleryImageDocument);
  }
  assert(
    selected && selected.position === position,
    'Gallery selected/focused image identity differs'
  );
  return selected;
}

async function gallerySources(page: Page): Promise<string[]> {
  const sources = await page.locator('[data-xeg-gallery-container]').evaluate((gallery) =>
    [...gallery.querySelectorAll('[data-gallery-element="item"]')].map((item) => {
      const images = item.querySelectorAll('img');
      if (images.length !== 1 || !(images[0] instanceof HTMLImageElement)) {
        return null;
      }
      return images[0].currentSrc || images[0].src;
    })
  );
  assert(
    sources.length >= 2 && sources.length <= MAX_MEDIA,
    'Actual-site acceptance needs 2-4 images'
  );
  const originals = sources.map((source) => {
    assert(source, 'Gallery media source is missing');
    const url = new URL(source);
    assert(
      url.protocol === 'https:' &&
        url.hostname === 'pbs.twimg.com' &&
        url.pathname.startsWith('/media/'),
      'Gallery contains a non-public-image source'
    );
    url.searchParams.set('name', 'orig');
    return url.href;
  });
  assert.equal(new Set(originals.map((value) => new URL(value).pathname)).size, originals.length);
  return originals;
}

async function preflightSources(page: Page, sources: readonly string[], selectedIndex: number) {
  const lengths: number[] = [];
  for (const source of sources) {
    const response = await page.request.head(source, { timeout: 15_000, maxRedirects: 3 });
    assert(response.ok(), 'Public image HEAD preflight failed');
    const value = response.headers()['content-length'];
    const bytes = Number(value);
    assert(
      value && Number.isSafeInteger(bytes) && bytes > 0 && bytes <= MAX_FILE_BYTES,
      'Public image has no bounded declared size'
    );
    lengths.push(bytes);
  }
  const projected = lengths.reduce((sum, bytes) => sum + bytes, 0) + (lengths[selectedIndex] ?? 0);
  assert(
    projected + 1_048_576 <= MAX_RETAINED_BYTES,
    'Declared single and ZIP media exceed retained-file budget'
  );
  return lengths;
}

async function queryDownloads(extensionPage: Page): Promise<DownloadItem[]> {
  return extensionPage.evaluate(() => chrome.downloads.search({ orderBy: ['-startTime'] }));
}

async function waitForOwnedDownload(
  extensionPage: Page,
  previous: Set<number>,
  limit: number,
  progress: Array<{ id: number; state: string; bytesReceived: number; totalBytes: number }>
): Promise<DownloadItem> {
  const deadline = Date.now() + DOWNLOAD_TIMEOUT_MS;
  let observedId: number | null = null;
  while (Date.now() < deadline) {
    const added = (await queryDownloads(extensionPage)).filter(({ id }) => !previous.has(id));
    if (added.length > 1) {
      await Promise.all(
        added.map(({ id }) =>
          extensionPage.evaluate((value) => chrome.downloads.cancel(value), id).catch(() => {})
        )
      );
      throw new Error('Ambiguous new native download IDs');
    }
    const item = added[0];
    if (item) {
      observedId = item.id;
      const current = {
        id: item.id,
        state: item.state,
        bytesReceived: item.bytesReceived,
        totalBytes: item.totalBytes,
      };
      if (JSON.stringify(progress.at(-1)) !== JSON.stringify(current)) {
        if (progress.length < 16) {
          progress.push(current);
        } else {
          progress[15] = current;
        }
      }
      if (item.bytesReceived > limit || item.totalBytes > limit) {
        await extensionPage.evaluate((id) => chrome.downloads.cancel(id), item.id).catch(() => {});
        throw new Error('Native download exceeded the retained-file budget');
      }
      if (item.state === 'interrupted') {
        throw new Error(`Native download interrupted: ${item.error ?? 'unknown'}`);
      }
      if (item.state === 'complete') {
        assert(item.exists, 'Completed native download is missing');
        return item;
      }
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  if (observedId !== null) {
    await extensionPage.evaluate((id) => chrome.downloads.cancel(id), observedId).catch(() => {});
  }
  throw new Error('Timed out waiting for one new native download');
}

async function readOwnedFile(
  item: DownloadItem,
  downloads: string,
  limit: number
): Promise<Buffer> {
  assert.equal(
    resolve(dirname(item.filename)),
    resolve(downloads),
    'Native download escaped the task-owned directory'
  );
  const handle = await open(item.filename, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const before = await handle.stat();
    assert(
      before.isFile() && before.size > 0 && before.size <= limit,
      'Native download is not a bounded regular file'
    );
    const bytes = Buffer.alloc(before.size);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await handle.read(bytes, offset, bytes.length - offset, offset);
      assert(bytesRead > 0, 'Native download changed during bounded read');
      offset += bytesRead;
    }
    const after = await handle.stat();
    assert(
      after.isFile() &&
        after.dev === before.dev &&
        after.ino === before.ino &&
        after.size === before.size &&
        after.mtimeMs === before.mtimeMs &&
        after.ctimeMs === before.ctimeMs,
      'Native download changed during verification'
    );
    return bytes;
  } finally {
    await handle.close();
  }
}

/** Extract only bounded stored local entries; the existing verifier checks central order and CRCs. */
export function inspectLiveStoredZip(bytes: Buffer, expectedCount: number) {
  assert(
    bytes.length > 22 && bytes.length <= MAX_RETAINED_BYTES,
    'ZIP is outside retained-file bounds'
  );
  assert(
    expectedCount >= 2 && expectedCount <= MAX_MEDIA,
    'Expected ZIP item count is out of bounds'
  );
  const entries: Array<{ filename: string; bytes: Buffer }> = [];
  let offset = 0;
  while (offset + 4 <= bytes.length && bytes.readUInt32LE(offset) === 0x04034b50) {
    assert(entries.length < expectedCount, 'ZIP has more media entries than admitted');
    assert(offset + 30 <= bytes.length, 'ZIP local header is truncated');
    const length = bytes.readUInt32LE(offset + 18);
    const nameLength = bytes.readUInt16LE(offset + 26);
    const end = offset + 30 + nameLength + length;
    assert(
      length > 0 && length <= MAX_FILE_BYTES && end <= bytes.length,
      'ZIP entry exceeds media bounds'
    );
    const filename = bytes.toString('utf8', offset + 30, offset + 30 + nameLength);
    assert(
      filename.length > 0 &&
        filename.length <= 180 &&
        !/[\\/]/u.test(filename) &&
        !filename.split('').some((character) => character.charCodeAt(0) < 32) &&
        filename !== '.' &&
        filename !== '..',
      'ZIP entry name is unsafe'
    );
    entries.push({ filename, bytes: bytes.subarray(offset + 30 + nameLength, end) });
    offset = end;
  }
  assert.equal(entries.length, expectedCount, 'ZIP media item count differs');
  return verifyStoredZip(bytes, entries);
}

async function openCurrentStatusImage(page: Page, targetUrl: string): Promise<void> {
  const identity = identityFromUrl(targetUrl);
  const deadline = Date.now() + 20_000;
  let ready = await page.evaluate(inspectLiveTargetDocument, identity);
  while ((!ready || ready.state !== 'ready') && Date.now() < deadline) {
    if (ready && ready.state === 'terminal') {
      break;
    }
    await new Promise((done) => setTimeout(done, 100));
    ready = await page.evaluate(inspectLiveTargetDocument, identity);
  }
  assert(
    ready && ready.state === 'ready' && ready.target.kind === 'image',
    'New document did not expose the requested status image'
  );
  const imageRef = await page.evaluateHandle(resolveLiveImageDocument, {
    identity,
    target: ready.target,
  });
  const image = imageRef.asElement() as ElementHandle<HTMLImageElement> | null;
  if (!image) {
    await imageRef.dispose();
    throw new Error('New document image source or owner is ambiguous');
  }
  try {
    await image.scrollIntoViewIfNeeded({ timeout: 10_000 });
    const action = await inspectHitTestedAction(image, identity, ready.target);
    assert(action, 'New document image has no owned top action');
    const actionRef = await image.evaluateHandle(resolveLiveImageActionDocument, {
      actionIndex: action.actionIndex,
      compactQuote: ready.target.quoteBoundary === 'compact-two-level',
    });
    const actionHandle = actionRef.asElement() as ElementHandle<HTMLAnchorElement> | null;
    if (!actionHandle) {
      await actionRef.dispose();
      throw new Error('New document action detached');
    }
    try {
      await actionHandle.click({ timeout: 10_000 });
    } finally {
      await actionHandle.dispose();
    }
  } finally {
    await image.dispose();
  }
  await page.locator('[data-xeg-gallery-container]').waitFor({ state: 'visible', timeout: 10_000 });
}

function storedTheme(value: unknown): string {
  if (!value || typeof value !== 'object' || !('gallery' in value)) {
    return 'auto';
  }
  const gallery = value.gallery;
  if (!gallery || typeof gallery !== 'object' || !('theme' in gallery)) {
    return 'auto';
  }
  return gallery.theme === 'light' || gallery.theme === 'dark' || gallery.theme === 'auto'
    ? gallery.theme
    : 'auto';
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/https?:\/\/[^\s]+/gu, '[public URL]').slice(0, 500);
}

export async function runActualSiteAcceptance({
  context,
  page,
  action,
  image,
  imageOwner,
  target,
  actionPath,
  extensionId,
  targetUrl,
  navigationUrl,
  downloads,
  output,
  index,
  readSettings,
  restoreSettings,
}: {
  context: BrowserContext;
  page: Page;
  action: ElementHandle<HTMLAnchorElement>;
  image: ElementHandle<HTMLImageElement>;
  imageOwner: ElementHandle<HTMLElement>;
  target: ImageTarget;
  actionPath: string;
  extensionId: string;
  targetUrl: string;
  navigationUrl: string | null;
  downloads: string;
  output: string;
  index: string | number;
  readSettings: (page: Page) => Promise<StoredSettings>;
  restoreSettings: (page: Page, previous: StoredSettings) => Promise<boolean>;
}) {
  const receipt: {
    status: string;
    steps: Record<string, unknown>;
    cleanup: Record<string, unknown>;
    error?: string;
  } = { status: 'pending', steps: {}, cleanup: {} };
  let extensionPage: Page | null = null;
  let prior: StoredSettings | null = null;
  try {
    assert(
      navigationUrl && navigationUrl !== targetUrl,
      'Actual-site acceptance needs a second public status for navigation'
    );
    extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    prior = await readSettings(extensionPage);
    const ownerBound = await image.evaluate(isBoundLiveImageOwnerDocument, imageOwner);
    const refreshedAction = await inspectHitTestedAction(image, identityFromUrl(targetUrl), target);
    assert(
      ownerBound && refreshedAction?.actionPath === actionPath,
      'Requested live image or top action changed before acceptance'
    );
    const actionRef = await image.evaluateHandle(resolveLiveImageActionDocument, {
      actionIndex: refreshedAction.actionIndex,
      compactQuote: false,
    });
    try {
      assert(
        await action.evaluate((element, expected) => element === expected, actionRef),
        'Selected action moved before acceptance'
      );
    } finally {
      await actionRef.dispose();
    }
    await action.click({ timeout: 10_000 });
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: 10_000 });
    const first = await waitSelection(page, 1);
    assert(first.total >= 2 && first.total <= MAX_MEDIA, 'Actual-site gallery needs 2-4 images');
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Next"]').click();
    const second = await waitSelection(page, 2);
    assert.notEqual(second.path, first.path, 'Next did not change selected media identity');
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Previous"]').click();
    const returned = await waitSelection(page, 1);
    assert.equal(returned.path, first.path, 'Previous did not restore selected media identity');
    receipt.steps.navigation = { first, second, returned };

    const sources = await gallerySources(page);
    const declaredBytes = await preflightSources(page, sources, 0);
    receipt.steps.preflight = {
      mediaPaths: sources.map((value) => new URL(value).pathname),
      declaredBytes,
      limits: { perFile: MAX_FILE_BYTES, retainedTotal: MAX_RETAINED_BYTES },
    };
    const toolbar = gallery.locator('[data-gallery-element="toolbar"]');
    const knownSingle = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    const singleProgress: Array<{
      id: number;
      state: string;
      bytesReceived: number;
      totalBytes: number;
    }> = [];
    receipt.steps.singleProgress = singleProgress;
    await toolbar.locator('button[aria-label="Download"]').click();
    const single = await waitForOwnedDownload(
      extensionPage,
      knownSingle,
      MAX_FILE_BYTES,
      singleProgress
    );
    const expectedSingle = new URL(sources[0]!);
    const singleUrl = new URL(single.url);
    assert(
      singleUrl.protocol === 'https:' &&
        singleUrl.hostname === expectedSingle.hostname &&
        singleUrl.pathname === expectedSingle.pathname &&
        singleUrl.searchParams.get('name') === 'orig',
      'Native single download did not use the selected public original'
    );
    if (single.finalUrl) {
      const final = new URL(single.finalUrl);
      assert(
        final.protocol === 'https:' &&
          final.hostname === expectedSingle.hostname &&
          final.pathname === expectedSingle.pathname,
        'Native single download redirected outside the selected original'
      );
    }
    const singleBytes = await readOwnedFile(single, downloads, MAX_FILE_BYTES);
    assert.equal(
      singleBytes.length,
      declaredBytes[0],
      'Native single bytes differ from HEAD declaration'
    );
    assert.equal(
      single.bytesReceived,
      singleBytes.length,
      'Native single completion byte count differs'
    );
    receipt.steps.single = {
      nativeId: single.id,
      state: single.state,
      filename: basename(single.filename),
      bytes: singleBytes.length,
      sha256: createHash('sha256').update(singleBytes).digest('hex'),
    };
    const knownZip = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    const zipProgress: Array<{
      id: number;
      state: string;
      bytesReceived: number;
      totalBytes: number;
    }> = [];
    receipt.steps.zipProgress = zipProgress;
    await toolbar
      .locator(`button[aria-label="Download ${sources.length} shown files as ZIP"]`)
      .click();
    const zip = await waitForOwnedDownload(
      extensionPage,
      knownZip,
      MAX_RETAINED_BYTES - singleBytes.length,
      zipProgress
    );
    const zipBytes = await readOwnedFile(zip, downloads, MAX_RETAINED_BYTES - singleBytes.length);
    const contents = inspectLiveStoredZip(zipBytes, sources.length);
    assert.equal(zip.bytesReceived, zipBytes.length, 'Native ZIP completion byte count differs');
    assert(
      contents.entries.every((entry, itemIndex) => entry.bytes === declaredBytes[itemIndex]),
      'ZIP media sizes differ from bounded public source declarations'
    );
    assert(
      contents.entries.some(
        (entry) => entry.sha256 === createHash('sha256').update(singleBytes).digest('hex')
      ),
      'ZIP does not contain the selected single image bytes'
    );
    receipt.steps.zip = {
      nativeId: zip.id,
      state: zip.state,
      filename: basename(zip.filename),
      bytes: zipBytes.length,
      sha256: createHash('sha256').update(zipBytes).digest('hex'),
      entries: contents.entries.map(({ filename, bytes, sha256 }) => ({ filename, bytes, sha256 })),
    };

    await toolbar.locator('#settings-button').click();
    const theme = gallery.locator('#settings-theme-select');
    await theme.waitFor({ state: 'visible', timeout: 5_000 });
    const initialTheme = await theme.inputValue();
    assert.equal(
      initialTheme,
      storedTheme(prior.settings),
      'Theme UI and extension storage differ'
    );
    const changedTheme = initialTheme === 'dark' ? 'light' : 'dark';
    await theme.selectOption(changedTheme);
    const storageDeadline = Date.now() + 5_000;
    let savedTheme = storedTheme((await readSettings(extensionPage)).settings);
    while (savedTheme !== changedTheme && Date.now() < storageDeadline) {
      await new Promise((done) => setTimeout(done, 100));
      savedTheme = storedTheme((await readSettings(extensionPage)).settings);
    }
    assert.equal(savedTheme, changedTheme, 'Theme change was not saved to extension storage');
    const settingsStep = {
      initialTheme,
      changedTheme,
      storageReadback: true,
      newDocumentReadback: false,
      restoredNewDocument: false,
    };
    receipt.steps.settings = settingsStep;
    await page.screenshot({ path: join(output, `live-page-${index}-acceptance-settings.png`) });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page
      .locator('html[data-xeg-gallery-ready="true"]')
      .waitFor({ state: 'attached', timeout: 20_000 });
    await openCurrentStatusImage(page, targetUrl);
    const reopened = page.locator('[data-xeg-gallery-container]');
    await reopened.locator('[data-gallery-element="toolbar"] #settings-button').click();
    const newTheme = reopened.locator('#settings-theme-select');
    await newTheme.waitFor({ state: 'visible' });
    assert.equal(
      await newTheme.inputValue(),
      changedTheme,
      'Theme did not persist in a new document'
    );
    settingsStep.newDocumentReadback = true;
    assert.equal(
      await restoreSettings(extensionPage, prior),
      true,
      'Exact prior extension settings were not restored'
    );
    receipt.cleanup.settingsRestored = true;
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page
      .locator('html[data-xeg-gallery-ready="true"]')
      .waitFor({ state: 'attached', timeout: 20_000 });
    await openCurrentStatusImage(page, targetUrl);
    const restored = page.locator('[data-xeg-gallery-container]');
    await restored.locator('[data-gallery-element="toolbar"] #settings-button').click();
    const restoredTheme = restored.locator('#settings-theme-select');
    await restoredTheme.waitFor({ state: 'visible' });
    assert.equal(
      await restoredTheme.inputValue(),
      initialTheme,
      'Restored theme did not reach the UI'
    );
    settingsStep.restoredNewDocument = true;
    await restored.locator('[data-gallery-element="toolbar"] #settings-button').click();
    await restored.locator('#settings-theme-select').waitFor({ state: 'hidden', timeout: 5_000 });
    await page.keyboard.press('Escape');
    await restored.waitFor({ state: 'detached', timeout: 10_000 });
    const navigationResponse = await page.goto(navigationUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    assert.equal(navigationResponse?.status(), 200, 'Destination X status did not return HTTP 200');
    await page
      .locator('html[data-xeg-gallery-ready="true"]')
      .waitFor({ state: 'attached', timeout: 20_000 });
    assert.equal(
      await page.locator('[data-xeg-gallery-container]').count(),
      0,
      'Gallery remained after X status navigation'
    );
    assert.equal(
      new URL(page.url()).pathname,
      new URL(navigationUrl).pathname,
      'X status navigation reached another path'
    );
    receipt.steps.statusNavigation = {
      from: new URL(targetUrl).pathname,
      to: new URL(navigationUrl).pathname,
      galleryDetached: true,
      extensionReady: true,
    };
    receipt.status = 'observed';
  } catch (error) {
    receipt.status = 'failed';
    receipt.error = safeError(error);
    const screenshot = `live-page-${index}-acceptance-error.png`;
    if (
      await page.screenshot({ path: join(output, screenshot) }).then(
        () => true,
        () => false
      )
    ) {
      receipt.steps.failureScreenshot = screenshot;
    }
  } finally {
    if (extensionPage && prior && receipt.cleanup.settingsRestored !== true) {
      try {
        receipt.cleanup.settingsRestored = await restoreSettings(extensionPage, prior);
      } catch (error) {
        receipt.cleanup.settingsRestoreError = safeError(error);
      }
    }
    if (extensionPage) {
      try {
        await extensionPage.close();
        receipt.cleanup.extensionPageClosed = true;
      } catch (error) {
        receipt.cleanup.extensionPageCloseError = safeError(error);
      }
    }
    if (receipt.cleanup.settingsRestored !== true || receipt.cleanup.extensionPageClosed !== true) {
      receipt.status = 'failed';
      receipt.error ??= 'Actual-site acceptance cleanup was incomplete';
    }
    await writeFile(
      join(output, `live-page-${index}-acceptance.json`),
      JSON.stringify(receipt, null, 2)
    );
  }
  return receipt;
}
