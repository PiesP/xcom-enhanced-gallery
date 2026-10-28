// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash, randomUUID } from 'node:crypto';
import {
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import type {
  BrowserContext,
  CDPSession,
  ConsoleMessage,
  Locator,
  Page,
  Request,
  Response,
  Route,
} from '@playwright/test';
import {
  CREDIT_CONTROLS_CASE,
  PUBLIC_PREPLAYER_CASE,
  QUOTED_CASES,
  RAPID_CLICK_A,
  RAPID_CLICK_B,
  UNAVAILABLE_SEQUENCE,
} from './fixtures/installed-quoted-video-api.ts';
import {
  expectedStoredZipBytes,
  readDownloadLiveLimit,
  readExactDownloadFile,
  verifyStoredZip,
  waitForRemovedDownloadFile,
} from './download-memory.ts';
import { startExtensionNativeFixtureLoopback } from './extension-native-loopback.ts';
import {
  createControlledVideoSettings,
  decodeStoredValue,
  observeLiveUrls,
  readStoredLanguage,
  readStoredVideoSettings,
  restoreStoredVideoSettings,
  validateLiveObservation,
  validateLiveUrls,
} from './live-page.ts';
import { runInstalledMediaApiReuseProfile } from './media-api-reuse-profile.ts';
import {
  captureUpgradeSettingsFailure,
  observeDefaultVideoClick,
  observeGalleryKeyboardNavigation,
  observeGalleryVolume,
} from './release-upgrade/gallery-volume.ts';
import {
  extensionInventorySha256,
  readSameVersionInput,
  readUpgradeInput,
  sha256,
} from './release-upgrade/source.ts';
import { runVideoLoadingProfile } from './video-loading-profile.ts';
import {
  COMPACT_DISPLAY_URL,
  COMPACT_FIXTURE_URL,
  COMPACT_INNER_ID,
  COMPACT_MIDDLE_ID,
  DELAYED_FAILURE_ID,
  DELAYED_NAVIGATION_ID,
  EXPERIENCE_FIXTURE_URL,
  EXPERIENCE_IMAGES,
  EXPERIENCE_TWEET_ID,
  IMAGE_URL_MARKERS,
  PUBLIC_FIXTURE_URL,
  QUALITY_FIXTURE_URL,
  QUALITY_IMAGE_PATHS,
  QUALITY_TWEET_ID,
  SOURCE_IMAGE_FAULTS,
  TWEET_ID,
  createImageFixtures,
  enableDeveloperMode,
  imageReceipt,
  installFixtureRoutes,
  verifyDownloadDirectory,
} from './install-preparation.ts';
import type {
  ApiRecord,
  CompactImages,
  ImageFixtures,
  QualityRequest,
} from './install-preparation.ts';

type TargetInfo = { type: string; targetId: string; url: string };
type TargetEvent = {
  event: string;
  sequence: number;
  targetId: string;
  targetInfo?: TargetInfo;
  url?: string;
};
type WorkerVersion = {
  versionId: string;
  scriptURL: string;
  targetId?: string;
  runningStatus: string;
  status: string;
  sequence: number;
};
type WorkerVersionUpdate = Omit<WorkerVersion, 'sequence'>;
type WorkerIdentity = { versionId: string; targetId?: string };
type StopObservation = { lifecycle: WorkerVersion };
type PageFetch = { host: string; path: string; resourceType: string };
type QuotedCase = (typeof QUOTED_CASES)[number];
type ConsoleErrorRecord = { location: string; text: string };
type MemoryRequest = {
  phase: string;
  marker: string;
  resourceType: string;
  pathname: string;
  status: number;
  declaredBytes: number;
  actualBodyBytes: number;
  startedAtMs: number;
  fulfilledAtMs?: number;
};
type MemoryEvidence = {
  status: string;
  cleanup: {
    galleryHandleError?: string;
    exactPageRouteRemoved?: boolean;
    routeError?: string;
    downloads?: Array<{
      id: number;
      filename: string;
      verifiedFileRemoved: boolean;
      terminalState?: string | null;
      nativeRemoveFileCalled?: boolean;
      fileRemovedEarlier?: boolean;
      fileAbsence?: Awaited<ReturnType<typeof waitForRemovedDownloadFile>> | undefined;
      erasedIds?: number[];
      historyRemoved?: boolean;
    }>;
    downloadError?: string;
  };
  requests: MemoryRequest[];
  downloads: unknown[];
  policy?: Awaited<ReturnType<typeof readDownloadLiveLimit>> & {
    declaredBytes: number;
    maximumPossibleAdmittedBytes: number;
    admission: string;
    memoryMetric: string;
    maximumFixtureBodyBytes?: number;
  };
  document?: { url: string; timeOrigin: number };
  rejection?: {
    declaredBytes: number;
    actualBodyBytes: number;
    observedContentLength: string | null;
    pathname: string;
    errorText: string;
    elapsedMs: number;
    nativeDownloadsCreated: number;
    acceptedEntries: number;
    rejectedEntries: number;
    partialDownloadId: number;
    screenshot?: string;
  };
  preSaveRetries?: Array<{
    attempt: number;
    cause: 'http-503' | 'resource-limit';
    observedResponseStatus: number;
    observedContentLength: string | null;
    requests: string[];
    newNativeDownloadIds: number[];
    visibleOutcome: string;
    recoveryActionEnabled: boolean;
  }>;
  expectedConsoleErrors?: ConsoleErrorRecord[];
  recoveryTransport?: unknown;
  missingScreenshot?: string;
  recoveryScreenshot?: string;
  uiPartialAfterFiveSeconds?: unknown;
  uiHealthy?: unknown;
  error?: string;
  failureScreenshot?: string;
  screenshotError?: string;
  failureReceiptError?: string;
};
type NativeLoopback = Awaited<ReturnType<typeof startExtensionNativeFixtureLoopback>>;
type WorkerObserver = Awaited<ReturnType<typeof createServiceWorkerObserver>>;
type DirectRestartState = {
  downloadId: number | null;
  duplicateEvents: number;
  events: Array<{ id: number; state: string; bytesReceived: number; totalBytes: number }>;
};
type DirectRestartEvidence = {
  status: string;
  cleanup: {
    listenerRemoved?: boolean;
    heldResponseReleased?: boolean;
    downloads?: Array<{ id: number; erased: number[]; terminalState: string }>;
    filesRemoved?: string[];
    errorCount?: number;
    errors?: string[];
  };
  sourceUrl?: string;
  filename?: string;
  expectedBytes?: number;
  callerOutcome?: string;
  nativeIdObservedAfterMs?: number;
  beforeStop?: unknown;
  stop?: Awaited<ReturnType<WorkerObserver['stopAndWait']>>;
  afterStop?: unknown;
  preCancel?: Awaited<ReturnType<WorkerObserver['capturePreCancelObservation']>>;
  afterCancel?: unknown;
  error?: string;
  failure?: unknown;
};
type Mv3PauseState = {
  downloadId: number | null;
  duplicateEvents: number;
  events: Array<{
    bytesReceived: number;
    filename: string | null;
    id: number;
    paused: boolean;
    state: string;
    totalBytes: number;
    url: string;
  }>;
  pause: { status: string; error?: string };
};
type Mv3RestartEvidence = {
  status?: string;
  filename?: string;
  requestId?: string;
  source: { bytes: number; mimeType: string; productionMessageType: string; url?: string };
  cleanup: {
    downloadRecovery?: { found: boolean };
    download?: { erasedIds: number[]; historyRemoved: boolean; terminalState: string | null };
    trackingRemoved?: boolean;
    pauseListener?: {
      controlCleared: boolean;
      removed: boolean;
      requestOutcomeCleared: boolean;
      state: Mv3PauseState | null;
    };
    blob?: { globalCleared: boolean; revoked: boolean };
    addedFilesRemoved?: boolean;
    errorCount?: number;
    errors?: string[];
  };
  beforeStop?: unknown;
  stop?: Awaited<ReturnType<WorkerObserver['stopAndWait']>>;
  afterStop?: unknown;
  preCancel?: Awaited<ReturnType<WorkerObserver['capturePreCancelObservation']>> & {
    download?: unknown;
    newDownloadIds?: number[];
    storageRecord?: PersistedDownloadRecord | null;
    trackingKeys?: string[];
  };
  cancellation?: unknown;
  afterCancel?: unknown;
  workerTargetEvents?: unknown;
  workerObservation?: unknown;
  error?: string;
  failureSnapshot?: unknown;
  preparationFailures?: Mv3RestartEvidence[];
};
type NativeNotificationCall = {
  id: string;
  createdAt: number;
  title: string | null;
  message: string | null;
};
type NativeNotificationSnapshot = {
  observerId: string;
  calls: NativeNotificationCall[];
  apiIntact: boolean;
  overflow: boolean;
  activeIds: string[];
  sampledAt: number;
};
type NativeNotificationState = {
  observerId: string;
  original: ChromeNotificationCreate;
  calls: NativeNotificationCall[];
  overflow: boolean;
  wrapper: ChromeNotificationCreate | null;
};
type ControlledSettingEvidence = {
  priorStoredMode?: string | null;
  effectiveMode?: string | null;
  restored?: boolean;
};
type UnavailableStep = {
  name: string;
  tweetId: string;
  status: string;
  typename?: string;
  preview?: unknown;
  clickedAt?: string;
  completedAt?: string;
  notification?: { id: string; message: string };
  api?: ApiRecord[];
  recoveryClosedThroughUi?: boolean;
  selected?: unknown;
  selection?: unknown;
  originUrl?: string | null;
  textOwner?: string;
  playbackStart?: number;
  playbackEnd?: number;
  close?: unknown;
};
type UnavailableEvidence = {
  status: string;
  pageUrl?: string;
  documentStartedAt?: number;
  steps: UnavailableStep[];
  mode?: string;
  durationToFourthRequestMs?: number;
};
type ContextLossEvidence = {
  status: 'pending' | 'passed' | 'failed';
  setting: ControlledSettingEvidence;
  oldPage?: unknown;
  heldExchange?: unknown;
  closedContext?: unknown;
  freshPage?: unknown;
  error?: string;
  cleanup: {
    oldPageClosed: boolean;
    freshPageClosed: boolean;
    hookReleasedOrContextClosed: boolean;
    observerRestored: boolean;
    errors: string[];
  };
};
type DelayedVideoCase = {
  name: string;
  pageUrl: string;
  tweetId: string;
  before: Awaited<ReturnType<typeof hostVideoState>>;
  request: ApiRecord;
  pending: unknown;
  pendingStart: Awaited<ReturnType<typeof hostVideoState>>;
  pendingEnd: Awaited<ReturnType<typeof hostVideoState>>;
  openingFeedback?: unknown;
  navigation?: unknown;
  expiry?: unknown;
  negativeInputs?: unknown;
  failureObservation?: unknown;
  failure?: unknown;
  photo?: unknown;
  healthyVideo?: unknown;
  notificationObserverRestored?: unknown;
  settingRestored?: boolean;
};

/** Observe only rendered fixture content while its real provider response is held. */
async function captureOpeningFeedback(page: Page, output: string, name: string) {
  const screenshot = `opening-${name}.png`;
  const surface = await page.evaluate(() => {
    const visible = (element: Element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0;
    };
    const statuses = Array.from(
      document.querySelectorAll('[role="status"], [aria-live], [data-xeg-opening]')
    )
      .filter(visible)
      .slice(0, 16)
      .map((element) => ({
        role: element.getAttribute('role'),
        live: element.getAttribute('aria-live'),
        text: (element.textContent ?? '').trim().slice(0, 240),
      }));
    const opening = Array.from(document.querySelectorAll('[data-xeg-opening]')).map((element) => ({
      text: element.textContent?.trim() ?? '',
      role: element.getAttribute('role'),
      live: element.getAttribute('aria-live'),
      visible: visible(element),
      pointerEvents: getComputedStyle(element).pointerEvents,
    }));
    return {
      url: location.href,
      documentStartedAt: performance.timeOrigin,
      observedAt: performance.now(),
      activeElement: document.activeElement?.tagName ?? null,
      galleryCount: document.querySelectorAll('[data-xeg-gallery-container]').length,
      firstMediaText: (document.querySelector('[data-rapid="a"]')?.textContent ?? '')
        .trim()
        .slice(0, 240),
      statuses,
      opening,
    };
  });
  await page.screenshot({ path: join(output, screenshot) });
  return { ...surface, screenshot };
}

type OpeningTimeline = {
  clicks: number[];
  shown: Array<{ at: number; text: string }>;
  removed: number[];
};

async function beginOpeningTimeline(page: Page, sourceSelector: string): Promise<void> {
  await page.evaluate((selector) => {
    type Probe = OpeningTimeline & {
      observer: MutationObserver;
      onClick: (event: MouseEvent) => void;
    };
    const scope = window as typeof window & { __xegOpeningProbe?: Probe };
    if (scope.__xegOpeningProbe) {
      throw new Error('Opening timeline already active');
    }
    const clicks: number[] = [];
    const shown: Probe['shown'] = [];
    const removed: number[] = [];
    const onClick = (event: MouseEvent) => {
      if (event.isTrusted && event.target instanceof Element && event.target.closest(selector)) {
        clicks.push(performance.now());
      }
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement && node.matches('[data-xeg-opening]')) {
            shown.push({ at: performance.now(), text: node.textContent?.trim() ?? '' });
          }
        }
        for (const node of record.removedNodes) {
          if (node instanceof HTMLElement && node.matches('[data-xeg-opening]')) {
            removed.push(performance.now());
          }
        }
      }
    });
    document.addEventListener('click', onClick, true);
    observer.observe(document.body, { childList: true });
    scope.__xegOpeningProbe = { clicks, shown, removed, observer, onClick };
  }, sourceSelector);
}

async function endOpeningTimeline(page: Page): Promise<OpeningTimeline> {
  return page.evaluate(() => {
    type Probe = OpeningTimeline & {
      observer: MutationObserver;
      onClick: (event: MouseEvent) => void;
    };
    const scope = window as typeof window & { __xegOpeningProbe?: Probe };
    const probe = scope.__xegOpeningProbe;
    if (!probe) {
      throw new Error('Opening timeline missing');
    }
    probe.observer.takeRecords().forEach((record) => {
      for (const node of record.removedNodes) {
        if (node instanceof HTMLElement && node.matches('[data-xeg-opening]')) {
          probe.removed.push(performance.now());
        }
      }
    });
    probe.observer.disconnect();
    document.removeEventListener('click', probe.onClick, true);
    delete scope.__xegOpeningProbe;
    return { clicks: probe.clicks, shown: probe.shown, removed: probe.removed };
  });
}

function assertOpeningVisible(
  snapshot: Awaited<ReturnType<typeof captureOpeningFeedback>>,
  label: string
): void {
  assert.deepEqual(
    snapshot.opening,
    [
      {
        text: 'Opening gallery…',
        role: 'status',
        live: 'polite',
        visible: true,
        pointerEvents: 'none',
      },
    ],
    `${label}: exactly one localized, visible, nonblocking current-action status is required`
  );
  assert.equal(snapshot.galleryCount, 0, `${label}: feedback must precede the gallery`);
}

function assertOpeningAbsent(
  snapshot: Awaited<ReturnType<typeof captureOpeningFeedback>>,
  label: string
): void {
  assert.deepEqual(snapshot.opening, [], `${label}: stale opening status must be removed`);
}

function assertOpeningTimeline(timeline: OpeningTimeline, label: string): void {
  assert.equal(timeline.clicks.length, 1, `${label}: exactly one trusted source click required`);
  assert.equal(timeline.shown.length, 1, `${label}: exactly one delayed status required`);
  assert.equal(timeline.shown[0]?.text, 'Opening gallery…');
  const elapsedMs = timeline.shown[0]!.at - timeline.clicks[0]!;
  assert(
    elapsedMs >= 450 && elapsedMs <= 1_500,
    `${label}: status must appear after the 500 ms threshold (observed ${elapsedMs} ms)`
  );
}

/** Capture what remains in the gallery itself, independently of native notifications. */
async function captureRecoveryUi(page: Page, output: string, name: string) {
  const screenshot = `recovery-${name}.png`;
  const snapshot = await page.evaluate(() => {
    const gallery = document.querySelector('[data-xeg-gallery-container]');
    const isVisible = (element: Element): boolean => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (element.closest('.xeg-sr-only, [hidden], [aria-hidden="true"]')) {
        return false;
      }
      const clipped =
        (style.clip !== 'auto' && style.clip !== '') ||
        (style.clipPath !== 'none' && style.clipPath !== '');
      return (
        !clipped &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 1 &&
        rect.height > 1
      );
    };
    const texts = (selector: string) =>
      Array.from(gallery?.querySelectorAll(selector) ?? []).map((element) => ({
        text: (element.textContent ?? '').trim().slice(0, 512),
        label: element.getAttribute('aria-label'),
        visible: isVisible(element),
        role: element.getAttribute('role'),
      }));
    const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
    const status = toolbar?.querySelector('[data-download-status]');
    const bulkOutcome = gallery?.querySelector('[data-gallery-element="bulk-download-outcome"]');
    const counter = toolbar?.querySelector('#xeg-toolbar-counter');
    return {
      url: location.href,
      timeOrigin: performance.timeOrigin,
      observedAt: performance.now(),
      galleryCount: document.querySelectorAll('[data-xeg-gallery-container]').length,
      activeElement:
        document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName,
      position: counter?.getAttribute('data-position') ?? null,
      total: counter?.getAttribute('data-total') ?? null,
      downloadStatus: status
        ? {
            state: status.getAttribute('data-download-status'),
            text: (status.textContent ?? '').trim(),
            visible: isVisible(status),
          }
        : null,
      bulkOutcome: bulkOutcome
        ? { text: (bulkOutcome.textContent ?? '').trim(), visible: isVisible(bulkOutcome) }
        : null,
      liveRegions: texts('[aria-live]'),
      alerts: texts('[role="alert"]'),
      recoveryActions: texts('button, a[href]')
        .filter(({ text, label }) =>
          /retry|reopen|original|download|zip/iu.test(`${text} ${label}`)
        )
        .slice(0, 16),
      galleryTextIncludingHidden: (gallery?.textContent ?? '').trim().slice(0, 800),
    };
  });
  await page.screenshot({ path: join(output, screenshot) });
  return { ...snapshot, screenshot };
}

/** A visible DOM box may still be outside the scrollport or clipped by its media wrapper. */
async function captureRecoveryPaint(page: Page, index: number) {
  return page.evaluate((itemIndex) => {
    const gallery = document.querySelector('[data-xeg-gallery-container]');
    const scrollport = gallery?.querySelector('[data-gallery-element="items"]');
    const alert = gallery?.querySelector(
      `[data-gallery-element="item"][data-index="${itemIndex}"] [role="alert"]`
    );
    const wrapper = alert?.parentElement;
    if (!scrollport || !alert || !wrapper) {
      return { painted: false, targets: [] };
    }
    const port = scrollport.getBoundingClientRect();
    const parent = wrapper.getBoundingClientRect();
    const viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const boundsOf = (rect: DOMRect) => ({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
    });
    const targets = Array.from(alert.querySelectorAll('span, button, a')).map((element) => {
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(x, y);
      const interactive = element.matches('button, a');
      const inset = Math.min(4, rect.height / 4);
      const hitSamples = interactive
        ? [rect.top + inset, y, rect.bottom - inset].map((sampleY) => {
            const sample = document.elementFromPoint(x, sampleY);
            return {
              y: sampleY,
              element: sample?.tagName ?? null,
              target: !!sample && element.contains(sample),
            };
          })
        : [];
      const hasArea = rect.width > 0 && rect.height > 0;
      const insideViewport =
        rect.left >= viewport.left - 1 &&
        rect.right <= viewport.right + 1 &&
        rect.top >= viewport.top - 1 &&
        rect.bottom <= viewport.bottom + 1;
      const insideScrollport =
        rect.left >= port.left - 1 &&
        rect.right <= port.right + 1 &&
        rect.top >= port.top - 1 &&
        rect.bottom <= port.bottom + 1;
      const insideWrapper =
        rect.left >= parent.left - 1 &&
        rect.right <= parent.right + 1 &&
        rect.top >= parent.top - 1 &&
        rect.bottom <= parent.bottom + 1;
      const hitTarget = hitSamples.every((sample) => sample.target);
      return {
        text: (element.textContent ?? '').trim(),
        bounds: boundsOf(rect),
        interactive,
        hasArea,
        insideViewport,
        insideScrollport,
        insideWrapper,
        hitTarget,
        hitElement: hit?.tagName ?? null,
        hitSamples,
        painted: hasArea && insideViewport && insideScrollport && insideWrapper && hitTarget,
      };
    });
    return {
      painted: targets.length >= 3 && targets.every((target) => target.painted),
      viewport,
      scrollport: boundsOf(port),
      wrapper: boundsOf(parent),
      targets,
    };
  }, index);
}

async function waitForRecoveryPaint(page: Page, index: number, description: string) {
  const deadline = Date.now() + 5_000;
  let last = await captureRecoveryPaint(page, index);
  while (!last.painted && Date.now() < deadline) {
    await delay(50);
    last = await captureRecoveryPaint(page, index);
  }
  if (!last.painted) {
    throw new Error(`Timed out waiting for ${description}: ${JSON.stringify(last)}`);
  }
  return last;
}

async function assertVisibleBulkOutcome(
  page: Page,
  expected: {
    included: number;
    omitted: number;
    handedOff: boolean;
    reason?: string;
    supplementary?: boolean;
  }
): Promise<string> {
  const panel = page.locator(
    '[data-xeg-gallery-container] [data-gallery-element="bulk-download-outcome"]'
  );
  await panel.waitFor({ state: 'visible' });
  const text = (await panel.textContent())?.trim() ?? '';
  assert.match(
    text,
    expected.supplementary
      ? /Scope: 1 previously missing items from this gallery\./u
      : /Scope: 3 media items shown in this gallery\./u
  );
  assert.match(
    text,
    new RegExp(`ZIP includes ${expected.included}; left out ${expected.omitted}\\.`, 'u')
  );
  assert.match(text, expected.handedOff ? /ZIP handed off to browser/u : /No ZIP handed off/u);
  assert.match(
    text,
    expected.handedOff
      ? /The browser accepted the ZIP request/u
      : /No ZIP was handed off to the browser/u
  );
  assert.match(
    text,
    expected.supplementary
      ? /This ZIP only contains recovered missing items\./u
      : /Download all starts a new ZIP/u
  );
  if (expected.reason) {
    assert(text.includes(expected.reason), `Visible ZIP result omitted: ${expected.reason}`);
  }
  return text;
}
type SourceQualityEvidence = {
  status: string;
  url?: string;
  selectedIndex?: number;
  sources: Array<{
    observedUrl: string;
    originalUrl: string;
    display: { width: number; height: number; bytes: number; sha256: string };
    original: { width: number; height: number; bytes: number; sha256: string };
  }>;
  requests: QualityRequest[];
  hostImage?: unknown;
  origin?: string | null;
  selection?: unknown;
  current?: unknown;
  zip?: unknown;
  reopen?: unknown;
  restoration?: unknown;
  api?: ApiRecord[];
  screenshots?: string[];
  elapsedMs?: number;
  error?: string;
  failureScreenshot?: string;
  screenshotError?: string;
};
type SourceImageFailureEvidence = {
  status: 'pending' | 'passed' | 'failed';
  cases: Array<{
    kind: (typeof SOURCE_IMAGE_FAULTS)[number];
    status: 'pending' | 'passed' | 'failed';
    originalUrl: string;
    expectedStatus: number;
    faultRequests: Array<{ url: string; status: number; bytes: number; resourceType: string }>;
    responses: Array<{ url: string; status: number; resourceType: string }>;
    consoleErrors: ConsoleErrorRecord[];
    pageErrors: string[];
    api: ApiRecord[];
    host?: unknown;
    failed?: unknown;
    failedPaint?: Awaited<ReturnType<typeof captureRecoveryPaint>>;
    neighbor?: unknown;
    returned?: unknown;
    retries?: unknown[];
    exhaustedPaint?: Awaited<ReturnType<typeof captureRecoveryPaint>>;
    firstClose?: unknown;
    healthy?: unknown;
    finalClose?: unknown;
    healthyRequests?: QualityRequest[];
    screenshot?: string;
    screenshotError?: string;
    error?: string;
    cleanup: {
      routeRemoved: boolean;
      listenersRemoved: boolean;
      pageClosed: boolean;
      errors: string[];
    };
  }>;
  errors?: string[];
};
type AcceptanceReceipt = {
  status: string;
  error?: string;
  api?: ApiRecord[];
  expectedConsoleErrors?: ConsoleErrorRecord[];
  boundary?: unknown;
  boundaryError?: string;
};
type NativeControlNode = {
  backendNodeId: number;
  nodeName: string;
  attributes?: string[];
  children?: NativeControlNode[];
  shadowRoots?: NativeControlNode[];
  shadowRootType?: string;
};
type NativeControlPoint = {
  kind: 'play' | 'timeline' | 'volume';
  x: number;
  y: number;
  node: string;
  hitBackendNodeId: number;
  documentPoint: { x: number; y: number };
};
type NativeControlProbe = {
  backendNodeId: number;
  rejection:
    | 'box-unavailable'
    | 'invalid-box'
    | 'too-small'
    | 'outside-video'
    | 'hit-query-error'
    | 'wrong-host'
    | 'wrong-descendant'
    | 'accepted';
  viewport?: { x: number; y: number };
  document?: { x: number; y: number };
  hitBackendNodeId?: number;
  hostBackendNodeId?: number;
};
type Own12Mode = 'block-controls-only' | 'allow-all' | 'block-all';
type Own12ModeEvidence = AcceptanceReceipt & {
  mode: Own12Mode;
  settingsRestorationFailed?: boolean;
  native?: unknown;
  adjacentPhoto?: unknown;
  geometry: Array<Record<string, unknown>>;
  discovery: Array<{
    kind: NativeControlPoint['kind'];
    candidates: string[];
    uaInputs: Array<{
      backendNodeId: number;
      pseudo: string | null;
      className: string | null;
      ariaLabel: string | null;
      type: string | null;
    }>;
    uaInputCount: number;
    hostState: {
      paused: boolean;
      currentTime: number;
      ended: boolean;
      readyState: number;
      error: number | null;
    };
    probes: NativeControlProbe[];
    hoverWait?: { attempts: number; elapsedMs: number; boxAvailable: boolean };
  }>;
  events: Array<{ type: string; trusted: boolean; time: number; volume: number; paused: boolean }>;
  cleanup: {
    observerRemoved: boolean;
    cdpDetached: boolean;
    listenersRemoved: boolean;
    pageClosed: boolean;
    errors: string[];
  };
};
type Own12NativeControlsEvidence = AcceptanceReceipt & {
  modes: Own12ModeEvidence[];
  transport?: {
    path: string;
    original: { bytes: number; sha256: string };
    audioVideo: { bytes: number; sha256: string };
    restored: boolean;
  };
  cleanup: { errors: string[] };
};
type OriginalAvailabilityEvidence = {
  status: string;
  cases: unknown[];
  expectedConsoleErrors: ConsoleErrorRecord[];
  error?: string;
};
type FlowCleanup = {
  workerObserverDisposed?: boolean;
  fixturePageClosed?: boolean;
  extensionPageClosed?: boolean;
  fixtureRoutesRemoved?: boolean;
  errorCount?: number;
  errors?: string[];
};
type UpgradeReceipt = {
  status: string;
  previousVersion: string;
  candidateVersion: string;
  previousExtensionInventorySha256: string;
  candidateExtensionInventorySha256: string;
  extensionId: string;
  baselineClickModeUi?: string;
  keyboardBefore?: unknown;
  videoClickBefore?: unknown;
  volumeBefore?: unknown;
  volumeBeforeStorageObservation?: unknown;
  volumeBeforeReloaded?: unknown;
  settingsBefore?: unknown;
  settingsAfter?: unknown;
  videoClickAfter?: unknown;
  nondefaultClickCrossUpdate?: string;
  volumeAfter?: unknown;
  volumeAfterStorageObservation?: unknown;
  volumeAfterReloaded?: unknown;
  keyboardAfter?: unknown;
  candidateClickModeStorageObservation?: unknown;
  candidateClickModeReloaded?: string;
  candidateClickModeReadbackFailure?: unknown;
  candidateClickModeRestoreStorageObservation?: unknown;
  candidateClickModeUi?: unknown;
  fixtureDefaultsRestoredThroughUi?: boolean;
  settingsFailure?: unknown;
  method?: string;
  storedPreferencesAtFailure?: unknown;
  storedPreferencesDiagnosticError?: string;
  error?: string;
  cleanupError?: string;
};
type InstallResult = {
  browserName: string;
  installation: string;
  installationMethod: string;
  liveUrls: string[];
  liveObservation: null;
  scope: string;
  status: string;
  cleanup: {
    fixtureExtensionUninstalled?: boolean;
    fixtureBrowserClosed?: boolean;
    fixtureLoopbackClosed?: boolean;
    extensionUninstalled?: boolean;
    browserClosed?: boolean;
    profileRemoved?: boolean;
    profilePreserved?: boolean;
    errorCount?: number;
    errors?: string[];
  };
  fixtureTransport?: {
    kind: string;
    bind: string;
    port: number;
    hosts: string[];
    certificateScope: string;
    observations?: ReturnType<NativeLoopback['snapshot']>;
  };
  browserVersion?: string;
  upgrade?: UpgradeReceipt;
  sameVersion?: Awaited<ReturnType<typeof runSameVersionAttribution>>;
  fixture?: Awaited<ReturnType<typeof exerciseInstalledExtension>>;
  openingFeedback?: unknown;
  mediaDownloadRecovery?: unknown;
  failedEntryRecovery?: unknown;
  galleryExperience?: unknown;
  liveBrowserScope?: string;
  live?: unknown;
  evidenceStatus?: string;
  error?: string;
};
type TrustedDownloadInputEvidence = {
  status: string;
  syntheticInputs: Array<{
    input: string;
    galleryOpen: boolean;
    downloadId: number;
    state: string;
    paused: boolean;
    bytesReceived: number;
    filenameGate: IngressPauseState['filenameGate'];
    cancellationRequested: boolean;
    notificationCalls: number;
  }>;
  cleanup: {
    pauseListenerRemoved?: boolean;
    filenameGateReleased?: boolean;
    filenameListenerRemoved?: boolean;
    downloadHistoryRemoved?: boolean;
    notificationSeamRestored?: boolean;
    heldResponseReleased?: boolean;
    addedFilesRemoved?: boolean;
    errorCount?: number;
    errors?: string[];
  };
  bytes?: number;
  sourceUrl?: string;
  notificationScope?: string;
  downloadScope?: string;
  precondition?: unknown;
  before?: unknown;
  transport?: unknown;
  after?: {
    downloadId: number;
    state: string;
    error?: string;
    requestBinding: PersistedDownloadRecord | null;
    filesAdded: never[];
    galleryDetached: boolean;
    notificationCalls: number;
  };
  error?: string;
};
type PersistedDownloadRecord = {
  downloadId?: number;
  cancellationRequested: boolean;
  route?: 'direct';
  ownerTabId?: number;
  urlHash?: string;
  terminalState?: 'never-started' | 'complete' | 'interrupted';
};
type IngressPauseState = {
  downloadId: number | null;
  pause: string;
  duplicates: number;
  filenameGate: { downloadId: number | null; status: string };
};
type IngressPauseControl = {
  state: IngressPauseState;
  listener: (item: ChromeDownloadItem) => void;
  filenameListener: (
    item: ChromeDownloadItem,
    suggest: (suggestion?: { filename?: string; conflictAction?: string }) => void
  ) => boolean | undefined;
  releaseFilename: () => void;
};
declare global {
  interface Window {
    __quoteFixtureClicks: Array<{
      tag: string | null;
      path: string[];
      defaultPrevented: boolean;
      settled: boolean;
    }>;
    __preplayerFixtureClicks?: Array<{ tag: string | null; path: string[]; prevented: boolean }>;
    __quoteFixtureHostAction: (action: 'replay' | 'insert-playing' | 'replace') => Promise<{
      action: string;
      tag: string;
      playingBeforeInsertion?: boolean;
      beforeInsertion?: {
        start: number;
        end: number;
        width: number;
        height: number;
        error: number | null;
        loop: boolean;
      } | null;
      loop?: boolean;
    }>;
  }
  var __xegMv3PauseControl:
    | { state: Mv3PauseState; listener: (item: ChromeDownloadItem) => void }
    | undefined;
  var __xegMv3RestartBlobUrl: string | undefined;
  var __xegMv3RestartStart:
    | Promise<{ status: string; response?: unknown; error?: string }>
    | undefined;
  var __xegInstalledNotificationObserver: NativeNotificationState | undefined;
  var __xegIngressNotifications: { calls: number; original: ChromeNotificationCreate } | undefined;
  var __xegIngressPause: IngressPauseControl | undefined;
  var __xegDirectRestartObserver:
    | { state: DirectRestartState; listener: (item: ChromeDownloadItem) => void }
    | undefined;
}
type ChromeDownloadItem = {
  id: number;
  url: string;
  filename: string;
  state: string;
  bytesReceived: number;
  totalBytes: number;
  paused: boolean;
  exists: boolean;
  error?: string;
  finalUrl?: string;
};
type ChromeEvent<T extends (...args: never[]) => unknown> = {
  addListener(listener: T): void;
  removeListener(listener: T): void;
};
type ChromeNotificationCreate = (
  id: string,
  options?: { title?: string; message?: string }
) => Promise<string>;

declare const chrome: {
  settingsPrivate: {
    getPref(key: string, callback: (preference: { value: string }) => void): void;
  };
  storage: {
    local: {
      get<T = unknown>(key: string): Promise<Record<string, T>>;
      set(values: Record<string, unknown>): Promise<void>;
      remove(key: string): Promise<void>;
    };
  };
  downloads: {
    download(options: {
      url: string;
      filename: string;
      saveAs: boolean;
      conflictAction: 'uniquify';
    }): Promise<number>;
    search(query: {
      id?: number;
      orderBy?: string[];
      url?: string;
      limit?: number;
    }): Promise<ChromeDownloadItem[]>;
    pause(id: number): Promise<void>;
    cancel(id: number): Promise<void>;
    erase(query: { id: number }): Promise<number[]>;
    removeFile(id: number): Promise<void>;
    onCreated: ChromeEvent<(item: ChromeDownloadItem) => void>;
    onDeterminingFilename: ChromeEvent<
      (
        item: ChromeDownloadItem,
        suggest: (suggestion?: { filename?: string; conflictAction?: string }) => void
      ) => boolean | undefined
    >;
  };
  notifications: {
    create: ChromeNotificationCreate;
    getAll(): Promise<Record<string, unknown>>;
    clear(id: string): Promise<boolean>;
  };
  tabs: {
    query(query: { url: string }): Promise<Array<{ id: number; url: string }>>;
    getZoom(id: number): Promise<number>;
    getZoomSettings(id: number): Promise<{ mode: string; scope: string }>;
    setZoomSettings(id: number, settings: { mode: string; scope: string }): Promise<void>;
    setZoom(id: number, factor: number): Promise<void>;
  };
  runtime: {
    id: string;
    getManifest(): { name: string; version: string; icons?: Record<string, string> };
    getURL(path: string): string;
    sendMessage(message: unknown): Promise<unknown>;
    reload(): void;
  };
};

const PROFILE_PREFIX = 'xeg-chrome-install-';
const DEFAULT_NOTIFICATION_ICON = 'icons/icon-128x128.png';
const FIXTURE_URL = `https://x.com/testuser/status/${TWEET_ID}`;
// Three independent faults may each perform a failing and a healthy same-page open.
const COMPACT_ORIGINAL_URL =
  'https://pbs.twimg.com/media/CompactQuoteSelected?format=webp&name=orig';
const DOWNLOAD_TRACKING_STORAGE_KEY = 'xeg.download-tracking.v1';
const MV3_RESTART_BLOB_BYTES = 256 * 1024 * 1024;
const MAX_AGGREGATE_DEPTH = 2;
const MAX_AGGREGATE_ERRORS = 4;
const MAX_ERROR_SUMMARY_LENGTH = 2000;
const CAPACITY_TWEET_ID = '8666666666666666664';
const CAPACITY_MESSAGE =
  'This post exceeds the metadata size limit. Open it on X to view its media.';
const CYCLES = [
  { close: 'escape', direction: 'ArrowLeft', expectedIndex: 0, triggerIndex: 1 },
  { close: 'button', direction: 'ArrowRight', expectedIndex: 1, triggerIndex: 0 },
  { close: 'escape', direction: 'ArrowRight', expectedIndex: 2, triggerIndex: 1 },
];

function delay(ms: number) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function waitForValue<T>(
  readValue: () => T | undefined | Promise<T | undefined>,
  description: string,
  timeoutMs = 15_000
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastValue: T | undefined;
  while (Date.now() < deadline) {
    lastValue = await readValue();
    if (lastValue !== undefined) {
      return lastValue;
    }
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${description}: ${JSON.stringify(lastValue)}`);
}

function safeError(error: unknown, depth = 0): string {
  const rawSummary = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const summary =
    rawSummary.length > MAX_ERROR_SUMMARY_LENGTH
      ? `${rawSummary.slice(0, MAX_ERROR_SUMMARY_LENGTH)}...`
      : rawSummary;
  if (!(error instanceof AggregateError) || depth >= MAX_AGGREGATE_DEPTH) {
    return summary;
  }

  const nestedErrors = Array.from(error.errors);
  const details = nestedErrors
    .slice(0, MAX_AGGREGATE_ERRORS)
    .map((nestedError) => safeError(nestedError, depth + 1));
  if (nestedErrors.length > MAX_AGGREGATE_ERRORS) {
    details.push(`${nestedErrors.length - MAX_AGGREGATE_ERRORS} more errors`);
  }
  return details.length ? `${summary} [${details.join('; ')}]` : summary;
}

function expectedFilename(index: number) {
  return `testuser_${TWEET_ID}_${index}.jpg`;
}

function storedVideoClickMode(settings: unknown): string | null {
  if (typeof settings !== 'object' || settings === null || !('gallery' in settings)) {
    return null;
  }
  const gallery = settings.gallery;
  if (typeof gallery !== 'object' || gallery === null || !('videoClickMode' in gallery)) {
    return null;
  }
  return typeof gallery.videoClickMode === 'string' ? gallery.videoClickMode : null;
}

function storedGallerySetting(
  settings: unknown,
  key: 'imageFitMode' | 'videoClickMode' | 'enableKeyboardNav' | 'videoVolume' | 'videoMuted'
): unknown {
  if (typeof settings !== 'object' || settings === null || !('gallery' in settings)) {
    return undefined;
  }
  const gallery = settings.gallery;
  if (typeof gallery !== 'object' || gallery === null) {
    return undefined;
  }
  if (key === 'imageFitMode' && 'imageFitMode' in gallery) {
    return gallery.imageFitMode;
  }
  if (key === 'videoClickMode' && 'videoClickMode' in gallery) {
    return gallery.videoClickMode;
  }
  if (key === 'enableKeyboardNav' && 'enableKeyboardNav' in gallery) {
    return gallery.enableKeyboardNav;
  }
  if (key === 'videoVolume' && 'videoVolume' in gallery) {
    return gallery.videoVolume;
  }
  if (key === 'videoMuted' && 'videoMuted' in gallery) {
    return gallery.videoMuted;
  }
  return undefined;
}

function storedGalleryMediaPreferences(settings: unknown) {
  if (typeof settings !== 'object' || settings === null || !('gallery' in settings)) {
    return { volume: 1, muted: false };
  }
  const gallery = settings.gallery;
  if (typeof gallery !== 'object' || gallery === null) {
    return { volume: 1, muted: false };
  }
  return {
    volume:
      'videoVolume' in gallery && typeof gallery.videoVolume === 'number' ? gallery.videoVolume : 1,
    muted:
      'videoMuted' in gallery && typeof gallery.videoMuted === 'boolean'
        ? gallery.videoMuted
        : false,
  };
}

function qualityFilename(index: number) {
  return `qualityuser_${QUALITY_TWEET_ID}_${index}.jpg`;
}

function expectedOriginalImageUrl(displayUrl: string) {
  const url = new URL(displayUrl);
  url.searchParams.set('name', 'orig');
  return url.href;
}

function assertOwnedProfile(root: string, profile: string) {
  const resolvedRoot = resolve(root);
  const resolvedProfile = resolve(profile);
  assert.equal(
    dirname(resolvedProfile),
    resolvedRoot,
    'Chrome profile must be a direct child of the task root'
  );
  assert(
    basename(resolvedProfile).startsWith(PROFILE_PREFIX),
    'Chrome profile must use the task prefix'
  );
}

async function pathExists(path: string) {
  return stat(path).then(
    () => true,
    (error) => {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  );
}

async function createServiceWorkerObserver(browserCdp: CDPSession, pageCdp: CDPSession) {
  // Chromium exposes target discovery on the browser agent host and the
  // ServiceWorker domain through a render-frame agent host.
  const serviceWorkerTargetIds = new Set<string>();
  const targetEvents: TargetEvent[] = [];
  const versionEvents: WorkerVersion[] = [];
  const versions = new Map<string, WorkerVersion>();
  const onTargetCreated = ({ targetInfo }: { targetInfo: TargetInfo }) => {
    if (targetInfo.type === 'service_worker') {
      serviceWorkerTargetIds.add(targetInfo.targetId);
      targetEvents.push({
        event: 'created',
        sequence: targetEvents.length + 1,
        targetId: targetInfo.targetId,
        targetInfo: structuredClone(targetInfo),
        url: targetInfo.url,
      });
    }
  };
  const onTargetDestroyed = ({ targetId }: { targetId: string }) => {
    if (serviceWorkerTargetIds.has(targetId)) {
      targetEvents.push({
        event: 'destroyed',
        sequence: targetEvents.length + 1,
        targetId,
      });
    }
  };
  const onWorkerVersionUpdated = ({
    versions: updatedVersions,
  }: {
    versions: WorkerVersionUpdate[];
  }) => {
    for (const version of updatedVersions) {
      const snapshot = {
        ...structuredClone(version),
        sequence: versionEvents.length + 1,
      };
      versionEvents.push(snapshot);
      versions.set(version.versionId, snapshot);
    }
  };
  const removeListeners = () => {
    browserCdp.off('Target.targetCreated', onTargetCreated);
    browserCdp.off('Target.targetDestroyed', onTargetDestroyed);
    pageCdp.off('ServiceWorker.workerVersionUpdated', onWorkerVersionUpdated);
  };
  try {
    browserCdp.on('Target.targetCreated', onTargetCreated);
    browserCdp.on('Target.targetDestroyed', onTargetDestroyed);
    pageCdp.on('ServiceWorker.workerVersionUpdated', onWorkerVersionUpdated);
    await browserCdp.send('Target.setDiscoverTargets', { discover: true });
    await pageCdp.send('ServiceWorker.enable');
  } catch (error) {
    removeListeners();
    const cleanup = await Promise.allSettled([
      pageCdp.send('ServiceWorker.disable'),
      browserCdp.send('Target.setDiscoverTargets', { discover: false }),
    ]);
    const detach = await Promise.allSettled([pageCdp.detach()]);
    const failures = [...cleanup, ...detach]
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason);
    if (failures.length) {
      throw new AggregateError(
        [error, ...failures],
        'Service Worker observer initialization and cleanup failed'
      );
    }
    throw error;
  }

  const workerScriptUrl = (extensionId: string) =>
    `chrome-extension://${extensionId}/background.js`;
  const currentTargets = async (extensionId: string) => {
    const { targetInfos } = await browserCdp.send('Target.getTargets');
    return targetInfos.filter(
      ({ type, url }) => type === 'service_worker' && url === workerScriptUrl(extensionId)
    );
  };
  const createdTargetIds = (extensionId: string) =>
    targetEvents
      .filter(({ event, url }) => event === 'created' && url === workerScriptUrl(extensionId))
      .map(({ targetId }) => targetId);
  const matchingTargetEvents = (extensionId: string) => {
    const matchingTargetIds = new Set(
      targetEvents
        .filter(({ url }) => url === workerScriptUrl(extensionId))
        .map(({ targetId }) => targetId)
    );
    return targetEvents.filter(({ targetId }) => matchingTargetIds.has(targetId));
  };
  const matchingVersionEvents = (extensionId: string) =>
    versionEvents.filter(({ scriptURL }) => scriptURL === workerScriptUrl(extensionId));
  const snapshot = async (extensionId: string) => ({
    currentTargets: structuredClone(await currentTargets(extensionId)),
    targetEvents: structuredClone(matchingTargetEvents(extensionId)),
    versionEvents: structuredClone(matchingVersionEvents(extensionId)),
    versionStates: structuredClone(
      [...versions.values()].filter(({ scriptURL }) => scriptURL === workerScriptUrl(extensionId))
    ),
  });
  const runningWorkerAfter = (
    extensionId: string,
    worker: WorkerIdentity,
    lifecycleSequence: number,
    targets: Awaited<ReturnType<typeof currentTargets>>
  ) => {
    const runningEvent = matchingVersionEvents(extensionId).findLast(
      ({ runningStatus, sequence, versionId }) =>
        versionId === worker.versionId &&
        sequence > lifecycleSequence &&
        runningStatus === 'running'
    );
    const target = targets.find(({ targetId }) => targetId === runningEvent?.targetId);
    if (!runningEvent || !target) {
      return undefined;
    }
    if (versions.get(runningEvent.versionId)?.sequence !== runningEvent.sequence) {
      return undefined;
    }
    const lifecycleEvents = matchingVersionEvents(extensionId).filter(
      ({ sequence, versionId }) => versionId === worker.versionId && sequence > lifecycleSequence
    );
    return {
      lifecycle: structuredClone(runningEvent),
      lifecycleEvents: structuredClone(lifecycleEvents),
      startingObserved: lifecycleEvents.some(({ runningStatus }) => runningStatus === 'starting'),
      target: structuredClone(target),
      targetId: target.targetId,
      targetIdReused: target.targetId === worker.targetId,
      versionId: runningEvent.versionId,
    };
  };

  return {
    targetEvents,
    async waitForRunning(extensionId: string) {
      return waitForValue(async () => {
        const targets = await currentTargets(extensionId);
        const version = matchingVersionEvents(extensionId).findLast(
          (candidate) => candidate.runningStatus === 'running'
        );
        const target = targets.find(({ targetId }) => targetId === version?.targetId);
        if (!version) {
          return undefined;
        }
        if (versions.get(version.versionId)?.sequence !== version.sequence) {
          return undefined;
        }
        if (!target) {
          return undefined;
        }
        return {
          lifecycle: structuredClone(version),
          target: structuredClone(target),
          targetId: target.targetId,
          versionId: version.versionId,
        };
      }, 'running extension service worker');
    },
    async stopAndWait(extensionId: string, worker: WorkerIdentity) {
      const stopCreatedTargetIds = createdTargetIds(extensionId);
      const targetEventOffsetBeforeStop = targetEvents.length;
      const versionEventOffsetBeforeStop = versionEvents.length;
      await pageCdp.send('ServiceWorker.stopWorker', { versionId: worker.versionId });
      return waitForValue(async () => {
        const targets = await currentTargets(extensionId);
        const oldTargetPresent = targets.some(({ targetId }) => targetId === worker.targetId);
        const stoppedEvent = versionEvents.find(
          ({ runningStatus, sequence, versionId }) =>
            versionId === worker.versionId &&
            sequence > versionEventOffsetBeforeStop &&
            runningStatus === 'stopped'
        );
        const observedCreatedTargetIds = createdTargetIds(extensionId);
        if (!stoppedEvent) {
          return undefined;
        }
        return {
          createdEventCount: stopCreatedTargetIds.length,
          createdTargetIds: stopCreatedTargetIds,
          currentTargets: structuredClone(targets),
          extensionTargetCount: targets.length,
          lifecycle: structuredClone(stoppedEvent),
          oldTargetPresent,
          observedCreatedTargetIds,
          runningStatus: stoppedEvent.runningStatus,
          status: stoppedEvent.status,
          targetAbsentAtConfirmation: targets.length === 0,
          targetEventOffset: targetEvents.length,
          targetEventOffsetBeforeStop,
          versionEventOffset: versionEvents.length,
          versionEventOffsetBeforeStop,
        };
      }, 'old extension service worker to report stopped');
    },
    async capturePreCancelObservation(
      extensionId: string,
      worker: WorkerIdentity,
      stop: StopObservation
    ) {
      const targets = await currentTargets(extensionId);
      const observedCreatedTargetIds = createdTargetIds(extensionId);
      const replacementWorker = runningWorkerAfter(
        extensionId,
        worker,
        stop.lifecycle.sequence,
        targets
      );
      return {
        createdEventCount: observedCreatedTargetIds.length,
        createdTargetIds: observedCreatedTargetIds,
        currentTargets: structuredClone(targets),
        extensionTargetCount: targets.length,
        lifecycleBoundarySequence: versionEvents.length,
        lifecycleEventsAfterStop: structuredClone(
          matchingVersionEvents(extensionId).filter(
            ({ sequence }) => sequence > stop.lifecycle.sequence
          )
        ),
        replacementWorker: replacementWorker ?? null,
        targetEventOffset: targetEvents.length,
      };
    },
    async waitForRunningAfter(
      extensionId: string,
      worker: WorkerIdentity,
      lifecycleBoundarySequence: number
    ) {
      return waitForValue(async () => {
        const targets = await currentTargets(extensionId);
        return runningWorkerAfter(extensionId, worker, lifecycleBoundarySequence, targets);
      }, 'post-stop running extension service worker');
    },
    captureLifecycleBoundary() {
      return versionEvents.length;
    },
    snapshotEvents(extensionId: string) {
      return structuredClone(matchingTargetEvents(extensionId));
    },
    snapshot,
    async dispose() {
      removeListeners();
      const cleanup = await Promise.allSettled([
        pageCdp.send('ServiceWorker.disable'),
        browserCdp.send('Target.setDiscoverTargets', { discover: false }),
      ]);
      const detach = await Promise.allSettled([pageCdp.detach()]);
      const failures = [...cleanup, ...detach]
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason);
      if (failures.length) {
        throw new AggregateError(failures, 'Service Worker observer cleanup failed');
      }
    },
  };
}

async function createExperienceImages(context: BrowserContext): Promise<Buffer[]> {
  const page = await context.newPage();
  try {
    await page.goto('about:blank');
    const encoded = await page.evaluate(
      (sizes) =>
        sizes.map(({ width, height, label }, index) => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const drawing = canvas.getContext('2d');
          if (!drawing) {
            throw new Error('Experience fixture Canvas 2D context unavailable');
          }
          drawing.fillStyle = ['#1b6094', '#99591d', '#287348'][index] ?? '#555';
          drawing.fillRect(0, 0, width, height);
          drawing.fillStyle = '#fff';
          drawing.font = `bold ${Math.min(40, Math.max(18, width / 8))}px Segoe UI`;
          drawing.fillText(label, 10, Math.min(height - 10, 55));
          return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        }),
      EXPERIENCE_IMAGES
    );
    const images = encoded.map((value) => Buffer.from(value ?? '', 'base64'));
    assert(images.length === EXPERIENCE_IMAGES.length && images.every((image) => image.length));
    return images;
  } finally {
    await page.close();
  }
}

async function createCompactImages(context: BrowserContext): Promise<CompactImages> {
  const page = await context.newPage();
  try {
    await page.goto('about:blank');
    const encoded = await page.evaluate(() =>
      [120, 480].map((width) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = (width * 2) / 3;
        const drawing = canvas.getContext('2d');
        if (!drawing) {
          throw new Error('Compact WebP canvas unavailable');
        }
        drawing.fillStyle = '#346e9b';
        drawing.fillRect(0, 0, canvas.width, canvas.height);
        drawing.fillStyle = '#fff';
        drawing.font = `bold ${width / 10}px Segoe UI`;
        drawing.fillText('C fixture', 12, width / 5);
        const data = canvas.toDataURL('image/webp', 0.9);
        if (!data.startsWith('data:image/webp;base64,')) {
          throw new Error('Installed browser did not encode WebP');
        }
        return data.split(',')[1];
      })
    );
    const [display, original] = encoded.map((value) => Buffer.from(value ?? '', 'base64'));
    assert(display && original && display.length > 0 && original.length > display.length);
    assert.equal(display.toString('ascii', 8, 12), 'WEBP');
    assert.equal(original.toString('ascii', 8, 12), 'WEBP');
    return { display, original };
  } finally {
    await page.close();
  }
}

async function queryDownloads(extensionPage: Page): Promise<ChromeDownloadItem[]> {
  return extensionPage.evaluate(() => chrome.downloads.search({ orderBy: ['-startTime'] }));
}

async function findOwnedDownload(
  extensionPage: Page,
  initialDownloadIds: Set<number>,
  objectUrl: string
) {
  const matches = (await queryDownloads(extensionPage)).filter(
    (download) => !initialDownloadIds.has(download.id) && download.url === objectUrl
  );
  assert(matches.length <= 1, `Expected at most one owned download, found ${matches.length}`);
  return matches[0];
}

async function readPauseControlState(extensionPage: Page) {
  return extensionPage.evaluate(() => {
    const value = globalThis.__xegMv3PauseControl?.state;
    return value ? structuredClone(value) : null;
  });
}

async function recoverOwnedDownload(
  extensionPage: Page,
  initialDownloadIds: Set<number>,
  objectUrl: string
) {
  const pauseControl = await readPauseControlState(extensionPage);
  if (typeof pauseControl?.downloadId === 'number' && Number.isInteger(pauseControl.downloadId)) {
    assert.equal(
      initialDownloadIds.has(pauseControl.downloadId),
      false,
      'Pause listener matched a pre-existing download ID'
    );
    const [download] = await extensionPage.evaluate(
      (id) => chrome.downloads.search({ id }),
      pauseControl.downloadId
    );
    if (download !== undefined) {
      assert.equal(download.url, objectUrl, 'Pause listener matched a different download URL');
      return download;
    }
    return undefined;
  }
  return findOwnedDownload(extensionPage, initialDownloadIds, objectUrl);
}

async function readMv3LifecycleState(
  extensionPage: Page,
  requestId: string,
  downloadId: number | undefined
) {
  return extensionPage.evaluate(
    async ({ id, trackingKey, trackedRequestId }) => {
      const stored =
        await chrome.storage.local.get<Record<string, PersistedDownloadRecord>>(trackingKey);
      const records = stored[trackingKey] ?? {};
      const downloads = id === undefined ? [] : await chrome.downloads.search({ id });
      return {
        download: downloads[0] ?? null,
        record: records[trackedRequestId] ?? null,
        trackingKeys: Object.keys(records).sort(),
      };
    },
    {
      id: downloadId,
      trackedRequestId: requestId,
      trackingKey: DOWNLOAD_TRACKING_STORAGE_KEY,
    }
  );
}

export function assertDownloadIncomplete(
  download: ChromeDownloadItem | null | undefined,
  stage: string
) {
  assert(
    download !== null &&
      download !== undefined &&
      Number.isSafeInteger(download.bytesReceived) &&
      download.bytesReceived >= 0 &&
      Number.isSafeInteger(download.totalBytes) &&
      download.totalBytes > 0 &&
      download.bytesReceived < download.totalBytes,
    stage +
      ': paused download must have bytes remaining: ' +
      JSON.stringify({
        id: download?.id,
        state: download?.state,
        paused: download?.paused,
        bytesReceived: download?.bytesReceived,
        totalBytes: download?.totalBytes,
      })
  );
}

/** A fast local Blob can finish receiving bytes before Chrome acknowledges pause. */
export function canRetryMv3PausePreparation(evidence: Mv3RestartEvidence, error: unknown): boolean {
  const snapshot = evidence.failureSnapshot;
  const download =
    snapshot !== null && typeof snapshot === 'object' && 'download' in snapshot
      ? snapshot.download
      : undefined;
  const cleanup = evidence.cleanup;
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === 'ERR_ASSERTION' &&
    error.message.startsWith('before worker stop: paused download must have bytes remaining: ') &&
    evidence.source.bytes === MV3_RESTART_BLOB_BYTES &&
    evidence.source.productionMessageType === 'DOWNLOAD_BLOB_URL_REQUEST' &&
    evidence.beforeStop === undefined &&
    evidence.stop === undefined &&
    download !== null &&
    typeof download === 'object' &&
    'state' in download &&
    download.state === 'in_progress' &&
    'paused' in download &&
    download.paused === true &&
    'bytesReceived' in download &&
    download.bytesReceived === evidence.source.bytes &&
    'totalBytes' in download &&
    download.totalBytes === evidence.source.bytes &&
    cleanup.errorCount === 0 &&
    cleanup.download?.historyRemoved === true &&
    cleanup.trackingRemoved === true &&
    cleanup.pauseListener?.removed === true &&
    cleanup.pauseListener.controlCleared === true &&
    cleanup.pauseListener.requestOutcomeCleared === true &&
    cleanup.blob?.revoked === true &&
    cleanup.blob.globalCleared === true &&
    cleanup.addedFilesRemoved === true
  );
}

async function verifyTrustedDownloadInput({
  context,
  downloads,
  extensionId,
  extensionPage,
  page,
  evidence,
  nativeLoopback,
  images,
  pageFetches,
}: {
  context: BrowserContext;
  downloads: string;
  extensionId: string;
  extensionPage: Page;
  page: Page;
  evidence: TrustedDownloadInputEvidence;
  nativeLoopback: NativeLoopback;
  images: ImageFixtures;
  pageFetches: PageFetch[];
}) {
  const initialIds = (await queryDownloads(extensionPage)).map((item) => item.id);
  const initialFiles = new Set(await readdir(downloads));
  const worker = context
    .serviceWorkers()
    .find((item) => item.url().startsWith(`chrome-extension://${extensionId}/`));
  assert(worker, 'Installed worker must be available for the notification-count seam');
  const sourceUrl = `https://pbs.twimg.com/media/${QUALITY_IMAGE_PATHS[0]}?format=jpg&name=orig`;
  const transferMark = nativeLoopback.mark();
  const fetchMark = pageFetches.length;
  let downloadId: number | undefined;
  let primaryError: unknown;
  let primarySeen = false;
  let notificationSeamInstalled = false;
  let pauseInstalled = false;
  const cleanupErrors: unknown[] = [];
  Object.assign(evidence, {
    bytes: images[0].length,
    sourceUrl,
    syntheticInputs: [],
    notificationScope:
      'Production SHOW_NOTIFICATION path counted at native create boundary; delivery suppressed during this case',
    downloadScope:
      'Real direct URL download held by bounded fixture body and asynchronous native onDeterminingFilename listener',
    cleanup: {},
    status: 'pending',
  });
  try {
    nativeLoopback.armHold('pbs.twimg.com', `/media/${QUALITY_IMAGE_PATHS[0]}`);
    await worker.evaluate(() => {
      const original = chrome.notifications.create;
      const state = { calls: 0, original };
      globalThis.__xegIngressNotifications = state;
      chrome.notifications.create = async (id) => {
        state.calls += 1;
        return id;
      };
    });
    notificationSeamInstalled = true;
    await extensionPage.evaluate(
      ({ oldIds, sourceUrl }: { oldIds: number[]; sourceUrl: string }) => {
        const state: IngressPauseState = {
          downloadId: null,
          pause: 'waiting',
          duplicates: 0,
          filenameGate: { downloadId: null, status: 'waiting' },
        };
        const listener = (item: ChromeDownloadItem) => {
          if (oldIds.includes(item.id) || item.url !== sourceUrl) {
            return;
          }
          if (state.downloadId !== null) {
            state.duplicates += 1;
            return;
          }
          state.downloadId = item.id;
          Promise.resolve(chrome.downloads.pause(item.id)).then(
            () => {
              state.pause = 'fulfilled';
            },
            (error) => {
              state.pause = `rejected: ${String(error)}`;
            }
          );
        };
        let pendingSuggestion:
          | ((suggestion?: { filename?: string; conflictAction?: string }) => void)
          | undefined;
        const filenameListener = (
          item: ChromeDownloadItem,
          suggest: (suggestion?: { filename?: string; conflictAction?: string }) => void
        ) => {
          if (oldIds.includes(item.id) || item.url !== sourceUrl) {
            suggest();
            return;
          }
          if (pendingSuggestion) {
            state.duplicates += 1;
            suggest();
            return;
          }
          state.filenameGate = { downloadId: item.id, status: 'held' };
          pendingSuggestion = suggest;
          return true;
        };
        const releaseFilename = () => {
          if (!pendingSuggestion) {
            return;
          }
          const suggest = pendingSuggestion;
          pendingSuggestion = undefined;
          state.filenameGate.status = 'released';
          suggest();
        };
        globalThis.__xegIngressPause = { state, listener, filenameListener, releaseFilename };
        try {
          chrome.downloads.onDeterminingFilename.addListener(filenameListener);
          chrome.downloads.onCreated.addListener(listener);
        } catch (error) {
          try {
            releaseFilename();
          } finally {
            chrome.downloads.onDeterminingFilename.removeListener(filenameListener);
            chrome.downloads.onCreated.removeListener(listener);
            Reflect.deleteProperty(globalThis, '__xegIngressPause');
          }
          throw error;
        }
      },
      { oldIds: initialIds, sourceUrl }
    );
    pauseInstalled = true;
    const trigger = page.locator('[data-testid="tweetPhoto"] img').first();
    await trigger.click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    await page.keyboard.press('?');
    await waitForValue(
      async () =>
        (await worker.evaluate(() => {
          const state = globalThis.__xegIngressNotifications;
          if (!state) {
            throw new Error('Notification seam disappeared');
          }
          return state.calls;
        })) === 1
          ? true
          : undefined,
      'trusted help input to reach the notification boundary'
    );
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
    const control = await waitForValue(async () => {
      const value = await extensionPage.evaluate(() => {
        const marker = globalThis.__xegIngressPause;
        if (!marker) {
          throw new Error('Download pause control disappeared');
        }
        return marker.state;
      });
      if (value.pause.startsWith('rejected:')) {
        throw new Error(value.pause);
      }
      return typeof value.downloadId === 'number' &&
        Number.isInteger(value.downloadId) &&
        value.pause === 'fulfilled' &&
        value.filenameGate.status === 'held' &&
        value.filenameGate.downloadId === value.downloadId
        ? value
        : undefined;
    }, 'gallery-initiated native download to pause');
    assert(typeof control.downloadId === 'number');
    downloadId = control.downloadId;
    assert.equal(control.duplicates, 0);
    assert.equal(nativeLoopback.held(), true, 'Exact native source response must remain held');
    const binding = await waitForValue(
      async () =>
        extensionPage.evaluate(
          async ({ id, key }) => {
            const records =
              (await chrome.storage.local.get<Record<string, PersistedDownloadRecord>>(key))[key] ??
              {};
            const matches = Object.entries(records).filter(
              ([, record]) => record.downloadId === id
            );
            if (matches.length > 1) {
              throw new Error('Ambiguous native request ownership');
            }
            return matches[0] ? { requestId: matches[0][0], record: matches[0][1] } : undefined;
          },
          { id: downloadId, key: DOWNLOAD_TRACKING_STORAGE_KEY }
        ),
      'private request-to-download binding'
    );
    const trackedRequestId = binding.requestId;
    const before = await waitForValue(async () => {
      const state = await readMv3LifecycleState(extensionPage, trackedRequestId, downloadId);
      evidence.precondition = state;
      if (!state.download) {
        return undefined;
      }
      if (state.download.state !== 'in_progress') {
        throw new Error('Owned download ended before synthetic input');
      }
      if (
        state.download.totalBytes !== images[0].length ||
        !Number.isInteger(state.download.bytesReceived) ||
        state.download.bytesReceived < 0
      ) {
        return undefined;
      }
      assert(state.download.bytesReceived < images[0].length);
      return state.download.paused === true ? state : undefined;
    }, 'paused native download metadata while filename completion is gated');
    assert(before.record && before.download, 'Paused native download must retain its binding');
    assert.equal(before.record.downloadId, downloadId);
    assert.equal(before.record.route, 'direct');
    assert.equal(before.record.cancellationRequested, false);
    assert.equal(typeof before.record.ownerTabId, 'number');
    assert(before.record.urlHash, 'Direct download must retain its URL hash');
    assert.match(before.record.urlHash, /^[a-f0-9]{64}$/u);
    evidence.before = {
      downloadId,
      bytesReceived: before.download.bytesReceived,
      totalBytes: before.download.totalBytes,
      state: before.download.state,
      paused: before.download.paused,
      requestBinding: before.record,
      filenameGate: control.filenameGate,
      notificationCalls: 1,
    };
    for (const input of [
      'Escape',
      'help',
      'outside',
      'backdrop',
      'close',
      'reparented-close',
      'download',
    ]) {
      await page.evaluate((kind) => {
        if (kind === 'Escape' || kind === 'help') {
          document.body.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: kind === 'Escape' ? 'Escape' : '?',
              bubbles: true,
              cancelable: true,
            })
          );
        } else if (kind === 'outside') {
          document.body.click();
        } else if (kind === 'backdrop') {
          const items = document.querySelector('[data-gallery-element="items"]');
          if (items instanceof HTMLElement) {
            items.click();
          }
        } else {
          const button = document.querySelector(
            `[data-gallery-element="toolbar"] button[aria-label="${kind === 'download' ? 'Download' : 'Close'}"]`
          );
          if (!(button instanceof HTMLButtonElement)) {
            throw new Error('Missing actual toolbar button');
          }
          if (kind === 'reparented-close') {
            const parent = button.parentNode;
            if (!parent) {
              throw new Error('Toolbar button has no parent');
            }
            const next = button.nextSibling;
            try {
              document.body.append(button);
              button.click();
            } finally {
              parent.insertBefore(button, next);
            }
          } else {
            button.click();
          }
        }
      }, input);
      await delay(150);
      assert.equal(await gallery.isVisible(), true, `${input}: gallery must remain open`);
      const current = await readMv3LifecycleState(extensionPage, trackedRequestId, downloadId);
      assert(current.download, 'Synthetic input must preserve the native download');
      assert.equal(
        current.download?.state,
        'in_progress',
        `${input}: native download must remain active`
      );
      assert.equal(current.download.paused, true);
      assert.equal(current.download.totalBytes, images[0].length);
      assert(
        current.download.bytesReceived >= 0 && current.download.bytesReceived < images[0].length
      );
      const filenameGate = await extensionPage.evaluate(() => {
        const marker = globalThis.__xegIngressPause;
        if (!marker) {
          throw new Error('Download pause control disappeared');
        }
        return marker.state.filenameGate;
      });
      assert.deepEqual(filenameGate, { downloadId, status: 'held' });
      assert.deepEqual(current.record, before.record);
      assert.equal(
        await worker.evaluate(() => {
          const state = globalThis.__xegIngressNotifications;
          if (!state) {
            throw new Error('Notification seam disappeared');
          }
          return state.calls;
        }),
        1,
        `${input}: synthetic input must not induce a notification`
      );
      evidence.syntheticInputs.push({
        input,
        galleryOpen: true,
        downloadId,
        state: current.download.state,
        paused: true,
        bytesReceived: current.download.bytesReceived,
        filenameGate,
        cancellationRequested: false,
        notificationCalls: 1,
      });
    }
    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    const terminal = await waitForValue(async () => {
      const value = await readMv3LifecycleState(extensionPage, trackedRequestId, downloadId);
      return value.download?.state === 'interrupted' &&
        value.record?.terminalState === 'interrupted'
        ? value
        : undefined;
    }, 'genuine Escape to cancel the exact owned download');
    assert(terminal.download, 'Cancelled native download disappeared');
    assert.equal(terminal.download.error, 'USER_CANCELED');
    assert.equal(terminal.download.url, sourceUrl);
    assert.deepEqual(
      (await queryDownloads(extensionPage))
        .filter(({ id }) => !initialIds.includes(id))
        .map(({ id }) => id),
      [downloadId],
      'Held direct cancellation must allocate exactly one native download'
    );
    assert.deepEqual(
      pageFetches.slice(fetchMark),
      [],
      'Held direct save must not fetch the media in the page'
    );
    evidence.transport = await waitForValue(() => {
      const observed = nativeLoopback.since(transferMark);
      const transfer = observed.find(
        ({ host, path, method, result }) =>
          host === 'pbs.twimg.com' &&
          path === `/media/${QUALITY_IMAGE_PATHS[0]}` &&
          method === 'GET' &&
          result === 'aborted'
      );
      return transfer ? { transfer, events: observed } : undefined;
    }, 'cancelled direct fixture connection to close');
    await waitForValue(
      async () =>
        (await readdir(downloads)).every((entry) => initialFiles.has(entry)) ? true : undefined,
      'cancelled task files to disappear'
    );
    evidence.after = {
      downloadId,
      state: terminal.download.state,
      error: terminal.download.error,
      requestBinding: terminal.record,
      filesAdded: [],
      galleryDetached: true,
      notificationCalls: await worker.evaluate(() => {
        const state = globalThis.__xegIngressNotifications;
        if (!state) {
          throw new Error('Notification seam disappeared');
        }
        return state.calls;
      }),
    };
    assert.equal(evidence.after.notificationCalls, 1);
    evidence.status = 'passed';
  } catch (error) {
    primarySeen = true;
    primaryError = error;
    evidence.status = 'failed';
    evidence.error = safeError(error);
  } finally {
    if (pauseInstalled) {
      try {
        const state = await extensionPage.evaluate(() => {
          const control = globalThis.__xegIngressPause;
          if (!control) {
            throw new Error('Download pause control disappeared during cleanup');
          }
          try {
            control.releaseFilename();
          } finally {
            chrome.downloads.onDeterminingFilename.removeListener(control.filenameListener);
            chrome.downloads.onCreated.removeListener(control.listener);
            Reflect.deleteProperty(globalThis, '__xegIngressPause');
          }
          return control.state;
        });
        downloadId ??= state.downloadId ?? undefined;
        evidence.cleanup.pauseListenerRemoved = true;
        evidence.cleanup.filenameGateReleased = state.filenameGate.status === 'released';
        evidence.cleanup.filenameListenerRemoved = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (downloadId !== undefined) {
      const ownedDownloadId = downloadId;
      try {
        assert(
          !initialIds.includes(ownedDownloadId),
          'Refusing cleanup of a pre-existing download'
        );
        await extensionPage.evaluate(
          async ({ id, sourceUrl }) => {
            const [item] = await chrome.downloads.search({ id });
            if (item?.url !== sourceUrl) {
              throw new Error('Owned download URL mismatch');
            }
            if (!item) {
              throw new Error('Owned download disappeared before cleanup');
            }
            if (item.state === 'in_progress') {
              await chrome.downloads.cancel(id);
            }
          },
          { id: ownedDownloadId, sourceUrl }
        );
        await waitForValue(async () => {
          const [item] = await extensionPage.evaluate(
            (id) => chrome.downloads.search({ id }),
            ownedDownloadId
          );
          return item?.state !== 'in_progress' ? true : undefined;
        }, 'owned download to reach terminal cleanup state');
        await extensionPage.evaluate((id) => chrome.downloads.erase({ id }), ownedDownloadId);
        evidence.cleanup.downloadHistoryRemoved = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (notificationSeamInstalled) {
      try {
        await worker.evaluate(() => {
          const state = globalThis.__xegIngressNotifications;
          if (!state) {
            throw new Error('Notification seam disappeared during cleanup');
          }
          chrome.notifications.create = state.original;
          Reflect.deleteProperty(globalThis, '__xegIngressNotifications');
        });
        evidence.cleanup.notificationSeamRestored = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    try {
      nativeLoopback.releaseHold();
      evidence.cleanup.heldResponseReleased = true;
      for (const entry of await readdir(downloads)) {
        if (initialFiles.has(entry)) {
          continue;
        }
        const candidate = resolve(downloads, entry);
        assert.equal(dirname(candidate), resolve(downloads));
        await rm(candidate, { recursive: true, force: true });
      }
      evidence.cleanup.addedFilesRemoved = true;
    } catch (error) {
      cleanupErrors.push(error);
    }
    evidence.cleanup.errorCount = cleanupErrors.length;
    if (cleanupErrors.length) {
      evidence.cleanup.errors = cleanupErrors.map(safeError);
    }
  }
  const errors = [...(primarySeen ? [primaryError] : []), ...cleanupErrors];
  if (errors.length) {
    throw new AggregateError(
      errors,
      `Trusted input validation/cleanup failed: ${errors.map(safeError).join('; ')}`
    );
  }
}

async function verifyDirectRestartCancellation({
  downloads,
  extensionId,
  extensionPage,
  page,
  workerObserver,
  nativeLoopback,
  images,
  pageFetches,
  output,
  evidence,
}: {
  downloads: string;
  extensionId: string;
  extensionPage: Page;
  page: Page;
  workerObserver: WorkerObserver;
  nativeLoopback: NativeLoopback;
  images: ImageFixtures;
  pageFetches: PageFetch[];
  output: string;
  evidence: DirectRestartEvidence;
}) {
  const sourceUrl = `https://pbs.twimg.com/media/${QUALITY_IMAGE_PATHS[0]}?format=jpg&name=orig`;
  const sourcePath = `/media/${QUALITY_IMAGE_PATHS[0]}`;
  const filename = expectedFilename(0);
  const sourceHash = createHash('sha256').update(sourceUrl).digest('hex');
  const initialIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const initialFiles = new Set(await readdir(downloads));
  const initialKeys = new Set(
    await extensionPage.evaluate(
      async (key) => Object.keys((await chrome.storage.local.get(key))[key] ?? {}),
      DOWNLOAD_TRACKING_STORAGE_KEY
    )
  );
  const transportMark = nativeLoopback.mark();
  const fetchMark = pageFetches.length;
  const startedAtMs = performance.now();
  const deadline = Date.now() + 18_000;
  let downloadId: number | undefined;
  let requestId: string | undefined;
  let listenerInstalled = false;
  let primaryError: unknown;
  let primarySeen = false;
  const cleanupErrors: unknown[] = [];
  Object.assign(evidence, {
    status: 'pending',
    sourceUrl,
    filename,
    expectedBytes: images[0].length,
    cleanup: {},
    callerOutcome: 'not-observed across the stopped Worker boundary',
  });
  try {
    assert.equal(page.url(), FIXTURE_URL, 'Direct restart must use the owned X fixture tab');
    assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
    nativeLoopback.armHold('pbs.twimg.com', sourcePath);
    await extensionPage.evaluate(
      ({ knownIds, url }: { knownIds: number[]; url: string }) => {
        const state: DirectRestartState = { downloadId: null, duplicateEvents: 0, events: [] };
        const listener = (item: ChromeDownloadItem) => {
          if (knownIds.includes(item.id) || item.url !== url) {
            return;
          }
          state.events.push({
            id: item.id,
            state: item.state,
            bytesReceived: item.bytesReceived,
            totalBytes: item.totalBytes,
          });
          if (state.downloadId !== null) {
            state.duplicateEvents += 1;
          } else {
            state.downloadId = item.id;
          }
        };
        globalThis.__xegDirectRestartObserver = { state, listener };
        chrome.downloads.onCreated.addListener(listener);
      },
      { knownIds: [...initialIds], url: sourceUrl }
    );
    listenerInstalled = true;

    const trigger = page.locator('[data-testid="tweetPhoto"] img').first();
    await trigger.click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: 5_000 });
    const observedDisplay = await trigger.getAttribute('src');
    assert(observedDisplay, 'Fixture image source is missing');
    assert.equal(expectedOriginalImageUrl(observedDisplay), sourceUrl);
    const nativeActionAtMs = performance.now();
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
    const created = await waitForValue(
      async () => {
        const value = await extensionPage.evaluate(() => {
          const marker = globalThis.__xegDirectRestartObserver;
          if (!marker) {
            throw new Error('Direct restart observer disappeared');
          }
          return structuredClone(marker.state);
        });
        return typeof value.downloadId === 'number' && Number.isSafeInteger(value.downloadId)
          ? value
          : undefined;
      },
      'gallery direct download to receive a native ID',
      5_000
    );
    assert(typeof created.downloadId === 'number');
    downloadId = created.downloadId;
    evidence.nativeIdObservedAfterMs = performance.now() - nativeActionAtMs;
    assert.equal(created.duplicateEvents, 0);
    assert.deepEqual(
      created.events.map(({ id }) => id),
      [downloadId]
    );
    assert.equal(nativeLoopback.held(), true);
    const owner = await extensionPage.evaluate(async (url) => {
      const tabs = await chrome.tabs.query({ url });
      return tabs.length === 1 && tabs[0]?.url === url ? tabs[0].id : null;
    }, FIXTURE_URL);
    assert(
      typeof owner === 'number' && Number.isSafeInteger(owner) && owner >= 0,
      'Exact content tab owner is missing'
    );
    const binding = await waitForValue(
      async () =>
        extensionPage.evaluate(
          async ({ id, key }) => {
            const records =
              (await chrome.storage.local.get<Record<string, PersistedDownloadRecord>>(key))[key] ??
              {};
            const matches = Object.entries(records).filter(
              ([, record]) => record.route === 'direct' && record.downloadId === id
            );
            if (matches.length > 1) {
              throw new Error('Ambiguous direct request binding');
            }
            return matches[0] ? { requestId: matches[0][0], record: matches[0][1] } : undefined;
          },
          { id: downloadId, key: DOWNLOAD_TRACKING_STORAGE_KEY }
        ),
      'persisted direct request binding',
      5_000
    );
    requestId = binding.requestId;
    const trackedRequestId = binding.requestId;
    assert.equal(initialKeys.has(requestId), false);
    assert.equal(binding.record.ownerTabId, owner);
    assert.equal(binding.record.urlHash, sourceHash);
    assert.equal(binding.record.cancellationRequested, false);
    assert.equal(binding.record.terminalState, undefined);

    const before = await waitForValue(
      async () => {
        const state = await readMv3LifecycleState(extensionPage, trackedRequestId, downloadId);
        if (
          state.download?.state !== 'in_progress' ||
          state.download.totalBytes !== images[0].length ||
          basename(state.download.filename) !== filename
        ) {
          return undefined;
        }
        assertDownloadIncomplete(state.download, 'direct transfer before Worker stop');
        return state;
      },
      'incomplete native direct transfer',
      5_000
    );
    assert(before.download && before.record, 'Direct transfer lost its binding before Worker stop');
    assert.equal(before.download.url, sourceUrl);
    assert.equal(basename(before.download.filename), filename);
    assert.deepEqual(before.record, binding.record);
    assert.deepEqual(
      (await queryDownloads(extensionPage))
        .filter(({ id }) => !initialIds.has(id))
        .map(({ id }) => id),
      [downloadId]
    );
    evidence.beforeStop = {
      download: {
        id: downloadId,
        state: before.download.state,
        bytesReceived: before.download.bytesReceived,
        totalBytes: before.download.totalBytes,
        filename: basename(before.download.filename),
      },
      requestId,
      binding: before.record,
      transport: nativeLoopback.since(transportMark),
      elapsedMs: performance.now() - startedAtMs,
    };
    assert(Date.now() < deadline, 'Held direct fixture expired before Worker stop');
    const oldWorker = await workerObserver.waitForRunning(extensionId);
    const stop = await workerObserver.stopAndWait(extensionId, oldWorker);
    evidence.stop = stop;
    const afterStop = await readMv3LifecycleState(extensionPage, trackedRequestId, downloadId);
    assert(afterStop.download, 'Direct transfer disappeared after Worker stop');
    assert.equal(afterStop.download?.id, downloadId);
    assert.equal(afterStop.download?.url, sourceUrl);
    assert.equal(afterStop.download?.state, 'in_progress');
    assertDownloadIncomplete(afterStop.download, 'direct transfer after Worker stop');
    assert.deepEqual(
      afterStop.record,
      before.record,
      'Direct owner and source binding changed when the Worker stopped'
    );
    evidence.afterStop = {
      download: {
        id: downloadId,
        state: afterStop.download.state,
        bytesReceived: afterStop.download.bytesReceived,
        totalBytes: afterStop.download.totalBytes,
      },
      binding: afterStop.record,
      elapsedMs: performance.now() - startedAtMs,
    };
    const preCancel = await workerObserver.capturePreCancelObservation(
      extensionId,
      oldWorker,
      stop
    );
    evidence.preCancel = preCancel;
    assert.equal(nativeLoopback.held(), true, 'Native source closed before trusted cancellation');
    assert(Date.now() < deadline, 'Held direct fixture expired before trusted cancellation');
    assert.deepEqual(
      (await queryDownloads(extensionPage))
        .filter(({ id }) => !initialIds.has(id))
        .map(({ id }) => id),
      [downloadId],
      'Worker stop allocated an extra direct download'
    );

    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached', timeout: 5_000 });
    const terminal = await waitForValue(
      async () => {
        const state = await readMv3LifecycleState(extensionPage, trackedRequestId, downloadId);
        return state.download?.state === 'interrupted' &&
          state.record?.terminalState === 'interrupted'
          ? state
          : undefined;
      },
      'trusted Escape to cancel the persisted direct download',
      5_000
    );
    assert(terminal.download && terminal.record, 'Direct cancellation lost its native binding');
    assert.equal(terminal.download.id, downloadId);
    assert.equal(terminal.download.url, sourceUrl);
    assert.equal(terminal.download.error, 'USER_CANCELED');
    assert.equal(terminal.record.ownerTabId, owner);
    assert.equal(terminal.record.urlHash, sourceHash);
    const replacement =
      preCancel.replacementWorker ??
      (await workerObserver.waitForRunningAfter(extensionId, oldWorker, stop.lifecycle.sequence));
    assert.equal(replacement.versionId, oldWorker.versionId);
    assert(replacement.lifecycle.sequence > stop.lifecycle.sequence);
    const transport = await waitForValue(
      () => {
        const events = nativeLoopback
          .since(transportMark)
          .filter(({ host, path }) => host === 'pbs.twimg.com' && path === sourcePath);
        return events.length === 1 && events[0]?.result === 'aborted' ? events : undefined;
      },
      'single held direct connection to close after cancellation',
      5_000
    );
    assert.deepEqual(
      pageFetches
        .slice(fetchMark)
        .filter(({ host, path }) => host === 'pbs.twimg.com' && path === sourcePath),
      [],
      'Direct restart path fetched a full source in the page'
    );
    assert.deepEqual(
      (await queryDownloads(extensionPage))
        .filter(({ id }) => !initialIds.has(id))
        .map(({ id }) => id),
      [downloadId]
    );
    const residue = (await readdir(downloads)).filter((entry) => !initialFiles.has(entry));
    assert.deepEqual(residue, [], 'Cancelled direct transfer left a task file or partial residue');
    await page.screenshot({ path: join(output, 'direct-restart-after.png') });
    evidence.afterCancel = {
      id: downloadId,
      state: terminal.download.state,
      error: terminal.download.error,
      binding: terminal.record,
      worker: replacement,
      transport,
      residue,
      elapsedMs: performance.now() - startedAtMs,
    };
    evidence.status = 'passed';
  } catch (error) {
    primarySeen = true;
    primaryError = error;
    evidence.status = 'failed';
    evidence.error = safeError(error);
    const [downloadsRead, storageRead, filesRead, workerRead, screenshot] =
      await Promise.allSettled([
        queryDownloads(extensionPage),
        extensionPage.evaluate(
          async (key) =>
            (await chrome.storage.local.get<Record<string, PersistedDownloadRecord>>(key))[key] ??
            {},
          DOWNLOAD_TRACKING_STORAGE_KEY
        ),
        readdir(downloads),
        workerObserver.snapshot(extensionId),
        page.screenshot({ path: join(output, 'direct-restart-failure.png') }),
      ]);
    evidence.failure = {
      downloads:
        downloadsRead.status === 'fulfilled'
          ? downloadsRead.value
              .filter(({ id }) => !initialIds.has(id))
              .map(({ id, state, error, filename: path }) => ({
                id,
                state,
                error,
                filename: basename(path),
              }))
          : { error: safeError(downloadsRead.reason) },
      binding:
        storageRead.status === 'fulfilled' && requestId
          ? (storageRead.value[requestId] ?? null)
          : null,
      files:
        filesRead.status === 'fulfilled'
          ? filesRead.value.filter((entry) => !initialFiles.has(entry))
          : null,
      worker:
        workerRead.status === 'fulfilled'
          ? workerRead.value
          : { error: safeError(workerRead.reason) },
      transport: nativeLoopback.since(transportMark),
      screenshot: screenshot.status === 'fulfilled' ? 'direct-restart-failure.png' : null,
    };
  } finally {
    if (listenerInstalled) {
      try {
        const observed = await extensionPage.evaluate(() => {
          const control = globalThis.__xegDirectRestartObserver;
          if (!control) {
            throw new Error('Direct restart observer disappeared during cleanup');
          }
          chrome.downloads.onCreated.removeListener(control.listener);
          Reflect.deleteProperty(globalThis, '__xegDirectRestartObserver');
          return control.state;
        });
        downloadId ??= observed.downloadId ?? undefined;
        evidence.cleanup.listenerRemoved = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    nativeLoopback.releaseHold();
    evidence.cleanup.heldResponseReleased = true;
    try {
      const owned = (await queryDownloads(extensionPage)).filter(
        ({ id, url }) => !initialIds.has(id) && url === sourceUrl
      );
      evidence.cleanup.downloads = [];
      for (const item of owned) {
        const cleaned = await extensionPage.evaluate(
          async ({ id, url }) => {
            let [download] = await chrome.downloads.search({ id });
            if (!download || download.url !== url) {
              throw new Error('Direct cleanup owner changed');
            }
            if (download.state === 'in_progress') {
              await chrome.downloads.cancel(id);
            }
            const deadline = Date.now() + 5_000;
            while (download.state === 'in_progress' && Date.now() < deadline) {
              await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
              [download] = await chrome.downloads.search({ id });
              if (!download || download.url !== url) {
                throw new Error('Direct cleanup owner disappeared');
              }
            }
            if (download.state === 'in_progress') {
              throw new Error('Direct cleanup did not reach terminal state');
            }
            const erased = await chrome.downloads.erase({ id });
            if (!erased.includes(id) || (await chrome.downloads.search({ id })).length) {
              throw new Error('Direct cleanup history remained');
            }
            return { id, erased, terminalState: download.state };
          },
          { id: item.id, url: sourceUrl }
        );
        evidence.cleanup.downloads.push(cleaned);
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      const added = (await readdir(downloads)).filter((entry) => !initialFiles.has(entry));
      for (const entry of added) {
        assert(
          entry === filename || entry.startsWith(`${filename}.crdownload`),
          'Direct cleanup found an unexpected task file'
        );
        const path = resolve(downloads, entry);
        assert.equal(dirname(path), resolve(downloads));
        await rm(path, { force: true });
      }
      evidence.cleanup.filesRemoved = added;
    } catch (error) {
      cleanupErrors.push(error);
    }
    evidence.cleanup.errors = cleanupErrors.map(safeError);
    await writeFile(
      join(output, 'direct-restart-observation.json'),
      JSON.stringify(evidence, null, 2)
    ).catch((error) => cleanupErrors.push(error));
  }
  const errors = [...(primarySeen ? [primaryError] : []), ...cleanupErrors];
  if (errors.length) {
    throw new AggregateError(
      errors,
      `Direct restart validation/cleanup failed: ${errors.map(safeError).join('; ')}`
    );
  }
}

async function verifyMv3RestartCancellation({
  downloads,
  extensionId,
  extensionPage,
  evidence,
  page,
  workerObserver,
}: {
  downloads: string;
  extensionId: string;
  extensionPage: Page;
  evidence: Mv3RestartEvidence;
  page: Page;
  workerObserver: WorkerObserver;
}) {
  const filename = `xeg-mv3-restart-${randomUUID()}.bin`;
  const requestId = `xeg-mv3-restart-${randomUUID()}`;
  const initialFiles = new Set(await readdir(downloads));
  const initialDownloadIds = new Set(
    (await queryDownloads(extensionPage)).map((download) => download.id)
  );
  Object.assign(evidence, {
    cleanup: {},
    filename,
    requestId,
    source: {
      bytes: MV3_RESTART_BLOB_BYTES,
      mimeType: 'application/octet-stream',
      productionMessageType: 'DOWNLOAD_BLOB_URL_REQUEST',
    },
  });
  let downloadId: number | undefined;
  let objectUrl: string | undefined;
  let pauseListenerInstalled = false;
  let cancellationObservation: { status: string; response?: unknown; error?: string } = {
    status: 'not-sent',
  };
  let primaryError: unknown;
  let primarySeen = false;
  const cleanupErrors: unknown[] = [];

  try {
    const blobFixture = await page.evaluate((bytes) => {
      const chunk = new Uint8Array(1024 * 1024);
      chunk.fill(0x58);
      const parts = Array.from({ length: bytes / chunk.byteLength }, () => chunk);
      const blob = new Blob(parts, { type: 'application/octet-stream' });
      if (blob.size !== bytes) {
        throw new Error(`Unexpected fixture Blob size: ${blob.size}`);
      }
      const url = URL.createObjectURL(blob);
      globalThis.__xegMv3RestartBlobUrl = url;
      return { size: blob.size, url };
    }, MV3_RESTART_BLOB_BYTES);
    assert.equal(blobFixture.size, MV3_RESTART_BLOB_BYTES);
    assert(blobFixture.url.startsWith('blob:https://x.com/'));
    objectUrl = blobFixture.url;
    const ownedObjectUrl = blobFixture.url;
    evidence.source.url = objectUrl;

    await extensionPage.evaluate((ownedUrl) => {
      const state: Mv3PauseState = {
        downloadId: null,
        duplicateEvents: 0,
        events: [],
        pause: { status: 'waiting' },
      };
      const listener = (download: ChromeDownloadItem) => {
        if (download.url !== ownedUrl) {
          return;
        }
        state.events.push({
          bytesReceived: download.bytesReceived,
          filename:
            typeof download.filename === 'string'
              ? (download.filename.split(/[\\/]/).at(-1) ?? '')
              : null,
          id: download.id,
          paused: download.paused,
          state: download.state,
          totalBytes: download.totalBytes,
          url: download.url,
        });
        if (state.downloadId !== null) {
          state.duplicateEvents += 1;
          return;
        }
        state.downloadId = download.id;
        try {
          Promise.resolve(chrome.downloads.pause(download.id)).then(
            () => {
              state.pause = { status: 'fulfilled' };
            },
            (error) => {
              state.pause = { error: String(error), status: 'rejected' };
            }
          );
        } catch (error) {
          state.pause = { error: String(error), status: 'rejected' };
        }
      };
      globalThis.__xegMv3PauseControl = { listener, state };
      chrome.downloads.onCreated.addListener(listener);
    }, objectUrl);
    pauseListenerInstalled = true;

    await extensionPage.evaluate(
      (message) => {
        globalThis.__xegMv3RestartStart = chrome.runtime.sendMessage(message).then(
          (response) => ({ response, status: 'fulfilled' }),
          (error) => ({ error: String(error), status: 'rejected' })
        );
      },
      {
        type: 'DOWNLOAD_BLOB_URL_REQUEST',
        payload: {
          filename,
          mimeType: 'application/octet-stream',
          objectUrl,
          requestId,
        },
      }
    );

    const pauseControl = await waitForValue(async () => {
      const control = await readPauseControlState(extensionPage);
      if (control?.pause.status === 'rejected') {
        throw new Error(`Failed to pause owned download: ${control.pause.error}`);
      }
      return typeof control?.downloadId === 'number' &&
        Number.isInteger(control.downloadId) &&
        control.pause.status === 'fulfilled'
        ? control
        : undefined;
    }, 'owned Chrome download to be created and paused');
    assert(typeof pauseControl.downloadId === 'number');
    downloadId = pauseControl.downloadId;
    assert.equal(pauseControl.duplicateEvents, 0);
    assert.equal(pauseControl.events.length, 1);
    assert.equal(pauseControl.events[0]?.id, downloadId);
    assert.equal(pauseControl.events[0]?.url, objectUrl);
    const ownedDownload = await waitForValue(
      () => findOwnedDownload(extensionPage, initialDownloadIds, ownedObjectUrl),
      'owned Chrome download item'
    );
    assert.equal(ownedDownload.id, downloadId);
    const bound = await waitForValue(async () => {
      const stored = await extensionPage.evaluate(
        async ({ trackingKey, trackedRequestId }) => {
          const values =
            await chrome.storage.local.get<Record<string, PersistedDownloadRecord>>(trackingKey);
          return values[trackingKey]?.[trackedRequestId] ?? null;
        },
        {
          trackedRequestId: requestId,
          trackingKey: DOWNLOAD_TRACKING_STORAGE_KEY,
        }
      );
      return stored && typeof stored.downloadId === 'number' && Number.isInteger(stored.downloadId)
        ? stored
        : undefined;
    }, 'persisted request-to-download relationship');
    assert.equal(bound.downloadId, downloadId);

    const beforeStop = await waitForValue(async () => {
      const state = await readMv3LifecycleState(extensionPage, requestId, downloadId);
      const ready =
        state.download?.state === 'in_progress' &&
        state.download.paused === true &&
        state.download.totalBytes === MV3_RESTART_BLOB_BYTES &&
        typeof state.download.filename === 'string' &&
        basename(state.download.filename) === filename;
      if (!ready) {
        return undefined;
      }
      assertDownloadIncomplete(state.download, 'before worker stop');
      return state;
    }, 'paused in-progress Chrome download before worker stop');
    assert(beforeStop.download, 'Paused native download disappeared before Worker stop');
    assert.deepEqual(beforeStop.record, {
      cancellationRequested: false,
      downloadId,
    });
    assert.equal(beforeStop.download.paused, true);
    assert.equal(beforeStop.download.totalBytes, MV3_RESTART_BLOB_BYTES);
    assert.equal(basename(beforeStop.download.filename), filename);
    const oldWorker = await workerObserver.waitForRunning(extensionId);
    const initialWorkerObservation = await workerObserver.snapshot(extensionId);
    evidence.beforeStop = {
      download: {
        bytesReceived: beforeStop.download.bytesReceived,
        filename: basename(beforeStop.download.filename),
        id: downloadId,
        paused: beforeStop.download.paused,
        state: beforeStop.download.state,
        totalBytes: beforeStop.download.totalBytes,
      },
      pauseControl,
      storageRecord: beforeStop.record,
      worker: oldWorker,
      workerObservation: initialWorkerObservation,
    };

    const stop = await workerObserver.stopAndWait(extensionId, oldWorker);
    evidence.stop = stop;
    const afterStop = await readMv3LifecycleState(extensionPage, requestId, downloadId);
    assert(afterStop.download, 'Paused native download disappeared after Worker stop');
    assert.equal(afterStop.download?.state, 'in_progress');
    assert.equal(afterStop.download?.paused, true);
    assertDownloadIncomplete(afterStop.download, 'after worker stop');
    assert.deepEqual(
      afterStop.record,
      beforeStop.record,
      'Persisted tracking must survive the old worker stopping'
    );
    evidence.afterStop = {
      downloadPaused: afterStop.download.paused,
      downloadState: afterStop.download.state,
      storageRecord: afterStop.record,
    };
    const preCancel: NonNullable<Mv3RestartEvidence['preCancel']> =
      await workerObserver.capturePreCancelObservation(extensionId, oldWorker, stop);
    evidence.preCancel = preCancel;
    const preCancellationState = await readMv3LifecycleState(extensionPage, requestId, downloadId);
    assert(preCancellationState.download, 'Paused native download disappeared before cancellation');
    assert.equal(preCancellationState.download?.state, 'in_progress');
    assert.equal(preCancellationState.download.paused, true);
    assert.equal(preCancellationState.download.id, downloadId);
    assert.equal(preCancellationState.download.url, objectUrl);
    assert.equal(basename(preCancellationState.download.filename), filename);
    assert.equal(preCancellationState.download.totalBytes, MV3_RESTART_BLOB_BYTES);
    assertDownloadIncomplete(preCancellationState.download, 'before cancellation');
    assert.deepEqual(preCancellationState.record, beforeStop.record);
    assert.deepEqual(preCancellationState.trackingKeys, [requestId]);
    const newDownloadsBeforeCancellation = (await queryDownloads(extensionPage)).filter(
      ({ id }) => !initialDownloadIds.has(id)
    );
    assert.deepEqual(
      newDownloadsBeforeCancellation.map(({ id }) => id),
      [downloadId],
      'Worker restart must not allocate another Chrome download'
    );
    preCancel.download = {
      bytesReceived: preCancellationState.download.bytesReceived,
      filename: basename(preCancellationState.download.filename),
      id: preCancellationState.download.id,
      paused: preCancellationState.download.paused,
      state: preCancellationState.download.state,
      totalBytes: preCancellationState.download.totalBytes,
    };
    preCancel.newDownloadIds = newDownloadsBeforeCancellation.map(({ id }) => id);
    preCancel.storageRecord = preCancellationState.record;
    preCancel.trackingKeys = preCancellationState.trackingKeys;

    const cancellationDispatchLifecycleSequence = workerObserver.captureLifecycleBoundary();
    const cancellationResponsePromise = extensionPage.evaluate(
      (message) => chrome.runtime.sendMessage(message),
      {
        type: 'DOWNLOAD_CANCEL_REQUEST',
        payload: { requestId },
      }
    );
    const newWorkerPromise =
      preCancel.replacementWorker === null
        ? workerObserver.waitForRunningAfter(extensionId, oldWorker, stop.lifecycle.sequence)
        : Promise.resolve(preCancel.replacementWorker);
    const [cancellationResult, workerResult] = await Promise.allSettled([
      cancellationResponsePromise,
      newWorkerPromise,
    ]);
    cancellationObservation =
      cancellationResult.status === 'fulfilled'
        ? { response: cancellationResult.value, status: 'fulfilled' }
        : { error: safeError(cancellationResult.reason), status: 'rejected' };
    let replacementObservationTiming = 'not-observed';
    if (workerResult.status === 'fulfilled') {
      replacementObservationTiming =
        workerResult.value.lifecycle.sequence <= cancellationDispatchLifecycleSequence
          ? 'before-cancellation-dispatch'
          : 'after-cancellation-dispatch';
    }
    evidence.cancellation = {
      dispatchLifecycleSequence: cancellationDispatchLifecycleSequence,
      response: cancellationObservation,
      replacementObservationTiming,
      workerRestart:
        workerResult.status === 'fulfilled'
          ? { status: 'fulfilled', worker: workerResult.value }
          : { error: safeError(workerResult.reason), status: 'rejected' },
    };
    const cancellationFailures = [cancellationResult, workerResult]
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason);
    if (cancellationFailures.length > 1) {
      throw new AggregateError(
        cancellationFailures,
        'Cancellation response and service worker restart observation failed'
      );
    }
    if (cancellationFailures.length === 1) {
      throw cancellationFailures[0];
    }
    if (cancellationResult.status !== 'fulfilled' || workerResult.status !== 'fulfilled') {
      throw new Error('Cancellation outcomes were not fulfilled');
    }
    const cancellationResponse = cancellationResult.value;
    const newWorker = workerResult.value;
    assert.deepEqual(cancellationResponse, { success: true });
    assert.equal(newWorker.versionId, oldWorker.versionId);
    assert(newWorker.lifecycle.sequence > stop.lifecycle.sequence);

    const afterCancel = await waitForValue(async () => {
      const state = await readMv3LifecycleState(extensionPage, requestId, downloadId);
      return state.download?.state === 'interrupted' && state.record === null ? state : undefined;
    }, 'interrupted download and removed tracking record');
    assert(afterCancel.download, 'Cancelled native download disappeared');
    assert.equal(afterCancel.download.error, 'USER_CANCELED');
    assert.equal(
      resolve(afterCancel.download.filename),
      resolve(join(downloads, filename)),
      'Cancelled download must use the task-owned file path'
    );
    assert.deepEqual(afterCancel.trackingKeys, []);
    const remainingFiles = await waitForValue(async () => {
      const entries = await readdir(downloads);
      const additions = entries.filter((entry) => !initialFiles.has(entry));
      return additions.length === 0 ? entries : undefined;
    }, 'cancelled download files to be removed');
    // DownloadItem.exists is cached; search does not await its filesystem check.
    const fileSystemFileExists = await pathExists(join(downloads, filename));
    assert.equal(fileSystemFileExists, false);
    const originalRequestOutcome = await extensionPage.evaluate(async (timeoutMs) => {
      const outcome = globalThis.__xegMv3RestartStart;
      if (!outcome) {
        return { status: 'missing' };
      }
      return Promise.race([
        outcome,
        new Promise((resolveOutcome) => {
          setTimeout(() => resolveOutcome({ status: 'pending' }), timeoutMs);
        }),
      ]);
    }, 1_000);

    evidence.afterCancel = {
      download: {
        bytesReceived: afterCancel.download.bytesReceived,
        error: afterCancel.download.error,
        exists: afterCancel.download.exists,
        filename: basename(afterCancel.download.filename),
        id: downloadId,
        state: afterCancel.download.state,
      },
      filesAdded: remainingFiles.filter((entry) => !initialFiles.has(entry)),
      fileSystemFileExists,
      originalRequestOutcome,
      storageRecord: afterCancel.record,
      trackingKeys: afterCancel.trackingKeys,
      worker: newWorker,
    };
    evidence.workerTargetEvents = workerObserver.snapshotEvents(extensionId);
    evidence.workerObservation = await workerObserver.snapshot(extensionId);
    evidence.status = 'passed';
  } catch (error) {
    primarySeen = true;
    primaryError = error;
    evidence.error = safeError(error);
    let ownershipRecoveryError: unknown;
    if (downloadId === undefined && objectUrl !== undefined) {
      const ownedObjectUrl = objectUrl;
      try {
        downloadId = (await recoverOwnedDownload(extensionPage, initialDownloadIds, ownedObjectUrl))
          ?.id;
      } catch (recoveryError) {
        ownershipRecoveryError = recoveryError;
      }
    }
    const failureReads = await Promise.allSettled([
      readMv3LifecycleState(extensionPage, requestId, downloadId),
      readdir(downloads),
      readPauseControlState(extensionPage),
      workerObserver.snapshot(extensionId),
    ]);
    const lifecycleState = failureReads[0];
    const files = failureReads[1];
    const pauseControl = failureReads[2];
    const workerObservation = failureReads[3];
    evidence.failureSnapshot = {
      ...(lifecycleState.status === 'fulfilled'
        ? {
            download:
              lifecycleState.value.download === null
                ? null
                : {
                    bytesReceived: lifecycleState.value.download.bytesReceived,
                    error: lifecycleState.value.download.error,
                    exists: lifecycleState.value.download.exists,
                    filename:
                      typeof lifecycleState.value.download.filename === 'string'
                        ? basename(lifecycleState.value.download.filename)
                        : null,
                    id: lifecycleState.value.download.id,
                    paused: lifecycleState.value.download.paused,
                    state: lifecycleState.value.download.state,
                    totalBytes: lifecycleState.value.download.totalBytes,
                  },
            storageRecord: lifecycleState.value.record,
            trackingKeys: lifecycleState.value.trackingKeys,
          }
        : { lifecycleReadError: safeError(lifecycleState.reason) }),
      ...(files.status === 'fulfilled'
        ? { filesAdded: files.value.filter((entry) => !initialFiles.has(entry)) }
        : { fileReadError: safeError(files.reason) }),
      ...(ownershipRecoveryError === undefined
        ? { recoveredDownloadId: downloadId ?? null }
        : { ownershipRecoveryError: safeError(ownershipRecoveryError) }),
      ...(pauseControl.status === 'fulfilled'
        ? { pauseControl: pauseControl.value }
        : { pauseControlReadError: safeError(pauseControl.reason) }),
      cancellation: cancellationObservation,
      ...(workerObservation.status === 'fulfilled'
        ? { workerObservation: workerObservation.value }
        : { workerObservationReadError: safeError(workerObservation.reason) }),
      workerTargetEvents: workerObserver.snapshotEvents(extensionId),
    };
    evidence.status = 'failed';
  } finally {
    if (downloadId === undefined && objectUrl !== undefined) {
      const ownedObjectUrl = objectUrl;
      try {
        const pauseControl = await readPauseControlState(extensionPage);
        const recoverDownload = () =>
          recoverOwnedDownload(extensionPage, initialDownloadIds, ownedObjectUrl);
        const ownedDownload =
          typeof pauseControl?.downloadId === 'number' && Number.isInteger(pauseControl.downloadId)
            ? await waitForValue(
                recoverDownload,
                'listener-owned Chrome download item during cleanup',
                2_000
              )
            : await recoverDownload();
        downloadId = ownedDownload?.id;
        evidence.cleanup.downloadRecovery = { found: ownedDownload !== undefined };
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (downloadId !== undefined) {
      try {
        evidence.cleanup.download = await extensionPage.evaluate(async (id) => {
          let [download] = await chrome.downloads.search({ id });
          if (download?.state === 'in_progress') {
            await chrome.downloads.cancel(id);
            const deadline = Date.now() + 10_000;
            while (Date.now() < deadline) {
              [download] = await chrome.downloads.search({ id });
              if (download === undefined || download.state !== 'in_progress') {
                break;
              }
              await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
            }
          }
          if (download?.state === 'in_progress') {
            throw new Error(`Download ${id} remained in progress after cleanup cancellation`);
          }
          const terminalState = download?.state ?? null;
          const erasedIds = await chrome.downloads.erase({ id });
          const remaining = await chrome.downloads.search({ id });
          if (remaining.length !== 0) {
            throw new Error(`Download ${id} remained in browser history after cleanup erase`);
          }
          return { erasedIds, historyRemoved: true, terminalState };
        }, downloadId);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    try {
      await extensionPage.evaluate(
        async ({ trackingKey, trackedRequestId }) => {
          const stored =
            await chrome.storage.local.get<Record<string, PersistedDownloadRecord>>(trackingKey);
          const records = stored[trackingKey];
          if (!records || !Object.hasOwn(records, trackedRequestId)) {
            return;
          }
          const nextRecords = { ...records };
          delete nextRecords[trackedRequestId];
          await chrome.storage.local.set({ [trackingKey]: nextRecords });
        },
        {
          trackedRequestId: requestId,
          trackingKey: DOWNLOAD_TRACKING_STORAGE_KEY,
        }
      );
      evidence.cleanup.trackingRemoved = true;
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      evidence.cleanup.pauseListener = await extensionPage.evaluate(() => {
        const control = globalThis.__xegMv3PauseControl;
        const state = control ? structuredClone(control.state) : null;
        if (control) {
          chrome.downloads.onCreated.removeListener(control.listener);
        }
        Reflect.deleteProperty(globalThis, '__xegMv3PauseControl');
        Reflect.deleteProperty(globalThis, '__xegMv3RestartStart');
        return {
          controlCleared: !Object.hasOwn(globalThis, '__xegMv3PauseControl'),
          removed: control !== undefined,
          requestOutcomeCleared: !Object.hasOwn(globalThis, '__xegMv3RestartStart'),
          state,
        };
      });
      assert.equal(evidence.cleanup.pauseListener.controlCleared, true);
      assert.equal(evidence.cleanup.pauseListener.requestOutcomeCleared, true);
      if (pauseListenerInstalled) {
        assert.equal(evidence.cleanup.pauseListener.removed, true);
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (objectUrl !== undefined) {
      try {
        evidence.cleanup.blob = await page.evaluate((ownedUrl) => {
          URL.revokeObjectURL(ownedUrl);
          if (globalThis.__xegMv3RestartBlobUrl === ownedUrl) {
            Reflect.deleteProperty(globalThis, '__xegMv3RestartBlobUrl');
          }
          return {
            globalCleared: !Object.hasOwn(globalThis, '__xegMv3RestartBlobUrl'),
            revoked: true,
          };
        }, objectUrl);
        assert.deepEqual(evidence.cleanup.blob, { globalCleared: true, revoked: true });
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    try {
      const currentFiles = await readdir(downloads);
      for (const entry of currentFiles) {
        if (initialFiles.has(entry)) {
          continue;
        }
        const candidate = resolve(downloads, entry);
        assert.equal(
          dirname(candidate),
          resolve(downloads),
          'Download cleanup escaped task directory'
        );
        await rm(candidate, { recursive: true, force: true });
      }
      evidence.cleanup.addedFilesRemoved = true;
    } catch (error) {
      cleanupErrors.push(error);
    }
    evidence.cleanup.errorCount = cleanupErrors.length;
    if (cleanupErrors.length) {
      evidence.cleanup.errors = cleanupErrors.map(safeError);
    }
  }

  const combinedErrors = [...(primarySeen ? [primaryError] : []), ...cleanupErrors];
  if (combinedErrors.length > 1) {
    throw new AggregateError(
      combinedErrors,
      `MV3 restart validation and cleanup failed: ${combinedErrors.map(safeError).join('; ')}`
    );
  }
  if (primarySeen) {
    throw primaryError;
  }
  if (cleanupErrors.length) {
    throw cleanupErrors[0];
  }
  return evidence;
}

async function verifyPackagedIcons(extensionPage: Page) {
  const icons = await extensionPage.evaluate(async () => {
    const declarations = Object.entries(chrome.runtime.getManifest().icons ?? {});
    if (!declarations.length) {
      throw new Error('Installed extension manifest has no icons');
    }

    return Promise.all(
      declarations.map(async ([size, path]) => {
        const declaredSize = Number(size);
        const dimensions = await new Promise<{ height: number; width: number }>(
          (resolveImage, rejectImage) => {
            const image = new Image();
            image.addEventListener(
              'load',
              () => {
                resolveImage({ height: image.naturalHeight, width: image.naturalWidth });
              },
              { once: true }
            );
            image.addEventListener(
              'error',
              () => {
                rejectImage(new Error(`Failed to decode manifest icon ${size}: ${path}`));
              },
              { once: true }
            );
            image.src = chrome.runtime.getURL(path);
          }
        );
        return { declaredSize, height: dimensions.height, path, width: dimensions.width };
      })
    );
  });

  for (const icon of icons) {
    assert(
      Number.isSafeInteger(icon.declaredSize) && icon.declaredSize > 0,
      `Manifest icon size must be a positive integer: ${icon.declaredSize}`
    );
    assert.equal(
      icon.width,
      icon.declaredSize,
      `Manifest icon ${icon.path} intrinsic width must match ${icon.declaredSize}`
    );
    assert.equal(
      icon.height,
      icon.declaredSize,
      `Manifest icon ${icon.path} intrinsic height must match ${icon.declaredSize}`
    );
  }

  const defaultNotificationIcon = icons.find((icon) => icon.declaredSize === 128);
  assert.equal(
    defaultNotificationIcon?.path,
    DEFAULT_NOTIFICATION_ICON,
    'Installed manifest icon 128 must match the production notification fallback'
  );

  return { count: icons.length, defaultNotificationIcon: DEFAULT_NOTIFICATION_ICON, icons };
}

async function verifyDefaultNotification(extensionPage: Page) {
  const id = `xeg-installed-validation-${randomUUID()}`;
  const payload = {
    id,
    title: `XEG installed validation ${id}`,
    message: `Default notification icon validation ${id}`,
  };
  let validation: { active: boolean; response: unknown } | undefined;
  let validationError: unknown;
  let validationErrorSeen = false;
  let cleanup: { active: boolean; cleared: boolean } | undefined;
  let cleanupError: unknown;
  let cleanupErrorSeen = false;

  try {
    validation = await extensionPage.evaluate(async (notification) => {
      const response = await chrome.runtime.sendMessage({
        type: 'SHOW_NOTIFICATION',
        payload: notification,
      });
      const active = await chrome.notifications.getAll();
      return { active: Object.hasOwn(active, notification.id), response };
    }, payload);
    assert.deepEqual(
      validation.response,
      { success: true },
      'Default notification request must succeed'
    );
    assert.equal(
      validation.active,
      true,
      'Created default notification must be returned by chrome.notifications.getAll'
    );
  } catch (error) {
    validationErrorSeen = true;
    validationError = error;
  } finally {
    try {
      cleanup = await extensionPage.evaluate(async (notificationId) => {
        const cleared = await chrome.notifications.clear(notificationId);
        const active = await chrome.notifications.getAll();
        return { active: Object.hasOwn(active, notificationId), cleared };
      }, id);
      if (!validationErrorSeen) {
        assert.equal(
          cleanup.cleared,
          true,
          'Validation notification must be cleared by its exact ID'
        );
      }
      assert.equal(
        cleanup.active,
        false,
        'Validation notification must be absent after exact-ID cleanup'
      );
    } catch (error) {
      cleanupErrorSeen = true;
      cleanupError = error;
    }
  }

  if (validationErrorSeen && cleanupErrorSeen) {
    throw new AggregateError(
      [validationError, cleanupError],
      `Default notification validation and cleanup failed: ${safeError(validationError)}; ${safeError(cleanupError)}`
    );
  }
  if (validationErrorSeen) {
    throw validationError;
  }
  if (cleanupErrorSeen) {
    throw cleanupError;
  }
  assert(validation && cleanup, 'Notification validation and cleanup must complete');
  return {
    cleared: cleanup.cleared,
    defaultIcon: DEFAULT_NOTIFICATION_ICON,
    id,
    imageUrlOmitted: true,
    observed: validation.active,
  };
}

async function waitForDownload(extensionPage: Page, knownIds: Set<number>, filename: string) {
  const deadline = Date.now() + 20_000;
  let observed: ChromeDownloadItem[] = [];
  while (Date.now() < deadline) {
    observed = (await queryDownloads(extensionPage)).filter(
      (download) => !knownIds.has(download.id)
    );
    const item = observed.find(
      (download) => !knownIds.has(download.id) && basename(download.filename) === filename
    );
    if (item?.state === 'complete') {
      return item;
    }
    if (item?.state === 'interrupted') {
      throw new Error(`Chrome interrupted ${filename}: ${item.error ?? 'unknown error'}`);
    }
    await delay(100);
  }
  throw new Error(
    `Timed out waiting for privileged download ${filename}: ${JSON.stringify(
      observed.map(({ filename: name, state, error }) => ({
        filename: basename(name),
        state,
        error,
      }))
    )}`
  );
}

async function runNativeRedirectDiagnostic(
  extensionPage: Page,
  nativeLoopback: NativeLoopback,
  images: ImageFixtures
) {
  const initialUrl = 'https://pbs.twimg.com/media/GkE1234ABCDEF?format=jpg&name=orig';
  const destinationUrl = 'https://pbs.twimg.com/media/GkE5678GHIJKL.jpg?format=jpg&name=orig';
  const filename = 'xeg-native-redirect-diagnostic.jpg';
  const knownIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const mark = nativeLoopback.mark();
  nativeLoopback.armRedirect(initialUrl, destinationUrl);
  try {
    const id = await extensionPage.evaluate(
      ({ url, name }) =>
        chrome.downloads.download({
          url,
          filename: name,
          saveAs: false,
          conflictAction: 'uniquify',
        }),
      { url: initialUrl, name: filename }
    );
    const item = await waitForDownload(extensionPage, knownIds, filename);
    assert.equal(item.id, id);
    assert.equal(item.url, initialUrl);
    if (item.finalUrl) {
      assert.equal(item.finalUrl, destinationUrl);
    }
    const bytes = await readFile(item.filename);
    assert(bytes.equals(images[1]), 'Native redirect destination bytes differ');
    const events = nativeLoopback.since(mark);
    assert(
      events.some(({ status, redirectTo }) => status === 302 && redirectTo === destinationUrl)
    );
    assert(
      events.some(
        ({ host, path, status, result }) =>
          host === 'pbs.twimg.com' &&
          path === '/media/GkE5678GHIJKL.jpg' &&
          status === 200 &&
          result === 'served'
      ),
      'Browser native downloader did not follow the declared redirect'
    );
    return {
      scope:
        'direct chrome.downloads API diagnostic; production sender validation and gallery ownership covered separately',
      browserId: id,
      initialUrl: item.url,
      finalUrl: item.finalUrl || null,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      events,
    };
  } finally {
    nativeLoopback.clearRedirect();
  }
}

async function assertNativeSingle({
  extensionPage,
  knownIds,
  download,
  expectedUrl,
  expectedBytes,
  nativeLoopback,
  nativeMark,
  pageFetches = [],
}: {
  extensionPage: Page;
  knownIds: Set<number>;
  download: ChromeDownloadItem;
  expectedUrl: string;
  expectedBytes: Uint8Array;
  nativeLoopback: NativeLoopback;
  nativeMark: number;
  pageFetches?: PageFetch[];
}) {
  const created = (await queryDownloads(extensionPage)).filter(({ id }) => !knownIds.has(id));
  assert.deepEqual(
    created.map(({ id }) => id),
    [download.id],
    'One single action must create exactly one native download ID'
  );
  assert.equal(download.state, 'complete');
  assert.equal(download.url, expectedUrl, 'Native initial URL must be the selected source');
  if (download.finalUrl) {
    assert.equal(
      download.finalUrl,
      expectedUrl,
      'A native redirect escaped the selected fixture source'
    );
  }
  assert.equal(download.totalBytes, expectedBytes.length);
  assert.equal(download.bytesReceived, expectedBytes.length);
  const expected = new URL(expectedUrl);
  const appWholeFileFetches = pageFetches.filter(
    ({ host, path }) => host === expected.hostname && path === expected.pathname
  );
  assert.deepEqual(
    appWholeFileFetches,
    [],
    'Native single must not first fetch its whole source in the page'
  );
  const events = nativeLoopback
    .since(nativeMark)
    .filter((event) => event.host === expected.hostname && event.path === expected.pathname);
  assert(
    events.length > 0 &&
      events.every((event) => ['GET', 'HEAD'].includes(event.method) && event.result === 'served'),
    'Native transfer must complete the selected task-owned CDN fixture'
  );
  assert(
    events.some(({ method, bytes }) => method === 'GET' && bytes > 0),
    'Native browser transport did not receive a fixture body'
  );
  const firstEvent = events[0];
  const lastEvent = events.at(-1);
  assert(firstEvent && lastEvent, 'Native transfer must include a first and last event');
  assert(typeof lastEvent.finishedAtMs === 'number', 'Native transfer must have settled');
  return {
    id: download.id,
    initialUrl: download.url,
    finalUrl: download.finalUrl || null,
    serverEvents: events,
    appWholeFileFetches: appWholeFileFetches.length,
    expectedBytes: expectedBytes.length,
    elapsedTransportMs: lastEvent.finishedAtMs - firstEvent.atMs,
  };
}

async function fixtureTabZoom(
  context: BrowserContext,
  extensionId: string,
  page: Page,
  factor: number | null = null,
  restoreSettings: { mode: string; scope: string } | null = null,
  expectedUrl = FIXTURE_URL
) {
  assert.equal(page.url(), expectedUrl, 'Browser zoom must target the exact owned fixture page');
  const workerUrl = `chrome-extension://${extensionId}/background.js`;
  const workers = context.serviceWorkers().filter((worker) => worker.url() === workerUrl);
  assert.equal(workers.length, 1, 'Browser zoom requires the exact installed extension worker');
  const worker = workers[0];
  assert(worker, 'Installed extension worker is missing');
  return worker.evaluate(
    async ({ url, zoomFactor, restore }) => {
      const tabs = await chrome.tabs.query({ url });
      const tab = tabs[0];
      if (tabs.length !== 1 || !tab || tab.url !== url || !Number.isInteger(tab.id)) {
        throw new Error('Browser zoom requires one exact fixture tab');
      }
      const id = tab.id;
      const previous = await chrome.tabs.getZoom(id);
      const settings = await chrome.tabs.getZoomSettings(id);
      if (zoomFactor !== null) {
        await chrome.tabs.setZoomSettings(id, { mode: 'automatic', scope: 'per-tab' });
        await chrome.tabs.setZoom(id, zoomFactor);
        if (restore) {
          await chrome.tabs.setZoomSettings(id, { mode: restore.mode, scope: restore.scope });
        }
      }
      return {
        previous,
        settings,
        observed: await chrome.tabs.getZoom(id),
        observedSettings: await chrome.tabs.getZoomSettings(id),
      };
    },
    { url: expectedUrl, zoomFactor: factor, restore: restoreSettings }
  );
}

async function runZoomSpanishCycle({
  context,
  downloads,
  extensionId,
  extensionPage,
  images,
  output,
  page,
  nativeLoopback,
  pageFetches,
}: {
  context: BrowserContext;
  downloads: string;
  extensionId: string;
  extensionPage: Page;
  images: ImageFixtures;
  output: string;
  page: Page;
  nativeLoopback: NativeLoopback;
  pageFetches: PageFetch[];
}) {
  const baseline = await page.evaluate(() => ({
    devicePixelRatio: devicePixelRatio,
    innerWidth,
    viewportScale: visualViewport?.scale ?? null,
  }));
  const priorZoom = await fixtureTabZoom(context, extensionId, page);
  let zoomAttempted = false;
  try {
    zoomAttempted = true;
    const changedZoom = await fixtureTabZoom(context, extensionId, page, 2);
    assert.equal(changedZoom.observed, 2, 'Installed browser did not accept 200% tab zoom');
    const zoomRatio = changedZoom.observed / priorZoom.previous;
    await page.waitForFunction(
      (before) =>
        devicePixelRatio >= before.devicePixelRatio * before.zoomRatio * 0.95 &&
        innerWidth <= before.innerWidth / (before.zoomRatio * 0.95) &&
        Math.abs((visualViewport?.scale ?? 1) - 1) <= 0.05,
      { ...baseline, zoomRatio }
    );

    const trigger = page.locator('[data-testid="tweetPhoto"] img').first();
    await trigger.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -120));
    await trigger.focus();
    const before = await hostSnapshot(page, 0);
    assert(before.scrollY > 0, 'Zoom fixture must open from a nonzero host scroll position');
    await trigger.evaluate((element) => {
      element.addEventListener(
        'pointerdown',
        () => {
          element.dataset.openingScrollY = String(window.scrollY);
        },
        { once: true, capture: true }
      );
    });
    await trigger.click();
    before.scrollY = Number(await trigger.getAttribute('data-opening-scroll-y'));
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: 15_000 });
    const toolbar = gallery.locator('[data-gallery-element="toolbar"]');
    const settingsButton = toolbar.locator('#settings-button');
    await settingsButton.click();
    const languageSelect = gallery.locator('#settings-language-select');
    const priorLanguage = await languageSelect.inputValue();
    await languageSelect.selectOption('es');
    await page.waitForFunction(() =>
      document
        .querySelector('[data-gallery-element="fit-mode-label"]')
        ?.textContent?.startsWith('Ajuste: ')
    );
    await settingsButton.click();
    await toolbar.locator('button[aria-label="Ajustar ventana"]').click();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-gallery-element="fit-mode-label"]')?.textContent ===
        'Ajuste: Ajustar ventana'
    );

    await gallery.locator('[data-gallery-element="item"][data-index="0"] button').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(
      () => document.querySelector('#xeg-toolbar-counter')?.getAttribute('data-position') === '2'
    );
    const position = toolbar.locator('#xeg-toolbar-counter');
    assert.notEqual(
      await position.getAttribute('role'),
      'progressbar',
      'Collection position must not announce task progress'
    );
    assert.equal(await position.getAttribute('data-total'), '3');
    assert.equal(await position.getAttribute('data-focused-index'), '1');
    assert.equal(await toolbar.getAttribute('data-current-index'), '1');
    assert.equal(await toolbar.getAttribute('data-focused-index'), '1');
    const positionText = await position.textContent();
    assert(positionText, 'Spanish position text is missing');
    assert.match(positionText, /Archivo 2 de 3/u);
    const selectedSource = await gallery
      .locator('[data-gallery-element="item"][data-index="1"] img')
      .getAttribute('src');
    assert(
      selectedSource && selectedSource.includes('GkE5678'),
      'Displayed second item has wrong media provenance'
    );
    assert.equal(
      await toolbar.locator('button[aria-label="Ajustar ventana"]').getAttribute('aria-pressed'),
      'true'
    );
    const bulkLabel = 'Descargar los 3 archivos visibles como ZIP';
    assert.equal(await toolbar.locator(`button[aria-label="${bulkLabel}"]`).count(), 1);

    const layout = await toolbar.evaluate((element) => {
      const toolbarRect = element.getBoundingClientRect();
      const label = element.querySelector('[data-gallery-element="fit-mode-label"]');
      const labelRect = label?.getBoundingClientRect();
      const counter = element.querySelector('#xeg-toolbar-counter');
      const counterRect = counter?.getBoundingClientRect();
      return {
        viewportWidth: innerWidth,
        devicePixelRatio,
        viewportScale: visualViewport?.scale ?? null,
        toolbar: {
          left: toolbarRect.left,
          right: toolbarRect.right,
          width: toolbarRect.width,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
        },
        fitLabel: {
          text: label?.textContent?.trim() ?? null,
          left: labelRect?.left ?? null,
          right: labelRect?.right ?? null,
          height: labelRect?.height ?? null,
          fontSizePx: label ? Number.parseFloat(getComputedStyle(label).fontSize) : null,
          scrollWidth: label?.scrollWidth ?? null,
          clientWidth: label?.clientWidth ?? null,
          scrollHeight: label?.scrollHeight ?? null,
          clientHeight: label?.clientHeight ?? null,
        },
        position: {
          left: counterRect?.left ?? null,
          right: counterRect?.right ?? null,
          text: counter?.textContent?.trim() ?? null,
          scrollWidth: counter?.scrollWidth ?? null,
          clientWidth: counter?.clientWidth ?? null,
        },
      };
    });
    assert(
      layout.toolbar.left >= -1 && layout.toolbar.right <= layout.viewportWidth + 1,
      '200% toolbar is clipped by the viewport'
    );
    assert(
      layout.toolbar.scrollWidth <= layout.toolbar.clientWidth + 1,
      '200% toolbar content overflows horizontally'
    );
    for (const target of [layout.fitLabel, layout.position]) {
      assert(
        target.left !== null &&
          target.left >= -1 &&
          target.right !== null &&
          target.right <= layout.viewportWidth + 1,
        '200% fit or position label is clipped'
      );
    }
    assert(
      layout.fitLabel.height !== null &&
        layout.fitLabel.fontSizePx !== null &&
        layout.fitLabel.scrollWidth !== null &&
        layout.fitLabel.clientWidth !== null &&
        layout.fitLabel.scrollHeight !== null &&
        layout.fitLabel.clientHeight !== null &&
        layout.position.scrollWidth !== null &&
        layout.position.clientWidth !== null,
      'Spanish toolbar measurements are incomplete'
    );
    assert(layout.fitLabel.height > 0, 'Spanish effective fit label is not displayed');
    assert(layout.fitLabel.fontSizePx >= 12, 'Spanish effective fit label is too small');
    assert(
      layout.fitLabel.scrollWidth <= layout.fitLabel.clientWidth + 1 &&
        layout.fitLabel.scrollHeight <= layout.fitLabel.clientHeight + 1,
      'Spanish effective fit label is clipped within its control'
    );
    assert(
      layout.position.scrollWidth <= layout.position.clientWidth + 1,
      'Spanish displayed position is clipped within its control'
    );
    assert(layout.viewportWidth <= 700, '200% browser zoom did not produce a narrow CSS viewport');
    await page.screenshot({ path: join(output, 'installed-zoom-200-spanish-gallery.png') });

    const essential = new Set([
      'Anterior',
      'Siguiente',
      'Ajustar ventana',
      'Descargar',
      bulkLabel,
      'Cerrar',
    ]);
    const reached = new Set();
    await gallery.locator('[data-gallery-element="item"][data-index="1"] button').focus();
    for (let step = 0; step < 40 && reached.size < essential.size; step += 1) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const element = document.activeElement;
        const rect = element?.getBoundingClientRect();
        return {
          label: element?.getAttribute('aria-label') ?? null,
          left: rect?.left ?? null,
          right: rect?.right ?? null,
          visibility: element ? getComputedStyle(element).visibility : null,
        };
      });
      if (!focused.label || !essential.has(focused.label)) {
        continue;
      }
      assert(
        focused.left !== null &&
          focused.right !== null &&
          focused.left >= -1 &&
          focused.right <= layout.viewportWidth + 1,
        `200% keyboard control ${focused.label} is clipped`
      );
      assert.equal(
        focused.visibility,
        'visible',
        `200% keyboard control ${focused.label} is hidden`
      );
      reached.add(focused.label);
    }
    assert.deepEqual(
      [...reached].sort(),
      [...essential].sort(),
      'Keyboard cannot reach every essential Spanish toolbar action'
    );

    const knownDownloadIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    const nativeMark = nativeLoopback.mark();
    const fetchMark = pageFetches.length;
    await toolbar.locator('button[aria-label="Descargar"]').click();
    const selectedDownload = await waitForValue(
      async () => {
        const created = (await queryDownloads(extensionPage)).filter(
          ({ id }) => !knownDownloadIds.has(id)
        );
        assert(created.length <= 1, 'Zoom current-item action created multiple downloads');
        if (created[0]?.state === 'interrupted') {
          throw new Error(`Zoom current-item download interrupted: ${created[0].error}`);
        }
        return created[0]?.state === 'complete' ? created[0] : undefined;
      },
      '200% selected-item download',
      20_000
    );
    const relativeDownload = relative(downloads, selectedDownload.filename);
    assert(
      relativeDownload && !relativeDownload.startsWith('..') && !isAbsolute(relativeDownload),
      'Zoom current-item download escaped the task-owned directory'
    );
    assert(
      basename(selectedDownload.filename).startsWith(`testuser_${TWEET_ID}_1`),
      'Zoom current-item filename does not identify the displayed second item'
    );
    const selectedBytes = await readFile(selectedDownload.filename);
    assert(
      images[1].equals(selectedBytes),
      'Zoom current-item download bytes do not match the displayed second item'
    );
    const native = await assertNativeSingle({
      extensionPage,
      knownIds: knownDownloadIds,
      download: selectedDownload,
      expectedUrl: expectedOriginalImageUrl(selectedSource),
      expectedBytes: images[1],
      nativeLoopback,
      nativeMark,
      pageFetches: pageFetches.slice(fetchMark),
    });
    await copyFile(selectedDownload.filename, join(output, 'zoom-200-selected-download.jpg'));

    await settingsButton.click();
    await gallery.locator('#settings-language-select').selectOption(priorLanguage);
    await page.waitForFunction(
      () =>
        document.querySelector('[data-gallery-element="toolbar"] button[aria-label="Close"]') !==
        null
    );
    await settingsButton.click();
    await toolbar.locator('button[aria-label="Close"]').click();
    await gallery.waitFor({ state: 'detached' });
    const after = await hostSnapshot(page, 0);
    assert.deepEqual(
      after.background,
      before.background,
      '200% close did not restore host isolation'
    );
    assert.deepEqual(after.bodyStyle, before.bodyStyle, '200% close did not restore body styles');
    assert.equal(after.scrollRestoration, before.scrollRestoration);
    assert.equal(after.scrollY, before.scrollY, '200% close did not restore host scroll');
    assert.equal(
      after.activeElementAlt,
      before.triggerAlt,
      '200% close did not restore trigger focus'
    );
    await page.screenshot({ path: join(output, 'installed-zoom-200-spanish-after.png') });
    return {
      status: 'passed',
      actualBrowserZoom: changedZoom.observed,
      baseline,
      layout,
      priorZoom,
      keyboardReachable: [...reached].sort(),
      shownCount: 3,
      selectedIndex: 1,
      selectedSourceMarker: 'GkE5678',
      download: {
        bytes: selectedBytes.length,
        file: 'zoom-200-selected-download.jpg',
        filename: basename(selectedDownload.filename),
        sha256: createHash('sha256').update(selectedBytes).digest('hex'),
        native,
      },
      hostRestored: true,
      language: 'es',
    };
  } finally {
    if (zoomAttempted) {
      const restored = await fixtureTabZoom(
        context,
        extensionId,
        page,
        priorZoom.previous,
        priorZoom.settings
      );
      assert.equal(restored.observed, priorZoom.previous, 'Fixture browser zoom was not restored');
      assert.equal(restored.observedSettings.mode, priorZoom.settings.mode);
      assert.equal(restored.observedSettings.scope, priorZoom.settings.scope);
    }
  }
}

async function hostSnapshot(page: Page, triggerIndex: number) {
  return page.evaluate((index) => {
    const trigger = document.querySelectorAll('[data-testid="tweetPhoto"] img')[index];
    const style = document.body.style;
    return {
      activeElementAlt: document.activeElement?.getAttribute('alt') ?? null,
      background: ['#host-layout-spacer', 'main'].map((selector) => {
        const element = document.querySelector(selector);
        return {
          ariaHidden: element?.getAttribute('aria-hidden') ?? null,
          hiddenMarker: element?.hasAttribute('data-xeg-gallery-hidden') ?? false,
          inert: element?.hasAttribute('inert') ?? false,
          selector,
        };
      }),
      bodyStyle: {
        left: style.left,
        overflow: style.overflow,
        position: style.position,
        right: style.right,
        top: style.top,
      },
      scrollRestoration: window.history.scrollRestoration,
      scrollY: window.scrollY,
      triggerAlt: trigger?.getAttribute('alt') ?? null,
    };
  }, triggerIndex);
}

function isExpectedFixtureApiConsoleError(record: ConsoleErrorRecord) {
  try {
    return (
      new URL(record.location).pathname.endsWith('/TweetResultByRestId') &&
      /\b403\b/u.test(record.text)
    );
  } catch {
    return false;
  }
}

function isExpectedMemoryFixtureConsoleError(
  record: ConsoleErrorRecord,
  memory: { status: string; rejection?: { declaredBytes: number; pathname: string } } | undefined
) {
  if (memory?.status !== 'passed' || !memory.rejection?.declaredBytes) {
    return false;
  }
  const declared = String(memory.rejection.declaredBytes);
  if (
    record.text.startsWith('[XEG] Download failed ') &&
    record.text.includes(`Response requires ${declared} bytes (limit `)
  ) {
    return true;
  }
  try {
    return (
      new URL(record.location).pathname === memory.rejection.pathname &&
      /net::ERR_(?:ABORTED|CONTENT_LENGTH_MISMATCH)/u.test(record.text)
    );
  } catch {
    return false;
  }
}

async function runDownloadMemoryCycle({
  consoleErrors,
  downloads,
  extensionPage,
  images,
  output,
  page,
  root,
  evidence,
  nativeLoopback,
  pageFetches,
  uiProbe = false,
  preSaveRetryProbe = false,
}: {
  consoleErrors: ConsoleErrorRecord[];
  downloads: string;
  extensionPage: Page;
  images: ImageFixtures;
  output: string;
  page: Page;
  root: string;
  evidence: MemoryEvidence;
  nativeLoopback: NativeLoopback;
  pageFetches: PageFetch[];
  uiProbe?: boolean;
  preSaveRetryProbe?: boolean;
}) {
  Object.assign(evidence, { status: 'pending', cleanup: {}, requests: [], downloads: [] });
  const primaryMarker = IMAGE_URL_MARKERS[0];
  assert(primaryMarker, 'Primary memory fixture marker is missing');
  const routePattern = 'https://pbs.twimg.com/**';
  let routeInstalled = false;
  let phase = 'declared-large';
  let primaryError: unknown;
  let primarySeen = false;
  let cleanupError: unknown;
  let cleanupSeen = false;
  const deniedBody = 'fixture 503';
  const recordCleanupError = (error: unknown) => {
    cleanupError = cleanupSeen
      ? new AggregateError([cleanupError, error], 'Memory cleanup failed in multiple steps')
      : error;
    cleanupSeen = true;
  };
  let galleryHandle: Awaited<ReturnType<Locator['elementHandle']>> | undefined;
  let initialDownloadIds: Set<number> | undefined;
  const verifiedDownloads = new Map<
    number,
    {
      filename: string;
      identity: Awaited<ReturnType<typeof readExactDownloadFile>>['identity'];
      sha256: string;
      removedEarlier?: boolean;
      fileAbsence?: Awaited<ReturnType<typeof waitForRemovedDownloadFile>>;
    }
  >();
  let navigations = 0;
  const onNavigated = (frame: ReturnType<Page['mainFrame']>) => {
    if (frame === page.mainFrame()) {
      navigations += 1;
    }
  };
  const routeHandler = async (route: Route) => {
    const resourceType = route.request().resourceType();
    if (resourceType !== 'fetch' && resourceType !== 'xhr') {
      await route.fallback();
      return;
    }
    const url = new URL(route.request().url());
    const marker = IMAGE_URL_MARKERS.find((value) => url.pathname.includes(value));
    assert(marker, 'Memory fixture intercepted a download outside the three owned images');
    assert(evidence.requests.length < 8, 'Memory fixture received too many media fetches');
    const body = images[IMAGE_URL_MARKERS.indexOf(marker)];
    assert(body, 'Memory fixture image is missing');
    assert(evidence.policy, 'Memory fixture policy is missing');
    const isHttpRejection =
      preSaveRetryProbe && phase === 'missing-http-503' && marker === primaryMarker;
    const status = isHttpRejection ? 503 : 200;
    const declaredBytes =
      (phase === 'declared-large' || (preSaveRetryProbe && phase === 'missing-resource-limit')) &&
      marker === primaryMarker
        ? evidence.policy.declaredBytes
        : isHttpRejection
          ? Buffer.byteLength(deniedBody)
          : body.length;
    const request: MemoryRequest = {
      phase,
      marker,
      resourceType,
      pathname: url.pathname,
      status,
      declaredBytes,
      actualBodyBytes: isHttpRejection ? Buffer.byteLength(deniedBody) : body.length,
      startedAtMs: performance.now(),
    };
    evidence.requests.push(request);
    await route.fulfill({
      status,
      contentType: 'image/jpeg',
      body: isHttpRejection ? deniedBody : body,
      headers: {
        'Access-Control-Allow-Origin': 'https://x.com',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Length': String(declaredBytes),
      },
    });
    request.fulfilledAtMs = performance.now();
  };

  try {
    assert.equal(page.url(), FIXTURE_URL, 'Memory validation must stay on the owned fixture');
    const policy = await readDownloadLiveLimit(root);
    evidence.policy = {
      ...policy,
      declaredBytes: policy.limitBytes + 1,
      maximumPossibleAdmittedBytes: Math.floor(policy.limitBytes / 2),
      admission:
        'ZIP provider reserves application-owned response capacity; native single does not',
      memoryMetric: 'Policy admission only; browser heap and RSS are not measured',
    };
    assert(evidence.policy.declaredBytes > evidence.policy.maximumPossibleAdmittedBytes);
    assert(
      images[0].length > 0 && images[0].length <= 1024 * 1024,
      'Oversized-header fixture body must stay within one MiB'
    );
    evidence.policy.maximumFixtureBodyBytes = 1024 * 1024;
    evidence.document = {
      url: page.url(),
      timeOrigin: await page.evaluate(() => performance.timeOrigin),
    };
    const before = await hostSnapshot(page, 0);
    const knownBeforeFailure = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    initialDownloadIds = knownBeforeFailure;
    const consoleStart = consoleErrors.length;
    page.on('framenavigated', onNavigated);
    await page.route(routePattern, routeHandler);
    routeInstalled = true;

    await page.locator('[data-testid="tweetPhoto"] img').first().click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: 15_000 });
    galleryHandle = await gallery.elementHandle();
    assert(galleryHandle, 'Memory cycle requires one actual gallery element');
    const toolbar = gallery.locator('[data-gallery-element="toolbar"]');
    const currentButton = toolbar.locator('button[aria-label="Download"]');
    const bulkButton = toolbar.locator('button[aria-label="Download 3 shown files as ZIP"]');
    const startedAtMs = performance.now();
    const oversizedResponse = page.waitForResponse(
      (response) =>
        response.url().includes(primaryMarker) &&
        ['fetch', 'xhr'].includes(response.request().resourceType()),
      { timeout: 15_000 }
    );
    await bulkButton.click();
    const rejectedResponse = await oversizedResponse;
    const observedLength = await rejectedResponse.headerValue('content-length');
    assert.equal(
      observedLength,
      String(evidence.policy.declaredBytes),
      'Browser did not observe the declared oversized Content-Length'
    );
    const errorText = await assertVisibleBulkOutcome(page, {
      included: 2,
      omitted: 1,
      handedOff: true,
      reason: 'Download memory limit reached',
    });
    assert(
      errorText.length > 0 && errorText.length <= 1_500,
      'Rejection must show a bounded, understandable error'
    );
    const partialName = `testuser_${TWEET_ID}.zip`;
    const partial = await waitForDownload(extensionPage, knownBeforeFailure, partialName);
    assert.deepEqual(
      (await queryDownloads(extensionPage))
        .filter(({ id }) => !knownBeforeFailure.has(id))
        .map(({ id }) => id),
      [partial.id],
      'Partial ZIP must create exactly one native browser download'
    );
    assert.equal(dirname(resolve(partial.filename)), resolve(downloads));
    const partialEntries = images.slice(1).map((bytes, index) => ({
      filename: expectedFilename(index + 1),
      bytes,
    }));
    const { bytes: partialBytes, identity: partialIdentity } = await readExactDownloadFile(
      partial.filename,
      expectedStoredZipBytes(partialEntries)
    );
    const partialVerified = verifyStoredZip(partialBytes, partialEntries);
    await writeFile(join(output, 'installed-memory-partial.zip'), partialBytes);
    const partialHash = createHash('sha256').update(partialBytes).digest('hex');
    verifiedDownloads.set(partial.id, {
      filename: partial.filename,
      identity: partialIdentity,
      sha256: partialHash,
    });
    await extensionPage.evaluate(
      async ({ id, filename }) => {
        const [download] = await chrome.downloads.search({ id });
        if (download?.state !== 'complete' || download.filename !== filename) {
          throw new Error('Verified partial ZIP changed before native file cleanup');
        }
        await chrome.downloads.removeFile(id);
      },
      { id: partial.id, filename: partial.filename }
    );
    const partialAbsence = await waitForRemovedDownloadFile(partial.filename, partialIdentity);
    const verifiedPartial = verifiedDownloads.get(partial.id);
    assert(verifiedPartial, 'Verified partial download record is missing');
    Object.assign(verifiedPartial, {
      removedEarlier: true,
      fileAbsence: partialAbsence,
    });
    evidence.downloads.push({
      kind: 'resource-limit-partial-zip',
      id: partial.id,
      filename: partialName,
      file: 'installed-memory-partial.zip',
      bytes: partialBytes.length,
      sha256: partialHash,
      verified: partialVerified,
      included: 2,
      omitted: 1,
      nativeFileRemoved: true,
      fileAbsence: partialAbsence,
    });
    if (uiProbe) {
      await page.waitForTimeout(5_250);
      await bulkButton.focus();
      await assertVisibleBulkOutcome(page, {
        included: 2,
        omitted: 1,
        handedOff: true,
        reason: 'Download memory limit reached',
      });
      evidence.uiPartialAfterFiveSeconds = await captureRecoveryUi(
        page,
        output,
        'memory-partial-after-five-seconds'
      );
    }
    evidence.rejection = {
      declaredBytes: evidence.policy.declaredBytes,
      actualBodyBytes: images[0].length,
      observedContentLength: observedLength,
      pathname: new URL(rejectedResponse.url()).pathname,
      errorText,
      elapsedMs: performance.now() - startedAtMs,
      nativeDownloadsCreated: 1,
      acceptedEntries: 2,
      rejectedEntries: 1,
      partialDownloadId: partial.id,
    };
    await page.screenshot({ path: join(output, 'installed-memory-rejection.png') });
    evidence.rejection.screenshot = 'installed-memory-rejection.png';
    const rejection = evidence.rejection;
    assert(rejection, 'Memory rejection receipt is missing');
    await delay(100);
    evidence.expectedConsoleErrors = consoleErrors.slice(consoleStart).filter((record) =>
      isExpectedMemoryFixtureConsoleError(record, {
        status: 'passed',
        rejection,
      })
    );
    assert(
      evidence.expectedConsoleErrors.length <= 2,
      'Oversized fixture generated unexpected repeated console errors'
    );
    const recoverButton = gallery.getByRole('button', {
      name: 'Download 1 missing items as a separate ZIP',
    });
    await recoverButton.waitFor({ state: 'visible' });
    const knownBeforeMissing = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    if (preSaveRetryProbe) {
      evidence.preSaveRetries = [];
      for (const [attempt, cause, expectedStatus] of [
        [1, 'http-503', 503],
        [2, 'resource-limit', 200],
      ] as const) {
        phase = cause === 'http-503' ? 'missing-http-503' : 'missing-resource-limit';
        const responsePromise = page.waitForResponse(
          (response) =>
            response.url().includes(primaryMarker) &&
            ['fetch', 'xhr'].includes(response.request().resourceType()),
          { timeout: 15_000 }
        );
        await recoverButton.click();
        const response = await responsePromise;
        assert.equal(response.status(), expectedStatus, 'Owned recovery response status changed');
        const contentLength = await response.headerValue('content-length');
        assert.equal(
          contentLength,
          String(
            cause === 'resource-limit'
              ? evidence.policy.declaredBytes
              : Buffer.byteLength(deniedBody)
          ),
          'Owned recovery response length changed'
        );
        const visibleOutcome = await waitForValue(
          async () => {
            if (!(await recoverButton.isEnabled())) {
              return undefined;
            }
            const panel = gallery.locator('[data-gallery-element="bulk-download-outcome"]');
            const panelText = await panel.textContent();
            return panelText?.includes('No ZIP was handed off to the browser.')
              ? panelText
              : undefined;
          },
          `pre-save ${cause} recovery action`,
          15_000
        );
        const expectedReason =
          cause === 'http-503'
            ? 'A media source request failed (HTTP 503)'
            : 'Download memory limit reached';
        assert(visibleOutcome.includes(expectedReason), 'Pre-save recovery cause changed');
        await assertVisibleBulkOutcome(page, {
          included: 0,
          omitted: 1,
          handedOff: false,
          reason: expectedReason,
          supplementary: true,
        });
        const newNativeDownloadIds = (await queryDownloads(extensionPage))
          .filter(({ id }) => !knownBeforeMissing.has(id))
          .map(({ id }) => id);
        assert.deepEqual(newNativeDownloadIds, [], 'Pre-save failure started a native save');
        const requests = evidence.requests
          .filter(({ phase: requestPhase }) => requestPhase === phase)
          .map(({ marker }) => marker);
        assert.deepEqual(requests, [primaryMarker], 'Retry fetched a successful original');
        evidence.preSaveRetries.push({
          attempt,
          cause,
          observedResponseStatus: response.status(),
          observedContentLength: contentLength,
          requests,
          newNativeDownloadIds,
          visibleOutcome,
          recoveryActionEnabled: await recoverButton.isEnabled(),
        });
      }
      const expectedHttpErrors = consoleErrors.slice(consoleStart).filter((record) => {
        try {
          return (
            new URL(record.location).pathname === rejection.pathname && /503/u.test(record.text)
          );
        } catch {
          return false;
        }
      });
      assert(
        expectedHttpErrors.length <= 2,
        'HTTP 503 fixture generated unexpected repeated console errors'
      );
      evidence.expectedConsoleErrors?.push(...expectedHttpErrors);
      const expectedLimitErrors = consoleErrors
        .slice(consoleStart)
        .filter((record) =>
          isExpectedMemoryFixtureConsoleError(record, { status: 'passed', rejection })
        );
      assert(
        expectedLimitErrors.length <= 4,
        'Repeated oversized fixture generated unexpected repeated console errors'
      );
      for (const record of expectedLimitErrors) {
        if (!evidence.expectedConsoleErrors?.includes(record)) {
          evidence.expectedConsoleErrors?.push(record);
        }
      }
    }
    phase = 'missing-zip';
    const missingName = `testuser_${TWEET_ID}-missing${preSaveRetryProbe ? '-3' : ''}.zip`;
    const missingStartedAtMs = performance.now();
    await recoverButton.click();
    const missing = await waitForDownload(extensionPage, knownBeforeMissing, missingName);
    assert.notEqual(missing.id, partial.id, 'Missing ZIP must have its own native download ID');
    assert.equal(
      dirname(resolve(missing.filename)),
      resolve(downloads),
      'Missing ZIP escaped the task-owned download directory'
    );
    assert.deepEqual(
      (await queryDownloads(extensionPage))
        .filter(({ id }) => !knownBeforeMissing.has(id))
        .map(({ id }) => id),
      [missing.id],
      'Failed-only recovery must create exactly one native browser download'
    );
    const missingEntries = [{ filename: expectedFilename(0), bytes: images[0] }];
    const { bytes: missingBytes, identity: missingIdentity } = await readExactDownloadFile(
      missing.filename,
      expectedStoredZipBytes(missingEntries)
    );
    const missingVerified = verifyStoredZip(missingBytes, missingEntries);
    const missingHash = createHash('sha256').update(missingBytes).digest('hex');
    await writeFile(join(output, 'installed-memory-missing.zip'), missingBytes);
    verifiedDownloads.set(missing.id, {
      filename: missing.filename,
      identity: missingIdentity,
      sha256: missingHash,
    });
    evidence.downloads.push({
      kind: 'failed-only-zip',
      id: missing.id,
      filename: missingName,
      file: 'installed-memory-missing.zip',
      bytes: missingBytes.length,
      sha256: missingHash,
      elapsedMs: performance.now() - missingStartedAtMs,
      verified: missingVerified,
    });
    await gallery
      .getByText('Scope: 1 previously missing items from this gallery.')
      .waitFor({ state: 'visible' });
    await assertVisibleBulkOutcome(page, {
      included: 1,
      omitted: 0,
      handedOff: true,
      supplementary: true,
    });
    await recoverButton.waitFor({ state: 'detached' });
    const missingRequests = evidence.requests
      .filter(({ phase: requestPhase }) => requestPhase === 'missing-zip')
      .map(({ marker }) => marker);
    assert.deepEqual(
      missingRequests,
      [primaryMarker],
      'Failed-only recovery must fetch only the original omitted image'
    );
    await page.screenshot({ path: join(output, 'installed-memory-missing.png') });
    evidence.missingScreenshot = 'installed-memory-missing.png';
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-xeg-gallery-container] #xeg-toolbar-counter')
          ?.getAttribute('data-position') === '2'
    );
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-xeg-gallery-container] #xeg-toolbar-counter')
          ?.getAttribute('data-position') === '1'
    );
    // The production toolbar deliberately keeps the busy state briefly to
    // avoid flicker. Wait for its actual recovery instead of resetting state.
    await waitForValue(
      async () => ((await currentButton.isEnabled()) ? true : undefined),
      'download control recovery after rejection',
      5_000
    );

    phase = 'small-single';
    const knownBeforeSingle = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    const nativeMark = nativeLoopback.mark();
    const fetchMark = pageFetches.length;
    const singleStartedAtMs = performance.now();
    await currentButton.click();
    const single = await waitForDownload(extensionPage, knownBeforeSingle, expectedFilename(0));
    const singlePath = relative(downloads, single.filename);
    assert(
      singlePath && !singlePath.startsWith('..') && !isAbsolute(singlePath),
      'Recovered single download escaped the owned directory'
    );
    const { bytes: singleBytes, identity: singleIdentity } = await readExactDownloadFile(
      single.filename,
      images[0].length
    );
    assert(singleBytes.equals(images[0]), 'Recovered single download bytes differ');
    assert.deepEqual(
      (await queryDownloads(extensionPage))
        .filter(({ id }) => !knownBeforeSingle.has(id))
        .map(({ id }) => id),
      [single.id],
      'Recovered single action must create exactly one native download ID'
    );
    const native = await assertNativeSingle({
      extensionPage,
      knownIds: knownBeforeSingle,
      download: single,
      expectedUrl: `https://pbs.twimg.com/media/${QUALITY_IMAGE_PATHS[0]}?format=jpg&name=orig`,
      expectedBytes: images[0],
      nativeLoopback,
      nativeMark,
      pageFetches: pageFetches.slice(fetchMark),
    });
    await writeFile(join(output, 'installed-memory-single.jpg'), singleBytes);
    verifiedDownloads.set(single.id, {
      filename: single.filename,
      identity: singleIdentity,
      sha256: createHash('sha256').update(singleBytes).digest('hex'),
    });
    evidence.downloads.push({
      kind: 'single',
      id: single.id,
      filename: basename(single.filename),
      bytes: singleBytes.length,
      sha256: createHash('sha256').update(singleBytes).digest('hex'),
      elapsedMs: performance.now() - singleStartedAtMs,
      native,
    });

    phase = 'small-zip';
    const knownBeforeZip = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    const zipFilename = `testuser_${TWEET_ID}.zip`;
    const zipStartedAtMs = performance.now();
    await bulkButton.click();
    const zip = await waitForDownload(extensionPage, knownBeforeZip, zipFilename);
    assert.notEqual(zip.id, single.id, 'ZIP and single actions must have distinct native IDs');
    const zipPath = relative(downloads, zip.filename);
    assert(
      zipPath && !zipPath.startsWith('..') && !isAbsolute(zipPath),
      'Recovered ZIP escaped the owned directory'
    );
    const expectedEntries = images.map((bytes, index) => ({
      filename: expectedFilename(index),
      bytes,
    }));
    const expectedZipBytes = expectedStoredZipBytes(expectedEntries);
    const { bytes: zipBytes, identity: zipIdentity } = await readExactDownloadFile(
      zip.filename,
      expectedZipBytes
    );
    const parsedZip = verifyStoredZip(zipBytes, expectedEntries);
    assert.deepEqual(
      (await queryDownloads(extensionPage))
        .filter(({ id }) => !knownBeforeZip.has(id))
        .map(({ id }) => id),
      [zip.id],
      'Recovered ZIP action must create exactly one native download ID'
    );
    await writeFile(join(output, 'installed-memory-bulk.zip'), zipBytes);
    verifiedDownloads.set(zip.id, {
      filename: zip.filename,
      identity: zipIdentity,
      sha256: createHash('sha256').update(zipBytes).digest('hex'),
    });
    evidence.downloads.push({
      kind: 'zip',
      id: zip.id,
      filename: basename(zip.filename),
      bytes: zipBytes.length,
      sha256: createHash('sha256').update(zipBytes).digest('hex'),
      elapsedMs: performance.now() - zipStartedAtMs,
      verified: parsedZip,
    });
    if (uiProbe) {
      await bulkButton.focus();
      await assertVisibleBulkOutcome(page, { included: 3, omitted: 0, handedOff: true });
      evidence.uiHealthy = await captureRecoveryUi(page, output, 'memory-healthy');
    }
    assert.deepEqual(
      evidence.requests
        .filter(({ phase: requestPhase }) => requestPhase === 'declared-large')
        .map(({ marker }) => marker)
        .sort(),
      [...IMAGE_URL_MARKERS].sort(),
      'Partial ZIP must request all three exact fixture images'
    );
    assert.deepEqual(
      evidence.requests
        .filter(({ phase: requestPhase }) => requestPhase === 'small-single')
        .map(({ marker }) => marker),
      [],
      'Native single recovery must not use application fetch'
    );
    // The recovered and partial-ZIP entries remain in the page's media cache.
    // The full ZIP should reuse all three, with saved bytes checked above.
    const recoveryRequests = evidence.requests
      .filter(({ phase: requestPhase }) => requestPhase === 'small-zip')
      .map(({ marker }) => marker);
    assert.deepEqual(
      recoveryRequests,
      [],
      'Full ZIP must reuse all three previously recovered or successful images'
    );
    evidence.recoveryTransport = {
      missingMediaRequests: missingRequests,
      fullZipFreshMediaRequests: recoveryRequests,
      reusedEntries: [...partialVerified.entryOrder, ...missingVerified.entryOrder],
      missingEntries: missingVerified.entryOrder,
      savedEntries: parsedZip.entryOrder,
      verification: 'Exact ZIP bytes and CRCs; supplementary ZIP fetches only the omitted entry',
    };
    assert(
      await gallery.evaluate((node, original) => node === original, galleryHandle),
      'Memory recovery replaced the gallery app element'
    );
    await page.screenshot({ path: join(output, 'installed-memory-recovery.png') });
    evidence.recoveryScreenshot = 'installed-memory-recovery.png';
    await gallery.getByRole('button', { name: 'Dismiss ZIP result' }).click();
    await gallery
      .locator('[data-gallery-element="bulk-download-outcome"]')
      .waitFor({ state: 'detached' });
    assert.equal(await recoverButton.count(), 0, 'Dismiss restored a spent recovery action');
    await toolbar.locator('button[aria-label="Close"]').click();
    await gallery.waitFor({ state: 'detached' });
    const after = await hostSnapshot(page, 0);
    assert.deepEqual(
      after.background,
      before.background,
      'Memory cycle did not restore host isolation'
    );
    assert.deepEqual(after.bodyStyle, before.bodyStyle, 'Memory cycle did not restore body style');
    assert.equal(navigations, 0, 'Memory cycle navigated the fixture document');
    assert.equal(page.url(), evidence.document.url, 'Memory cycle changed the fixture URL');
    assert.equal(
      await page.evaluate(() => performance.timeOrigin),
      evidence.document.timeOrigin,
      'Memory cycle changed document time origin'
    );
    await page.locator('[data-testid="tweetPhoto"] img').first().click();
    await gallery.waitFor({ state: 'visible', timeout: 15_000 });
    assert.equal(
      await gallery.locator('[data-gallery-element="bulk-download-outcome"]').count(),
      0,
      'A new gallery session inherited the previous ZIP result'
    );
    assert.equal(await recoverButton.count(), 0, 'A new gallery session inherited recovery work');
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
    await gallery.waitFor({ state: 'detached' });
    assert.deepEqual(
      await hostSnapshot(page, 0),
      after,
      'Reopened memory gallery did not restore host state'
    );
    evidence.status = 'passed';
  } catch (error) {
    primarySeen = true;
    primaryError = error;
    evidence.status = 'failed';
    evidence.error = safeError(error);
    await page
      .screenshot({ path: join(output, 'installed-memory-failure.png') })
      .then(() => {
        evidence.failureScreenshot = 'installed-memory-failure.png';
      })
      .catch((screenshotError) => {
        evidence.screenshotError = safeError(screenshotError);
      });
  } finally {
    page.off('framenavigated', onNavigated);
    if (galleryHandle) {
      try {
        await galleryHandle.dispose();
      } catch (error) {
        recordCleanupError(error);
        evidence.cleanup.galleryHandleError = safeError(error);
      }
    }
    if (routeInstalled) {
      try {
        await page.unroute(routePattern, routeHandler);
        evidence.cleanup.exactPageRouteRemoved = true;
      } catch (error) {
        recordCleanupError(error);
        evidence.cleanup.routeError = safeError(error);
      }
    }
    if (initialDownloadIds) {
      const knownDownloadIds = initialDownloadIds;
      try {
        const observed = (await queryDownloads(extensionPage)).filter(
          ({ id }) => !knownDownloadIds.has(id)
        );
        const allowedNames = new Set([
          expectedFilename(0),
          `testuser_${TWEET_ID}.zip`,
          `testuser_${TWEET_ID}-missing${preSaveRetryProbe ? '-3' : ''}.zip`,
        ]);
        assert(
          observed.every(
            ({ filename }) =>
              dirname(resolve(filename)) === resolve(downloads) &&
              allowedNames.has(basename(filename))
          ),
          'Memory cleanup found a new download outside its exact owned filenames'
        );
        if (!primarySeen) {
          assert.deepEqual(
            new Set(observed.map(({ id }) => id)),
            new Set(verifiedDownloads.keys()),
            'Memory cleanup download IDs differ'
          );
        }
        evidence.cleanup.downloads = [];
        for (const item of observed) {
          const verified = verifiedDownloads.get(item.id);
          const cleanupRecord: NonNullable<MemoryEvidence['cleanup']['downloads']>[number] = {
            id: item.id,
            filename: basename(item.filename),
            verifiedFileRemoved: false,
          };
          evidence.cleanup.downloads.push(cleanupRecord);
          if (verified && !verified.removedEarlier) {
            assert.equal(
              item.filename,
              verified.filename,
              'Verified memory download filename changed before cleanup'
            );
            const { bytes, identity } = await readExactDownloadFile(
              item.filename,
              verified.identity.size
            );
            assert.deepEqual(
              identity,
              verified.identity,
              'Verified memory download file identity changed before cleanup'
            );
            const hash = createHash('sha256').update(bytes).digest('hex');
            assert.equal(
              hash,
              verified.sha256,
              'Verified memory download bytes changed before cleanup'
            );
          }
          const removal = await extensionPage.evaluate(
            async ({ id, filename, removeFile }) => {
              let [download] = await chrome.downloads.search({ id });
              if (download?.filename !== filename) {
                throw new Error(`Memory download ${id} changed before cleanup`);
              }
              if (download?.state === 'in_progress') {
                await chrome.downloads.cancel(id);
                const deadline = Date.now() + 10_000;
                while (Date.now() < deadline) {
                  [download] = await chrome.downloads.search({ id });
                  if (download?.state !== 'in_progress') {
                    break;
                  }
                  await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
                }
              }
              if (download?.state === 'in_progress') {
                throw new Error(`Memory download ${id} did not stop`);
              }
              if (removeFile) {
                if (download?.state !== 'complete') {
                  throw new Error(`Verified memory download ${id} is not complete`);
                }
                await chrome.downloads.removeFile(id);
              }
              return { terminalState: download?.state ?? null, nativeRemoveFileCalled: removeFile };
            },
            {
              id: item.id,
              filename: item.filename,
              removeFile: Boolean(verified && !verified.removedEarlier),
            }
          );
          Object.assign(cleanupRecord, removal);
          if (verified?.removedEarlier) {
            cleanupRecord.fileRemovedEarlier = true;
          }
          if (verified) {
            cleanupRecord.fileAbsence = verified.removedEarlier
              ? verified.fileAbsence
              : await waitForRemovedDownloadFile(item.filename, verified.identity);
            cleanupRecord.verifiedFileRemoved = true;
          }
          const history = await extensionPage.evaluate(async (id) => {
            const erasedIds = await chrome.downloads.erase({ id });
            const remaining = await chrome.downloads.search({ id });
            if (!erasedIds.includes(id) || remaining.length) {
              throw new Error(`Memory download ${id} remained in browser history`);
            }
            return { erasedIds, historyRemoved: true };
          }, item.id);
          Object.assign(cleanupRecord, history);
        }
      } catch (error) {
        recordCleanupError(error);
        evidence.cleanup.downloadError = safeError(error);
      }
    }
  }
  if (cleanupSeen) {
    evidence.status = 'failed';
  }
  if (primarySeen || cleanupSeen) {
    await writeFile(
      join(output, 'installed-memory-failure.json'),
      JSON.stringify(evidence, null, 2)
    ).catch((error) => {
      evidence.failureReceiptError = safeError(error);
    });
  }
  if (primarySeen && cleanupSeen) {
    throw new AggregateError(
      [primaryError, cleanupError],
      'Memory fixture validation and exact route cleanup both failed'
    );
  }
  if (primarySeen) {
    throw primaryError;
  }
  if (cleanupSeen) {
    throw cleanupError;
  }
  return evidence;
}

async function runPublicFixtureCycle({
  apiResponses,
  output,
  page,
}: {
  apiResponses: ApiRecord[];
  output: string;
  page: Page;
}) {
  await page.goto(PUBLIC_FIXTURE_URL);
  await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
    state: 'attached',
    timeout: 15_000,
  });
  const trigger = page
    .locator('article:not([data-testid]) .public-media a[aria-label="View media"]')
    .nth(1);
  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await trigger.focus();
  const before = await trigger.evaluate((element) => {
    const image = element.parentElement?.querySelector('img');
    if (!(image instanceof HTMLImageElement)) {
      throw new Error('Public fixture image missing');
    }
    const rectangle = image.getBoundingClientRect();
    const x = rectangle.left + rectangle.width / 2;
    const y = rectangle.top + rectangle.height / 2;
    const topAction = document
      .elementsFromPoint(x, y)
      .map((candidate) => candidate.closest('a[href]'))
      .find(Boolean);
    const matchingActions = [
      ...(element.closest('article')?.querySelectorAll('a[href]') ?? []),
    ].filter((anchor) => anchor.getAttribute('href') === element.getAttribute('href'));
    const style = document.body.style;
    return {
      active: document.activeElement === element,
      bodyStyle: {
        left: style.left,
        overflow: style.overflow,
        position: style.position,
        right: style.right,
        top: style.top,
      },
      duplicateActionCount: matchingActions.length,
      scrollRestoration: history.scrollRestoration,
      scrollY: window.scrollY,
      topAction: topAction === element,
    };
  });
  assert.equal(before.active, true, 'Public fixture trigger must hold focus before open');
  assert.equal(before.duplicateActionCount, 2, 'Public fixture must retain both same-href actions');
  assert.equal(before.topAction, true, 'View media overlay must be the hit-tested top action');
  assert(before.scrollY > 0, 'Public fixture must begin from a nonzero scroll position');
  await page.screenshot({ path: join(output, 'public-dom-before.png') });

  const apiCountBefore = apiResponses.length;
  await trigger.click();
  const gallery = page.locator('[data-xeg-gallery-container]');
  await gallery.waitFor({ state: 'visible', timeout: 15_000 });
  assert.equal(await gallery.getAttribute('role'), 'dialog');
  assert.equal(await gallery.getAttribute('aria-modal'), 'true');
  assert.equal(
    await gallery.locator('#xeg-toolbar-counter').getAttribute('data-position'),
    '2',
    'Public View media overlay must select the second image'
  );
  await page.waitForFunction(
    () =>
      [
        ...document.querySelectorAll(
          '[data-xeg-gallery-container] [data-gallery-element="item"] img'
        ),
      ].some(
        (image) =>
          image instanceof HTMLImageElement &&
          image.src.includes('GkE5678') &&
          image.complete &&
          image.naturalWidth > 1
      ),
    undefined,
    { timeout: 15_000 }
  );
  const galleryImageCount = await gallery.locator('[data-gallery-element="item"] img').count();
  assert.equal(galleryImageCount, 2, 'Public fixture gallery must exclude the account avatar');
  assert.equal(
    apiResponses.length,
    apiCountBefore + 1,
    'Public fixture must request TweetResultByRestId once'
  );
  assert.equal(apiResponses.at(-1)?.status, 403, 'Public fixture API route must return 403');
  await page.screenshot({ path: join(output, 'public-dom-gallery.png') });

  await page.keyboard.press('Escape');
  await gallery.waitFor({ state: 'detached', timeout: 15_000 });
  const after = await trigger.evaluate((element) => {
    const style = document.body.style;
    return {
      active: document.activeElement === element,
      bodyStyle: {
        left: style.left,
        overflow: style.overflow,
        position: style.position,
        right: style.right,
        top: style.top,
      },
      scrollRestoration: history.scrollRestoration,
      scrollY: window.scrollY,
    };
  });
  assert.equal(after.active, true, 'Public fixture close must restore exact trigger focus');
  assert.equal(after.scrollY, before.scrollY, 'Public fixture close must restore scroll');
  assert.equal(after.scrollRestoration, before.scrollRestoration);
  assert.deepEqual(
    after.bodyStyle,
    before.bodyStyle,
    'Public fixture close must restore body styles'
  );
  await page.screenshot({ path: join(output, 'public-dom-after.png') });

  return {
    api: apiResponses.slice(apiCountBefore),
    clickedIndex: 1,
    duplicateActionCount: before.duplicateActionCount,
    focusRestored: after.active,
    galleryImageCount,
    loadedSelectedImage: true,
    scroll: {
      before: before.scrollY,
      after: after.scrollY,
      restored: after.scrollY === before.scrollY,
    },
    topActionHitTested: before.topAction,
  };
}

type CompactEvidence = {
  status: string;
  api: ApiRecord[];
  images: QualityRequest[];
  steps: Record<string, unknown>[];
  error?: string;
  failureScreenshot?: string;
  screenshotError?: string;
};

async function compactHostSnapshot(page: Page, selector: string) {
  return page.evaluate((target) => {
    const style = document.body.style;
    return {
      active: document.activeElement === document.querySelector(target),
      bodyStyle: {
        left: style.left,
        overflow: style.overflow,
        position: style.position,
        right: style.right,
        top: style.top,
      },
      background: ['#host-layout-spacer', 'main'].map((name) => {
        const element = document.querySelector(name);
        return {
          ariaHidden: element?.getAttribute('aria-hidden') ?? null,
          hiddenMarker: element?.hasAttribute('data-xeg-gallery-hidden') ?? false,
          inert: element?.hasAttribute('inert') ?? false,
        };
      }),
      scrollRestoration: history.scrollRestoration,
      scrollY: window.scrollY,
    };
  }, selector);
}

async function compactPanelText(gallery: Locator, url: string) {
  const origin = await assertQuotedOriginLink(gallery, url);
  await gallery.locator('#tweet-text-button').click();
  const text = await gallery.locator('#toolbar-tweet-panel').textContent();
  await gallery.locator('#tweet-text-button').click();
  return { origin, text };
}

async function compactClose(
  page: Page,
  selector: string,
  before: Awaited<ReturnType<typeof compactHostSnapshot>>,
  method: 'escape' | 'button'
) {
  const gallery = page.locator('[data-xeg-gallery-container]');
  if (method === 'escape') {
    await page.keyboard.press('Escape');
  } else {
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
  }
  await gallery.waitFor({ state: 'detached', timeout: 15_000 });
  const after = await compactHostSnapshot(page, selector);
  assert.deepEqual(
    after,
    before,
    'Compact close must restore focus, scroll, body and host isolation'
  );
  return after;
}

async function runCompactQuotePhotoCycle({
  page,
  extensionPage,
  downloads,
  images,
  compactImages,
  nativeLoopback,
  pageFetches,
  compactApiResponses,
  compactImageRequests,
  evidence,
}: {
  page: Page;
  extensionPage: Page;
  downloads: string;
  images: ImageFixtures;
  compactImages: CompactImages;
  nativeLoopback: NativeLoopback;
  pageFetches: PageFetch[];
  compactApiResponses: ApiRecord[];
  compactImageRequests: QualityRequest[];
  evidence: CompactEvidence;
}) {
  const apiStart = compactApiResponses.length;
  const imageStart = compactImageRequests.length;
  const navigate = async (suffix: string) => {
    await page.goto(`${COMPACT_FIXTURE_URL}${suffix}`);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
  };
  const prepare = async (selector: string) => {
    const trigger = page.locator(selector);
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    const before = await compactHostSnapshot(page, selector);
    assert(before.active && before.scrollY > 0, 'Compact trigger must hold focus below the fold');
    const hit = await trigger.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      return {
        top: document.elementFromPoint(x, y) === element,
        tag: element.tagName,
        href: element instanceof HTMLAnchorElement ? element.href : null,
      };
    });
    assert.equal(hit.top, true, 'Ordinary compact pointer must hit the overlay');
    assert.equal(hit.tag, 'A');
    return { trigger, before, hit };
  };
  for (const { selector, method } of [
    { selector: '#c-story-text', method: 'pointer' },
    { selector: '#c-story-link', method: 'pointer' },
    { selector: '#c-story', method: 'padding' },
    { selector: '#c-story-link', method: 'keyboard' },
  ]) {
    await navigate('');
    const target = page.locator(selector);
    await target.scrollIntoViewIfNeeded();
    const point = await target.evaluate((element, kind) => {
      const photo = document.querySelector('#c-photo');
      if (!photo) {
        throw new Error('Compact photo missing');
      }
      const rect = element.getBoundingClientRect();
      const image = photo.getBoundingClientRect();
      const x = kind === 'padding' ? rect.width - 4 : rect.width / 2;
      const y = kind === 'padding' ? rect.height - 4 : rect.height / 2;
      const clientX = rect.left + x;
      const clientY = rect.top + y;
      const hit = document.elementFromPoint(clientX, clientY);
      return {
        x,
        y,
        outsidePhoto:
          clientX < image.left ||
          clientX >= image.right ||
          clientY < image.top ||
          clientY >= image.bottom,
        targetHit: hit === element || element.contains(hit),
      };
    }, method);
    assert(point.outsidePhoto && point.targetHit, 'Native compact click must be outside the photo');
    const nativeApiStart = compactApiResponses.length;
    if (method === 'keyboard') {
      await target.focus();
      await target.press('Enter');
    } else {
      await target.click({ position: { x: point.x, y: point.y } });
    }
    await page.waitForURL(`https://x.com/inner_fixture/status/${COMPACT_INNER_ID}`);
    assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
    assert.equal(
      compactApiResponses.length,
      nativeApiStart,
      'Native quote click must not request media'
    );
    evidence.steps.push({ name: 'c-native-surrounding', selector, method, url: page.url() });
  }
  await navigate('');
  const c = await prepare('#c-overlay');
  assert.equal(c.hit.href, `https://x.com/inner_fixture/status/${COMPACT_INNER_ID}`);
  await c.trigger.click();
  const gallery = page.locator('[data-xeg-gallery-container]');
  await gallery.waitFor({ state: 'visible', timeout: 15_000 });
  const cSelected = await assertQuotedSelection(page, {
    position: 2,
    total: 2,
    type: 'image',
    path: '/media/CompactQuoteSelected',
  });
  assert.equal(cSelected.source, COMPACT_ORIGINAL_URL);
  assert.equal(await gallery.locator('[data-gallery-element="item"]').count(), 2);
  const cPanel = await compactPanelText(
    gallery,
    `https://x.com/inner_fixture/status/${COMPACT_INNER_ID}`
  );
  assert(cPanel.text?.includes('C verified API caption'));
  assert(!cPanel.text?.includes('B parent caption'));
  await page.keyboard.press('ArrowLeft');
  const cFirst = await assertQuotedSelection(page, {
    position: 1,
    total: 2,
    type: 'image',
    path: '/media/GkE1234ABCDEF',
  });
  assert.equal(
    await assertQuotedOriginLink(gallery, `https://x.com/inner_fixture/status/${COMPACT_INNER_ID}`),
    cPanel.origin
  );
  await page.keyboard.press('ArrowRight');
  await assertQuotedSelection(page, {
    position: 2,
    total: 2,
    type: 'image',
    path: '/media/CompactQuoteSelected',
  });
  const cApi = compactApiResponses.slice(apiStart);
  assert.deepEqual(
    cApi.map(({ tweetId, status }) => ({ tweetId, status })),
    [{ tweetId: COMPACT_INNER_ID, status: 200 }]
  );
  evidence.steps.push({
    name: 'c-api',
    selection: cSelected,
    first: cFirst,
    panel: cPanel,
    api: cApi,
  });

  const knownSingle = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const nativeMark = nativeLoopback.mark();
  const fetchMark = pageFetches.length;
  await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
  const singleName = `inner_fixture_${COMPACT_INNER_ID}_1.webp`;
  const single = await waitForDownload(extensionPage, knownSingle, singleName);
  const singlePath = relative(downloads, single.filename);
  assert(singlePath && !singlePath.startsWith('..') && !isAbsolute(singlePath));
  const { bytes: singleBytes } = await readExactDownloadFile(
    single.filename,
    compactImages.original.length
  );
  assert(singleBytes.equals(compactImages.original));
  const native = await assertNativeSingle({
    extensionPage,
    knownIds: knownSingle,
    download: single,
    expectedUrl: COMPACT_ORIGINAL_URL,
    expectedBytes: compactImages.original,
    nativeLoopback,
    nativeMark,
    pageFetches: pageFetches.slice(fetchMark),
  });
  evidence.steps.push({
    name: 'c-single',
    filename: basename(single.filename),
    ...imageReceipt(singleBytes),
    native,
  });

  const knownZip = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  await gallery
    .locator('[data-gallery-element="toolbar"] button[aria-label="Download 2 shown files as ZIP"]')
    .click();
  const zip = await waitForDownload(
    extensionPage,
    knownZip,
    `inner_fixture_${COMPACT_INNER_ID}.zip`
  );
  const zipPath = relative(downloads, zip.filename);
  assert(zipPath && !zipPath.startsWith('..') && !isAbsolute(zipPath));
  assert.deepEqual(
    (await queryDownloads(extensionPage)).filter(({ id }) => !knownZip.has(id)).map(({ id }) => id),
    [zip.id]
  );
  const expectedEntries = [
    { filename: `inner_fixture_${COMPACT_INNER_ID}_0.jpg`, bytes: images[0] },
    { filename: singleName, bytes: compactImages.original },
  ];
  const { bytes: zipBytes } = await readExactDownloadFile(
    zip.filename,
    expectedStoredZipBytes(expectedEntries)
  );
  const verified = verifyStoredZip(zipBytes, expectedEntries);
  evidence.steps.push({
    name: 'c-zip',
    filename: basename(zip.filename),
    ...imageReceipt(zipBytes),
    verified,
  });
  evidence.steps.push({
    name: 'c-close',
    after: await compactClose(page, '#c-overlay', c.before, 'escape'),
  });

  const reopened = await prepare('#c-overlay');
  await reopened.trigger.press('Enter');
  const reopenedSelection = await assertQuotedSelection(page, {
    position: 2,
    total: 2,
    type: 'image',
    path: '/media/CompactQuoteSelected',
  });
  evidence.steps.push({
    name: 'c-reopen',
    method: 'keyboard',
    selection: reopenedSelection,
    after: await compactClose(page, '#c-overlay', reopened.before, 'button'),
  });
  await page.locator('#c-header').click();
  await page.waitForURL(`https://x.com/inner_fixture/status/${COMPACT_INNER_ID}`);
  evidence.steps.push({ name: 'c-native-header', url: page.url() });

  await navigate('?compact=middle');
  const bApiStart = compactApiResponses.length;
  const b = await prepare('#b-overlay');
  assert.equal(b.hit.href, `https://x.com/middle_fixture/status/${COMPACT_MIDDLE_ID}`);
  await b.trigger.click();
  const bSelected = await assertQuotedSelection(page, {
    position: 2,
    total: 2,
    type: 'image',
    path: '/media/CompactQuoteSelected',
  });
  assert.equal(bSelected.source, COMPACT_ORIGINAL_URL);
  const bPanel = await compactPanelText(
    gallery,
    `https://x.com/middle_fixture/status/${COMPACT_MIDDLE_ID}`
  );
  assert(bPanel.text?.includes('B verified API caption'));
  assert(!bPanel.text?.includes('C verified API caption'));
  await page.keyboard.press('ArrowLeft');
  const bQuote = await assertQuotedSelection(page, {
    position: 1,
    total: 2,
    type: 'image',
    path: '/media/CompactQuoteSelected',
  });
  const bQuoteOrigin = await assertQuotedOriginLink(
    gallery,
    `https://x.com/inner_fixture/status/${COMPACT_INNER_ID}`
  );
  await page.keyboard.press('ArrowRight');
  await assertQuotedSelection(page, {
    position: 2,
    total: 2,
    type: 'image',
    path: '/media/CompactQuoteSelected',
  });
  assert.deepEqual(
    compactApiResponses.slice(bApiStart).map(({ tweetId, status }) => ({ tweetId, status })),
    [{ tweetId: COMPACT_MIDDLE_ID, status: 200 }]
  );
  const knownBSingle = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const bNativeMark = nativeLoopback.mark();
  const bFetchMark = pageFetches.length;
  await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
  const bSingleName = `middle_fixture_${COMPACT_MIDDLE_ID}_1.webp`;
  const bSingle = await waitForDownload(extensionPage, knownBSingle, bSingleName);
  const bSinglePath = relative(downloads, bSingle.filename);
  assert(bSinglePath && !bSinglePath.startsWith('..') && !isAbsolute(bSinglePath));
  const { bytes: bSingleBytes } = await readExactDownloadFile(
    bSingle.filename,
    compactImages.original.length
  );
  assert(bSingleBytes.equals(compactImages.original));
  const bNative = await assertNativeSingle({
    extensionPage,
    knownIds: knownBSingle,
    download: bSingle,
    expectedUrl: COMPACT_ORIGINAL_URL,
    expectedBytes: compactImages.original,
    nativeLoopback,
    nativeMark: bNativeMark,
    pageFetches: pageFetches.slice(bFetchMark),
  });
  const knownBZip = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  await gallery
    .locator('[data-gallery-element="toolbar"] button[aria-label="Download 2 shown files as ZIP"]')
    .click();
  const bZip = await waitForDownload(
    extensionPage,
    knownBZip,
    `inner_fixture_${COMPACT_INNER_ID} (1).zip`
  );
  const bZipPath = relative(downloads, bZip.filename);
  assert(bZipPath && !bZipPath.startsWith('..') && !isAbsolute(bZipPath));
  assert.deepEqual(
    (await queryDownloads(extensionPage))
      .filter(({ id }) => !knownBZip.has(id))
      .map(({ id }) => id),
    [bZip.id]
  );
  const bExpectedEntries = [
    { filename: `inner_fixture_${COMPACT_INNER_ID}_0.webp`, bytes: compactImages.original },
    { filename: bSingleName, bytes: compactImages.original },
  ];
  const { bytes: bZipBytes } = await readExactDownloadFile(
    bZip.filename,
    expectedStoredZipBytes(bExpectedEntries)
  );
  const bZipVerified = verifyStoredZip(bZipBytes, bExpectedEntries);
  evidence.steps.push({
    name: 'b-same-source',
    selection: bSelected,
    quote: bQuote,
    quoteOrigin: bQuoteOrigin,
    panel: bPanel,
    single: {
      filename: basename(bSingle.filename),
      ...imageReceipt(bSingleBytes),
      native: bNative,
    },
    zip: { filename: basename(bZip.filename), ...imageReceipt(bZipBytes), verified: bZipVerified },
  });
  evidence.steps.push({
    name: 'b-close',
    after: await compactClose(page, '#b-overlay', b.before, 'button'),
  });
  await page.locator('#b-header').click();
  await page.waitForURL(`https://x.com/middle_fixture/status/${COMPACT_MIDDLE_ID}`);
  evidence.steps.push({ name: 'b-native-header', url: page.url() });

  await navigate('?compact=denied');
  const deniedApiStart = compactApiResponses.length;
  const denied = await prepare('#c-overlay');
  await denied.trigger.click();
  const fallback = await assertQuotedSelection(page, {
    position: 1,
    total: 1,
    type: 'image',
    path: '/media/CompactQuoteSelected',
  });
  assert.equal(fallback.source, COMPACT_DISPLAY_URL);
  assert.equal(await gallery.locator('[data-gallery-element="item"]').count(), 1);
  const deniedRequests = compactApiResponses.slice(deniedApiStart);
  assert.deepEqual(
    deniedRequests.map(({ tweetId, status }) => ({ tweetId, status })),
    [{ tweetId: COMPACT_INNER_ID, status: 403 }]
  );
  const fallbackPanel = await compactPanelText(
    gallery,
    `https://x.com/inner_fixture/status/${COMPACT_INNER_ID}`
  );
  assert(!fallbackPanel.text?.includes('B parent caption'));
  assert(!fallbackPanel.text?.includes('B verified API caption'));
  assert(!fallbackPanel.text?.includes('Outer post'));
  evidence.steps.push({
    name: 'c-403',
    selection: fallback,
    panel: fallbackPanel,
    api: deniedRequests,
    after: await compactClose(page, '#c-overlay', denied.before, 'escape'),
  });
  evidence.api = compactApiResponses.slice(apiStart);
  evidence.images = compactImageRequests.slice(imageStart);
  assert(
    evidence.images.some(
      ({ path, name }) => path === '/media/CompactQuoteSelected' && name === 'orig'
    )
  );
  evidence.status = 'passed';
}

async function quotedHostSnapshot(page: Page, caseName: string, triggerSelector: string) {
  return page.evaluate(
    ({ name, selector }) => {
      const article = document.querySelector(`[data-case="${name}"]`);
      const trigger = article?.querySelector(selector);
      const style = document.body.style;
      return {
        active: document.activeElement === trigger,
        background: ['#host-layout-spacer', 'main'].map((target) => {
          const element = document.querySelector(target);
          return {
            ariaHidden: element?.getAttribute('aria-hidden') ?? null,
            hiddenMarker: element?.hasAttribute('data-xeg-gallery-hidden') ?? false,
            inert: element?.hasAttribute('inert') ?? false,
            selector: target,
          };
        }),
        bodyStyle: {
          left: style.left,
          overflow: style.overflow,
          position: style.position,
          right: style.right,
          top: style.top,
        },
        scrollRestoration: history.scrollRestoration,
        scrollY: window.scrollY,
      };
    },
    { name: caseName, selector: triggerSelector }
  );
}

async function captureQuotedOpeningScroll(trigger: Locator) {
  await trigger.evaluate((element) => {
    if (!(element instanceof HTMLElement)) {
      throw new Error('Quoted trigger is not an element');
    }
    element.addEventListener(
      'pointerdown',
      () => {
        element.dataset.openingScrollY = String(window.scrollY);
      },
      { once: true, capture: true }
    );
  });
}

async function quotedClickRecord(page: Page, beforeCount: number, expectedTag: string) {
  await page.waitForFunction(
    (count) => {
      const records = window.__quoteFixtureClicks;
      return records?.length === count + 1 && records.at(-1)?.settled === true;
    },
    beforeCount,
    { timeout: 5_000 }
  );
  const records = await page.evaluate(() => window.__quoteFixtureClicks);
  assert(records, 'Trusted quoted click records are missing');
  assert.equal(
    records.length,
    beforeCount + 1,
    'One ordinary trusted fixture click must be recorded'
  );
  const record = records.at(-1);
  assert(record, 'Trusted quoted click record is missing');
  assert.equal(record.tag, expectedTag, 'Hit-tested event.target must match the intended element');
  return record;
}

async function writeVideoBoundaryCheckpoint({
  output,
  name,
  page,
  api,
}: {
  output: string;
  name: string;
  page: Page;
  api: ApiRecord[];
}) {
  const snapshot = await page.evaluate(() => {
    const gallery = document.querySelector('[data-xeg-gallery-container]');
    const toolbar = gallery?.querySelector<HTMLElement>('[data-gallery-element="toolbar"]');
    return {
      url: location.href,
      clicks: {
        quoted: window.__quoteFixtureClicks ?? null,
        preplayer: window.__preplayerFixtureClicks ?? null,
        direct: window.__directVideoClicks ?? null,
      },
      videos: [...document.querySelectorAll('video')].map((video) => ({
        hostAction: video.dataset.hostAction ?? null,
        currentTime: video.currentTime,
        paused: video.paused,
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState,
        error: video.error?.code ?? null,
        source: video.currentSrc.startsWith('blob:') ? 'blob:' : video.currentSrc,
      })),
      gallery: {
        present: Boolean(gallery),
        currentIndex: toolbar?.dataset.currentIndex ?? null,
        focusedIndex: toolbar?.dataset.focusedIndex ?? null,
        items: [...(gallery?.querySelectorAll('[data-gallery-element="item"]') ?? [])].map(
          (item) => {
            const media = item.querySelector('video, img');
            return {
              index: item instanceof HTMLElement ? item.dataset.index : undefined,
              source:
                media instanceof HTMLMediaElement || media instanceof HTMLImageElement
                  ? media.currentSrc || media.src || null
                  : null,
            };
          }
        ),
      },
    };
  });
  const receipt = { name, capturedAt: new Date().toISOString(), ...snapshot, api };
  const file = `${name.startsWith('own01-no-outer-') ? '' : 'quoted-'}${name}-checkpoint.json`;
  await writeFile(join(output, file), JSON.stringify(receipt, null, 2));
  return { file, ...receipt };
}

async function attachVideoBoundaryFailure(
  diagnostic: { status: string; boundary?: unknown; boundaryError?: string },
  { output, name, page, api }: { output: string; name: string; page: Page; api: ApiRecord[] }
) {
  try {
    diagnostic.boundary = await writeVideoBoundaryCheckpoint({ output, name, page, api });
  } catch (error) {
    diagnostic.boundaryError = safeError(error);
  }
}

async function hostVideoState(video: Locator) {
  return video.evaluate((element) => {
    if (!(element instanceof HTMLVideoElement)) {
      throw new Error('Expected host video');
    }
    return {
      currentTime: element.currentTime,
      paused: element.paused,
      ended: element.ended,
      loop: element.loop,
      duration: element.duration,
      readyState: element.readyState,
      width: element.videoWidth,
      height: element.videoHeight,
      error: element.error?.code ?? null,
      muted: element.muted,
      volume: element.volume,
    };
  });
}

async function assertHostStopped(page: Page, video: Locator, label: string) {
  const element = await video.elementHandle();
  assert(element, `${label}: host video must exist`);
  try {
    await page.waitForFunction(
      (candidate) => candidate instanceof HTMLVideoElement && candidate.paused,
      element,
      { timeout: 5_000 }
    );
  } finally {
    await element.dispose();
  }
  const first = await hostVideoState(video);
  await page.waitForTimeout(350);
  const second = await hostVideoState(video);
  assert.equal(first.paused, true, `${label}: host must pause`);
  assert.equal(second.paused, true, `${label}: host must remain paused`);
  assert.equal(first.loop, true, `${label}: controlled host must loop during the pause check`);
  assert.equal(second.loop, true, `${label}: controlled host must retain looping`);
  assert.equal(first.ended, false, `${label}: an ended fixture cannot prove suppression`);
  assert.equal(second.ended, false, `${label}: fixture must not naturally end`);
  assert(
    first.readyState >= 2 && first.width > 0 && first.height > 0,
    `${label}: host must have decoded playable media`
  );
  assert(
    second.readyState >= 2 && second.width > 0 && second.height > 0,
    `${label}: host must remain decoded and playable`
  );
  assert(
    second.currentTime - first.currentTime < 0.05,
    `${label}: host time must not progress after settling`
  );
  assert.equal(second.error, null, `${label}: host must retain a usable media source`);
  return { first, second };
}

async function assertQuotedSelection(
  page: Page,
  { position, total, type, path }: { position: number; total: number; type: string; path: string }
) {
  const index = position - 1;
  const state = await waitForValue(async () => {
    const observed = await page.evaluate(
      ({ selectedIndex, mediaType }) => {
        const gallery = document.querySelector('[data-xeg-gallery-container]');
        const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
        const counter = toolbar?.querySelector('#xeg-toolbar-counter');
        const item = gallery?.querySelector(
          `[data-gallery-element="item"][data-index="${selectedIndex}"]`
        );
        const media = item?.querySelector(mediaType === 'video' ? 'video' : 'img');
        return {
          position: counter?.getAttribute('data-position') ?? null,
          total: counter?.getAttribute('data-total') ?? null,
          counterFocusedIndex: counter?.getAttribute('data-focused-index') ?? null,
          currentIndex: toolbar?.getAttribute('data-current-index') ?? null,
          focusedIndex: toolbar?.getAttribute('data-focused-index') ?? null,
          source:
            media instanceof HTMLMediaElement || media instanceof HTMLImageElement
              ? media.currentSrc || media.src || null
              : null,
          mediaReady:
            mediaType === 'video'
              ? media instanceof HTMLVideoElement &&
                media.readyState >= HTMLMediaElement.HAVE_METADATA &&
                media.videoWidth > 0 &&
                media.videoHeight > 0 &&
                media.error === null
              : media instanceof HTMLImageElement && media.complete && media.naturalWidth > 0,
          loaded: item?.getAttribute('data-media-loaded') ?? null,
        };
      },
      { selectedIndex: index, mediaType: type }
    );
    return observed.position === String(position) &&
      observed.total === String(total) &&
      observed.counterFocusedIndex === String(index) &&
      observed.currentIndex === String(index) &&
      observed.focusedIndex === String(index) &&
      observed.mediaReady &&
      observed.loaded === 'true'
      ? observed
      : undefined;
  }, `quoted selection ${position}/${total}`);
  assert(state.source, 'Selected quoted media has no source');
  const source = new URL(state.source);
  assert.equal(source.pathname, path, 'Selected media source must match the expected owner');
  assert.equal(source.hostname, type === 'video' ? 'video.twimg.com' : 'pbs.twimg.com');
  return state;
}

type QuotedOriginLinkState = {
  href: string | null;
  currentIndex: string | null;
  focusedIndex: string | null;
  position: string | null;
  total: string | null;
  counterFocusedIndex: string | null;
};

export async function assertQuotedOriginLink(
  gallery: Locator,
  expectedUrl: string,
  allowMediaPath = false
) {
  const button = gallery.locator('#tweet-text-button');
  assert.equal(await button.count(), 1, 'Selected media must expose originating post metadata');
  await button.click();
  const link = gallery.locator('#toolbar-tweet-panel a[href^="https://x.com/"]');
  let latest: QuotedOriginLinkState | null = null;
  let observed: QuotedOriginLinkState | null = null;
  let failure: unknown;
  let failureSeen = false;
  try {
    await link.waitFor({ state: 'visible' });
    observed = await waitForValue(async () => {
      latest = await gallery.evaluate((element) => {
        const toolbar = element.querySelector('[data-gallery-element="toolbar"]');
        const counter = toolbar?.querySelector('#xeg-toolbar-counter');
        return {
          href:
            element
              .querySelector('#toolbar-tweet-panel a[href^="https://x.com/"]')
              ?.getAttribute('href') ?? null,
          currentIndex: toolbar?.getAttribute('data-current-index') ?? null,
          focusedIndex: toolbar?.getAttribute('data-focused-index') ?? null,
          position: counter?.getAttribute('data-position') ?? null,
          total: counter?.getAttribute('data-total') ?? null,
          counterFocusedIndex: counter?.getAttribute('data-focused-index') ?? null,
        };
      });
      return latest.href === expectedUrl ||
        (allowMediaPath && latest.href === `${expectedUrl}/video/2`)
        ? latest
        : undefined;
    }, 'selected post source link');
    assert(
      observed.href === expectedUrl ||
        (allowMediaPath && observed.href === `${expectedUrl}/video/2`),
      'Toolbar source link must identify the selected post'
    );
  } catch (error) {
    failureSeen = true;
    failure =
      error instanceof Error && error.message.startsWith('Timed out waiting for ')
        ? new Error(
            `Toolbar source link must identify the selected post: ${JSON.stringify({ expectedUrl, allowMediaPath, observed: latest })}`,
            { cause: error }
          )
        : error;
  }
  try {
    await button.click();
  } catch (error) {
    if (failureSeen) {
      throw new AggregateError(
        [failure, error],
        'Toolbar source link assertion and panel cleanup failed'
      );
    }
    throw error;
  }
  if (failureSeen) {
    throw failure;
  }
  assert(observed);
  return observed.href;
}

async function navigateQuotedAwayAndBack(
  page: Page,
  quotedCase: (typeof QUOTED_CASES)[number],
  total: number
) {
  const from = quotedCase.expectedPosition;
  const to = from === 1 ? 2 : from - 1;
  const awayKey = from === 1 ? 'ArrowRight' : 'ArrowLeft';
  const returnKey = from === 1 ? 'ArrowLeft' : 'ArrowRight';
  await page.keyboard.press(awayKey);
  const away = await assertQuotedSelection(page, {
    position: to,
    total,
    type: quotedCase.away.type,
    path: quotedCase.away.path,
  });
  const gallery = page.locator('[data-xeg-gallery-container]');
  const awayOrigin = await assertQuotedOriginLink(gallery, quotedCase.away.origin);
  const beforeReturn = await page.evaluate(() => {
    const toolbar = document.querySelector('[data-gallery-element="toolbar"]');
    const counter = toolbar?.querySelector('#xeg-toolbar-counter');
    const items = document.querySelector('[data-gallery-element="items"]');
    return {
      currentIndex: toolbar?.getAttribute('data-current-index'),
      focusedIndex: toolbar?.getAttribute('data-focused-index'),
      position: counter?.getAttribute('data-position'),
      scrollTop: items?.scrollTop,
      outerScrollTop: document.querySelector('.xeg-gallery-container')?.scrollTop,
      itemRects: [...document.querySelectorAll('[data-gallery-element="item"]')].map((item) => {
        const rect = item.getBoundingClientRect();
        return { index: item.getAttribute('data-index'), top: rect.top, bottom: rect.bottom };
      }),
      activeTag: document.activeElement?.tagName,
    };
  });
  await page.keyboard.press(returnKey);
  let returned: Awaited<ReturnType<typeof assertQuotedSelection>> | undefined;
  try {
    returned = await assertQuotedSelection(page, {
      position: from,
      total,
      type: 'video',
      path: `/ext_tw_video/${quotedCase.owner}/pu/vid/320x180/${quotedCase.media}.mp4`,
    });
  } catch (error) {
    throw new Error(`${safeError(error)}; before return: ${JSON.stringify(beforeReturn)}`, {
      cause: error,
    });
  }
  const returnedOrigin = await assertQuotedOriginLink(
    gallery,
    `https://x.com/${quotedCase.username}/status/${quotedCase.owner}`,
    quotedCase.name === 'linked'
  );
  return { awayKey, returnKey, away, awayOrigin, beforeReturn, returned, returnedOrigin };
}

async function assertQuotedGallery(
  page: Page,
  quotedCase: {
    name: string;
    expectedPosition: number;
    expectedTotal?: number;
    owner: string;
    media: string;
  }
) {
  const gallery = page.locator('[data-xeg-gallery-container]');
  await gallery.waitFor({ state: 'visible', timeout: 15_000 });
  assert.equal(await gallery.getAttribute('role'), 'dialog');
  assert.equal(await gallery.getAttribute('aria-modal'), 'true');
  const counter = gallery.locator('#xeg-toolbar-counter');
  const expectedTotal =
    ('expectedTotal' in quotedCase ? quotedCase.expectedTotal : undefined) ??
    (quotedCase.name === 'linked' || quotedCase.name === 'recognized'
      ? 2
      : quotedCase.name === 'nested-from-outer' || quotedCase.name === 'nested-direct-quote'
        ? 2
        : 3);
  assert.equal(
    Number(await counter.getAttribute('data-position')),
    quotedCase.expectedPosition,
    'Quoted video selection must preserve its collection index'
  );
  assert.equal(
    Number(await counter.getAttribute('data-total')),
    expectedTotal,
    'Quoted collection must include only the expected owners'
  );
  const selection = await assertQuotedSelection(page, {
    position: quotedCase.expectedPosition,
    total: expectedTotal,
    type: 'video',
    path: `/ext_tw_video/${quotedCase.owner}/pu/vid/320x180/${quotedCase.media}.mp4`,
  });
  assert.equal(await gallery.locator('[data-gallery-element="item"]').count(), expectedTotal);
  const selected = gallery.locator(
    `[data-gallery-element="item"][data-index="${quotedCase.expectedPosition - 1}"]`
  );
  await selected.waitFor({ state: 'visible' });
  const video = selected.locator('video');
  await video.waitFor({ state: 'visible' });
  await page.waitForFunction(
    ({ index }) => {
      const item = document.querySelector(
        `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${index}"]`
      );
      const element = item?.querySelector('video');
      return (
        item?.getAttribute('data-media-loaded') === 'true' &&
        element instanceof HTMLVideoElement &&
        element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        element.videoWidth > 0 &&
        element.videoHeight > 0 &&
        element.error === null
      );
    },
    { index: quotedCase.expectedPosition - 1 },
    { timeout: 15_000 }
  );
  const selectedMedia = await video.evaluate((element) => {
    if (!(element instanceof HTMLVideoElement)) {
      throw new Error('Selected quoted video is missing');
    }
    return {
      src: element.currentSrc || element.src,
      readyState: element.readyState,
      width: element.videoWidth,
      height: element.videoHeight,
      duration: element.duration,
      error: element.error?.code ?? null,
    };
  });
  assert.equal(new URL(selectedMedia.src).hostname, 'video.twimg.com');
  assert.equal(
    new URL(selectedMedia.src).pathname,
    `/ext_tw_video/${quotedCase.owner}/pu/vid/320x180/${quotedCase.media}.mp4`,
    'The selected video must use the owner-specific API MP4'
  );
  assert.equal(selectedMedia.width, 320);
  assert.equal(selectedMedia.height, 180);
  assert(Number.isFinite(selectedMedia.duration) && selectedMedia.duration > 1);
  assert.equal(selectedMedia.error, null);
  assert.equal(
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').count(),
    1
  );
  assert.equal(
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').count(),
    1
  );
  return { gallery, selected, selectedMedia, selection, total: expectedTotal, video };
}

async function closeQuotedGallery({
  gallery,
  page,
  method,
  before,
  caseName,
  selector,
}: {
  gallery: Locator;
  page: Page;
  method: string;
  before: Awaited<ReturnType<typeof quotedHostSnapshot>>;
  caseName: string;
  selector: string;
}) {
  if (method === 'button') {
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
  } else {
    await page.keyboard.press('Escape');
  }
  await gallery.waitFor({ state: 'detached', timeout: 15_000 });
  const after = await quotedHostSnapshot(page, caseName, selector);
  assert.equal(after.active, true, `${caseName}: close must restore the exact trigger focus`);
  assert.equal(after.scrollY, before.scrollY, `${caseName}: close must restore host scroll`);
  assert.equal(after.scrollRestoration, before.scrollRestoration);
  assert.deepEqual(
    after.bodyStyle,
    before.bodyStyle,
    `${caseName}: close must restore body inline styles`
  );
  assert.deepEqual(
    after.background,
    before.background,
    `${caseName}: close must restore host isolation`
  );
  assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
  return {
    focusRestored: after.active,
    scrollRestored: after.scrollY === before.scrollY,
    backgroundRestored: true,
    bodyStyleRestored: true,
  };
}

async function runOuterVideoControl({
  quotedCase,
  quotedApiResponses,
  downloads,
  extensionPage,
  output,
  page,
  videoPayloads,
  nativeLoopback,
  pageFetches,
}: {
  quotedCase: QuotedCase;
  quotedApiResponses: ApiRecord[];
  downloads: string;
  extensionPage: Page;
  output: string;
  page: Page;
  videoPayloads: Record<string, Buffer>;
  nativeLoopback: NativeLoopback;
  pageFetches: PageFetch[];
}) {
  const article = page.locator(`[data-case="${quotedCase.route}"]`);
  const trigger = article.locator('[data-outer-target]');
  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await trigger.focus();
  const before = await quotedHostSnapshot(page, quotedCase.route, '[data-outer-target]');
  assert.equal(before.active, true, 'Outer video control must hold focus');
  assert(before.scrollY > 0, 'Outer video control must open at nonzero scroll');
  const hit = await trigger.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return (
      document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === element
    );
  });
  assert.equal(hit, true, 'Outer video must be the ordinary hit-tested target');
  await page.screenshot({ path: join(output, 'quoted-outer-control-before.png') });
  const apiStart = quotedApiResponses.length;
  const precedingApi = quotedApiResponses
    .slice(0, apiStart)
    .findLast(({ tweetId, status }) => tweetId === quotedCase.outer && status === 200);
  assert(precedingApi, 'Outer control must follow a successful same-page owning API request');
  await captureQuotedOpeningScroll(trigger);
  await trigger.click();
  before.scrollY = Number(await trigger.getAttribute('data-opening-scroll-y'));
  assert(Number.isFinite(before.scrollY) && before.scrollY > 0);
  const gallery = page.locator('[data-xeg-gallery-container]');
  await gallery.waitFor({ state: 'visible', timeout: 15_000 });
  const outerPath = `/ext_tw_video/${quotedCase.outer}/pu/vid/320x180/outer-unmarked.mp4`;
  const selected = await assertQuotedSelection(page, {
    position: 3,
    total: 3,
    type: 'video',
    path: outerPath,
  });
  const sourceLink = await assertQuotedOriginLink(
    gallery,
    `https://x.com/${quotedCase.handle}/status/${quotedCase.outer}`
  );
  // This second click reselects A from the same owning metadata used for B.
  // A still-live normalized cache entry needs no new provider dispatch.
  const newApi = quotedApiResponses.slice(apiStart);
  assert(
    newApi.length <= 1 &&
      newApi.every(({ tweetId, status }) => tweetId === quotedCase.outer && status === 200),
    'Outer video may reuse A or dispatch one fresh A request, without another owner'
  );
  await page.keyboard.press('ArrowLeft');
  const quoted = await assertQuotedSelection(page, {
    position: 2,
    total: 3,
    type: 'video',
    path: `/ext_tw_video/${quotedCase.owner}/pu/vid/320x180/${quotedCase.media}.mp4`,
  });
  await page.keyboard.press('ArrowRight');
  const returned = await assertQuotedSelection(page, {
    position: 3,
    total: 3,
    type: 'video',
    path: outerPath,
  });
  await page.screenshot({ path: join(output, 'quoted-outer-control-gallery.png') });

  const knownIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const nativeMark = nativeLoopback.mark();
  const fetchMark = pageFetches.length;
  const filename = `${quotedCase.handle}_${quotedCase.outer}_2.mp4`;
  await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
  const download = await waitForDownload(extensionPage, knownIds, filename);
  const relativeDownload = relative(downloads, download.filename);
  assert(
    relativeDownload && !relativeDownload.startsWith('..') && !isAbsolute(relativeDownload),
    'Outer video download escaped the task-owned directory'
  );
  const bytes = await readFile(download.filename);
  assert(selected.source, 'Outer video selection has no source');
  const payload = videoPayloads['nested-c'];
  assert(payload, 'Outer video fixture payload is missing');
  assert(payload.equals(bytes), 'Outer A privileged download must match its routed playable bytes');
  const native = await assertNativeSingle({
    extensionPage,
    knownIds,
    download,
    expectedUrl: selected.source,
    expectedBytes: payload,
    nativeLoopback,
    nativeMark,
    pageFetches: pageFetches.slice(fetchMark),
  });
  const file = 'quoted-outer-control-download.mp4';
  await copyFile(download.filename, join(output, file));
  const close = await closeQuotedGallery({
    gallery,
    page,
    method: 'button',
    before,
    caseName: quotedCase.route,
    selector: '[data-outer-target]',
  });
  await page.screenshot({ path: join(output, 'quoted-outer-control-after.png') });
  assert.deepEqual(
    quotedApiResponses.slice(apiStart),
    newApi,
    'Outer navigation and download must not add provider requests'
  );
  return {
    api: newApi,
    metadataReuse: { precedingApi, newRequestCount: newApi.length, reused: newApi.length === 0 },
    sourceLink,
    selected,
    navigation: { awayKey: 'ArrowLeft', returnKey: 'ArrowRight', quoted, returned },
    download: {
      filename,
      file,
      bytes: bytes.length,
      native,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
    close,
  };
}

async function withControlledFixtureVideoMode<T extends object>(
  extensionPage: Page,
  evidence: ControlledSettingEvidence,
  action: () => Promise<T>,
  mode = 'allow-all'
) {
  const key = 'xeg-app-settings';
  let prior: Awaited<ReturnType<typeof readStoredVideoSettings>> | undefined;
  let mutated = false;
  let result: T | undefined;
  let validationError: unknown;
  let validationSeen = false;
  let cleanupError: unknown;
  let cleanupSeen = false;
  let restored = false;
  try {
    prior = await readStoredVideoSettings(extensionPage);
    evidence.priorStoredMode = storedVideoClickMode(prior.settings);
    const next = createControlledVideoSettings(prior.value, Date.now());
    const gallery: Record<string, unknown> = next.gallery;
    if (mode === 'default') {
      delete gallery.videoClickMode;
    } else {
      gallery.videoClickMode = mode;
    }
    mutated = true;
    await extensionPage.evaluate(
      async ({ storageKey, fieldKey, value, mode }) => {
        await chrome.storage.local.set({ [storageKey]: value });
        if (mode === 'default') {
          await chrome.storage.local.remove(fieldKey);
        } else {
          await chrome.storage.local.set({
            [fieldKey]: { __xegStorageEnvelope: 1, updatedAt: Date.now(), value: mode },
          });
        }
      },
      {
        storageKey: key,
        fieldKey: 'xeg-app-settings:field:gallery.videoClickMode',
        value: next,
        mode,
      }
    );
    const effective = storedVideoClickMode((await readStoredVideoSettings(extensionPage)).settings);
    assert.equal(
      effective,
      mode === 'default' ? null : mode,
      'Controlled fixture must persist its requested video-click mode'
    );
    evidence.effectiveMode = mode === 'default' ? 'block-controls-only' : effective;
    result = await action();
  } catch (error) {
    validationSeen = true;
    validationError = error;
  } finally {
    try {
      if (mutated) {
        assert(prior, 'Controlled fixture settings snapshot is missing');
        restored = await restoreStoredVideoSettings(extensionPage, prior);
      } else {
        restored = true;
      }
      evidence.restored = restored;
      assert.equal(restored, true, 'Preplayer fixture must restore the full prior settings value');
    } catch (error) {
      evidence.restored = false;
      cleanupSeen = true;
      cleanupError = error;
    }
  }
  if (validationSeen && cleanupSeen) {
    throw new AggregateError(
      [validationError, cleanupError],
      'Preplayer fixture validation and settings restoration both failed'
    );
  }
  if (validationSeen) {
    throw validationError;
  }
  if (cleanupSeen) {
    throw cleanupError;
  }
  assert(result, 'Controlled fixture action produced no result');
  return { ...result, controlledSetting: evidence };
}

async function runVideoClickSettingsCycle({
  extensionPage,
  gallery,
  output,
  page,
}: {
  extensionPage: Page;
  gallery: Locator;
  output: string;
  page: Page;
}) {
  const prior = await readStoredVideoSettings(extensionPage);
  const initialMode = storedVideoClickMode(prior.settings) ?? 'block-controls-only';
  const settingsButton = gallery.locator('[data-gallery-element="toolbar"] #settings-button');
  let receipt:
    | {
        initialMode: string;
        modes: Array<{ keyPress: string; selected: string; stored: string }>;
        finalMode: string;
        screenshot: string;
        fullSettingRestored?: boolean;
      }
    | undefined;
  let validationError: unknown;
  let validationSeen = false;
  let cleanupError: unknown;
  let cleanupSeen = false;
  try {
    await settingsButton.click();
    const select = gallery.getByLabel('Video clicks');
    await select.waitFor({ state: 'visible' });
    assert.equal(await select.getAttribute('id'), 'settings-video-click-select');
    assert.equal(await select.inputValue(), initialMode);
    const help = gallery.locator('#settings-video-click-help');
    const helpText = await help.textContent();
    assert(helpText, 'Video-click settings help text is missing');
    assert.match(helpText, /video surfaces open the gallery/i);
    const pressAndConfirmMode = async (keyPress: string, expectedMode: string) => {
      await waitForValue(
        async () => ((await select.isEnabled()) ? true : undefined),
        `enabled video-click select before ${keyPress}`,
        5_000
      );
      await select.focus();
      assert.equal(
        await select.evaluate((element) => document.activeElement === element),
        true,
        `Video-click select must be focused before ${keyPress}`
      );
      await page.keyboard.press(keyPress);
      await waitForValue(
        async () => {
          const stored = storedVideoClickMode(
            (await readStoredVideoSettings(extensionPage)).settings
          );
          return stored === expectedMode ? stored : undefined;
        },
        `trusted keyboard video-click setting ${expectedMode}`,
        5_000
      );
      assert.equal(await select.inputValue(), expectedMode);
    };
    const modes: Array<{ keyPress: string; selected: string; stored: string }> = [];
    const keyboardModes: Array<[string, string]> = [
      ['Home', 'block-all'],
      ['ArrowDown', 'block-controls-only'],
      ['End', 'allow-all'],
    ];
    for (const [keyPress, expectedMode] of keyboardModes) {
      await pressAndConfirmMode(keyPress, expectedMode);
      modes.push({ keyPress, selected: expectedMode, stored: expectedMode });
    }
    await page.screenshot({ path: join(output, 'quoted-video-click-settings.png') });
    if (initialMode === 'block-all') {
      await pressAndConfirmMode('Home', initialMode);
    } else if (initialMode === 'block-controls-only') {
      await pressAndConfirmMode('Home', 'block-all');
      await pressAndConfirmMode('ArrowDown', initialMode);
    } else {
      await pressAndConfirmMode('End', initialMode);
    }
    await settingsButton.click();
    receipt = {
      initialMode,
      modes,
      finalMode: initialMode,
      screenshot: 'quoted-video-click-settings.png',
    };
  } catch (error) {
    validationSeen = true;
    validationError = error;
  } finally {
    try {
      const restored = await restoreStoredVideoSettings(extensionPage, prior);
      assert.equal(restored, true, 'Settings UI cycle must restore the full prior setting');
      if (receipt) {
        receipt.fullSettingRestored = true;
      }
    } catch (error) {
      cleanupSeen = true;
      cleanupError = error;
    }
  }
  if (validationSeen && cleanupSeen) {
    throw new AggregateError(
      [validationError, cleanupError],
      'Video-click settings UI validation and setting restoration both failed'
    );
  }
  if (validationSeen) {
    throw validationError;
  }
  if (cleanupSeen) {
    throw cleanupError;
  }
  assert(receipt, 'Video-click settings cycle produced no receipt');
  return receipt;
}

async function runVideoClickNewDocumentReadback({
  context,
  extensionPage,
  gallery,
  page,
}: {
  context: BrowserContext;
  extensionPage: Page;
  gallery: Locator;
  page: Page;
}) {
  const prior = await readStoredVideoSettings(extensionPage);
  const initialMode = storedVideoClickMode(prior.settings) ?? 'block-controls-only';
  const fieldKey = 'xeg-app-settings:field:gallery.videoClickMode';
  const settingsButton = gallery.locator('[data-gallery-element="toolbar"] #settings-button');
  let newDocument: Page | undefined;
  let receipt:
    | {
        initialMode: string;
        legacyRecordExists: boolean;
        legacyRecordRawType: string | null;
        fieldKey: string;
        fieldExistedBefore: boolean;
        persistedFieldRawType: string;
        persistedFieldValue: string;
        newDocumentSelectedValue: string;
        fullSettingRestored: boolean;
      }
    | undefined;
  let validationError: unknown;
  let validationSeen = false;
  const cleanupErrors: unknown[] = [];
  try {
    await settingsButton.click();
    const select = gallery.getByLabel('Video clicks');
    await select.waitFor({ state: 'visible' });
    assert.equal(await select.inputValue(), initialMode);
    const pressAndConfirm = async (keyPress: string, expectedMode: string) => {
      await waitForValue(
        async () => ((await select.isEnabled()) ? true : undefined),
        `enabled video-click select before ${keyPress}`,
        5_000
      );
      await select.focus();
      assert.equal(
        await select.evaluate((element) => document.activeElement === element),
        true,
        `Video-click select must be focused before ${keyPress}`
      );
      await page.keyboard.press(keyPress);
      await waitForValue(
        async () => {
          const stored = await readStoredVideoSettings(extensionPage);
          const field = stored.fields?.[fieldKey];
          return field?.exists &&
            decodeStoredValue(field.value) === expectedMode &&
            storedVideoClickMode(stored.settings) === expectedMode
            ? true
            : undefined;
        },
        `persisted native video-click field ${expectedMode}`,
        5_000
      );
      assert.equal(await select.inputValue(), expectedMode);
    };
    await pressAndConfirm(
      initialMode === 'block-all' ? 'ArrowDown' : 'Home',
      initialMode === 'block-all' ? 'block-controls-only' : 'block-all'
    );
    await pressAndConfirm('End', 'allow-all');
    const persisted = await readStoredVideoSettings(extensionPage);
    const persistedField = persisted.fields?.[fieldKey];
    assert(persistedField?.exists, 'Native video-click field was not stored');
    assert.equal(decodeStoredValue(persistedField.value), 'allow-all');
    await settingsButton.click();

    newDocument = await context.newPage();
    await newDocument.goto(EXPERIENCE_FIXTURE_URL);
    await newDocument.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    const trigger = newDocument.locator('[data-testid="tweetPhoto"] img').first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const newGallery = newDocument.locator('[data-xeg-gallery-container]');
    await newGallery.waitFor({ state: 'visible' });
    await newGallery.locator('[data-gallery-element="toolbar"] #settings-button').click();
    const newSelect = newGallery.getByLabel('Video clicks');
    await newSelect.waitFor({ state: 'visible' });
    await waitForValue(
      async () => ((await newSelect.inputValue()) === 'allow-all' ? true : undefined),
      'new-document Video clicks setting loaded from native storage',
      5_000
    );
    receipt = {
      initialMode,
      legacyRecordExists: prior.exists,
      legacyRecordRawType: prior.exists ? typeof prior.value : null,
      fieldKey,
      fieldExistedBefore: prior.fields?.[fieldKey]?.exists ?? false,
      persistedFieldRawType: typeof persistedField.value,
      persistedFieldValue: 'allow-all',
      newDocumentSelectedValue: 'allow-all',
      fullSettingRestored: false,
    };
  } catch (error) {
    validationSeen = true;
    validationError = error;
  } finally {
    try {
      await newDocument?.close();
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      assert.equal(
        await restoreStoredVideoSettings(extensionPage, prior),
        true,
        'New-document settings readback must restore the full prior setting'
      );
      if (receipt) {
        receipt.fullSettingRestored = true;
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  const failures = validationSeen ? [validationError, ...cleanupErrors] : cleanupErrors;
  if (failures.length > 1) {
    throw new AggregateError(failures, 'New-document settings validation or cleanup failed');
  }
  if (failures.length === 1) {
    throw failures[0];
  }
  assert(receipt, 'New-document settings readback produced no receipt');
  return receipt;
}

async function runPublicPreplayerCycle({
  quotedCase,
  quotedApiResponses,
  apiResponses,
  downloads,
  extensionPage,
  output,
  page,
  videoPayloads,
  settingEvidence,
  nativeLoopback,
  pageFetches,
}: {
  quotedCase: typeof PUBLIC_PREPLAYER_CASE;
  quotedApiResponses: ApiRecord[];
  apiResponses: ApiRecord[];
  downloads: string;
  extensionPage: Page;
  output: string;
  page: Page;
  videoPayloads: Record<string, Buffer>;
  settingEvidence: ControlledSettingEvidence;
  nativeLoopback: NativeLoopback;
  pageFetches: PageFetch[];
}) {
  return withControlledFixtureVideoMode(extensionPage, settingEvidence, async () => {
    const pageUrl = `https://x.com/${quotedCase.handle}/status/${quotedCase.outer}`;
    await page.goto(pageUrl);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
      state: 'attached',
      timeout: 15_000,
    });
    const effective = storedVideoClickMode((await readStoredVideoSettings(extensionPage)).settings);
    assert.equal(effective, 'allow-all', 'Preplayer mode must remain active after page readiness');
    const precondition = await page.evaluate(() => {
      const outer = document.querySelector('[data-case="public-preplayer"]');
      const quote = outer?.querySelector('[role="link"] > article');
      const wrapper = quote?.querySelector('[data-preplayer-wrapper]');
      const media = quote?.querySelector('[data-preplayer-media]');
      const button = media?.querySelector('button');
      const credit = wrapper?.querySelector('.credit a');
      const header = quote?.querySelector('.quote-header a');
      const ownPaths = (article: Element | null | undefined) =>
        [...(article?.querySelectorAll<HTMLAnchorElement>('a[href]') ?? [])]
          .filter((anchor) => anchor.closest('article') === article)
          .map((anchor) => ({
            path: new URL(anchor.href).pathname,
            containsTime: anchor.querySelector('time') !== null,
          }));
      return {
        outerStatusAnchors: ownPaths(outer),
        quoteStatusAnchors: ownPaths(quote),
        nestedArticleCount: outer?.querySelectorAll('article').length ?? 0,
        roleLink: quote?.parentElement?.getAttribute('role') ?? null,
        videoCount: outer?.querySelectorAll('video').length ?? -1,
        totalImageCount: quote?.querySelectorAll('img').length ?? -1,
        trustedThumbnailCount: [...(quote?.querySelectorAll('img') ?? [])].filter(
          (image) =>
            new URL(image.src).hostname === 'pbs.twimg.com' &&
            new URL(image.src).pathname.startsWith('/ext_tw_video_thumb/')
        ).length,
        ordinaryAvatarCount: quote?.querySelectorAll('img.avatar').length ?? -1,
        mediaImageCount: media?.querySelectorAll('img').length ?? -1,
        buttonParentImageCount: button?.parentElement?.querySelectorAll('img').length ?? -1,
        mediaButtonCount: media?.querySelectorAll('button').length ?? -1,
        buttonUnmarked: button?.hasAttribute('data-testid') === false,
        headerOutsideWrapper: !!header && !wrapper?.contains(header),
        creditInsideWrapper: !!credit && wrapper?.contains(credit),
        creditOutsideMedia: !!credit && !media?.contains(credit),
      };
    });
    assert.deepEqual(precondition.outerStatusAnchors, [
      { path: `/${quotedCase.handle}/status/${quotedCase.outer}`, containsTime: false },
      { path: `/${quotedCase.handle}/status/${quotedCase.outer}`, containsTime: false },
    ]);
    assert.deepEqual(precondition.quoteStatusAnchors, [
      { path: `/${quotedCase.username}/status/${quotedCase.owner}`, containsTime: false },
      { path: `/credit_preplay/status/${quotedCase.credit}`, containsTime: false },
    ]);
    assert.equal(precondition.nestedArticleCount, 1);
    assert.equal(precondition.roleLink, 'link');
    assert.equal(precondition.videoCount, 0);
    assert.equal(precondition.totalImageCount, 3);
    assert.equal(precondition.trustedThumbnailCount, 1);
    assert.equal(precondition.ordinaryAvatarCount, 2);
    assert.equal(precondition.mediaImageCount, 3);
    assert.equal(precondition.buttonParentImageCount, 0);
    assert.equal(precondition.mediaButtonCount, 1);
    assert.equal(precondition.buttonUnmarked, true);
    assert.equal(precondition.headerOutsideWrapper, true);
    assert.equal(precondition.creditInsideWrapper, true);
    assert.equal(precondition.creditOutsideMedia, true);

    const trigger = page.locator('[data-case="public-preplayer"] [data-preplayer-media] button');
    await trigger.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -120));
    await trigger.focus();
    const before = await quotedHostSnapshot(
      page,
      quotedCase.route,
      '[data-preplayer-media] button'
    );
    assert.equal(before.active, true, 'Preplayer native button must hold focus');
    assert(before.scrollY > 0, 'Preplayer must open at nonzero host scroll');
    const hit = await trigger.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const x = Math.round(rect.left + rect.width * 0.2);
      const y = Math.round(rect.top + rect.height * 0.2);
      const controlSurface = element.parentElement;
      const media = controlSurface?.parentElement;
      const images = [...(media?.querySelectorAll('img') ?? [])];
      return {
        x,
        y,
        topIsButton: document.elementFromPoint(x, y) === element,
        scopeDepth: media?.hasAttribute('data-preplayer-media') ? 2 : null,
        buttonParentImages: controlSurface?.querySelectorAll('img').length ?? -1,
        scopeImages: images.length,
        scopeTrustedThumbs: images.filter(
          (image) =>
            new URL(image.src).hostname === 'pbs.twimg.com' &&
            new URL(image.src).pathname.startsWith('/ext_tw_video_thumb/')
        ).length,
        scopeOrdinaryImages: images.filter(
          (image) => !new URL(image.src).pathname.startsWith('/ext_tw_video_thumb/')
        ).length,
        scopeVideos: media?.querySelectorAll('video').length ?? -1,
      };
    });
    assert.equal(hit.topIsButton, true, 'Ordinary pointer point must hit the native button');
    assert.equal(hit.scopeDepth, 2, 'Clicked button must reach the exact media shell in two hops');
    assert.equal(hit.buttonParentImages, 0);
    assert.equal(hit.scopeImages, 3);
    assert.equal(hit.scopeTrustedThumbs, 1);
    assert.equal(hit.scopeOrdinaryImages, 2);
    assert.equal(hit.scopeVideos, 0);
    await page.screenshot({ path: join(output, 'quoted-public-preplayer-before.png') });

    const apiStart = quotedApiResponses.length;
    const rejectedApiStart = apiResponses.length;
    await page.mouse.click(hit.x, hit.y);
    const opened = await assertQuotedGallery(page, quotedCase);
    assert.deepEqual(
      quotedApiResponses.slice(apiStart).map(({ tweetId }) => tweetId),
      [quotedCase.outer],
      'Preplayer must request A and derive B from its direct quote'
    );
    assert.deepEqual(
      apiResponses.slice(rejectedApiStart),
      [],
      'Preplayer must not request unsupported B or C API targets'
    );
    const originUrl = await assertQuotedOriginLink(
      opened.gallery,
      `https://x.com/${quotedCase.username}/status/${quotedCase.owner}`
    );
    await opened.gallery.locator('#tweet-text-button').click();
    const panelText = await opened.gallery.locator('#toolbar-tweet-panel').textContent();
    assert(
      panelText?.includes(`${quotedCase.username} deterministic installed media`),
      'Selected video text must identify B'
    );
    assert(panelText, 'Selected video text panel is missing');
    assert(
      !panelText.includes('credit_preplay deterministic installed media'),
      'Nested C text must not replace B'
    );
    await opened.gallery.locator('#tweet-text-button').click();
    const navigation = await navigateQuotedAwayAndBack(page, quotedCase, opened.total);
    assert.equal(
      await opened.gallery.locator('[data-gallery-element="item"] video').count(),
      1,
      'Nested C video must not enter the gallery'
    );
    const playbackStart = await opened.video.evaluate((video) => {
      if (!(video instanceof HTMLVideoElement)) {
        throw new Error('Preplayer gallery video is missing');
      }
      return video.currentTime;
    });
    await opened.video.click();
    await page.waitForFunction(
      ({ index, start }) => {
        const video = document.querySelector(
          `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${index}"] video`
        );
        return (
          video instanceof HTMLVideoElement &&
          !video.paused &&
          video.error === null &&
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.currentTime >= start + 0.15
        );
      },
      { index: quotedCase.expectedPosition - 1, start: playbackStart },
      { timeout: 15_000 }
    );
    const playbackEnd = await opened.video.evaluate((video) => {
      if (!(video instanceof HTMLVideoElement)) {
        throw new Error('Preplayer gallery video is missing');
      }
      return video.currentTime;
    });
    await page.screenshot({ path: join(output, 'quoted-public-preplayer-gallery.png') });

    const knownIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    const nativeMark = nativeLoopback.mark();
    const fetchMark = pageFetches.length;
    const filename = `${quotedCase.username}_${quotedCase.owner}_${quotedCase.expectedPosition - 1}.mp4`;
    await opened.gallery
      .locator('[data-gallery-element="toolbar"] button[aria-label="Download"]')
      .click();
    const download = await waitForDownload(extensionPage, knownIds, filename);
    const relativeDownload = relative(downloads, download.filename);
    assert(
      relativeDownload && !relativeDownload.startsWith('..') && !isAbsolute(relativeDownload),
      'Preplayer download escaped the task-owned directory'
    );
    const bytes = await readFile(download.filename);
    const sourceBytes = videoPayloads[quotedCase.media];
    assert(sourceBytes, 'Preplayer video fixture payload is missing');
    assert(sourceBytes.equals(bytes), 'Preplayer bytes must match B video MP4 exactly');
    const native = await assertNativeSingle({
      extensionPage,
      knownIds,
      download,
      expectedUrl: opened.selectedMedia.src,
      expectedBytes: sourceBytes,
      nativeLoopback,
      nativeMark,
      pageFetches: pageFetches.slice(fetchMark),
    });
    const file = 'quoted-public-preplayer-download.mp4';
    await copyFile(download.filename, join(output, file));
    const close = await closeQuotedGallery({
      gallery: opened.gallery,
      page,
      method: 'escape',
      before,
      caseName: quotedCase.route,
      selector: '[data-preplayer-media] button',
    });
    assert.deepEqual(
      quotedApiResponses.slice(apiStart).map(({ tweetId }) => tweetId),
      [quotedCase.outer],
      'Preplayer navigation and download must retain the A request'
    );
    assert.deepEqual(
      apiResponses.slice(rejectedApiStart),
      [],
      'Preplayer must not add rejected B or C API requests'
    );
    await page.screenshot({ path: join(output, 'quoted-public-preplayer-after.png') });
    return {
      name: quotedCase.name,
      pageUrl,
      precondition,
      hit,
      requestedTweetId: quotedCase.outer,
      api: quotedApiResponses.slice(apiStart),
      selectedPosition: quotedCase.expectedPosition,
      selected: opened.selectedMedia,
      originUrl,
      textOwner: quotedCase.username,
      navigation,
      playbackStart,
      playbackEnd,
      download: {
        filename,
        bytes: bytes.length,
        file,
        native,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'),
      },
      close,
    };
  });
}

async function runCreditControlsCycle({
  page,
  extensionPage,
  quotedApiResponses,
  apiResponses,
  compactApiResponses,
  qualityApiResponses,
  evidence,
}: {
  page: Page;
  extensionPage: Page;
  quotedApiResponses: ApiRecord[];
  apiResponses: ApiRecord[];
  compactApiResponses: ApiRecord[];
  qualityApiResponses: ApiRecord[];
  evidence: {
    status: string;
    steps: Record<string, unknown>[];
    controlledSetting: ControlledSettingEvidence;
  };
}) {
  const otherMetadataCounts = () => ({
    generic: apiResponses.length,
    compact: compactApiResponses.length,
    quality: qualityApiResponses.length,
  });
  const fixture = CREDIT_CONTROLS_CASE;
  const pageUrl = `https://x.com/${fixture.handle}/status/${fixture.outer}`;
  const creditUrl = `https://x.com/${fixture.creditHandle}/status/${fixture.credit}`;
  const navigate = async () => {
    await page.goto(pageUrl);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    const structure = await page.locator(`[data-case="${fixture.route}"]`).evaluate((article) => {
      const quote = article.querySelector('[data-testid="quoteTweet"]');
      const video = quote?.querySelector('[data-video-key="quote-two"]');
      const credit = quote?.querySelector('[data-source-credit]');
      const c = article.querySelector('[data-credit-owned]');
      const media = c?.querySelector('[data-credit-media]');
      return {
        videoCount: quote?.querySelectorAll('[data-video-key]').length ?? 0,
        creditAdjacent: !!video && credit?.previousElementSibling === video,
        creditOutsideVideo: !!credit && !video?.contains(credit),
        cOwnArticle: c?.tagName === 'ARTICLE' && c?.getAttribute('data-testid') === 'tweet',
        cMediaInsideOwner: !!media && c?.contains(media),
        cMediaOutsideB: !!media && !quote?.contains(media),
      };
    });
    assert.deepEqual(structure, {
      videoCount: 1,
      creditAdjacent: true,
      creditOutsideVideo: true,
      cOwnArticle: true,
      cMediaInsideOwner: true,
      cMediaOutsideB: true,
    });
    return structure;
  };
  await withControlledFixtureVideoMode(extensionPage, evidence.controlledSetting, async () => {
    const structure = await navigate();
    const preview = page.locator(`[data-case="${fixture.route}"] [data-quote-target]`);
    await preview.scrollIntoViewIfNeeded();
    await preview.focus();
    const before = await quotedHostSnapshot(page, fixture.route, '[data-quote-target]');
    assert(before.active && before.scrollY > 0, 'B preview must hold focus below the fold');
    const hit = await preview.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return (
        document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) ===
        element
      );
    });
    assert.equal(hit, true, 'Ordinary B preview input must hit the preview');
    const bApiStart = quotedApiResponses.length;
    const rejectedStart = otherMetadataCounts();
    const input: Record<string, unknown> = {
      name: 'b-preview-input',
      pageUrl,
      structure,
      hit,
      before,
      depth: await quotedTargetDepth(preview),
      apiStartIndex: bApiStart,
      metadataBefore: rejectedStart,
    };
    evidence.steps.push(input);
    const clickCount = await page.evaluate(() => window.__quoteFixtureClicks.length);
    await preview.click();
    input.click = await quotedClickRecord(page, clickCount, 'img');
    let opened: Awaited<ReturnType<typeof assertQuotedGallery>>;
    try {
      opened = await assertQuotedGallery(page, fixture);
    } catch (error) {
      input.apiAfterFailure = quotedApiResponses.slice(bApiStart);
      input.metadataAfterFailure = otherMetadataCounts();
      input.galleryCountAfterFailure = await page.locator('[data-xeg-gallery-container]').count();
      throw error;
    }
    assert.equal(
      await assertQuotedOriginLink(
        opened.gallery,
        `https://x.com/${fixture.username}/status/${fixture.owner}`
      ),
      `https://x.com/${fixture.username}/status/${fixture.owner}`
    );
    await opened.gallery.locator('#tweet-text-button').click();
    const bText = await opened.gallery.locator('#toolbar-tweet-panel').textContent();
    await opened.gallery.locator('#tweet-text-button').click();
    assert(bText);
    assert(bText.includes(`${fixture.username} deterministic installed media`));
    assert(!bText.includes(`${fixture.creditHandle} deterministic installed media`));
    const initialVideo = await opened.video.evaluate((video) => {
      if (!(video instanceof HTMLVideoElement)) {
        throw new Error('Credit B video is missing');
      }
      return { paused: video.paused, time: video.currentTime };
    });
    assert(initialVideo.paused && initialVideo.time <= 0.05, 'B gallery must begin paused');
    await opened.video.click();
    await page.waitForFunction(
      ({ start, index }) => {
        const video = document.querySelector(
          `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${index}"] video`
        );
        return (
          video instanceof HTMLVideoElement &&
          !video.paused &&
          video.error === null &&
          video.currentTime >= start + 0.15
        );
      },
      { start: initialVideo.time, index: fixture.expectedPosition - 1 },
      { timeout: 15_000 }
    );
    const playbackEnd = await opened.video.evaluate((video) => {
      if (!(video instanceof HTMLVideoElement)) {
        throw new Error('Credit B video is missing');
      }
      return video.currentTime;
    });
    const bClose = await closeQuotedGallery({
      gallery: opened.gallery,
      page,
      method: 'escape',
      before,
      caseName: fixture.route,
      selector: '[data-quote-target]',
    });
    const bApi = quotedApiResponses.slice(bApiStart);
    assert.equal(bApi.length, 1, 'B media action must make one owning quote request');
    assert.deepEqual(
      bApi.map(({ tweetId, status }) => ({ tweetId, status })),
      [{ tweetId: fixture.owner, status: 200 }],
      'The enclosing B media permalink must request B directly'
    );
    assert.deepEqual(otherMetadataCounts(), rejectedStart);
    evidence.steps.push({
      name: 'b-video',
      structure,
      hit,
      selected: opened.selection,
      source: opened.selectedMedia,
      api: bApi,
      playbackStart: initialVideo.time,
      playbackEnd,
      close: bClose,
    });

    for (const method of ['pointer', 'keyboard'] as const) {
      await navigate();
      const credit = page.locator(`[data-case="${fixture.route}"] [data-source-credit]`);
      await credit.scrollIntoViewIfNeeded();
      await credit.focus();
      const target = await credit.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
        return { href: (element as HTMLAnchorElement).href, hit: hit === element };
      });
      assert.equal(target.href, creditUrl);
      assert(target.hit, 'C credit must be the actual pointer target');
      assert.equal(await credit.evaluate((element) => document.activeElement === element), true);
      const apiMark = quotedApiResponses.length;
      const rejectedMark = otherMetadataCounts();
      if (method === 'pointer') {
        await credit.click();
      } else {
        await credit.press('Enter');
      }
      await page.waitForURL(creditUrl);
      await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
      await page.waitForTimeout(200);
      assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
      assert.deepEqual(
        quotedApiResponses.slice(apiMark),
        [],
        'Credit navigation must not extract media'
      );
      assert.deepEqual(
        otherMetadataCounts(),
        rejectedMark,
        'Credit navigation must not extract through another metadata route'
      );
      evidence.steps.push({ name: 'c-credit-native', method, target, url: page.url(), api: [] });
    }

    for (const method of ['pointer', 'keyboard'] as const) {
      await navigate();
      const media = page.locator(`[data-case="${fixture.route}"] [data-credit-media]`);
      await media.scrollIntoViewIfNeeded();
      await media.focus();
      const beforeC = await quotedHostSnapshot(page, fixture.route, '[data-credit-media]');
      assert(
        beforeC.active && beforeC.scrollY > 0,
        'C media action must hold focus below the fold'
      );
      const target = await media.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
        const image = element.querySelector('img');
        return {
          href: (element as HTMLAnchorElement).href,
          hitInside: hit === image,
          decoded: image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
        };
      });
      assert.equal(target.href, `${creditUrl}/photo/1`);
      assert(target.hitInside && target.decoded, 'C media must be decoded and hit at its image');
      const apiMark = quotedApiResponses.length;
      const rejectedMark = otherMetadataCounts();
      if (method === 'pointer') {
        await media.click();
      } else {
        await media.press('Enter');
      }
      const gallery = page.locator('[data-xeg-gallery-container]');
      await gallery.waitFor({ state: 'visible', timeout: 15_000 });
      const selected = await assertQuotedSelection(page, {
        position: 1,
        total: 1,
        type: 'image',
        path: `/media/${fixture.creditPhoto}.jpg`,
      });
      const decoded = await waitForValue(async () => {
        const state = await gallery
          .locator('[data-gallery-element="item"][data-index="0"] img')
          .evaluate((image) => ({
            complete: image instanceof HTMLImageElement && image.complete,
            width: image instanceof HTMLImageElement ? image.naturalWidth : 0,
            height: image instanceof HTMLImageElement ? image.naturalHeight : 0,
            source: image instanceof HTMLImageElement ? image.currentSrc || image.src : '',
          }));
        return state.complete &&
          state.width > 0 &&
          state.height > 0 &&
          state.source === selected.source
          ? state
          : undefined;
      }, 'genuinely owned C decoded gallery image');
      const source = await assertQuotedOriginLink(gallery, creditUrl);
      await gallery.locator('#tweet-text-button').click();
      const cText = await gallery.locator('#toolbar-tweet-panel').textContent();
      await gallery.locator('#tweet-text-button').click();
      assert(cText);
      assert(cText.includes(`${fixture.creditHandle} deterministic installed media`));
      assert(!cText.includes(`${fixture.username} deterministic installed media`));
      const cClose = await closeQuotedGallery({
        gallery,
        page,
        method: 'escape',
        before: beforeC,
        caseName: fixture.route,
        selector: '[data-credit-media]',
      });
      const cApi = quotedApiResponses.slice(apiMark);
      assert.deepEqual(
        cApi.map(({ tweetId, status }) => ({ tweetId, status })),
        [{ tweetId: fixture.credit, status: 200 }]
      );
      assert.deepEqual(otherMetadataCounts(), rejectedMark);
      evidence.steps.push({
        name: 'c-owned-media',
        method,
        target,
        selected,
        decoded,
        source,
        api: cApi,
        close: cClose,
      });
    }
    evidence.status = 'passed';
    return evidence;
  });
}

function withNativeNotificationObserver(context: BrowserContext, extensionId: string) {
  return <T extends object>(
    action: (observer: Awaited<ReturnType<typeof observeNativeNotificationCreates>>) => Promise<T>
  ) =>
    async (): Promise<T> => {
      const observer = await observeNativeNotificationCreates(context, extensionId);
      try {
        return await action(observer);
      } finally {
        await observer.dispose();
      }
    };
}

async function installedContentRealm(context: BrowserContext, page: Page, extensionId: string) {
  const cdp = await context.newCDPSession(page);
  try {
    const contexts: Array<{
      id: number;
      name: string;
      origin: string;
      auxData?: { frameId?: string; isDefault?: boolean };
    }> = [];
    cdp.on('Runtime.executionContextCreated', ({ context: observed }) => {
      if (contexts.length < 32) {
        contexts.push(observed);
      }
    });
    const { frameTree } = await cdp.send('Page.getFrameTree');
    await cdp.send('Runtime.enable');
    const realm = await waitForValue(
      () => {
        const matching = contexts.filter(
          ({ origin, auxData }) =>
            (origin === `chrome-extension://${extensionId}` ||
              origin === `chrome-extension://${extensionId}/`) &&
            auxData?.frameId === frameTree.frame.id &&
            auxData.isDefault === false
        );
        assert(matching.length <= 1, 'Installed content realm is ambiguous');
        return matching[0];
      },
      'installed content realm for context-loss validation',
      5_000
    );
    return { cdp, realm: { id: realm.id, name: realm.name, origin: realm.origin } };
  } catch (error) {
    await cdp.detach().catch(() => undefined);
    throw error;
  }
}

async function installHeldNotificationReply(
  context: BrowserContext,
  page: Page,
  extensionId: string
) {
  const { cdp, realm } = await installedContentRealm(context, page, extensionId);
  const marker = randomUUID();
  let contextDestroyed = false;
  cdp.on('Runtime.executionContextDestroyed', ({ executionContextId }) => {
    if (executionContextId === realm.id) {
      contextDestroyed = true;
    }
  });
  cdp.on('Runtime.executionContextsCleared', () => {
    contextDestroyed = true;
  });
  try {
    const installed = await cdp.send('Runtime.evaluate', {
      contextId: realm.id,
      expression: `(() => {
        if (globalThis.__xegPlt05HeldReply) throw new Error('PLT-05 reply gate already installed');
        const original = chrome.runtime.sendMessage;
        const state = {
          marker: ${JSON.stringify(marker)}, original, wrapper: null, calls: [],
          overflow: false, replyReceived: false, replySuccess: null, released: false,
          release: null
        };
        state.wrapper = function(...args) {
          const message = args[0];
          if (!message || message.type !== 'SHOW_NOTIFICATION') {
            return Reflect.apply(original, this, args);
          }
          if (state.calls.length >= 4) state.overflow = true;
          else state.calls.push({ id: message.payload?.id ?? null, dispatchedAt: Date.now() });
          const dispatched = Reflect.apply(original, this, args);
          if (state.calls.length !== 1) return dispatched;
          const outcome = Promise.resolve(dispatched).then(
            value => {
              state.replyReceived = true;
              state.replySuccess = value?.success === true;
              return { ok: true, value };
            },
            error => {
              state.replyReceived = true;
              state.replySuccess = false;
              return { ok: false, error };
            }
          );
          return new Promise((resolve, reject) => {
            state.release = () => {
              if (state.released) return;
              state.released = true;
              void outcome.then(result => result.ok ? resolve(result.value) : reject(result.error));
            };
          });
        };
        chrome.runtime.sendMessage = state.wrapper;
        globalThis.__xegPlt05HeldReply = state;
        return { installed: chrome.runtime.sendMessage === state.wrapper, marker: state.marker };
      })()`,
      returnByValue: true,
    });
    assert.equal(installed.exceptionDetails, undefined, 'PLT-05 reply gate installation threw');
    assert.deepEqual(installed.result.value, { installed: true, marker });
    return {
      realm: { origin: realm.origin, name: realm.name },
      contextDestroyed: () => contextDestroyed,
      async snapshot() {
        const response = await cdp.send('Runtime.evaluate', {
          contextId: realm.id,
          expression: `(() => {
            const state = globalThis.__xegPlt05HeldReply;
            return state ? {
              marker: state.marker, calls: state.calls, overflow: state.overflow,
              replyReceived: state.replyReceived, replySuccess: state.replySuccess,
              released: state.released,
              wrapperIntact: chrome.runtime.sendMessage === state.wrapper
            } : null;
          })()`,
          returnByValue: true,
        });
        assert.equal(response.exceptionDetails, undefined, 'PLT-05 reply snapshot threw');
        const snapshot = response.result.value as {
          marker: string;
          calls: Array<{ id: string | null; dispatchedAt: number }>;
          overflow: boolean;
          replyReceived: boolean;
          replySuccess: boolean | null;
          released: boolean;
          wrapperIntact: boolean;
        } | null;
        assert(snapshot && snapshot.marker === marker, 'PLT-05 reply gate marker changed');
        assert.equal(snapshot.wrapperIntact, true, 'PLT-05 reply wrapper was replaced');
        assert.equal(snapshot.overflow, false, 'PLT-05 notification count overflowed');
        return snapshot;
      },
      async dispose() {
        let restored = false;
        try {
          if (!page.isClosed()) {
            const response = await cdp.send('Runtime.evaluate', {
              contextId: realm.id,
              expression: `(() => {
                const state = globalThis.__xegPlt05HeldReply;
                if (!state || state.marker !== ${JSON.stringify(marker)}) return false;
                state.release?.();
                chrome.runtime.sendMessage = state.original;
                const restored = chrome.runtime.sendMessage === state.original;
                delete globalThis.__xegPlt05HeldReply;
                return restored && !Object.hasOwn(globalThis, '__xegPlt05HeldReply');
              })()`,
              returnByValue: true,
            });
            assert.equal(
              response.exceptionDetails,
              undefined,
              'PLT-05 reply gate restoration threw'
            );
            restored = response.result.value === true;
            assert.equal(restored, true, 'PLT-05 reply gate did not restore runtime messaging');
          }
        } finally {
          await cdp.detach().catch((error: unknown) => {
            if (!page.isClosed()) {
              throw error;
            }
          });
        }
        return { restored, oldPageClosed: page.isClosed(), contextDestroyed };
      },
    };
  } catch (error) {
    if (!page.isClosed()) {
      await cdp
        .send('Runtime.evaluate', {
          contextId: realm.id,
          expression: `(() => {
          const state = globalThis.__xegPlt05HeldReply;
          if (!state || state.marker !== ${JSON.stringify(marker)}) return false;
          state.release?.();
          chrome.runtime.sendMessage = state.original;
          delete globalThis.__xegPlt05HeldReply;
          return chrome.runtime.sendMessage === state.original;
        })()`,
          returnByValue: true,
        })
        .catch(() => undefined);
    }
    await cdp.detach().catch(() => undefined);
    throw error;
  }
}

async function runInstalledContextLoss({
  context,
  extensionId,
  extensionPage,
  output,
  sequenceApiResponses,
  evidence,
}: {
  context: BrowserContext;
  extensionId: string;
  extensionPage: Page;
  output: string;
  sequenceApiResponses: ApiRecord[];
  evidence: ContextLossEvidence;
}) {
  let validationError: unknown;
  let receiptError: unknown;
  try {
    await withControlledFixtureVideoMode(extensionPage, evidence.setting, async () => {
      let oldPage: Page | undefined;
      let freshPage: Page | undefined;
      let held: Awaited<ReturnType<typeof installHeldNotificationReply>> | undefined;
      let observer: Awaited<ReturnType<typeof observeNativeNotificationCreates>> | undefined;
      let actionError: unknown;
      const cleanupErrors: unknown[] = [];
      try {
        const sequence = UNAVAILABLE_SEQUENCE;
        const failure = sequence.failures[0];
        assert(failure, 'PLT-05 unavailable fixture is missing');
        const url = `https://x.com/${sequence.handle}/status/${failure.outer}`;
        const priorDownloads = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
        oldPage = await context.newPage();
        await oldPage.goto(url);
        await oldPage.locator('html[data-xeg-gallery-ready="true"]').waitFor({
          state: 'attached',
          timeout: 15_000,
        });
        assert.equal(
          storedVideoClickMode((await readStoredVideoSettings(extensionPage)).settings),
          'allow-all',
          'PLT-05 preview must use its supported video-click mode'
        );
        observer = await observeNativeNotificationCreates(context, extensionId);
        const before = await observer.snapshot();
        held = await installHeldNotificationReply(context, oldPage, extensionId);
        const trigger = oldPage.locator(
          `[data-sequence-step="${failure.name}"] .media-shell button`
        );
        await trigger.scrollIntoViewIfNeeded();
        await oldPage.evaluate(() => window.scrollBy(0, -100));
        await trigger.focus();
        const hit = await trigger.evaluate((button) => {
          const rect = button.getBoundingClientRect();
          const x = Math.round(rect.left + rect.width * 0.2);
          const y = Math.round(rect.top + rect.height * 0.2);
          const article = button.closest('[data-sequence-step]');
          return {
            x,
            y,
            hit: document.elementFromPoint(x, y) === button,
            focused: document.activeElement === button,
            poster: article?.querySelector('video')?.poster ?? null,
            sourceCount: article?.querySelectorAll('video source').length ?? -1,
            imageCount: article?.querySelectorAll('img').length ?? -1,
          };
        });
        assert.equal(hit.hit, true, 'PLT-05 first click must hit the actual preview button');
        assert.equal(hit.focused, true, 'PLT-05 first preview must have ordinary focus');
        assert.equal(
          hit.poster,
          `https://pbs.twimg.com/ext_tw_video_thumb/${failure.outer}/pu/img/unavailable.jpg`
        );
        assert.equal(hit.sourceCount, 0);
        assert.equal(hit.imageCount, 0);
        evidence.oldPage = { url, tweetId: failure.outer, hit, realm: held.realm };

        const apiMark = sequenceApiResponses.length;
        await oldPage.mouse.click(hit.x, hit.y);
        const pending = await waitForValue(
          async () => {
            const snapshot = await held?.snapshot();
            return snapshot?.calls.length === 1 && snapshot.replyReceived ? snapshot : undefined;
          },
          'one installed SHOW_NOTIFICATION exchange with held content reply',
          15_000
        );
        assert.equal(pending.replySuccess, true, 'Real background notification reply must succeed');
        assert.equal(pending.released, false, 'Content reply must remain held before tab closure');
        const calls = notificationCallsSince(before, await observer.snapshot());
        assert.equal(calls.length, 1, 'First click must dispatch one real background notification');
        assert.equal(pending.calls[0]?.id, calls[0]?.id);
        const api = sequenceApiResponses.slice(apiMark);
        assert.deepEqual(
          api.map(({ tweetId, status, resultTypename }) => [tweetId, status, resultTypename]),
          [[failure.outer, 200, failure.typename]],
          'First click must make one owned HTTP 200 unavailable response'
        );
        assert.equal(await oldPage.locator('[data-xeg-gallery-container]').count(), 0);
        assert.deepEqual(
          (await queryDownloads(extensionPage)).filter(({ id }) => !priorDownloads.has(id)),
          [],
          'Unavailable preview must not start a privileged download'
        );
        evidence.heldExchange = {
          status: 'background-replied-content-held',
          calls: pending.calls,
          replyReceived: pending.replyReceived,
          replySuccess: pending.replySuccess,
          released: pending.released,
          nativeCreate: calls.map(({ id, createdAt }) => ({ id, createdAt })),
          api,
          galleryOpen: false,
          nativeDownloadsCreated: 0,
        };

        await oldPage.close();
        evidence.cleanup.oldPageClosed = oldPage.isClosed();
        assert.equal(evidence.cleanup.oldPageClosed, true, 'PLT-05 owned tab must close');
        const afterClose = notificationCallsSince(before, await observer.snapshot());
        assert.equal(afterClose.length, 1, 'Closed tab must not dispatch another notification');
        const releasedRealm = await held.dispose();
        held = undefined;
        evidence.cleanup.hookReleasedOrContextClosed = releasedRealm.oldPageClosed;
        evidence.closedContext = {
          tabClosed: releasedRealm.oldPageClosed,
          destroyedEventObserved: releasedRealm.contextDestroyed,
          nativeCreateCountAfterClose: afterClose.length,
        };

        freshPage = await context.newPage();
        await freshPage.goto(url);
        await freshPage.locator('html[data-xeg-gallery-ready="true"]').waitFor({
          state: 'attached',
          timeout: 15_000,
        });
        const freshRealm = await installedContentRealm(context, freshPage, extensionId);
        let markerAbsent = false;
        try {
          const marker = await freshRealm.cdp.send('Runtime.evaluate', {
            contextId: freshRealm.realm.id,
            expression: `!Object.hasOwn(globalThis, '__xegPlt05HeldReply')`,
            returnByValue: true,
          });
          assert.equal(
            marker.exceptionDetails,
            undefined,
            'Fresh content realm marker query threw'
          );
          markerAbsent = marker.result.value === true;
          assert.equal(markerAbsent, true, 'Fresh content realm retained the retired reply gate');
        } finally {
          await freshRealm.cdp.detach();
        }
        const control = sequence.control;
        const freshTrigger = freshPage.locator(
          '[data-sequence-step="control"] [data-preplayer-media] button'
        );
        await freshTrigger.scrollIntoViewIfNeeded();
        await freshPage.evaluate(() => window.scrollBy(0, -100));
        await freshTrigger.focus();
        const hostBefore = await quotedHostSnapshot(
          freshPage,
          'control',
          '[data-preplayer-media] button'
        );
        assert.equal(hostBefore.active, true);
        assert(hostBefore.scrollY > 0, 'Fresh page host scroll must be observable');
        const freshHit = await freshTrigger.evaluate((button) => {
          const rect = button.getBoundingClientRect();
          const x = Math.round(rect.left + rect.width * 0.2);
          const y = Math.round(rect.top + rect.height * 0.2);
          return { x, y, hit: document.elementFromPoint(x, y) === button };
        });
        assert.equal(freshHit.hit, true, 'Fresh ordinary click must hit the healthy preview');
        const freshApiMark = sequenceApiResponses.length;
        await freshPage.mouse.click(freshHit.x, freshHit.y);
        const opened = await assertQuotedGallery(freshPage, control);
        const freshApi = sequenceApiResponses.slice(freshApiMark);
        assert.deepEqual(
          freshApi.map(({ tweetId, status, resultTypename }) => [tweetId, status, resultTypename]),
          [[control.outer, 200, 'Tweet']],
          'Fresh tab must make one healthy owner-specific HTTP request'
        );
        const origin = await assertQuotedOriginLink(
          opened.gallery,
          `https://x.com/${control.username}/status/${control.owner}`
        );
        const readiness = await opened.video.evaluate((video) => {
          if (!(video instanceof HTMLVideoElement)) {
            throw new Error('Fresh gallery video is missing');
          }
          return {
            paused: video.paused,
            time: video.currentTime,
            width: video.videoWidth,
            height: video.videoHeight,
            error: video.error?.code ?? null,
          };
        });
        assert.equal(readiness.paused, true, 'Fresh gallery video must start paused');
        assert(readiness.time <= 0.1, 'Fresh gallery video must start at the beginning');
        assert.equal(readiness.error, null);
        await opened.video.click();
        await freshPage.waitForFunction(
          ({ index, start }) => {
            const video = document.querySelector(
              `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${index}"] video`
            );
            return (
              video instanceof HTMLVideoElement &&
              !video.paused &&
              video.error === null &&
              video.videoWidth > 0 &&
              video.videoHeight > 0 &&
              video.currentTime > start + 0.15
            );
          },
          { index: control.expectedPosition - 1, start: readiness.time },
          { timeout: 15_000 }
        );
        const progress = await opened.video.evaluate((video) => {
          if (!(video instanceof HTMLVideoElement)) {
            throw new Error('Fresh gallery video is missing after ordinary Play');
          }
          return {
            paused: video.paused,
            time: video.currentTime,
            width: video.videoWidth,
            height: video.videoHeight,
            error: video.error?.code ?? null,
          };
        });
        assert.equal(progress.paused, false, 'Fresh gallery video must keep playing');
        assert(progress.time > readiness.time + 0.15, 'Fresh gallery playback must progress');
        assert(progress.width > 0 && progress.height > 0, 'Fresh gallery video must decode');
        assert.equal(progress.error, null);
        const close = await closeQuotedGallery({
          gallery: opened.gallery,
          page: freshPage,
          method: 'escape',
          before: hostBefore,
          caseName: 'control',
          selector: '[data-preplayer-media] button',
        });
        const afterFresh = notificationCallsSince(before, await observer.snapshot());
        assert.equal(
          afterFresh.filter(({ id }) => id === calls[0]?.id).length,
          1,
          'Fresh tab must not replay the retired notification ID'
        );
        assert.equal(
          afterFresh.length,
          1,
          'Fresh tab must not create any additional native notification'
        );
        evidence.freshPage = {
          url,
          realm: { name: freshRealm.realm.name, origin: freshRealm.realm.origin, markerAbsent },
          hit: freshHit,
          api: freshApi,
          selected: opened.selectedMedia,
          selection: opened.selection,
          origin,
          readiness,
          progress,
          close,
          nativeCreateCountAfterFresh: afterFresh.length,
          retiredNotificationIdRepeats: 0,
        };
      } catch (error) {
        actionError = error;
      } finally {
        if (held) {
          try {
            const result = await held.dispose();
            evidence.cleanup.hookReleasedOrContextClosed = result.restored || result.oldPageClosed;
          } catch (error) {
            cleanupErrors.push(error);
          }
        }
        for (const [name, page] of [
          ['oldPage', oldPage],
          ['freshPage', freshPage],
        ] as const) {
          if (!page) {
            continue;
          }
          try {
            if (!page.isClosed()) {
              await page.close();
            }
            if (name === 'oldPage') {
              evidence.cleanup.oldPageClosed = page.isClosed();
            } else {
              evidence.cleanup.freshPageClosed = page.isClosed();
            }
          } catch (error) {
            cleanupErrors.push(error);
          }
        }
        if (observer) {
          try {
            await observer.dispose();
            evidence.cleanup.observerRestored = true;
          } catch (error) {
            cleanupErrors.push(error);
          }
        }
        evidence.cleanup.errors = cleanupErrors.map(safeError);
      }
      if (actionError && cleanupErrors.length) {
        throw new AggregateError(
          [actionError, ...cleanupErrors],
          'PLT-05 validation and cleanup failed'
        );
      }
      if (actionError) {
        throw actionError;
      }
      if (cleanupErrors.length) {
        throw new AggregateError(cleanupErrors, 'PLT-05 cleanup failed');
      }
      return evidence;
    });
    evidence.status = 'passed';
  } catch (error) {
    evidence.status = 'failed';
    evidence.error = safeError(error);
    validationError = error;
  } finally {
    try {
      await writeFile(
        join(output, 'plt05-context-loss-observations.json'),
        JSON.stringify(evidence, null, 2)
      );
    } catch (error) {
      receiptError = error;
    }
  }
  if (validationError && receiptError) {
    throw new AggregateError(
      [validationError, receiptError],
      'PLT-05 validation and receipt failed'
    );
  }
  if (validationError) {
    throw validationError;
  }
  if (receiptError) {
    throw receiptError;
  }
  return evidence;
}

async function runUnavailableSequence({
  apiResponses,
  extensionId,
  extensionPage,
  output,
  page,
  sequenceApiResponses,
  getUnavailableApiOverflow,
  settingEvidence,
  evidence,
}: {
  apiResponses: ApiRecord[];
  extensionId: string;
  extensionPage: Page;
  output: string;
  page: Page;
  sequenceApiResponses: ApiRecord[];
  getUnavailableApiOverflow: () => number;
  settingEvidence: ControlledSettingEvidence;
  evidence: UnavailableEvidence;
}) {
  const withObserver = withNativeNotificationObserver(page.context(), extensionId);
  const action = withObserver(async (notificationObserver) => {
    const sequence = UNAVAILABLE_SEQUENCE;
    const firstFailure = sequence.failures[0];
    assert(firstFailure, 'Unavailable sequence has no first failure');
    const pageUrl = `https://x.com/${sequence.handle}/status/${firstFailure.outer}`;
    await page.goto(pageUrl);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
      state: 'attached',
      timeout: 15_000,
    });
    const effectiveMode = storedVideoClickMode(
      (await readStoredVideoSettings(extensionPage)).settings
    );
    assert.equal(
      effectiveMode,
      'allow-all',
      'Unavailable sequence must retain supported allow-all preview clicks'
    );
    const documentStartedAt = await page.evaluate(() => performance.timeOrigin);
    evidence.pageUrl = pageUrl;
    evidence.documentStartedAt = documentStartedAt;
    evidence.steps = [];
    evidence.mode = 'allow-all';
    const apiStart = sequenceApiResponses.length;
    const rejectedStart = apiResponses.length;
    const sequenceStartedAt = performance.now();
    const assertSameDocument = async () => {
      assert.equal(page.url(), pageUrl, 'Sequence must retain the exact fixture URL');
      assert.equal(
        await page.evaluate(() => performance.timeOrigin),
        documentStartedAt,
        'Sequence must retain one document and content-script lifetime'
      );
    };
    for (const failure of sequence.failures) {
      await assertSameDocument();
      const step: UnavailableStep = {
        name: failure.name,
        tweetId: failure.outer,
        typename: failure.typename,
        status: 'started',
      };
      evidence.steps.push(step);
      const article = page.locator(`[data-sequence-step="${failure.name}"]`);
      const trigger = article.locator('.media-shell button');
      await trigger.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, -100));
      await trigger.focus();
      const preview = await article.evaluate((element) => {
        const video = element.querySelector('video');
        const button = element.querySelector('button');
        const rect = button?.getBoundingClientRect();
        const x = rect ? Math.round(rect.left + rect.width * 0.2) : -1;
        const y = rect ? Math.round(rect.top + rect.height * 0.2) : -1;
        return {
          poster: video?.poster ?? null,
          src: video?.getAttribute('src') ?? null,
          sourceCount: video?.querySelectorAll('source').length ?? -1,
          imageCount: element.querySelectorAll('img').length,
          hit: document.elementFromPoint(x, y) === button,
          x,
          y,
        };
      });
      assert.equal(
        preview.poster,
        `https://pbs.twimg.com/ext_tw_video_thumb/${failure.outer}/pu/img/unavailable.jpg`,
        'Unavailable preview must have one trusted video poster'
      );
      assert.equal(preview.src, null, 'Unavailable preview must have no playable DOM source');
      assert.equal(preview.sourceCount, 0);
      assert.equal(preview.imageCount, 0, 'Unavailable preview must have no DOM image fallback');
      assert.equal(preview.hit, true, 'Failure click must hit the ordinary preview button');
      step.preview = { trustedPoster: true, sourceCount: 0, imageCount: 0, hit: true };
      const knownNotifications = await extensionPage.evaluate(async () =>
        Object.keys(await chrome.notifications.getAll())
      );
      const requestIndex = sequenceApiResponses.length;
      step.clickedAt = new Date().toISOString();
      await page.mouse.click(preview.x, preview.y);
      const notification = await waitForValue(
        async () =>
          extensionPage.evaluate(async (known) => {
            const active = await chrome.notifications.getAll();
            const entry = Object.entries(active).find(
              ([id]) => id.startsWith('xeg-') && !known.includes(id)
            );
            return entry ? { id: entry[0] } : undefined;
          }, knownNotifications),
        `${failure.name} extraction completion`
      );
      step.completedAt = new Date().toISOString();
      const created = await waitForValue(async () => {
        const snapshot = await notificationObserver.snapshot();
        return snapshot.calls.find((call) => call.id === notification.id);
      }, `${failure.name} native notification creation`);
      assert(typeof created.message === 'string');
      step.notification = { id: notification.id, message: created.message };
      step.api = sequenceApiResponses.slice(requestIndex);
      assert.deepEqual(
        step.api.map(({ tweetId, status }) => [tweetId, status]),
        [[failure.outer, 200]],
        `${failure.name} must finish one healthy HTTP response`
      );
      const firstApi = step.api[0];
      assert(firstApi, 'Unavailable sequence API response is missing');
      assert.equal(firstApi.resultTypename, failure.typename);
      assert.equal(firstApi.providerErrors, 0);
      assert.equal(
        firstApi.fulfilledAt !== undefined,
        true,
        `${failure.name} response must finish before the next click`
      );
      assert.equal(
        await page.locator('[data-xeg-gallery-container]').count(),
        0,
        `${failure.name} must fail extraction instead of opening DOM fallback media`
      );
      const recovery = page.locator('[data-xeg-error-boundary]');
      if (await recovery.count()) {
        await recovery.locator('[data-xeg-error-action="close"]').click();
        await recovery.waitFor({ state: 'detached' });
        step.recoveryClosedThroughUi = true;
      }
      await assertSameDocument();
      step.status = 'failed-extraction-completed';
    }
    assert(
      performance.now() - sequenceStartedAt < 60_000,
      'Available control must run before the circuit reset interval'
    );
    const control = sequence.control;
    const step: UnavailableStep = {
      name: 'available-control',
      tweetId: control.outer,
      status: 'started',
    };
    evidence.steps.push(step);
    const trigger = page.locator('[data-sequence-step="control"] [data-preplayer-media] button');
    await trigger.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -100));
    await trigger.focus();
    const before = await quotedHostSnapshot(page, 'control', '[data-preplayer-media] button');
    assert.equal(before.active, true);
    assert(before.scrollY > 0);
    const hit = await trigger.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      const x = Math.round(rect.left + rect.width * 0.2);
      const y = Math.round(rect.top + rect.height * 0.2);
      return { x, y, button: document.elementFromPoint(x, y) === button };
    });
    assert.equal(hit.button, true);
    const requestIndex = sequenceApiResponses.length;
    step.clickedAt = new Date().toISOString();
    await page.mouse.click(hit.x, hit.y);
    const opened = await assertQuotedGallery(page, control);
    step.api = sequenceApiResponses.slice(requestIndex);
    assert.deepEqual(
      step.api.map(({ tweetId, status }) => [tweetId, status]),
      [[control.outer, 200]],
      'Fourth click must make a fresh HTTP request for available A'
    );
    const controlApi = step.api[0];
    assert(
      controlApi && typeof controlApi.requestedAtMonotonicMs === 'number',
      'Available control API request is missing'
    );
    assert.equal(controlApi.resultTypename, 'Tweet');
    assert.equal(controlApi.providerErrors, 0);
    assert.equal(controlApi.fulfilledAt !== undefined, true);
    evidence.durationToFourthRequestMs = controlApi.requestedAtMonotonicMs - sequenceStartedAt;
    assert(
      evidence.durationToFourthRequestMs >= 0 && evidence.durationToFourthRequestMs < 60_000,
      'The actual fourth HTTP request must precede the circuit cooldown'
    );
    const originUrl = await assertQuotedOriginLink(
      opened.gallery,
      `https://x.com/${control.username}/status/${control.owner}`
    );
    await opened.gallery.locator('#tweet-text-button').click();
    const text = await opened.gallery.locator('#toolbar-tweet-panel').textContent();
    assert(
      text?.includes(`${control.username} deterministic installed media`),
      'Available control must retain B text'
    );
    assert(text, 'Available control text panel is missing');
    assert(
      !text.includes('credit_preplay deterministic installed media'),
      'Available control must not attribute B video to C'
    );
    await opened.gallery.locator('#tweet-text-button').click();
    const playbackStart = await opened.video.evaluate((video) => {
      if (!(video instanceof HTMLVideoElement)) {
        throw new Error('Available control video is missing');
      }
      return video.currentTime;
    });
    await opened.video.click();
    await page.waitForFunction(
      ({ index, start }) => {
        const video = document.querySelector(
          `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${index}"] video`
        );
        return (
          video instanceof HTMLVideoElement &&
          !video.paused &&
          video.error === null &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          video.currentTime >= start + 0.15
        );
      },
      { index: control.expectedPosition - 1, start: playbackStart },
      { timeout: 15_000 }
    );
    const playbackEnd = await opened.video.evaluate((video) => {
      if (!(video instanceof HTMLVideoElement)) {
        throw new Error('Available control video is missing');
      }
      return video.currentTime;
    });
    await page.screenshot({ path: join(output, 'quoted-unavailable-sequence-gallery.png') });
    const close = await closeQuotedGallery({
      gallery: opened.gallery,
      page,
      method: 'escape',
      before,
      caseName: 'control',
      selector: '[data-preplayer-media] button',
    });
    await assertSameDocument();
    assert.deepEqual(
      sequenceApiResponses.slice(apiStart).map(({ tweetId }) => tweetId),
      [...sequence.failures.map(({ outer }) => outer), control.outer],
      'Sequence must make exactly four ordered requests in one document'
    );
    assert.deepEqual(
      apiResponses.slice(rejectedStart),
      [],
      'Sequence must not make rejected or unexpected API requests'
    );
    assert.equal(
      getUnavailableApiOverflow(),
      0,
      'Sequence API diagnostic count must stay within its bounded record capacity'
    );
    step.selected = opened.selectedMedia;
    step.selection = opened.selection;
    step.originUrl = originUrl;
    step.textOwner = control.username;
    step.playbackStart = playbackStart;
    step.playbackEnd = playbackEnd;
    step.close = close;
    step.completedAt = new Date().toISOString();
    step.status = 'passed';
    evidence.status = 'passed';
    await page.screenshot({ path: join(output, 'quoted-unavailable-sequence-after.png') });
    return evidence;
  });
  return withControlledFixtureVideoMode(extensionPage, settingEvidence, action);
}

async function runCapacityNotificationCase({
  extensionId,
  extensionPage,
  page,
  genericMessage,
  settingEvidence,
}: {
  extensionId: string;
  extensionPage: Page;
  page: Page;
  genericMessage: string;
  settingEvidence: ControlledSettingEvidence;
}) {
  const withObserver = withNativeNotificationObserver(page.context(), extensionId);
  const action = withObserver(async (notificationObserver) => {
    assert(genericMessage.length > 0 && !genericMessage.startsWith(CAPACITY_MESSAGE));
    const pageUrl = page.url();
    const documentStartedAt = await page.evaluate(() => performance.timeOrigin);
    const body = JSON.stringify({ padding: 'x'.repeat(2 * 1024 * 1024) });
    const encodedBytes = Buffer.byteLength(body);
    assert(encodedBytes > 2 * 1024 * 1024);
    const requests: { method: string; encodedBytes: number; fulfilled: boolean }[] = [];
    const routeHandler = async (route: Route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'x.com' || !url.pathname.endsWith('/TweetResultByRestId')) {
        await route.fallback();
        return;
      }
      let variables: { tweetId?: string };
      try {
        variables = JSON.parse(url.searchParams.get('variables') ?? '{}');
      } catch {
        await route.fallback();
        return;
      }
      if (variables?.tweetId !== CAPACITY_TWEET_ID) {
        await route.fallback();
        return;
      }
      assert(requests.length < 2, 'Capacity fixture made more than one API request');
      const record = { method: route.request().method(), encodedBytes, fulfilled: false };
      requests.push(record);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
      record.fulfilled = true;
    };
    await page.context().route('**/TweetResultByRestId*', routeHandler);
    try {
      const article = page.locator('[data-sequence-step="capacity"]');
      const trigger = article.locator('.media-shell button');
      await trigger.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, -100));
      await trigger.focus();
      const preview = await article.evaluate((element) => {
        const video = element.querySelector('video');
        const button = element.querySelector('button');
        const rect = button?.getBoundingClientRect();
        const x = rect ? Math.round(rect.left + rect.width * 0.2) : -1;
        const y = rect ? Math.round(rect.top + rect.height * 0.2) : -1;
        return {
          poster: video?.poster ?? null,
          src: video?.getAttribute('src') ?? null,
          sourceCount: video?.querySelectorAll('source').length ?? -1,
          imageCount: element.querySelectorAll('img').length,
          hit: document.elementFromPoint(x, y) === button,
          x,
          y,
        };
      });
      assert.equal(
        preview.poster,
        `https://pbs.twimg.com/ext_tw_video_thumb/${CAPACITY_TWEET_ID}/pu/img/unavailable.jpg`
      );
      assert.equal(preview.src, null);
      assert.equal(preview.sourceCount, 0);
      assert.equal(preview.imageCount, 0);
      assert.equal(preview.hit, true);
      const knownNotifications = await extensionPage.evaluate(async () =>
        Object.keys(await chrome.notifications.getAll())
      );
      await page.mouse.click(preview.x, preview.y);
      const notification = await waitForValue(
        () =>
          extensionPage.evaluate(async (known) => {
            const active = await chrome.notifications.getAll();
            const entry = Object.entries(active).find(
              ([id]) => id.startsWith('xeg-') && !known.includes(id)
            );
            return entry ? { id: entry[0] } : undefined;
          }, knownNotifications),
        'installed capacity notification'
      );
      const created = await waitForValue(async () => {
        const snapshot = await notificationObserver.snapshot();
        return snapshot.calls.find((call) => call.id === notification.id);
      }, 'installed capacity notification creation');
      assert(
        created.message?.startsWith(CAPACITY_MESSAGE),
        'Installed extension did not report the metadata capacity category'
      );
      assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
      assert.equal(page.url(), pageUrl);
      assert.equal(await page.evaluate(() => performance.timeOrigin), documentStartedAt);
      assert.deepEqual(requests, [{ method: 'GET', encodedBytes, fulfilled: true }]);
      const recovery = page.locator('[data-xeg-error-boundary]');
      if (await recovery.count()) {
        await recovery.locator('[data-xeg-error-action="close"]').click();
        await recovery.waitFor({ state: 'detached' });
      }
      return {
        status: 'passed',
        tweetId: CAPACITY_TWEET_ID,
        requests,
        notification: { id: notification.id, message: created.message },
        genericMessage,
      };
    } finally {
      await page.context().unroute('**/TweetResultByRestId*', routeHandler);
    }
  });
  return withControlledFixtureVideoMode(extensionPage, settingEvidence, action);
}

async function runSvgTargetMatrix({
  extensionPage,
  output,
  page,
  quotedApiResponses,
}: {
  extensionPage: Page;
  output: string;
  page: Page;
  quotedApiResponses: ApiRecord[];
}) {
  const controlledSetting: ControlledSettingEvidence = {};
  return withControlledFixtureVideoMode(extensionPage, controlledSetting, async () => {
    const quotedCase = PUBLIC_PREPLAYER_CASE;
    const pageUrl = `https://x.com/${quotedCase.handle}/status/${quotedCase.outer}`;
    const targets = [
      { name: 'padding', tag: 'button' },
      { name: 'text', tag: 'span' },
      { name: 'svg', tag: 'svg' },
      { name: 'path', tag: 'path' },
    ];
    const cases = [];
    for (const target of targets) {
      await page.goto(pageUrl);
      await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
      const button = page.locator('[data-preplayer-media] button');
      await button.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, -120));
      await button.focus();
      const before = await quotedHostSnapshot(
        page,
        quotedCase.route,
        '[data-preplayer-media] button'
      );
      const hit = await button.evaluate((element, name) => {
        const rect = element.getBoundingClientRect();
        const child =
          name === 'text'
            ? element.querySelector('span')
            : name === 'svg' || name === 'path'
              ? element.querySelector(name)
              : element;
        if (!child) {
          throw new Error('SVG target fixture child is missing');
        }
        const childRect = child.getBoundingClientRect();
        const x =
          name === 'padding'
            ? rect.left + 10
            : name === 'svg'
              ? childRect.left + 2
              : childRect.left + childRect.width / 2;
        const y =
          name === 'padding'
            ? rect.top + 10
            : name === 'svg'
              ? childRect.top + 2
              : childRect.top + childRect.height / 2;
        return { x, y, actualTag: document.elementFromPoint(x, y)?.tagName.toLowerCase() };
      }, target.name);
      assert.equal(
        hit.actualTag,
        target.tag,
        `${target.name}: real hit-test must reach the intended event target`
      );
      const apiStart = quotedApiResponses.length;
      await captureQuotedOpeningScroll(button);
      await page.mouse.click(hit.x, hit.y);
      const pending = await writeVideoBoundaryCheckpoint({
        output,
        name: `svg-${target.name}`,
        page,
        api: quotedApiResponses.slice(apiStart),
      });
      before.scrollY = Number(await button.getAttribute('data-opening-scroll-y'));
      assert(Number.isFinite(before.scrollY) && before.scrollY > 0);
      const gallery = await assertQuotedGallery(page, quotedCase);
      await page.waitForTimeout(10);
      const clicks = await page.evaluate(() => window.__preplayerFixtureClicks);
      assert(clicks, 'Preplayer click history is missing');
      assert.equal(
        clicks.length,
        1,
        `${target.name}: exactly one trusted fixture click must be recorded`
      );
      const click = clicks[0];
      assert(click, 'Preplayer trusted click is missing');
      assert.equal(
        click.tag,
        target.tag,
        `${target.name}: the actual event target must match the hit test`
      );
      assert.equal(
        click.prevented,
        true,
        `${target.name}: the original trusted event must open the gallery`
      );
      assert.equal(click.path[0], target.tag);
      assert(
        click.path.includes('button'),
        `${target.name}: composed path must include the eligible button`
      );
      const originUrl = await assertQuotedOriginLink(
        gallery.gallery,
        `https://x.com/${quotedCase.username}/status/${quotedCase.owner}`
      );
      const close = await closeQuotedGallery({
        gallery: gallery.gallery,
        page,
        method: 'escape',
        before,
        caseName: quotedCase.route,
        selector: '[data-preplayer-media] button',
      });
      cases.push({
        target: target.name,
        hit,
        pending,
        clicks,
        selected: gallery.selectedMedia,
        originUrl,
        api: quotedApiResponses.slice(apiStart),
        close,
      });
    }
    await page.screenshot({ path: join(output, 'quoted-svg-targets-after.png') });
    return { status: 'passed', mode: 'allow-all', cases, controlledSetting };
  });
}

export function notificationCallsSince(
  cursor: NativeNotificationSnapshot,
  observed: NativeNotificationSnapshot
) {
  assert(
    cursor?.observerId && cursor.observerId === observed?.observerId,
    'Notification observation identity must remain available'
  );
  assert.equal(cursor.apiIntact, true, 'Notification observer must own its native boundary');
  assert.equal(observed.apiIntact, true, 'Notification observer must retain its native boundary');
  assert.equal(cursor.overflow, false, 'Notification baseline must not overflow');
  assert.equal(observed.overflow, false, 'Notification observation must not overflow');
  assert(
    Array.isArray(cursor.calls) && Array.isArray(observed.calls),
    'Notification observation history must be available'
  );
  assert.deepEqual(
    observed.calls.slice(0, cursor.calls.length),
    cursor.calls,
    'Notification observation must retain its complete baseline history'
  );
  return observed.calls.slice(cursor.calls.length);
}

export function assertNoRetiredExtractionNotifications(
  cursor: NativeNotificationSnapshot,
  observed: NativeNotificationSnapshot
) {
  const creates = notificationCallsSince(cursor, observed);
  assert.equal(
    creates.length,
    0,
    `Retired extraction must make zero notification-creation calls: ${JSON.stringify(creates)}`
  );
  return creates;
}

async function observeNativeNotificationCreates(
  context: BrowserContext,
  extensionId: string,
  suppress = false
) {
  const worker = context
    .serviceWorkers()
    .find((item) => item.url() === `chrome-extension://${extensionId}/background.js`);
  assert(worker, 'Installed worker must be available for the native notification observer');
  const observerId = randomUUID();
  await worker.evaluate(
    ({ id, suppress }) => {
      if (globalThis.__xegInstalledNotificationObserver) {
        throw new Error('Bounded native notification observer already installed');
      }
      const original = chrome.notifications.create;
      const state: NativeNotificationState = {
        observerId: id,
        original,
        calls: [],
        overflow: false,
        wrapper: null,
      };
      globalThis.__xegInstalledNotificationObserver = state;
      state.wrapper = function (this: unknown, ...args: Parameters<ChromeNotificationCreate>) {
        const [id, options] = args;
        if (typeof id === 'string' && id.startsWith('xeg-')) {
          if (state.calls.length < 8) {
            state.calls.push({
              id,
              createdAt: Date.now(),
              title: options?.title ?? null,
              message: options?.message ?? null,
            });
          } else {
            state.overflow = true;
          }
        }
        if (suppress && typeof id === 'string' && id.startsWith('xeg-')) {
          return Promise.resolve(id);
        }
        return Reflect.apply(original, this, args);
      };
      chrome.notifications.create = state.wrapper;
    },
    { id: observerId, suppress }
  );
  return {
    async snapshot() {
      const state = await worker.evaluate(async () => {
        // The native query yields to queued worker/API work before the final history read.
        const active = await chrome.notifications.getAll();
        const current = globalThis.__xegInstalledNotificationObserver;
        return current
          ? {
              observerId: current.observerId,
              calls: current.calls,
              apiIntact: chrome.notifications.create === current.wrapper,
              overflow: current.overflow,
              activeIds: Object.keys(active),
              sampledAt: Date.now(),
            }
          : null;
      });
      assert(state, 'Native notification observer marker disappeared');
      assert.equal(state.observerId, observerId, 'Native notification observer was replaced');
      assert.equal(state.apiIntact, true, 'Native notification observer API was replaced');
      assert.equal(
        state.overflow,
        false,
        'Native notification observer exceeded its bounded capacity'
      );
      return state;
    },
    async dispose() {
      const restored = await worker.evaluate(() => {
        const state = globalThis.__xegInstalledNotificationObserver;
        if (!state) {
          return { markerPresent: false, originalRestored: false, markerGone: true };
        }
        chrome.notifications.create = state.original;
        const originalRestored = chrome.notifications.create === state.original;
        Reflect.deleteProperty(globalThis, '__xegInstalledNotificationObserver');
        return {
          markerPresent: true,
          originalRestored,
          markerGone: !Object.hasOwn(globalThis, '__xegInstalledNotificationObserver'),
        };
      });
      assert.deepEqual(
        restored,
        { markerPresent: true, originalRestored: true, markerGone: true },
        'Native notification observer must restore the original create API'
      );
      return restored;
    },
  };
}

async function verifyTransientNotificationControl(
  extensionPage: Page,
  observer: Awaited<ReturnType<typeof observeNativeNotificationCreates>>,
  cursor: NativeNotificationSnapshot
) {
  const id = `xeg-transient-control-${randomUUID()}`;
  let cleared: boolean | undefined;
  let evidence: Record<string, unknown> | undefined;
  let validationError: unknown;
  let validationSeen = false;
  let cleanupError: unknown;
  let cleanupSeen = false;
  try {
    for (const message of ['Transient control', 'Replacement control']) {
      const response = await extensionPage.evaluate(
        (payload) => chrome.runtime.sendMessage({ type: 'SHOW_NOTIFICATION', payload }),
        { id, title: 'XEG assertion sensitivity control', message }
      );
      assert.deepEqual(
        response,
        { success: true },
        'Native control notification must be delivered'
      );
    }
    cleared = await extensionPage.evaluate(
      (notificationId) => chrome.notifications.clear(notificationId),
      id
    );
    assert.equal(cleared, true, 'Transient native control must be cleared');
    const observed = await observer.snapshot();
    const finalActive = observed.activeIds.includes(id);
    assert.equal(
      finalActive,
      false,
      'Transient control must be absent from the final active-notification list'
    );
    const creates = notificationCallsSince(cursor, observed);
    assert.equal(creates.length, 2, 'Repeated native ID must retain both creation calls');
    assert(creates.every((call) => call.id === id));
    assert.throws(
      () => assertNoRetiredExtractionNotifications(cursor, observed),
      /zero notification-creation calls/u,
      'The navigation verdict must reject a cleared/replaced transient notification'
    );
    evidence = {
      status: 'passed',
      expectedVerdict: 'rejected',
      baselineCallCount: cursor.calls.length,
      phase: 'after-production-observation',
      createdCallCount: creates.length,
      creates,
      finalActive,
      activeIds: observed.activeIds,
      cleared,
      observationEndedAt: observed.sampledAt,
    };
  } catch (error) {
    validationSeen = true;
    validationError = error;
  } finally {
    try {
      await extensionPage.evaluate(
        (notificationId) => chrome.notifications.clear(notificationId),
        id
      );
    } catch (error) {
      cleanupSeen = true;
      cleanupError = error;
    }
  }
  if (validationSeen && cleanupSeen) {
    throw new AggregateError(
      [validationError, cleanupError],
      'Transient notification control and cleanup failed'
    );
  }
  if (validationSeen) {
    throw validationError;
  }
  if (cleanupSeen) {
    throw cleanupError;
  }
  return evidence;
}

async function runDelayedVideoFailures({
  context,
  extensionId,
  extensionPage,
  fixtureRoutes,
  openingProbe = false,
  output,
  page,
}: {
  context: BrowserContext;
  extensionId: string;
  extensionPage: Page;
  fixtureRoutes: Awaited<ReturnType<typeof installFixtureRoutes>>;
  openingProbe?: boolean;
  output: string;
  page: Page;
}) {
  const cases: DelayedVideoCase[] = [];
  const delayedCases: Array<[string, string]> = openingProbe
    ? [
        ['failure', DELAYED_FAILURE_ID],
        ['navigation', DELAYED_NAVIGATION_ID],
      ]
    : [
        ['failure', DELAYED_FAILURE_ID],
        ['navigation', DELAYED_NAVIGATION_ID],
        ['expiry-navigation', DELAYED_FAILURE_ID],
      ];
  for (const [name, tweetId] of delayedCases) {
    const pageUrl = `https://x.com/delayed_host/status/${tweetId}`;
    await page.goto(pageUrl);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    await page.locator('body[data-video-ready="true"]').waitFor({ state: 'attached' });
    const shell = page.locator('[data-case="recognized"] [data-video-key]');
    await shell.locator('[data-testid="playButton"]').click();
    const video = shell.locator('video');
    await page.waitForFunction(
      () => {
        const element = document.querySelector('[data-case="recognized"] [data-video-key] video');
        return (
          element instanceof HTMLVideoElement &&
          element.currentSrc.startsWith('blob:') &&
          !element.paused &&
          element.currentTime > 0.15 &&
          element.videoWidth === 320 &&
          element.videoHeight === 180 &&
          element.error === null
        );
      },
      null,
      { timeout: 15_000 }
    );
    await video.evaluate((element) => {
      if (!(element instanceof HTMLVideoElement)) {
        throw new Error('Delayed host video is missing');
      }
      element.loop = true;
    });
    const before = await hostVideoState(video);
    const documentStartedAt = await page.evaluate(() => performance.timeOrigin);
    const knownNotifications = await extensionPage.evaluate(async () =>
      Object.keys(await chrome.notifications.getAll())
    );
    const priorSetting =
      name === 'navigation' ? null : await readStoredVideoSettings(extensionPage);
    const notificationObserver = await observeNativeNotificationCreates(context, extensionId);
    const navigationEvents: Array<{ type: string; trusted: boolean }> = [];
    const recordNavigation = (message: ConsoleMessage) => {
      const text = message.text();
      if (text.startsWith('__xeg-fixture-navigation:')) {
        const parsed: unknown = JSON.parse(text.slice('__xeg-fixture-navigation:'.length));
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'type' in parsed &&
          typeof parsed.type === 'string' &&
          'trusted' in parsed &&
          typeof parsed.trusted === 'boolean'
        ) {
          navigationEvents.push({ type: parsed.type, trusted: parsed.trusted });
        }
      }
    };
    let observation: DelayedVideoCase | undefined;
    let validationError: unknown;
    let validationSeen = false;
    const cleanupErrors: unknown[] = [];
    const apiStart = fixtureRoutes.quotedApiResponses.length;
    try {
      fixtureRoutes.armDelayedFailure(tweetId);
      if (name === 'navigation') {
        page.on('console', recordNavigation);
        await page.evaluate(() => {
          for (const type of ['beforeunload', 'pagehide']) {
            window.addEventListener(
              type,
              (event) =>
                console.log(
                  '__xeg-fixture-navigation:' +
                    JSON.stringify({
                      type,
                      trusted: event.isTrusted,
                      at: Date.now(),
                      url: location.href,
                    })
                ),
              { once: true }
            );
          }
        });
      }
      const baseline = await notificationObserver.snapshot();
      if (openingProbe) {
        await beginOpeningTimeline(page, '[data-case="recognized"] [data-video-key] video');
      }
      await video.click();
      const request = await waitForValue(
        async () =>
          fixtureRoutes.quotedApiResponses.slice(apiStart).find((item) => item.tweetId === tweetId),
        `${name} extraction request`
      );
      const pending = await writeVideoBoundaryCheckpoint({
        output,
        name: `delayed-${name}`,
        page,
        api: fixtureRoutes.quotedApiResponses.slice(apiStart),
      });
      assert.equal(
        request.fulfilledAtMonotonicMs,
        null,
        `${name}: provider response must still be held`
      );
      assert.equal(
        await page.locator('[data-xeg-gallery-container]').count(),
        0,
        `${name}: pending extraction must not open a gallery`
      );
      const pendingStart = await hostVideoState(video);
      await page.waitForTimeout(350);
      const pendingEnd = await hostVideoState(video);
      assert.equal(
        pendingEnd.paused,
        false,
        `${name}: intercepted click must not pause host during extraction`
      );
      assert(
        pendingEnd.currentTime > pendingStart.currentTime + 0.15,
        `${name}: actual host playback must continue while extraction is pending`
      );
      observation = { name, pageUrl, tweetId, before, request, pending, pendingStart, pendingEnd };
      if (openingProbe) {
        const early = await captureOpeningFeedback(page, output, `delayed-${name}-early`);
        await page.waitForTimeout(4_650);
        assert.equal(request.fulfilledAtMonotonicMs, null, `${name}: response ended before 5s`);
        const afterFiveSeconds = await captureOpeningFeedback(
          page,
          output,
          `delayed-${name}-five-seconds`
        );
        assertOpeningVisible(afterFiveSeconds, `delayed ${name} held`);
        observation.openingFeedback = { early, afterFiveSeconds };
      }
      if (name === 'navigation') {
        if (openingProbe) {
          const timeline = await endOpeningTimeline(page);
          assertOpeningTimeline(timeline, `delayed ${name}`);
          observation.openingFeedback = { ...(observation.openingFeedback as object), timeline };
        }
        await page.goto(FIXTURE_URL);
        await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
        if (openingProbe) {
          const terminal = await captureOpeningFeedback(page, output, `delayed-${name}-terminal`);
          assertOpeningAbsent(terminal, `delayed ${name} terminal`);
          observation.openingFeedback = { ...(observation.openingFeedback as object), terminal };
        }
        const nextDocumentStartedAt = await page.evaluate(() => performance.timeOrigin);
        assert.notEqual(
          nextDocumentStartedAt,
          documentStartedAt,
          'Navigation must retire the old document before its held response is released'
        );
        fixtureRoutes.releaseDelayedFailure();
        await waitForValue(
          async () =>
            request.routeSettledAtMonotonicMs !== null &&
            request.transportSettledAtMonotonicMs !== null
              ? request
              : undefined,
          'retired extraction route and exact request transport settlement',
          5_000
        );
        assert(
          navigationEvents.some((event) => event.type === 'beforeunload' && event.trusted),
          'Navigation must retain its genuine early cancellation event'
        );
        assert.equal(
          await page.locator('[data-xeg-gallery-container]').count(),
          0,
          'Late extraction after navigation must not open a gallery'
        );
        const active = await extensionPage.evaluate(async () => chrome.notifications.getAll());
        const observed = await notificationObserver.snapshot();
        const creates = assertNoRetiredExtractionNotifications(baseline, observed);
        assert.deepEqual(
          Object.keys(active).filter(
            (id) => id.startsWith('xeg-') && !knownNotifications.includes(id)
          ),
          [],
          'Late extraction after navigation must not notify the new session: ' +
            JSON.stringify({ navigationEvents, creates: observed.calls })
        );
        const transientControl = await verifyTransientNotificationControl(
          extensionPage,
          notificationObserver,
          baseline
        );
        observation.navigation = {
          url: page.url(),
          galleryOpen: false,
          newNotificationCount: Object.keys(active).filter(
            (id) => id.startsWith('xeg-') && !knownNotifications.includes(id)
          ).length,
          baselineCallCount: baseline.calls.length,
          createdCallCount: creates.length,
          activeIds: Object.keys(active),
          observerId: observed.observerId,
          observationStartedAt: baseline.sampledAt,
          observationEndedAt: observed.sampledAt,
          documentStartedAt,
          nextDocumentStartedAt,
          requestSettlement: {
            routeAtMonotonicMs: request.routeSettledAtMonotonicMs,
            transportState: request.transportState,
            transportAtMonotonicMs: request.transportSettledAtMonotonicMs,
          },
          navigationEvents,
          creates,
          transientControl,
        };
      } else {
        fixtureRoutes.releaseDelayedFailure();
        await waitForValue(
          async () =>
            request.routeSettledAtMonotonicMs !== null &&
            request.transportSettledAtMonotonicMs !== null
              ? request
              : undefined,
          'failure extraction route and exact request transport settlement',
          5_000
        );
        const notification = await waitForValue(async () => {
          const active = await extensionPage.evaluate(async () =>
            Object.keys(await chrome.notifications.getAll())
          );
          const observed = await notificationObserver.snapshot();
          return observed.calls.find(
            ({ id }) => active.includes(id) && !knownNotifications.includes(id)
          );
        }, 'delayed extraction failure native notification');
        if (openingProbe) {
          const terminal = await captureOpeningFeedback(page, output, `delayed-${name}-terminal`);
          assertOpeningAbsent(terminal, `delayed ${name} terminal`);
          const timeline = await endOpeningTimeline(page);
          assertOpeningTimeline(timeline, `delayed ${name}`);
          assert.equal(timeline.removed.length, 1, `delayed ${name}: settled status removal`);
          observation.openingFeedback = {
            ...(observation.openingFeedback as object),
            terminal,
            timeline,
          };
        }
        assert(
          notification.title && notification.message,
          'Native notification must retain its production title and message'
        );
        assert.match(
          notification.message,
          /play\/pause controls on X, or press Alt\+Shift\+V to keep video clicks in X/iu,
          'Failed video extraction must explain an actionable native recovery path'
        );
        assert.equal(
          await page.locator('[data-xeg-gallery-container]').count(),
          0,
          'Failed extraction must not open a gallery from a blob-only host'
        );
        const failedHost = await hostVideoState(video);
        assert.equal(
          failedHost.paused,
          false,
          'Failed extraction must leave native host playback usable'
        );
        const observed = await notificationObserver.snapshot();
        const creates = notificationCallsSince(baseline, observed);
        assert(
          creates.some((call) => call.id === notification.id),
          'The legitimate failure control must remain in independent creation history'
        );
        observation.failureObservation = {
          baselineCallCount: baseline.calls.length,
          createdCallCount: creates.length,
          creates,
          activeIds: observed.activeIds,
          observationStartedAt: baseline.sampledAt,
          observationEndedAt: observed.sampledAt,
          observerId: observed.observerId,
        };
        assert(priorSetting, 'Failed-video prior setting is missing');
        if (name === 'expiry-navigation') {
          await page.goto(FIXTURE_URL);
          await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
          const nextDocumentStartedAt = await page.evaluate(() => performance.timeOrigin);
          assert.notEqual(nextDocumentStartedAt, documentStartedAt);
          const apiCount = fixtureRoutes.quotedApiResponses.length;
          const notificationMark = await notificationObserver.snapshot();
          await page.keyboard.press('Alt+Shift+V');
          await page.waitForTimeout(150);
          const afterShortcut = await readStoredVideoSettings(extensionPage);
          const afterNotifications = await notificationObserver.snapshot();
          assert.deepEqual(
            afterShortcut.settings,
            priorSetting.settings,
            'A recovery shortcut from a retired document must not save settings'
          );
          assert.equal(fixtureRoutes.quotedApiResponses.length, apiCount);
          assert.equal(notificationCallsSince(notificationMark, afterNotifications).length, 0);
          assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
          observation.expiry = {
            documentStartedAt,
            nextDocumentStartedAt,
            url: page.url(),
            mode: storedVideoClickMode(afterShortcut.settings),
            apiCount,
            notificationCalls: notificationCallsSince(notificationMark, afterNotifications),
            galleryCount: 0,
          };
        } else {
          const inputBaseline = await notificationObserver.snapshot();
          const synthetic = await page.evaluate(() => {
            const event = new KeyboardEvent('keydown', {
              bubbles: true,
              cancelable: true,
              code: 'KeyV',
              altKey: true,
              shiftKey: true,
            });
            document.dispatchEvent(event);
            return { trusted: event.isTrusted, defaultPrevented: event.defaultPrevented };
          });
          assert.deepEqual(synthetic, { trusted: false, defaultPrevented: false });
          assert.deepEqual(
            (await readStoredVideoSettings(extensionPage)).settings,
            priorSetting.settings,
            'Synthetic recovery input must not save settings'
          );
          const editable = page.locator('input[data-recovery-editable]');
          let editableEvent: unknown;
          try {
            await page.locator('main').evaluate((main) => {
              const input = document.createElement('input');
              input.dataset.recoveryEditable = 'true';
              input.addEventListener('keydown', (event) => {
                if (event.code !== 'KeyV') {
                  return;
                }
                input.dataset.recoveryKeydown = JSON.stringify({
                  trusted: event.isTrusted,
                  code: event.code,
                  alt: event.altKey,
                  shift: event.shiftKey,
                  target: event.target === input,
                });
              });
              main.append(input);
            });
            await editable.focus();
            await page.keyboard.press('Alt+Shift+V');
            const eventRecord = await editable.getAttribute('data-recovery-keydown');
            assert(eventRecord, 'Editable field must receive the shortcut keydown');
            editableEvent = JSON.parse(eventRecord);
            assert.deepEqual(editableEvent, {
              trusted: true,
              code: 'KeyV',
              alt: true,
              shift: true,
              target: true,
            });
            assert.deepEqual(
              (await readStoredVideoSettings(extensionPage)).settings,
              priorSetting.settings,
              'Trusted recovery input from an editable field must not save settings'
            );
          } finally {
            if (await editable.count()) {
              await editable.evaluate((input) => input.remove());
            }
          }
          const afterNegatives = await notificationObserver.snapshot();
          assert.equal(notificationCallsSince(inputBaseline, afterNegatives).length, 0);
          const nextApiStart = fixtureRoutes.quotedApiResponses.length;
          fixtureRoutes.armDelayedFailure(tweetId);
          await video.click();
          const nextRequest = await waitForValue(
            () =>
              fixtureRoutes.quotedApiResponses
                .slice(nextApiStart)
                .find((item) => item.tweetId === tweetId),
            'new video action held request'
          );
          assert.equal(nextRequest.fulfilledAtMonotonicMs, null);
          await page.keyboard.press('Alt+Shift+V');
          await page.waitForTimeout(150);
          assert.deepEqual(
            (await readStoredVideoSettings(extensionPage)).settings,
            priorSetting.settings,
            'The old recovery shortcut must expire as soon as a new click starts'
          );
          fixtureRoutes.releaseDelayedFailure();
          await waitForValue(
            () =>
              nextRequest.routeSettledAtMonotonicMs !== null &&
              nextRequest.transportSettledAtMonotonicMs !== null
                ? nextRequest
                : undefined,
            'new video action exact request settlement',
            5_000
          );
          await waitForValue(
            async () =>
              notificationCallsSince(inputBaseline, await notificationObserver.snapshot()).filter(
                ({ message }) => /Alt\+Shift\+V/u.test(message ?? '')
              ).length === 1,
            'new video action failure notification'
          );
          assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
          observation.negativeInputs = {
            synthetic,
            editable: editableEvent,
            unchangedMode: storedVideoClickMode(priorSetting.settings),
            newClickRequest: nextRequest,
            galleryCount: 0,
          };
          await page.keyboard.press('Alt+Shift+V');
          const switchedMode = await waitForValue(async () => {
            const mode = storedVideoClickMode(
              (await readStoredVideoSettings(extensionPage)).settings
            );
            return mode === 'block-all' ? mode : undefined;
          }, 'trusted native-video mode shortcut');
          assert.equal(
            switchedMode,
            'block-all',
            'Trusted recovery shortcut must persist the native video-click mode'
          );
          await shell.locator('[data-testid="playButton"]').click();
          await page.waitForFunction(
            () => {
              const element = document.querySelector(
                '[data-case="recognized"] [data-video-key] video'
              );
              return (
                element instanceof HTMLVideoElement &&
                !element.paused &&
                element.currentTime > 0.15 &&
                element.error === null
              );
            },
            null,
            { timeout: 5_000 }
          );
          const clickCount = await page.evaluate(() => window.__quoteFixtureClicks?.length ?? 0);
          await video.click();
          const nativeClick = await quotedClickRecord(page, clickCount, 'video');
          assert.equal(
            nativeClick.defaultPrevented,
            false,
            'After mode switch the direct video click must reach X natively'
          );
          assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
          assert.equal(
            fixtureRoutes.quotedApiResponses.length,
            apiStart + 2,
            'Native recovery must not start another extraction request'
          );
          observation.failure = {
            notification,
            failedHost,
            switchedMode,
            nativeClick,
            nativeRecovery: await hostVideoState(video),
          };
          await page.goto(`https://x.com/rapid_a/status/${RAPID_CLICK_A}`);
          await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
          const snapshot = (selector: string) =>
            page.evaluate(
              (targetSelector) => ({
                focused: document.activeElement === document.querySelector(targetSelector),
                scrollY,
                bodyStyle: document.body.style.cssText,
                background: ['#host-layout-spacer', 'main'].map((item) => {
                  const node = document.querySelector(item);
                  return {
                    hidden: node?.hasAttribute('data-xeg-gallery-hidden') ?? false,
                    inert: node?.hasAttribute('inert') ?? false,
                    ariaHidden: node?.getAttribute('aria-hidden') ?? null,
                  };
                }),
              }),
              selector
            );
          const photoSelector = '[data-rapid="b"] [data-testid="tweetPhoto"] img';
          const photo = page.locator(photoSelector);
          await photo.scrollIntoViewIfNeeded();
          await page.evaluate(() => window.scrollBy(0, -100));
          await photo.focus();
          const photoBefore = await snapshot(photoSelector);
          assert(photoBefore.focused && photoBefore.scrollY > 0);
          const photoApiStart = fixtureRoutes.quotedApiResponses.length;
          const photoHit = await photo.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            return { x, y, hit: document.elementFromPoint(x, y) === element };
          });
          assert.equal(photoHit.hit, true, 'The photo must be the ordinary hit-tested target');
          await page.mouse.click(photoHit.x, photoHit.y);
          const photoGallery = page.locator('[data-xeg-gallery-container]');
          await photoGallery.waitFor({ state: 'visible' });
          const photoSelected = await assertQuotedSelection(page, {
            position: 1,
            total: 2,
            type: 'image',
            path: '/media/QQuoteTwoPhoto.jpg',
          });
          const photoOrigin = await assertQuotedOriginLink(
            photoGallery,
            `https://x.com/rapid_b/status/${RAPID_CLICK_B}`
          );
          const photoRequests = fixtureRoutes.quotedApiResponses.slice(photoApiStart);
          assert(
            openingProbe ? photoRequests.length <= 1 : photoRequests.length === 1,
            'Photo recovery must use at most one B request'
          );
          assert(
            photoRequests.every(
              ({ tweetId, status }) => tweetId === RAPID_CLICK_B && status === 200
            ),
            'Photo recovery must retain B ownership'
          );
          await page.keyboard.press('Escape');
          await photoGallery.waitFor({ state: 'detached' });
          const photoAfter = await snapshot(photoSelector);
          assert.deepEqual(photoAfter, photoBefore, 'Photo close must restore host state');
          assert.equal(
            storedVideoClickMode((await readStoredVideoSettings(extensionPage)).settings),
            'block-all',
            'Photo gallery must not change the native video mode'
          );
          observation.photo = {
            hit: photoHit,
            selected: photoSelected,
            origin: photoOrigin,
            requests: photoRequests,
            before: photoBefore,
            after: photoAfter,
          };

          const restored = await restoreStoredVideoSettings(extensionPage, priorSetting);
          assert.equal(restored, true);
          assert.deepEqual(
            (await readStoredVideoSettings(extensionPage)).settings,
            priorSetting.settings
          );
          observation.settingRestored = true;
          const closedNotificationMark = await notificationObserver.snapshot();
          await page.keyboard.press('Alt+Shift+V');
          await page.waitForTimeout(150);
          assert.deepEqual(
            (await readStoredVideoSettings(extensionPage)).settings,
            priorSetting.settings,
            'The old recovery shortcut must stay retired after the photo gallery closes'
          );
          assert.equal(
            notificationCallsSince(closedNotificationMark, await notificationObserver.snapshot())
              .length,
            0
          );
          await page.reload();
          await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
          const healthyTriggerSelector = '[data-rapid="b"] video';
          const healthyTrigger = page.locator(healthyTriggerSelector);
          await healthyTrigger.scrollIntoViewIfNeeded();
          await healthyTrigger.focus();
          const healthyBefore = await snapshot(healthyTriggerSelector);
          assert(healthyBefore.focused);
          const healthyApiStart = fixtureRoutes.quotedApiResponses.length;
          await healthyTrigger.click();
          const healthy = await assertQuotedGallery(page, {
            name: 'rapid-b',
            expectedPosition: 2,
            expectedTotal: 2,
            owner: RAPID_CLICK_B,
            media: 'quote-two',
          });
          const healthyRequests = fixtureRoutes.quotedApiResponses.slice(healthyApiStart);
          assert(
            openingProbe ? healthyRequests.length <= 1 : healthyRequests.length === 1,
            'Healthy recovery must use at most one B request'
          );
          assert(
            healthyRequests.every(
              ({ tweetId, status }) => tweetId === RAPID_CLICK_B && status === 200
            ),
            'Healthy recovery must retain B ownership'
          );
          const playbackState = () =>
            healthy.video.evaluate((element) => {
              if (!(element instanceof HTMLVideoElement)) {
                throw new Error('Selected healthy video is missing');
              }
              return {
                paused: element.paused,
                time: element.currentTime,
                width: element.videoWidth,
                height: element.videoHeight,
                error: element.error?.code ?? null,
              };
            });
          const initialPlayback = await playbackState();
          assert.equal(initialPlayback.paused, true, 'Fresh video must begin paused');
          assert(initialPlayback.time < 0.15, 'Fresh video must begin at the first frame');
          await healthy.video.click();
          await page.waitForFunction(
            () => {
              const element = document.querySelector(
                '[data-xeg-gallery-container] [data-gallery-element="item"][data-index="1"] video'
              );
              return (
                element instanceof HTMLVideoElement &&
                !element.paused &&
                element.currentTime > 0.15 &&
                element.videoWidth > 0 &&
                element.videoHeight > 0 &&
                element.error === null
              );
            },
            null,
            { timeout: 15_000 }
          );
          const playing = await playbackState();
          await page.keyboard.press('Escape');
          await healthy.gallery.waitFor({ state: 'detached' });
          const healthyAfter = await snapshot(healthyTriggerSelector);
          assert.deepEqual(
            healthyAfter,
            healthyBefore,
            'Healthy video close must restore host state'
          );
          observation.healthyVideo = {
            selection: healthy.selection,
            requests: healthyRequests,
            initialPlayback,
            playing,
            before: healthyBefore,
            after: healthyAfter,
          };
        }
      }
      cases.push(observation);
      await page.screenshot({ path: join(output, `quoted-delayed-${name}.png`) });
    } catch (error) {
      validationSeen = true;
      validationError = error;
    } finally {
      page.off('console', recordNavigation);
      try {
        fixtureRoutes.releaseDelayedFailure();
      } catch (error) {
        cleanupErrors.push(error);
      }
      if (notificationObserver) {
        try {
          const restored = await notificationObserver.dispose();
          if (observation) {
            observation.notificationObserverRestored = restored;
          }
        } catch (error) {
          cleanupErrors.push(error);
        }
      }
      if (priorSetting) {
        try {
          const restored = await restoreStoredVideoSettings(extensionPage, priorSetting);
          assert.equal(restored, true, 'Recovery shortcut must restore full prior task setting');
          if (observation) {
            observation.settingRestored = true;
          }
        } catch (error) {
          cleanupErrors.push(error);
        }
      }
    }
    if (validationSeen || cleanupErrors.length) {
      try {
        await writeFile(
          join(output, `quoted-delayed-${name}-failure.json`),
          JSON.stringify(
            {
              name,
              observation,
              error: validationSeen ? safeError(validationError) : null,
              cleanupErrors: cleanupErrors.map((error) => safeError(error)),
              api: fixtureRoutes.quotedApiResponses.slice(apiStart),
            },
            null,
            2
          )
        );
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (validationSeen && cleanupErrors.length) {
      throw new AggregateError(
        [validationError, ...cleanupErrors],
        `${name}: video failure validation and cleanup both failed`
      );
    }
    if (validationSeen) {
      throw validationError;
    }
    if (cleanupErrors.length) {
      throw new AggregateError(cleanupErrors, `${name}: video failure cleanup failed`);
    }
  }
  return { status: 'passed', cases };
}

async function runRapidVideoClicks({
  context,
  downloads,
  extensionId,
  extensionPage,
  fixtureRoutes,
  lateAFailure = false,
  nativeLoopback,
  openingProbe = false,
  output,
  page,
  pageFetches,
  skipDownload = false,
}: {
  context: BrowserContext;
  downloads: string;
  extensionId: string;
  extensionPage: Page;
  fixtureRoutes: Awaited<ReturnType<typeof installFixtureRoutes>>;
  lateAFailure?: boolean;
  nativeLoopback: NativeLoopback;
  openingProbe?: boolean;
  output: string;
  page: Page;
  pageFetches: PageFetch[];
  skipDownload?: boolean;
}) {
  const pageUrl = `https://x.com/rapid_a/status/${RAPID_CLICK_A}`;
  await page.goto(pageUrl);
  await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
  const first = page.locator('[data-rapid="a"] video');
  const second = page.locator('[data-rapid="b"] video');
  await first.scrollIntoViewIfNeeded();
  await first.focus();
  const apiStart = fixtureRoutes.quotedApiResponses.length;
  let originalLoop: boolean | undefined;
  let notificationObserver:
    | Awaited<ReturnType<typeof observeNativeNotificationCreates>>
    | undefined;
  let result: (AcceptanceReceipt & Record<string, unknown>) | undefined;
  let validationError: unknown;
  let validationFailed = false;
  const cleanupErrors: unknown[] = [];
  const cleanup = { notificationObserverRestored: false, hostVideoControlRestored: false };
  const probeName = openingProbe
    ? `rapid-a-b-${lateAFailure ? 'late-failure' : 'late-success'}`
    : 'rapid-a-b';
  let openingFeedback: Record<string, unknown> | undefined;
  try {
    const initialHost = await hostVideoState(first);
    assert.equal(initialHost.paused, true, 'Rapid A host video must start paused');
    originalLoop = await first.evaluate((element) => {
      if (!(element instanceof HTMLVideoElement)) {
        throw new Error('Rapid A host video is missing');
      }
      const previous = element.loop;
      element.loop = true;
      return previous;
    });
    notificationObserver = await observeNativeNotificationCreates(context, extensionId);
    await page.keyboard.press('Space');
    const begin = await waitForValue(async () => {
      const state = await hostVideoState(first);
      return !state.paused && state.currentTime > 0.15 ? state : undefined;
    }, 'rapid A playback from focused native Space control');
    assert(
      begin.readyState >= 2 && begin.width > 0 && begin.height > 0 && begin.error === null,
      'Rapid A must have playable native media before the first gallery click'
    );
    const notificationBaseline = await notificationObserver.snapshot();
    fixtureRoutes.armDelayedFailure(RAPID_CLICK_A, lateAFailure);
    if (openingProbe) {
      await beginOpeningTimeline(page, '[data-rapid="a"] video');
    }
    await first.click();
    const heldA = await waitForValue(
      async () =>
        fixtureRoutes.quotedApiResponses
          .slice(apiStart)
          .find(({ tweetId }) => tweetId === RAPID_CLICK_A),
      'rapid A held provider request'
    );
    assert.equal(
      heldA.fulfilledAtMonotonicMs,
      null,
      'A response must remain pending at the B click'
    );
    const pendingStart = await hostVideoState(first);
    await page.waitForTimeout(350);
    const pendingEnd = await hostVideoState(first);
    assert.equal(pendingEnd.paused, false, 'Pending rapid A must not pause host playback');
    assert(
      pendingEnd.currentTime > pendingStart.currentTime + 0.15,
      'Rapid A host video must progress while its provider response is held'
    );
    assert.equal(heldA.fulfilledAtMonotonicMs, null, 'Rapid A must remain held during playback');
    if (openingProbe) {
      const early = await captureOpeningFeedback(page, output, `${probeName}-early`);
      await page.waitForTimeout(4_650);
      assert.equal(heldA.fulfilledAtMonotonicMs, null, 'Rapid A response ended before 5s');
      const afterFiveSeconds = await captureOpeningFeedback(
        page,
        output,
        `${probeName}-five-seconds`
      );
      assertOpeningVisible(afterFiveSeconds, `${probeName} held A`);
      openingFeedback = { early, afterFiveSeconds };
    }
    assert.equal(
      await page.locator('[data-xeg-gallery-container]').count(),
      0,
      'Pending rapid A must not open a gallery'
    );
    const notificationsDuringA = await notificationObserver.snapshot();
    assertNoRetiredExtractionNotifications(notificationBaseline, notificationsDuringA);
    await second.scrollIntoViewIfNeeded();
    const beforeB = await hostVideoState(first);
    assert.equal(beforeB.paused, false, 'Rapid A host must still play before the B click');
    const before = await page.evaluate(() => ({
      scrollY: window.scrollY,
      body: document.body.style.cssText,
    }));
    await second.click();
    if (openingProbe) {
      const afterB = await captureOpeningFeedback(page, output, `${probeName}-after-b`);
      assertOpeningAbsent(afterB, `${probeName} after B click`);
      openingFeedback = { ...openingFeedback, afterB };
    }
    const pendingB = await writeVideoBoundaryCheckpoint({
      output,
      name: probeName,
      page,
      api: fixtureRoutes.quotedApiResponses.slice(apiStart),
    });
    const expectedB = {
      name: 'rapid-b',
      expectedPosition: 2,
      expectedTotal: 2,
      owner: RAPID_CLICK_B,
      media: 'quote-two',
    };
    const opened = await assertQuotedGallery(page, expectedB);
    const originUrl = await assertQuotedOriginLink(
      opened.gallery,
      `https://x.com/rapid_b/status/${RAPID_CLICK_B}`
    );
    const bRequests = fixtureRoutes.quotedApiResponses
      .slice(apiStart)
      .filter(({ tweetId }) => tweetId === RAPID_CLICK_B);
    assert(
      openingProbe ? bRequests.length <= 1 : bRequests.length === 1,
      'B must use at most one independent owner request'
    );
    if (bRequests.length) {
      assert.equal(bRequests[0]?.status, 200);
    }
    const afterB = await assertHostStopped(page, first, 'Rapid B gallery opening');
    const notificationsAfterB = await notificationObserver.snapshot();
    assertNoRetiredExtractionNotifications(notificationBaseline, notificationsAfterB);
    fixtureRoutes.releaseDelayedFailure();
    await waitForValue(
      () =>
        heldA.routeSettledAtMonotonicMs !== null && heldA.transportSettledAtMonotonicMs !== null
          ? heldA
          : undefined,
      'rapid A exact route and transport settlement',
      5_000
    );
    assert(
      heldA.transportState === 'failed' || heldA.transportState === 'finished',
      'Rapid A must record its real transport outcome'
    );
    await page.waitForTimeout(350);
    if (openingProbe) {
      const afterA = await captureOpeningFeedback(page, output, `${probeName}-after-a`);
      assertOpeningAbsent(afterA, `${probeName} after A settlement`);
      const timeline = await endOpeningTimeline(page);
      assertOpeningTimeline(timeline, probeName);
      assert.equal(timeline.removed.length, 1, `${probeName}: A status must retire on B click`);
      assert(timeline.removed[0]! >= timeline.shown[0]!.at);
      openingFeedback = { ...openingFeedback, afterA, timeline };
    }
    const afterA = await assertHostStopped(page, first, 'Late rapid A settlement');
    const retained = await assertQuotedSelection(page, {
      position: 2,
      total: 2,
      type: 'video',
      path: `/ext_tw_video/${RAPID_CLICK_B}/pu/vid/320x180/quote-two.mp4`,
    });
    const notificationsAfterA = await notificationObserver.snapshot();
    assertNoRetiredExtractionNotifications(notificationBaseline, notificationsAfterA);
    let downloadEvidence: Record<string, unknown> | null = null;
    if (!skipDownload) {
      const knownIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
      const nativeMark = nativeLoopback.mark();
      const fetchMark = pageFetches.length;
      const filename = `rapid_b_${RAPID_CLICK_B}_1.mp4`;
      await opened.gallery
        .locator('[data-gallery-element="toolbar"] button[aria-label="Download"]')
        .click();
      const download = await waitForDownload(extensionPage, knownIds, filename);
      const relativeDownload = relative(downloads, download.filename);
      assert(
        relativeDownload && !relativeDownload.startsWith('..') && !isAbsolute(relativeDownload)
      );
      const bytes = await readFile(download.filename);
      const expectedBytes = fixtureRoutes.videoPayloads['quote-two'];
      assert(expectedBytes, 'Rapid B fixture payload is missing');
      assert(expectedBytes.equals(bytes), 'Late A must not replace B preferred-save bytes');
      assert(retained.source, 'Rapid B selection has no source');
      const native = await assertNativeSingle({
        extensionPage,
        knownIds,
        download,
        expectedUrl: retained.source,
        expectedBytes,
        nativeLoopback,
        nativeMark,
        pageFetches: pageFetches.slice(fetchMark),
      });
      downloadEvidence = {
        filename,
        bytes: bytes.length,
        native,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      };
    }
    const notificationsAfterSave = await notificationObserver.snapshot();
    assertNoRetiredExtractionNotifications(notificationBaseline, notificationsAfterSave);
    await opened.gallery
      .locator('[data-gallery-element="toolbar"] button[aria-label="Close"]')
      .click();
    await opened.gallery.waitFor({ state: 'detached' });
    const after = await page.evaluate(() => ({
      scrollY: window.scrollY,
      body: document.body.style.cssText,
    }));
    assert.deepEqual(after, before, 'Rapid B close must restore host scroll and body styles');
    await page.screenshot({ path: join(output, `quoted-${probeName}-after.png`) });
    result = {
      status: 'passed',
      pageUrl,
      heldA,
      openingFeedback,
      pendingB,
      bRequests,
      hostPlayback: { initialHost, begin, pendingStart, pendingEnd, beforeB, afterB, afterA },
      nativeNotificationCreates: {
        baseline: notificationBaseline.calls.length,
        duringA: notificationsDuringA.calls.length,
        afterB: notificationsAfterB.calls.length,
        afterA: notificationsAfterA.calls.length,
        afterSave: notificationsAfterSave.calls.length,
      },
      selected: opened.selectedMedia,
      retained,
      originUrl,
      download: downloadEvidence,
      restoration: after,
      cleanup,
    };
  } catch (error) {
    validationFailed = true;
    validationError = error;
  } finally {
    try {
      fixtureRoutes.releaseDelayedFailure();
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (notificationObserver) {
      try {
        await notificationObserver.dispose();
        cleanup.notificationObserverRestored = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (originalLoop !== undefined) {
      try {
        const restored = await first.evaluate((element, loop) => {
          if (!(element instanceof HTMLVideoElement)) {
            throw new Error('Rapid A host video disappeared before cleanup');
          }
          element.pause();
          element.loop = loop;
          return { paused: element.paused, loop: element.loop };
        }, originalLoop);
        assert.deepEqual(
          restored,
          { paused: true, loop: originalLoop },
          'Rapid A host playback and loop must be restored'
        );
        cleanup.hostVideoControlRestored = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
  }
  if (validationFailed && cleanupErrors.length) {
    throw new AggregateError(
      [validationError, ...cleanupErrors],
      'Rapid click validation and cleanup both failed'
    );
  }
  if (validationFailed) {
    throw validationError;
  }
  if (cleanupErrors.length) {
    throw new AggregateError(cleanupErrors, 'Rapid click cleanup failed');
  }
  assert(result, 'Rapid click validation produced no result');
  return result;
}

async function installBoundedExtensionRenderFault(
  context: BrowserContext,
  page: Page,
  extensionId: string
) {
  const cdp = await context.newCDPSession(page);
  let isolated:
    | {
        id: number;
        origin: string;
        name: string;
        auxData?: { frameId?: string; isDefault?: boolean };
      }
    | undefined;
  const restoreAndVerify = async (contextId: number, markerRequired: boolean) => {
    const result = await cdp.send('Runtime.evaluate', {
      contextId,
      expression: `(() => {
        const marker = globalThis.__xegInstalledRenderFault;
        if (!marker) return { markerPresent: false, descriptorRestored: false,
          markerGone: true };
        marker.restore();
        const descriptorRestored = Object.getOwnPropertyDescriptor(
          CSSStyleDeclaration.prototype, 'setProperty')?.value === marker.original;
        delete globalThis.__xegInstalledRenderFault;
        return { markerPresent: true, descriptorRestored,
          markerGone: !Object.hasOwn(globalThis, '__xegInstalledRenderFault') };
      })()`,
      returnByValue: true,
    });
    assert.equal(result.exceptionDetails, undefined, 'CDP render-fault restoration must not throw');
    const restored = result.result.value;
    if (markerRequired) {
      assert.equal(
        restored.markerPresent,
        true,
        'Installed render fault marker disappeared before verified cleanup'
      );
    }
    if (restored.markerPresent) {
      assert.equal(
        restored.descriptorRestored,
        true,
        'CDP must restore the original CSS setProperty descriptor'
      );
      assert.equal(restored.markerGone, true, 'CDP must remove the bounded render-fault marker');
    }
    return restored;
  };
  try {
    const contexts: NonNullable<typeof isolated>[] = [];
    cdp.on('Runtime.executionContextCreated', ({ context: observed }) => {
      if (contexts.length < 32) {
        contexts.push(observed);
      }
    });
    const { frameTree } = await cdp.send('Page.getFrameTree');
    await cdp.send('Runtime.enable');
    isolated = await waitForValue(
      () => {
        const matching = contexts.filter(
          ({ origin, auxData }) =>
            (origin === `chrome-extension://${extensionId}` ||
              origin === `chrome-extension://${extensionId}/`) &&
            auxData?.frameId === frameTree.frame.id &&
            auxData?.isDefault === false
        );
        if (matching.length > 1) {
          throw new Error('Ambiguous extension content-script contexts');
        }
        return matching[0];
      },
      'installed extension isolated execution context',
      5_000
    );
    const expression = `(() => {
    const prototype = CSSStyleDeclaration.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'setProperty');
    if (!descriptor || typeof descriptor.value !== 'function') throw new Error('Missing CSS API');
    if (globalThis.__xegInstalledRenderFault) throw new Error('Render fault already installed');
    const original = descriptor.value;
    const state = { remaining: 1, throws: 0, original, restore() {
      Object.defineProperty(prototype, 'setProperty', descriptor);
    } };
    Object.defineProperty(prototype, 'setProperty', { ...descriptor,
      value: function(property, value, priority) {
        if (property === '--xeg-viewport-w' && state.remaining > 0) {
          state.remaining = 0;
          state.throws += 1;
          state.restore();
          throw new Error('Bounded installed gallery render failure');
        }
        return Reflect.apply(original, this, [property, value, priority]);
      },
    });
    globalThis.__xegInstalledRenderFault = state;
    return { installed: true, remaining: state.remaining };
  })()`;
    assert(isolated, 'Isolated extension context is missing');
    const isolatedContext = isolated;
    const installed = await cdp.send('Runtime.evaluate', {
      contextId: isolatedContext.id,
      expression,
      returnByValue: true,
    });
    assert.equal(
      installed.exceptionDetails,
      undefined,
      'Extension isolated render-fault installation must not throw'
    );
    assert.equal(installed.result.value?.installed, true);
    return {
      context: {
        origin: isolatedContext.origin,
        name: isolatedContext.name,
        frameId: isolatedContext.auxData?.frameId,
      },
      async snapshot() {
        const observed = await cdp.send('Runtime.evaluate', {
          contextId: isolatedContext.id,
          expression:
            '({ throws: globalThis.__xegInstalledRenderFault?.throws ?? 0, remaining: globalThis.__xegInstalledRenderFault?.remaining ?? -1 })',
          returnByValue: true,
        });
        assert.equal(observed.exceptionDetails, undefined);
        return observed.result.value;
      },
      async dispose() {
        let restoration: Awaited<ReturnType<typeof restoreAndVerify>> | undefined;
        let restoreError: unknown;
        let restoreFailed = false;
        let detachError: unknown;
        let detachFailed = false;
        try {
          restoration = await restoreAndVerify(isolatedContext.id, true);
        } catch (error) {
          restoreFailed = true;
          restoreError = error;
        }
        try {
          await cdp.detach();
        } catch (error) {
          detachFailed = true;
          detachError = error;
        }
        if (restoreFailed && detachFailed) {
          throw new AggregateError(
            [restoreError, detachError],
            'Render-fault restoration and CDP detach both failed'
          );
        }
        if (restoreFailed) {
          throw restoreError;
        }
        if (detachFailed) {
          throw detachError;
        }
        return restoration;
      },
    };
  } catch (error) {
    const cleanupErrors: unknown[] = [];
    if (isolated) {
      try {
        await restoreAndVerify(isolated.id, false);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    try {
      await cdp.detach();
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
    if (cleanupErrors.length) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        'Render-fault setup and CDP cleanup failed'
      );
    }
    throw error;
  }
}

async function runModelessRenderRecovery({
  consoleErrors,
  context,
  extensionId,
  output,
  page,
}: {
  consoleErrors: ConsoleErrorRecord[];
  context: BrowserContext;
  extensionId: string;
  output: string;
  page: Page;
}) {
  const quotedCase = QUOTED_CASES[0];
  assert(quotedCase, 'Recognized quoted case is missing');
  await page.goto(`https://x.com/${quotedCase.handle}/status/${quotedCase.outer}`);
  await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
  await page.locator('body[data-video-ready="true"]').waitFor({ state: 'attached' });
  const shell = page.locator('[data-case="recognized"] [data-video-key]');
  await shell.locator('[data-testid="playButton"]').click();
  const hostVideo = shell.locator('video:not([data-host-action])');
  await page.waitForFunction(
    () => {
      const element = document.querySelector('[data-case="recognized"] [data-video-key] video');
      return (
        element instanceof HTMLVideoElement &&
        !element.paused &&
        element.currentTime > 0.15 &&
        element.videoWidth === 320 &&
        element.videoHeight === 180 &&
        element.error === null
      );
    },
    null,
    { timeout: 15_000 }
  );
  await hostVideo.evaluate((video) => {
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error('Modeless host video is missing');
    }
    video.loop = true;
  });
  await hostVideo.focus();
  const hostBefore = await quotedHostSnapshot(page, 'recognized', '[data-video-key] video');
  await captureQuotedOpeningScroll(hostVideo);
  const consoleStart = consoleErrors.length;
  const fault = await installBoundedExtensionRenderFault(context, page, extensionId);
  let observed: Awaited<ReturnType<typeof fault.snapshot>> | undefined;
  let receipt: { status: string; [key: string]: unknown } | undefined;
  let validationError: unknown;
  let validationSeen = false;
  let cleanupError: unknown;
  let cleanupSeen = false;
  try {
    await hostVideo.click();
    hostBefore.scrollY = Number(await hostVideo.getAttribute('data-opening-scroll-y'));
    assert(Number.isFinite(hostBefore.scrollY));
    const recovery = page.locator('[data-xeg-error-boundary]');
    await recovery.waitFor({ state: 'visible', timeout: 15_000 });
    observed = await fault.snapshot();
    assert.equal(
      observed.throws,
      1,
      'The production gallery render API must hit one bounded fault'
    );
    assert.equal(
      await page.locator('[data-xeg-gallery-container]').count(),
      0,
      'Failed renderer must leave the gallery modal unmounted'
    );
    const modelessHost = await page.evaluate(() => ({
      bodyInert: document.body.inert,
      hostInert: document.querySelector('main')?.inert ?? null,
      bodyOverflow: document.body.style.overflow,
    }));
    assert.equal(
      modelessHost.hostInert,
      false,
      'Modeless recovery must release host interaction isolation'
    );
    const modelessRestoration = await quotedHostSnapshot(
      page,
      'recognized',
      '[data-video-key] video'
    );
    assert.deepEqual(
      modelessRestoration.bodyStyle,
      hostBefore.bodyStyle,
      'Modeless recovery must restore body inline styles'
    );
    assert.deepEqual(
      modelessRestoration.background,
      hostBefore.background,
      'Modeless recovery must restore host isolation markers'
    );
    assert.equal(modelessRestoration.scrollRestoration, hostBefore.scrollRestoration);
    assert.equal(modelessRestoration.scrollY, hostBefore.scrollY);
    await shell.locator('[data-testid="playButton"]').click();
    await page.waitForFunction(
      () => {
        const video = document.querySelector('[data-case="recognized"] [data-video-key] video');
        return (
          video instanceof HTMLVideoElement &&
          !video.paused &&
          video.currentTime > 0.15 &&
          video.videoWidth === 320 &&
          video.videoHeight === 180 &&
          video.error === null
        );
      },
      null,
      { timeout: 5_000 }
    );
    const visibleRecoveryStart = await hostVideoState(hostVideo);
    await page.waitForFunction(
      (start) => {
        const video = document.querySelector('[data-case="recognized"] [data-video-key] video');
        return (
          video instanceof HTMLVideoElement &&
          !video.paused &&
          video.currentTime > start + 0.15 &&
          video.error === null
        );
      },
      visibleRecoveryStart.currentTime,
      { timeout: 5_000 }
    );
    const visibleRecoveryEnd = await hostVideoState(hostVideo);
    assert.equal(
      await recovery.isVisible(),
      true,
      'Host playback must progress while modeless recovery is still visible'
    );
    const visibleRecoveryHost = await page.evaluate(() => ({
      bodyInert: document.body.inert,
      hostInert: document.querySelector('main')?.inert ?? null,
      bodyOverflow: document.body.style.overflow,
    }));
    assert.deepEqual(
      visibleRecoveryHost,
      modelessHost,
      'Native playback during modeless recovery must not reacquire host isolation'
    );
    await page.screenshot({ path: join(output, 'quoted-modeless-recovery-visible.png') });
    await recovery.locator('[data-xeg-error-action="close"]').click();
    await recovery.waitFor({ state: 'detached' });
    await shell.locator('[data-testid="playButton"]').click();
    await page.waitForFunction(
      () => {
        const video = document.querySelector('[data-case="recognized"] [data-video-key] video');
        return (
          video instanceof HTMLVideoElement &&
          !video.paused &&
          video.currentTime > 0.15 &&
          video.error === null
        );
      },
      null,
      { timeout: 5_000 }
    );
    const recoveredHost = await hostVideoState(hostVideo);
    await hostVideo.click();
    const retried = await assertQuotedGallery(page, quotedCase);
    const retryHostStopped = await assertHostStopped(
      page,
      hostVideo,
      'New gallery after modeless recovery'
    );
    await retried.gallery
      .locator('[data-gallery-element="toolbar"] button[aria-label="Close"]')
      .click();
    await retried.gallery.waitFor({ state: 'detached' });
    await shell.locator('[data-testid="playButton"]').click();
    await page.waitForFunction(
      () => {
        const video = document.querySelector('[data-case="recognized"] [data-video-key] video');
        return (
          video instanceof HTMLVideoElement &&
          !video.paused &&
          video.currentTime > 0.15 &&
          video.error === null
        );
      },
      null,
      { timeout: 5_000 }
    );
    const hostAfterRetryClose = await hostVideoState(hostVideo);
    const expectedConsoleErrors = consoleErrors
      .slice(consoleStart)
      .filter((record) => record.text.includes('Bounded installed gallery render failure'));
    assert(
      expectedConsoleErrors.length <= 2,
      'One bounded renderer fault must not produce repeated console failures'
    );
    await page.screenshot({ path: join(output, 'quoted-modeless-recovery.png') });
    receipt = {
      status: 'passed',
      isolatedContext: fault.context,
      fault: observed,
      modelessHost,
      modelessRestoration,
      visibleRecoveryHost,
      visibleRecoveryStart,
      visibleRecoveryEnd,
      recoveredHost,
      expectedConsoleErrors,
      visibleRecoveryScreenshot: 'quoted-modeless-recovery-visible.png',
      retry: {
        selected: retried.selectedMedia,
        hostStopped: retryHostStopped,
        hostAfterClose: hostAfterRetryClose,
      },
    };
  } catch (error) {
    validationSeen = true;
    validationError = error;
  } finally {
    try {
      const restoration = await fault.dispose();
      if (receipt) {
        Object.assign(receipt, { faultRestoration: restoration });
      }
    } catch (error) {
      cleanupSeen = true;
      cleanupError = error;
    }
  }
  if (validationSeen && cleanupSeen) {
    throw new AggregateError(
      [validationError, cleanupError],
      'Modeless recovery validation and bounded fault cleanup both failed'
    );
  }
  if (validationSeen) {
    throw validationError;
  }
  if (cleanupSeen) {
    throw cleanupError;
  }
  assert(receipt, 'Modeless render recovery produced no receipt');
  return receipt;
}

async function runBlockAllDirectVideo({
  extensionPage,
  output,
  page,
  quotedApiResponses,
}: {
  extensionPage: Page;
  output: string;
  page: Page;
  quotedApiResponses: ApiRecord[];
}) {
  const controlledSetting: ControlledSettingEvidence = {};
  return withControlledFixtureVideoMode(
    extensionPage,
    controlledSetting,
    async () => {
      const pageUrl = 'https://x.com/quote_one/status/9111111111111111111';
      await page.goto(pageUrl);
      await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
      const video = page.locator('[data-unmarked-direct]');
      await video.scrollIntoViewIfNeeded();
      await page.locator('[data-native-play]').click();
      await page.waitForFunction(
        () => {
          const element = document.querySelector('[data-unmarked-direct]');
          return (
            element instanceof HTMLVideoElement &&
            !element.paused &&
            element.videoWidth > 0 &&
            element.videoHeight > 0 &&
            element.error === null &&
            element.currentTime > 0.15
          );
        },
        null,
        { timeout: 15_000 }
      );
      const before = await hostVideoState(video);
      const source = await video.evaluate((element) => {
        if (!(element instanceof HTMLVideoElement)) {
          throw new Error('Direct video is missing');
        }
        return element.currentSrc;
      });
      assert.equal(
        new URL(source).pathname,
        '/ext_tw_video/9111111111111111111/pu/vid/320x180/quote-one.mp4'
      );
      assert.equal(before.width, 320);
      assert.equal(before.height, 180);
      const apiStart = quotedApiResponses.length;
      const hit = await video.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        return { x, y, tag: document.elementFromPoint(x, y)?.tagName.toLowerCase() };
      });
      assert.equal(hit.tag, 'video', 'Direct unmarked video must be the real hit target');
      await page.mouse.click(hit.x, hit.y);
      const pending = await writeVideoBoundaryCheckpoint({
        output,
        name: 'unmarked-block-all',
        page,
        api: quotedApiResponses.slice(apiStart),
      });
      await page.waitForTimeout(50);
      const clicks = await page.evaluate(() => window.__directVideoClicks);
      assert(clicks && clicks[0], 'Direct video click receipt is missing');
      assert.equal(clicks.length, 1, 'Host must receive one ordinary video click');
      assert.equal(clicks[0].tag, 'video');
      assert.equal(clicks[0].prevented, false, 'block-all must leave direct video click native');
      assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
      assert.deepEqual(
        quotedApiResponses.slice(apiStart),
        [],
        'A blocked native video click must not start gallery extraction'
      );
      const after = await hostVideoState(video);
      await page.screenshot({ path: join(output, 'quoted-unmarked-block-all-native.png') });
      return {
        status: 'passed',
        mode: 'block-all',
        pageUrl,
        source,
        before,
        hit,
        pending,
        clicks,
        after,
        controlledSetting,
      };
    },
    'block-all'
  );
}

async function runDirectVideoAllowedModes({
  extensionPage,
  output,
  page,
  quotedApiResponses,
}: {
  extensionPage: Page;
  output: string;
  page: Page;
  quotedApiResponses: ApiRecord[];
}) {
  const cases = [];
  const directCase = QUOTED_CASES[0];
  assert(directCase, 'Recognized direct case is missing');
  for (const mode of ['default', 'block-controls-only', 'allow-all']) {
    const controlledSetting: ControlledSettingEvidence = {};
    const result = await withControlledFixtureVideoMode(
      extensionPage,
      controlledSetting,
      async () => {
        const pageUrl = 'https://x.com/quote_one/status/9111111111111111111';
        await page.goto(pageUrl);
        await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
        const video = page.locator('[data-unmarked-direct]');
        await video.scrollIntoViewIfNeeded();
        await video.focus();
        const apiStart = quotedApiResponses.length;
        await video.click();
        const pending = await writeVideoBoundaryCheckpoint({
          output,
          name: `unmarked-${mode}`,
          page,
          api: quotedApiResponses.slice(apiStart),
        });
        const selected = await assertQuotedGallery(page, directCase);
        await page.waitForTimeout(10);
        const clicks = await page.evaluate(() => window.__directVideoClicks);
        assert(clicks && clicks[0], 'Direct video click receipt is missing');
        assert.equal(clicks.length, 1, `${mode}: one trusted direct-video click expected`);
        assert.equal(clicks[0].tag, 'video');
        assert.equal(
          clicks[0].prevented,
          true,
          `${mode}: eligible video surface click must be captured for gallery`
        );
        const originUrl = await assertQuotedOriginLink(
          selected.gallery,
          'https://x.com/quote_one/status/9111111111111111111'
        );
        await selected.gallery
          .locator('[data-gallery-element="toolbar"] button[aria-label="Close"]')
          .click();
        await selected.gallery.waitFor({ state: 'detached' });
        return {
          mode,
          pending,
          clicks,
          selected: selected.selectedMedia,
          originUrl,
          api: quotedApiResponses.slice(apiStart),
          galleryClosed: true,
        };
      },
      mode
    );
    cases.push(result);
  }
  await page.screenshot({ path: join(output, 'quoted-unmarked-modes-after.png') });
  return { status: 'passed', cases };
}

/** Inspect the installed browser's native media controls without changing their handlers. */
async function locateOwn12NativeControl({
  cdp,
  evidence,
  kind,
  page,
  video,
  hoveredVolume = false,
}: {
  cdp: CDPSession;
  evidence: Own12ModeEvidence;
  kind: NativeControlPoint['kind'];
  page: Page;
  video: Locator;
  hoveredVolume?: boolean;
}): Promise<NativeControlPoint> {
  await page.bringToFront();
  await page.waitForFunction(() => document.visibilityState === 'visible');
  await video.scrollIntoViewIfNeeded();
  const videoBox = await video.boundingBox();
  assert(videoBox && videoBox.width > 0 && videoBox.height > 0, 'Native host video has no box');
  if (!hoveredVolume) {
    await page.mouse.move(videoBox.x + videoBox.width / 2, videoBox.y + videoBox.height - 12);
  }
  const geometry = await video.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height / 2);
    return {
      x,
      y,
      width: innerWidth,
      height: innerHeight,
      scrollX,
      scrollY,
      devicePixelRatio,
      visibility: document.visibilityState,
      connected: element.isConnected,
      centerHitsHost: document.elementFromPoint(x, y) === element,
      visualViewport: visualViewport
        ? {
            width: visualViewport.width,
            height: visualViewport.height,
            scale: visualViewport.scale,
            offsetLeft: visualViewport.offsetLeft,
            offsetTop: visualViewport.offsetTop,
          }
        : null,
    };
  });
  assert(evidence.geometry.length < 8, 'Native control geometry observation budget exceeded');
  const coordinateProbes: Array<{
    viewport: { x: number; y: number };
    document: { x: number; y: number };
  }> = [];
  evidence.geometry.push({ kind, videoBox, ...geometry, coordinateProbes });
  assert(
    geometry.visualViewport?.scale === 1 &&
      geometry.visualViewport.offsetLeft === 0 &&
      geometry.visualViewport.offsetTop === 0,
    'Native control probe requires an unpinched desktop viewport'
  );
  assert(
    geometry.connected && geometry.centerHitsHost,
    'Native host video center must be visible and hit-testable'
  );
  assert(
    geometry.x > 0 && geometry.x < geometry.width && geometry.y > 0 && geometry.y < geometry.height,
    'Native host center must be inside the viewport'
  );
  // Identify the exact B element directly; controls still require a real pointer hit below.
  const documentNode = await cdp.send('DOM.getDocument', { depth: 0 });
  const hosts = await cdp.send('DOM.querySelectorAll', {
    nodeId: documentNode.root.nodeId,
    selector: '[data-rapid="b"] video',
  });
  assert.equal(hosts.nodeIds.length, 1, 'Expected one exact rapid B host video');
  const described = await cdp.send('DOM.describeNode', {
    nodeId: hosts.nodeIds[0]!,
    depth: 10,
    pierce: true,
  });
  assert.equal(described.node.nodeName, 'VIDEO', 'Native control host must be a video');

  const entries: Array<{ node: NativeControlNode; label: string; pseudo: string | null }> = [];
  const uaInputs: Own12ModeEvidence['discovery'][number]['uaInputs'] = [];
  let uaInputCount = 0;
  let visited = 0;
  const visit = (node: NativeControlNode, inUserAgentShadow: boolean, depth: number) => {
    visited++;
    assert(visited <= 160 && depth <= 12, 'Native controls exceeded the bounded DOM inspection');
    const owned = inUserAgentShadow || node.shadowRootType === 'user-agent';
    if (owned) {
      const attributes = node.attributes ?? [];
      const labels = [];
      const selected: Record<string, string> = {};
      for (let index = 0; index + 1 < attributes.length; index += 2) {
        const key = attributes[index];
        if (key && ['pseudo', 'class', 'id', 'aria-label', 'title', 'role', 'type'].includes(key)) {
          const value = attributes[index + 1] ?? '';
          selected[key] = value;
          labels.push(`${key}=${value}`);
        }
      }
      entries.push({
        node,
        label: `${node.nodeName} ${labels.join(' ')}`.slice(0, 220),
        pseudo: selected.pseudo ?? null,
      });
      if (node.nodeName === 'INPUT') {
        uaInputCount++;
        if (uaInputs.length < 24) {
          uaInputs.push({
            backendNodeId: node.backendNodeId,
            pseudo: selected.pseudo ?? null,
            className: selected.class ?? null,
            ariaLabel: selected['aria-label']?.slice(0, 100) ?? null,
            type: selected.type ?? null,
          });
        }
      }
    }
    for (const child of node.children ?? []) {
      visit(child, owned, depth + 1);
    }
    for (const shadow of node.shadowRoots ?? []) {
      visit(shadow, owned, depth + 1);
    }
  };
  visit(described.node, false, 0);
  const matches = ({ node, pseudo }: (typeof entries)[number]) => {
    switch (kind) {
      case 'play':
        return node.nodeName === 'INPUT' && pseudo === '-webkit-media-controls-play-button';
      case 'timeline':
        return pseudo === '-webkit-media-controls-timeline';
      case 'volume':
        return pseudo === '-webkit-media-controls-volume-slider';
    }
  };
  const candidates = entries.filter(matches);
  const discovery: Own12ModeEvidence['discovery'][number] = {
    kind,
    candidates: candidates.slice(0, 12).map(({ label }) => label),
    uaInputs,
    uaInputCount,
    hostState: await video.evaluate((element) => {
      if (!(element instanceof HTMLVideoElement)) {
        throw new Error('OWN-12 host video missing during native control discovery');
      }
      return {
        paused: element.paused,
        currentTime: element.currentTime,
        ended: element.ended,
        readyState: element.readyState,
        error: element.error?.code ?? null,
      };
    }),
    probes: [],
  };
  evidence.discovery.push(discovery);
  assert(uaInputCount <= 24, `${kind}: too many native input controls`);
  assert(candidates.length <= 12, `${kind}: too many native control candidates`);
  const descendantIds = (node: NativeControlNode): Set<number> => {
    const ids = new Set<number>([node.backendNodeId]);
    const append = (child: NativeControlNode) => {
      ids.add(child.backendNodeId);
      for (const next of child.children ?? []) {
        append(next);
      }
      for (const next of child.shadowRoots ?? []) {
        append(next);
      }
    };
    for (const child of node.children ?? []) {
      append(child);
    }
    for (const child of node.shadowRoots ?? []) {
      append(child);
    }
    return ids;
  };
  for (const { node, label } of candidates) {
    const probe: NativeControlProbe = {
      backendNodeId: node.backendNodeId,
      rejection: 'box-unavailable',
    };
    discovery.probes.push(probe);
    const box = await cdp
      .send('DOM.getBoxModel', { backendNodeId: node.backendNodeId })
      .catch(() => null);
    if (!box) {
      continue;
    }
    const quad = box.model.border;
    const xs = [quad[0], quad[2], quad[4], quad[6]];
    const ys = [quad[1], quad[3], quad[5], quad[7]];
    if (xs.some((value) => value === undefined) || ys.some((value) => value === undefined)) {
      probe.rejection = 'invalid-box';
      continue;
    }
    const left = Math.min(...(xs as number[]));
    const right = Math.max(...(xs as number[]));
    const top = Math.min(...(ys as number[]));
    const bottom = Math.max(...(ys as number[]));
    if (right - left < 4 || bottom - top < 4) {
      probe.rejection = 'too-small';
      continue;
    }
    const x = Math.round(left + (right - left) * (kind === 'timeline' ? 0.65 : 0.5));
    const y = Math.round((top + bottom) / 2);
    if (
      x < videoBox.x ||
      x > videoBox.x + videoBox.width ||
      y < videoBox.y ||
      y > videoBox.y + videoBox.height
    ) {
      probe.rejection = 'outside-video';
      continue;
    }
    probe.viewport = { x, y };
    // getBoxModel and mouse input use viewport points; CDP hit testing uses document points.
    const documentPoint = await page.evaluate(
      ({ viewportX, viewportY }) => ({
        x: Math.round(viewportX + scrollX),
        y: Math.round(viewportY + scrollY),
      }),
      { viewportX: x, viewportY: y }
    );
    coordinateProbes.push({ viewport: { x, y }, document: documentPoint });
    probe.document = documentPoint;
    const hits = await Promise.all([
      cdp.send('DOM.getNodeForLocation', { ...documentPoint, includeUserAgentShadowDOM: true }),
      cdp.send('DOM.getNodeForLocation', { ...documentPoint, includeUserAgentShadowDOM: false }),
    ]).catch(() => null);
    if (!hits) {
      probe.rejection = 'hit-query-error';
      continue;
    }
    const [hit, hostHit] = hits;
    probe.hitBackendNodeId = hit.backendNodeId;
    probe.hostBackendNodeId = hostHit.backendNodeId;
    if (hostHit.backendNodeId !== described.node.backendNodeId) {
      probe.rejection = 'wrong-host';
      continue;
    }
    if (!descendantIds(node).has(hit.backendNodeId)) {
      probe.rejection = 'wrong-descendant';
      continue;
    }
    probe.rejection = 'accepted';
    return { kind, x, y, node: label, hitBackendNodeId: hit.backendNodeId, documentPoint };
  }
  if (kind === 'volume' && !hoveredVolume) {
    const button = entries.find(
      ({ node, pseudo }) =>
        node.nodeName === 'INPUT' && pseudo === '-webkit-media-controls-mute-button'
    );
    if (button) {
      const box = await cdp
        .send('DOM.getBoxModel', { backendNodeId: button.node.backendNodeId })
        .catch(() => null);
      if (box) {
        const quad = box.model.border;
        const x = Math.round((quad[0]! + quad[2]! + quad[4]! + quad[6]!) / 4);
        const y = Math.round((quad[1]! + quad[3]! + quad[5]! + quad[7]!) / 4);
        await page.mouse.move(x, y);
        const slider = candidates[0];
        const started = Date.now();
        let attempts = 0;
        let boxAvailable = false;
        if (slider) {
          do {
            attempts++;
            const sliderBox = await cdp
              .send('DOM.getBoxModel', { backendNodeId: slider.node.backendNodeId })
              .catch(() => null);
            // Closed controls can expose a zero-width box before the native hover delay ends.
            boxAvailable = Boolean(
              sliderBox && sliderBox.model.width >= 4 && sliderBox.model.height >= 4
            );
            if (!boxAvailable && Date.now() - started < 2000) {
              await page.waitForTimeout(50);
            }
          } while (!boxAvailable && Date.now() - started < 2000);
        }
        discovery.hoverWait = { attempts, elapsedMs: Date.now() - started, boxAvailable };
        return locateOwn12NativeControl({
          cdp,
          evidence,
          kind,
          page,
          video,
          hoveredVolume: true,
        });
      }
    }
  }
  throw new Error(`${kind}: installed Edge native control was not identified and hit-tested`);
}

async function runOwn12NativeControlsMode({
  apiResponses,
  compactApiResponses,
  context,
  extensionPage,
  mode,
  qualityApiResponses,
  quotedApiResponses,
}: {
  apiResponses: ApiRecord[];
  compactApiResponses: ApiRecord[];
  context: BrowserContext;
  extensionPage: Page;
  mode: Own12Mode;
  qualityApiResponses: ApiRecord[];
  quotedApiResponses: ApiRecord[];
}): Promise<{ evidence: Own12ModeEvidence; errors: unknown[] }> {
  const metadataCounts = () => ({
    generic: apiResponses.length,
    quoted: quotedApiResponses.length,
    quality: qualityApiResponses.length,
    compact: compactApiResponses.length,
  });
  const evidence: Own12ModeEvidence = {
    status: 'pending',
    mode,
    geometry: [],
    discovery: [],
    events: [],
    cleanup: {
      observerRemoved: false,
      cdpDetached: false,
      listenersRemoved: false,
      pageClosed: false,
      errors: [],
    },
  };
  let page: Page;
  try {
    page = await context.newPage();
  } catch (error) {
    evidence.status = 'failed';
    evidence.error = safeError(error);
    return { evidence, errors: [error] };
  }
  const pageErrors: string[] = [];
  const onPageError = (error: Error) => {
    if (pageErrors.length < 8) {
      pageErrors.push(error.message.slice(0, 500));
    }
  };
  page.on('pageerror', onPageError);
  let cdp: CDPSession | undefined;
  let observerInstalled = false;
  const errors: unknown[] = [];
  const releaseNative = async () => {
    if (observerInstalled && !page.isClosed()) {
      try {
        evidence.events = await page.evaluate(() => {
          const state = (
            window as Window & {
              __xegOwn12NativeEvents?: {
                records: Own12ModeEvidence['events'];
                dispose: () => void;
              };
            }
          ).__xegOwn12NativeEvents;
          const records = state?.records ?? [];
          state?.dispose();
          delete (window as Window & { __xegOwn12NativeEvents?: unknown }).__xegOwn12NativeEvents;
          return records;
        });
        observerInstalled = false;
        evidence.cleanup.observerRemoved = true;
      } catch (error) {
        errors.push(error);
        evidence.cleanup.errors.push(safeError(error));
      }
    } else if (!observerInstalled) {
      evidence.cleanup.observerRemoved = true;
    }
    if (cdp) {
      try {
        await cdp.send('DOM.disable');
      } catch (error) {
        errors.push(error);
        evidence.cleanup.errors.push(safeError(error));
      }
      try {
        await cdp.detach();
        cdp = undefined;
        evidence.cleanup.cdpDetached = true;
      } catch (error) {
        errors.push(error);
        evidence.cleanup.errors.push(safeError(error));
      }
    } else {
      evidence.cleanup.cdpDetached = true;
    }
  };
  try {
    const pageUrl = `https://x.com/rapid_a/status/${RAPID_CLICK_A}`;
    const nativeSetting: ControlledSettingEvidence = {};
    evidence.native = { status: 'pending', controlledSetting: nativeSetting };
    try {
      evidence.native = {
        status: 'passed',
        ...(await withControlledFixtureVideoMode(
          extensionPage,
          nativeSetting,
          async () => {
            await page.goto(pageUrl);
            await page
              .locator('html[data-xeg-gallery-ready="true"]')
              .waitFor({ state: 'attached' });
            const video = page.locator('[data-rapid="b"] video');
            await video.scrollIntoViewIfNeeded();
            await page.waitForFunction(() => {
              const host = document.querySelector('[data-rapid="b"] video');
              return (
                host instanceof HTMLVideoElement && host.readyState >= 2 && host.error === null
              );
            });
            const storedMode = storedVideoClickMode(
              (await readStoredVideoSettings(extensionPage)).settings
            );
            assert.equal(storedMode, mode);
            const apiStart = quotedApiResponses.length;
            const metadataStart = metadataCounts();
            const initial = await hostVideoState(video);
            assert(initial.paused && initial.readyState >= 2 && initial.error === null);
            assert.equal(initial.width, 320);
            assert.equal(initial.height, 180);
            await page.evaluate(() => {
              const host = document.querySelector('[data-rapid="b"] video');
              if (!(host instanceof HTMLVideoElement)) {
                throw new Error('OWN-12 host video missing');
              }
              const records: Array<{
                type: string;
                trusted: boolean;
                time: number;
                volume: number;
                paused: boolean;
              }> = [];
              const onMediaEvent = (event: Event) => {
                if (event.target !== host) {
                  return;
                }
                if (records.length >= 24) {
                  throw new Error('OWN-12 native event budget exceeded');
                }
                records.push({
                  type: event.type,
                  trusted: event.isTrusted,
                  time: host.currentTime,
                  volume: host.volume,
                  paused: host.paused,
                });
              };
              for (const type of ['play', 'pause', 'seeking', 'seeked', 'volumechange']) {
                host.addEventListener(type, onMediaEvent, true);
              }
              (
                window as Window & {
                  __xegOwn12NativeEvents?: {
                    records: typeof records;
                    dispose: () => void;
                  };
                }
              ).__xegOwn12NativeEvents = {
                records,
                dispose: () => {
                  for (const type of ['play', 'pause', 'seeking', 'seeked', 'volumechange']) {
                    host.removeEventListener(type, onMediaEvent, true);
                  }
                },
              };
            });
            observerInstalled = true;
            cdp = await context.newCDPSession(page);
            await cdp.send('DOM.enable');
            const assertNativeOnly = async (label: string) => {
              assert.equal(
                await page.locator('[data-xeg-gallery-container]').count(),
                0,
                `${label}: native control opened a gallery`
              );
              assert.deepEqual(
                metadataCounts(),
                metadataStart,
                `${label}: metadata request dispatched`
              );
            };
            const play = await locateOwn12NativeControl({
              cdp,
              evidence,
              kind: 'play',
              page,
              video,
            });
            await page.mouse.click(play.x, play.y);
            await page.waitForFunction(() => {
              const host = document.querySelector('[data-rapid="b"] video');
              return (
                host instanceof HTMLVideoElement &&
                !host.paused &&
                host.currentTime > 0.15 &&
                host.videoWidth === 320 &&
                host.videoHeight === 180 &&
                host.error === null
              );
            });
            const playing = await hostVideoState(video);
            assert.equal(playing.ended, false);
            await assertNativeOnly('Play');
            const pause = await locateOwn12NativeControl({
              cdp,
              evidence,
              kind: 'play',
              page,
              video,
            });
            await page.mouse.click(pause.x, pause.y);
            await page.waitForFunction(() => {
              const host = document.querySelector('[data-rapid="b"] video');
              return host instanceof HTMLVideoElement && host.paused && !host.ended;
            });
            const paused = await hostVideoState(video);
            await page.waitForTimeout(350);
            const pausedStable = await hostVideoState(video);
            assert(pausedStable.currentTime - paused.currentTime < 0.05);
            await assertNativeOnly('Pause');
            const timeline = await locateOwn12NativeControl({
              cdp,
              evidence,
              kind: 'timeline',
              page,
              video,
            });
            await page.mouse.click(timeline.x, timeline.y);
            await page.waitForFunction((start) => {
              const host = document.querySelector('[data-rapid="b"] video');
              return host instanceof HTMLVideoElement && host.currentTime > start + 0.25;
            }, pausedStable.currentTime);
            const seeked = await hostVideoState(video);
            assert.equal(seeked.paused, true);
            await assertNativeOnly('Seek');
            const volume = await locateOwn12NativeControl({
              cdp,
              evidence,
              kind: 'volume',
              page,
              video,
            });
            await page.mouse.click(volume.x, volume.y);
            await page.waitForFunction((prior) => {
              const host = document.querySelector('[data-rapid="b"] video');
              return host instanceof HTMLVideoElement && Math.abs(host.volume - prior) > 0.1;
            }, seeked.volume);
            const volumeAfter = await hostVideoState(video);
            assert.equal(volumeAfter.paused, true);
            await assertNativeOnly('Volume');
            // Native events are queued after control values change; wait for the observed events.
            await page.waitForFunction(
              () => {
                const records = (
                  window as Window & {
                    __xegOwn12NativeEvents?: { records: Own12ModeEvidence['events'] };
                  }
                ).__xegOwn12NativeEvents?.records;
                return ['play', 'pause', 'seeked', 'volumechange'].every((type) =>
                  records?.some((event) => event.type === type && event.trusted)
                );
              },
              undefined,
              { timeout: 2_000 }
            );
            evidence.events = await page.evaluate(
              () =>
                (
                  window as Window & {
                    __xegOwn12NativeEvents?: { records: Own12ModeEvidence['events'] };
                  }
                ).__xegOwn12NativeEvents?.records ?? []
            );
            for (const type of ['play', 'pause', 'seeked', 'volumechange']) {
              assert(
                evidence.events.some((event) => event.type === type && event.trusted),
                `${type}: trusted native media event missing`
              );
            }
            assert.deepEqual(pageErrors, []);
            return {
              pageUrl,
              storedMode,
              controlledSetting: nativeSetting,
              initial,
              controls: { play, pause, timeline, volume },
              playing,
              paused,
              pausedStable,
              seeked,
              volumeAfter,
              metadata: { before: metadataStart, after: metadataCounts() },
              api: quotedApiResponses.slice(apiStart),
            };
          },
          mode
        )),
      };
    } catch (error) {
      errors.push(error);
      evidence.native = {
        status: 'failed',
        controlledSetting: nativeSetting,
        pageErrors: [...pageErrors],
        error: safeError(error),
      };
    } finally {
      await releaseNative();
    }
    if (nativeSetting.restored === false) {
      evidence.settingsRestorationFailed = true;
      evidence.adjacentPhoto = {
        status: 'not-run',
        error: 'Native mode settings were not restored',
      };
    } else {
      pageErrors.length = 0;
      const photoSetting: ControlledSettingEvidence = {};
      evidence.adjacentPhoto = { status: 'pending', controlledSetting: photoSetting };
      try {
        evidence.adjacentPhoto = {
          status: 'passed',
          ...(await withControlledFixtureVideoMode(
            extensionPage,
            photoSetting,
            async () => {
              await page.goto(pageUrl);
              await page
                .locator('html[data-xeg-gallery-ready="true"]')
                .waitFor({ state: 'attached' });
              const storedMode = storedVideoClickMode(
                (await readStoredVideoSettings(extensionPage)).settings
              );
              assert.equal(storedMode, mode);
              const videoApiStart = quotedApiResponses.length;
              const videoMetadataStart = metadataCounts();
              let videoHit: { x: number; y: number; hit: boolean } | undefined;
              if (mode === 'block-all') {
                const video = page.locator('[data-rapid="b"] video');
                await video.scrollIntoViewIfNeeded();
                videoHit = await video.evaluate((element) => {
                  const rect = element.getBoundingClientRect();
                  const x = rect.left + rect.width / 2;
                  const y = rect.top + rect.height / 2;
                  return { x, y, hit: document.elementFromPoint(x, y) === element };
                });
                assert.equal(videoHit.hit, true, 'block-all B video surface is not hit-tested');
                await page.mouse.click(videoHit.x, videoHit.y);
                await page.waitForTimeout(150);
                assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
                assert.deepEqual(
                  metadataCounts(),
                  videoMetadataStart,
                  'block-all B video dispatched gallery metadata'
                );
              }
              const photo = page.locator('[data-rapid="b"] [data-testid="tweetPhoto"] img');
              await photo.scrollIntoViewIfNeeded();
              await page.evaluate(() => window.scrollBy(0, -100));
              await photo.focus();
              const snapshot = () =>
                page.evaluate(() => {
                  const target = document.querySelector(
                    '[data-rapid="b"] [data-testid="tweetPhoto"] img'
                  );
                  return {
                    focused: document.activeElement === target,
                    scrollY,
                    bodyStyle: document.body.style.cssText,
                    background: ['#host-layout-spacer', 'main'].map((selector) => {
                      const node = document.querySelector(selector);
                      return {
                        hidden: node?.hasAttribute('data-xeg-gallery-hidden') ?? false,
                        inert: node?.hasAttribute('inert') ?? false,
                        ariaHidden: node?.getAttribute('aria-hidden') ?? null,
                      };
                    }),
                  };
                });
              const before = await snapshot();
              assert(before.focused && before.scrollY > 0);
              const photoHit = await photo.evaluate((element) => {
                const rect = element.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                return { x, y, hit: document.elementFromPoint(x, y) === element };
              });
              assert.equal(photoHit.hit, true, 'B photo must be the ordinary hit-tested target');
              await page.mouse.click(photoHit.x, photoHit.y);
              const gallery = page.locator('[data-xeg-gallery-container]');
              await gallery.waitFor({ state: 'visible' });
              const selected = await assertQuotedSelection(page, {
                position: 1,
                total: 2,
                type: 'image',
                path: '/media/QQuoteTwoPhoto.jpg',
              });
              const originUrl = await assertQuotedOriginLink(
                gallery,
                `https://x.com/rapid_b/status/${RAPID_CLICK_B}`
              );
              const api = quotedApiResponses.slice(videoApiStart);
              assert.deepEqual(
                api.map(({ tweetId }) => tweetId),
                [RAPID_CLICK_B]
              );
              assert.deepEqual(metadataCounts(), {
                ...videoMetadataStart,
                quoted: videoMetadataStart.quoted + 1,
              });
              await page.keyboard.press('Escape');
              await gallery.waitFor({ state: 'detached' });
              const after = await snapshot();
              assert.deepEqual(
                after,
                before,
                'B photo close must restore host focus and isolation'
              );
              assert.deepEqual(pageErrors, []);
              return {
                pageUrl,
                storedMode,
                controlledSetting: photoSetting,
                videoHit,
                photoHit,
                selected,
                originUrl,
                api,
                metadata: { before: videoMetadataStart, after: metadataCounts() },
                before,
                after,
              };
            },
            mode
          )),
        };
      } catch (error) {
        errors.push(error);
        evidence.adjacentPhoto = {
          status: 'failed',
          controlledSetting: photoSetting,
          pageErrors: [...pageErrors],
          error: safeError(error),
        };
      }
      if (photoSetting.restored === false) {
        evidence.settingsRestorationFailed = true;
      }
    }
  } catch (error) {
    errors.push(error);
    evidence.error = safeError(error);
  } finally {
    await releaseNative();
    page.off('pageerror', onPageError);
    evidence.cleanup.listenersRemoved = true;
    try {
      await page.close();
      evidence.cleanup.pageClosed = true;
    } catch (error) {
      errors.push(error);
      evidence.cleanup.errors.push(safeError(error));
    }
    evidence.status = errors.length ? 'failed' : 'passed';
  }
  return { evidence, errors };
}

async function runOwn12NativeControls({
  apiResponses,
  compactApiResponses,
  context,
  extensionPage,
  fixtureRoutes,
  output,
  qualityApiResponses,
  quotedApiResponses,
}: {
  apiResponses: ApiRecord[];
  compactApiResponses: ApiRecord[];
  context: BrowserContext;
  extensionPage: Page;
  fixtureRoutes: Awaited<ReturnType<typeof installFixtureRoutes>>;
  output: string;
  qualityApiResponses: ApiRecord[];
  quotedApiResponses: ApiRecord[];
}): Promise<Own12NativeControlsEvidence> {
  const evidence: Own12NativeControlsEvidence = {
    status: 'pending',
    modes: [],
    cleanup: { errors: [] },
  };
  const modes = ['block-controls-only', 'allow-all', 'block-all'] as const;
  const notRunMode = (mode: Own12Mode, error: string): Own12ModeEvidence => ({
    status: 'not-run',
    mode,
    error,
    geometry: [],
    discovery: [],
    events: [],
    cleanup: {
      observerRemoved: false,
      cdpDetached: false,
      listenersRemoved: false,
      pageClosed: false,
      errors: [],
    },
  });
  const errors: unknown[] = [];
  let armed = false;
  let receiptError: unknown;
  let blockedReason: string | undefined;
  try {
    evidence.transport = fixtureRoutes.armOwn12RapidBAudioVideo();
    armed = true;
    for (const mode of modes) {
      if (blockedReason) {
        evidence.modes.push(notRunMode(mode, blockedReason));
        continue;
      }
      const result = await runOwn12NativeControlsMode({
        apiResponses,
        compactApiResponses,
        context,
        extensionPage,
        mode,
        qualityApiResponses,
        quotedApiResponses,
      });
      evidence.modes.push(result.evidence);
      errors.push(...result.errors);
      if (result.evidence.settingsRestorationFailed) {
        blockedReason = `Prior ${mode} settings could not be restored`;
      }
    }
  } catch (error) {
    errors.push(error);
    evidence.error = safeError(error);
  } finally {
    for (const mode of modes.slice(evidence.modes.length)) {
      evidence.modes.push(notRunMode(mode, evidence.error ?? 'OWN-12 setup failed'));
    }
    if (armed) {
      try {
        fixtureRoutes.clearOwn12RapidBAudioVideo();
        evidence.transport!.restored = true;
      } catch (error) {
        errors.push(error);
        evidence.cleanup.errors.push(safeError(error));
      }
    }
    evidence.status = errors.length ? 'failed' : 'passed';
    try {
      await writeFile(
        join(output, 'own12-native-controls-observations.json'),
        JSON.stringify(evidence, null, 2)
      );
    } catch (error) {
      receiptError = error;
    }
  }
  const failures = [...errors, ...(receiptError ? [receiptError] : [])];
  if (failures.length > 1) {
    throw new AggregateError(failures, 'OWN-12 mode validation and cleanup failed');
  }
  if (failures.length === 1) {
    throw failures[0];
  }
  return evidence;
}

async function quotedTargetDepth(target: Locator) {
  return target.evaluate((element) => {
    const hopsTo = (boundary: Element | null) => {
      let hops = 0;
      for (let current = element.parentElement; current; current = current.parentElement) {
        hops++;
        if (current === boundary) {
          return hops;
        }
      }
      return null;
    };
    return {
      videoComponent: hopsTo(element.closest('[data-testid="videoComponent"]')),
      videoPlayer: hopsTo(element.closest('[data-testid="videoPlayer"]')),
      roleLink: hopsTo(element.closest('[role="link"]')),
      article: hopsTo(element.closest('article')),
    };
  });
}

const UNMARKED_VIDEO_DEPTH = {
  videoComponent: 4,
  videoPlayer: 7,
  roleLink: 18,
  article: 24,
} as const;

async function observeRetiredNativeVolume({
  before,
  extensionPage,
  hostVideo,
  output,
  page,
  quotedCase,
  selected,
}: {
  before: Awaited<ReturnType<typeof quotedHostSnapshot>>;
  extensionPage: Page;
  hostVideo: Locator;
  output: string;
  page: Page;
  quotedCase: QuotedCase;
  selected: Awaited<ReturnType<typeof assertQuotedGallery>>;
}) {
  let prior: Awaited<ReturnType<typeof readStoredVideoSettings>> | undefined;
  let retired: Awaited<ReturnType<typeof selected.video.elementHandle>> | undefined;
  const evidence: Record<string, unknown> = { status: 'pending', firstVolume: 0.27 };
  const samples: unknown[] = [];
  evidence.samples = samples;
  let reopenedBefore: Awaited<ReturnType<typeof quotedHostSnapshot>> | undefined;
  let validationError: unknown;
  const cleanupErrors: unknown[] = [];
  try {
    prior = await readStoredVideoSettings(extensionPage);
    const firstMuted = !storedGalleryMediaPreferences(prior.settings).muted;
    evidence.firstMuted = firstMuted;
    retired = await selected.video.elementHandle();
    assert(retired, 'Selected B video must remain available for detached observation');
    await selected.video.evaluate((element, muted) => {
      if (!(element instanceof HTMLVideoElement)) {
        throw new Error('Selected B video is missing');
      }
      element.volume = 0.27;
      element.muted = muted;
    }, firstMuted);
    evidence.firstStored = await waitForValue(
      async () => {
        const prefs = storedGalleryMediaPreferences(
          (await readStoredVideoSettings(extensionPage)).settings
        );
        return Math.abs(prefs.volume - 0.27) < 0.01 && prefs.muted === firstMuted
          ? prefs
          : undefined;
      },
      'first native B volume persisted',
      5_000
    );
    evidence.firstClose = await closeQuotedGallery({
      gallery: selected.gallery,
      page,
      method: quotedCase.close,
      before,
      caseName: quotedCase.route,
      selector: '[data-video-key] video',
    });
    const detached = await retired.evaluate((element) => element.isConnected);
    assert.equal(detached, false, 'Retired B video must be detached after ordinary close');
    await hostVideo.focus();
    reopenedBefore = await quotedHostSnapshot(page, quotedCase.route, '[data-video-key] video');
    await captureQuotedOpeningScroll(hostVideo);
    const clickCount = await page.evaluate(() => window.__quoteFixtureClicks.length);
    await hostVideo.click();
    evidence.reopenClick = await quotedClickRecord(page, clickCount, 'video');
    reopenedBefore.scrollY = Number(await hostVideo.getAttribute('data-opening-scroll-y'));
    assert(Number.isFinite(reopenedBefore.scrollY) && reopenedBefore.scrollY > 0);
    const current = await assertQuotedGallery(page, quotedCase);
    assert.equal(current.selectedMedia.src, selected.selectedMedia.src);
    evidence.reopenOrigin = await assertQuotedOriginLink(
      current.gallery,
      `https://x.com/${quotedCase.username}/status/${quotedCase.owner}`
    );
    const readCurrent = () =>
      current.video.evaluate((element) => {
        if (!(element instanceof HTMLVideoElement)) {
          throw new Error('Current B video is missing');
        }
        return {
          connected: element.isConnected,
          source: element.currentSrc,
          volume: element.volume,
          muted: element.muted,
          paused: element.paused,
          error: element.error?.code ?? null,
        };
      });
    const initialCurrent = await readCurrent();
    assert(initialCurrent.connected && initialCurrent.paused && initialCurrent.error === null);
    assert.equal(initialCurrent.source, selected.selectedMedia.src);
    assert(Math.abs(initialCurrent.volume - 0.27) < 0.01 && initialCurrent.muted === firstMuted);
    evidence.initialCurrent = initialCurrent;
    const retiredEvent = await retired.evaluate((element) => {
      if (!(element instanceof HTMLVideoElement)) {
        throw new Error('Retired B video is missing');
      }
      return new Promise<{ trusted: boolean; connected: boolean; volume: number; muted: boolean }>(
        (resolveEvent, rejectEvent) => {
          const onVolumeChange = (event: Event) => {
            clearTimeout(timeout);
            element.removeEventListener('volumechange', onVolumeChange);
            resolveEvent({
              trusted: event.isTrusted,
              connected: element.isConnected,
              volume: element.volume,
              muted: element.muted,
            });
          };
          const timeout = setTimeout(() => {
            element.removeEventListener('volumechange', onVolumeChange);
            rejectEvent(
              new Error('Detached native volumechange was not observed within 2 seconds')
            );
          }, 2_000);
          element.addEventListener('volumechange', onVolumeChange, { once: true });
          try {
            element.volume = 0.83;
          } catch (error) {
            clearTimeout(timeout);
            element.removeEventListener('volumechange', onVolumeChange);
            rejectEvent(error);
          }
        }
      );
    });
    evidence.retiredEvent = retiredEvent;
    assert(
      retiredEvent.trusted && !retiredEvent.connected,
      'Detached native event must be trusted'
    );
    assert(Math.abs(retiredEvent.volume - 0.83) < 0.01);
    for (let index = 0; index < 5; index++) {
      await delay(250);
      const stored = storedGalleryMediaPreferences(
        (await readStoredVideoSettings(extensionPage)).settings
      );
      const observed = await readCurrent();
      samples.push({ atMs: performance.now(), stored, current: observed });
      assert(Math.abs(stored.volume - 0.27) < 0.01 && stored.muted === firstMuted);
      assert(observed.connected && observed.paused && observed.error === null);
      assert.equal(observed.source, selected.selectedMedia.src);
      assert(Math.abs(observed.volume - 0.27) < 0.01 && observed.muted === firstMuted);
    }
    await current.video.evaluate((element, muted) => {
      if (!(element instanceof HTMLVideoElement)) {
        throw new Error('Current B video is missing');
      }
      element.volume = 0.41;
      element.muted = muted;
    }, !firstMuted);
    evidence.activeStored = await waitForValue(
      async () => {
        const prefs = storedGalleryMediaPreferences(
          (await readStoredVideoSettings(extensionPage)).settings
        );
        return Math.abs(prefs.volume - 0.41) < 0.01 && prefs.muted === !firstMuted
          ? prefs
          : undefined;
      },
      'active B native volume persisted',
      5_000
    );
    const activeCurrent = await readCurrent();
    assert(activeCurrent.connected && activeCurrent.paused && activeCurrent.error === null);
    assert.equal(activeCurrent.source, selected.selectedMedia.src);
    assert(Math.abs(activeCurrent.volume - 0.41) < 0.01 && activeCurrent.muted === !firstMuted);
    evidence.activeCurrent = activeCurrent;
  } catch (error) {
    validationError = error;
    evidence.error = safeError(error);
  } finally {
    try {
      const gallery = page.locator('[data-xeg-gallery-container]');
      if (await gallery.count()) {
        evidence.finalClose = await closeQuotedGallery({
          gallery,
          page,
          method: quotedCase.close,
          before: reopenedBefore ?? before,
          caseName: quotedCase.route,
          selector: '[data-video-key] video',
        });
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      if (prior) {
        await delay(350);
        evidence.settingsRestored = await restoreStoredVideoSettings(extensionPage, prior);
        assert.equal(
          evidence.settingsRestored,
          true,
          'Retired volume cycle must restore exact settings'
        );
      } else {
        evidence.settingsRestored = false;
        evidence.settingsRestoreSkipped = 'Initial settings snapshot unavailable before mutation';
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
    await retired?.dispose().catch((error: unknown) => cleanupErrors.push(error));
    evidence.cleanupErrors = cleanupErrors.map((error) => safeError(error));
    evidence.status = validationError || cleanupErrors.length ? 'failed' : 'passed';
    try {
      await writeFile(
        join(output, 'native-retired-volume-observations.json'),
        JSON.stringify(evidence, null, 2)
      );
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (validationError || cleanupErrors.length) {
    throw new AggregateError(
      [...(validationError ? [validationError] : []), ...cleanupErrors],
      'Retired native volume validation or cleanup failed'
    );
  }
  return evidence;
}

async function runQuotedVideoCycle({
  quotedCase,
  quotedApiResponses,
  downloads,
  extensionPage,
  output,
  page,
  videoPayloads,
  nativeLoopback,
  pageFetches,
}: {
  quotedCase: QuotedCase;
  quotedApiResponses: ApiRecord[];
  downloads: string;
  extensionPage: Page;
  output: string;
  page: Page;
  videoPayloads: Record<string, Buffer>;
  nativeLoopback: NativeLoopback;
  pageFetches: PageFetch[];
}) {
  const pageUrl = `https://x.com/${quotedCase.handle}/status/${quotedCase.outer}`;
  await page.goto(pageUrl);
  await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
    state: 'attached',
    timeout: 15_000,
  });
  await page.locator('body[data-video-ready="true"]').waitFor({
    state: 'attached',
    timeout: 15_000,
  });
  const article = page.locator(`[data-case="${quotedCase.route}"]`);
  const noOuterDomMediaCount =
    quotedCase.name === 'unmarked-no-outer'
      ? await article
          .locator(':scope > [data-testid="videoPlayer"], :scope > [data-testid="tweetPhoto"]')
          .count()
      : null;
  if (noOuterDomMediaCount !== null) {
    assert.equal(noOuterDomMediaCount, 0, 'A must have no own DOM media in the no-outer case');
  }
  const artifactName =
    quotedCase.name === 'unmarked-no-outer' ? 'own01-no-outer' : `quoted-${quotedCase.name}`;
  const checkpointName =
    quotedCase.name === 'unmarked-no-outer' ? 'own01-no-outer' : quotedCase.name;
  const shell = article.locator('[data-video-key]');
  const preview = shell.locator('[data-quote-target]');
  const hostVideo = shell.locator('video:not([data-host-action])');
  await preview.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await preview.focus();
  const previewBefore = await quotedHostSnapshot(page, quotedCase.route, '[data-quote-target]');
  assert.equal(previewBefore.active, true, 'Preview must hold focus before opening');
  assert(previewBefore.scrollY > 0, 'Quote fixture must start at nonzero host scroll');
  const previewState = await preview.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    const video = element.closest('[data-testid="videoPlayer"]')?.querySelector('video');
    return {
      hit: hit === element,
      poster: element.getAttribute('src'),
      videoSource: video?.getAttribute('src') ?? null,
    };
  });
  assert.equal(previewState.hit, true, 'Preview must be the ordinary hit-tested click target');
  assert.equal(previewState.videoSource, null, 'Preview check must precede native playback');
  assert(previewState.poster?.endsWith(`/${quotedCase.poster}.jpg`));
  const unmarkedPreviewDepth =
    quotedCase.route === 'unmarked'
      ? {
          target: await quotedTargetDepth(preview),
          video: await quotedTargetDepth(hostVideo),
        }
      : null;
  if (unmarkedPreviewDepth) {
    assert.deepEqual(
      unmarkedPreviewDepth.video,
      UNMARKED_VIDEO_DEPTH,
      'Unmarked preview must contain the exact 4/7/18/24 video geometry'
    );
    assert.deepEqual(
      unmarkedPreviewDepth.target,
      { videoComponent: 5, videoPlayer: 8, roleLink: 19, article: 25 },
      'Preview IMG has one additional interstitial ancestor'
    );
  }
  await page.screenshot({ path: join(output, `${artifactName}-before.png`) });

  const apiStart = quotedApiResponses.length;
  const previewClickCount = await page.evaluate(() => window.__quoteFixtureClicks.length);
  await captureQuotedOpeningScroll(preview);
  await preview.click();
  const previewPending = await writeVideoBoundaryCheckpoint({
    output,
    name: `${checkpointName}-preview`,
    page,
    api: quotedApiResponses.slice(apiStart),
  });
  const previewClick = await quotedClickRecord(page, previewClickCount, 'img');
  previewBefore.scrollY = Number(await preview.getAttribute('data-opening-scroll-y'));
  assert(
    Number.isFinite(previewBefore.scrollY) && previewBefore.scrollY > 0,
    'Preview opening scroll must be observed'
  );
  const initial = await assertQuotedGallery(page, quotedCase);
  const videoClickSettings =
    quotedCase.name === QUOTED_CASES[0]?.name
      ? await runVideoClickSettingsCycle({ extensionPage, gallery: initial.gallery, output, page })
      : null;
  const expectedRequest =
    quotedCase.name === 'linked' || quotedCase.name === 'nested-direct-quote'
      ? quotedCase.owner
      : quotedCase.outer;
  assert.deepEqual(
    quotedApiResponses.slice(apiStart).map(({ tweetId }) => tweetId),
    [expectedRequest],
    'Preview must use the exact owning tweet API request'
  );
  const noOuterProviderMediaCount =
    noOuterDomMediaCount === null ? null : quotedApiResponses[apiStart]?.rootMediaCount;
  if (noOuterDomMediaCount !== null) {
    assert.equal(noOuterProviderMediaCount, 0, 'A provider response must have no own media');
  }
  const previewOriginUrl = await assertQuotedOriginLink(
    initial.gallery,
    `https://x.com/${quotedCase.username}/status/${quotedCase.owner}`,
    quotedCase.name === 'linked'
  );
  let noOuterPanelText: string | null = null;
  if (noOuterDomMediaCount !== null) {
    await initial.gallery.locator('#tweet-text-button').click();
    noOuterPanelText = await initial.gallery.locator('#toolbar-tweet-panel').textContent();
    assert(noOuterPanelText, 'Selected no-outer video text panel is missing');
    assert(
      noOuterPanelText.includes(`${quotedCase.username} deterministic installed media`),
      'Selected no-outer video text must identify B'
    );
    assert(
      !noOuterPanelText.includes(`${quotedCase.handle} deterministic installed media`),
      'A text must not replace B attribution'
    );
    await initial.gallery.locator('#tweet-text-button').click();
  }
  const previewNavigation = await navigateQuotedAwayAndBack(page, quotedCase, initial.total);
  await page.screenshot({ path: join(output, `${artifactName}-preview-gallery.png`) });
  const previewClose = await closeQuotedGallery({
    gallery: initial.gallery,
    page,
    method: 'escape',
    before: previewBefore,
    caseName: quotedCase.route,
    selector: '[data-quote-target]',
  });

  const hostPlay = shell.locator('[data-testid="playButton"]');
  const postPlayOverlay = quotedCase.name === 'nested-from-outer';
  const surfaceSelector = postPlayOverlay
    ? '[data-video-key] [data-host-play-overlay]'
    : '[data-video-key] video';
  const surface = postPlayOverlay ? shell.locator('[data-host-play-overlay]') : hostVideo;
  if (postPlayOverlay) {
    assert.equal(await surface.count(), 0, 'The post-Play overlay must not exist before Play');
  }
  const galleryCountBeforePlay = await page.locator('[data-xeg-gallery-container]').count();
  assert.equal(galleryCountBeforePlay, 0);
  const nativePlayClickCount = await page.evaluate(() => window.__quoteFixtureClicks.length);
  await hostPlay.click();
  const nativePlayClick = await quotedClickRecord(page, nativePlayClickCount, 'button');
  assert.equal(
    nativePlayClick.defaultPrevented,
    true,
    'Fixture native play handler must receive and cancel its own trusted button click'
  );
  const unmarkedDepth = quotedCase.route === 'unmarked' ? await quotedTargetDepth(hostVideo) : null;
  if (unmarkedDepth) {
    assert.deepEqual(
      unmarkedDepth,
      UNMARKED_VIDEO_DEPTH,
      'Unmarked playing video must exercise the observed component, player, link and article depths'
    );
  }
  await page.waitForFunction(
    (name) => {
      const shell = document.querySelector(`[data-case="${name}"] [data-video-key]`);
      const video = shell?.querySelector('video');
      return (
        shell?.getAttribute('data-playing') === 'true' &&
        video instanceof HTMLVideoElement &&
        video.currentSrc.startsWith('blob:') &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.currentTime > 0 &&
        !video.paused &&
        video.error === null
      );
    },
    quotedCase.route,
    { timeout: 15_000 }
  );
  assert.equal(
    await page.locator('[data-xeg-gallery-container]').count(),
    0,
    'Native play control must not open the gallery'
  );
  const hostPlaying = await hostVideo.evaluate((video) => {
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error('Quoted host video is missing');
    }
    return {
      source: video.currentSrc,
      time: video.currentTime,
      width: video.videoWidth,
      height: video.videoHeight,
      error: video.error?.code ?? null,
    };
  });
  assert.equal(hostPlaying.width, 320);
  assert.equal(hostPlaying.height, 180);
  assert.equal(hostPlaying.error, null);
  const hostProgressStart = hostPlaying.time;
  await page.waitForFunction(
    ({ name, start }) => {
      const video = document.querySelector(`[data-case="${name}"] [data-video-key] video`);
      return (
        video instanceof HTMLVideoElement &&
        !video.paused &&
        video.error === null &&
        video.currentTime >= start + 0.15
      );
    },
    { name: quotedCase.route, start: hostProgressStart },
    { timeout: 5_000 }
  );
  const hostProgressEnd = await hostVideo.evaluate((video) => {
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error('Quoted host video is missing');
    }
    return video.currentTime;
  });
  await hostVideo.evaluate((video) => {
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error('Quoted host video is missing');
    }
    video.volume = 0.31;
    video.muted = true;
    video.loop = true;
  });
  const galleryPreferences = storedGalleryMediaPreferences(
    (await readStoredVideoSettings(extensionPage)).settings
  );
  if (postPlayOverlay) {
    assert.equal(await surface.count(), 1, 'Ordinary Play must insert exactly one fresh overlay');
    assert.equal(await preview.isVisible(), false, 'The retired preview must be hidden');
    assert.equal(await hostVideo.isVisible(), true);
  }
  await surface.focus();
  const playingBefore = await quotedHostSnapshot(page, quotedCase.route, surfaceSelector);
  assert.equal(playingBefore.active, true, 'Blob-backed host player must hold focus');
  const hostHit = await surface.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return (
      document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === element
    );
  });
  assert.equal(hostHit, true, 'Blob-backed player must be the ordinary hit-tested click target');
  await captureQuotedOpeningScroll(surface);
  const playingClickCount = await page.evaluate(() => window.__quoteFixtureClicks.length);
  await surface.click();
  const playingPending = await writeVideoBoundaryCheckpoint({
    output,
    name: `${checkpointName}-playing`,
    page,
    api: quotedApiResponses.slice(apiStart),
  });
  const playingClick = await quotedClickRecord(
    page,
    playingClickCount,
    postPlayOverlay ? 'div' : 'video'
  );
  playingBefore.scrollY = Number(await surface.getAttribute('data-opening-scroll-y'));
  assert(
    Number.isFinite(playingBefore.scrollY) && playingBefore.scrollY > 0,
    'Blob-backed opening scroll must be observed'
  );
  const playing = await assertQuotedGallery(page, quotedCase);
  const openingHost = await assertHostStopped(page, hostVideo, 'Successful gallery opening');
  const freshStart = await hostVideoState(playing.video);
  assert.equal(freshStart.paused, true, 'New gallery video starts paused');
  assert(freshStart.currentTime < 0.05, 'New gallery video starts from its own zero position');
  assert.equal(
    freshStart.loop,
    false,
    'Fresh gallery video must retain the production default before the bounded loop exercise'
  );
  assert(
    Math.abs(freshStart.volume - galleryPreferences.volume) < 0.01,
    'New gallery video uses the saved XEG volume'
  );
  assert.equal(
    freshStart.muted,
    galleryPreferences.muted,
    'New gallery video uses the saved XEG mute setting'
  );
  const playingOriginUrl = await assertQuotedOriginLink(
    playing.gallery,
    `https://x.com/${quotedCase.username}/status/${quotedCase.owner}`,
    quotedCase.name === 'linked'
  );
  const playingNavigation = await navigateQuotedAwayAndBack(page, quotedCase, playing.total);
  await playing.video.evaluate((video) => {
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error('Quoted gallery video is missing');
    }
    video.loop = true;
  });
  const galleryPlaybackStart = await playing.video.evaluate((video) => {
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error('Quoted gallery video is missing');
    }
    return video.currentTime;
  });
  await playing.video.click();
  await page.waitForFunction(
    ({ index, start }) => {
      const video = document.querySelector(
        `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${index}"] video`
      );
      return (
        video instanceof HTMLVideoElement &&
        video.currentTime >= start + 0.15 &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        !video.paused &&
        video.error === null
      );
    },
    { index: quotedCase.expectedPosition - 1, start: galleryPlaybackStart },
    { timeout: 15_000 }
  );
  const galleryPlaybackTime = await playing.video.evaluate((video) => {
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error('Quoted gallery video is missing');
    }
    return video.currentTime;
  });
  const hostReplay = await page.evaluate(() => window.__quoteFixtureHostAction('replay'));
  const stoppedReplay = await assertHostStopped(page, hostVideo, 'Host replay during gallery');
  const hostInsertion = await page.evaluate(() =>
    window.__quoteFixtureHostAction('insert-playing')
  );
  assert.equal(
    hostInsertion.playingBeforeInsertion,
    true,
    'Controlled host video must already be playing before insertion'
  );
  assert.equal(hostInsertion.beforeInsertion?.loop, true);
  assert.equal(hostInsertion.beforeInsertion?.width, 320);
  assert.equal(hostInsertion.beforeInsertion?.height, 180);
  assert.equal(hostInsertion.beforeInsertion?.error, null);
  assert(hostInsertion.beforeInsertion, 'Detached host video has no pre-insertion receipt');
  assert(
    hostInsertion.beforeInsertion.end > hostInsertion.beforeInsertion.start + 0.15,
    'Detached host video must progress before insertion'
  );
  const insertedVideo = shell.locator('video[data-host-action="insert-playing"]');
  const stoppedInsertion = await assertHostStopped(
    page,
    insertedVideo,
    'Playing host video inserted during gallery'
  );
  const hostReplacement = await page.evaluate(() => window.__quoteFixtureHostAction('replace'));
  assert.equal(hostReplacement.loop, true);
  const replacementVideo = shell.locator('video[data-host-action="replace"]');
  const stoppedReplacement = await assertHostStopped(
    page,
    replacementVideo,
    'Replacement host video during gallery'
  );
  assert.equal(stoppedReplacement.second.width, 320);
  assert.equal(stoppedReplacement.second.height, 180);
  const galleryAfterHostActions = await hostVideoState(playing.video);
  assert.equal(
    galleryAfterHostActions.paused,
    false,
    'Host playback suppression must leave gallery video playing'
  );
  assert.equal(galleryAfterHostActions.ended, false);
  assert.equal(galleryAfterHostActions.loop, true);
  const galleryProgressStart = await page.waitForFunction(
    (index) => {
      const video = document.querySelector(
        `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${index}"] video`
      );
      return video instanceof HTMLVideoElement &&
        !video.paused &&
        !video.ended &&
        video.error === null &&
        video.loop &&
        Number.isFinite(video.duration) &&
        video.currentTime < video.duration - 0.75
        ? video.currentTime
        : false;
    },
    quotedCase.expectedPosition - 1,
    { timeout: 5_000 }
  );
  const progressStartTime = await galleryProgressStart.jsonValue();
  assert(typeof progressStartTime === 'number', 'Gallery progress start is not numeric');
  await galleryProgressStart.dispose();
  await page.waitForFunction(
    ({ index, start }) => {
      const video = document.querySelector(
        `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${index}"] video`
      );
      return (
        video instanceof HTMLVideoElement &&
        !video.paused &&
        !video.ended &&
        video.error === null &&
        video.currentTime > start + 0.15
      );
    },
    { index: quotedCase.expectedPosition - 1, start: progressStartTime },
    { timeout: 5_000 }
  );
  const galleryProgressEnd = await hostVideoState(playing.video);
  assert(
    quotedApiResponses.slice(apiStart).every(({ tweetId }) => tweetId === expectedRequest),
    'Blob-backed click must retain the same owner request'
  );
  const latePanel = await page.evaluate(() => {
    const panel = document.createElement('aside');
    panel.id = 'late-quote-panel';
    panel.setAttribute('aria-hidden', 'false');
    panel.textContent = 'Late quote host panel';
    document.body.append(panel);
    return panel.id;
  });
  await page.locator(`#${latePanel}[data-xeg-gallery-hidden]`).waitFor({ state: 'attached' });
  await page.screenshot({ path: join(output, `${artifactName}-playing-gallery.png`) });

  const knownIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const nativeMark = nativeLoopback.mark();
  const fetchMark = pageFetches.length;
  const filename = `${quotedCase.username}_${quotedCase.owner}_${quotedCase.expectedPosition - 1}${quotedCase.name === 'unmarked-no-outer' ? ' (1)' : ''}.mp4`;
  await playing.gallery
    .locator('[data-gallery-element="toolbar"] button[aria-label="Download"]')
    .click();
  const download = await waitForDownload(extensionPage, knownIds, filename);
  const relativeDownload = relative(downloads, download.filename);
  assert(
    relativeDownload && !relativeDownload.startsWith('..') && !isAbsolute(relativeDownload),
    'Quoted video download escaped the task-owned directory'
  );
  const bytes = await readFile(download.filename);
  const sourceBytes = videoPayloads[quotedCase.media];
  assert(sourceBytes, 'Quoted video fixture payload is missing');
  assert(sourceBytes.equals(bytes), 'Privileged video bytes must match the selected MP4 asset');
  const native = await assertNativeSingle({
    extensionPage,
    knownIds,
    download,
    expectedUrl: playing.selectedMedia.src,
    expectedBytes: sourceBytes,
    nativeLoopback,
    nativeMark,
    pageFetches: pageFetches.slice(fetchMark),
  });
  const copiedName = `${artifactName}-download.mp4`;
  await copyFile(download.filename, join(output, copiedName));
  const lateState = await page.locator(`#${latePanel}`).evaluate((element) => ({
    hiddenMarker: element.hasAttribute('data-xeg-gallery-hidden'),
    inert: element.hasAttribute('inert'),
  }));
  assert.deepEqual(
    lateState,
    { hiddenMarker: true, inert: true },
    'Late-added host panel must be isolated while the gallery is open'
  );
  const playingClose = await closeQuotedGallery({
    gallery: playing.gallery,
    page,
    method: quotedCase.close,
    before: playingBefore,
    caseName: quotedCase.route,
    selector: surfaceSelector,
  });
  await page.evaluate(() => window.__quoteFixtureHostAction('replay'));
  await page.waitForFunction(
    ({ name, start }) => {
      const video = document.querySelector(`[data-case="${name}"] [data-video-key] video`);
      return video instanceof HTMLVideoElement && !video.paused && video.currentTime > start + 0.15;
    },
    { name: quotedCase.route, start: stoppedReplay.second.currentTime },
    { timeout: 5_000 }
  );
  const hostAfterClose = await hostVideoState(hostVideo);
  await hostVideo.evaluate((video) => {
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error('Quoted host video is missing');
    }
    video.pause();
  });
  const replacementStart = await hostVideoState(replacementVideo);
  await replacementVideo.evaluate((video) => {
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error('Replacement video is missing');
    }
    return video.play();
  });
  await page.waitForFunction(
    (start) => {
      const video = document.querySelector('[data-host-action="replace"]');
      return (
        video instanceof HTMLVideoElement &&
        !video.paused &&
        video.currentTime > start + 0.15 &&
        video.error === null
      );
    },
    replacementStart.currentTime,
    { timeout: 5_000 }
  );
  const replacementAfterClose = await hostVideoState(replacementVideo);
  await replacementVideo.evaluate((video) => {
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error('Replacement video is missing');
    }
    video.pause();
    URL.revokeObjectURL(video.src);
    video.remove();
  });
  const restoredPanel = await page.locator(`#${latePanel}`).evaluate((element) => ({
    ariaHidden: element.getAttribute('aria-hidden'),
    hiddenMarker: element.hasAttribute('data-xeg-gallery-hidden'),
    inert: element.hasAttribute('inert'),
  }));
  assert.deepEqual(restoredPanel, { ariaHidden: 'false', hiddenMarker: false, inert: false });
  await page.locator(`#${latePanel}`).evaluate((element) => element.remove());
  const pausedControl =
    quotedCase.route === 'unmarked' || postPlayOverlay
      ? await (async () => {
          await surface.scrollIntoViewIfNeeded();
          await surface.evaluate((element) => element.scrollIntoView({ block: 'center' }));
          await surface.focus();
          const before = await quotedHostSnapshot(page, quotedCase.route, surfaceSelector);
          const hostState = await hostVideoState(hostVideo);
          assert.equal(hostState.paused, true, 'Unmarked host video must be paused before click');
          assert(hostState.readyState >= 2 && hostState.width > 0 && hostState.height > 0);
          assert.equal(hostState.error, null);
          const depth = await quotedTargetDepth(hostVideo);
          if (quotedCase.route === 'unmarked') {
            assert.deepEqual(depth, UNMARKED_VIDEO_DEPTH, 'Paused video geometry must stay exact');
          }
          const hit = await surface.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            return {
              target: document.elementFromPoint(x, y) === element,
              point: { x, y },
              viewport: { width: innerWidth, height: innerHeight },
            };
          });
          assert.equal(
            hit.target,
            true,
            `Paused video must be the ordinary hit-tested target: ${JSON.stringify(hit)}`
          );
          const apiStartPaused = quotedApiResponses.length;
          const clickCount = await page.evaluate(() => window.__quoteFixtureClicks.length);
          await captureQuotedOpeningScroll(surface);
          await surface.click();
          const pending = await writeVideoBoundaryCheckpoint({
            output,
            name: `${checkpointName}-paused`,
            page,
            api: quotedApiResponses.slice(apiStartPaused),
          });
          const click = await quotedClickRecord(
            page,
            clickCount,
            postPlayOverlay ? 'div' : 'video'
          );
          before.scrollY = Number(await surface.getAttribute('data-opening-scroll-y'));
          assert(Number.isFinite(before.scrollY) && before.scrollY > 0);
          const selected = await assertQuotedGallery(page, quotedCase);
          const freshStart = await hostVideoState(selected.video);
          assert.equal(freshStart.paused, true, 'Paused host opens a separate paused player');
          assert(freshStart.currentTime < 0.05);
          const originUrl = await assertQuotedOriginLink(
            selected.gallery,
            `https://x.com/${quotedCase.username}/status/${quotedCase.owner}`,
            false
          );
          const api = quotedApiResponses.slice(apiStartPaused);
          assert(api.every(({ tweetId }) => tweetId === expectedRequest));
          const retiredVolume =
            quotedCase.name === 'unmarked-no-outer'
              ? await observeRetiredNativeVolume({
                  before,
                  extensionPage,
                  hostVideo,
                  output,
                  page,
                  quotedCase,
                  selected,
                })
              : null;
          const close = retiredVolume
            ? retiredVolume.finalClose
            : await closeQuotedGallery({
                gallery: selected.gallery,
                page,
                method: quotedCase.close,
                before,
                caseName: quotedCase.route,
                selector: surfaceSelector,
              });
          let nativeRecovery = null;
          if (postPlayOverlay) {
            const apiBeforeReplay = quotedApiResponses.length;
            const replayClickCount = await page.evaluate(() => window.__quoteFixtureClicks.length);
            await hostPlay.click();
            const click = await quotedClickRecord(page, replayClickCount, 'button');
            await page.waitForFunction(
              (name) => {
                const video = document.querySelector(
                  `[data-case="${name}"] [data-video-key] video`
                );
                return (
                  video instanceof HTMLVideoElement &&
                  !video.paused &&
                  video.currentTime > 0.15 &&
                  video.videoWidth > 0 &&
                  video.error === null
                );
              },
              quotedCase.route,
              { timeout: 5_000 }
            );
            const state = await hostVideoState(hostVideo);
            assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
            assert.equal(quotedApiResponses.length, apiBeforeReplay);
            assert.equal(await surface.count(), 1, 'Replay must retain one current overlay');
            nativeRecovery = { click, state };
            await hostVideo.evaluate((element) => {
              if (element instanceof HTMLVideoElement) {
                element.pause();
              }
            });
          }
          return {
            depth,
            hostState,
            hit,
            click,
            pending,
            selected: selected.selectedMedia,
            freshStart,
            originUrl,
            api,
            close,
            retiredVolume,
            nativeRecovery,
          };
        })()
      : null;
  await page.screenshot({ path: join(output, `${artifactName}-after.png`) });
  const outerControl =
    quotedCase.name === 'unmarked'
      ? await runOuterVideoControl({
          quotedCase,
          quotedApiResponses,
          downloads,
          extensionPage,
          output,
          page,
          videoPayloads,
          nativeLoopback,
          pageFetches,
        })
      : null;
  return {
    name: quotedCase.name,
    pageUrl,
    requestedTweetId: expectedRequest,
    api: quotedApiResponses.slice(apiStart),
    selectedPosition: quotedCase.expectedPosition,
    noOuterMedia:
      noOuterDomMediaCount === null
        ? null
        : {
            domOwnMediaCount: noOuterDomMediaCount,
            providerRootMediaCount: noOuterProviderMediaCount,
            selectedText: noOuterPanelText,
          },
    videoClickSettings,
    preview: {
      source: previewState.poster,
      unmarkedDepth: unmarkedPreviewDepth,
      click: previewClick,
      pending: previewPending,
      selected: initial.selectedMedia,
      originUrl: previewOriginUrl,
      navigation: previewNavigation,
      close: previewClose,
    },
    hostPlaying: {
      postPlayOverlay,
      surfaceSelector,
      unmarkedDepth,
      blobBacked: hostPlaying.source.startsWith('blob:'),
      currentTime: hostPlaying.time,
      progressEnd: hostProgressEnd,
      width: hostPlaying.width,
      height: hostPlaying.height,
      nativePlayClick,
      playingClick,
    },
    playing: {
      selected: playing.selectedMedia,
      pending: playingPending,
      originUrl: playingOriginUrl,
      navigation: playingNavigation,
      galleryPlaybackStart,
      galleryPlaybackTime,
      galleryPreferences,
      freshStart,
      controlledLooping: {
        host: openingHost.second.loop,
        gallery: galleryAfterHostActions.loop,
        inserted: stoppedInsertion.second.loop,
        replacement: stoppedReplacement.second.loop,
      },
      openingHost,
      hostReplay,
      stoppedReplay,
      hostInsertion,
      stoppedInsertion,
      hostReplacement,
      stoppedReplacement,
      galleryAfterHostActions,
      galleryProgressStart: progressStartTime,
      galleryProgressEnd,
      hostAfterClose,
      replacementAfterClose,
      closeMethod: quotedCase.close,
      close: playingClose,
    },
    paused: pausedControl,
    download: {
      filename,
      bytes: bytes.length,
      file: copiedName,
      native,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'),
    },
    outerControl,
  };
}

async function runCycle({
  cycle,
  downloads,
  extensionPage,
  output,
  page,
  images,
  displayImages,
  qualityRequests,
  nativeLoopback,
  pageFetches,
}: {
  cycle: (typeof CYCLES)[number];
  downloads: string;
  extensionPage: Page;
  output: string;
  page: Page;
  images: ImageFixtures;
  displayImages: ImageFixtures;
  qualityRequests: QualityRequest[];
  nativeLoopback: NativeLoopback;
  pageFetches: PageFetch[];
}) {
  const number = cycle.expectedIndex + 1;
  const originalImage = images[cycle.expectedIndex];
  const displayImage = displayImages[cycle.expectedIndex];
  assert(originalImage && displayImage, 'Selected cycle fixture image is missing');
  const requestStart = qualityRequests.length;
  const trigger = page.locator('[data-testid="tweetPhoto"] img').nth(cycle.triggerIndex);
  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await trigger.focus();
  const before = await hostSnapshot(page, cycle.triggerIndex);
  assert(before.scrollY > 0, 'Fixture must begin from a nonzero scroll position');
  assert.equal(
    before.activeElementAlt,
    before.triggerAlt,
    'Fixture trigger must hold focus before open'
  );
  await page.screenshot({ path: join(output, `cycle-${number}-before.png`) });

  await trigger.evaluate((element) => {
    if (!(element instanceof HTMLElement)) {
      throw new Error('Cycle trigger is not an HTML element');
    }
    element.addEventListener(
      'pointerdown',
      () => {
        // Playwright may scroll the trigger into view before dispatching input.
        // Observe the host state at the actual opening interaction boundary.
        element.dataset.openingScrollY = String(window.scrollY);
      },
      { once: true, capture: true }
    );
  });

  const openStarted = performance.now();
  await trigger.click();
  before.scrollY = Number(await trigger.getAttribute('data-opening-scroll-y'));
  assert(Number.isFinite(before.scrollY) && before.scrollY > 0, 'Opening scroll must be observed');
  const gallery = page.locator('[data-xeg-gallery-container]');
  await gallery.waitFor({ state: 'visible', timeout: 15_000 });
  const openMs = performance.now() - openStarted;
  const progress = gallery.locator('#xeg-toolbar-counter');
  assert.equal(Number(await progress.getAttribute('data-position')), cycle.triggerIndex + 1);

  const lateBackground = await page.evaluate(() => {
    const node = document.createElement('aside');
    node.id = 'late-host-panel';
    node.setAttribute('aria-hidden', 'false');
    node.textContent = 'Late host panel';
    document.body.append(node);
    return node.id;
  });
  await page.locator(`#${lateBackground}[data-xeg-gallery-hidden]`).waitFor({ state: 'attached' });

  let shiftedLayout = false;
  if (cycle.expectedIndex === 0) {
    await page.locator('#host-layout-spacer').evaluate((element) => {
      if (!(element instanceof HTMLElement)) {
        throw new Error('Host spacer is not an HTML element');
      }
      element.style.height = '3000px';
    });
    shiftedLayout = true;
  }

  const navigationStarted = performance.now();
  await page.keyboard.press(cycle.direction);
  await page.waitForFunction(
    (expected) =>
      document
        .querySelector('[data-xeg-gallery-container] #xeg-toolbar-counter')
        ?.getAttribute('data-position') === String(expected),
    cycle.expectedIndex + 1
  );
  const navigationMs = performance.now() - navigationStarted;

  const expectedDisplayUrl = await page
    .locator('[data-testid="tweetPhoto"] img')
    .nth(cycle.expectedIndex)
    .getAttribute('src');
  assert(expectedDisplayUrl, 'Selected fixture must have an observed display URL');
  const selectedDisplay = await waitForValue(async () => {
    const image = gallery.locator(
      `[data-gallery-element="item"][data-index="${cycle.expectedIndex}"] img`
    );
    if ((await image.count()) !== 1) {
      return undefined;
    }
    const state = await image.evaluate((element) => {
      if (!(element instanceof HTMLImageElement)) {
        throw new Error('Selected cycle image is missing');
      }
      return {
        source: element.currentSrc || element.src,
        complete: element.complete,
        width: element.naturalWidth,
        height: element.naturalHeight,
      };
    });
    return state.complete && state.width > 0 && state.height > 0 ? state : undefined;
  }, `observed display image ${cycle.expectedIndex}`);
  assert.equal(
    selectedDisplay.source,
    expectedDisplayUrl,
    'DOM recovery must retain the observed display source'
  );
  assert.equal(selectedDisplay.width, (480 + cycle.expectedIndex * 80) / 4);
  assert.equal(selectedDisplay.height, (320 + cycle.expectedIndex * 40) / 4);
  assert(
    !displayImage.equals(originalImage),
    'The observed display and original payloads must differ'
  );
  await page.screenshot({ path: join(output, `cycle-${number}-gallery.png`) });

  const knownIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const filename = expectedFilename(cycle.expectedIndex);
  const nativeMark = nativeLoopback.mark();
  const fetchMark = pageFetches.length;
  const expectedSource = expectedOriginalImageUrl(expectedDisplayUrl);
  if (number === 1) {
    nativeLoopback.armHold('pbs.twimg.com', new URL(expectedSource).pathname);
  }
  const downloadStarted = performance.now();
  await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
  let slowTransfer:
    | {
        downloadId: number;
        nativeStartAfterMs: number;
        heldAfterStartMs: number;
        beforeRelease: { state: string; bytesReceived: number; totalBytes: number };
        controlsBusy: boolean;
        screenshot: string;
        completeAfterMs?: number;
      }
    | undefined;
  if (number === 1) {
    const active = await waitForValue(
      async () => {
        const added = (await queryDownloads(extensionPage)).filter(({ id }) => !knownIds.has(id));
        assert(added.length <= 1, 'Slow single save allocated more than one native ID');
        const entry = added[0];
        return entry?.state === 'in_progress' &&
          entry.url === expectedSource &&
          entry.totalBytes === originalImage.length &&
          entry.bytesReceived < entry.totalBytes
          ? entry
          : undefined;
      },
      'held single save to start before full transfer',
      5_000
    );
    const nativeStartAfterMs = performance.now() - downloadStarted;
    const holdStarted = performance.now();
    await delay(3_500);
    const unchanged = (await queryDownloads(extensionPage)).filter(({ id }) => !knownIds.has(id));
    assert.equal(unchanged.length, 1);
    const heldDownload = unchanged[0];
    assert(heldDownload, 'Held cycle download disappeared');
    assert.equal(heldDownload.id, active.id);
    assert.equal(heldDownload.state, 'in_progress');
    assert.equal(nativeLoopback.held(), true);
    const button = gallery.locator(
      '[data-gallery-element="toolbar"] button[aria-label="Download"]'
    );
    assert.equal(
      await button.isDisabled(),
      true,
      'Confirmed active transfer must keep download controls disabled after initial checks'
    );
    assert.equal(await button.getAttribute('aria-busy'), 'true');
    await page.screenshot({ path: join(output, 'cycle-1-pending-native.png') });
    slowTransfer = {
      downloadId: active.id,
      nativeStartAfterMs,
      heldAfterStartMs: performance.now() - holdStarted,
      beforeRelease: {
        state: heldDownload.state,
        bytesReceived: heldDownload.bytesReceived,
        totalBytes: heldDownload.totalBytes,
      },
      controlsBusy: true,
      screenshot: 'cycle-1-pending-native.png',
    };
    nativeLoopback.completeHold();
  }
  const download = await waitForDownload(extensionPage, knownIds, filename);
  const downloadMs = performance.now() - downloadStarted;
  if (slowTransfer) {
    assert.equal(download.id, slowTransfer.downloadId);
    assert(slowTransfer.nativeStartAfterMs < downloadMs);
    slowTransfer.completeAfterMs = downloadMs;
  }
  assert.equal(typeof download.filename, 'string');
  const relativeDownload = relative(downloads, download.filename);
  assert(
    relativeDownload && !relativeDownload.startsWith('..') && !isAbsolute(relativeDownload),
    'Privileged download must remain inside the task-owned directory'
  );
  const bytes = await readFile(download.filename);
  assert(originalImage.equals(bytes), 'Downloaded bytes must match the selected fixture');
  assert(!displayImage.equals(bytes), 'Single download must not save the smaller display payload');
  const native = await assertNativeSingle({
    extensionPage,
    knownIds,
    download,
    expectedUrl: expectedOriginalImageUrl(expectedDisplayUrl),
    expectedBytes: originalImage,
    nativeLoopback,
    nativeMark,
    pageFetches: pageFetches.slice(fetchMark),
  });
  const copiedName = `cycle-${number}-download.jpg`;
  await copyFile(download.filename, join(output, copiedName));

  const closeStarted = performance.now();
  if (cycle.close === 'button') {
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
  } else {
    await page.keyboard.press('Escape');
  }
  await gallery.waitFor({ state: 'detached' });
  const closeMs = performance.now() - closeStarted;
  const after = await hostSnapshot(page, cycle.triggerIndex);
  await page.screenshot({ path: join(output, `cycle-${number}-after.png`) });

  const lateState = await page.locator(`#${lateBackground}`).evaluate((element) => ({
    ariaHidden: element.getAttribute('aria-hidden'),
    hiddenMarker: element.hasAttribute('data-xeg-gallery-hidden'),
    inert: element.hasAttribute('inert'),
  }));
  assert.deepEqual(lateState, { ariaHidden: 'false', hiddenMarker: false, inert: false });
  assert.deepEqual(
    after.background,
    before.background,
    'Gallery close must restore host isolation'
  );
  assert.deepEqual(
    after.bodyStyle,
    before.bodyStyle,
    'Gallery close must restore body inline styles'
  );
  assert.equal(
    after.scrollRestoration,
    before.scrollRestoration,
    'Gallery close must restore history scroll behavior'
  );
  assert.equal(
    after.activeElementAlt,
    before.triggerAlt,
    'Gallery close must restore trigger focus'
  );
  assert.equal(
    await page.locator('[data-xeg-gallery-container]').count(),
    0,
    'Gallery must detach'
  );

  if (shiftedLayout) {
    await page.locator('#host-layout-spacer').evaluate((element) => {
      if (!(element instanceof HTMLElement)) {
        throw new Error('Host spacer is not an HTML element');
      }
      element.style.height = '1200px';
    });
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), before.scrollY);
  }
  await page.locator(`#${lateBackground}`).evaluate((element) => element.remove());

  return {
    closeMethod: cycle.close,
    download: {
      bytes: bytes.length,
      file: copiedName,
      filename,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      native,
      ...(slowTransfer ? { slowTransfer } : {}),
    },
    expectedIndex: cycle.expectedIndex,
    sourceQuality: {
      displayUrl: expectedDisplayUrl,
      displayed: {
        width: selectedDisplay.width,
        height: selectedDisplay.height,
        ...imageReceipt(displayImage),
      },
      originalUrl: expectedOriginalImageUrl(expectedDisplayUrl),
      original: imageReceipt(originalImage),
      requests: qualityRequests.slice(requestStart),
      screenshot: `cycle-${number}-gallery.png`,
    },
    focusRestored: after.activeElementAlt === before.triggerAlt,
    layoutShiftedWhileOpen: shiftedLayout,
    scroll: {
      before: before.scrollY,
      after: after.scrollY,
      restored: after.scrollY === before.scrollY,
    },
    timingsMs: { close: closeMs, download: downloadMs, navigation: navigationMs, open: openMs },
  };
}

async function runSourceQualityCycle({
  downloads,
  extensionPage,
  images,
  displayImages,
  output,
  page,
  qualityApiResponses,
  qualityRequests,
  evidence,
  nativeLoopback,
  pageFetches,
}: {
  downloads: string;
  extensionPage: Page;
  images: ImageFixtures;
  displayImages: ImageFixtures;
  output: string;
  page: Page;
  qualityApiResponses: ApiRecord[];
  qualityRequests: QualityRequest[];
  evidence: SourceQualityEvidence;
  nativeLoopback: NativeLoopback;
  pageFetches: PageFetch[];
}) {
  const apiStart = qualityApiResponses.length;
  const requestStart = qualityRequests.length;
  const startedAtMs = performance.now();
  evidence.status = 'pending';
  evidence.url = QUALITY_FIXTURE_URL;
  evidence.selectedIndex = 1;
  evidence.sources = QUALITY_IMAGE_PATHS.map((path, index) => {
    const display = displayImages[index];
    const original = images[index];
    assert(display && original, 'Source-quality fixture image is missing');
    return {
      observedUrl: `https://pbs.twimg.com/media/${path}?format=jpg&name=small`,
      originalUrl: `https://pbs.twimg.com/media/${path}?format=jpg&name=orig`,
      display: {
        width: (480 + index * 80) / 4,
        height: (320 + index * 40) / 4,
        ...imageReceipt(display),
      },
      original: { width: 480 + index * 80, height: 320 + index * 40, ...imageReceipt(original) },
    };
  });
  assert(
    evidence.sources.every(
      (source, index) =>
        source.display.sha256 !== source.original.sha256 &&
        (displayImages[index]?.length ?? 0) < (images[index]?.length ?? 0)
    ),
    'Every display fixture must be distinct and smaller than its original'
  );

  await page.goto(QUALITY_FIXTURE_URL);
  await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
  const trigger = page
    .locator('[data-route="classic"][data-phase="normal"] [data-testid="tweetPhoto"] img')
    .nth(1);
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  const before = await hostSnapshot(page, 1);
  assert.equal(
    before.activeElementAlt,
    before.triggerAlt,
    'Source-quality trigger must hold focus before open'
  );
  const observedUrl = await trigger.getAttribute('src');
  const selectedSource = evidence.sources[1];
  assert(selectedSource, 'Second source-quality fixture is missing');
  assert.equal(
    observedUrl,
    selectedSource.observedUrl,
    'API quality fixture must start from the small observed image'
  );
  const hostImage = await waitForValue(async () => {
    const state = await trigger.evaluate((element) => {
      if (!(element instanceof HTMLImageElement)) {
        throw new Error('Source-quality host image is missing');
      }
      return {
        complete: element.complete,
        width: element.naturalWidth,
        height: element.naturalHeight,
      };
    });
    return state.complete && state.width > 0 ? state : undefined;
  }, 'small source-quality host image');
  assert.equal(hostImage.width, selectedSource.display.width);
  assert.equal(hostImage.height, selectedSource.display.height);
  evidence.hostImage = { url: observedUrl, width: hostImage.width, height: hostImage.height };
  await page.screenshot({ path: join(output, 'source-quality-before.png') });

  const openStartedAtMs = performance.now();
  await trigger.click();
  const gallery = page.locator('[data-xeg-gallery-container]');
  await gallery.waitFor({ state: 'visible', timeout: 15_000 });
  const selected = await assertQuotedSelection(page, {
    position: 2,
    total: 3,
    type: 'image',
    path: `/media/${QUALITY_IMAGE_PATHS[1]}`,
  });
  assert.equal(
    selected.source,
    selectedSource.originalUrl,
    'A healthy API result must render its verified original source'
  );
  const selectedImage = await gallery
    .locator('[data-gallery-element="item"][data-index="1"] img')
    .evaluate((element) => {
      if (!(element instanceof HTMLImageElement)) {
        throw new Error('Source-quality selected image is missing');
      }
      return { width: element.naturalWidth, height: element.naturalHeight };
    });
  assert.equal(selectedImage.width, selectedSource.original.width);
  assert.equal(selectedImage.height, selectedSource.original.height);
  evidence.origin = await assertQuotedOriginLink(gallery, QUALITY_FIXTURE_URL);
  assert.equal(
    qualityApiResponses.length,
    apiStart + 1,
    'Source-quality open must make one healthy TweetResultByRestId request'
  );
  assert.equal(qualityApiResponses.at(-1)?.tweetId, QUALITY_TWEET_ID);
  evidence.selection = {
    ...selected,
    ...selectedImage,
    api: qualityApiResponses.slice(apiStart),
    openedInMs: performance.now() - openStartedAtMs,
    provenance: 'healthy TweetResultByRestId response and original gallery source',
  };
  await page.screenshot({ path: join(output, 'source-quality-gallery.png') });

  const knownBeforeCurrent = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const nativeMark = nativeLoopback.mark();
  const fetchMark = pageFetches.length;
  const currentStartedAtMs = performance.now();
  await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
  const current = await waitForDownload(extensionPage, knownBeforeCurrent, qualityFilename(1));
  const currentPath = relative(downloads, current.filename);
  assert(
    currentPath && !currentPath.startsWith('..') && !isAbsolute(currentPath),
    'Source-quality single escaped the owned directory'
  );
  const { bytes: currentBytes } = await readExactDownloadFile(current.filename, images[1].length);
  assert(currentBytes.equals(images[1]), 'API single must save the selected original bytes');
  assert(
    !currentBytes.equals(displayImages[1]),
    'API single must not save the smaller displayed bytes'
  );
  assert.deepEqual(
    (await queryDownloads(extensionPage))
      .filter(({ id }) => !knownBeforeCurrent.has(id))
      .map(({ id }) => id),
    [current.id],
    'Source-quality single must create exactly one native download'
  );
  const native = await assertNativeSingle({
    extensionPage,
    knownIds: knownBeforeCurrent,
    download: current,
    expectedUrl: selectedSource.originalUrl,
    expectedBytes: images[1],
    nativeLoopback,
    nativeMark,
    pageFetches: pageFetches.slice(fetchMark),
  });
  await copyFile(current.filename, join(output, 'source-quality-current.jpg'));
  evidence.current = {
    id: current.id,
    filename: basename(current.filename),
    file: 'source-quality-current.jpg',
    ...imageReceipt(currentBytes),
    elapsedMs: performance.now() - currentStartedAtMs,
    native,
  };

  const knownBeforeZip = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const zipStartedAtMs = performance.now();
  await gallery
    .locator('[data-gallery-element="toolbar"] button[aria-label="Download 3 shown files as ZIP"]')
    .click();
  const zip = await waitForDownload(
    extensionPage,
    knownBeforeZip,
    `qualityuser_${QUALITY_TWEET_ID}.zip`
  );
  assert.notEqual(zip.id, current.id);
  const zipPath = relative(downloads, zip.filename);
  assert(
    zipPath && !zipPath.startsWith('..') && !isAbsolute(zipPath),
    'Source-quality ZIP escaped the owned directory'
  );
  const expectedEntries = images.map((bytes, index) => ({
    filename: qualityFilename(index),
    bytes,
  }));
  const { bytes: zipBytes } = await readExactDownloadFile(
    zip.filename,
    expectedStoredZipBytes(expectedEntries)
  );
  const verified = verifyStoredZip(zipBytes, expectedEntries);
  assert.deepEqual(
    (await queryDownloads(extensionPage))
      .filter(({ id }) => !knownBeforeZip.has(id))
      .map(({ id }) => id),
    [zip.id],
    'Source-quality ZIP must create exactly one native download'
  );
  await copyFile(zip.filename, join(output, 'source-quality.zip'));
  evidence.zip = {
    id: zip.id,
    filename: basename(zip.filename),
    file: 'source-quality.zip',
    ...imageReceipt(zipBytes),
    elapsedMs: performance.now() - zipStartedAtMs,
    verified,
  };

  await page.keyboard.press('Escape');
  await gallery.waitFor({ state: 'detached' });
  const after = await hostSnapshot(page, 1);
  assert.deepEqual(
    after.background,
    before.background,
    'Source-quality close must restore host isolation'
  );
  assert.deepEqual(
    after.bodyStyle,
    before.bodyStyle,
    'Source-quality close must restore body style'
  );
  assert.equal(
    after.activeElementAlt,
    before.triggerAlt,
    'Source-quality close must restore trigger focus'
  );
  assert.equal(after.scrollRestoration, before.scrollRestoration);
  assert.equal(
    after.scrollY,
    before.scrollY,
    'Source-quality close must restore host scroll position'
  );
  await page.screenshot({ path: join(output, 'source-quality-after.png') });
  evidence.restoration = {
    focus: after.activeElementAlt === before.triggerAlt,
    scroll: after.scrollY === before.scrollY,
    body: true,
    isolation: true,
  };
  const firstRequests = qualityRequests.slice(requestStart);
  assert(
    QUALITY_IMAGE_PATHS.every((path) =>
      firstRequests.some((request) => request.path === `/media/${path}` && request.name === 'orig')
    ),
    'Source-quality ZIP must request the original form of all three images'
  );
  const originalFetchCount = () =>
    qualityRequests
      .slice(requestStart)
      .filter(
        (request) =>
          request.path === `/media/${QUALITY_IMAGE_PATHS[1]}` &&
          request.name === 'orig' &&
          request.resourceType === 'fetch'
      ).length;
  const firstOriginalFetchCount = originalFetchCount();
  assert(
    firstOriginalFetchCount > 0,
    'First ZIP must fetch the selected original into media cache'
  );

  const documentBeforeReopen = await page.evaluate(() => ({
    url: location.href,
    timeOrigin: performance.timeOrigin,
  }));
  assert.equal(documentBeforeReopen.url, QUALITY_FIXTURE_URL);
  assert.equal(await trigger.getAttribute('src'), selectedSource.observedUrl);
  const reopenHostImage = await waitForValue(async () => {
    const state = await trigger.evaluate((element) => {
      if (!(element instanceof HTMLImageElement)) {
        throw new Error('Reopened source-quality host image is missing');
      }
      return {
        complete: element.complete,
        width: element.naturalWidth,
        height: element.naturalHeight,
      };
    });
    return state.complete && state.width > 0 ? state : undefined;
  }, 'decoded small source-quality host image before reopen');
  assert.equal(reopenHostImage.width, selectedSource.display.width);
  assert.equal(reopenHostImage.height, selectedSource.display.height);
  await page.screenshot({ path: join(output, 'source-quality-reopen-before.png') });

  const reopenStartedAtMs = performance.now();
  await trigger.click();
  await gallery.waitFor({ state: 'visible', timeout: 15_000 });
  const reopenSelection = await assertQuotedSelection(page, {
    position: 2,
    total: 3,
    type: 'image',
    path: `/media/${QUALITY_IMAGE_PATHS[1]}`,
  });
  assert.equal(reopenSelection.source, selectedSource.originalUrl);
  const reopenImage = await gallery
    .locator('[data-gallery-element="item"][data-index="1"] img')
    .evaluate((element) => {
      if (!(element instanceof HTMLImageElement)) {
        throw new Error('Reopened source-quality selected image is missing');
      }
      return { width: element.naturalWidth, height: element.naturalHeight };
    });
  assert.equal(reopenImage.width, selectedSource.original.width);
  assert.equal(reopenImage.height, selectedSource.original.height);
  const reopenOrigin = await assertQuotedOriginLink(gallery, QUALITY_FIXTURE_URL);
  assert.deepEqual(
    await page.evaluate(() => ({ url: location.href, timeOrigin: performance.timeOrigin })),
    documentBeforeReopen
  );
  await page.screenshot({ path: join(output, 'source-quality-reopen-gallery.png') });

  const knownBeforeReopenCurrent = new Set(
    (await queryDownloads(extensionPage)).map(({ id }) => id)
  );
  const reopenNativeMark = nativeLoopback.mark();
  const reopenFetchMark = pageFetches.length;
  const reopenCurrentStartedAtMs = performance.now();
  await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
  const reopenCurrent = await waitForDownload(
    extensionPage,
    knownBeforeReopenCurrent,
    `qualityuser_${QUALITY_TWEET_ID}_1 (1).jpg`
  );
  assert.notEqual(reopenCurrent.id, current.id);
  const reopenCurrentPath = relative(downloads, reopenCurrent.filename);
  assert(
    reopenCurrentPath && !reopenCurrentPath.startsWith('..') && !isAbsolute(reopenCurrentPath),
    'Reopened source-quality single escaped the owned directory'
  );
  const { bytes: reopenCurrentBytes } = await readExactDownloadFile(
    reopenCurrent.filename,
    images[1].length
  );
  assert(reopenCurrentBytes.equals(images[1]), 'Reopened single must save selected original bytes');
  const reopenNative = await assertNativeSingle({
    extensionPage,
    knownIds: knownBeforeReopenCurrent,
    download: reopenCurrent,
    expectedUrl: selectedSource.originalUrl,
    expectedBytes: images[1],
    nativeLoopback,
    nativeMark: reopenNativeMark,
    pageFetches: pageFetches.slice(reopenFetchMark),
  });
  await copyFile(reopenCurrent.filename, join(output, 'source-quality-reopen-current.jpg'));

  const knownBeforeReopenZip = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const reopenZipStartedAtMs = performance.now();
  await gallery
    .locator('[data-gallery-element="toolbar"] button[aria-label="Download 3 shown files as ZIP"]')
    .click();
  const reopenZip = await waitForDownload(
    extensionPage,
    knownBeforeReopenZip,
    `qualityuser_${QUALITY_TWEET_ID} (1).zip`
  );
  assert.notEqual(reopenZip.id, zip.id);
  const reopenZipPath = relative(downloads, reopenZip.filename);
  assert(
    reopenZipPath && !reopenZipPath.startsWith('..') && !isAbsolute(reopenZipPath),
    'Reopened source-quality ZIP escaped the owned directory'
  );
  const { bytes: reopenZipBytes } = await readExactDownloadFile(
    reopenZip.filename,
    expectedStoredZipBytes(expectedEntries)
  );
  const reopenVerified = verifyStoredZip(reopenZipBytes, expectedEntries);
  assert.deepEqual(
    (await queryDownloads(extensionPage))
      .filter(({ id }) => !knownBeforeReopenZip.has(id))
      .map(({ id }) => id),
    [reopenZip.id],
    'Reopened source-quality ZIP must create exactly one native download'
  );
  await copyFile(reopenZip.filename, join(output, 'source-quality-reopen.zip'));
  const secondOriginalFetchCount = originalFetchCount();
  assert.equal(
    secondOriginalFetchCount,
    firstOriginalFetchCount,
    'Reopened ZIP must reuse the selected original from media cache'
  );

  await page.keyboard.press('Escape');
  await gallery.waitFor({ state: 'detached' });
  const reopenAfter = await hostSnapshot(page, 1);
  assert.deepEqual(reopenAfter.background, before.background);
  assert.deepEqual(reopenAfter.bodyStyle, before.bodyStyle);
  assert.equal(reopenAfter.activeElementAlt, before.triggerAlt);
  assert.equal(reopenAfter.scrollRestoration, before.scrollRestoration);
  assert.equal(reopenAfter.scrollY, before.scrollY);
  assert.deepEqual(
    await page.evaluate(() => ({ url: location.href, timeOrigin: performance.timeOrigin })),
    documentBeforeReopen
  );
  await page.screenshot({ path: join(output, 'source-quality-reopen-after.png') });
  evidence.reopen = {
    document: documentBeforeReopen,
    hostImage: { url: selectedSource.observedUrl, ...reopenHostImage },
    selection: { ...reopenSelection, ...reopenImage, origin: reopenOrigin },
    current: {
      id: reopenCurrent.id,
      filename: basename(reopenCurrent.filename),
      file: 'source-quality-reopen-current.jpg',
      ...imageReceipt(reopenCurrentBytes),
      elapsedMs: performance.now() - reopenCurrentStartedAtMs,
      native: reopenNative,
    },
    zip: {
      id: reopenZip.id,
      filename: basename(reopenZip.filename),
      file: 'source-quality-reopen.zip',
      ...imageReceipt(reopenZipBytes),
      elapsedMs: performance.now() - reopenZipStartedAtMs,
      verified: reopenVerified,
    },
    originalFetchCount: { first: firstOriginalFetchCount, second: secondOriginalFetchCount },
    restoration: {
      focus: reopenAfter.activeElementAlt === before.triggerAlt,
      scroll: reopenAfter.scrollY === before.scrollY,
      body: true,
      isolation: true,
    },
    elapsedMs: performance.now() - reopenStartedAtMs,
  };
  evidence.api = qualityApiResponses.slice(apiStart);
  evidence.requests = qualityRequests.slice(requestStart);
  evidence.screenshots = [
    'source-quality-before.png',
    'source-quality-gallery.png',
    'source-quality-after.png',
    'source-quality-reopen-before.png',
    'source-quality-reopen-gallery.png',
    'source-quality-reopen-after.png',
  ];
  evidence.elapsedMs = performance.now() - startedAtMs;
  evidence.status = 'passed';
}

/** A single failed display response, followed by the currently available in-task routes. */
async function runTransientImageRecoveryProbe({
  context,
  extensionPage,
  output,
  qualityRequests,
}: {
  context: BrowserContext;
  extensionPage: Page;
  output: string;
  qualityRequests: QualityRequest[];
}) {
  const page = await context.newPage();
  const originalUrl = `https://pbs.twimg.com/media/${QUALITY_IMAGE_PATHS[1]}?format=jpg&name=orig`;
  const requestMark = qualityRequests.length;
  const knownDownloads = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const faults: Array<{ resourceType: string; response: number | 'healthy' }> = [];
  const faultRoute = async (route: Route) => {
    assert.equal(route.request().url(), originalUrl);
    assert(faults.length < 4, 'Transient image received too many exact-source requests');
    if (faults.length === 0) {
      faults.push({ resourceType: route.request().resourceType(), response: 404 });
      await route.fulfill({
        status: 404,
        body: '',
        headers: { 'Cache-Control': 'no-store' },
      });
      return;
    }
    faults.push({ resourceType: route.request().resourceType(), response: 'healthy' });
    await route.fallback();
  };
  let routeInstalled = false;
  const cleanup = { routeRemoved: false, pageClosed: false };
  let primaryError: unknown;
  const observations: Record<string, unknown> = { faults, cleanup };
  try {
    await page.goto(QUALITY_FIXTURE_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    const trigger = page
      .locator('[data-route="classic"][data-phase="normal"] [data-testid="tweetPhoto"] img')
      .nth(1);
    await trigger.focus();
    const before = await hostSnapshot(page, 1);
    await page.route(originalUrl, faultRoute);
    routeInstalled = true;
    await trigger.click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    const selected = gallery.locator('[data-gallery-element="item"][data-index="1"]');
    await selected.locator('[role="alert"]').waitFor({ state: 'visible' });
    await assertQuotedOriginLink(gallery, QUALITY_FIXTURE_URL);
    observations.failedPaint = await waitForRecoveryPaint(
      page,
      1,
      'failed image recovery text and actions painted inside the viewport'
    );
    observations.failed = await captureRecoveryUi(page, output, 'image-once-failed');
    observations.origin = QUALITY_FIXTURE_URL;
    assert.deepEqual(faults[0], { resourceType: 'image', response: 404 });
    await gallery.locator('button[aria-label="Fit Window"]').click();
    const fitBefore = await gallery
      .locator('[data-gallery-element="fit-mode-label"]')
      .textContent();
    assert.equal(fitBefore?.trim(), 'Fit: Fit Window');
    const retry = selected.locator('[role="alert"] button', { hasText: 'Retry loading' });
    assert.equal(await retry.count(), 1, 'Failed item must offer one adjacent retry');
    const post = selected.locator('[role="alert"] a', { hasText: 'Open original post' });
    assert.equal(await post.getAttribute('href'), QUALITY_FIXTURE_URL);
    await retry.click();
    observations.recoveredInPlace = await assertQuotedSelection(page, {
      position: 2,
      total: 3,
      type: 'image',
      path: `/media/${QUALITY_IMAGE_PATHS[1]}`,
    });
    assert.equal(await selected.locator('[role="alert"]').count(), 0);
    assert.deepEqual(
      faults,
      [
        { resourceType: 'image', response: 404 },
        { resourceType: 'image', response: 'healthy' },
      ],
      'One manual retry must reload only the exact failed display source'
    );
    observations.afterRetry = await captureRecoveryUi(page, output, 'image-once-retried');
    await page.keyboard.press('ArrowRight');
    observations.third = await assertQuotedSelection(page, {
      position: 3,
      total: 3,
      type: 'image',
      path: `/media/${QUALITY_IMAGE_PATHS[2]}`,
    });
    await page.keyboard.press('ArrowLeft');
    observations.returned = await assertQuotedSelection(page, {
      position: 2,
      total: 3,
      type: 'image',
      path: `/media/${QUALITY_IMAGE_PATHS[1]}`,
    });
    const fitAfter = await gallery.locator('[data-gallery-element="fit-mode-label"]').textContent();
    assert.equal(fitAfter, fitBefore, 'Image failure navigation must preserve the selected fit');
    observations.afterNavigation = await captureRecoveryUi(page, output, 'image-once-returned');
    observations.display = await selected.locator('img').evaluate((element) => {
      if (!(element instanceof HTMLImageElement)) {
        throw new Error('Selected image disappeared during transient recovery probe');
      }
      return {
        source: element.src,
        complete: element.complete,
        width: element.naturalWidth,
        loaded: element.closest('[data-gallery-element="item"]')?.getAttribute('data-media-loaded'),
      };
    });
    observations.fit = { before: fitBefore, after: fitAfter };
    observations.requests = qualityRequests.slice(requestMark);
    assert.deepEqual(
      (await queryDownloads(extensionPage)).filter(({ id }) => !knownDownloads.has(id)),
      [],
      'Display failure and navigation must not start a native save'
    );
    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    observations.close = await hostSnapshot(page, 1);
    assert.deepEqual(observations.close, before);
    await page.unroute(originalUrl, faultRoute);
    routeInstalled = false;
    cleanup.routeRemoved = true;
    await trigger.click();
    await gallery.waitFor({ state: 'visible' });
    observations.reopened = await assertQuotedSelection(page, {
      position: 2,
      total: 3,
      type: 'image',
      path: `/media/${QUALITY_IMAGE_PATHS[1]}`,
    });
    observations.healthy = await captureRecoveryUi(page, output, 'image-once-reopened');
    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    return { status: 'observed', ...observations };
  } catch (error) {
    primaryError = error;
    await page
      .screenshot({ path: join(output, 'recovery-image-once-failure.png') })
      .catch(() => {});
    throw error;
  } finally {
    if (routeInstalled) {
      await page.unroute(originalUrl, faultRoute);
      cleanup.routeRemoved = true;
    }
    await page.close();
    cleanup.pageClosed = true;
    if (primaryError) {
      await writeFile(
        join(output, 'recovery-image-once-error.json'),
        JSON.stringify({ error: safeError(primaryError), observations }, null, 2)
      );
    }
  }
}

/** Deny only three verified-original application fetches, then restore a healthy ZIP. */
async function runFullZipFailureProbe({
  downloads,
  extensionPage,
  images,
  output,
  page,
}: {
  downloads: string;
  extensionPage: Page;
  images: ImageFixtures;
  output: string;
  page: Page;
}) {
  const denied: Array<{ path: string; type: string }> = [];
  const routePattern = 'https://pbs.twimg.com/media/**';
  const denyVerifiedOriginal = async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      !['fetch', 'xhr'].includes(request.resourceType()) ||
      url.searchParams.get('name') !== 'orig'
    ) {
      await route.fallback();
      return;
    }
    assert(
      QUALITY_IMAGE_PATHS.some((path) => url.pathname === `/media/${path}`),
      'Full failure route saw an unexpected original source'
    );
    assert(denied.length < 6, 'Full failure issued too many source requests');
    denied.push({ path: url.pathname, type: request.resourceType() });
    await route.fulfill({
      status: 403,
      body: '',
      headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': 'https://x.com' },
    });
  };
  const cleanup = { routeRemoved: false };
  let routeInstalled = false;
  const observations: Record<string, unknown> = { denied, cleanup };
  try {
    await page.goto(QUALITY_FIXTURE_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    await page
      .locator('[data-route="classic"][data-phase="normal"] [data-testid="tweetPhoto"] img')
      .nth(1)
      .click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    await assertQuotedSelection(page, {
      position: 2,
      total: 3,
      type: 'image',
      path: `/media/${QUALITY_IMAGE_PATHS[1]}`,
    });
    const zipButton = gallery.locator(
      '[data-gallery-element="toolbar"] button[aria-label="Download 3 shown files as ZIP"]'
    );
    const knownBeforeFailure = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    await page.route(routePattern, denyVerifiedOriginal);
    routeInstalled = true;
    await zipButton.click();
    await assertVisibleBulkOutcome(page, {
      included: 0,
      omitted: 3,
      handedOff: false,
      reason: 'A media source request failed (HTTP 403)',
    });
    await waitForValue(
      async () => ((await zipButton.isEnabled()) ? true : undefined),
      'full ZIP failure settled'
    );
    assert.deepEqual(
      denied.map(({ path }) => path).sort(),
      QUALITY_IMAGE_PATHS.map((path) => `/media/${path}`).sort(),
      'The full failure must deny each shown verified source exactly once'
    );
    assert.deepEqual(
      (await queryDownloads(extensionPage)).filter(({ id }) => !knownBeforeFailure.has(id)),
      [],
      'A full failure must not create a native ZIP'
    );
    await page.waitForTimeout(5_250);
    await zipButton.focus();
    await assertVisibleBulkOutcome(page, { included: 0, omitted: 3, handedOff: false });
    observations.afterFiveSeconds = await captureRecoveryUi(
      page,
      output,
      'zip-full-failure-after-five-seconds'
    );
    await page.unroute(routePattern, denyVerifiedOriginal);
    routeInstalled = false;
    cleanup.routeRemoved = true;
    const knownHealthy = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    await zipButton.click();
    const healthy = await waitForValue(async () => {
      const created = (await queryDownloads(extensionPage)).filter(
        ({ id }) => !knownHealthy.has(id)
      );
      assert(created.length <= 1, 'One healthy ZIP action must create exactly one native ID');
      const item = created[0];
      assert(item?.state !== 'interrupted', 'Healthy ZIP must not be interrupted');
      return item?.state === 'complete' ? item : undefined;
    }, 'healthy ZIP after full failure');
    assert.match(
      basename(healthy.filename),
      new RegExp(`^qualityuser_${QUALITY_TWEET_ID}(?: \\([1-9]\\d*\\))?\\.zip$`, 'u')
    );
    const relativePath = relative(downloads, healthy.filename);
    assert(relativePath && !relativePath.startsWith('..') && !isAbsolute(relativePath));
    const expectedEntries = images.map((bytes, index) => ({
      filename: qualityFilename(index),
      bytes,
    }));
    const { bytes } = await readExactDownloadFile(
      healthy.filename,
      expectedStoredZipBytes(expectedEntries)
    );
    const verified = verifyStoredZip(bytes, expectedEntries);
    await assertVisibleBulkOutcome(page, { included: 3, omitted: 0, handedOff: true });
    const file = 'recovery-full-failure-healthy.zip';
    await copyFile(healthy.filename, join(output, file));
    observations.healthy = {
      id: healthy.id,
      filename: basename(healthy.filename),
      file,
      ...imageReceipt(bytes),
      verified,
      ui: await captureRecoveryUi(page, output, 'zip-full-failure-healthy'),
    };
    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    return { status: 'observed', ...observations };
  } finally {
    if (routeInstalled) {
      await page.unroute(routePattern, denyVerifiedOriginal);
      cleanup.routeRemoved = true;
    }
  }
}

async function runSourceImageFailureCases({
  context,
  evidence,
  extensionPage,
  images,
  output,
  qualityApiResponses,
  qualityRequests,
}: {
  context: BrowserContext;
  evidence: SourceImageFailureEvidence;
  extensionPage: Page;
  images: ImageFixtures;
  output: string;
  qualityApiResponses: ApiRecord[];
  qualityRequests: QualityRequest[];
}) {
  const originalUrl = `https://pbs.twimg.com/media/${QUALITY_IMAGE_PATHS[1]}?format=jpg&name=orig`;
  const displayUrl = `https://pbs.twimg.com/media/${QUALITY_IMAGE_PATHS[1]}?format=jpg&name=small`;
  const neighborUrl = `https://pbs.twimg.com/media/${QUALITY_IMAGE_PATHS[2]}?format=jpg&name=orig`;
  const failures: unknown[] = [];
  evidence.status = 'pending';
  for (const kind of SOURCE_IMAGE_FAULTS) {
    const expectedStatus = kind === '404' ? 404 : 200;
    const body = kind === 'corrupt' ? Buffer.from('invalid JPEG fixture bytes') : Buffer.alloc(0);
    const receipt: SourceImageFailureEvidence['cases'][number] = {
      kind,
      status: 'pending',
      originalUrl,
      expectedStatus,
      faultRequests: [],
      responses: [],
      consoleErrors: [],
      pageErrors: [],
      api: [],
      cleanup: { routeRemoved: false, listenersRemoved: false, pageClosed: false, errors: [] },
    };
    evidence.cases.push(receipt);
    let owned: Page | undefined;
    let observationOverflow = false;
    let faultActive = false;
    const apiMark = qualityApiResponses.length;
    const onConsole = (message: ConsoleMessage) => {
      if (message.type() !== 'error') {
        return;
      }
      if (receipt.consoleErrors.length < 8) {
        receipt.consoleErrors.push({
          location: message.location().url.slice(0, 500),
          text: message.text().slice(0, 500),
        });
      } else {
        observationOverflow = true;
      }
    };
    const onPageError = (error: Error) => {
      if (receipt.pageErrors.length < 4) {
        receipt.pageErrors.push(safeError(error));
      } else {
        observationOverflow = true;
      }
    };
    const onResponse = (response: Response) => {
      if (!faultActive || response.url() !== originalUrl) {
        return;
      }
      if (receipt.responses.length < 4) {
        receipt.responses.push({
          url: response.url(),
          status: response.status(),
          resourceType: response.request().resourceType(),
        });
      } else {
        observationOverflow = true;
      }
    };
    const faultRoute = async (route: Route) => {
      assert.equal(route.request().url(), originalUrl);
      assert(receipt.faultRequests.length < 4, 'Selected image fault request budget exceeded');
      receipt.faultRequests.push({
        url: route.request().url(),
        status: expectedStatus,
        bytes: body.length,
        resourceType: route.request().resourceType(),
      });
      await route.fulfill({
        status: expectedStatus,
        contentType: 'image/jpeg',
        body,
        headers: {
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': 'https://x.com',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    };
    const failedSelection = async () =>
      waitForValue(async () => {
        const state = await owned!.evaluate(() => {
          const gallery = document.querySelector('[data-xeg-gallery-container]');
          const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
          const counter = toolbar?.querySelector('#xeg-toolbar-counter');
          const item = gallery?.querySelector('[data-gallery-element="item"][data-index="1"]');
          const image = item?.querySelector('img');
          const alert = item?.querySelector('[role="alert"]');
          return {
            position: counter?.getAttribute('data-position') ?? null,
            total: counter?.getAttribute('data-total') ?? null,
            currentIndex: toolbar?.getAttribute('data-current-index') ?? null,
            focusedIndex: toolbar?.getAttribute('data-focused-index') ?? null,
            counterFocusedIndex: counter?.getAttribute('data-focused-index') ?? null,
            source: image instanceof HTMLImageElement ? image.src : null,
            currentSrc: image instanceof HTMLImageElement ? image.currentSrc : null,
            complete: image instanceof HTMLImageElement ? image.complete : false,
            width: image instanceof HTMLImageElement ? image.naturalWidth : null,
            height: image instanceof HTMLImageElement ? image.naturalHeight : null,
            loaded: item?.getAttribute('data-media-loaded') ?? null,
            alert: alert?.textContent?.trim() ?? null,
          };
        });
        return state.position === '2' &&
          state.total === '3' &&
          state.currentIndex === '1' &&
          state.focusedIndex === '1' &&
          state.counterFocusedIndex === '1' &&
          state.source === originalUrl &&
          state.complete &&
          state.width === 0 &&
          state.height === 0 &&
          state.loaded === 'false' &&
          state.alert
          ? state
          : undefined;
      }, `selected ${kind} image native failure`);
    try {
      owned = await context.newPage();
      owned.on('console', onConsole);
      owned.on('pageerror', onPageError);
      owned.on('response', onResponse);
      await owned.goto(QUALITY_FIXTURE_URL);
      await owned.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
      const trigger = owned
        .locator('[data-route="classic"][data-phase="normal"] [data-testid="tweetPhoto"] img')
        .nth(1);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.focus();
      const before = await hostSnapshot(owned, 1);
      assert.equal(before.activeElementAlt, before.triggerAlt);
      const host = await waitForValue(async () => {
        const image = await trigger.evaluate((element) => {
          if (!(element instanceof HTMLImageElement)) {
            throw new Error('Selected source-quality host image is missing');
          }
          return { src: element.src, complete: element.complete, width: element.naturalWidth };
        });
        return image.complete && image.width > 0 ? image : undefined;
      }, `decoded small host image before ${kind}`);
      assert.equal(host.src, displayUrl);
      assert.equal(host.width, 140);
      receipt.host = host;
      const documentBefore = await owned.evaluate(() => ({
        url: location.href,
        timeOrigin: performance.timeOrigin,
      }));
      const knownDownloads = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
      await owned.route(originalUrl, faultRoute);
      faultActive = true;
      await trigger.click();
      const gallery = owned.locator('[data-xeg-gallery-container]');
      await gallery.waitFor({ state: 'visible' });
      const failed = await failedSelection();
      receipt.failed = failed;
      assert(
        failed.currentSrc === '' || failed.currentSrc === originalUrl,
        'Failed image currentSrc must not point at another attachment'
      );
      assert.equal(
        await gallery
          .locator('[data-gallery-element="item"][data-index="1"] [role="alert"]')
          .isVisible(),
        true
      );
      receipt.failedPaint = await waitForRecoveryPaint(
        owned,
        1,
        `${kind}: failed image recovery text and actions painted inside the viewport`
      );
      if (kind === 'corrupt') {
        const screenshot = `src01-${kind}-error.png`;
        await owned.screenshot({ path: join(output, screenshot) });
        receipt.screenshot = screenshot;
      }
      assert.equal(
        await gallery
          .locator('[data-gallery-element="item"][data-index="2"] [role="alert"]')
          .count(),
        0
      );
      await assertQuotedOriginLink(gallery, QUALITY_FIXTURE_URL);
      const firstApi = qualityApiResponses.slice(apiMark);
      assert.equal(
        firstApi.length,
        1,
        'Fault open must have one physical healthy metadata response'
      );
      assert(
        firstApi.every(
          ({ tweetId, status, fulfilledAtMonotonicMs }) =>
            tweetId === QUALITY_TWEET_ID &&
            status === 200 &&
            typeof fulfilledAtMonotonicMs === 'number'
        )
      );
      await owned.keyboard.press('ArrowRight');
      const neighbor = await assertQuotedSelection(owned, {
        position: 3,
        total: 3,
        type: 'image',
        path: `/media/${QUALITY_IMAGE_PATHS[2]}`,
      });
      assert.equal(neighbor.source, neighborUrl);
      const neighborImage = await gallery
        .locator('[data-gallery-element="item"][data-index="2"] img')
        .evaluate((element) => {
          if (!(element instanceof HTMLImageElement)) {
            throw new Error('Healthy neighbor image is missing');
          }
          return { width: element.naturalWidth, height: element.naturalHeight };
        });
      assert.deepEqual(neighborImage, { width: 640, height: 400 });
      assert.equal(
        await gallery
          .locator('[data-gallery-element="item"][data-index="2"] [role="alert"]')
          .count(),
        0
      );
      receipt.neighbor = { ...neighbor, ...neighborImage };
      await owned.keyboard.press('ArrowLeft');
      const returned = await failedSelection();
      receipt.returned = returned;
      assert(
        returned.currentSrc === '' || returned.currentSrc === originalUrl,
        'Returned failed image currentSrc must not point at another attachment'
      );
      assert.equal(
        await gallery
          .locator('[data-gallery-element="item"][data-index="1"] [role="alert"]')
          .isVisible(),
        true
      );
      const failedItem = gallery.locator('[data-gallery-element="item"][data-index="1"]');
      const retryObservations: unknown[] = [];
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const retry = failedItem.locator('[role="alert"] button', { hasText: 'Retry loading' });
        assert.equal(await retry.count(), 1, `${kind}: retry ${attempt} must belong to item 2`);
        await retry.click();
        await waitForValue(
          () => (receipt.faultRequests.length === attempt + 1 ? true : undefined),
          `${kind}: exact display retry ${attempt}`
        );
        retryObservations.push(await failedSelection());
      }
      receipt.retries = retryObservations;
      assert.equal(
        await failedItem.locator('[role="alert"] button').count(),
        0,
        `${kind}: retries must stop after two explicit attempts`
      );
      assert.equal(
        await failedItem
          .locator('[role="alert"] a', { hasText: 'Open original post' })
          .getAttribute('href'),
        QUALITY_FIXTURE_URL
      );
      receipt.exhaustedPaint = await waitForRecoveryPaint(
        owned,
        1,
        `${kind}: exhausted image recovery text and action painted inside the viewport`
      );
      await owned.screenshot({ path: join(output, `recovery-image-${kind}-exhausted.png`) });
      await owned.keyboard.press('Escape');
      await gallery.waitFor({ state: 'detached' });
      const firstClose = await hostSnapshot(owned, 1);
      assert.deepEqual(
        firstClose,
        before,
        'Fault close must restore host focus, scroll and isolation'
      );
      receipt.firstClose = firstClose;
      await owned.unroute(originalUrl, faultRoute);
      faultActive = false;
      receipt.cleanup.routeRemoved = true;
      const healthyMark = qualityRequests.length;
      await trigger.click();
      await gallery.waitFor({ state: 'visible' });
      const healthy = await assertQuotedSelection(owned, {
        position: 2,
        total: 3,
        type: 'image',
        path: `/media/${QUALITY_IMAGE_PATHS[1]}`,
      });
      assert.equal(healthy.source, originalUrl);
      const healthyImage = await gallery
        .locator('[data-gallery-element="item"][data-index="1"] img')
        .evaluate((element) => {
          if (!(element instanceof HTMLImageElement)) {
            throw new Error('Recovered selected image is missing');
          }
          return {
            complete: element.complete,
            width: element.naturalWidth,
            height: element.naturalHeight,
          };
        });
      assert.deepEqual(healthyImage, { complete: true, width: 560, height: 360 });
      assert.equal(
        await gallery
          .locator('[data-gallery-element="item"][data-index="1"] [role="alert"]')
          .count(),
        0
      );
      receipt.healthy = { ...healthy, ...healthyImage };
      receipt.healthyRequests = qualityRequests
        .slice(healthyMark)
        .filter(({ path, name }) => path === `/media/${QUALITY_IMAGE_PATHS[1]}` && name === 'orig');
      assert(
        receipt.healthyRequests.some(
          ({ resourceType, bytes, sha256 }) =>
            resourceType === 'image' &&
            bytes === images[1].length &&
            sha256 === imageReceipt(images[1]).sha256
        ),
        'Same-document recovery must fetch the exact healthy original bytes'
      );
      receipt.api = qualityApiResponses.slice(apiMark);
      assert(
        receipt.api.every(
          ({ tweetId, status, fulfilledAtMonotonicMs }) =>
            tweetId === QUALITY_TWEET_ID &&
            status === 200 &&
            typeof fulfilledAtMonotonicMs === 'number'
        )
      );
      assert(
        receipt.api.length <= 2,
        'Fault and recovery must use at most two healthy API requests'
      );
      assert.deepEqual(
        await owned.evaluate(() => ({ url: location.href, timeOrigin: performance.timeOrigin })),
        documentBefore,
        'Fault recovery must stay in the same document'
      );
      await owned.keyboard.press('Escape');
      await gallery.waitFor({ state: 'detached' });
      const finalClose = await hostSnapshot(owned, 1);
      assert.deepEqual(
        finalClose,
        before,
        'Healthy close must restore host focus, scroll and isolation'
      );
      receipt.finalClose = finalClose;
      assert(receipt.faultRequests.length > 0, 'Selected original fault route was not reached');
      assert(
        receipt.faultRequests.every(
          ({ url, status, resourceType, bytes }) =>
            url === originalUrl &&
            status === expectedStatus &&
            resourceType === 'image' &&
            bytes === body.length
        )
      );
      assert.equal(receipt.responses.length, receipt.faultRequests.length);
      assert(
        receipt.responses.every(
          ({ url, status, resourceType }) =>
            url === originalUrl && status === expectedStatus && resourceType === 'image'
        )
      );
      assert.equal(observationOverflow, false, 'Source image fault observations overflowed');
      assert.deepEqual(receipt.pageErrors, []);
      const expected404 = receipt.consoleErrors.filter(
        ({ location, text }) =>
          kind === '404' &&
          location === originalUrl &&
          /Failed to load resource: the server responded with a status of 404(?:\D|$)/u.test(text)
      );
      assert(
        expected404.length <= receipt.faultRequests.length,
        'Selected 404 console errors must stay within the owned request count'
      );
      assert.deepEqual(
        receipt.consoleErrors.filter((record) => !expected404.includes(record)),
        [],
        'Only the selected original 404 may emit an expected console error'
      );
      assert.deepEqual(
        (await queryDownloads(extensionPage)).filter(({ id }) => !knownDownloads.has(id)),
        [],
        'Source image failure navigation must not create a native download'
      );
      receipt.status = 'passed';
    } catch (error) {
      failures.push(error);
      receipt.status = 'failed';
      receipt.error = safeError(error);
      if (owned && !owned.isClosed() && !receipt.screenshot) {
        const screenshot = `src01-${kind}-error.png`;
        await owned
          .screenshot({ path: join(output, screenshot) })
          .then(() => {
            receipt.screenshot = screenshot;
          })
          .catch((screenshotError) => {
            receipt.screenshotError = safeError(screenshotError);
          });
      }
    } finally {
      receipt.api = qualityApiResponses.slice(apiMark);
      if (owned) {
        if (!receipt.cleanup.routeRemoved) {
          try {
            await owned.unroute(originalUrl, faultRoute);
            faultActive = false;
            receipt.cleanup.routeRemoved = true;
          } catch (error) {
            receipt.cleanup.errors.push(safeError(error));
            failures.push(error);
          }
        }
        try {
          owned.off('console', onConsole);
          owned.off('pageerror', onPageError);
          owned.off('response', onResponse);
          receipt.cleanup.listenersRemoved = true;
        } catch (error) {
          receipt.cleanup.errors.push(safeError(error));
          failures.push(error);
        }
        try {
          await owned.close();
          receipt.cleanup.pageClosed = true;
        } catch (error) {
          receipt.cleanup.errors.push(safeError(error));
          failures.push(error);
        }
      } else {
        receipt.cleanup = {
          routeRemoved: true,
          listenersRemoved: true,
          pageClosed: true,
          errors: [],
        };
      }
      if (receipt.cleanup.errors.length) {
        receipt.status = 'failed';
      }
    }
    if (receipt.cleanup.errors.length) {
      break;
    }
  }
  evidence.status = failures.length ? 'failed' : 'passed';
  if (failures.length) {
    evidence.errors = failures.map(safeError);
    throw new AggregateError(failures, 'Selected image failure validation or cleanup failed');
  }
}

async function runOriginalAvailabilityCycles({
  consoleErrors,
  downloads,
  evidence,
  extensionPage,
  images,
  nativeLoopback,
  output,
  page,
  pageFetches,
  uiProbe = false,
}: {
  consoleErrors: ConsoleErrorRecord[];
  downloads: string;
  evidence: OriginalAvailabilityEvidence;
  extensionPage: Page;
  images: ImageFixtures;
  nativeLoopback: NativeLoopback;
  output: string;
  page: Page;
  pageFetches: PageFetch[];
  uiProbe?: boolean;
}) {
  const original = `https://pbs.twimg.com/media/${QUALITY_IMAGE_PATHS[1]}?format=jpg&name=orig`;
  const matchesOriginal = (url: URL) => url.href === original;
  const nextDownload = async (known: Set<number>, terminal: 'complete' | 'interrupted') =>
    waitForValue(
      async () => {
        const created = (await queryDownloads(extensionPage)).filter(({ id }) => !known.has(id));
        assert(created.length <= 1, 'One ordinary action must not create replacement downloads');
        const item = created[0];
        if (!item || !['complete', 'interrupted'].includes(item.state)) {
          return undefined;
        }
        assert.equal(item.state, terminal, 'Native completion must match the armed availability');
        return item;
      },
      `original availability native ${terminal}`,
      20_000
    );
  evidence.status = 'pending';
  try {
    for (const status of [403, 404] as const) {
      // A fresh document discards prior ZIP bytes; the healthy render is established before
      // denying only the original transport. The visible image remains decoded throughout.
      await page.goto(QUALITY_FIXTURE_URL);
      await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
      const trigger = page
        .locator('[data-route="classic"][data-phase="normal"] [data-testid="tweetPhoto"] img')
        .nth(1);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.focus();
      const before = await hostSnapshot(page, 1);
      await trigger.click();
      const gallery = page.locator('[data-xeg-gallery-container]');
      await gallery.waitFor({ state: 'visible' });
      const selection = await assertQuotedSelection(page, {
        position: 2,
        total: 3,
        type: 'image',
        path: `/media/${QUALITY_IMAGE_PATHS[1]}`,
      });
      assert.equal(selection.source, original);
      await assertQuotedOriginLink(gallery, QUALITY_FIXTURE_URL);
      const selectedImage = gallery.locator('[data-gallery-element="item"][data-index="1"] img');
      const decodedImage = () =>
        selectedImage.evaluate((element) => {
          if (!(element instanceof HTMLImageElement)) {
            throw new Error('Selected original-availability image is missing');
          }
          return {
            complete: element.complete,
            width: element.naturalWidth,
            height: element.naturalHeight,
          };
        });
      const healthy = await decodedImage();
      assert.deepEqual(healthy, { complete: true, width: 560, height: 360 });
      const receipt = {
        status,
        selection,
        healthy,
        documentTimeOrigin: await page.evaluate(() => performance.timeOrigin),
        faultRequests: [] as Array<{ status: number; resourceType: string; atMs: number }>,
        single: undefined as unknown,
        zip: undefined as unknown,
        restored: undefined as unknown,
        ui: undefined as unknown,
        cleanup: { pageRouteRemoved: false, nativeFaultRemoved: false },
      };
      evidence.cases.push(receipt);
      const faultRoute = async (route: Route) => {
        assert(receipt.faultRequests.length < 8, 'Original failure request budget exceeded');
        receipt.faultRequests.push({
          status,
          resourceType: route.request().resourceType(),
          atMs: performance.now(),
        });
        await route.fulfill({
          status,
          body: '',
          headers: {
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': 'https://x.com',
            'Access-Control-Allow-Credentials': 'true',
          },
        });
      };
      const currentButton = gallery.locator(
        '[data-gallery-element="toolbar"] button[aria-label="Download"]'
      );
      const zipButton = gallery.locator(
        '[data-gallery-element="toolbar"] button[aria-label="Download 3 shown files as ZIP"]'
      );
      await page.route(matchesOriginal, faultRoute);
      nativeLoopback.armHttpFailure(original, status);
      try {
        const knownSingle = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
        const nativeMark = nativeLoopback.mark();
        const fetchMark = pageFetches.length;
        const singleConsoleMark = consoleErrors.length;
        const filesBeforeSingle = new Set(await readdir(downloads));
        await currentButton.click();
        const failed = await nextDownload(knownSingle, 'interrupted');
        await waitForValue(
          async () => ((await currentButton.isEnabled()) ? true : undefined),
          'failed original single settled'
        );
        assert.equal(failed.url, original);
        assert.equal(failed.bytesReceived, 0);
        const filesAdded = await waitForValue(async () => {
          const added = (await readdir(downloads)).filter((name) => !filesBeforeSingle.has(name));
          return added.length === 0 ? added : undefined;
        }, 'rejected original left no completed or partial file');
        const expectedNativeError = status === 403 ? 'SERVER_FORBIDDEN' : 'SERVER_BAD_CONTENT';
        assert.equal(
          failed.error,
          expectedNativeError,
          'Native terminal reason must match the server rejection'
        );
        const nativeEvents = nativeLoopback.since(nativeMark);
        assert.equal(nativeEvents.filter(({ method }) => method === 'GET').length, 1);
        assert(
          nativeEvents.every(
            (event) =>
              event.status === status &&
              event.result === 'http-failure' &&
              typeof event.finishedAtMs === 'number'
          )
        );
        assert.deepEqual(
          pageFetches.slice(fetchMark),
          [],
          'Failed native original must not fall back to page bytes'
        );
        receipt.single = {
          id: failed.id,
          state: failed.state,
          error: failed.error,
          nativeExists: failed.exists,
          filesAdded,
          nativeEvents,
        };
        const nativeErrors = consoleErrors
          .slice(singleConsoleMark)
          .filter(
            (record) =>
              record.text.startsWith('[XEG] Download failed ') &&
              record.text.includes(expectedNativeError)
          );
        assert(
          nativeErrors.length <= 1,
          'One rejected native download may report at most one failure'
        );
        evidence.expectedConsoleErrors.push(...nativeErrors);
        assert.deepEqual(
          await decodedImage(),
          healthy,
          'A save failure must preserve the decoded gallery image'
        );

        const knownZip = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
        const zipConsoleMark = consoleErrors.length;
        await zipButton.click();
        const zip = await nextDownload(knownZip, 'complete');
        const entries = [0, 2].map((index) => ({
          filename: qualityFilename(index),
          bytes: images[index]!,
        }));
        const { bytes } = await readExactDownloadFile(
          zip.filename,
          expectedStoredZipBytes(entries)
        );
        const verified = verifyStoredZip(bytes, entries);
        const file = `original-${status}-partial.zip`;
        await copyFile(zip.filename, join(output, file));
        receipt.zip = {
          id: zip.id,
          filename: basename(zip.filename),
          file,
          ...imageReceipt(bytes),
          verified,
          omitted: [qualityFilename(1)],
        };
        assert.equal(
          receipt.faultRequests.length,
          1,
          'A denied original must not be fetched again or replaced by display bytes'
        );
        assert(['fetch', 'xhr'].includes(receipt.faultRequests[0]!.resourceType));
        await waitForValue(
          async () => ((await zipButton.isEnabled()) ? true : undefined),
          'partial ZIP settled'
        );
        await assertVisibleBulkOutcome(page, {
          included: 2,
          omitted: 1,
          handedOff: true,
          reason: `A media source request failed (HTTP ${status})`,
        });
        if (uiProbe) {
          await page.waitForTimeout(5_250);
          await zipButton.focus();
          await assertVisibleBulkOutcome(page, { included: 2, omitted: 1, handedOff: true });
          receipt.ui = {
            partialAfterFiveSeconds: await captureRecoveryUi(
              page,
              output,
              `source-${status}-partial-after-five-seconds`
            ),
          };
          await gallery
            .locator('[data-gallery-element="bulk-download-outcome"] button', {
              hasText: 'Dismiss ZIP result',
            })
            .click();
          assert.equal(
            await gallery.locator('[data-gallery-element="bulk-download-outcome"]').count(),
            0
          );
          assert.equal(await gallery.locator('[data-download-status]').count(), 0);
          assert.equal(
            await gallery.locator('.xeg-sr-only[aria-live="polite"]').textContent(),
            '',
            'Dismissing a partial ZIP must not revive its stale live error'
          );
          receipt.ui = {
            ...(receipt.ui as object),
            dismissed: await captureRecoveryUi(page, output, `source-${status}-dismissed`),
          };
        }
        const resourceErrors = consoleErrors
          .slice(zipConsoleMark)
          .filter(
            (record) =>
              record.location === original &&
              record.text.includes(`the server responded with a status of ${status}`)
          );
        assert(
          resourceErrors.length <= 1,
          'One rejected ZIP source may report at most one resource failure'
        );
        evidence.expectedConsoleErrors.push(...resourceErrors);
      } finally {
        nativeLoopback.clearHttpFailure();
        receipt.cleanup.nativeFaultRemoved = true;
        await page.unroute(matchesOriginal, faultRoute);
        receipt.cleanup.pageRouteRemoved = true;
      }
      // Restore transport in the same gallery. The previously failed source must now be
      // acquired afresh, while successful cached siblings may be reused by the ZIP.
      const knownHealthy = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
      const nativeMark = nativeLoopback.mark();
      const fetchMark = pageFetches.length;
      await currentButton.click();
      const healthySingle = await nextDownload(knownHealthy, 'complete');
      const native = await assertNativeSingle({
        extensionPage,
        knownIds: knownHealthy,
        download: healthySingle,
        expectedUrl: original,
        expectedBytes: images[1],
        nativeLoopback,
        nativeMark,
        pageFetches: pageFetches.slice(fetchMark),
      });
      const { bytes: singleBytes } = await readExactDownloadFile(
        healthySingle.filename,
        images[1].length
      );
      assert(singleBytes.equals(images[1]));
      const singleFile = `original-${status}-restored.jpg`;
      await copyFile(healthySingle.filename, join(output, singleFile));
      await waitForValue(
        async () => ((await zipButton.isEnabled()) ? true : undefined),
        'restored single settled'
      );
      const knownHealthyZip = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
      await zipButton.click();
      const healthyZip = await nextDownload(knownHealthyZip, 'complete');
      const allEntries = images.map((bytes, index) => ({
        filename: qualityFilename(index),
        bytes,
      }));
      const { bytes: zipBytes } = await readExactDownloadFile(
        healthyZip.filename,
        expectedStoredZipBytes(allEntries)
      );
      const verified = verifyStoredZip(zipBytes, allEntries);
      const zipFile = `original-${status}-restored.zip`;
      await copyFile(healthyZip.filename, join(output, zipFile));
      receipt.restored = {
        single: { id: healthySingle.id, file: singleFile, ...imageReceipt(singleBytes), native },
        zip: { id: healthyZip.id, file: zipFile, ...imageReceipt(zipBytes), verified },
      };
      if (uiProbe) {
        await zipButton.focus();
        await assertVisibleBulkOutcome(page, { included: 3, omitted: 0, handedOff: true });
        receipt.ui = {
          ...(receipt.ui as object),
          healthy: await captureRecoveryUi(page, output, `source-${status}-healthy`),
        };
      }
      await page.keyboard.press('Escape');
      await gallery.waitFor({ state: 'detached' });
      const after = await hostSnapshot(page, 1);
      assert.equal(after.activeElementAlt, before.triggerAlt);
      assert.equal(after.scrollY, before.scrollY);
      assert.deepEqual(after.bodyStyle, before.bodyStyle);
      assert.deepEqual(after.background, before.background);
      assert.equal(after.scrollRestoration, before.scrollRestoration);
    }
    evidence.status = 'passed';
    await writeFile(
      join(output, 'original-availability-observations.json'),
      JSON.stringify(evidence, null, 2)
    );
  } catch (error) {
    evidence.status = 'failed';
    evidence.error = safeError(error);
    throw error;
  }
}

/** Issue #392: saved-output acceptance through the installed extension and real gallery UI. */
async function runFailedEntryRecoveryProbe({
  context,
  downloads,
  extensionId,
  nativeLoopback,
  output,
  root,
  images,
  displayImages,
}: {
  context: BrowserContext;
  downloads: string;
  extensionId: string;
  nativeLoopback: NativeLoopback;
  output: string;
  root: string;
  images: ImageFixtures;
  displayImages: ImageFixtures;
}) {
  const evidence: MemoryEvidence = { status: 'pending', cleanup: {}, requests: [], downloads: [] };
  const consoleErrors: ConsoleErrorRecord[] = [];
  const pageErrors: string[] = [];
  const pageFetches: PageFetch[] = [];
  const apiRequests: Array<{ path: string; method: string; tweetId: string | null }> = [];
  const unrelatedFetches: Array<{ host: string; path: string; resourceType: string }> = [];
  const cleanupErrors: string[] = [];
  const routes = await installFixtureRoutes(
    context,
    root,
    images,
    displayImages,
    undefined,
    undefined,
    {
      classicTweetApi: true,
    }
  );
  const onApiRequest = (request: Request) => {
    const url = new URL(request.url());
    if (url.hostname !== 'x.com' || !url.pathname.endsWith('/TweetResultByRestId')) {
      return;
    }
    let tweetId: string | null = null;
    try {
      const variables: unknown = JSON.parse(url.searchParams.get('variables') ?? '{}');
      if (
        typeof variables === 'object' &&
        variables !== null &&
        'tweetId' in variables &&
        typeof variables.tweetId === 'string'
      ) {
        tweetId = variables.tweetId;
      }
    } catch {
      // An invalid fixture API request is recorded below and fails the exact-ID assertion.
    }
    apiRequests.push({ path: url.pathname, method: request.method(), tweetId });
  };
  context.on('request', onApiRequest);
  nativeLoopback.setPayloads(images, routes.videoPayloads);
  const extensionPage = await context.newPage();
  const page = await context.newPage();
  let primaryError: unknown;
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push({ location: message.location().url, text: message.text() });
    }
  });
  page.on('request', (request) => {
    if (!['fetch', 'xhr'].includes(request.resourceType())) {
      return;
    }
    const url = new URL(request.url());
    if (url.hostname === 'pbs.twimg.com') {
      pageFetches.push({
        host: url.hostname,
        path: url.pathname,
        resourceType: request.resourceType(),
      });
    } else if (url.hostname !== 'x.com' || !url.pathname.endsWith('/TweetResultByRestId')) {
      unrelatedFetches.push({
        host: url.hostname,
        path: url.pathname,
        resourceType: request.resourceType(),
      });
    }
  });
  try {
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    await page.goto(FIXTURE_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    await runDownloadMemoryCycle({
      consoleErrors,
      downloads,
      extensionPage,
      images,
      output,
      page,
      root,
      evidence,
      nativeLoopback,
      pageFetches,
      preSaveRetryProbe: true,
    });
    assert(apiRequests.length > 0 && apiRequests.length <= 2, 'Classic API request count changed');
    assert.deepEqual(
      apiRequests.map(({ method, tweetId }) => ({ method, tweetId })),
      apiRequests.map(() => ({ method: 'GET', tweetId: TWEET_ID })),
      'Classic fixture requested unrelated or malformed API metadata'
    );
    assert(
      apiRequests.every(({ path }) =>
        /^\/i\/api\/graphql\/[^/]+\/TweetResultByRestId$/u.test(path)
      ),
      'Classic fixture requested an unexpected GraphQL route'
    );
    assert.equal(routes.classicApiResponses.length, apiRequests.length);
    assert(
      routes.classicApiResponses.every(
        ({ tweetId, method, status, fulfilledAtMonotonicMs }) =>
          tweetId === TWEET_ID &&
          method === 'GET' &&
          status === 200 &&
          typeof fulfilledAtMonotonicMs === 'number'
      ),
      'Classic fixture did not fulfill exact owned photo metadata'
    );
    assert.deepEqual(routes.apiResponses, [], 'An API request reached the generic 403 fallback');
    assert.deepEqual(
      routes.unhandledRequests,
      [],
      'Fixture routing left a network request unhandled'
    );
    assert.deepEqual(unrelatedFetches, [], 'Fixture made an unrelated fetch or XHR');
    assert(
      pageFetches.every(
        ({ host, path }) =>
          host === 'pbs.twimg.com' && IMAGE_URL_MARKERS.some((marker) => path.includes(marker))
      ),
      'Fixture fetched media outside its three owned images'
    );
    assert.deepEqual(pageErrors, [], 'Failed-entry fixture page threw');
    const expectedErrors = new Set(evidence.expectedConsoleErrors ?? []);
    assert.deepEqual(
      consoleErrors.filter((error) => !expectedErrors.has(error)),
      [],
      'Failed-entry fixture reported unexpected console errors'
    );
  } catch (error) {
    primaryError = error;
  } finally {
    context.off('request', onApiRequest);
    for (const [label, close] of [
      ['fixture page', () => page.close()],
      ['extension page', () => extensionPage.close()],
      ['fixture routes', () => routes.remove()],
    ] as const) {
      try {
        await close();
      } catch (error) {
        cleanupErrors.push(`${label}: ${safeError(error)}`);
      }
    }
    await writeFile(
      join(output, 'failed-entry-recovery.json'),
      JSON.stringify(
        {
          status: primaryError || cleanupErrors.length ? 'failed' : 'passed',
          scope: 'installed extension and owned deterministic X fixture',
          evidence,
          apiRequests,
          classicApiResponses: routes.classicApiResponses,
          genericApiResponses: routes.apiResponses,
          unhandledRequests: routes.unhandledRequests,
          unrelatedFetches,
          pageErrors,
          consoleErrors,
          cleanupErrors,
          error: primaryError ? safeError(primaryError) : null,
        },
        null,
        2
      )
    );
  }
  if (primaryError && cleanupErrors.length) {
    throw new AggregateError(
      [primaryError, ...cleanupErrors],
      'Failed-entry probe and cleanup failed'
    );
  }
  if (primaryError) {
    throw primaryError;
  }
  assert.deepEqual(cleanupErrors, [], 'Failed-entry probe cleanup failed');
  return { status: 'passed', evidence };
}

/** Issue #382: existing recovery mechanisms with the missing on-page observations. */
async function runMediaDownloadRecoveryProbe({
  context,
  downloads,
  extensionId,
  nativeLoopback,
  output,
  root,
  images,
  displayImages,
}: {
  context: BrowserContext;
  downloads: string;
  extensionId: string;
  nativeLoopback: NativeLoopback;
  output: string;
  root: string;
  images: ImageFixtures;
  displayImages: ImageFixtures;
}) {
  const observations: Record<string, unknown> = {};
  const pageErrors: string[] = [];
  const consoleErrors: ConsoleErrorRecord[] = [];
  const pageFetches: PageFetch[] = [];
  const cleanupErrors: unknown[] = [];
  const routes = await installFixtureRoutes(context, root, images, displayImages);
  nativeLoopback.setPayloads(images, routes.videoPayloads);
  const extensionPage = await context.newPage();
  const page = await context.newPage();
  let notificationObserver:
    | Awaited<ReturnType<typeof observeNativeNotificationCreates>>
    | undefined;
  let primaryError: unknown;
  let result: Record<string, unknown> | undefined;
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      assert(consoleErrors.length < 32, 'Recovery probe console observation overflowed');
      consoleErrors.push({ location: message.location().url, text: message.text() });
    }
  });
  page.on('request', (request) => {
    if (!['fetch', 'xhr'].includes(request.resourceType())) {
      return;
    }
    const url = new URL(request.url());
    if (!['pbs.twimg.com', 'video.twimg.com'].includes(url.hostname)) {
      return;
    }
    assert(pageFetches.length < 128, 'Recovery probe fetch observation overflowed');
    pageFetches.push({
      host: url.hostname,
      path: url.pathname,
      resourceType: request.resourceType(),
    });
  });
  try {
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    notificationObserver = await observeNativeNotificationCreates(context, extensionId, true);
    observations.notificationBefore = await notificationObserver.snapshot();
    observations.x03Transient = await runTransientImageRecoveryProbe({
      context,
      extensionPage,
      output,
      qualityRequests: routes.qualityRequests,
    });
    const persistent: SourceImageFailureEvidence = { status: 'pending', cases: [] };
    await runSourceImageFailureCases({
      context,
      evidence: persistent,
      extensionPage,
      images,
      output,
      qualityApiResponses: routes.qualityApiResponses,
      qualityRequests: routes.qualityRequests,
    });
    observations.x03Persistent = persistent;
    const availability: OriginalAvailabilityEvidence = {
      status: 'pending',
      cases: [],
      expectedConsoleErrors: [],
    };
    await runOriginalAvailabilityCycles({
      consoleErrors,
      downloads,
      evidence: availability,
      extensionPage,
      images,
      nativeLoopback,
      output,
      page,
      pageFetches,
      uiProbe: true,
    });
    observations.x03UnavailableOriginalAndX04Partial = availability;
    await page.goto(FIXTURE_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    const memory: MemoryEvidence = { status: 'pending', cleanup: {}, requests: [], downloads: [] };
    await runDownloadMemoryCycle({
      consoleErrors,
      downloads,
      extensionPage,
      images,
      output,
      page,
      root,
      evidence: memory,
      nativeLoopback,
      pageFetches,
      uiProbe: true,
    });
    observations.x04MemoryPartial = memory;
    observations.x04FullFailure = await runFullZipFailureProbe({
      downloads,
      extensionPage,
      images,
      output,
      page,
    });
    const notificationAfter = await notificationObserver.snapshot();
    observations.notificationAfter = notificationAfter;
    assert.deepEqual(
      notificationAfter.activeIds.filter((id) => id.startsWith('xeg-')),
      [],
      'Suppressed recovery notifications must not be visible natively'
    );
    assert.deepEqual(pageErrors, [], 'Recovery fixture page must not throw');
    observations.runtime = {
      pageErrors,
      consoleErrors,
      pageFetches,
      qualityApi: routes.qualityApiResponses,
      qualityRequests: routes.qualityRequests,
      nativeTransport: nativeLoopback.snapshot(),
    };
    result = {
      status: 'observed',
      scope: 'installed extension and deterministic owned X fixture',
      ...observations,
    };
  } catch (error) {
    primaryError = error;
    await page.screenshot({ path: join(output, 'recovery-probe-failure.png') }).catch(() => {});
    throw error;
  } finally {
    for (const [label, close] of [
      ['notification observer', () => notificationObserver?.dispose()],
      ['fixture routes', () => routes.remove()],
      ['fixture page', () => page.close()],
      ['extension page', () => extensionPage.close()],
    ] as const) {
      try {
        await close();
      } catch (error) {
        cleanupErrors.push(new Error(`${label}: ${safeError(error)}`));
      }
    }
    await writeFile(
      join(output, 'media-download-recovery.json'),
      JSON.stringify(
        {
          status: primaryError || cleanupErrors.length ? 'failed' : 'observed',
          observations,
          pageErrors,
          consoleErrors,
          cleanupErrors: cleanupErrors.map(safeError),
          error: primaryError ? safeError(primaryError) : null,
        },
        null,
        2
      )
    );
  }
  if (cleanupErrors.length) {
    throw new AggregateError(cleanupErrors, 'Recovery probe cleanup failed');
  }
  assert(result, 'Recovery probe did not complete');
  return result;
}

/** A small installed-extension baseline for issue #383's gallery experience. */
async function experienceToolbarState(toolbar: Locator) {
  return toolbar.evaluate((element) => {
    const wrapper = element.parentElement;
    const container = wrapper?.parentElement;
    const close = element.querySelector<HTMLButtonElement>('button[aria-label="Close"]');
    const rect = close?.getBoundingClientRect();
    const hit = rect
      ? document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      : null;
    const style = (target: Element | null | undefined) =>
      target
        ? {
            opacity: getComputedStyle(target).opacity,
            visibility: getComputedStyle(target).visibility,
            pointerEvents: getComputedStyle(target).pointerEvents,
          }
        : null;
    return {
      containerClass: container?.className ?? null,
      toolbar: style(element),
      wrapper: style(wrapper),
      close: style(close),
      closeHit: Boolean(hit && close?.contains(hit)),
      activeLabel:
        document.activeElement?.getAttribute('aria-label') ??
        (document.activeElement instanceof HTMLElement ? document.activeElement.id : null),
      focusedWithin: element.contains(document.activeElement),
    };
  });
}

async function experienceControlGeometry(toolbar: Locator) {
  return toolbar.evaluate((element) => {
    const toolbarRect = element.getBoundingClientRect();
    const controls = [...element.querySelectorAll<HTMLButtonElement>('button')]
      .filter(
        (button) =>
          !button.disabled &&
          !button.closest(
            '[data-gallery-element="settings-panel"], [data-gallery-element="tweet-panel"]'
          )
      )
      .map((button) => {
        const rect = button.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
        return {
          label: button.getAttribute('aria-label'),
          rect: rect.toJSON(),
          hit: Boolean(hit && button.contains(hit)),
          withinViewport:
            rect.left >= 0 &&
            rect.top >= 0 &&
            rect.right <= innerWidth &&
            rect.bottom <= innerHeight,
        };
      });
    return {
      innerWidth,
      innerHeight,
      devicePixelRatio,
      visualViewport: visualViewport
        ? {
            width: visualViewport.width,
            height: visualViewport.height,
            scale: visualViewport.scale,
          }
        : null,
      toolbar: toolbarRect.toJSON(),
      controls,
    };
  });
}

async function experienceSelectedGeometry(page: Page) {
  return page.evaluate(() => {
    const toolbar = document.querySelector<HTMLElement>('[data-gallery-element="toolbar"]');
    const current = toolbar?.getAttribute('data-current-index');
    const selected = document.querySelector<HTMLElement>(
      `[data-gallery-element="item"][data-index="${current}"]`
    );
    const items = document.querySelector<HTMLElement>('[data-gallery-element="items"]');
    const itemsStyle = items ? getComputedStyle(items) : null;
    return {
      innerWidth,
      innerHeight,
      devicePixelRatio,
      visualViewport: visualViewport
        ? {
            width: visualViewport.width,
            height: visualViewport.height,
            scale: visualViewport.scale,
          }
        : null,
      current,
      focused: toolbar?.getAttribute('data-focused-index'),
      selected: selected?.getBoundingClientRect().toJSON(),
      media: selected?.querySelector('img')?.getBoundingClientRect().toJSON(),
      toolbar: toolbar?.getBoundingClientRect().toJSON(),
      activeFit: toolbar?.querySelector('[aria-pressed="true"]')?.getAttribute('aria-label'),
      items: items
        ? {
            rect: items.getBoundingClientRect().toJSON(),
            scrollTop: items.scrollTop,
            scrollHeight: items.scrollHeight,
            clientHeight: items.clientHeight,
            paddingBlockStart: itemsStyle?.paddingBlockStart,
            scrollPaddingBlockStart: itemsStyle?.scrollPaddingBlockStart,
            clearance: itemsStyle?.getPropertyValue('--xeg-toolbar-clearance').trim(),
            selectedScrollMargin: selected
              ? getComputedStyle(selected).scrollMarginBlockStart
              : null,
          }
        : null,
    };
  });
}

async function runGalleryExperienceProbe({
  context,
  downloads,
  extensionId,
  nativeLoopback,
  output,
  root,
  images,
  displayImages,
}: {
  context: BrowserContext;
  downloads: string;
  extensionId: string;
  nativeLoopback: NativeLoopback;
  output: string;
  root: string;
  images: ImageFixtures;
  displayImages: ImageFixtures;
}) {
  const experienceImages = await createExperienceImages(context);
  const routes = await installFixtureRoutes(
    context,
    root,
    images,
    displayImages,
    undefined,
    experienceImages
  );
  nativeLoopback.setPayloads(images, routes.videoPayloads);
  nativeLoopback.setExperienceImages(experienceImages);
  const extensionPage = await context.newPage();
  const page = await context.newPage();
  const phases: Record<string, { status: string; observations?: unknown; error?: string }> = {};
  const pageErrors: string[] = [];
  const cleanupErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const phase = async (
    name: string,
    action: (partial: Record<string, unknown>) => Promise<unknown>
  ) => {
    const partial: Record<string, unknown> = {};
    try {
      phases[name] = { status: 'passed', observations: await action(partial) };
    } catch (error) {
      partial.nativeTransport = nativeLoopback.snapshot();
      if (name === 'x02-toolbar') {
        partial.downloads = await queryDownloads(extensionPage).then(
          (items) =>
            items.map(({ id, url, state, error, bytesReceived, totalBytes }) => ({
              id,
              url,
              state,
              error,
              bytesReceived,
              totalBytes,
            })),
          (downloadError) => ({ error: safeError(downloadError) })
        );
      }
      phases[name] = { status: 'failed', observations: partial, error: safeError(error) };
      await page
        .screenshot({ path: join(output, `experience-${name}-failure.png`) })
        .catch(() => {});
    }
  };
  try {
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    await phase('x02-toolbar', async (partial) => {
      await page.goto(EXPERIENCE_FIXTURE_URL);
      await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
      const trigger = page.locator('[data-testid="tweetPhoto"] img').first();
      await trigger.scrollIntoViewIfNeeded();
      await trigger.focus();
      await trigger.click();
      const gallery = page.locator('[data-xeg-gallery-container]');
      await gallery.waitFor({ state: 'visible' });
      const toolbar = gallery.locator('[data-gallery-element="toolbar"]');
      const initial = await experienceToolbarState(toolbar);
      partial.initial = initial;
      await page.screenshot({ path: join(output, 'experience-x02-toolbar-initial.png') });
      await toolbar.evaluate((element) => {
        if (element.contains(document.activeElement)) {
          (document.activeElement as HTMLElement).blur();
        }
      });
      await page.mouse.move(640, 350);
      await page.waitForTimeout(4_250);
      const hidden = await experienceToolbarState(toolbar);
      partial.hidden = hidden;
      await page.screenshot({ path: join(output, 'experience-x02-toolbar-idle.png') });
      assert(Number(hidden.wrapper?.opacity) < 0.05, 'Toolbar wrapper remained painted after idle');
      await page.mouse.move(640, 8);
      const rediscovered = await waitForValue(
        async () => {
          const state = await experienceToolbarState(toolbar);
          return Number(state.wrapper?.opacity) > 0.95 && state.closeHit ? state : undefined;
        },
        'pointer-revealed toolbar paint and Close hit target',
        3_000
      );
      partial.rediscovered = rediscovered;
      await page.screenshot({ path: join(output, 'experience-x02-toolbar-pointer.png') });
      await toolbar.locator('button[aria-label="Fit Window"]').click();
      assert.equal(
        await toolbar.locator('button[aria-label="Fit Window"]').getAttribute('aria-pressed'),
        'true',
        'Pointer-revealed fit action did not run'
      );
      await toolbar.evaluate((element) => {
        if (element.contains(document.activeElement)) {
          (document.activeElement as HTMLElement).blur();
        }
      });
      await page.mouse.move(640, 350);
      await page.waitForTimeout(4_250);
      const hiddenAfterPointer = await experienceToolbarState(toolbar);
      partial.hiddenAfterPointer = hiddenAfterPointer;
      assert(Number(hiddenAfterPointer.wrapper?.opacity) < 0.05);
      const requiredLabels = [
        'Fit Width',
        'Fit Height',
        'Fit Window',
        'Original',
        'Download',
        'Download 3 shown files as ZIP',
        'Open Settings',
        'Close',
      ];
      const reachable: string[] = [];
      const focusSteps: Array<Record<string, unknown>> = [];
      partial.focusSteps = focusSteps;
      for (let index = 0; index < 32; index++) {
        await page.keyboard.press('Tab');
        const state = await experienceToolbarState(toolbar);
        focusSteps.push({ key: 'Tab', ...state });
        const label = state.focusedWithin ? state.activeLabel : null;
        if (label && !reachable.includes(label)) {
          reachable.push(label);
        }
        if (requiredLabels.every((required) => reachable.includes(required))) {
          break;
        }
      }
      for (const label of requiredLabels) {
        assert(reachable.includes(label), `Toolbar Tab sequence missed ${label}`);
      }
      await page.keyboard.press('Shift+Tab');
      const reversed = await experienceToolbarState(toolbar);
      focusSteps.push({ key: 'Shift+Tab', ...reversed });
      const reverseFocus = reversed.activeLabel;
      assert(reversed.focusedWithin && reverseFocus, 'Shift+Tab lost toolbar focus');
      const focused = await waitForValue(
        async () => {
          const state = await experienceToolbarState(toolbar);
          partial.lastFocusState = state;
          return state.focusedWithin && Number(state.wrapper?.opacity) > 0.95 && state.closeHit
            ? state
            : undefined;
        },
        'keyboard-focused toolbar paint and Close hit target',
        3_000
      );
      partial.focused = focused;
      await page.screenshot({ path: join(output, 'experience-x02-toolbar-focused.png') });
      await page.mouse.move(640, 350);
      await toolbar.locator('#settings-button').click();
      const select = gallery.getByLabel('Video clicks');
      await select.waitFor({ state: 'visible' });
      await select.click();
      await page.mouse.move(640, 350);
      const selectAfterPointerAway = await select.evaluate((element) => ({
        focused: document.activeElement === element,
        visible: getComputedStyle(element).visibility,
        pointerEvents: getComputedStyle(element).pointerEvents,
      }));
      assert.equal(selectAfterPointerAway.visible, 'visible');
      await toolbar.locator('#settings-button').click();
      const nativeSetting = await runVideoClickSettingsCycle({
        extensionPage,
        gallery,
        output,
        page,
      });
      const newDocumentSetting = await runVideoClickNewDocumentReadback({
        context,
        extensionPage,
        gallery,
        page,
      });
      const knownSingle = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
      await toolbar.locator('button[aria-label="Download"]').click();
      const single = await waitForValue(
        async () => {
          const added = (await queryDownloads(extensionPage)).filter(
            ({ id }) => !knownSingle.has(id)
          );
          return added.length === 1 && added[0]?.state === 'complete' ? added[0] : undefined;
        },
        'experience current image download',
        20_000
      );
      const singleRelative = relative(downloads, single.filename);
      assert(singleRelative && !singleRelative.startsWith('..') && !isAbsolute(singleRelative));
      const singleBytes = await readFile(single.filename);
      assert(singleBytes.equals(experienceImages[0]!), 'Current image bytes differ from fixture');
      const knownZip = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
      await toolbar.locator('button[aria-label="Download 3 shown files as ZIP"]').click();
      const zip = await waitForValue(
        async () => {
          const added = (await queryDownloads(extensionPage)).filter(({ id }) => !knownZip.has(id));
          return added.length === 1 && added[0]?.state === 'complete' ? added[0] : undefined;
        },
        'experience ZIP download',
        20_000
      );
      const zipRelative = relative(downloads, zip.filename);
      assert(zipRelative && !zipRelative.startsWith('..') && !isAbsolute(zipRelative));
      const expected = experienceImages.map((bytes, index) => ({
        filename: `experience_${EXPERIENCE_TWEET_ID}_${index}.jpg`,
        bytes,
      }));
      const zipBytes = await readFile(zip.filename);
      const verifiedZip = verifyStoredZip(zipBytes, expected);
      await page.keyboard.press('Escape');
      await gallery.waitFor({ state: 'detached' });
      return {
        initial,
        hidden,
        hiddenAfterPointer,
        focused,
        focusSteps,
        reachable,
        reverseFocus,
        selectAfterPointerAway,
        nativeSetting,
        newDocumentSetting,
        rediscovered,
        screenshots: {
          initial: 'experience-x02-toolbar-initial.png',
          idle: 'experience-x02-toolbar-idle.png',
          focused: 'experience-x02-toolbar-focused.png',
          pointer: 'experience-x02-toolbar-pointer.png',
        },
        downloads: { single: imageReceipt(singleBytes), zip: imageReceipt(zipBytes), verifiedZip },
      };
    });
    await phase('x05-player-isolation', async () => {
      const prior = await readStoredVideoSettings(extensionPage);
      const settings = createControlledVideoSettings(prior.value, Date.now());
      const gallerySettings: Record<string, unknown> = settings.gallery;
      delete gallerySettings.videoClickMode;
      gallerySettings.videoVolume = 0.27;
      gallerySettings.videoMuted = true;
      const transport = routes.armOwn12RapidBAudioVideo();
      try {
        await extensionPage.evaluate(async (value) => {
          await chrome.storage.local.set({ 'xeg-app-settings': value });
          await chrome.storage.local.remove('xeg-app-settings:field:gallery.videoClickMode');
          await chrome.storage.local.remove('xeg-app-settings:field:gallery.videoVolume');
          await chrome.storage.local.remove('xeg-app-settings:field:gallery.videoMuted');
        }, settings);
        const stored = await readStoredVideoSettings(extensionPage);
        assert.equal(storedVideoClickMode(stored.settings), null);
        assert.deepEqual(storedGalleryMediaPreferences(stored.settings), {
          volume: 0.27,
          muted: true,
        });
        await page.goto(`https://x.com/rapid_a/status/${RAPID_CLICK_A}`);
        await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
        const host = page.locator('[data-rapid="b"] video');
        await host.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => {
          const video = document.querySelector('[data-rapid="b"] video');
          return video instanceof HTMLVideoElement && video.readyState >= 2 && !video.error;
        });
        await page.mouse.click(10, 10);
        await host.evaluate(async (element) => {
          if (!(element instanceof HTMLVideoElement)) {
            throw new Error('B host video missing');
          }
          element.volume = 0.8;
          element.muted = false;
          element.currentTime = 1;
          await element.play();
        });
        await page.waitForFunction(() => {
          const video = document.querySelector('[data-rapid="b"] video');
          return video instanceof HTMLVideoElement && !video.paused && video.currentTime > 1.1;
        });
        const before = await hostVideoState(host);
        await host.click({ position: { x: 160, y: 55 } });
        const gallery = page.locator('[data-xeg-gallery-container]');
        await gallery.waitFor({ state: 'visible' });
        const hostAfterOpen = await hostVideoState(host);
        assert.equal(hostAfterOpen.paused, true);
        const fresh = gallery.locator('[data-gallery-element="item"][data-index="1"] video');
        await fresh.waitFor({ state: 'visible' });
        const galleryInitial = await hostVideoState(fresh);
        assert.equal(galleryInitial.paused, true);
        assert(galleryInitial.currentTime <= 0.1);
        assert.equal(galleryInitial.muted, true);
        assert(Math.abs(galleryInitial.volume - 0.27) < 0.01);
        assert.equal(galleryInitial.error, null);
        await fresh.click();
        await page.waitForFunction(() => {
          const video = document.querySelector(
            '[data-xeg-gallery-container] [data-gallery-element="item"][data-index="1"] video'
          );
          return video instanceof HTMLVideoElement && !video.paused && video.currentTime > 0.1;
        });
        const galleryPlaying = await hostVideoState(fresh);
        await page.setViewportSize({ width: 401, height: 592 });
        await fresh.scrollIntoViewIfNeeded();
        await page.evaluate(() => {
          const items = document.querySelector<HTMLElement>('[data-gallery-element="items"]');
          const video = document.querySelector<HTMLElement>(
            '[data-xeg-gallery-container] [data-gallery-element="item"][data-index="1"] video'
          );
          if (!items || !video) {
            throw new Error('Narrow native video geometry is unavailable');
          }
          items.scrollTop +=
            video.getBoundingClientRect().bottom - items.getBoundingClientRect().bottom + 8;
        });
        await page.evaluate(
          () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
        );
        const narrowVideo = await fresh.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = Math.min(rect.bottom - 16, innerHeight - 8);
          const items = element.closest('[data-gallery-element="items"]');
          return {
            rect: rect.toJSON(),
            items: items?.getBoundingClientRect().toJSON(),
            mask: items ? getComputedStyle(items).maskImage : null,
            controlPoint: { x, y },
            controlHit: document.elementFromPoint(x, y) === element,
            viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
          };
        });
        await page.mouse.move(narrowVideo.controlPoint.x, narrowVideo.controlPoint.y);
        await page.waitForTimeout(200);
        const nativeControlHit = await fresh.evaluate(
          (element, point) => document.elementFromPoint(point.x, point.y) === element,
          narrowVideo.controlPoint
        );
        await page.screenshot({ path: join(output, 'experience-x06-video-native-near-fade.png') });
        assert.equal(nativeControlHit, true, 'Narrow native video control area is blocked');
        await page.setViewportSize({ width: 1280, height: 800 });
        await gallery
          .locator('[data-gallery-element="toolbar"] button[aria-label="Close"]')
          .click();
        await gallery.waitFor({ state: 'detached' });
        const hostAfterClose = await hostVideoState(host);
        assert.equal(hostAfterClose.paused, true);
        assert(Math.abs(hostAfterClose.currentTime - hostAfterOpen.currentTime) < 0.1);
        await page.screenshot({ path: join(output, 'experience-x05-host-after-close.png') });
        return {
          transport,
          stored: { mode: null, volume: 0.27, muted: true },
          before,
          hostAfterOpen,
          galleryInitial,
          galleryPlaying,
          narrowVideo: {
            ...narrowVideo,
            nativeControlHit,
            screenshot: 'experience-x06-video-native-near-fade.png',
          },
          hostAfterClose,
        };
      } finally {
        routes.clearOwn12RapidBAudioVideo();
        assert.equal(await restoreStoredVideoSettings(extensionPage, prior), true);
      }
    });
    await phase('x05-native-video', async () =>
      runOwn12NativeControls({
        apiResponses: routes.apiResponses,
        compactApiResponses: routes.compactApiResponses,
        context,
        extensionPage,
        fixtureRoutes: routes,
        output,
        qualityApiResponses: routes.qualityApiResponses,
        quotedApiResponses: routes.quotedApiResponses,
      })
    );
    await phase('x06-layout', async (partial) => {
      await page.setViewportSize({ width: 401, height: 592 });
      await page.goto(EXPERIENCE_FIXTURE_URL);
      await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
      await page.locator('[data-testid="tweetPhoto"] img').first().click();
      const gallery = page.locator('[data-xeg-gallery-container]');
      await gallery.waitFor({ state: 'visible' });
      const toolbar = gallery.locator('[data-gallery-element="toolbar"]');
      const cases: unknown[] = [];
      partial.cases = cases;
      for (let index = 0; index < EXPERIENCE_IMAGES.length; index++) {
        if (index) {
          await page.keyboard.press('ArrowRight');
        }
        for (const fit of ['Fit Width', 'Fit Height', 'Fit Window', 'Original']) {
          const button = toolbar.locator(`button[aria-label="${fit}"]`);
          await button.click();
          assert.equal(await button.getAttribute('aria-pressed'), 'true');
          const geometry = await waitForValue(
            async () => {
              const measured = await experienceSelectedGeometry(page);
              partial.lastGeometry = { shape: EXPERIENCE_IMAGES[index]?.label, fit, ...measured };
              return measured.media &&
                measured.toolbar &&
                measured.media.top >= measured.toolbar.bottom + 4
                ? measured
                : undefined;
            },
            `${EXPERIENCE_IMAGES[index]?.label} ${fit} media below toolbar`,
            5_000
          );
          assert.equal(geometry.current, String(index), 'Fit action changed the selected item');
          assert.equal(geometry.focused, String(index), 'Fit action changed the focused item');
          assert.equal(geometry.activeFit, fit);
          assert(
            geometry.items &&
              Math.abs(
                Number.parseFloat(geometry.items.paddingBlockStart ?? '') -
                  Number.parseFloat(geometry.items.clearance ?? '')
              ) < 1 &&
              Math.abs(
                Number.parseFloat(geometry.items.scrollPaddingBlockStart ?? '') -
                  Number.parseFloat(geometry.items.clearance ?? '')
              ) < 1,
            `${EXPERIENCE_IMAGES[index]?.label} ${fit}: responsive padding lost toolbar clearance`
          );
          cases.push({ shape: EXPERIENCE_IMAGES[index]?.label, fit, geometry });
          if (fit === 'Fit Window') {
            const controls = await experienceControlGeometry(toolbar);
            const screenshot = `experience-x06-narrow-${EXPERIENCE_IMAGES[index]?.label.toLowerCase()}.png`;
            await page.screenshot({
              path: join(output, screenshot),
            });
            assert(
              controls.controls.every(
                ({ rect, hit, withinViewport }) =>
                  rect.width >= 44 && rect.height >= 44 && hit && withinViewport
              ),
              `${EXPERIENCE_IMAGES[index]?.label}: narrow toolbar control is clipped or blocked`
            );
            cases.push({ shape: EXPERIENCE_IMAGES[index]?.label, fit, controls, screenshot });
          }
        }
      }
      const touchTargets = await toolbar.locator('button').evaluateAll((buttons) =>
        buttons
          .filter((button) => !button.hasAttribute('disabled'))
          .map((button) => {
            const rect = button.getBoundingClientRect();
            return {
              label: button.getAttribute('aria-label'),
              width: rect.width,
              height: rect.height,
            };
          })
      );
      assert(touchTargets.every(({ width, height }) => width >= 44 && height >= 44));
      await toolbar.locator('#tweet-text-button').click();
      const tweetPanel = gallery.locator('[data-gallery-element="tweet-panel"]');
      await tweetPanel.waitFor({ state: 'visible' });
      const caption = await tweetPanel.textContent();
      assert(caption?.includes('日本語の説明') && caption.includes('길게 이어지는 문장'));
      const tweetPanelScroll = await tweetPanel.evaluate((element) => {
        const before = element.scrollTop;
        element.scrollTop = element.scrollHeight;
        return { before, after: element.scrollTop, overflow: getComputedStyle(element).overflowY };
      });
      await toolbar.locator('#tweet-text-button').click();
      await toolbar.locator('#settings-button').click();
      const settingsPanel = gallery.locator('[data-gallery-element="settings-panel"]');
      await settingsPanel.waitFor({ state: 'visible' });
      const settingsPanelScroll = await settingsPanel.evaluate((element) => {
        const before = element.scrollTop;
        element.scrollTop = element.scrollHeight;
        return { before, after: element.scrollTop, overflow: getComputedStyle(element).overflowY };
      });
      await toolbar.locator('#settings-button').click();
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForFunction(() => {
        const toolbar = document.querySelector<HTMLElement>('[data-gallery-element="toolbar"]');
        const current = toolbar?.getAttribute('data-current-index');
        const focused = toolbar?.getAttribute('data-focused-index');
        const media = document.querySelector<HTMLElement>(
          `[data-gallery-element="item"][data-index="${current}"] img`
        );
        return (
          current === '2' &&
          focused === '2' &&
          media &&
          toolbar &&
          media.getBoundingClientRect().top >= toolbar.getBoundingClientRect().bottom + 4
        );
      });
      await page.keyboard.press('ArrowLeft');
      await toolbar.locator('button[aria-label="Fit Window"]').click();
      const desktopBeforeZoom = await experienceControlGeometry(toolbar);
      const beforeZoom = await fixtureTabZoom(
        context,
        extensionId,
        page,
        null,
        null,
        EXPERIENCE_FIXTURE_URL
      );
      let zoomed: unknown;
      let desktopAtZoom: Awaited<ReturnType<typeof experienceControlGeometry>> | undefined;
      let screenshotPixels: { width: number; height: number } | undefined;
      try {
        zoomed = await fixtureTabZoom(context, extensionId, page, 2, null, EXPERIENCE_FIXTURE_URL);
        assert.equal((zoomed as { observed: number }).observed, 2);
        await page.waitForFunction(
          (previous) => innerWidth < previous,
          desktopBeforeZoom.innerWidth
        );
        desktopAtZoom = await experienceControlGeometry(toolbar);
        const cdp = await context.newCDPSession(page);
        try {
          const capture = await cdp.send('Page.captureScreenshot', {
            format: 'png',
            fromSurface: true,
            captureBeyondViewport: false,
          });
          const png = Buffer.from(capture.data, 'base64');
          screenshotPixels = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
          await writeFile(join(output, 'experience-x06-zoom200.png'), png);
        } finally {
          await cdp.detach();
        }
        assert(
          desktopAtZoom.controls.every(
            ({ rect, hit, withinViewport }) =>
              rect.width >= 44 && rect.height >= 44 && hit && withinViewport
          ),
          'Actual 200% desktop zoom clipped or blocked a toolbar control'
        );
      } finally {
        await fixtureTabZoom(
          context,
          extensionId,
          page,
          beforeZoom.previous,
          beforeZoom.settings,
          EXPERIENCE_FIXTURE_URL
        );
      }
      await page.keyboard.press('Escape');
      await gallery.waitFor({ state: 'detached' });
      return {
        cases,
        touchTargets,
        tweetPanelScroll,
        settingsPanelScroll,
        desktopBeforeZoom,
        beforeZoom,
        zoomed,
        desktopAtZoom,
        screenshotPixels,
      };
    });
  } finally {
    for (const [name, close] of [
      ['fixture page', () => page.close()],
      ['extension page', () => extensionPage.close()],
      ['fixture routes', () => routes.remove()],
    ] as const) {
      try {
        await close();
      } catch (error) {
        cleanupErrors.push(`${name}: ${safeError(error)}`);
      }
    }
    await writeFile(
      join(output, 'gallery-experience.json'),
      JSON.stringify(
        {
          status:
            Object.values(phases).every(({ status }) => status === 'passed') &&
            !pageErrors.length &&
            !cleanupErrors.length
              ? 'passed'
              : 'failed',
          scope:
            'installed extension with owned deterministic X fixtures; no live X or human study',
          phases,
          pageErrors,
          cleanupErrors,
        },
        null,
        2
      )
    );
  }
  assert(
    Object.values(phases).every(({ status }) => status === 'passed'),
    'Gallery experience phase failed'
  );
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(cleanupErrors, []);
  return { status: 'passed', phases };
}

/** Issue #381: a short installed-extension comparison at the real click/API boundary. */
async function runOpeningFeedbackProbe({
  context,
  downloads,
  extensionId,
  nativeLoopback,
  output,
  root,
  images,
  displayImages,
}: {
  context: BrowserContext;
  downloads: string;
  extensionId: string;
  nativeLoopback: NativeLoopback;
  output: string;
  root: string;
  images: ImageFixtures;
  displayImages: ImageFixtures;
}) {
  const observations: Record<string, unknown> = {};
  const pageFetches: PageFetch[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const fixtureRoutes = await installFixtureRoutes(context, root, images, displayImages);
  nativeLoopback.setPayloads(images, fixtureRoutes.videoPayloads);
  const extensionPage = await context.newPage();
  const page = await context.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('request', (request) => {
    if (!['fetch', 'xhr'].includes(request.resourceType())) {
      return;
    }
    const url = new URL(request.url());
    if (!['pbs.twimg.com', 'video.twimg.com'].includes(url.hostname)) {
      return;
    }
    assert(pageFetches.length < 128, 'Opening fixture page fetch observation overflow');
    pageFetches.push({
      host: url.hostname,
      path: url.pathname,
      resourceType: request.resourceType(),
    });
  });
  let primaryError: unknown;
  let result: Record<string, unknown> | undefined;
  const cleanupErrors: unknown[] = [];
  try {
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    const fastCases: unknown[] = [];
    await page.goto(`https://x.com/rapid_a/status/${RAPID_CLICK_A}`);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    const fastTrigger = page.locator('[data-rapid="b"] video');
    for (const name of ['healthy', 'repeat'] as const) {
      const requestStart = fixtureRoutes.quotedApiResponses.length;
      await beginOpeningTimeline(page, '[data-rapid="b"] video');
      const startedAt = performance.now();
      await fastTrigger.click();
      const opened = await assertQuotedGallery(page, {
        name: `fast-${name}`,
        expectedPosition: 2,
        expectedTotal: 2,
        owner: RAPID_CLICK_B,
        media: 'quote-two',
      });
      const elapsedMs = performance.now() - startedAt;
      const terminal = await captureOpeningFeedback(page, output, `fast-${name}-terminal`);
      const timeline = await endOpeningTimeline(page);
      assert.equal(timeline.clicks.length, 1, `fast ${name}: one trusted click required`);
      assert.deepEqual(timeline.shown, [], `fast ${name}: no delayed status should flash`);
      assertOpeningAbsent(terminal, `fast ${name} terminal`);
      assert(elapsedMs < 500, `fast ${name}: fixture opened beyond the 500 ms delay`);
      const requests = fixtureRoutes.quotedApiResponses.slice(requestStart);
      assert(requests.every(({ tweetId }) => tweetId === RAPID_CLICK_B));
      fastCases.push({
        name,
        elapsedMs,
        terminal,
        timeline,
        requests,
        selected: opened.selectedMedia,
      });
      await page.keyboard.press('Escape');
      await opened.gallery.waitFor({ state: 'detached' });
    }
    observations.fastCases = fastCases;
    observations.lateSuccess = await runRapidVideoClicks({
      context,
      downloads,
      extensionId,
      extensionPage,
      fixtureRoutes,
      nativeLoopback,
      openingProbe: true,
      output,
      page,
      pageFetches,
    });
    observations.lateFailure = await runRapidVideoClicks({
      context,
      downloads,
      extensionId,
      extensionPage,
      fixtureRoutes,
      lateAFailure: true,
      nativeLoopback,
      openingProbe: true,
      output,
      page,
      pageFetches,
      skipDownload: true,
    });
    observations.delayedFailureAndNavigation = await runDelayedVideoFailures({
      context,
      extensionId,
      extensionPage,
      fixtureRoutes,
      openingProbe: true,
      output,
      page,
    });
    assert.deepEqual(pageErrors, [], 'Opening probe page errors');
    observations.runtime = { pageErrors, consoleErrors, pageFetches };
    result = {
      status: 'passed',
      scope:
        'installed Edge/Chrome extension with deterministic X fixture and actual provider routes',
      ...observations,
    };
  } catch (error) {
    primaryError = error;
    await page.screenshot({ path: join(output, 'opening-failure.png') }).catch(() => {});
    throw error;
  } finally {
    for (const [label, close] of [
      ['fixture routes', () => fixtureRoutes.remove()],
      ['fixture page', () => page.close()],
      ['extension page', () => extensionPage.close()],
    ] as const) {
      try {
        await close();
      } catch (error) {
        cleanupErrors.push(new Error(`${label}: ${safeError(error)}`));
      }
    }
    await writeFile(
      join(output, 'opening-feedback.json'),
      JSON.stringify(
        {
          status: primaryError || cleanupErrors.length ? 'failed' : 'passed',
          observations,
          pageErrors,
          consoleErrors,
          cleanupErrors: cleanupErrors.map(safeError),
          error: primaryError ? safeError(primaryError) : null,
        },
        null,
        2
      )
    );
  }
  if (cleanupErrors.length) {
    throw new AggregateError(cleanupErrors, 'Opening probe cleanup failed');
  }
  assert(result, 'Opening probe did not complete');
  return result;
}

async function exerciseInstalledExtension(
  context: BrowserContext,
  extensionId: string,
  root: string,
  output: string,
  downloads: string,
  images: ImageFixtures,
  displayImages: ImageFixtures,
  browserCdp: CDPSession,
  nativeLoopback: NativeLoopback
) {
  const pageErrors: string[] = [];
  const consoleErrors: ConsoleErrorRecord[] = [];
  const failedRequests: Array<{ error: string | undefined; host: string; path: string }> = [];
  const pageFetches: PageFetch[] = [];
  const cycles: Array<Awaited<ReturnType<typeof runCycle>>> = [];
  const quotedVideoCycles: unknown[] = [];
  let svgTargetMatrix: AcceptanceReceipt = { status: 'pending' };
  let blockAllDirectVideo: AcceptanceReceipt = { status: 'pending' };
  let directVideoAllowedModes: AcceptanceReceipt = { status: 'pending' };
  let own12NativeControls: Own12NativeControlsEvidence | AcceptanceReceipt = { status: 'pending' };
  let delayedVideoFailures: AcceptanceReceipt = { status: 'pending' };
  let rapidVideoClicks: AcceptanceReceipt = { status: 'pending' };
  const creditControls = {
    status: 'pending',
    steps: [] as Record<string, unknown>[],
    controlledSetting: {} as ControlledSettingEvidence,
    cleanup: { galleryClosed: false },
    error: undefined as string | undefined,
  };
  let modelessRenderRecovery: AcceptanceReceipt = { status: 'pending' };
  const acceptanceFailures: unknown[] = [];
  const unavailableSequence: UnavailableEvidence & {
    controlledSetting?: ControlledSettingEvidence;
    error?: string;
    api?: ApiRecord[];
    screenshotError?: string;
  } = { status: 'pending', steps: [] };
  const contextLoss: ContextLossEvidence = {
    status: 'pending',
    setting: {},
    cleanup: {
      oldPageClosed: false,
      freshPageClosed: false,
      hookReleasedOrContextClosed: false,
      observerRestored: false,
      errors: [],
    },
  };
  let fixtureVideoAssets: Record<string, { bytes: number; sha256: string }> | undefined;
  let mv3RestartCancellation: Mv3RestartEvidence = {
    source: {
      bytes: MV3_RESTART_BLOB_BYTES,
      mimeType: 'application/octet-stream',
      productionMessageType: 'DOWNLOAD_BLOB_URL_REQUEST',
    },
    cleanup: {},
  };
  const directRestart: DirectRestartEvidence = { status: 'pending', cleanup: {} };
  const trustedDownloadInput: TrustedDownloadInputEvidence = {
    status: 'pending',
    syntheticInputs: [],
    cleanup: {},
  };
  const downloadMemory: MemoryEvidence = {
    status: 'pending',
    cleanup: {},
    requests: [],
    downloads: [],
  };
  const sourceQuality: SourceQualityEvidence = { status: 'pending', sources: [], requests: [] };
  const sourceImageFailures: SourceImageFailureEvidence = { status: 'pending', cases: [] };
  const originalAvailability: OriginalAvailabilityEvidence = {
    status: 'pending',
    cases: [],
    expectedConsoleErrors: [],
  };
  const compactQuotePhoto: CompactEvidence = { status: 'pending', api: [], images: [], steps: [] };
  let apiReuse: unknown = { status: 'pending' };
  let capacityNotification: unknown = { status: 'pending' };
  let videoLoading: unknown = { status: 'pending' };
  let nativeRedirect: unknown = { status: 'pending' };
  const flowCleanup: FlowCleanup = {};
  const cleanupErrors: unknown[] = [];
  let fixtureRoutes: Awaited<ReturnType<typeof installFixtureRoutes>> | undefined;
  let extensionPage: Page | undefined;
  let page: Page | undefined;
  let workerObserver: WorkerObserver | undefined;
  let packagingAssets: Awaited<ReturnType<typeof verifyPackagedIcons>> | undefined;
  let notification: Awaited<ReturnType<typeof verifyDefaultNotification>> | undefined;
  let publicDom: Awaited<ReturnType<typeof runPublicFixtureCycle>> | undefined;
  let videoClickConfiguration:
    | { storagePresent: boolean; storedMode: string | null; effectiveMode: string }
    | undefined;
  let zoomSpanish: unknown;
  let flowResult: Record<string, unknown> | undefined;
  let primaryError: unknown;
  let primarySeen = false;
  let observationError: unknown;
  let observationErrorSeen = false;
  try {
    const compactImages = await createCompactImages(context);
    fixtureRoutes = await installFixtureRoutes(context, root, images, displayImages, compactImages);
    fixtureVideoAssets = Object.fromEntries(
      Object.entries(fixtureRoutes.videoPayloads).map(([name, bytes]) => [
        name,
        { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') },
      ])
    );
    nativeLoopback.setPayloads(images, fixtureRoutes.videoPayloads);
    nativeLoopback.setCompactImage(compactImages.original);
    extensionPage = await context.newPage();
    page = await context.newPage();
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push({ location: message.location().url, text: message.text() });
      }
    });
    page.on('requestfailed', (request) => {
      const url = new URL(request.url());
      failedRequests.push({
        error: request.failure()?.errorText,
        host: url.hostname,
        path: url.pathname,
      });
    });
    page.on('request', (request) => {
      if (!['fetch', 'xhr'].includes(request.resourceType())) {
        return;
      }
      const url = new URL(request.url());
      if (!['pbs.twimg.com', 'video.twimg.com'].includes(url.hostname)) {
        return;
      }
      assert(pageFetches.length < 128, 'Fixture page media fetch observation overflow');
      pageFetches.push({
        host: url.hostname,
        path: url.pathname,
        resourceType: request.resourceType(),
      });
    });
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    const pageCdp = await context.newCDPSession(extensionPage);
    workerObserver = await createServiceWorkerObserver(browserCdp, pageCdp);
    assert.equal(
      await extensionPage.evaluate(() => chrome.runtime.getManifest().name),
      'X.com Enhanced Gallery'
    );
    packagingAssets = await verifyPackagedIcons(extensionPage);
    await page.goto(FIXTURE_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
      state: 'attached',
      timeout: 15_000,
    });
    const installedSetting = await readStoredVideoSettings(extensionPage);
    const installedMode = storedVideoClickMode(installedSetting.settings);
    videoClickConfiguration = {
      storagePresent: installedSetting.exists,
      storedMode: installedMode,
      effectiveMode: installedMode ?? 'block-controls-only',
    };
    assert.equal(
      videoClickConfiguration.effectiveMode,
      'block-controls-only',
      'Installed profile must use the configured noncontrol video click mode'
    );
    const preparationFailures: Mv3RestartEvidence[] = [];
    for (let preparation = 0; preparation < 3; preparation += 1) {
      const attempt: Mv3RestartEvidence = {
        source: {
          bytes: MV3_RESTART_BLOB_BYTES,
          mimeType: 'application/octet-stream',
          productionMessageType: 'DOWNLOAD_BLOB_URL_REQUEST',
        },
        cleanup: {},
        preparationFailures,
      };
      mv3RestartCancellation = attempt;
      try {
        await verifyMv3RestartCancellation({
          downloads,
          evidence: attempt,
          extensionId,
          extensionPage,
          page,
          workerObserver,
        });
        break;
      } catch (error) {
        attempt.status = 'failed';
        attempt.error ??= safeError(error);
        if (preparation === 2 || !canRetryMv3PausePreparation(attempt, error)) {
          throw error;
        }
        // The old attempt owns its cleanup; retain it before creating another
        // request. Restart/cancellation assertions are never retried.
        const archived = { ...attempt };
        delete archived.preparationFailures;
        preparationFailures.push(structuredClone(archived));
      }
    }
    await verifyDirectRestartCancellation({
      downloads,
      extensionId,
      extensionPage,
      page,
      workerObserver,
      nativeLoopback,
      images,
      pageFetches,
      output,
      evidence: directRestart,
    });
    await verifyTrustedDownloadInput({
      context,
      downloads,
      extensionId,
      extensionPage,
      page,
      evidence: trustedDownloadInput,
      nativeLoopback,
      images,
      pageFetches,
    });
    await runDownloadMemoryCycle({
      consoleErrors,
      downloads,
      extensionPage,
      images,
      output,
      page,
      root,
      evidence: downloadMemory,
      nativeLoopback,
      pageFetches,
    });
    notification = await verifyDefaultNotification(extensionPage);
    for (const cycle of CYCLES) {
      cycles.push(
        await runCycle({
          cycle,
          downloads,
          extensionPage,
          output,
          page,
          images,
          displayImages,
          qualityRequests: fixtureRoutes.qualityRequests,
          nativeLoopback,
          pageFetches,
        })
      );
    }
    try {
      await runSourceQualityCycle({
        downloads,
        extensionPage,
        images,
        displayImages,
        output,
        page,
        qualityApiResponses: fixtureRoutes.qualityApiResponses,
        qualityRequests: fixtureRoutes.qualityRequests,
        evidence: sourceQuality,
        nativeLoopback,
        pageFetches,
      });
    } catch (error) {
      sourceQuality.status = 'failed';
      sourceQuality.error = safeError(error);
      sourceQuality.api = fixtureRoutes.qualityApiResponses;
      sourceQuality.requests = fixtureRoutes.qualityRequests;
      await page
        .screenshot({ path: join(output, 'source-quality-failure.png') })
        .then(() => {
          sourceQuality.failureScreenshot = 'source-quality-failure.png';
        })
        .catch((screenshotError) => {
          sourceQuality.screenshotError = safeError(screenshotError);
        });
      throw error;
    }
    await runSourceImageFailureCases({
      context,
      evidence: sourceImageFailures,
      extensionPage,
      images,
      output,
      qualityApiResponses: fixtureRoutes.qualityApiResponses,
      qualityRequests: fixtureRoutes.qualityRequests,
    });
    await runOriginalAvailabilityCycles({
      consoleErrors,
      downloads,
      evidence: originalAvailability,
      extensionPage,
      images,
      nativeLoopback,
      output,
      page,
      pageFetches,
    });
    await page.goto(FIXTURE_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    try {
      zoomSpanish = await runZoomSpanishCycle({
        context,
        downloads,
        extensionId,
        extensionPage,
        images,
        output,
        page,
        nativeLoopback,
        pageFetches,
      });
    } catch (error) {
      zoomSpanish = { status: 'failed', error: safeError(error) };
      throw error;
    }
    publicDom = await runPublicFixtureCycle({
      apiResponses: fixtureRoutes.apiResponses,
      output,
      page,
    });
    try {
      await runCompactQuotePhotoCycle({
        page,
        extensionPage,
        downloads,
        images,
        compactImages,
        nativeLoopback,
        pageFetches,
        compactApiResponses: fixtureRoutes.compactApiResponses,
        compactImageRequests: fixtureRoutes.compactImageRequests,
        evidence: compactQuotePhoto,
      });
    } catch (error) {
      compactQuotePhoto.status = 'failed';
      compactQuotePhoto.error = safeError(error);
      compactQuotePhoto.api = fixtureRoutes.compactApiResponses;
      compactQuotePhoto.images = fixtureRoutes.compactImageRequests;
      await page
        .screenshot({ path: join(output, 'compact-quote-photo-failure.png') })
        .then(() => {
          compactQuotePhoto.failureScreenshot = 'compact-quote-photo-failure.png';
        })
        .catch((screenshotError) => {
          compactQuotePhoto.screenshotError = safeError(screenshotError);
        });
      throw error;
    }
    for (const quotedCase of QUOTED_CASES) {
      const settingEvidence: ControlledSettingEvidence = {};
      const artifactName =
        quotedCase.name === 'unmarked-no-outer' ? 'own01-no-outer' : `quoted-${quotedCase.name}`;
      const checkpointName =
        quotedCase.name === 'unmarked-no-outer' ? 'own01-no-outer' : quotedCase.name;
      try {
        quotedVideoCycles.push(
          quotedCase.name === 'public-preplayer'
            ? await runPublicPreplayerCycle({
                quotedCase: PUBLIC_PREPLAYER_CASE,
                quotedApiResponses: fixtureRoutes.quotedApiResponses,
                apiResponses: fixtureRoutes.apiResponses,
                downloads,
                extensionPage,
                output,
                page,
                videoPayloads: fixtureRoutes.videoPayloads,
                settingEvidence,
                nativeLoopback,
                pageFetches,
              })
            : await runQuotedVideoCycle({
                quotedCase,
                quotedApiResponses: fixtureRoutes.quotedApiResponses,
                downloads,
                extensionPage,
                output,
                page,
                videoPayloads: fixtureRoutes.videoPayloads,
                nativeLoopback,
                pageFetches,
              })
        );
      } catch (error) {
        const diagnostic: AcceptanceReceipt & {
          name: string;
          api: ApiRecord[];
          screenshot: string;
          controlledSetting?: ControlledSettingEvidence;
          snapshot?: unknown;
          screenshotError?: string;
        } = {
          name: quotedCase.name,
          status: 'failed',
          error: safeError(error),
          ...(quotedCase.name === 'public-preplayer' ? { controlledSetting: settingEvidence } : {}),
          api: fixtureRoutes.quotedApiResponses.filter(
            ({ tweetId }) => tweetId === quotedCase.outer || tweetId === quotedCase.owner
          ),
          screenshot: `${artifactName}-failure.png`,
        };
        await attachVideoBoundaryFailure(diagnostic, {
          output,
          name: `${checkpointName}-failure`,
          page,
          api: diagnostic.api,
        });
        const [snapshot, screenshot] = await Promise.allSettled([
          page.evaluate(() => {
            const gallery = document.querySelector('[data-xeg-gallery-container]');
            const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
            const counter = toolbar?.querySelector('#xeg-toolbar-counter');
            return {
              url: location.href,
              activeTag: document.activeElement?.tagName ?? null,
              bodyVideoError: document.body.dataset.videoError ?? null,
              bodyVideoReady: document.body.dataset.videoReady ?? null,
              galleryPresent: gallery !== null,
              position: counter?.getAttribute('data-position') ?? null,
              total: counter?.getAttribute('data-total') ?? null,
              currentIndex: toolbar?.getAttribute('data-current-index') ?? null,
              focusedIndex: toolbar?.getAttribute('data-focused-index') ?? null,
              items: [...(gallery?.querySelectorAll('[data-gallery-element="item"]') ?? [])].map(
                (item) => {
                  const media = item.querySelector('video, img');
                  return {
                    index: item.getAttribute('data-index'),
                    loaded: item.getAttribute('data-media-loaded'),
                    source:
                      media instanceof HTMLMediaElement || media instanceof HTMLImageElement
                        ? media.currentSrc || media.src || null
                        : null,
                    mediaError:
                      media instanceof HTMLVideoElement ? (media.error?.code ?? null) : null,
                    readyState: media instanceof HTMLVideoElement ? media.readyState : null,
                  };
                }
              ),
            };
          }),
          page.screenshot({ path: join(output, diagnostic.screenshot) }),
        ]);
        diagnostic.snapshot =
          snapshot.status === 'fulfilled' ? snapshot.value : { error: safeError(snapshot.reason) };
        if (screenshot.status === 'rejected') {
          diagnostic.screenshotError = safeError(screenshot.reason);
        }
        quotedVideoCycles.push(diagnostic);
        await writeFile(
          join(output, `${artifactName}-failure.json`),
          JSON.stringify(diagnostic, null, 2)
        ).catch(() => {});
        acceptanceFailures.push(error);
      }
    }
    try {
      await runCreditControlsCycle({
        page,
        extensionPage,
        quotedApiResponses: fixtureRoutes.quotedApiResponses,
        apiResponses: fixtureRoutes.apiResponses,
        compactApiResponses: fixtureRoutes.compactApiResponses,
        qualityApiResponses: fixtureRoutes.qualityApiResponses,
        evidence: creditControls,
      });
    } catch (error) {
      creditControls.status = 'failed';
      creditControls.error = safeError(error);
      acceptanceFailures.push(error);
    } finally {
      try {
        const gallery = page.locator('[data-xeg-gallery-container]');
        if (await gallery.isVisible()) {
          await gallery
            .locator('[data-gallery-element="toolbar"] button[aria-label="Close"]')
            .click();
          await gallery.waitFor({ state: 'detached' });
        }
        creditControls.cleanup.galleryClosed = true;
      } catch (error) {
        creditControls.status = 'failed';
        acceptanceFailures.push(error);
      }
      await writeFile(
        join(output, 'own14-credit-controls-observations.json'),
        JSON.stringify(creditControls, null, 2)
      );
    }
    try {
      svgTargetMatrix = await runSvgTargetMatrix({
        extensionPage,
        output,
        page,
        quotedApiResponses: fixtureRoutes.quotedApiResponses,
      });
    } catch (error) {
      svgTargetMatrix = { status: 'failed', error: safeError(error) };
      await attachVideoBoundaryFailure(svgTargetMatrix, {
        output,
        name: 'svg-targets-failure',
        page,
        api: fixtureRoutes.quotedApiResponses,
      });
      await page
        .screenshot({ path: join(output, 'quoted-svg-targets-failure.png') })
        .catch(() => {});
      acceptanceFailures.push(error);
    }
    try {
      blockAllDirectVideo = await runBlockAllDirectVideo({
        extensionPage,
        output,
        page,
        quotedApiResponses: fixtureRoutes.quotedApiResponses,
      });
    } catch (error) {
      blockAllDirectVideo = { status: 'failed', error: safeError(error) };
      await attachVideoBoundaryFailure(blockAllDirectVideo, {
        output,
        name: 'unmarked-block-all-failure',
        page,
        api: fixtureRoutes.quotedApiResponses,
      });
      await page
        .screenshot({ path: join(output, 'quoted-unmarked-block-all-failure.png') })
        .catch(() => {});
      acceptanceFailures.push(error);
    }
    try {
      directVideoAllowedModes = await runDirectVideoAllowedModes({
        extensionPage,
        output,
        page,
        quotedApiResponses: fixtureRoutes.quotedApiResponses,
      });
    } catch (error) {
      directVideoAllowedModes = { status: 'failed', error: safeError(error) };
      await attachVideoBoundaryFailure(directVideoAllowedModes, {
        output,
        name: 'unmarked-modes-failure',
        page,
        api: fixtureRoutes.quotedApiResponses,
      });
      await page
        .screenshot({ path: join(output, 'quoted-unmarked-modes-failure.png') })
        .catch(() => {});
      acceptanceFailures.push(error);
    }
    try {
      own12NativeControls = await runOwn12NativeControls({
        apiResponses: fixtureRoutes.apiResponses,
        compactApiResponses: fixtureRoutes.compactApiResponses,
        context,
        extensionPage,
        fixtureRoutes,
        output,
        qualityApiResponses: fixtureRoutes.qualityApiResponses,
        quotedApiResponses: fixtureRoutes.quotedApiResponses,
      });
    } catch (error) {
      own12NativeControls = { status: 'failed', error: safeError(error) };
      acceptanceFailures.push(error);
    }
    try {
      delayedVideoFailures = await runDelayedVideoFailures({
        context,
        extensionId,
        extensionPage,
        fixtureRoutes,
        output,
        page,
      });
    } catch (error) {
      delayedVideoFailures = {
        status: 'failed',
        error: safeError(error),
        api: fixtureRoutes.quotedApiResponses.filter(
          ({ tweetId }) => tweetId === DELAYED_FAILURE_ID || tweetId === DELAYED_NAVIGATION_ID
        ),
      };
      assert(delayedVideoFailures.api);
      await attachVideoBoundaryFailure(delayedVideoFailures, {
        output,
        name: 'delayed-failure',
        page,
        api: delayedVideoFailures.api,
      });
      await page.screenshot({ path: join(output, 'quoted-delayed-failure.png') }).catch(() => {});
      acceptanceFailures.push(error);
    }
    try {
      rapidVideoClicks = await runRapidVideoClicks({
        context,
        downloads,
        extensionId,
        extensionPage,
        fixtureRoutes,
        nativeLoopback,
        output,
        page,
        pageFetches,
      });
    } catch (error) {
      rapidVideoClicks = {
        status: 'failed',
        error: safeError(error),
        api: fixtureRoutes.quotedApiResponses.filter(
          ({ tweetId }) => tweetId === RAPID_CLICK_A || tweetId === RAPID_CLICK_B
        ),
      };
      assert(rapidVideoClicks.api);
      await attachVideoBoundaryFailure(rapidVideoClicks, {
        output,
        name: 'rapid-a-b-failure',
        page,
        api: rapidVideoClicks.api,
      });
      await page.screenshot({ path: join(output, 'quoted-rapid-a-b-failure.png') }).catch(() => {});
      acceptanceFailures.push(error);
    }
    try {
      modelessRenderRecovery = await runModelessRenderRecovery({
        consoleErrors,
        context,
        extensionId,
        output,
        page,
      });
    } catch (error) {
      modelessRenderRecovery = { status: 'failed', error: safeError(error) };
      await attachVideoBoundaryFailure(modelessRenderRecovery, {
        output,
        name: 'modeless-recovery-failure',
        page,
        api: fixtureRoutes.quotedApiResponses,
      });
      await page
        .screenshot({ path: join(output, 'quoted-modeless-recovery-failure.png') })
        .catch(() => {});
      acceptanceFailures.push(error);
    }
    if (acceptanceFailures.length) {
      throw new AggregateError(
        acceptanceFailures,
        'Installed quoted video routing, playback, or failure assertions failed'
      );
    }
    const unavailableSetting = {};
    try {
      await runUnavailableSequence({
        apiResponses: fixtureRoutes.apiResponses,
        extensionId,
        extensionPage,
        output,
        page,
        sequenceApiResponses: fixtureRoutes.unavailableApiResponses,
        getUnavailableApiOverflow: fixtureRoutes.getUnavailableApiOverflow,
        settingEvidence: unavailableSetting,
        evidence: unavailableSequence,
      });
      unavailableSequence.controlledSetting = unavailableSetting;
    } catch (error) {
      unavailableSequence.status = 'failed';
      unavailableSequence.error = safeError(error);
      unavailableSequence.controlledSetting = unavailableSetting;
      unavailableSequence.api = fixtureRoutes.unavailableApiResponses;
      await page
        .screenshot({ path: join(output, 'quoted-unavailable-sequence-failure.png') })
        .catch((screenshotError) => {
          unavailableSequence.screenshotError = safeError(screenshotError);
        });
      await writeFile(
        join(output, 'quoted-unavailable-sequence-failure.json'),
        JSON.stringify(unavailableSequence, null, 2)
      ).catch(() => {});
      throw error;
    }
    const followupFailures = [];
    try {
      await runInstalledContextLoss({
        context,
        extensionId,
        extensionPage,
        output,
        sequenceApiResponses: fixtureRoutes.unavailableApiResponses,
        evidence: contextLoss,
      });
    } catch (error) {
      followupFailures.push(error);
    }
    try {
      const genericMessage = unavailableSequence.steps[0]?.notification?.message;
      assert(genericMessage, 'Unavailable sequence generic notification is missing');
      const capacitySetting = {};
      capacityNotification = await runCapacityNotificationCase({
        extensionId,
        extensionPage,
        page,
        genericMessage,
        settingEvidence: capacitySetting,
      });
    } catch (error) {
      capacityNotification = { status: 'failed', error: safeError(error) };
      followupFailures.push(error);
    }
    try {
      apiReuse = await runInstalledMediaApiReuseProfile({
        context,
        page,
        qualityFixtureUrl: QUALITY_FIXTURE_URL,
        qualityTweetId: QUALITY_TWEET_ID,
        qualityImagePaths: QUALITY_IMAGE_PATHS,
        output,
        videoPayloads: fixtureRoutes.videoPayloads,
      });
    } catch (error) {
      apiReuse = { status: 'failed', error: safeError(error) };
      followupFailures.push(error);
    }
    try {
      videoLoading = await runVideoLoadingProfile({
        context,
        page,
        extensionPage,
        fixtureUrl: 'https://x.com/videofixture/status/4666000111222333444',
        tweetId: '4666000111222333444',
        videoPayloads: fixtureRoutes.videoPayloads,
        downloads,
        output,
        nativeLoopback,
        root,
      });
    } catch (error) {
      videoLoading = { status: 'failed', error: safeError(error) };
      followupFailures.push(error);
    }
    if (followupFailures.length) {
      throw new AggregateError(
        followupFailures,
        'Required installed media follow-up profiles failed'
      );
    }
    nativeRedirect = await runNativeRedirectDiagnostic(extensionPage, nativeLoopback, images);
    const expectedMemoryErrors = new Set(downloadMemory.expectedConsoleErrors ?? []);
    const expectedRenderFaultErrors = new Set(modelessRenderRecovery.expectedConsoleErrors ?? []);
    const expectedOriginalErrors = new Set(originalAvailability.expectedConsoleErrors);
    const unexpectedConsoleErrors = consoleErrors.filter(
      (record) =>
        !isExpectedFixtureApiConsoleError(record) &&
        !expectedMemoryErrors.has(record) &&
        !expectedOriginalErrors.has(record) &&
        !expectedRenderFaultErrors.has(record)
    );
    assert.deepEqual(pageErrors, [], 'Installed content script must not raise page errors');
    assert.deepEqual(
      unexpectedConsoleErrors,
      [],
      'Installed fixture must not log errors beyond its exact mocked API 403'
    );
    const nativeTransport = nativeLoopback.snapshot();
    assert.equal(
      nativeTransport.unexpectedCount,
      0,
      'Native fixture received an unallowlisted CDN request'
    );
    assert.equal(
      nativeTransport.overflow,
      false,
      'Native fixture exceeded its request or byte cap'
    );
    assert.equal(nativeTransport.serverError, false, 'Native fixture listener failed');
    assert.equal(nativeTransport.activeCount, 0, 'Native fixture retains an active response');
    assert(
      cycles.every(({ scroll }) => scroll.restored),
      'Every close must restore the saved scroll position'
    );
    flowResult = {
      cleanup: flowCleanup,
      cycles,
      pageErrors,
      consoleErrors,
      fixtureApiResponses: fixtureRoutes.apiResponses,
      sourceQuality,
      sourceImageFailures,
      originalAvailability,
      compactQuotePhoto,
      apiReuse,
      capacityNotification,
      videoLoading,
      sourceQualityApiResponses: fixtureRoutes.qualityApiResponses,
      sourceQualityRequests: fixtureRoutes.qualityRequests,
      mv3RestartCancellation,
      directRestart,
      trustedDownloadInput,
      downloadMemory,
      notification,
      nativeTransport,
      nativeRedirect,
      packagingAssets,
      publicDom,
      quotedVideoCycles,
      creditControls,
      svgTargetMatrix,
      blockAllDirectVideo,
      directVideoAllowedModes,
      own12NativeControls,
      delayedVideoFailures,
      rapidVideoClicks,
      modelessRenderRecovery,
      unavailableSequence,
      contextLoss,
      fixtureVideoAssets,
      videoClickConfiguration,
      zoomSpanish,
    };
  } catch (error) {
    primarySeen = true;
    primaryError = error;
    if (page) {
      await page.screenshot({ path: join(output, 'installed-flow-error.png') }).catch(() => {});
    }
  } finally {
    if (workerObserver) {
      try {
        await workerObserver.dispose();
        flowCleanup.workerObserverDisposed = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    const ownedPages: Array<[string, Page | undefined]> = [
      ['fixturePage', page],
      ['extensionPage', extensionPage],
    ];
    for (const [name, ownedPage] of ownedPages) {
      if (!ownedPage) {
        continue;
      }
      try {
        await ownedPage.close();
        if (name === 'fixturePage') {
          flowCleanup.fixturePageClosed = true;
        } else {
          flowCleanup.extensionPageClosed = true;
        }
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (fixtureRoutes) {
      try {
        await fixtureRoutes.remove();
        flowCleanup.fixtureRoutesRemoved = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    flowCleanup.errorCount = cleanupErrors.length;
    if (cleanupErrors.length) {
      flowCleanup.errors = cleanupErrors.map(safeError);
    }
    try {
      await writeFile(
        join(output, 'installed-flow-observations.json'),
        JSON.stringify(
          {
            cycles,
            pageErrors,
            consoleErrors,
            failedRequests,
            fixtureApiResponses: fixtureRoutes?.apiResponses ?? [],
            sourceQuality,
            sourceImageFailures,
            originalAvailability,
            compactQuotePhoto,
            apiReuse,
            capacityNotification,
            videoLoading,
            sourceQualityApiResponses: fixtureRoutes?.qualityApiResponses ?? [],
            sourceQualityRequests: fixtureRoutes?.qualityRequests ?? [],
            quotedApiResponses: fixtureRoutes?.quotedApiResponses ?? [],
            flowCleanup,
            mv3RestartCancellation,
            directRestart,
            trustedDownloadInput,
            downloadMemory,
            notification,
            nativeTransport: nativeLoopback.snapshot(),
            packagingAssets,
            publicDom,
            quotedVideoCycles,
            creditControls,
            svgTargetMatrix,
            blockAllDirectVideo,
            directVideoAllowedModes,
            own12NativeControls,
            delayedVideoFailures,
            rapidVideoClicks,
            modelessRenderRecovery,
            unavailableSequence,
            contextLoss,
            fixtureVideoAssets,
            videoClickConfiguration,
            zoomSpanish,
          },
          null,
          2
        )
      );
    } catch (error) {
      observationErrorSeen = true;
      observationError = error;
    }
  }
  const combinedErrors = [
    ...(primarySeen ? [primaryError] : []),
    ...cleanupErrors,
    ...(observationErrorSeen ? [observationError] : []),
  ];
  if (combinedErrors.length > 1) {
    throw new AggregateError(
      combinedErrors,
      `Installed flow stages failed: ${combinedErrors.map(safeError).join('; ')}`
    );
  }
  if (primarySeen) {
    throw primaryError;
  }
  if (cleanupErrors.length) {
    throw cleanupErrors[0];
  }
  if (observationErrorSeen) {
    throw observationError;
  }
  return flowResult;
}

async function runExtensionUpgrade({
  context,
  extensionId,
  extensionPath,
  input,
  output,
  root,
}: {
  context: BrowserContext;
  extensionId: string;
  extensionPath: string;
  input: NonNullable<Awaited<ReturnType<typeof readUpgradeInput>>>;
  output: string;
  root: string;
}) {
  const receipt: UpgradeReceipt = {
    status: 'failed',
    previousVersion: input.previousVersion,
    candidateVersion: input.candidateVersion,
    previousExtensionInventorySha256: input.previousExtensionInventorySha256,
    candidateExtensionInventorySha256: input.candidateExtensionInventorySha256,
    extensionId,
  };
  const images = await createImageFixtures(context);
  const displayImages = await createImageFixtures(context, 0.25);
  const routes = await installFixtureRoutes(context, root, images, displayImages);
  const page = await context.newPage();
  const extensionPage = await context.newPage();
  let primaryError: unknown;
  let primarySeen = false;
  let cleanupFailure: unknown;
  let cleanupSeen = false;
  try {
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    assert.equal(
      await extensionPage.evaluate(() => chrome.runtime.getManifest().version),
      input.previousVersion
    );
    await page.goto(FIXTURE_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    await page.locator('[data-testid="tweetPhoto"] img').first().click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    const toolbar = gallery.locator('[data-gallery-element="toolbar"]');
    await toolbar.getByRole('button', { name: 'Fit Height', exact: true }).click();
    await toolbar.locator('#settings-button').click();
    assert.equal(
      await gallery.locator('#settings-video-click-select').inputValue(),
      'block-controls-only',
      'Public 2.3.6 video-click control must show the default mode'
    );
    await gallery.locator('#settings-language-select').selectOption('ko');
    receipt.baselineClickModeUi = 'block-controls-only';
    await page.screenshot({ path: join(output, 'extension-before-upgrade.png') });
    await waitForValue(async () => {
      const stored = await readStoredVideoSettings(extensionPage);
      const { language } = await readStoredLanguage(extensionPage);
      return storedGallerySetting(stored.settings, 'imageFitMode') === 'fitHeight' &&
        storedGallerySetting(stored.settings, 'videoClickMode') === 'block-controls-only' &&
        language === 'ko'
        ? true
        : undefined;
    }, 'public extension settings saved through application controls');
    const before = await readStoredVideoSettings(extensionPage);
    const { language: languageBefore } = await readStoredLanguage(extensionPage);
    assert.equal(storedGallerySetting(before.settings, 'imageFitMode'), 'fitHeight');
    assert.equal(storedGallerySetting(before.settings, 'videoClickMode'), 'block-controls-only');
    assert.equal(storedGallerySetting(before.settings, 'enableKeyboardNav'), true);
    assert.equal(languageBefore, 'ko');
    await toolbar.locator('#settings-button').click();
    receipt.keyboardBefore = await observeGalleryKeyboardNavigation(page, gallery);
    await page.close();
    await extensionPage.close();
    receipt.videoClickBefore = await observeDefaultVideoClick(context);
    const volumePage = await context.newPage();
    try {
      await volumePage.goto(`chrome-extension://${extensionId}/manifest.json`);
      receipt.volumeBefore = await observeGalleryVolume(context, {
        before: 1,
        after: 0.9,
        waitForPersistedVolume: async (expected) => {
          await waitForValue(async () => {
            const stored = await readStoredVideoSettings(volumePage);
            const actual = storedGallerySetting(stored.settings, 'videoVolume');
            receipt.volumeBeforeStorageObservation = {
              exists: stored.exists,
              valueType: typeof stored.value,
              videoVolume: typeof actual === 'number' ? actual : null,
              videoMuted: storedGallerySetting(stored.settings, 'videoMuted') ?? null,
            };
            return actual === expected ? true : undefined;
          }, 'public extension volume persisted by trusted shortcut');
        },
      });
    } finally {
      await volumePage.close();
    }
    receipt.volumeBeforeReloaded = await observeGalleryVolume(context, {
      before: 0.9,
      waitForInitialVolume: true,
    });
    receipt.settingsBefore = {
      fit: 'fitHeight',
      videoClickMode: 'block-controls-only',
      language: 'ko',
      videoVolume: 0.9,
      keyboardShortcutUsedForVolume: true,
    };
    await rm(extensionPath, { recursive: true });
    await cp(join(root, 'dist-extension'), extensionPath, { recursive: true });
    assert.equal(
      await extensionInventorySha256(extensionPath),
      input.candidateExtensionInventorySha256
    );
    const details = await context.newPage();
    try {
      await details.goto(`chrome-extension://${extensionId}/manifest.json`);
      await details.evaluate((expectedId) => {
        if (chrome.runtime.id !== expectedId) {
          throw new Error('Upgrade extension identity changed');
        }
        chrome.runtime.reload();
      }, extensionId);
    } finally {
      await details.close();
    }
    const candidatePage = await context.newPage();
    try {
      await candidatePage.goto(`chrome-extension://${extensionId}/manifest.json`);
      assert.equal(await candidatePage.evaluate(() => chrome.runtime.id), extensionId);
      assert.equal(
        await candidatePage.evaluate(() => chrome.runtime.getManifest().version),
        input.candidateVersion
      );
      const after = await readStoredVideoSettings(candidatePage);
      const { language: languageAfter } = await readStoredLanguage(candidatePage);
      const settingsKeys: Array<'imageFitMode' | 'videoClickMode' | 'enableKeyboardNav'> = [
        'imageFitMode',
        'videoClickMode',
        'enableKeyboardNav',
      ];
      for (const key of settingsKeys) {
        assert.equal(
          storedGallerySetting(after.settings, key),
          storedGallerySetting(before.settings, key),
          `Extension update changed ${key}`
        );
      }
      assert.equal(storedGallerySetting(after.settings, 'videoVolume'), 0.9);
      assert.equal(languageAfter, languageBefore, 'Extension update changed locale');
      receipt.settingsAfter = receipt.settingsBefore;
      receipt.videoClickAfter = await observeDefaultVideoClick(context);
      receipt.nondefaultClickCrossUpdate = 'not-exercised';
      receipt.volumeAfter = await observeGalleryVolume(context, {
        before: 0.9,
        after: 1,
        waitForPersistedVolume: async (expected) => {
          await waitForValue(async () => {
            const stored = await readStoredVideoSettings(candidatePage);
            const actual = storedGallerySetting(stored.settings, 'videoVolume');
            receipt.volumeAfterStorageObservation = {
              exists: stored.exists,
              valueType: typeof stored.value,
              videoVolume: typeof actual === 'number' ? actual : null,
              videoMuted: storedGallerySetting(stored.settings, 'videoMuted') ?? null,
            };
            return actual === expected ? true : undefined;
          }, 'candidate extension volume persisted by trusted shortcut');
        },
      });
      receipt.volumeAfterReloaded = await observeGalleryVolume(context, {
        before: 1,
        waitForInitialVolume: true,
      });
      const exercisePage = await context.newPage();
      try {
        await exercisePage.goto(FIXTURE_URL);
        await exercisePage
          .locator('html[data-xeg-gallery-ready="true"]')
          .waitFor({ state: 'attached' });
        await exercisePage.locator('[data-testid="tweetPhoto"] img').first().click();
        const gallery = exercisePage.locator('[data-xeg-gallery-container]');
        await gallery.waitFor({ state: 'visible' });
        receipt.keyboardAfter = await observeGalleryKeyboardNavigation(exercisePage, gallery);
        await gallery.locator('#settings-button').click();
        assert.equal(
          await gallery.locator('#settings-video-click-select').inputValue(),
          'block-controls-only'
        );
        const clickModeSelect = gallery.locator('#settings-video-click-select');
        await clickModeSelect.focus();
        await exercisePage.keyboard.press('End');
        await waitForValue(async () => {
          const current = await readStoredVideoSettings(candidatePage);
          const mode = storedVideoClickMode(current.settings);
          receipt.candidateClickModeStorageObservation = {
            exists: current.exists,
            valueType: typeof current.value,
            mode,
          };
          return mode === 'allow-all' ? true : undefined;
        }, 'candidate-only video-click setting saved through application control');
        assert.equal(await clickModeSelect.inputValue(), 'allow-all');
        const readbackPage = await context.newPage();
        try {
          await readbackPage.goto(FIXTURE_URL);
          await readbackPage
            .locator('html[data-xeg-gallery-ready="true"]')
            .waitFor({ state: 'attached' });
          await readbackPage.locator('[data-testid="tweetPhoto"] img').first().click();
          const readbackGallery = readbackPage.locator('[data-xeg-gallery-container]');
          await readbackGallery.waitFor({ state: 'visible' });
          await readbackGallery.locator('#settings-button').click();
          const readbackMode = readbackGallery.locator('#settings-video-click-select');
          await readbackMode.waitFor({ state: 'visible' });
          assert.equal(await readbackMode.inputValue(), 'allow-all');
          receipt.candidateClickModeReloaded = 'allow-all';
        } catch (error) {
          receipt.candidateClickModeReadbackFailure = await captureUpgradeSettingsFailure(
            readbackPage,
            output,
            'extension',
            'candidate-reloaded'
          );
          throw error;
        } finally {
          await readbackPage.close();
        }
        await exercisePage.bringToFront();
        await gallery.locator('#settings-language-select').selectOption('en');
        await clickModeSelect.focus();
        await exercisePage.keyboard.press('ArrowUp');
        await waitForValue(async () => {
          const current = await readStoredVideoSettings(candidatePage);
          const mode = storedVideoClickMode(current.settings);
          receipt.candidateClickModeRestoreStorageObservation = {
            exists: current.exists,
            valueType: typeof current.value,
            mode,
          };
          return mode === 'block-controls-only' ? true : undefined;
        }, 'candidate video-click setting restored through trusted keyboard input');
        assert.equal(await clickModeSelect.inputValue(), 'block-controls-only');
        await gallery.locator('#settings-button').click();
        await gallery.getByRole('button', { name: 'Fit Width', exact: true }).click();
        const restored = await waitForValue(async () => {
          const current = await readStoredVideoSettings(candidatePage);
          const { language: currentLanguage } = await readStoredLanguage(candidatePage);
          return storedGallerySetting(current.settings, 'imageFitMode') === 'fitWidth' &&
            storedGallerySetting(current.settings, 'videoClickMode') === 'block-controls-only' &&
            storedGallerySetting(current.settings, 'videoVolume') === 1 &&
            currentLanguage === 'en'
            ? true
            : undefined;
        }, 'candidate settings restored through application controls');
        assert.equal(restored, true);
        receipt.candidateClickModeUi = { selected: 'allow-all', restored: 'block-controls-only' };
        receipt.fixtureDefaultsRestoredThroughUi = true;
      } catch (error) {
        receipt.settingsFailure = await captureUpgradeSettingsFailure(
          exercisePage,
          output,
          'extension',
          'candidate'
        );
        throw error;
      } finally {
        await exercisePage.close();
      }
    } finally {
      await candidatePage.close();
    }
    receipt.method = 'same-path-unpacked-extension-runtime-reload';
    receipt.status = 'passed';
  } catch (error) {
    if (!extensionPage.isClosed()) {
      try {
        const stored = await readStoredVideoSettings(extensionPage);
        const language = await readStoredLanguage(extensionPage);
        receipt.storedPreferencesAtFailure = {
          settingsPresent: stored.exists,
          fit: storedGallerySetting(stored.settings, 'imageFitMode') ?? null,
          clickMode: storedGallerySetting(stored.settings, 'videoClickMode') ?? null,
          keyboardEnabled: storedGallerySetting(stored.settings, 'enableKeyboardNav') ?? null,
          language,
        };
      } catch (diagnosticError) {
        receipt.storedPreferencesDiagnosticError = safeError(diagnosticError);
      }
    }
    if (!page.isClosed()) {
      receipt.settingsFailure = await captureUpgradeSettingsFailure(
        page,
        output,
        'extension',
        'public'
      );
    }
    receipt.error = safeError(error);
    primaryError = error;
    primarySeen = true;
  } finally {
    await Promise.allSettled([page.close(), extensionPage.close()]);
    try {
      await routes.remove();
    } catch (error) {
      receipt.status = 'failed';
      receipt.cleanupError = safeError(error);
      cleanupFailure = error;
      cleanupSeen = true;
    }
    await writeFile(join(output, 'extension-upgrade.json'), JSON.stringify(receipt, null, 2));
  }
  if (primarySeen && cleanupSeen) {
    throw new AggregateError(
      [primaryError, cleanupFailure],
      'Extension upgrade and cleanup failed'
    );
  }
  if (primarySeen) {
    throw primaryError;
  }
  if (cleanupSeen) {
    throw cleanupFailure;
  }
  return receipt;
}

async function runSameVersionAttribution({
  context,
  extensionId,
  extensionPath,
  input,
  output,
  root,
  downloads,
  nativeLoopback,
}: {
  context: BrowserContext;
  extensionId: string;
  extensionPath: string;
  input: NonNullable<Awaited<ReturnType<typeof readSameVersionInput>>>;
  output: string;
  root: string;
  downloads: string;
  nativeLoopback: NativeLoopback;
}) {
  const receipt: {
    status: string;
    role: string;
    version: string;
    sourceSha: string;
    coreSha: string;
    harnessSourceSha: string;
    harnessCoreSha: string;
    extensionId: string;
    expectedInventorySha256: string;
    installedInventorySha256?: string;
    expectedContentSha256: string;
    installedContentSha256?: string;
    manifestVersion?: string;
    defaultClickMode?: string;
    cases: Array<Record<string, unknown>>;
    api?: ApiRecord[];
    rejectedApi?: ApiRecord[];
    nativeTransport?: ReturnType<NativeLoopback['snapshot']>;
    cleanup: { routesRemoved?: boolean; extensionPageClosed?: boolean; errors: string[] };
    error?: string;
  } = {
    status: 'pending',
    role: input.role,
    version: input.version,
    sourceSha: input.sourceSha,
    coreSha: input.coreSha,
    harnessSourceSha: input.harnessSourceSha,
    harnessCoreSha: input.harnessCoreSha,
    extensionId,
    expectedInventorySha256: input.extension.inventorySha256,
    expectedContentSha256: input.extension.contentSha256,
    cases: [],
    cleanup: { errors: [] },
  };
  const images = await createImageFixtures(context);
  const displayImages = await createImageFixtures(context, 0.25);
  const routes = await installFixtureRoutes(context, root, images, displayImages);
  const extensionPage = await context.newPage();
  let primaryError: unknown;
  try {
    nativeLoopback.setPayloads(images, routes.videoPayloads);
    receipt.installedInventorySha256 = await extensionInventorySha256(extensionPath);
    assert.equal(receipt.installedInventorySha256, input.extension.inventorySha256);
    receipt.installedContentSha256 = sha256(await readFile(join(extensionPath, 'content.js')));
    assert.equal(receipt.installedContentSha256, input.extension.contentSha256);
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    assert.equal(await extensionPage.evaluate(() => chrome.runtime.id), extensionId);
    receipt.manifestVersion = await extensionPage.evaluate(
      () => chrome.runtime.getManifest().version
    );
    assert.equal(receipt.manifestVersion, input.version);
    receipt.defaultClickMode =
      storedVideoClickMode((await readStoredVideoSettings(extensionPage)).settings) ??
      'block-controls-only';
    assert.equal(receipt.defaultClickMode, 'block-controls-only');

    for (const name of ['recognized', 'unmarked', 'unmarked-no-outer'] as const) {
      const quotedCase = QUOTED_CASES.find((item) => item.name === name);
      assert(quotedCase, `Same-version ${name} fixture is missing`);
      const observed: Record<string, unknown> = {
        name,
        status: 'pending',
        parsedContent: [],
        pageErrors: [],
        consoleErrors: [],
        cleanup: { pageClosed: false, cdpDetached: false, listenersRemoved: false },
      };
      receipt.cases.push(observed);
      const page = await context.newPage();
      let cdp: CDPSession | undefined;
      const parsed: Array<{ scriptId: string; url: string }> = [];
      let parsedOverflow = false;
      const pageFetches: PageFetch[] = [];
      let fetchOverflow = false;
      const onPageError = (error: Error) => {
        const list = observed.pageErrors as string[];
        if (list.length < 8) {
          list.push(error.message.slice(0, 500));
        } else {
          fetchOverflow = true;
        }
      };
      const onConsole = (message: ConsoleMessage) => {
        if (message.type() !== 'error') {
          return;
        }
        const list = observed.consoleErrors as string[];
        if (list.length < 8) {
          list.push(message.text().slice(0, 500));
        } else {
          fetchOverflow = true;
        }
      };
      const onRequest = (request: Request) => {
        if (!['fetch', 'xhr'].includes(request.resourceType())) {
          return;
        }
        const url = new URL(request.url());
        if (!['pbs.twimg.com', 'video.twimg.com'].includes(url.hostname)) {
          return;
        }
        if (pageFetches.length < 32) {
          pageFetches.push({
            host: url.hostname,
            path: url.pathname,
            resourceType: request.resourceType(),
          });
        } else {
          fetchOverflow = true;
        }
      };
      page.on('pageerror', onPageError);
      page.on('console', onConsole);
      page.on('request', onRequest);
      const apiMark = routes.quotedApiResponses.length;
      try {
        cdp = await context.newCDPSession(page);
        cdp.on('Debugger.scriptParsed', ({ scriptId, url }) => {
          if (url !== `chrome-extension://${extensionId}/content.js`) {
            return;
          }
          if (parsed.length < 2) {
            parsed.push({ scriptId, url });
          } else {
            parsedOverflow = true;
          }
        });
        await cdp.send('Debugger.enable');
        observed.cycle = await runQuotedVideoCycle({
          quotedCase,
          quotedApiResponses: routes.quotedApiResponses,
          downloads,
          extensionPage,
          output,
          page,
          videoPayloads: routes.videoPayloads,
          nativeLoopback,
          pageFetches,
        });
        observed.api = routes.quotedApiResponses.slice(apiMark);
        assert.equal(fetchOverflow, false, 'Same-version page observation exceeded its bound');
        assert.deepEqual(observed.pageErrors, [], 'Same-version page raised an error');
        assert.deepEqual(observed.consoleErrors, [], 'Same-version page logged an error');
        observed.status = 'passed';
      } catch (error) {
        observed.status = 'failed';
        observed.error = safeError(error);
        observed.api = routes.quotedApiResponses.slice(apiMark);
        observed.parsedScriptsSeen = parsed.length;
        observed.parsedOverflow = parsedOverflow;
        observed.fetchOverflow = fetchOverflow;
        const screenshot = `same-version-${name}-failure.png`;
        await page.screenshot({ path: join(output, screenshot) }).then(
          () => {
            observed.screenshot = screenshot;
          },
          (captureError) => {
            observed.screenshotError = safeError(captureError);
          }
        );
      } finally {
        try {
          assert(cdp, 'Same-version debugger session was not created');
          assert(
            !parsedOverflow && parsed.length > 0,
            'Installed content script parse record is missing or overflowed'
          );
          for (const record of parsed) {
            const source = await cdp.send('Debugger.getScriptSource', {
              scriptId: record.scriptId,
            });
            const actualSha256 = sha256(Buffer.from(source.scriptSource, 'utf8'));
            (observed.parsedContent as Array<Record<string, unknown>>).push({
              url: record.url,
              sha256: actualSha256,
            });
            assert.equal(
              actualSha256,
              input.extension.contentSha256,
              'Executed content script bytes differ'
            );
          }
        } catch (error) {
          observed.status = 'failed';
          observed.scriptError = safeError(error);
        }
        observed.parsedScriptsSeen = parsed.length;
        observed.parsedOverflow = parsedOverflow;
        observed.fetchOverflow = fetchOverflow;
        if (observed.status === 'failed' && !observed.screenshot) {
          const screenshot = `same-version-${name}-failure.png`;
          await page.screenshot({ path: join(output, screenshot) }).then(
            () => {
              observed.screenshot = screenshot;
            },
            (captureError) => {
              observed.screenshotError = safeError(captureError);
            }
          );
        }
        page.off('pageerror', onPageError);
        page.off('console', onConsole);
        page.off('request', onRequest);
        (observed.cleanup as Record<string, unknown>).listenersRemoved = true;
        try {
          await cdp?.detach();
          (observed.cleanup as Record<string, unknown>).cdpDetached = true;
        } catch (error) {
          receipt.cleanup.errors.push(safeError(error));
        }
        try {
          await page.close();
          (observed.cleanup as Record<string, unknown>).pageClosed = true;
        } catch (error) {
          receipt.cleanup.errors.push(safeError(error));
        }
      }
    }
    receipt.nativeTransport = nativeLoopback.snapshot();
    assert.deepEqual(
      routes.apiResponses,
      [],
      'Same-version fixture made an unsupported API request'
    );
    assert.equal(receipt.nativeTransport.unexpectedCount, 0);
    assert.equal(receipt.nativeTransport.overflow, false);
    assert.equal(receipt.nativeTransport.activeCount, 0);
    assert.equal(receipt.nativeTransport.serverError, false);
    assert(
      receipt.cases.every((item) => item.status === 'passed'),
      'Same-version case failed'
    );
    receipt.status = 'passed';
  } catch (error) {
    primaryError = error;
    receipt.status = 'failed';
    receipt.error = safeError(error);
  } finally {
    receipt.api = routes.quotedApiResponses;
    receipt.rejectedApi = routes.apiResponses;
    receipt.nativeTransport = nativeLoopback.snapshot();
    try {
      await extensionPage.close();
      receipt.cleanup.extensionPageClosed = true;
    } catch (error) {
      receipt.cleanup.errors.push(safeError(error));
    }
    try {
      await routes.remove();
      receipt.cleanup.routesRemoved = true;
    } catch (error) {
      receipt.cleanup.errors.push(safeError(error));
    }
    if (receipt.cleanup.errors.length) {
      receipt.status = 'failed';
    }
    await writeFile(
      join(output, 'same-version-attribution.json'),
      JSON.stringify(receipt, null, 2)
    );
  }
  if (primaryError && !receipt.error) {
    receipt.error = safeError(primaryError);
  }
  return receipt;
}

export async function run({
  chromium,
  root,
  output,
  browserName,
  headless,
  installation,
  liveUrls,
  liveObservation = null,
}: {
  chromium: (typeof import('@playwright/test'))['chromium'];
  root: string;
  output: string;
  browserName: string;
  headless: boolean;
  installation: string;
  liveUrls: string[];
  liveObservation?: null;
}) {
  assert(
    ['chrome', 'msedge'].includes(browserName),
    'Installed XCOM profile supports Chrome and Edge only'
  );
  assert(['extension', 'userscript'].includes(installation), 'Unknown XCOM installation mode');
  if (installation === 'userscript') {
    assert.equal(liveUrls.length, 0, 'Installed userscript fixture does not support public URLs');
    assert.equal(
      liveObservation,
      null,
      'Installed userscript fixture does not support duration observation'
    );
    const { runUserscriptInstallation } = await import('./userscript-install.ts');
    return runUserscriptInstallation({ chromium, root, output, browserName, headless });
  }
  const upgradeInput = await readUpgradeInput(root);
  const sameVersionInput = await readSameVersionInput(root);
  const openingSelectorText = await readFile(
    join(root, 'validation/windows/inputs/opening-feedback.json'),
    'utf8'
  ).catch((error: unknown) => {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  });
  const openingProbe = openingSelectorText !== null;
  if (openingSelectorText !== null) {
    assert.deepEqual(JSON.parse(openingSelectorText), { scenario: 'opening-feedback' });
    assert(!upgradeInput && !sameVersionInput, 'Opening probe cannot run during upgrade checks');
    assert.equal(liveUrls.length, 0, 'Opening probe uses only the owned fixture');
  }
  const recoverySelectorText = await readFile(
    join(root, 'validation/windows/inputs/media-download-recovery.json'),
    'utf8'
  ).catch((error: unknown) => {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  });
  const recoveryProbe = recoverySelectorText !== null;
  if (recoverySelectorText !== null) {
    assert.deepEqual(JSON.parse(recoverySelectorText), { scenario: 'media-download-recovery' });
    assert(!upgradeInput && !sameVersionInput, 'Recovery probe cannot run during upgrade checks');
    assert(!openingProbe, 'Only one focused installed-extension probe may run');
    assert.equal(liveUrls.length, 0, 'Recovery probe uses only the owned fixture');
  }
  const failedEntrySelectorText = await readFile(
    join(root, 'validation/windows/inputs/failed-entry-recovery.json'),
    'utf8'
  ).catch((error: unknown) => {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  });
  const failedEntryProbe = failedEntrySelectorText !== null;
  if (failedEntrySelectorText !== null) {
    assert.deepEqual(JSON.parse(failedEntrySelectorText), { scenario: 'failed-entry-recovery' });
    assert(!upgradeInput && !sameVersionInput, 'Failed-entry probe cannot run during upgrades');
    assert(!openingProbe && !recoveryProbe, 'Only one focused installed-extension probe may run');
    assert.equal(liveUrls.length, 0, 'Failed-entry probe uses only the owned fixture');
  }
  const experienceSelectorText = await readFile(
    join(root, 'validation/windows/inputs/gallery-experience.json'),
    'utf8'
  ).catch((error: unknown) => {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  });
  const experienceProbe = experienceSelectorText !== null;
  if (experienceSelectorText !== null) {
    assert.deepEqual(JSON.parse(experienceSelectorText), { scenario: 'gallery-experience' });
    assert(!upgradeInput && !sameVersionInput, 'Experience probe cannot run during upgrade checks');
    assert(
      !openingProbe && !recoveryProbe && !failedEntryProbe,
      'Only one focused installed-extension probe may run'
    );
    assert.equal(liveUrls.length, 0, 'Experience probe uses only the owned fixture');
  }
  assert(!(upgradeInput && sameVersionInput), 'Upgrade and same-version inputs cannot coexist');
  if (sameVersionInput) {
    assert.equal(liveUrls.length, 0, 'Same-version attribution does not observe live URLs');
    assert.equal(liveObservation, null);
  }
  const validatedLiveUrls = validateLiveUrls(liveUrls);
  validateLiveObservation(liveObservation);
  await mkdir(output, { recursive: true });
  const profile = await mkdtemp(join(root, PROFILE_PREFIX));
  const installedExtensionPath =
    upgradeInput || sameVersionInput
      ? join(profile, 'owned-extension')
      : join(root, 'dist-extension');
  const downloads = join(profile, 'downloads');
  let context: BrowserContext | undefined;
  let browserCdp: CDPSession | undefined;
  let nativeLoopback: NativeLoopback | undefined;
  let extensionId: string | undefined;
  let primaryError: unknown;
  let primarySeen = false;
  let installationResultError: unknown;
  let installationResultErrorSeen = false;
  const cleanupErrors: unknown[] = [];
  const result: InstallResult = {
    browserName,
    cleanup: {},
    installation,
    installationMethod: 'cdp-unpacked-extension',
    liveUrls: validatedLiveUrls,
    liveObservation,
    scope: failedEntryProbe
      ? 'issue 392 installed-extension failed-entry ZIP recovery fixture; no live X observation'
      : experienceProbe
        ? 'issue 383 installed-extension gallery experience fixtures; no live X observation'
        : recoveryProbe
          ? 'issue 382 installed-extension media/download recovery fixture; no live X observation'
          : openingProbe
            ? 'issue 381 installed-extension opening feedback fixture; no live X observation'
            : validatedLiveUrls.length
              ? 'deterministic fixture followed by opt-in public X status diagnostics; no auth, consent, CAPTCHA, live download, native Save As, Explorer, or performance claim'
              : sameVersionInput
                ? 'one declared v2.3.8 artifact in a fresh installed extension profile; three deterministic quoted-video controls'
                : 'deterministic fixture; no live or authenticated X.com, native Save As, Explorer, or performance claim',
    status: 'failed',
  };
  try {
    if (upgradeInput) {
      await cp(upgradeInput.previousExtensionPath, installedExtensionPath, { recursive: true });
      assert.equal(
        await extensionInventorySha256(installedExtensionPath),
        upgradeInput.previousExtensionInventorySha256
      );
    }
    if (sameVersionInput) {
      await cp(sameVersionInput.extensionPath, installedExtensionPath, { recursive: true });
      assert.equal(
        await extensionInventorySha256(installedExtensionPath),
        sameVersionInput.extension.inventorySha256
      );
    }
    await mkdir(downloads);
    assertOwnedProfile(root, profile);
    await mkdir(join(profile, 'Default'));
    await writeFile(
      join(profile, 'Default', 'Preferences'),
      JSON.stringify({
        download: {
          default_directory: downloads,
          prompt_for_download: false,
          directory_upgrade: true,
        },
      })
    );
    nativeLoopback = await startExtensionNativeFixtureLoopback(
      join(root, 'validation/windows/userscript-fixture-certificate.ps1')
    );
    result.fixtureTransport = {
      kind: 'task-owned-https-loopback',
      bind: '127.0.0.1',
      port: nativeLoopback.port,
      hosts: ['pbs.twimg.com', 'video.twimg.com', 'x.com'],
      certificateScope: 'one-run-spki',
    };
    context = await chromium.launchPersistentContext(profile, {
      channel: browserName,
      headless,
      acceptDownloads: true,
      downloadsPath: downloads,
      locale: 'en-US',
      viewport: { width: 1280, height: 800 },
      ignoreDefaultArgs: ['--disable-extensions'],
      args: [
        '--enable-unsafe-extension-debugging',
        `--host-resolver-rules=MAP pbs.twimg.com:443 127.0.0.1:${nativeLoopback.port},MAP video.twimg.com:443 127.0.0.1:${nativeLoopback.port},MAP x.com:443 127.0.0.1:${nativeLoopback.port}`,
        `--ignore-certificate-errors-spki-list=${nativeLoopback.spkiSha256}`,
      ],
    });
    const browser = context.browser();
    assert(browser, 'Installed context has no browser');
    result.browserVersion = browser.version();
    await enableDeveloperMode(context, browserName);
    await verifyDownloadDirectory(context, downloads);
    browserCdp = await browser.newBrowserCDPSession();
    // Use Chrome's download manager and this fresh profile's directory preference
    // so the extension's filename selection reaches the normal browser delegate.
    await browserCdp.send('Browser.setDownloadBehavior', {
      behavior: 'default',
      eventsEnabled: true,
    });
    ({ id: extensionId } = await browserCdp.send('Extensions.loadUnpacked', {
      path: installedExtensionPath,
    }));
    assert.equal(typeof extensionId, 'string');
    if (sameVersionInput) {
      result.sameVersion = await runSameVersionAttribution({
        context,
        extensionId,
        extensionPath: installedExtensionPath,
        input: sameVersionInput,
        output,
        root,
        downloads,
        nativeLoopback,
      });
      assert.equal(
        result.sameVersion.status,
        'passed',
        `Same-version attribution failed: ${result.sameVersion.error ?? 'case or cleanup failure'}`
      );
    } else if (upgradeInput) {
      result.upgrade = await runExtensionUpgrade({
        context,
        extensionId,
        extensionPath: installedExtensionPath,
        input: upgradeInput,
        output,
        root,
      });
    }
    if (!sameVersionInput) {
      const images = await createImageFixtures(context);
      const displayImages = await createImageFixtures(context, 0.25);
      if (failedEntryProbe) {
        result.failedEntryRecovery = await runFailedEntryRecoveryProbe({
          context,
          downloads,
          extensionId,
          nativeLoopback,
          output,
          root,
          images,
          displayImages,
        });
      } else if (experienceProbe) {
        result.galleryExperience = await runGalleryExperienceProbe({
          context,
          downloads,
          extensionId,
          nativeLoopback,
          output,
          root,
          images,
          displayImages,
        });
      } else if (openingProbe) {
        result.openingFeedback = await runOpeningFeedbackProbe({
          context,
          downloads,
          extensionId,
          nativeLoopback,
          output,
          root,
          images,
          displayImages,
        });
      } else if (recoveryProbe) {
        result.mediaDownloadRecovery = await runMediaDownloadRecoveryProbe({
          context,
          downloads,
          extensionId,
          nativeLoopback,
          output,
          root,
          images,
          displayImages,
        });
      } else {
        result.fixture = await exerciseInstalledExtension(
          context,
          extensionId,
          root,
          output,
          downloads,
          images,
          displayImages,
          browserCdp,
          nativeLoopback
        );
      }
    }
    await context.unrouteAll({ behavior: 'wait' });
    if (validatedLiveUrls.length) {
      await browserCdp.send('Extensions.uninstall', { id: extensionId });
      extensionId = undefined;
      result.cleanup.fixtureExtensionUninstalled = true;
      await context.close();
      context = undefined;
      browserCdp = undefined;
      result.cleanup.fixtureBrowserClosed = true;
      assert(result.fixtureTransport, 'Fixture transport receipt is missing');
      result.fixtureTransport.observations = nativeLoopback.snapshot();
      await nativeLoopback.close();
      nativeLoopback = undefined;
      result.cleanup.fixtureLoopbackClosed = true;
      context = await chromium.launchPersistentContext(profile, {
        channel: browserName,
        headless,
        acceptDownloads: true,
        downloadsPath: downloads,
        locale: 'en-US',
        viewport: { width: 1280, height: 800 },
        ignoreDefaultArgs: ['--disable-extensions'],
        args: ['--enable-unsafe-extension-debugging'],
      });
      await enableDeveloperMode(context, browserName);
      await verifyDownloadDirectory(context, downloads);
      const liveBrowser = context.browser();
      assert(liveBrowser, 'Live installed context has no browser');
      browserCdp = await liveBrowser.newBrowserCDPSession();
      ({ id: extensionId } = await browserCdp.send('Extensions.loadUnpacked', {
        path: installedExtensionPath,
      }));
      assert.equal(typeof extensionId, 'string');
      result.liveBrowserScope =
        'fresh browser process without fixture host mapping or SPKI exception';
    }
    if (!sameVersionInput) {
      const live = await observeLiveUrls({
        context,
        extensionId,
        liveUrls: validatedLiveUrls,
        output,
      });
      result.live = live;
      result.evidenceStatus = validatedLiveUrls.length ? live.evidenceStatus : 'fixture-observed';
    } else {
      result.evidenceStatus = 'same-version-fixture-observed';
    }
    result.status = 'passed';
  } catch (error) {
    primarySeen = true;
    primaryError = error;
    result.error = safeError(error);
    if (error && typeof error === 'object' && 'summary' in error) {
      result.live = error.summary;
    }
  } finally {
    if (browserCdp && extensionId) {
      try {
        await browserCdp.send('Extensions.uninstall', { id: extensionId });
        result.cleanup.extensionUninstalled = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    try {
      await context?.close();
      result.cleanup.browserClosed = true;
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (nativeLoopback) {
      assert(result.fixtureTransport, 'Fixture transport receipt is missing');
      result.fixtureTransport.observations = nativeLoopback.snapshot();
      try {
        await nativeLoopback.close();
        result.cleanup.fixtureLoopbackClosed = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (result.cleanup.browserClosed) {
      try {
        assertOwnedProfile(root, profile);
        await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
        assert.equal(
          await pathExists(profile),
          false,
          'Task-owned Chrome profile remained after cleanup'
        );
        result.cleanup.profileRemoved = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    } else {
      result.cleanup.profilePreserved = true;
    }
    result.cleanup.errorCount = cleanupErrors.length;
    if (cleanupErrors.length) {
      result.status = 'failed';
      result.cleanup.errors = cleanupErrors.map(safeError);
    }
    try {
      await writeFile(join(output, 'installation-result.json'), JSON.stringify(result, null, 2));
    } catch (error) {
      installationResultErrorSeen = true;
      installationResultError = error;
    }
  }
  const combinedErrors = [
    ...(primarySeen ? [primaryError] : []),
    ...cleanupErrors,
    ...(installationResultErrorSeen ? [installationResultError] : []),
  ];
  if (combinedErrors.length > 1) {
    const failedStages = [
      ...(primarySeen ? ['installed flow'] : []),
      ...(cleanupErrors.length ? ['cleanup'] : []),
      ...(installationResultErrorSeen ? ['installation result write'] : []),
    ];
    throw new AggregateError(
      combinedErrors,
      `${failedStages.join(', ')} failed: ${combinedErrors.map((error) => safeError(error)).join('; ')}`
    );
  }
  if (primarySeen) {
    throw primaryError;
  }
  if (cleanupErrors.length) {
    throw new AggregateError(
      cleanupErrors,
      `Installed flow cleanup failed: ${cleanupErrors.map((error) => safeError(error)).join('; ')}`
    );
  }
  if (installationResultErrorSeen) {
    throw installationResultError;
  }
  return result;
}
