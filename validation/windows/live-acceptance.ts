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
  inspectLiveMixedGallerySelectionDocument,
  inspectLiveTargetDocument,
  inspectSelectedGalleryVideoDocument,
  isBoundLiveImageOwnerDocument,
  findPrecedingLiveStatusAnchorDocument,
  resolveLiveImageActionDocument,
  resolveLiveImageDocument,
} from './live-page-document.ts';
import type { Identity, ImageTarget, Source } from './live-page-document.ts';

declare const chrome: {
  runtime: { id: string };
  downloads: {
    search(query: { orderBy: string[] } | { id: number }): Promise<BrowserDownloadItem[]>;
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
  byExtensionId?: string;
  state: string;
  filename: string;
  bytesReceived: number;
  totalBytes: number;
  exists: boolean;
  error?: string;
};
type BrowserDownloadItem = DownloadItem & {
  url?: string;
  finalUrl?: string;
  referrer?: string;
};
type Selection = {
  position: number;
  total: number;
  currentIndex: number;
  focusedIndex: number;
  path: string;
};
type DisplayedImage = Selection & {
  scrollTop: number;
  itemCenter: number;
  visibleCenter: number;
  scrollportTop: number;
  scrollportBottom: number;
  imageVisible: boolean;
  imageHitTested: boolean;
  documentTimeOrigin: number;
};
type SelectedGalleryVideo = Exclude<
  ReturnType<typeof inspectSelectedGalleryVideoDocument>,
  false | null
>;
type PhotoProviderObservation = {
  operation: string;
  requestedTweetId: string | null;
  httpStatus: number;
  providerErrors: boolean;
  result: {
    id: string | null;
    media: readonly { id: string | null; type: string; poster: Source | null }[];
  } | null;
};

export async function observeActualSiteVideoNavigation(
  page: Page,
  entryKind: 'video' | 'owned-photo' = 'video',
  onSelectedVideo?: (video: SelectedGalleryVideo) => Promise<void>
) {
  const receipt: {
    status: 'observed' | 'unverified' | 'failed';
    entryKind: 'video' | 'owned-photo';
    original?: NonNullable<ReturnType<typeof inspectLiveMixedGallerySelectionDocument>>;
    neighbor?: NonNullable<ReturnType<typeof inspectLiveMixedGallerySelectionDocument>>;
    returned?: NonNullable<ReturnType<typeof inspectLiveMixedGallerySelectionDocument>>;
    selectedVideo?: NonNullable<ReturnType<typeof inspectSelectedGalleryVideoDocument>>;
    playback?: { startTime: number; endTime: number; progressed: boolean; control: 'native-space' };
    nativeToolbarButtonOwnership?: Awaited<ReturnType<typeof observeNativeToolbarButtonOwnership>>;
    error?: string;
  } = { status: 'unverified', entryKind };
  const selectedVideo =
    entryKind === 'video' ? await page.evaluate(inspectSelectedGalleryVideoDocument) : null;
  if (entryKind === 'video' && (!selectedVideo || selectedVideo.total < 2)) {
    receipt.error = 'Selected live video has fewer than two gallery items';
    return receipt;
  }
  try {
    const original = await page.evaluate(inspectLiveMixedGallerySelectionDocument);
    assert(
      original?.kind === (entryKind === 'video' ? 'video' : 'image') &&
        original.otherPlayingVideos === 0,
      'Original media selection or other-player state is unavailable'
    );
    receipt.original = original;
    const forward = original.index < original.total - 1;
    const neighborIndex = original.index + (forward ? 1 : -1);
    const toolbar = page.locator('[data-xeg-gallery-container] [data-gallery-element="toolbar"]');
    await toolbar.locator(`button[aria-label="${forward ? 'Next' : 'Previous'}"]`).click();
    await page.waitForFunction(
      (index) =>
        document
          .querySelector('[data-xeg-gallery-container] [data-gallery-element="toolbar"]')
          ?.getAttribute('data-current-index') === String(index),
      neighborIndex,
      { timeout: 10_000 }
    );
    let neighbor = await page.evaluate(inspectLiveMixedGallerySelectionDocument);
    const deadline = Date.now() + 10_000;
    while ((!neighbor || neighbor.index !== neighborIndex) && Date.now() < deadline) {
      await new Promise((done) => setTimeout(done, 100));
      neighbor = await page.evaluate(inspectLiveMixedGallerySelectionDocument);
    }
    assert(
      neighbor && neighbor.index === neighborIndex && neighbor.otherPlayingVideos === 0,
      'Neighbor media selection or paused prior player was not observed'
    );
    assert.notEqual(
      neighbor.source.path,
      original.source.path,
      'Video navigation retained the same media source'
    );
    receipt.neighbor = neighbor;
    if (entryKind === 'owned-photo') {
      assert.equal(neighbor.kind, 'video', 'Photo neighbor was not a video');
      let video = await page.evaluate(inspectSelectedGalleryVideoDocument);
      const videoDeadline = Date.now() + 10_000;
      while (
        (!video ||
          !video.itemLoaded ||
          !video.visible ||
          video.readyState < 2 ||
          video.width <= 0 ||
          video.height <= 0) &&
        Date.now() < videoDeadline
      ) {
        await new Promise((done) => setTimeout(done, 100));
        video = await page.evaluate(inspectSelectedGalleryVideoDocument);
      }
      assert(
        video &&
          video.itemLoaded &&
          video.visible &&
          video.readyState >= 2 &&
          video.width > 0 &&
          video.height > 0 &&
          video.mediaErrorCode === null &&
          video.source?.host === neighbor.source.host &&
          video.source.path === neighbor.source.path,
        'Neighbor video was not source-bound and playable'
      );
      const videoControl = page
        .locator('[data-xeg-gallery-container] [data-gallery-element="item"]')
        .nth(neighbor.index)
        .locator('video[controls]');
      await videoControl.focus();
      if (
        !(await videoControl.evaluate(
          (element) => element instanceof HTMLVideoElement && element.paused
        ))
      ) {
        await page.keyboard.press('Space');
        await page.waitForFunction(
          (index) =>
            document
              .querySelectorAll('[data-xeg-gallery-container] [data-gallery-element="item"]')
              [index]?.querySelector('video')?.paused === true,
          neighbor.index,
          { timeout: 5_000 }
        );
      }
      const startTime = await videoControl.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.currentTime : -1
      );
      assert(startTime >= 0, 'Selected gallery video control detached');
      await page.keyboard.press('Space');
      await page.waitForFunction(
        ({ index, startTime }) => {
          const element = document
            .querySelectorAll('[data-xeg-gallery-container] [data-gallery-element="item"]')
            [index]?.querySelector('video');
          return (
            element && !element.paused && !element.error && element.currentTime >= startTime + 0.15
          );
        },
        { index: neighbor.index, startTime },
        { timeout: 5_000, polling: 100 }
      );
      const endTime = await videoControl.evaluate((element) =>
        element instanceof HTMLVideoElement ? element.currentTime : -1
      );
      const playedVideo = await page.evaluate(inspectSelectedGalleryVideoDocument);
      assert(
        playedVideo &&
          playedVideo.source?.host === neighbor.source.host &&
          playedVideo.source.path === neighbor.source.path &&
          playedVideo.currentTime >= startTime + 0.15,
        'Played video changed source or lost the selected player'
      );
      receipt.selectedVideo = playedVideo;
      receipt.playback = {
        startTime,
        endTime,
        progressed: endTime >= startTime + 0.15,
        control: 'native-space',
      };
      assert(receipt.playback.progressed, 'Native selected video did not progress');
      await onSelectedVideo?.(playedVideo);
      await videoControl.focus();
      await page.keyboard.press('Space');
      await page.waitForFunction(
        (index) =>
          document
            .querySelectorAll('[data-xeg-gallery-container] [data-gallery-element="item"]')
            [index]?.querySelector('video')?.paused === true,
        neighbor.index,
        { timeout: 5_000 }
      );
      receipt.nativeToolbarButtonOwnership = await observeNativeToolbarButtonOwnership(
        page,
        playedVideo
      );
      assert.equal(
        receipt.nativeToolbarButtonOwnership.status,
        'observed',
        receipt.nativeToolbarButtonOwnership.error ?? 'Native toolbar-button observation failed'
      );
    }
    await toolbar.locator(`button[aria-label="${forward ? 'Previous' : 'Next'}"]`).click();
    await page.waitForFunction(
      (index) =>
        document
          .querySelector('[data-xeg-gallery-container] [data-gallery-element="toolbar"]')
          ?.getAttribute('data-current-index') === String(index),
      original.index,
      { timeout: 10_000 }
    );
    let returned = await page.evaluate(inspectLiveMixedGallerySelectionDocument);
    if (returned) {
      receipt.returned = returned;
    }
    const returnDeadline = Date.now() + 10_000;
    const restoredOriginal = () =>
      returned?.index === original.index &&
      returned.kind === (entryKind === 'video' ? 'video' : 'image') &&
      returned.otherPlayingVideos === 0 &&
      returned.source.host === original.source.host &&
      returned.source.path === original.source.path;
    while (!restoredOriginal() && Date.now() < returnDeadline) {
      await new Promise((done) => setTimeout(done, 100));
      returned = await page.evaluate(inspectLiveMixedGallerySelectionDocument);
      if (returned) {
        receipt.returned = returned;
      }
    }
    assert(restoredOriginal(), 'Video navigation did not restore the owned current player');
    receipt.status = 'observed';
  } catch (error) {
    receipt.status = 'failed';
    receipt.error = safeError(error);
  }
  return receipt;
}

export async function observeSameDocumentPostNavigationAfterClose({
  page,
  image,
  targetUrl,
}: {
  page: Page;
  image: ElementHandle<HTMLImageElement>;
  targetUrl: string;
}) {
  const identity = identityFromUrl(targetUrl);
  const receipt: {
    status: 'observed' | 'unverified' | 'failed';
    reason?: string;
    anchorPath?: string;
    before?: {
      timeOrigin: number;
      bodyStyle: string;
      scrollRestoration: string;
      galleryCount: number;
    };
    after?: {
      timeOrigin: number;
      bodyStyle: string;
      scrollRestoration: string;
      galleryCount: number;
    };
    sameDocument?: boolean;
    galleryAlreadyClosed?: boolean;
  } = { status: 'unverified' };
  const anchorRef = await image.evaluateHandle(findPrecedingLiveStatusAnchorDocument, {
    identity,
    host: new URL(page.url()).hostname,
  });
  const anchor = anchorRef.asElement() as ElementHandle<HTMLAnchorElement> | null;
  if (!anchor) {
    await anchorRef.dispose();
    receipt.reason = 'No existing preceding same-author status anchor was available';
    return receipt;
  }
  try {
    await anchor.scrollIntoViewIfNeeded({ timeout: 10_000 });
    const path = await anchor.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const x = Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2));
      const y = Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2));
      const hit = document
        .elementsFromPoint(x, y)
        .find((candidate) => candidate.closest('a[href]'));
      return hit?.closest('a[href]') === element ? new URL(element.href).pathname : null;
    });
    if (!path) {
      receipt.reason = 'Existing status anchor was not the top hit target';
      return receipt;
    }
    receipt.anchorPath = path;
    const snapshot = () =>
      page.evaluate(() => ({
        timeOrigin: performance.timeOrigin,
        bodyStyle: document.body.style.cssText,
        scrollRestoration: history.scrollRestoration,
        galleryCount: document.querySelectorAll('[data-xeg-gallery-container]').length,
      }));
    receipt.before = await snapshot();
    assert.equal(
      receipt.before.galleryCount,
      0,
      'Gallery must already be closed before host navigation'
    );
    receipt.galleryAlreadyClosed = true;
    await anchor.click({ timeout: 10_000 });
    await page.waitForURL((url) => url.pathname === path, { timeout: 15_000 });
    await page
      .locator('html[data-xeg-gallery-ready="true"]')
      .waitFor({ state: 'attached', timeout: 20_000 });
    receipt.after = await snapshot();
    receipt.sameDocument = receipt.after.timeOrigin === receipt.before.timeOrigin;
    if (!receipt.sameDocument) {
      receipt.reason = 'Existing status anchor performed a full-document navigation';
      return receipt;
    }
    assert.equal(
      receipt.after.galleryCount,
      0,
      'Gallery reappeared after same-document X navigation'
    );
    assert.equal(
      receipt.after.bodyStyle,
      receipt.before.bodyStyle,
      'Gallery body style survived same-document X navigation'
    );
    assert.equal(
      receipt.after.scrollRestoration,
      receipt.before.scrollRestoration,
      'Gallery scroll policy survived same-document X navigation'
    );
    receipt.status = 'observed';
  } catch (error) {
    receipt.status = 'failed';
    receipt.reason = safeError(error);
  } finally {
    await anchor.dispose();
  }
  return receipt;
}

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

export function displayedGalleryImageDocument(gallery: Element): DisplayedImage | null {
  if (
    !gallery.isConnected ||
    document.querySelectorAll('[data-xeg-gallery-container]').length !== 1 ||
    document.querySelector('[data-xeg-gallery-container]') !== gallery
  ) {
    return null;
  }
  const toolbar = gallery.querySelector('[data-gallery-element="toolbar"]');
  const counter = toolbar?.querySelector('#xeg-toolbar-counter[data-gallery-element="position"]');
  const scrollport = gallery.querySelector('[data-gallery-element="items"]');
  const integer = (element: Element | null | undefined, attribute: string): number | null => {
    const raw = element?.getAttribute(attribute);
    return raw !== null && raw !== undefined && /^(?:0|[1-9]\d*)$/u.test(raw) ? Number(raw) : null;
  };
  const position = integer(counter, 'data-position');
  const total = integer(counter, 'data-total');
  const currentIndex = integer(toolbar, 'data-current-index');
  const focusedIndex = integer(toolbar, 'data-focused-index');
  if (
    position === null ||
    total === null ||
    currentIndex === null ||
    focusedIndex === null ||
    !Number.isSafeInteger(position) ||
    !Number.isSafeInteger(total) ||
    !Number.isSafeInteger(currentIndex) ||
    !Number.isSafeInteger(focusedIndex) ||
    total < 2 ||
    position < 1 ||
    position > total ||
    currentIndex >= total ||
    focusedIndex >= total ||
    position !== focusedIndex + 1 ||
    counter?.getAttribute('data-current-index') !== String(currentIndex) ||
    counter.getAttribute('data-focused-index') !== String(focusedIndex) ||
    !(scrollport instanceof HTMLElement)
  ) {
    return null;
  }
  const items = gallery.querySelectorAll('[data-gallery-element="item"]');
  const item = items[focusedIndex];
  if (
    items.length !== total ||
    item?.getAttribute('data-index') !== String(focusedIndex) ||
    item.getAttribute('data-media-loaded') !== 'true' ||
    item.querySelectorAll('img').length !== 1
  ) {
    return null;
  }
  const image = item.querySelector('img');
  if (!(image instanceof HTMLImageElement) || !image.complete || image.naturalWidth <= 0) {
    return null;
  }
  const scrollportRect = scrollport.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const imageRect = image.getBoundingClientRect();
  const padding = Number.parseFloat(getComputedStyle(scrollport).scrollPaddingBlockStart);
  const visibleTop = scrollportRect.top + padding;
  const itemCenter = itemRect.top + itemRect.height / 2;
  const visibleCenter = (visibleTop + scrollportRect.bottom) / 2;
  const imageVisible =
    imageRect.width > 0 &&
    imageRect.height > 0 &&
    imageRect.bottom > visibleTop &&
    imageRect.top < scrollportRect.bottom;
  const visibleLeft = Math.max(imageRect.left, scrollportRect.left);
  const visibleRight = Math.min(imageRect.right, scrollportRect.right);
  const visibleImageTop = Math.max(imageRect.top, visibleTop);
  const visibleImageBottom = Math.min(imageRect.bottom, scrollportRect.bottom);
  const point = document.elementFromPoint(
    (visibleLeft + visibleRight) / 2,
    (visibleImageTop + visibleImageBottom) / 2
  );
  const imageHitTested =
    visibleLeft < visibleRight &&
    visibleImageTop < visibleImageBottom &&
    (point === image || point === image.parentElement);
  if (
    !Number.isFinite(padding) ||
    padding < 0 ||
    !Number.isFinite(scrollport.scrollTop) ||
    visibleTop >= scrollportRect.bottom ||
    !imageVisible ||
    !imageHitTested
  ) {
    return null;
  }
  try {
    const url = new URL(image.currentSrc || image.src);
    const declared = new URL(item.getAttribute('data-media-display-url') ?? '');
    return url.protocol === 'https:' &&
      url.hostname === 'pbs.twimg.com' &&
      url.pathname.startsWith('/media/') &&
      declared.protocol === url.protocol &&
      declared.hostname === url.hostname &&
      declared.pathname === url.pathname
      ? {
          position,
          total,
          currentIndex,
          focusedIndex,
          path: url.pathname,
          scrollTop: scrollport.scrollTop,
          itemCenter,
          visibleCenter,
          scrollportTop: scrollportRect.top,
          scrollportBottom: scrollportRect.bottom,
          imageVisible,
          imageHitTested,
          documentTimeOrigin: performance.timeOrigin,
        }
      : null;
  } catch {
    return null;
  }
}

export function matchesDisplayedImage(
  image: DisplayedImage | null,
  requested: number,
  displayed: number,
  path: string
): image is DisplayedImage {
  return (
    image !== null &&
    image.currentIndex === requested &&
    image.focusedIndex === displayed &&
    image.position === displayed + 1 &&
    image.path === path &&
    image.imageVisible &&
    image.imageHitTested &&
    Number.isFinite(image.documentTimeOrigin) &&
    Number.isFinite(image.scrollTop) &&
    Number.isFinite(image.itemCenter) &&
    Number.isFinite(image.visibleCenter)
  );
}

export async function observeManualScrollCommandTargeting(page: Page, displayPaths: string[]) {
  const gallery = page.locator('[data-xeg-gallery-container]');
  const handle = await gallery.elementHandle();
  assert(handle, 'Gallery detached before manual-scroll observation');
  const read = () => handle.evaluate(displayedGalleryImageDocument);
  const toolbar = gallery.locator('[data-gallery-element="toolbar"]');
  const scrollport = gallery.locator('[data-gallery-element="items"]');
  const phases: Array<{
    phase: string;
    image: DisplayedImage;
    wheelDelta?: number;
    stableSamples?: DisplayedImage[];
  }> = [];
  const wheelObserver = await handle
    .evaluateHandle((root) => {
      const scroll = root.querySelector('[data-gallery-element="items"]');
      if (!(scroll instanceof HTMLElement)) {
        throw new Error('Gallery scrollport is unavailable');
      }
      const events: Array<{ trusted: boolean; ownedTarget: boolean; deltaY: number }> = [];
      const clicks: Array<{ trusted: boolean; command: string }> = [];
      let overflow = false;
      const onWheel = (event: Event) => {
        if (!(event instanceof WheelEvent)) {
          return;
        }
        if (events.length >= 4) {
          overflow = true;
          return;
        }
        events.push({
          trusted: event.isTrusted,
          ownedTarget: event.target instanceof Node && scroll.contains(event.target),
          deltaY: event.deltaY,
        });
      };
      const onClick = (event: Event) => {
        const button =
          event.target instanceof Element
            ? event.target.closest('button[aria-label="Previous"],button[aria-label="Next"]')
            : null;
        if (!button || !root.contains(button)) {
          return;
        }
        if (clicks.length >= 6) {
          overflow = true;
          return;
        }
        clicks.push({ trusted: event.isTrusted, command: button.getAttribute('aria-label') ?? '' });
      };
      root.addEventListener('wheel', onWheel, true);
      root.addEventListener('click', onClick, true);
      return {
        events,
        clicks,
        get overflow() {
          return overflow;
        },
        dispose: () => {
          root.removeEventListener('wheel', onWheel, true);
          root.removeEventListener('click', onClick, true);
        },
      };
    })
    .catch(async (error: unknown) => {
      await handle.dispose();
      throw error;
    });
  let documentTimeOrigin: number | null = null;
  const expectImage = async (phase: string, requested: number, displayed: number) => {
    const path = new URL(displayPaths[displayed]!).pathname;
    const deadline = Date.now() + 5_000;
    let image = await read();
    while (!matchesDisplayedImage(image, requested, displayed, path) && Date.now() < deadline) {
      await new Promise((done) => setTimeout(done, 100));
      image = await read();
    }
    assert(
      matchesDisplayedImage(image, requested, displayed, path),
      `${phase} image was not owned and visible`
    );
    documentTimeOrigin ??= image.documentTimeOrigin;
    assert.equal(image.documentTimeOrigin, documentTimeOrigin, `${phase} changed document`);
    phases.push({ phase, image });
    return image;
  };
  const wheelTo = async (phase: string, requested: number, displayed: number) => {
    await scrollport.hover();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const before = await read();
      assert(before, `${phase} gallery geometry is unavailable`);
      const target = await gallery
        .locator(`[data-gallery-element="item"][data-index="${displayed}"]`)
        .evaluate((item) => {
          const scroll = item.closest('[data-gallery-element="items"]');
          if (!(scroll instanceof HTMLElement)) {
            throw new Error('Missing gallery scrollport');
          }
          const viewport = scroll.getBoundingClientRect();
          const rect = item.getBoundingClientRect();
          const padding = Number.parseFloat(getComputedStyle(scroll).scrollPaddingBlockStart);
          return {
            itemCenter: rect.top + rect.height / 2,
            visibleCenter: (viewport.top + padding + viewport.bottom) / 2,
          };
        });
      const delta = Math.round(target.itemCenter - target.visibleCenter);
      assert(Number.isFinite(delta) && delta !== 0, `${phase} wheel delta is invalid`);
      const beforeWheelCount = await wheelObserver.evaluate((value) => value.events.length);
      await page.mouse.wheel(0, delta);
      const wheelEvent = await wheelObserver.evaluate(
        (value, index) => ({
          event: value.events[index],
          count: value.events.length,
          overflow: value.overflow,
        }),
        beforeWheelCount
      );
      assert(
        !wheelEvent.overflow &&
          wheelEvent.count === beforeWheelCount + 1 &&
          wheelEvent.event?.trusted &&
          wheelEvent.event.ownedTarget &&
          wheelEvent.event.deltaY === delta,
        `${phase} wheel was not a single trusted gallery event`
      );
      const path = new URL(displayPaths[displayed]!).pathname;
      const deadline = Date.now() + 3_000;
      let result = await read();
      while (!matchesDisplayedImage(result, requested, displayed, path) && Date.now() < deadline) {
        await new Promise((done) => setTimeout(done, 100));
        result = await read();
      }
      if (matchesDisplayedImage(result, requested, displayed, path)) {
        const stableSamples = [result];
        for (let sample = 0; sample < 10; sample += 1) {
          await page.waitForTimeout(100);
          result = await read();
          assert(
            matchesDisplayedImage(result, requested, displayed, path) &&
              result.documentTimeOrigin === documentTimeOrigin,
            `${phase} divergence snapped back or source changed`
          );
          stableSamples.push(result);
        }
        phases.push({ phase, image: result, wheelDelta: delta, stableSamples });
        return;
      }
    }
    throw new Error(`${phase} trusted wheel did not produce the requested/displayed divergence`);
  };
  try {
    assert(
      displayPaths.length >= 2 && displayPaths.length <= MAX_MEDIA,
      'Manual-scroll input count is invalid'
    );
    await expectImage('opening', 0, 0);
    await wheelTo('previous-precondition', 0, 1);
    await toolbar.locator('button[aria-label="Previous"]').click();
    await expectImage('previous-result', 0, 0);
    await toolbar.locator('button[aria-label="Next"]').click();
    await expectImage('next-setup', 1, 1);
    await wheelTo('next-precondition', 1, 0);
    await toolbar.locator('button[aria-label="Next"]').click();
    await expectImage('next-result', 1, 1);
    await toolbar.locator('button[aria-label="Previous"]').click();
    await expectImage('continuation', 0, 0);
    const wheelTrace = await wheelObserver.evaluate((value) => ({
      events: value.events,
      clicks: value.clicks,
      overflow: value.overflow,
    }));
    assert(
      !wheelTrace.overflow && wheelTrace.events.length >= 2,
      'Manual wheel trace is incomplete'
    );
    assert.deepEqual(
      wheelTrace.clicks,
      [
        { trusted: true, command: 'Previous' },
        { trusted: true, command: 'Next' },
        { trusted: true, command: 'Next' },
        { trusted: true, command: 'Previous' },
      ],
      'Manual-scroll command clicks were not trusted and ordered'
    );
    return { schemaVersion: 1 as const, status: 'observed' as const, phases, wheelTrace };
  } catch (error) {
    return {
      schemaVersion: 1 as const,
      status: 'failed' as const,
      phases,
      wheelTrace: await wheelObserver
        .evaluate((value) => ({
          events: value.events,
          clicks: value.clicks,
          overflow: value.overflow,
        }))
        .catch(() => null),
      error: safeError(error),
    };
  } finally {
    try {
      await wheelObserver.evaluate((value) => value.dispose());
    } finally {
      await wheelObserver.dispose();
      await handle.dispose();
    }
  }
}

type NativeButtonEvent = {
  key?: string;
  trusted: boolean;
  targetButton: boolean;
  focusedButton?: boolean;
  disabled?: boolean;
};
type NativeButtonSnapshot = {
  keys: NativeButtonEvent[];
  clicks: NativeButtonEvent[];
  plays: number;
  overflow: boolean;
  allPaused: boolean;
  galleryCurrent: boolean;
  documentTimeOrigin: number;
};

export function installNativeButtonObserverDocument(root: Element) {
  const button = root.querySelector('#settings-button');
  if (!(button instanceof HTMLButtonElement) || button.disabled) {
    throw new Error('Enabled native Settings button is unavailable');
  }
  const keys: NativeButtonEvent[] = [];
  const clicks: NativeButtonEvent[] = [];
  let plays = 0;
  let overflow = false;
  const onKey = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    if (keys.length >= 8) {
      overflow = true;
      return;
    }
    keys.push({
      key: event.key,
      trusted: event.isTrusted,
      targetButton: event.target === button,
      focusedButton: document.activeElement === button,
      disabled: button.disabled,
    });
  };
  const onClick = (event: Event) => {
    if (event.target !== button) {
      return;
    }
    if (clicks.length >= 8) {
      overflow = true;
      return;
    }
    clicks.push({ trusted: event.isTrusted, targetButton: true });
  };
  const onPlay = (event: Event) => {
    if (event.target instanceof HTMLVideoElement && root.contains(event.target)) {
      plays += 1;
      if (plays > 8) {
        overflow = true;
      }
    }
  };
  root.addEventListener('keydown', onKey, true);
  root.addEventListener('click', onClick, true);
  root.addEventListener('play', onPlay, true);
  return {
    snapshot(): NativeButtonSnapshot {
      return {
        keys: [...keys],
        clicks: [...clicks],
        plays,
        overflow,
        allPaused: [...root.querySelectorAll('video')].every((video) => video.paused),
        galleryCurrent:
          root.isConnected &&
          document.querySelectorAll('[data-xeg-gallery-container]').length === 1 &&
          document.querySelector('[data-xeg-gallery-container]') === root,
        documentTimeOrigin: performance.timeOrigin,
      };
    },
    dispose() {
      root.removeEventListener('keydown', onKey, true);
      root.removeEventListener('click', onClick, true);
      root.removeEventListener('play', onPlay, true);
    },
  };
}

export function nativeButtonActivationPassed(
  snapshot: NativeButtonSnapshot,
  expectedKeys: readonly string[],
  expectedClicks: number
): boolean {
  return (
    !snapshot.overflow &&
    snapshot.plays === 0 &&
    snapshot.allPaused &&
    snapshot.galleryCurrent &&
    Number.isFinite(snapshot.documentTimeOrigin) &&
    snapshot.keys.length === expectedKeys.length &&
    snapshot.keys.every(
      (event, index) =>
        event.key === expectedKeys[index] &&
        event.trusted &&
        event.targetButton &&
        event.focusedButton &&
        event.disabled === false
    ) &&
    snapshot.clicks.length === expectedClicks &&
    snapshot.clicks.every((event) => event.trusted && event.targetButton)
  );
}

async function observeNativeToolbarButtonOwnership(page: Page, expected: SelectedGalleryVideo) {
  const gallery = page.locator('[data-xeg-gallery-container]');
  const root = await gallery.elementHandle();
  assert(root, 'Gallery detached before native-button observation');
  const button = gallery.locator('[data-gallery-element="toolbar"] #settings-button');
  const theme = gallery.locator('#settings-theme-select');
  const tracker = await root
    .evaluateHandle(installNativeButtonObserverDocument)
    .catch(async (error: unknown) => {
      await root.dispose();
      throw error;
    });
  const snapshot = () => tracker.evaluate((value) => value.snapshot());
  const documentTimeOrigin = await root.evaluate(() => performance.timeOrigin);
  const media = async () => {
    const selected = await page.evaluate(inspectLiveMixedGallerySelectionDocument);
    const current = await page.evaluate(inspectSelectedGalleryVideoDocument);
    const allPaused = await root.evaluate((element) =>
      [...element.querySelectorAll('video')].every((video) => video.paused)
    );
    const sameGallery = await root.evaluate(
      (element, expectedTimeOrigin) =>
        element.isConnected &&
        document.querySelectorAll('[data-xeg-gallery-container]').length === 1 &&
        document.querySelector('[data-xeg-gallery-container]') === element &&
        performance.timeOrigin === expectedTimeOrigin,
      documentTimeOrigin
    );
    assert(
      selected?.kind === 'video' &&
        selected.index === expected.index &&
        selected.source.host === expected.source?.host &&
        selected.source.path === expected.source.path &&
        current &&
        current.index === expected.index &&
        current.source?.host === expected.source.host &&
        current.source.path === expected.source.path &&
        allPaused &&
        sameGallery,
      'Settings key action changed the owned selected video or playback state'
    );
    return { selected, current, allPaused };
  };
  try {
    const before = await media();
    await button.focus();
    assert.equal(await button.evaluate((element) => document.activeElement === element), true);
    await page.keyboard.press('Space');
    await theme.waitFor({ state: 'visible', timeout: 5_000 });
    assert.equal(await button.getAttribute('aria-expanded'), 'true');
    const opened = await snapshot();
    assert(
      nativeButtonActivationPassed(opened, [' '], 1),
      'Native Settings Space ownership failed'
    );
    await media();
    await page.waitForFunction(
      () => document.activeElement === document.querySelector('#settings-theme-select'),
      undefined,
      { timeout: 5_000 }
    );
    await button.focus();
    assert.equal(await button.evaluate((element) => document.activeElement === element), true);
    await page.keyboard.press('Enter');
    await theme.waitFor({ state: 'hidden', timeout: 5_000 });
    assert.equal(await button.getAttribute('aria-expanded'), 'false');
    await page.waitForTimeout(300);
    const closed = await snapshot();
    assert(
      nativeButtonActivationPassed(closed, [' ', 'Enter'], 2),
      'Native Settings Enter ownership failed'
    );
    const after = await media();
    return {
      schemaVersion: 1 as const,
      status: 'observed' as const,
      before,
      opened,
      closed,
      after,
    };
  } catch (error) {
    return {
      schemaVersion: 1 as const,
      status: 'failed' as const,
      events: await snapshot().catch(() => null),
      error: safeError(error),
    };
  } finally {
    try {
      await tracker.evaluate((value) => value.dispose());
    } finally {
      await tracker.dispose();
      await root.dispose();
    }
  }
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
  const displays = sources.map((source) => {
    assert(source, 'Gallery media source is missing');
    const url = new URL(source);
    assert(
      url.protocol === 'https:' &&
        url.hostname === 'pbs.twimg.com' &&
        /^\/media\/[A-Za-z0-9_-]+(?:\.(?:jpe?g|png|webp|gif))?$/iu.test(url.pathname),
      'Gallery contains a non-public-image source'
    );
    return source;
  });
  assert.equal(new Set(displays.map((value) => new URL(value).pathname)).size, displays.length);
  return displays;
}

export function canonicalOwnedPhotoSources(
  displays: readonly string[],
  observations: readonly PhotoProviderObservation[],
  requestedStatusId: string
): { sources: string[]; mediaIds: string[] } {
  assert(displays.length >= 2 && displays.length <= MAX_MEDIA, 'Expected 2-4 gallery photos');
  const displayIds = displays.map((value) => {
    const url = new URL(value);
    const match = /^\/media\/([A-Za-z0-9_-]+)(?:\.(?:jpe?g|png|webp|gif))?$/iu.exec(url.pathname);
    assert(
      url.protocol === 'https:' &&
        url.hostname === 'pbs.twimg.com' &&
        !url.username &&
        !url.password &&
        !url.port &&
        !url.hash &&
        match?.[1],
      'Gallery photo identity is invalid'
    );
    return match[1];
  });
  assert.equal(new Set(displayIds).size, displayIds.length, 'Gallery photo identity duplicated');
  const candidates = observations.filter(
    (entry) =>
      entry.operation === 'TweetResultByRestId' &&
      entry.requestedTweetId === requestedStatusId &&
      entry.httpStatus === 200 &&
      !entry.providerErrors &&
      entry.result?.id === requestedStatusId
  );
  assert(candidates.length > 0, 'Exact requested-status photo provider evidence is missing');
  const mappings = candidates.map((entry) => {
    const media = entry.result?.media ?? [];
    assert.equal(media.length, displays.length, 'Provider photo item count differs from gallery');
    const mediaIds: string[] = [];
    const sources = media.map((item, index) => {
      assert(item.type === 'photo' && item.id, 'Provider media is not an identified photo');
      const match = /^\/media\/([A-Za-z0-9_-]+)\.(jpe?g|png|webp|gif)$/iu.exec(
        item.poster?.path ?? ''
      );
      assert(
        item.poster?.host === 'pbs.twimg.com' &&
          match !== null &&
          match[1] === displayIds[index] &&
          match[2],
        'Provider photo identity or order differs from gallery'
      );
      mediaIds.push(item.id);
      const original = new URL(`https://pbs.twimg.com${item.poster.path}`);
      original.searchParams.set('format', match[2].toLowerCase());
      original.searchParams.set('name', 'orig');
      return original.href;
    });
    assert.equal(new Set(mediaIds).size, mediaIds.length, 'Provider photo media ID duplicated');
    assert.equal(new Set(sources).size, sources.length, 'Provider photo source duplicated');
    return { sources, mediaIds };
  });
  const first = mappings[0];
  assert(first, 'Exact requested-status photo provider evidence is missing');
  assert(
    mappings.every((mapping) => JSON.stringify(mapping) === JSON.stringify(first)),
    'Conflicting requested-status photo provider evidence'
  );
  return first;
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
  const originals: Array<{ bytes: number; sha256: string }> = [];
  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index];
    assert(source, 'Admitted public image source disappeared');
    const response = await page.request.get(source, { timeout: 20_000, maxRedirects: 3 });
    try {
      assert(response.ok(), 'Public original GET preflight failed');
      const declared = response.headers()['content-length'];
      assert.equal(Number(declared), lengths[index], 'Public original GET size differs from HEAD');
      const bytes = await response.body();
      assert(
        bytes.length > 0 && bytes.length <= MAX_FILE_BYTES && bytes.length === lengths[index],
        'Public original GET exceeded its declared media bound'
      );
      originals.push({
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    } finally {
      await response.dispose();
    }
  }
  return originals;
}

export async function taskOwnedDownloadsDocument(
  expectedExtensionId: string
): Promise<DownloadItem[]> {
  if (chrome.runtime.id !== expectedExtensionId) {
    throw new Error('Download query left the owned extension origin');
  }
  const items = await chrome.downloads.search({ orderBy: ['-startTime'] });
  return items
    .filter((item) => item.byExtensionId === expectedExtensionId)
    .map((item) => ({
      id: item.id,
      byExtensionId: expectedExtensionId,
      state: item.state,
      filename: item.filename,
      bytesReceived: item.bytesReceived,
      totalBytes: item.totalBytes,
      exists: item.exists,
      ...(item.error ? { error: item.error } : {}),
    }));
}

async function queryDownloads(
  extensionPage: Page,
  expectedExtensionId: string
): Promise<DownloadItem[]> {
  return extensionPage.evaluate(taskOwnedDownloadsDocument, expectedExtensionId);
}

export async function nativeSingleSourceMatchesDocument({
  id,
  extensionId,
  expectedSource,
}: {
  id: number;
  extensionId: string;
  expectedSource: string;
}): Promise<boolean> {
  if (chrome.runtime.id !== extensionId) {
    return false;
  }
  const items = await chrome.downloads.search({ id });
  const item = items.length === 1 ? items[0] : null;
  if (item?.id !== id || item.byExtensionId !== extensionId || !item.url) {
    return false;
  }
  try {
    const expected = new URL(expectedSource);
    const source = new URL(item.url);
    const final = item.finalUrl ? new URL(item.finalUrl) : null;
    return (
      source.protocol === 'https:' &&
      source.hostname === expected.hostname &&
      source.pathname === expected.pathname &&
      source.searchParams.get('name') === 'orig' &&
      (!final ||
        (final.protocol === 'https:' &&
          final.hostname === expected.hostname &&
          final.pathname === expected.pathname))
    );
  } catch {
    return false;
  }
}

export async function waitForOwnedDownload(
  extensionPage: Page,
  extensionId: string,
  previous: Set<number>,
  limit: number,
  progress: Array<{ id: number; state: string; bytesReceived: number; totalBytes: number }>
): Promise<DownloadItem> {
  const deadline = Date.now() + DOWNLOAD_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const added = (await queryDownloads(extensionPage, extensionId)).filter(
      ({ id }) => !previous.has(id)
    );
    if (added.length > 1) {
      throw new Error('Ambiguous new native download IDs');
    }
    const item = added[0];
    if (item) {
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
  throw new Error('Timed out waiting for one new extension-owned download with byExtensionId');
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

export function verifyLiveArchiveSources(
  archive: ReturnType<typeof inspectLiveStoredZip>,
  originals: readonly { bytes: number; sha256: string }[],
  single: Buffer,
  selectedIndex: number
): void {
  assert.equal(archive.entries.length, originals.length, 'ZIP source count differs');
  assert(
    originals.length >= 2 && originals.length <= MAX_MEDIA,
    'Public source set is out of bounds'
  );
  assert(
    Number.isSafeInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < originals.length
  );
  assert.equal(
    createHash('sha256').update(single).digest('hex'),
    originals[selectedIndex]?.sha256,
    'Native single bytes differ from the independent public original'
  );
  for (let index = 0; index < originals.length; index += 1) {
    assert.equal(
      archive.entries[index]?.bytes,
      originals[index]?.bytes,
      `ZIP item ${index} size differs from its public original`
    );
    assert.equal(
      archive.entries[index]?.sha256,
      originals[index]?.sha256,
      `ZIP item ${index} bytes differ from its public original`
    );
  }
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
  readProviderObservations,
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
  readProviderObservations: () => Promise<readonly PhotoProviderObservation[]>;
}) {
  const receipt: {
    status: string;
    steps: Record<string, unknown> & {
      manualScrollCommandTargeting?: Awaited<
        ReturnType<typeof observeManualScrollCommandTargeting>
      >;
    };
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
    await page.bringToFront();
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

    const displays = await gallerySources(page);
    const { sources, mediaIds } = canonicalOwnedPhotoSources(
      displays,
      await readProviderObservations(),
      identityFromUrl(targetUrl).statusId
    );
    receipt.steps.canonicalPhotos = {
      mediaIds,
      displayPaths: displays.map((value) => new URL(value).pathname),
      providerPaths: sources.map((value) => new URL(value).pathname),
    };
    const originals = await preflightSources(page, sources, 0);
    receipt.steps.preflight = {
      mediaPaths: sources.map((value) => new URL(value).pathname),
      originals,
      limits: { perFile: MAX_FILE_BYTES, retainedTotal: MAX_RETAINED_BYTES },
    };
    const toolbar = gallery.locator('[data-gallery-element="toolbar"]');
    receipt.steps.manualScrollCommandTargeting = await observeManualScrollCommandTargeting(
      page,
      displays
    );
    assert.equal(
      receipt.steps.manualScrollCommandTargeting.status,
      'observed',
      receipt.steps.manualScrollCommandTargeting.error ?? 'Manual-scroll observation failed'
    );
    const knownSingle = new Set(
      (await queryDownloads(extensionPage, extensionId)).map(({ id }) => id)
    );
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
      extensionId,
      knownSingle,
      MAX_FILE_BYTES,
      singleProgress
    );
    assert(
      await extensionPage.evaluate(nativeSingleSourceMatchesDocument, {
        id: single.id,
        extensionId,
        expectedSource: sources[0]!,
      }),
      'Native single download did not use the selected public original'
    );
    const singleBytes = await readOwnedFile(single, downloads, MAX_FILE_BYTES);
    assert.equal(
      singleBytes.length,
      originals[0]?.bytes,
      'Native single size differs from original'
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
    const knownZip = new Set(
      (await queryDownloads(extensionPage, extensionId)).map(({ id }) => id)
    );
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
      extensionId,
      knownZip,
      MAX_RETAINED_BYTES - singleBytes.length,
      zipProgress
    );
    const zipBytes = await readOwnedFile(zip, downloads, MAX_RETAINED_BYTES - singleBytes.length);
    const contents = inspectLiveStoredZip(zipBytes, sources.length);
    assert.equal(zip.bytesReceived, zipBytes.length, 'Native ZIP completion byte count differs');
    verifyLiveArchiveSources(contents, originals, singleBytes, 0);
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
    const beforeFullDocumentTimeOrigin = await page.evaluate(() => performance.timeOrigin);
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
    const afterFullDocumentTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    assert.notEqual(
      afterFullDocumentTimeOrigin,
      beforeFullDocumentTimeOrigin,
      'Explicit status navigation did not create a new document'
    );
    receipt.steps.fullDocumentNavigation = {
      from: new URL(targetUrl).pathname,
      to: new URL(navigationUrl).pathname,
      newDocument: true,
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
      JSON.stringify(receipt, null, 2),
      { flag: 'wx', mode: 0o600 }
    );
  }
  return receipt;
}
