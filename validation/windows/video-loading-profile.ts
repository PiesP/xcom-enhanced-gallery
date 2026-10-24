// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import type {
  BrowserContext,
  CDPSession,
  ConsoleMessage,
  Page,
  Request,
  Route,
} from '@playwright/test';
import type { startExtensionNativeFixtureLoopback } from './extension-native-loopback.ts';
import {
  expectedStoredZipBytes,
  readExactDownloadFile,
  verifyStoredZip,
} from './download-memory.ts';
import { restoreStoredVideoSettings } from './live-page.ts';

const METADATA_READINESS_ID = '4666000111222333991';

type NativeLoopback = Awaited<ReturnType<typeof startExtensionNativeFixtureLoopback>>;
type ItemState = NonNullable<Awaited<ReturnType<typeof itemState>>>;
type VideoRequest = {
  index: number;
  quality: string | undefined;
  resourceType: string;
  atMs: number;
  range: string | null;
  status: number | null;
};
type VideoRecords = {
  api: { requestedId: string; method: string }[];
  video: VideoRequest[];
  unexpectedVideo: string[];
  overflow: number;
};
type VideoObservation = {
  fixtureUrl: string;
  tweetId: string;
  expectedVideoCount: number;
  canonicalBest: string;
  playableFallback: string;
  requests: VideoRecords;
  checks: string[];
  timingsMs: Record<string, number>;
  cleanup: {
    routeRemoved: boolean;
    settingsRestored: boolean;
    viewportRestored: boolean;
    routeError?: string;
    settingsError?: string;
    viewportError?: string;
  };
  viewport?: { width: number; height: number };
  initial?: ItemState | null;
  metadata?: ItemState | null;
  beforeRecovery?: ItemState | null;
  distantBeforeActivation?: number[];
  recovered?: ItemState & { playbackEnd: number; hint: string };
  keyboard?: ItemState | null;
  download?: unknown;
  zip?: unknown;
  hostRestoration?: {
    before: { scrollY: number; bodyStyle: string | null };
    after: { scrollY: number; bodyStyle: string | null };
  };
  geometry?: unknown;
  recoveryIntent?: unknown;
  rangeDiagnostics?: unknown;
  selectedFailures?: SelectedVideoFailureEvidence;
  metadataReadiness?: MetadataReadinessEvidence;
  error?: string;
};
type MetadataReadinessEvent = {
  type: 'loadedmetadata' | 'loadeddata' | 'error';
  trusted: boolean;
  atPageMonotonicMs: number;
  currentSrc: string;
  readyState: number;
  errorCode: number | null;
};
type MetadataReadinessObserver = {
  records: MetadataReadinessEvent[];
  overflow: boolean;
  frames: Array<{
    atPageMonotonicMs: number;
    presentedFrames: number;
    mediaTime: number;
    width: number;
    height: number;
  }>;
  frameOverflow: boolean;
  frameSupported: boolean | null;
  dispose: () => { mutationObserverDisconnected: boolean; frameCallbackCanceled: boolean };
};
type MetadataFrameSnapshot = {
  phase: 'first-poll' | 'stable-hold' | 'pre-tail-release' | 'on-failure' | 'after-tail' | 'play';
  atMs: number;
  callbackCount: number;
  lastCallback: MetadataReadinessObserver['frames'][number] | null;
  video: null | {
    currentSrcMatches: boolean;
    posterPresent: boolean;
    posterMatches: boolean;
    controls: boolean;
    display: string;
    visibility: string;
    opacity: string;
    objectFit: string;
    parentDisplay: string | null;
    parentVisibility: string | null;
    parentOpacity: string | null;
    width: number;
    height: number;
    rect: { width: number; height: number };
    quality?: {
      totalVideoFrames: number;
      droppedVideoFrames: number;
      corruptedVideoFrames: number;
    };
    webkitDecodedFrameCount?: number;
  };
};
type MetadataReadinessEvidence = {
  status: 'pending' | 'passed' | 'failed';
  fixtureUrl: string;
  bestUrl: string;
  assetSha256: string;
  prefixEnd: number;
  api: Array<{ requestedId: string; status: number }>;
  protocol: Array<{
    requestId: string;
    phase: string;
    atMs: number;
    status?: number;
    range?: string | null;
    errorText?: string;
    blockedReason?: string;
  }>;
  transfer: Array<{
    requestId: string;
    chunks: number;
    dataBytes: number;
    encodedBytes: number;
    firstAtMs: number;
    lastAtMs: number;
  }>;
  requestSettlement?: {
    outcome: 'finished' | 'aborted-continued';
    requests: Array<{
      requestId: string;
      rangeStart: number;
      receivedBytes: number;
      terminal: 'finished' | 'aborted';
    }>;
  };
  timing: { failureAtMs?: number; tailReleasedAtMs?: number; abortAtMs?: number };
  stateSamples: Array<{
    phase: 'first-poll' | 'last-poll' | 'on-failure' | 'after-tail';
    atMs: number;
    state: ItemState | null;
  }>;
  frameDiagnostics: {
    supported: boolean | null;
    callbacks: MetadataReadinessObserver['frames'];
    overflow: boolean;
    snapshots: MetadataFrameSnapshot[];
    errors: string[];
    cleanup: { mutationObserverDisconnected: boolean; frameCallbackCanceled: boolean };
  };
  mediaDiagnostics: {
    players: string[];
    matchedPlayers: string[];
    records: Array<{ playerId: string; atMs: number; name: string; value: string }>;
    overflow: boolean;
    enabled: boolean;
    error?: string;
  };
  failureProbe?: {
    heldBeforeRelease: boolean;
    outcome: 'not-held' | 'metadata' | 'no-metadata' | 'unavailable' | 'error';
    terminalObserved: boolean;
    error?: string;
  };
  nativeBeforeRelease?: ReturnType<NativeLoopback['since']>;
  nativeAfterRelease?: ReturnType<NativeLoopback['since']>;
  events: MetadataReadinessEvent[];
  metadata?: { before: ItemState; after: ItemState; observationMs: number };
  firstFrame?: { before: ItemState; after: ItemState; observationMs: number };
  playback?: { before: ItemState; after: ItemState };
  host?: {
    before: { scrollY: number; bodyStyle: string | null; activeTarget: string | null };
    after: { scrollY: number; bodyStyle: string | null; activeTarget: string | null };
  };
  permission?: { before: PermissionState; after?: PermissionState };
  screenshots: string[];
  pageErrors: string[];
  consoleErrors: Array<{ text: string; location: string }>;
  overflow: boolean;
  error?: string;
  screenshotError?: string;
  cleanup: {
    videoHoldReleased: boolean;
    observerRemoved: boolean;
    routeRemoved: boolean;
    listenersRemoved: boolean;
    protocolDetached: boolean;
    pageClosed: boolean;
    errors: string[];
  };
};
type SelectedVideoFault = 'http-401' | 'http-403' | 'http-404' | 'html-200' | 'invalid-mp4-200';
type SelectedVideoRouteRecord = {
  url: string;
  index: number;
  quality: string;
  range: string | null;
  status: number;
  bytes: number;
  sha256: string | null;
  fulfilledAtMonotonicMs?: number;
};
type SelectedVideoEventRecord = {
  type: 'error' | 'play' | 'src';
  atPageMonotonicMs: number;
  source: string | null;
  currentSource: string;
  errorCode: number | null;
  trusted: boolean | null;
  responseStatus: number | null;
};
type SelectedVideoPageObserver = {
  records: SelectedVideoEventRecord[];
  overflow: boolean;
  dispose: () => void;
};
type SelectedVideoFailureCase = {
  kind: SelectedVideoFault;
  status: 'pending' | 'passed' | 'failed';
  fixtureUrl: string;
  bestUrl: string;
  lowerUrl: string;
  faultStatus: number;
  api: Array<{ url: string; status: number }>;
  requests: SelectedVideoRouteRecord[];
  responses: Array<{ url: string; status: number }>;
  unexpectedVideo: string[];
  events: SelectedVideoEventRecord[];
  consoleErrors: Array<{ text: string; location: string }>;
  pageErrors: string[];
  overflow: boolean;
  faultPhysicalRangeRequests?: number;
  faultSelectedSourceAttempts?: string[];
  totalPhysicalRangeRequests?: number;
  initial?: ItemState;
  faultPlayAttempt?: {
    inputs: Array<'native-video-click' | 'focused-video-space'>;
    before: { paused: boolean; currentTime: number };
    after: { paused: boolean; currentTime: number } | null;
    trustedPlayEvent: boolean;
    observationMs: number;
    clickError?: string;
  };
  nativeError?: SelectedVideoEventRecord;
  faultOutcome?: ItemState;
  neighbor?: ItemState;
  returned?: ItemState;
  recovered?: ItemState;
  recoveredNeighbor?: ItemState;
  playback?: { before: number; after: number };
  attribution?: { failed: string; recovered: string };
  host?: {
    before: { scrollY: number; bodyStyle: string | null; activeTarget: string | null };
    firstClose: { scrollY: number; bodyStyle: string | null; activeTarget: string | null };
    after: { scrollY: number; bodyStyle: string | null; activeTarget: string | null };
  };
  document?: {
    before: { url: string; timeOrigin: number };
    after: { url: string; timeOrigin: number };
  };
  screenshot?: string;
  screenshotError?: string;
  error?: string;
  cleanup: {
    gateReleased: boolean;
    observerRemoved: boolean;
    routeRemoved: boolean;
    listenersRemoved: boolean;
    pageClosed: boolean;
    errors: string[];
  };
};
type SelectedVideoFailureEvidence = {
  status: 'pending' | 'passed' | 'failed';
  cases: SelectedVideoFailureCase[];
  requestCapPerCase: number;
  errors?: string[];
};
type StorageBefore = { exists: boolean; value: unknown };
type NativeDownload = {
  id: number;
  state: string;
  filename: string;
  url: string;
  finalUrl: string;
  error?: string;
};
type RecoveryRequest = {
  case: string;
  index: number;
  quality: string | undefined;
  atMonotonicMs: number;
  range: string | null;
  fulfilledAtMonotonicMs?: number;
};
type RecoveryEvent = {
  type: string;
  trusted: boolean;
  atPageMonotonicMs: number;
  source: string;
  attribute: string | null;
  error: number | null;
  time: number;
  paused: boolean;
  muted: boolean;
  volume: number;
  key: string | null;
};
type RecoveryEventState = {
  records: RecoveryEvent[];
  overflow: boolean;
  listeners: [string, EventListener][];
};
type RecoveryProtocol = {
  requests: Record<string, unknown>[];
  clientSecurity: Record<string, unknown>[];
  failures: Record<string, unknown>[];
  issues: Record<string, unknown>[];
  overflow: boolean;
};
type RecoveryCase = {
  name: string;
  id: string;
  status: string;
  best: string;
  lower: string;
  pageErrors: string[];
  requestFailures: { url: string; reason: string | undefined }[];
  consoleErrors: { text: string; location: string }[];
  networkProtocol: RecoveryProtocol;
  requestingDocumentTransport?: unknown;
  permission?: PermissionState;
  requestingFrame?: unknown;
  documentSecurity?: unknown;
  eventOverflow?: boolean;
  initialMetadata?: ItemState;
  beforePlay?: ItemState;
  playingOriginal?: ItemState;
  lowerRequestsBeforeTailRelease?: number;
  corruptTailReleaseStartedAtPageMonotonicMs?: number;
  corruptTailReleaseStartedAtMonotonicMs?: number;
  corruptTailReleasedAtMonotonicMs?: number;
  decodeError?: RecoveryEvent;
  pending?: ItemState | null;
  userPaused?: ItemState;
  userControls?: ItemState;
  pausedAfterMetadata?: { before: ItemState; after: ItemState; progress: number };
  pausedAfterReentry?: { before: ItemState; after: ItemState; progress: number };
  outsideBeforeMetadata?: ItemState;
  reenteredBeforeMetadata?: ItemState;
  pausedOutside?: { before: ItemState; after: ItemState; progress: number };
  reentered?: ItemState;
  resumed?: ItemState;
  nativeRequests?: ReturnType<NativeLoopback['since']>;
  expectedLifecycleAborts?: { url: string; reason: string | undefined }[];
  replacementPlayCount?: number;
  error?: string;
  failureState?: ItemState | null;
  mediaEvents?: { records: RecoveryEvent[]; overflow: boolean };
};
type RecoveryEvidence = {
  status: string;
  cases: RecoveryCase[];
  requests: RecoveryRequest[];
  prefixEnd: number;
  bestPayloadSha256: string;
  pausedObservationMs: number;
  maxMediaEvents: number;
  cleanup: {
    routesRemoved: boolean;
    pagesClosed: boolean;
    videoHoldReleased: boolean;
    fixturePermissionRestored: boolean;
    permissionSessionDetached: boolean;
    errors?: string[];
  };
  fixturePermission?: {
    name: string;
    origin: string;
    context: string;
    before: PermissionState;
    modified: boolean;
    after?: PermissionState;
  };
  browserVersion?: unknown;
  error?: string;
};
type RecoveryActive = { id: string; name: string; url: string; lowerGate: Promise<void> };
type GeometryDescriptor = {
  name: string;
  id: string;
  selected: number;
  direction: 'above' | 'below';
  viewport: { width: number; height: number };
  resize: { width: number; height: number };
};
type GeometryRequest = { case: string; index: number; atMonotonicMs: number; range: string | null };
type GeometryCase = GeometryDescriptor & {
  status: string;
  initial?: ItemState[];
  nearBefore?: ItemState;
  nearAfter?: ItemState;
  distant?: ItemState[];
  resized?: ItemState[];
  admittedAfterResize?: ItemState;
  reopenedNear?: ItemState;
  retiredRootDisconnected?: boolean;
  error?: string;
};
type GeometryEvidence = {
  status: string;
  cases: GeometryCase[];
  requests: GeometryRequest[];
  admissionDeadlineMs: number;
  distantObservationMs: number;
  cleanup: { routesRemoved: boolean; pagesClosed: boolean; errors?: string[] };
  error?: string;
};

declare global {
  interface Window {
    __xegRecoveryEventObservation?: RecoveryEventState;
    __xegSelectedVideoFailureObservation?: SelectedVideoPageObserver;
    __xegMetadataReadinessObservation?: MetadataReadinessObserver;
    __xegRangeMediaObservation?: {
      records: RangeMediaEvent[];
      overflow: boolean;
      dispose: () => void;
    };
  }
  interface Permissions {
    query(permissionDesc: { name: 'loopback-network' }): Promise<PermissionStatus>;
  }
}
declare const chrome: {
  storage: {
    local: {
      get(key: string): Promise<Record<string, unknown>>;
      set(values: Record<string, unknown>): Promise<void>;
      remove(key: string): Promise<void>;
    };
  };
  downloads: { search(query: Record<string, unknown>): Promise<NativeDownload[]> };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function field(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

const VIDEO_COUNT = 8;
const MAX_REQUESTS = 64;
const MAX_MP4_BYTES = 256 * 1024;
const SETTINGS_KEY = 'xeg-app-settings';

/** Exposed for browser-serialization regression coverage. */
export async function readAppliedVideoGallerySettings(extensionPage: Page): Promise<unknown> {
  const stored = await extensionPage.evaluate(async (key) => {
    const values = await chrome.storage.local.get(key);
    return values[key];
  }, SETTINGS_KEY);
  return field(stored, 'gallery');
}

const BAD_MP4 = Buffer.from('controlled invalid MP4 bytes for decode recovery');
const POSTER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl4bRkAAAAASUVORK5CYII=',
  'base64'
);

function videoUrl(tweetId: string, index: number, quality = 'best') {
  return `https://video.twimg.com/ext_tw_video/${tweetId}/pu/vid/320x180/video-${index}-${quality}.mp4`;
}

function posterUrl(tweetId: string, index: number) {
  return `https://pbs.twimg.com/ext_tw_video_thumb/${tweetId}/pu/img/video-${index}.png`;
}

function fixtureHtml(tweetId: string, handle: string, count = VIDEO_COUNT, height = 180) {
  const description =
    count === 1
      ? 'One deterministic video variant'
      : count === 2
        ? 'Two deterministic video variants'
        : 'Eight deterministic video variants';
  const players = Array.from(
    { length: count },
    (_, index) => `
    <div data-testid="videoPlayer" class="player" data-fixture-index="${index}">
      <div data-testid="previewInterstitial"><img tabindex="0" data-video-target="${index}"
        src="${posterUrl(tweetId, index)}" alt="Video ${index + 1} preview" width="320" height="${height}"></div>
      <video controls poster="${posterUrl(tweetId, index)}" width="320" height="${height}"></video>
    </div>`
  ).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Installed video loading fixture</title><style>
      body{margin:0;padding:20px;background:#000;color:#e7e9ea;font:16px Segoe UI,sans-serif}
      #spacer{height:900px}.player{display:inline-block;position:relative;width:320px;height:${height}px;margin:8px}
      .player img{display:block;width:320px;height:${height}px}.player video{display:none}
    </style></head><body style="--xeg-fixture-host-state: retained;"><div id="spacer" aria-hidden="true"></div><main>
    <article data-testid="tweet"><a href="/${handle}/status/${tweetId}"><time>Video fixture</time></a>
    <div data-testid="tweetText">${description}</div>${players}
    </article></main></body></html>`;
}

function apiResponse(tweetId: string, handle: string, count = VIDEO_COUNT, height = 180) {
  const description =
    count === 1
      ? 'One deterministic video variant'
      : count === 2
        ? 'Two deterministic video variants'
        : 'Eight deterministic video variants';
  const media = Array.from({ length: count }, (_, index) => ({
    type: 'video',
    id_str: `${tweetId}${index}`,
    media_key: `7_${tweetId}${index}`,
    media_url_https: posterUrl(tweetId, index),
    expanded_url: `https://x.com/${handle}/status/${tweetId}/video/${index + 1}`,
    original_info: { width: 320, height },
    video_info: {
      aspect_ratio: height === 180 ? [16, 9] : [5, 3],
      variants: [
        { content_type: 'video/mp4', bitrate: 832000, url: videoUrl(tweetId, index) },
        ...(index === 0
          ? [{ content_type: 'video/mp4', bitrate: 256000, url: videoUrl(tweetId, index, 'lower') }]
          : []),
      ],
    },
  }));
  return {
    data: {
      tweetResult: {
        result: {
          __typename: 'Tweet',
          rest_id: tweetId,
          core: {
            user_results: {
              result: { rest_id: tweetId, legacy: { screen_name: handle, name: handle } },
            },
          },
          legacy: {
            id_str: tweetId,
            full_text: description,
            extended_entities: { media },
          },
        },
      },
    },
  };
}

async function waitForValue<T>(
  readValue: () => Promise<T | undefined>,
  description: string,
  timeoutMs = 15_000
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let value: T | undefined;
  do {
    value = await readValue();
    if (value !== undefined) {
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  } while (Date.now() < deadline);
  throw new Error(`Timed out waiting for ${description}: ${JSON.stringify(value)}`);
}

async function itemState(page: Page, index: number) {
  return page.evaluate((itemIndex) => {
    const gallery = document.querySelector('[data-xeg-gallery-container]');
    const root = gallery?.querySelector('[data-gallery-element="items"]');
    const item = root?.querySelector(`[data-gallery-element="item"][data-index="${itemIndex}"]`);
    const video = item?.querySelector('video');
    if (
      !(root instanceof HTMLElement) ||
      !(item instanceof HTMLElement) ||
      !(video instanceof HTMLVideoElement)
    ) {
      return null;
    }
    const rect = item.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    return {
      index: itemIndex,
      admitted: item.getAttribute('data-video-admitted'),
      metadata: item.getAttribute('data-media-loaded'),
      firstFrame: item.getAttribute('data-video-first-frame'),
      displayUrl: item.getAttribute('data-media-display-url'),
      src: video.getAttribute('src'),
      currentSrc: video.currentSrc,
      preload: video.preload,
      controls: video.controls,
      error: video.error?.code ?? null,
      readyState: video.readyState,
      networkState: video.networkState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      currentTime: video.currentTime,
      duration: video.duration,
      ended: video.ended,
      paused: video.paused,
      muted: video.muted,
      volume: video.volume,
      seeking: video.seeking,
      currentIndex: Number(
        gallery
          ?.querySelector('[data-gallery-element="toolbar"]')
          ?.getAttribute('data-current-index')
      ),
      focusedIndex: Number(
        gallery
          ?.querySelector('[data-gallery-element="toolbar"]')
          ?.getAttribute('data-focused-index')
      ),
      box: { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
      viewport: {
        top: rootRect.top,
        bottom: rootRect.bottom,
        height: rootRect.height,
        clientHeight: root.clientHeight,
        scrollTop: root.scrollTop,
      },
    };
  }, index);
}

function assertBestSource(value: ItemState | null | undefined, bestUrl: string) {
  assert.equal(value?.displayUrl, bestUrl, 'The canonical display source changed');
}

/**
 * Exercise the installed extension against one routed X page. The caller owns
 * page/context/profile/output/download-directory lifetimes and supplies an
 * existing small playable MP4 in videoPayloads (quote-one is preferred).
 * Install the profile's fail-closed base routes before calling this helper;
 * unmatched URLs fall through to those routes. Page routes observe display
 * playback only. The HTTPS loopback separately serves native browser downloads.
 */
export async function runVideoLoadingProfile({
  context,
  page,
  extensionPage,
  fixtureUrl,
  tweetId,
  videoPayloads,
  downloads,
  output,
  nativeLoopback,
  root,
}: {
  context: BrowserContext;
  page: Page;
  extensionPage: Page;
  fixtureUrl: string;
  tweetId: string;
  videoPayloads: Record<string, Buffer>;
  downloads: string;
  output: string;
  nativeLoopback: NativeLoopback;
  root: string;
}) {
  const url = new URL(fixtureUrl);
  const match = /^\/([A-Za-z0-9_]{1,15})\/status\/([1-9]\d{0,19})$/u.exec(url.pathname);
  assert.equal(url.origin, 'https://x.com');
  assert(
    match && match[2] === tweetId && !url.search && !url.hash,
    'Fixture URL must bind the synthetic tweet ID'
  );
  const handle = match[1];
  assert(handle);
  const validMp4 = videoPayloads['quote-one'] ?? videoPayloads.valid;
  assert(
    Buffer.isBuffer(validMp4) && validMp4.length > 0 && validMp4.length <= MAX_MP4_BYTES,
    'An existing playable MP4 at most 256 KiB is required'
  );
  assert(
    BAD_MP4.length > 0 && BAD_MP4.length <= MAX_MP4_BYTES,
    'The controlled invalid MP4 exceeds the native fixture cap'
  );
  assert(downloads && output, 'Native byte and failure evidence paths are required');
  assert(
    nativeLoopback &&
      typeof nativeLoopback.setRecoveryPayloads === 'function' &&
      typeof nativeLoopback.mark === 'function' &&
      typeof nativeLoopback.since === 'function' &&
      typeof nativeLoopback.snapshot === 'function',
    'The HTTPS native download loopback is required'
  );
  nativeLoopback.setRecoveryPayloads({ tweetId, validMp4, badMp4: BAD_MP4 });
  const badSha256 = createHash('sha256').update(BAD_MP4).digest('hex');
  const bestUrl = videoUrl(tweetId, 0);
  const lowerUrl = videoUrl(tweetId, 0, 'lower');
  const records: VideoRecords = { api: [], video: [], unexpectedVideo: [], overflow: 0 };
  const observation: VideoObservation = {
    fixtureUrl,
    tweetId,
    expectedVideoCount: VIDEO_COUNT,
    canonicalBest: bestUrl,
    playableFallback: lowerUrl,
    requests: records,
    checks: [],
    timingsMs: {},
    cleanup: { routeRemoved: false, settingsRestored: false, viewportRestored: false },
  };
  const viewportBefore = page.viewportSize();
  assert(viewportBefore, 'The owned page must have an explicit viewport');
  let releaseBest: () => void = () => {};
  const bestGate = new Promise<void>((resolve) => {
    releaseBest = resolve;
  });
  let releaseLower: () => void = () => {};
  const lowerGate = new Promise<void>((resolve) => {
    releaseLower = resolve;
  });
  let settingsBefore: StorageBefore | undefined;
  let settingsChanged = false;
  let primaryError: unknown;
  let caughtPrimaryError = false;
  let cleanupError: AggregateError | undefined;
  const routeHandler = async (route: Route) => {
    const request = route.request();
    const target = new URL(request.url());
    if (request.isNavigationRequest() && request.url() === fixtureUrl) {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: fixtureHtml(tweetId, handle),
      });
      return;
    }
    if (target.hostname === 'x.com' && target.pathname.endsWith('/TweetResultByRestId')) {
      let requestedId: unknown;
      try {
        requestedId = field(JSON.parse(target.searchParams.get('variables') ?? '{}'), 'tweetId');
      } catch {
        requestedId = undefined;
      }
      if (requestedId === tweetId) {
        if (records.api.length < MAX_REQUESTS) {
          records.api.push({ requestedId, method: request.method() });
        } else {
          records.overflow++;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(apiResponse(tweetId, handle)),
        });
        return;
      }
    }
    if (
      target.hostname === 'pbs.twimg.com' &&
      target.pathname.startsWith(`/ext_tw_video_thumb/${tweetId}/pu/img/video-`)
    ) {
      await route.fulfill({ status: 200, contentType: 'image/png', body: POSTER_PNG });
      return;
    }
    if (target.hostname === 'video.twimg.com') {
      const matched = new RegExp(
        `^/ext_tw_video/${tweetId}/pu/vid/320x180/video-([0-7])-(best|lower)\\.mp4$`,
        'u'
      ).exec(target.pathname);
      if (!matched || (matched[2] === 'lower' && matched[1] !== '0')) {
        if (records.unexpectedVideo.length < MAX_REQUESTS) {
          records.unexpectedVideo.push(target.pathname);
        } else {
          records.overflow++;
        }
        await route.fulfill({ status: 403, body: '' });
        return;
      }
      const index = Number(matched[1]);
      const quality = matched[2];
      const record: VideoRequest = {
        index,
        quality,
        resourceType: request.resourceType(),
        atMs: performance.now(),
        range: request.headers().range ?? null,
        status: null,
      };
      if (records.video.length < MAX_REQUESTS) {
        records.video.push(record);
      } else {
        records.overflow++;
      }
      if (index === 0 && quality === 'best') {
        await bestGate;
      }
      if (quality === 'lower') {
        await lowerGate;
      }
      const payload = index === 0 && quality === 'best' ? BAD_MP4 : validMp4;
      const range = /^bytes=(\d+)-(\d*)$/u.exec(request.headers().range ?? '');
      const start = range ? Number(range[1]) : 0;
      const end = Math.min(range?.[2] ? Number(range[2]) : payload.length - 1, payload.length - 1);
      if (start >= payload.length || end < start) {
        record.status = 416;
        await route.fulfill({
          status: 416,
          headers: { 'Content-Range': `bytes */${payload.length}` },
        });
        return;
      }
      const bytes = payload.subarray(start, end + 1);
      record.status = range ? 206 : 200;
      await route.fulfill({
        status: record.status,
        contentType: 'video/mp4',
        body: bytes,
        headers: {
          'Access-Control-Allow-Origin': 'https://x.com',
          'Access-Control-Allow-Credentials': 'true',
          'Accept-Ranges': 'bytes',
          'Content-Length': String(bytes.length),
          ...(range ? { 'Content-Range': `bytes ${start}-${end}/${payload.length}` } : {}),
        },
      });
      return;
    }
    await route.fallback();
  };
  await context.route('**/*', routeHandler);
  try {
    await page.setViewportSize({ width: 1280, height: 500 });
    observation.viewport = { width: 1280, height: 500 };
    settingsBefore = await extensionPage.evaluate(async (key) => {
      const values = await chrome.storage.local.get(key);
      return { exists: Object.hasOwn(values, key), value: values[key] ?? null };
    }, SETTINGS_KEY);
    const previous = settingsBefore.value;
    const previousSettings = isRecord(previous) ? previous : null;
    const value = {
      ...(previousSettings ?? { version: '1' }),
      gallery: {
        ...(isRecord(previousSettings?.gallery) ? previousSettings.gallery : {}),
        videoClickMode: 'allow-all',
        preloadCount: 20,
      },
      lastModified: Date.now(),
      __schemaHash: '1',
    };
    await extensionPage.evaluate(
      async ({ key, value }) => {
        await chrome.storage.local.set({ [key]: value });
      },
      { key: SETTINGS_KEY, value }
    );
    settingsChanged = true;
    const applied = await readAppliedVideoGallerySettings(extensionPage);
    assert.equal(field(applied, 'videoClickMode'), 'allow-all');
    assert.equal(field(applied, 'preloadCount'), 20);

    await page.goto(fixtureUrl);
    const trigger = page.locator('[data-video-target="0"]');
    await trigger.scrollIntoViewIfNeeded();
    const beforeHost = await page.evaluate(() => ({
      scrollY,
      bodyStyle: document.body.getAttribute('style'),
    }));
    const openStartedAtMs = performance.now();
    await trigger.click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    await waitForValue(
      async () =>
        Number(await gallery.locator('#xeg-toolbar-counter').getAttribute('data-total')) ===
        VIDEO_COUNT
          ? true
          : undefined,
      'eight production gallery entries'
    );
    assert.equal(await gallery.locator('[data-gallery-element="item"]').count(), VIDEO_COUNT);
    assert(
      records.api.length > 0 && records.api.every(({ requestedId }) => requestedId === tweetId),
      'The gallery did not use the routed synthetic tweet API'
    );
    await waitForValue(
      async () => ((await itemState(page, 0))?.src === bestUrl ? true : undefined),
      'active video source to attach before transport settlement'
    );
    observation.initial = await itemState(page, 0);
    assert(observation.initial);
    observation.timingsMs.activeSourceAttached = performance.now() - openStartedAtMs;
    assert.equal(observation.initial.admitted, 'true');
    assert.equal(observation.initial.preload, 'metadata');
    assertBestSource(observation.initial, bestUrl);
    observation.checks.push('active-video-source-attaches-before-response');
    releaseBest();
    await waitForValue(
      async () =>
        records.video.some((record) => record.index === 0 && record.quality === 'lower')
          ? true
          : undefined,
      'unsupported best MP4 to request the same-item lower variant'
    );
    const beforeRecovery = await itemState(page, 0);
    assert(beforeRecovery);
    assertBestSource(beforeRecovery, bestUrl);
    assert.equal(beforeRecovery.controls, true);
    const distant = [];
    for (let index = 1; index < VIDEO_COUNT; index++) {
      const state = await itemState(page, index);
      assert(state, `Missing video item ${index}`);
      if (
        state.box.top > state.viewport.bottom + state.viewport.height ||
        state.box.bottom < state.viewport.top - state.viewport.height
      ) {
        assert.equal(state.admitted, 'false', `Distant video ${index} was admitted`);
        assert.equal(state.src, null, `Distant video ${index} attached a source`);
        assert.equal(state.preload, 'none', `Distant video ${index} has an active preload hint`);
        distant.push(index);
      }
    }
    assert(distant.length > 0, 'Fixture did not produce geometrically distant videos');
    await page.waitForTimeout(800);
    assert(
      distant.every((index) => records.video.every((record) => record.index !== index)),
      'A geometrically distant video requested its URL before activation'
    );
    observation.distantBeforeActivation = distant;
    observation.beforeRecovery = beforeRecovery;
    observation.checks.push('distant-video-urls-absent-with-preload-count-20');

    const lowerReleasedAtMs = performance.now();
    releaseLower();
    await page.waitForFunction(
      () => {
        const item = document.querySelector(
          '[data-xeg-gallery-container] [data-gallery-element="item"][data-index="0"]'
        );
        const video = item?.querySelector('video');
        return (
          item?.getAttribute('data-media-loaded') === 'true' &&
          video instanceof HTMLVideoElement &&
          video.readyState >= 1 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          !video.error
        );
      },
      null,
      { timeout: 20_000 }
    );
    observation.metadata = await itemState(page, 0);
    assert(observation.metadata);
    observation.timingsMs.metadataAfterLowerRelease = performance.now() - lowerReleasedAtMs;
    assert.equal(observation.metadata.controls, true);
    observation.checks.push('metadata-ready-with-native-controls');
    await page.waitForFunction(
      () => {
        const item = document.querySelector(
          '[data-xeg-gallery-container] [data-gallery-element="item"][data-index="0"]'
        );
        const video = item?.querySelector('video');
        return (
          item?.getAttribute('data-media-loaded') === 'true' &&
          item.getAttribute('data-video-first-frame') === 'true' &&
          video instanceof HTMLVideoElement &&
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          !video.error
        );
      },
      null,
      { timeout: 20_000 }
    );
    const recovered = await itemState(page, 0);
    assert(recovered);
    observation.timingsMs.firstFrameAfterLowerRelease = performance.now() - lowerReleasedAtMs;
    assertBestSource(recovered, bestUrl);
    assert.equal(recovered.currentSrc, lowerUrl);
    assert.equal(recovered.metadata, 'true');
    assert.equal(recovered.firstFrame, 'true');
    assert.equal(recovered.videoWidth, 320);
    assert.equal(recovered.videoHeight, 180);
    assert.equal(recovered.error, null);
    assert.equal(recovered.controls, true);
    assert(
      Math.abs(recovered.box.width - beforeRecovery.box.width) <= 1 &&
        Math.abs(recovered.box.height - beforeRecovery.box.height) <= 1,
      'Logical video dimensions changed during recovery'
    );
    const hint = (await gallery.locator('[role="status"]').allTextContents())
      .map((value) => value.trim())
      .find((value) => value.length > 0);
    assert(
      hint && !hint.includes('msg.gal.video.playbackFallback'),
      'Localized playback substitution hint is missing'
    );
    const start = recovered.currentTime;
    await gallery.locator('[data-gallery-element="item"][data-index="0"] video').click();
    await page.waitForFunction(
      (time) => {
        const video = document.querySelector(
          '[data-xeg-gallery-container] [data-gallery-element="item"][data-index="0"] video'
        );
        return (
          video instanceof HTMLVideoElement && !video.paused && video.currentTime > time + 0.15
        );
      },
      start,
      { timeout: 15_000 }
    );
    observation.recovered = {
      ...recovered,
      playbackEnd: (await itemState(page, 0))?.currentTime ?? recovered.currentTime,
      hint,
    };
    await page.screenshot({ path: join(output, 'video-recovery-gallery.png') });
    observation.checks.push('same-item-recovery-metadata-first-frame-playback-and-geometry');

    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').focus();
    await page.keyboard.press('ArrowRight');
    await waitForValue(
      async () =>
        Number(await gallery.locator('#xeg-toolbar-counter').getAttribute('data-position')) === 2
          ? true
          : undefined,
      'keyboard-selected second video'
    );
    await waitForValue(
      async () => ((await itemState(page, 1))?.src === videoUrl(tweetId, 1) ? true : undefined),
      'keyboard-selected video source'
    );
    observation.keyboard = await itemState(page, 1);
    assert(observation.keyboard);
    assert.equal(observation.keyboard.admitted, 'true');
    assert.equal(observation.keyboard.src, videoUrl(tweetId, 1));
    observation.checks.push('keyboard-selection-attaches-source');

    await page.keyboard.press('ArrowLeft');
    await waitForValue(
      async () =>
        Number(await gallery.locator('#xeg-toolbar-counter').getAttribute('data-position')) === 1
          ? true
          : undefined,
      'returned best-source selection'
    );
    const canonical = await itemState(page, 0);
    assert(canonical);
    assertBestSource(canonical, bestUrl);
    assert.equal(canonical.currentSrc, lowerUrl);
    assert.equal(records.overflow, 0);
    assert.deepEqual(records.unexpectedVideo, []);
    assert(
      records.video.filter((record) => record.index === 0 && record.quality === 'best').length >= 1
    );
    assert(
      records.video.filter((record) => record.index === 0 && record.quality === 'lower').length >= 1
    );
    assert(
      records.video.every(({ status }) => status === 200 || status === 206 || status === 416),
      'The decode fixture must not turn an HTTP denial into playback fallback evidence'
    );

    const knownIds = new Set(
      (await extensionPage.evaluate(() => chrome.downloads.search({}))).map(({ id }) => id)
    );
    const nativeMark = nativeLoopback.mark();
    const nativeBaseline = nativeLoopback.snapshot();
    assert(
      Number.isSafeInteger(nativeMark) && nativeMark >= 0,
      'Native loopback marker must identify the pre-download event boundary'
    );
    const nativeStartedAtMs = performance.now();
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
    const native = await waitForValue(
      async () => {
        const matches = (await extensionPage.evaluate(() => chrome.downloads.search({}))).filter(
          (item) => !knownIds.has(item.id)
        );
        assert(matches.length <= 1, 'More than one native download began');
        if (matches[0]?.state === 'interrupted') {
          throw new Error(
            `Canonical best MP4 native download interrupted: ${matches[0].error ?? 'unknown'}`
          );
        }
        return matches[0]?.state === 'complete' ? matches[0] : undefined;
      },
      'canonical best MP4 native download',
      30_000
    );
    observation.timingsMs.nativeBestCompletion = performance.now() - nativeStartedAtMs;
    const expectedName = `${handle}_${tweetId}_0.mp4`;
    assert.equal(basename(native.filename), expectedName);
    assert.equal(
      native.state,
      'complete',
      'Native browser download did not reach terminal success'
    );
    assert.equal(native.url, bestUrl, 'Native download started from a different source URL');
    assert.equal(native.finalUrl, bestUrl, 'Native final URL differs from the canonical best MP4');
    assert(
      Number.isSafeInteger(native.id) && !knownIds.has(native.id),
      'Native browser download ID was not newly created for this action'
    );
    const served = await waitForValue(async () => {
      const snapshot = nativeLoopback.snapshot();
      assert(!snapshot.overflow, 'Native loopback request records overflowed');
      assert.equal(
        snapshot.unexpectedCount,
        nativeBaseline.unexpectedCount,
        'Native loopback saw an unexpected request after the action'
      );
      const later = nativeLoopback.since(nativeMark);
      assert(Array.isArray(later), 'Native loopback since(marker) must return bounded events');
      assert(
        later.every(
          (event) =>
            ['video.twimg.com', 'video.twimg.com:443'].includes(event.host) &&
            event.path === new URL(bestUrl).pathname
        ),
        'Native loopback served a noncanonical recovery URL after the action'
      );
      return later.find(
        (event) =>
          event.result === 'served' && event.bytes === BAD_MP4.length && event.sha256 === badSha256
      );
    }, 'native HTTPS loopback to serve the canonical best MP4');
    const relativeFile = relative(resolve(downloads), resolve(native.filename));
    assert(
      relativeFile && !relativeFile.startsWith('..') && !isAbsolute(relativeFile),
      'Native file escaped the task-owned download directory'
    );
    const file = await readExactDownloadFile(native.filename, BAD_MP4.length);
    assert(
      file.bytes.equals(BAD_MP4),
      'Native file differs from canonical best MP4 transport bytes'
    );
    const fileSha256 = createHash('sha256').update(file.bytes).digest('hex');
    assert.equal(fileSha256, badSha256, 'Native file digest differs from served best MP4 bytes');
    await writeFile(join(output, 'video-recovery-current.mp4'), file.bytes, { flag: 'wx' });
    observation.download = {
      id: native.id,
      loopback: served,
      finalUrl: native.finalUrl,
      filename: expectedName,
      bytes: file.bytes.length,
      sha256: fileSha256,
      file: 'video-recovery-current.mp4',
      expectedDecode: 'invalid-controlled-best-bytes',
    };
    observation.checks.push('native-download-retains-canonical-best-bytes');

    const knownBeforeZip = new Set(
      (await extensionPage.evaluate(() => chrome.downloads.search({}))).map(({ id }) => id)
    );
    const zipStartedAtMs = performance.now();
    await gallery
      .locator(
        '[data-gallery-element="toolbar"] button[aria-label="Download 8 shown files as ZIP"]'
      )
      .click();
    const zip = await waitForValue(
      async () => {
        const matches = (await extensionPage.evaluate(() => chrome.downloads.search({}))).filter(
          (item) => !knownBeforeZip.has(item.id)
        );
        assert(matches.length <= 1, 'More than one native ZIP download began');
        if (matches[0]?.state === 'interrupted') {
          throw new Error(
            `Canonical video ZIP download interrupted: ${matches[0].error ?? 'unknown'}`
          );
        }
        return matches[0]?.state === 'complete' ? matches[0] : undefined;
      },
      'canonical video ZIP native download',
      30_000
    );
    const expectedEntries = Array.from({ length: VIDEO_COUNT }, (_, index) => ({
      filename: `${handle}_${tweetId}_${index}.mp4`,
      bytes: index === 0 ? BAD_MP4 : validMp4,
    }));
    assert.equal(basename(zip.filename), `${handle}_${tweetId}.zip`);
    const zipRelativeFile = relative(resolve(downloads), resolve(zip.filename));
    assert(
      zipRelativeFile && !zipRelativeFile.startsWith('..') && !isAbsolute(zipRelativeFile),
      'Video ZIP escaped the task-owned download directory'
    );
    const zipFile = await readExactDownloadFile(
      zip.filename,
      expectedStoredZipBytes(expectedEntries)
    );
    const verified = verifyStoredZip(zipFile.bytes, expectedEntries);
    await writeFile(join(output, 'video-recovery.zip'), zipFile.bytes, { flag: 'wx' });
    observation.zip = {
      id: zip.id,
      filename: basename(zip.filename),
      bytes: zipFile.bytes.length,
      sha256: createHash('sha256').update(zipFile.bytes).digest('hex'),
      file: 'video-recovery.zip',
      verified,
      firstEntrySource: bestUrl,
      firstEntryDecode: 'invalid-controlled-best-bytes',
    };
    observation.timingsMs.zipCompletion = performance.now() - zipStartedAtMs;
    observation.checks.push(
      'zip-retains-canonical-best-bytes-order-and-crc-after-playback-fallback'
    );

    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    const afterHost = await page.evaluate(() => ({
      scrollY,
      bodyStyle: document.body.getAttribute('style'),
    }));
    observation.hostRestoration = { before: beforeHost, after: afterHost };
    assert.deepEqual(
      afterHost,
      beforeHost,
      'Gallery close did not restore host scroll and inline style'
    );
    observation.checks.push('host-scroll-and-style-restored');
    const followupErrors: unknown[] = [];
    observation.selectedFailures = {
      status: 'pending',
      cases: [],
      requestCapPerCase: 16,
    };
    try {
      await runSelectedVideoFailureCases({
        context,
        validMp4,
        output,
        evidence: observation.selectedFailures,
      });
    } catch (error) {
      followupErrors.push(error);
    }
    try {
      observation.geometry = await runAdmissionGeometryCases({ context, validMp4, output });
    } catch (error) {
      followupErrors.push(error);
    }
    let recoveryMp4: Buffer | undefined;
    try {
      recoveryMp4 = await readFile(join(root, 'test/e2e/fixtures/installed-recovery-intent.mp4'));
      const adjacentMp4 = videoPayloads['quote-two'];
      assert(Buffer.isBuffer(adjacentMp4) && adjacentMp4.length === 3086);
      observation.rangeDiagnostics = await runRangeAbortDiagnostics({
        context,
        validMp4: recoveryMp4,
        adjacentMp4,
        nativeLoopback,
        output,
      });
    } catch (error) {
      followupErrors.push(error);
    }
    try {
      assert(recoveryMp4, 'The declared recovery media fixture is missing');
      observation.recoveryIntent = await runRecoveryIntentCases({
        context,
        validMp4: recoveryMp4,
        auxiliaryMp4: validMp4,
        output,
        nativeLoopback,
      });
    } catch (error) {
      followupErrors.push(error);
    }
    observation.metadataReadiness = {
      status: 'pending',
      fixtureUrl: `https://x.com/intentrecovery/status/${METADATA_READINESS_ID}`,
      bestUrl: videoUrl(METADATA_READINESS_ID, 0),
      assetSha256: 'd4ac575d4f6ce11458e61f948fab6becd37ae5530afc66db7141dcdde012e8a2',
      prefixEnd: 32768,
      api: [],
      protocol: [],
      transfer: [],
      timing: {},
      stateSamples: [],
      frameDiagnostics: {
        supported: null,
        callbacks: [],
        overflow: false,
        snapshots: [],
        errors: [],
        cleanup: { mutationObserverDisconnected: false, frameCallbackCanceled: false },
      },
      mediaDiagnostics: {
        players: [],
        matchedPlayers: [],
        records: [],
        overflow: false,
        enabled: false,
      },
      events: [],
      screenshots: [],
      pageErrors: [],
      consoleErrors: [],
      overflow: false,
      cleanup: {
        videoHoldReleased: false,
        observerRemoved: false,
        routeRemoved: false,
        listenersRemoved: false,
        protocolDetached: false,
        pageClosed: false,
        errors: [],
      },
    };
    try {
      await runMetadataReadinessCase({
        context,
        root,
        output,
        nativeLoopback,
        evidence: observation.metadataReadiness,
      });
    } catch (error) {
      followupErrors.push(error);
    }
    if (followupErrors.length) {
      throw new AggregateError(
        followupErrors,
        'Required video failure, admission, range abort, recovery intent, or metadata readiness cases failed'
      );
    }
  } catch (error) {
    caughtPrimaryError = true;
    primaryError = error;
    observation.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    await page.screenshot({ path: join(output, 'video-loading-failure.png') }).catch(() => {});
    await writeFile(
      join(output, 'video-loading-failure.json'),
      JSON.stringify(observation, null, 2)
    ).catch(() => {});
  } finally {
    releaseBest();
    releaseLower();
    const cleanupFailures: unknown[] = [];
    try {
      await context.unroute('**/*', routeHandler);
      observation.cleanup.routeRemoved = true;
    } catch (error) {
      cleanupFailures.push(error);
      observation.cleanup.routeError = String(error);
    }
    if (settingsChanged) {
      try {
        assert(settingsBefore);
        const restored = await restoreStoredVideoSettings(extensionPage, settingsBefore);
        assert(restored, 'Task-owned gallery settings were not restored');
        observation.cleanup.settingsRestored = true;
      } catch (error) {
        cleanupFailures.push(error);
        observation.cleanup.settingsError = String(error);
      }
    } else {
      observation.cleanup.settingsRestored = true;
    }
    try {
      await page.setViewportSize(viewportBefore);
      observation.cleanup.viewportRestored = true;
    } catch (error) {
      cleanupFailures.push(error);
      observation.cleanup.viewportError = String(error);
    }
    if (caughtPrimaryError || cleanupFailures.length) {
      await writeFile(
        join(output, 'video-loading-failure.json'),
        JSON.stringify(observation, null, 2)
      ).catch(() => {});
    }
    if (cleanupFailures.length) {
      cleanupError = new AggregateError(
        caughtPrimaryError ? [primaryError, ...cleanupFailures] : cleanupFailures,
        'Video loading assertion and/or task-owned cleanup failed'
      );
    }
  }
  if (cleanupError) {
    throw cleanupError;
  }
  if (caughtPrimaryError) {
    throw primaryError;
  }
  return observation;
}

type RangeProtocolRecord = {
  requestId: string;
  url: string;
  range: string | null;
  status: number | null;
  startedAt: number;
  responseAt?: number;
  terminal?: 'finished' | 'failed';
  terminalAt?: number;
  errorText?: string;
  canceled?: boolean;
};
type RangeMediaEvent = {
  type: string;
  trusted: boolean;
  currentTime: number;
  atMs: number;
};

async function nativeSeekPoint(
  protocol: CDPSession,
  page: Page,
  video: ReturnType<Page['locator']>,
  fraction: number
) {
  assert(fraction > 0 && fraction < 1, 'Native seek fraction must be inside the timeline');
  await page.bringToFront();
  await video.scrollIntoViewIfNeeded();
  const videoBox = await video.boundingBox();
  assert(videoBox && videoBox.width > 0 && videoBox.height > 0);
  await page.mouse.move(videoBox.x + videoBox.width / 2, videoBox.y + videoBox.height - 12);
  const host = await video.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    return {
      visible: document.visibilityState === 'visible',
      hit: document.elementFromPoint(x, y) === element,
      width: rect.width,
      height: rect.height,
    };
  });
  assert(host.visible && host.hit && host.width > 0 && host.height > 0);
  await protocol.send('DOM.enable');
  const documentNode = await protocol.send('DOM.getDocument', { depth: 0 });
  const found = await protocol.send('DOM.querySelectorAll', {
    nodeId: documentNode.root.nodeId,
    selector: '[data-xeg-gallery-container] [data-gallery-element="item"][data-index="0"] video',
  });
  assert.equal(found.nodeIds.length, 1, 'Expected one selected native video');
  const described = await protocol.send('DOM.describeNode', {
    nodeId: found.nodeIds[0]!,
    depth: 10,
    pierce: true,
  });
  assert.equal(described.node.nodeName, 'VIDEO');
  type CdpNode = typeof described.node;
  const candidates: Array<{ node: CdpNode; label: string }> = [];
  const visit = (node: CdpNode, native: boolean, depth: number) => {
    assert(depth <= 12 && candidates.length <= 16, 'Native seek discovery exceeded its bound');
    const owned = native || node.shadowRootType === 'user-agent';
    const attributes = node.attributes ?? [];
    const label = [node.nodeName, ...attributes].join(' ').toLowerCase();
    if (owned && /timeline|seek|scrub/u.test(label)) {
      candidates.push({ node, label: label.slice(0, 180) });
    }
    for (const child of node.children ?? []) {
      visit(child, owned, depth + 1);
    }
    for (const shadow of node.shadowRoots ?? []) {
      visit(shadow, owned, depth + 1);
    }
  };
  visit(described.node, false, 0);
  const descendantIds = (node: CdpNode): Set<number> => {
    const ids = new Set<number>();
    const append = (current: CdpNode) => {
      ids.add(current.backendNodeId);
      for (const child of current.children ?? []) {
        append(child);
      }
      for (const shadow of current.shadowRoots ?? []) {
        append(shadow);
      }
    };
    append(node);
    return ids;
  };
  for (const candidate of candidates) {
    const box = await protocol
      .send('DOM.getBoxModel', { backendNodeId: candidate.node.backendNodeId })
      .catch(() => null);
    if (!box) {
      continue;
    }
    const border = box.model.border;
    const left = Math.min(border[0]!, border[2]!, border[4]!, border[6]!);
    const right = Math.max(border[0]!, border[2]!, border[4]!, border[6]!);
    const top = Math.min(border[1]!, border[3]!, border[5]!, border[7]!);
    const bottom = Math.max(border[1]!, border[3]!, border[5]!, border[7]!);
    if (right - left < 20 || bottom - top < 4) {
      continue;
    }
    const x = Math.round(left + (right - left) * fraction);
    const y = Math.round((top + bottom) / 2);
    if (
      x < videoBox.x ||
      x > videoBox.x + videoBox.width ||
      y < videoBox.y ||
      y > videoBox.y + videoBox.height
    ) {
      continue;
    }
    const viewport = await page.evaluate(() => ({
      scrollX,
      scrollY,
      width: innerWidth,
      height: innerHeight,
      scale: visualViewport?.scale ?? 1,
      offsetLeft: visualViewport?.offsetLeft ?? 0,
      offsetTop: visualViewport?.offsetTop ?? 0,
    }));
    assert.equal(viewport.scale, 1, 'Native control hit-test assumes unzoomed desktop viewport');
    assert.equal(viewport.offsetLeft, 0);
    assert.equal(viewport.offsetTop, 0);
    assert(x >= 0 && x < viewport.width && y >= 0 && y < viewport.height);
    const documentX = Math.round(x + viewport.scrollX);
    const documentY = Math.round(y + viewport.scrollY);
    const [hit, hostHit] = await Promise.all([
      protocol.send('DOM.getNodeForLocation', {
        x: documentX,
        y: documentY,
        includeUserAgentShadowDOM: true,
      }),
      protocol.send('DOM.getNodeForLocation', {
        x: documentX,
        y: documentY,
        includeUserAgentShadowDOM: false,
      }),
    ]);
    if (
      hostHit.backendNodeId === described.node.backendNodeId &&
      descendantIds(candidate.node).has(hit.backendNodeId)
    ) {
      return {
        x,
        y,
        fraction,
        documentX,
        documentY,
        viewport,
        label: candidate.label,
        backendNodeId: hit.backendNodeId,
        host,
      };
    }
  }
  throw new Error(
    `Native seek control was not hit-tested: ${JSON.stringify(candidates.map(({ label }) => label))}`
  );
}

async function runRangeAbortDiagnostics({
  context,
  validMp4,
  adjacentMp4,
  nativeLoopback,
  output,
}: {
  context: BrowserContext;
  validMp4: Buffer;
  adjacentMp4: Buffer;
  nativeLoopback: NativeLoopback;
  output: string;
}) {
  assert.equal(validMp4.length, 207662, 'The declared four-second range fixture changed');
  assert.equal(adjacentMp4.length, 3086, 'The declared adjacent video fixture changed');
  // ffprobe places the 3.5 s packet at byte 183130. The held first A response
  // has valid metadata/early frames; B is a separate small, owned attachment.
  const prefixEnd = 183130;
  const evidence: {
    status: 'running' | 'passed' | 'failed';
    cases: Record<string, unknown>[];
    error?: string;
  } = { status: 'running', cases: [] };
  const errors: unknown[] = [];
  for (const [name, id] of [
    ['overlap', '4666000111222333881'],
    ['stalled-disconnect', '4666000111222333882'],
  ] as const) {
    const best = videoUrl(id, 0);
    const adjacent = videoUrl(id, 1);
    const acceptedVideoUrls = new Set(name === 'overlap' ? [best, adjacent] : [best]);
    const url = `https://x.com/intentrecovery/status/${id}`;
    const records: RangeProtocolRecord[] = [];
    const apiRequests: Array<{ tweetId: string; method: string }> = [];
    const observed: Record<string, unknown> = {
      name,
      id,
      best,
      ...(name === 'overlap' ? { adjacent } : {}),
      status: 'running',
      protocol: records,
      apiRequests,
      cleanup: {
        holdReleased: false,
        routeRemoved: false,
        mediaObserverRemoved: false,
        protocolDetached: false,
        pageClosed: false,
      },
    };
    evidence.cases.push(observed);
    const nativeMark = nativeLoopback.mark();
    const handler = async (route: Route) => {
      const target = new URL(route.request().url());
      if (route.request().isNavigationRequest() && target.href === url) {
        return route.continue();
      }
      if (target.hostname === 'x.com' && target.pathname.endsWith('/TweetResultByRestId')) {
        let requestedId: unknown;
        try {
          requestedId = field(JSON.parse(target.searchParams.get('variables') ?? '{}'), 'tweetId');
        } catch {
          return route.fallback();
        }
        if (requestedId === id) {
          assert(apiRequests.length < 4, 'Range fixture API request overflow');
          apiRequests.push({ tweetId: id, method: route.request().method() });
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(apiResponse(id, 'intentrecovery', name === 'overlap' ? 2 : 1)),
          });
        }
      }
      if (
        target.hostname === 'pbs.twimg.com' &&
        target.pathname.startsWith(`/ext_tw_video_thumb/${id}/pu/img/video-`)
      ) {
        return route.fulfill({ status: 200, contentType: 'image/png', body: POSTER_PNG });
      }
      if (target.hostname === 'video.twimg.com') {
        if (acceptedVideoUrls.has(target.href)) {
          return route.continue();
        }
        observed.unexpectedVideo = target.href;
      }
      return route.fallback();
    };
    let page: Page | undefined;
    let protocol: CDPSession | undefined;
    let routeInstalled = false;
    let overflow = false;
    const extraRanges = new Map<string, string>();
    try {
      nativeLoopback.setRecoveryPayloads({
        tweetId: id,
        validMp4,
        badMp4: validMp4,
        ...(name === 'overlap' ? { adjacentMp4 } : {}),
      });
      nativeLoopback.setRecoveryDocument({
        tweetId: id,
        html: fixtureHtml(id, 'intentrecovery', name === 'overlap' ? 2 : 1),
      });
      if (name === 'overlap') {
        nativeLoopback.armFirstVideoHold(new URL(best).pathname, prefixEnd);
      } else {
        nativeLoopback.armVideoHold(new URL(best).pathname, prefixEnd);
      }
      await context.route('**/*', handler);
      routeInstalled = true;
      page = await context.newPage();
      protocol = await context.newCDPSession(page);
      protocol.on('Network.requestWillBeSent', (event) => {
        if (!acceptedVideoUrls.has(event.request.url)) {
          return;
        }
        if (records.length >= 16) {
          overflow = true;
          return;
        }
        records.push({
          requestId: event.requestId,
          url: event.request.url,
          range:
            extraRanges.get(event.requestId) ||
            String(event.request.headers.Range ?? event.request.headers.range ?? '') ||
            null,
          status: null,
          startedAt: event.timestamp,
        });
      });
      protocol.on('Network.requestWillBeSentExtraInfo', (event) => {
        const range = String(event.headers.Range ?? event.headers.range ?? '');
        const record = records.find((item) => item.requestId === event.requestId);
        if (record) {
          record.range = range || record.range;
        } else if (range && extraRanges.size < 16) {
          extraRanges.set(event.requestId, range);
        }
      });
      protocol.on('Network.responseReceived', (event) => {
        const record = records.find((item) => item.requestId === event.requestId);
        if (record) {
          record.status = event.response.status;
          record.responseAt = event.timestamp;
        }
      });
      protocol.on('Network.loadingFinished', (event) => {
        const record = records.find((item) => item.requestId === event.requestId);
        if (record) {
          record.terminal = 'finished';
          record.terminalAt = event.timestamp;
        }
      });
      protocol.on('Network.loadingFailed', (event) => {
        const record = records.find((item) => item.requestId === event.requestId);
        if (record) {
          record.terminal = 'failed';
          record.terminalAt = event.timestamp;
          record.errorText = event.errorText;
          if (typeof event.canceled === 'boolean') {
            record.canceled = event.canceled;
          }
        }
      });
      await protocol.send('Network.enable');
      await page.goto(url);
      await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
      await page.locator('[data-video-target="0"]').click();
      const gallery = page.locator('[data-xeg-gallery-container]');
      await gallery.waitFor({ state: 'visible' });
      const original = gallery.getByRole('button', { name: 'Original', exact: true });
      if ((await original.getAttribute('aria-pressed')) !== 'true') {
        await original.click();
      }
      const expectedCount = name === 'overlap' ? 2 : 1;
      assert.equal(
        Number(await gallery.locator('#xeg-toolbar-counter').getAttribute('data-total')),
        expectedCount
      );
      assert.equal(await gallery.locator('[data-gallery-element="item"]').count(), expectedCount);
      assert(
        apiRequests.length > 0 &&
          apiRequests.every((item) => item.tweetId === id && item.method === 'GET')
      );
      const video = gallery.locator('[data-gallery-element="item"][data-index="0"] video');
      const beforePlay = await waitForValue(async () => {
        const state = await itemState(page!, 0);
        return state &&
          state.readyState >= 1 &&
          state.videoWidth === 320 &&
          state.videoHeight === 180
          ? state
          : undefined;
      }, 'native range fixture metadata');
      assert.equal(beforePlay.currentSrc, best);
      assert.equal(beforePlay.src, best);
      assert.equal(beforePlay.paused, true);
      assert.equal(beforePlay.currentIndex, 0);
      assert.equal(beforePlay.focusedIndex, 0);
      if (name === 'overlap') {
        const adjacentState = await waitForValue(async () => {
          const state = await itemState(page!, 1);
          return state &&
            state.admitted === 'true' &&
            state.src === adjacent &&
            state.currentSrc === adjacent &&
            state.readyState >= 1
            ? state
            : undefined;
        }, 'naturally admitted adjacent owned video');
        assert(
          adjacentState.box.top < adjacentState.viewport.bottom &&
            adjacentState.box.bottom > adjacentState.viewport.top,
          'Adjacent video must intersect the actual gallery viewport'
        );
        assert.equal(adjacentState.currentIndex, 0);
        assert.equal(adjacentState.focusedIndex, 0);
        observed.attachments = {
          ownerId: id,
          selected: { index: 0, url: best, state: beforePlay },
          adjacent: { index: 1, url: adjacent, state: adjacentState },
        };
      }
      await video.evaluate((element) => {
        if (!(element instanceof HTMLVideoElement)) {
          throw new Error('Selected native video disappeared before media observation');
        }
        const records: RangeMediaEvent[] = [];
        const listeners: Array<{ type: string; listener: EventListener }> = [];
        const observer = {
          records,
          overflow: false,
          dispose: () => {
            for (const { type, listener } of listeners) {
              element.removeEventListener(type, listener, true);
            }
          },
        };
        for (const type of ['play', 'seeking', 'seeked', 'waiting', 'stalled', 'error']) {
          const listener: EventListener = (event) => {
            if (records.length >= 32) {
              observer.overflow = true;
              return;
            }
            records.push({
              type,
              trusted: event.isTrusted,
              currentTime: element.currentTime,
              atMs: performance.now(),
            });
          };
          element.addEventListener(type, listener, true);
          listeners.push({ type, listener });
        }
        window.__xegRangeMediaObservation = observer;
      });
      await video.click();
      const playing = await waitForValue(async () => {
        const state = await itemState(page!, 0);
        return state && !state.paused && state.currentTime > 0.15 && state.error === null
          ? state
          : undefined;
      }, 'ordinary Play and decoded progress');
      observed.playing = playing;
      assert.equal(playing.currentIndex, 0);
      assert.equal(playing.focusedIndex, 0);
      assert.equal(playing.currentSrc, best);
      if (name === 'stalled-disconnect') {
        await waitForValue(
          async () => (nativeLoopback.videoHeld() ? true : undefined),
          'real held 206 response after metadata bootstrap'
        );
      }
      const matchesStart = (record: RangeProtocolRecord, start: number) =>
        /^bytes=(\d+)-/u.exec(record.range ?? '')?.[1] === String(start);
      if (name === 'overlap') {
        const point = await nativeSeekPoint(protocol, page, video, 0.8);
        observed.seekPoint = point;
        const seekIssuedAt = await page.evaluate(() => performance.now());
        await page.mouse.click(point.x, point.y);
        const seeked = await waitForValue(async () => {
          const state = await itemState(page!, 0);
          return state &&
            !state.seeking &&
            state.currentTime > 3.2 &&
            Number.isFinite(state.duration) &&
            state.currentTime <= state.duration - 0.3 &&
            state.error === null
            ? state
            : undefined;
        }, 'ordinary native timeline seek');
        observed.seeked = seeked;
        assert.equal(seeked.currentIndex, 0);
        assert.equal(seeked.focusedIndex, 0);
        assert.equal(seeked.currentSrc, best);
        const progressed = await waitForValue(async () => {
          const state = await itemState(page!, 0);
          return state &&
            !state.paused &&
            !state.seeking &&
            state.currentTime > seeked.currentTime + 0.15 &&
            state.error === null
            ? state
            : undefined;
        }, 'decoded progress after ordinary native seek');
        observed.progressed = progressed;
        assert.equal(progressed.currentIndex, 0);
        assert.equal(progressed.focusedIndex, 0);
        const mediaEvents = await page.evaluate(() => {
          const observer = window.__xegRangeMediaObservation;
          return observer && { records: observer.records, overflow: observer.overflow };
        });
        assert(mediaEvents && !mediaEvents.overflow);
        observed.mediaEvents = mediaEvents.records;
        assert(
          mediaEvents.records.some(
            (event) => event.type === 'seeking' && event.trusted && event.atMs >= seekIssuedAt
          ),
          'Native timeline click must start a trusted seek'
        );
        assert(
          mediaEvents.records.some(
            (event) => event.type === 'seeked' && event.trusted && event.atMs >= seekIssuedAt
          ),
          'Native timeline click must complete a trusted seek'
        );
        const overlap = await waitForValue(async () => {
          const entries = nativeLoopback
            .since(nativeMark)
            .filter((item) =>
              [new URL(best).pathname, new URL(adjacent).pathname].includes(item.path)
            );
          const completed = entries.find(
            (item) =>
              item.path === new URL(adjacent).pathname &&
              item.status === 206 &&
              item.result === 'served' &&
              item.range &&
              typeof item.finishedAtMs === 'number'
          );
          if (!completed) {
            return undefined;
          }
          const aborted = entries.find(
            (item) =>
              item.path === new URL(best).pathname &&
              item.status === 206 &&
              item.result === 'aborted' &&
              item.range &&
              item.range.start === 0 &&
              typeof item.prefixBytesQueued === 'number' &&
              item.prefixBytesQueued === prefixEnd &&
              typeof item.closedAtMs === 'number' &&
              item.atMs < completed.finishedAtMs! &&
              completed.atMs < item.closedAtMs
          );
          return aborted ? { entries, aborted, completed } : undefined;
        }, 'overlapping A abort and adjacent B completion');
        const { entries: native, aborted, completed } = overlap;
        observed.native = native;
        assert.equal(overflow, false);
        assert.equal(observed.unexpectedVideo, undefined);
        assert(aborted.range && typeof aborted.closedAtMs === 'number');
        assert(completed.range && typeof completed.finishedAtMs === 'number');
        assert(
          typeof aborted.closedAtMs === 'number' && typeof completed.finishedAtMs === 'number'
        );
        const terminals = await waitForValue(async () => {
          const failed = records.find(
            (item) =>
              item.url === best &&
              item.terminal === 'failed' &&
              item.errorText === 'net::ERR_ABORTED' &&
              item.status === 206 &&
              matchesStart(item, aborted.range!.start)
          );
          const finished = records.find(
            (item) =>
              item.url === adjacent &&
              item.terminal === 'finished' &&
              item.status === 206 &&
              matchesStart(item, completed.range!.start)
          );
          return failed && finished ? { failed, finished } : undefined;
        }, 'exact A abort and adjacent B completion CDP terminals');
        const { failed, finished } = terminals;
        assert(failed && finished && failed.requestId !== finished.requestId);
        assert(
          failed.startedAt < finished.terminalAt! && finished.startedAt < failed.terminalAt!,
          'The cross-attachment CDP request intervals did not overlap'
        );
        assert.equal(progressed.currentSrc, best);
        assert.equal(progressed.error, null);
        observed.overlap = { aborted, completed, failed, finished };
        observed.classification = 'cross-attachment-abort-and-completion-with-selected-playback';
      } else {
        const stalledStart = await waitForValue(async () => {
          const state = await itemState(page!, 0);
          return state &&
            state.currentTime > 2.8 &&
            !state.ended &&
            Number.isFinite(state.duration) &&
            state.currentTime < state.duration - 0.4
            ? state
            : undefined;
        }, 'playback approaching held sample boundary');
        const plateauStartedAt = performance.now();
        await page.waitForTimeout(1_500);
        const stalledEnd = await itemState(page, 0);
        assert(stalledEnd);
        const plateauWallMs = performance.now() - plateauStartedAt;
        observed.stall = { before: stalledStart, after: stalledEnd, wallMs: plateauWallMs };
        assert(plateauWallMs >= 1_200, 'Stall sample must span a sustained wall-clock interval');
        assert(stalledEnd.currentTime <= stalledStart.currentTime + 0.2);
        assert.equal(stalledEnd.paused, false);
        assert.equal(stalledEnd.ended, false);
        assert.equal(stalledEnd.seeking, false);
        assert(stalledEnd.currentTime < stalledEnd.duration - 0.4);
        assert.equal(stalledEnd.currentSrc, best);
        assert.equal(stalledEnd.error, null);
        assert.equal(nativeLoopback.videoHeld(), true);
        const heldNative = nativeLoopback
          .since(nativeMark)
          .filter((item) => item.path === new URL(best).pathname);
        observed.heldNative = heldNative;
        const heldRange = heldNative.find(
          (item) => item.status === 206 && item.result === 'video-held' && item.range
        );
        assert(heldRange?.range, 'The stalled playback must have a still-held native 206 range');
        const pendingIds = records
          .filter(
            (item) =>
              item.status === 206 &&
              item.terminal === undefined &&
              matchesStart(item, heldRange.range!.start)
          )
          .map((item) => item.requestId);
        assert(pendingIds.length > 0, 'Stalled transfer must still have a pending native request');
        observed.disconnectIssuedAtMs = performance.now();
        nativeLoopback.abortVideoHold();
        const disconnectedNative = await waitForValue(async () => {
          const native = nativeLoopback
            .since(nativeMark)
            .find(
              (item) =>
                item.path === new URL(best).pathname &&
                item.result === 'aborted' &&
                item.range?.start === heldRange.range!.start
            );
          return native && typeof native.closedAtMs === 'number' ? native : undefined;
        }, 'controlled server disconnect terminal');
        observed.disconnectedNative = disconnectedNative;
        observed.allNative = nativeLoopback
          .since(nativeMark)
          .filter((item) => item.path === new URL(best).pathname);
        observed.afterDisconnect = await itemState(page, 0);
        observed.disconnectProtocol = await waitForValue(
          async () =>
            records.find(
              (item) =>
                pendingIds.includes(item.requestId) &&
                item.status === 206 &&
                item.terminal === 'failed' &&
                matchesStart(item, heldRange.range!.start)
            ),
          'controlled native transfer failure terminal'
        );
        assert.equal(overflow, false);
        assert.equal(observed.unexpectedVideo, undefined);
        observed.classification = 'held-transfer-then-controlled-server-disconnect';
      }
      const documentRequest = nativeLoopback
        .since(nativeMark)
        .find(
          (item) =>
            item.host === 'x.com' && item.path === new URL(url).pathname && item.result === 'served'
        );
      assert(documentRequest, 'Range fixture document must come from the native HTTPS server');
      observed.document = documentRequest;
      await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
      await gallery.waitFor({ state: 'detached' });
      observed.status = 'passed';
    } catch (error) {
      observed.status = 'failed';
      observed.error = error instanceof Error ? error.message : String(error);
      if (page && !page.isClosed()) {
        observed.mediaEvents = await page
          .evaluate(() => {
            const observer = window.__xegRangeMediaObservation;
            return observer && { records: observer.records, overflow: observer.overflow };
          })
          .catch(() => null);
      }
      observed.native = nativeLoopback
        .since(nativeMark)
        .filter((item) =>
          [
            new URL(best).pathname,
            ...(name === 'overlap' ? [new URL(adjacent).pathname] : []),
          ].includes(item.path)
        );
      observed.overflow = overflow;
      errors.push(error);
    } finally {
      nativeLoopback.abortVideoHold();
      const cleanup = observed.cleanup as Record<string, boolean>;
      cleanup.holdReleased = !nativeLoopback.videoHeld();
      if (routeInstalled) {
        await context
          .unroute('**/*', handler)
          .then(() => {
            cleanup.routeRemoved = true;
          })
          .catch((error) => errors.push(error));
      } else {
        cleanup.routeRemoved = true;
      }
      if (page && !page.isClosed()) {
        await page
          .evaluate(() => {
            window.__xegRangeMediaObservation?.dispose();
            delete window.__xegRangeMediaObservation;
          })
          .then(() => {
            cleanup.mediaObserverRemoved = true;
          })
          .catch((error) => errors.push(error));
      } else {
        cleanup.mediaObserverRemoved = true;
      }
      if (protocol) {
        await protocol
          .detach()
          .then(() => {
            cleanup.protocolDetached = true;
          })
          .catch((error) => errors.push(error));
      } else {
        cleanup.protocolDetached = true;
      }
      if (page) {
        await page
          .close()
          .then(() => {
            cleanup.pageClosed = true;
          })
          .catch((error) => errors.push(error));
      } else {
        cleanup.pageClosed = true;
      }
      if (!Object.values(cleanup).every(Boolean)) {
        observed.status = 'failed';
      }
    }
  }
  evidence.status = errors.length ? 'failed' : 'passed';
  if (errors.length) {
    evidence.error = errors
      .map((error) => (error instanceof Error ? error.message : String(error)))
      .join('; ');
  }
  await writeFile(
    join(output, 'video-range-abort-observations.json'),
    JSON.stringify(evidence, null, 2)
  );
  if (errors.length) {
    throw new AggregateError(errors, 'Native range abort and stall diagnostics failed');
  }
  return evidence;
}

async function runSelectedVideoFailureCases({
  context,
  validMp4,
  output,
  evidence,
}: {
  context: BrowserContext;
  validMp4: Buffer;
  output: string;
  evidence: SelectedVideoFailureEvidence;
}) {
  const faults: Array<{
    kind: SelectedVideoFault;
    status: number;
    contentType: string;
    body: Buffer;
  }> = [
    { kind: 'http-401', status: 401, contentType: 'video/mp4', body: Buffer.alloc(0) },
    { kind: 'http-403', status: 403, contentType: 'video/mp4', body: Buffer.alloc(0) },
    { kind: 'http-404', status: 404, contentType: 'video/mp4', body: Buffer.alloc(0) },
    {
      kind: 'html-200',
      status: 200,
      contentType: 'text/html',
      body: Buffer.from('<!doctype html><title>not media</title>'),
    },
    { kind: 'invalid-mp4-200', status: 200, contentType: 'video/mp4', body: BAD_MP4 },
  ];
  const failures: unknown[] = [];
  const handle = 'selectedfault';
  evidence.status = 'pending';
  for (const [caseIndex, fault] of faults.entries()) {
    const id = String(4666000111222334771n + BigInt(caseIndex));
    const fixtureUrl = 'https://x.com/' + handle + '/status/' + id;
    const bestUrl = videoUrl(id, 0);
    const lowerUrl = videoUrl(id, 0, 'lower');
    const neighborUrl = videoUrl(id, 1);
    const receipt: SelectedVideoFailureCase = {
      kind: fault.kind,
      status: 'pending',
      fixtureUrl,
      bestUrl,
      lowerUrl,
      faultStatus: fault.status,
      api: [],
      requests: [],
      responses: [],
      unexpectedVideo: [],
      events: [],
      consoleErrors: [],
      pageErrors: [],
      overflow: false,
      cleanup: {
        gateReleased: false,
        observerRemoved: false,
        routeRemoved: false,
        listenersRemoved: false,
        pageClosed: false,
        errors: [],
      },
    };
    evidence.cases.push(receipt);
    let page: Page | undefined;
    let routeArmed = false;
    let faultActive = true;
    let releaseBest: () => void = () => {};
    const bestGate = new Promise<void>((resolve) => {
      releaseBest = resolve;
    });
    const release = () => {
      releaseBest();
      receipt.cleanup.gateReleased = true;
    };
    const onConsole = (message: ConsoleMessage) => {
      if (message.type() !== 'error') {
        return;
      }
      if (receipt.consoleErrors.length >= 8) {
        receipt.overflow = true;
        return;
      }
      receipt.consoleErrors.push({
        text: message.text().slice(0, 500),
        location: message.location().url.slice(0, 500),
      });
    };
    const onPageError = (error: Error) => {
      if (receipt.pageErrors.length >= 4) {
        receipt.overflow = true;
        return;
      }
      receipt.pageErrors.push(String(error).slice(0, 500));
    };
    const onResponse = (response: { url(): string; status(): number }) => {
      const url = response.url();
      if (url !== bestUrl && !url.includes('/TweetResultByRestId')) {
        return;
      }
      if (receipt.responses.length >= evidence.requestCapPerCase) {
        receipt.overflow = true;
        return;
      }
      receipt.responses.push({ url, status: response.status() });
    };
    const routeHandler = async (route: Route) => {
      const request = route.request();
      const target = new URL(request.url());
      if (request.isNavigationRequest() && request.url() === fixtureUrl) {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: fixtureHtml(id, handle),
        });
        return;
      }
      if (target.hostname === 'x.com' && target.pathname.endsWith('/TweetResultByRestId')) {
        let requestedId: unknown;
        try {
          requestedId = field(JSON.parse(target.searchParams.get('variables') ?? '{}'), 'tweetId');
        } catch {
          requestedId = undefined;
        }
        if (requestedId === id) {
          if (receipt.api.length >= 2) {
            receipt.overflow = true;
            await route.fulfill({ status: 503, body: '' });
            return;
          }
          receipt.api.push({ url: request.url(), status: 200 });
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(apiResponse(id, handle)),
          });
          return;
        }
        receipt.overflow = true;
        await route.fulfill({ status: 503, body: '' });
        return;
      }
      if (
        target.hostname === 'pbs.twimg.com' &&
        target.pathname.startsWith('/ext_tw_video_thumb/' + id + '/pu/img/video-')
      ) {
        await route.fulfill({ status: 200, contentType: 'image/png', body: POSTER_PNG });
        return;
      }
      if (
        target.hostname === 'video.twimg.com' &&
        target.pathname.startsWith('/ext_tw_video/' + id + '/pu/vid/')
      ) {
        const matched =
          /^\/ext_tw_video\/\d+\/pu\/vid\/320x180\/video-([0-7])-(best|lower)\.mp4$/u.exec(
            target.pathname
          );
        if (
          !matched ||
          (matched[2] === 'lower' && matched[1] !== '0') ||
          receipt.requests.length >= evidence.requestCapPerCase
        ) {
          receipt.overflow = true;
          await route.fulfill({ status: 503, body: '' });
          return;
        }
        const index = Number(matched[1]);
        const quality = matched[2]!;
        const faulted = index === 0 && quality === 'best' && faultActive;
        const payload = faulted ? fault.body : validMp4;
        const contentType = faulted ? fault.contentType : 'video/mp4';
        const range = request.headers().range ?? null;
        const rangeMatch = /^bytes=(\d+)-(\d*)$/u.exec(range ?? '');
        const start = !faulted && rangeMatch ? Number(rangeMatch[1]) : 0;
        const end =
          !faulted && rangeMatch
            ? Math.min(
                rangeMatch[2] ? Number(rangeMatch[2]) : payload.length - 1,
                payload.length - 1
              )
            : payload.length - 1;
        const invalidRange = !faulted && (start >= payload.length || end < start);
        const bytes = invalidRange ? Buffer.alloc(0) : payload.subarray(start, end + 1);
        const status = faulted ? fault.status : invalidRange ? 416 : rangeMatch ? 206 : 200;
        const record: SelectedVideoRouteRecord = {
          url: request.url(),
          index,
          quality,
          range,
          status,
          bytes: bytes.length,
          sha256: bytes.length ? createHash('sha256').update(bytes).digest('hex') : null,
        };
        receipt.requests.push(record);
        if (faulted) {
          await bestGate;
        }
        await route.fulfill({
          status,
          contentType,
          body: bytes,
          headers: faulted
            ? { 'Cache-Control': 'no-store' }
            : invalidRange
              ? { 'Content-Range': 'bytes */' + payload.length }
              : {
                  'Accept-Ranges': 'bytes',
                  'Content-Length': String(bytes.length),
                  ...(rangeMatch
                    ? { 'Content-Range': 'bytes ' + start + '-' + end + '/' + payload.length }
                    : {}),
                },
        });
        record.fulfilledAtMonotonicMs = performance.now();
        return;
      }
      if (target.hostname === 'video.twimg.com') {
        if (receipt.unexpectedVideo.length < 4) {
          receipt.unexpectedVideo.push(target.pathname.slice(0, 500));
        } else {
          receipt.overflow = true;
        }
        await route.fulfill({ status: 503, body: '' });
        return;
      }
      await route.fallback();
    };
    const readObserver = async () =>
      page!.evaluate(() => {
        const observer = window.__xegSelectedVideoFailureObservation;
        return {
          installed: Boolean(observer),
          records: observer?.records ?? [],
          overflow: observer?.overflow ?? false,
        };
      });
    const captureObserver = async () => {
      const observed = await readObserver();
      assert(observed.installed, 'Selected video event observer was not installed');
      receipt.events = observed.records;
      assert.equal(observed.overflow, false, 'Selected video event observations overflowed');
      assert(
        receipt.events.every(
          ({ source, currentSource }) =>
            (source === null || source === bestUrl || source === lowerUrl) &&
            (currentSource === '' || currentSource === bestUrl || currentSource === lowerUrl)
        ),
        'Selected video events escaped the two owned variants'
      );
    };
    const assertConsoleDiagnostics = () => {
      const expectedHttp = new RegExp(
        '^Failed to load resource: the server responded with a status of ' +
          fault.status +
          '(?: \\([^)]{1,80}\\))?$',
        'u'
      );
      const diagnostics = receipt.consoleErrors.map((record) => ({
        ...record,
        http: fault.status >= 400 && record.location === bestUrl && expectedHttp.test(record.text),
        abort:
          [bestUrl, lowerUrl, neighborUrl].includes(record.location) &&
          (record.text === 'Failed to load resource: net::ERR_ABORTED' ||
            record.text === 'net::ERR_ABORTED'),
      }));
      assert(
        diagnostics.every(({ http, abort }) => http || abort),
        'Only selected HTTP faults and exact owned native aborts may log console errors'
      );
      assert(
        diagnostics.filter(({ http }) => http).length <=
          receipt.requests.filter(
            (request) => request.url === bestUrl && request.status === fault.status
          ).length,
        'Selected HTTP console diagnostics exceeded physical fault responses'
      );
      assert(
        diagnostics.filter(({ abort }) => abort).length <= receipt.requests.length,
        'Owned native abort diagnostics exceeded physical media requests'
      );
    };
    const stateWhen = (index: number, predicate: (state: ItemState) => boolean, label: string) =>
      waitForValue(
        async () => {
          const state = await itemState(page!, index);
          return state && predicate(state) ? state : undefined;
        },
        label,
        20_000
      );
    const readAttribution = async () => {
      const gallery = page!.locator('[data-xeg-gallery-container]');
      const button = gallery.locator('#tweet-text-button');
      await button.click();
      const link = gallery.locator('#toolbar-tweet-panel a[href^="https://x.com/"]');
      await link.waitFor({ state: 'visible' });
      const href = await link.getAttribute('href');
      await button.click();
      assert(
        href === fixtureUrl || href === fixtureUrl + '/video/1',
        'Selected video attribution must identify the same owned post'
      );
      return href;
    };
    try {
      page = await context.newPage();
      page.on('console', onConsole);
      page.on('pageerror', onPageError);
      page.on('response', onResponse);
      await page.route('**/*', routeHandler);
      routeArmed = true;
      await page.goto(fixtureUrl);
      await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
      const trigger = page.locator('[data-video-target="0"]');
      await trigger.scrollIntoViewIfNeeded();
      await trigger.focus();
      const before = await page.evaluate(() => ({
        scrollY,
        bodyStyle: document.body.getAttribute('style'),
        activeTarget: document.activeElement?.getAttribute('data-video-target') ?? null,
      }));
      const documentBefore = await page.evaluate(() => ({
        url: location.href,
        timeOrigin: performance.timeOrigin,
      }));
      assert.equal(before.activeTarget, '0');
      await trigger.click();
      const gallery = page.locator('[data-xeg-gallery-container]');
      await gallery.waitFor({ state: 'visible' });
      receipt.initial = await stateWhen(
        0,
        (state) =>
          state.src === bestUrl &&
          state.currentIndex === 0 &&
          state.focusedIndex === 0 &&
          state.displayUrl === bestUrl,
        'selected fault best source attachment'
      );
      await page.evaluate((expectedBest) => {
        const gallery = document.querySelector('[data-xeg-gallery-container]');
        if (!(gallery instanceof HTMLElement)) {
          throw new Error('Selected video failure gallery is missing');
        }
        const records: SelectedVideoEventRecord[] = [];
        let overflow = false;
        const record = (value: SelectedVideoEventRecord) => {
          if (records.length < 32) {
            records.push(value);
          } else {
            overflow = true;
          }
        };
        const onError = (event: Event) => {
          const video = event.target;
          if (
            !(video instanceof HTMLVideoElement) ||
            !video.closest('[data-gallery-element="item"][data-index="0"]')
          ) {
            return;
          }
          const timing = performance.getEntriesByName(expectedBest, 'resource').at(-1) as
            | (PerformanceResourceTiming & { responseStatus?: number })
            | undefined;
          record({
            type: 'error',
            atPageMonotonicMs: performance.now(),
            source: video.getAttribute('src'),
            currentSource: video.currentSrc,
            errorCode: video.error?.code ?? null,
            trusted: event.isTrusted,
            responseStatus: timing?.responseStatus ?? null,
          });
        };
        const onPlay = (event: Event) => {
          const video = event.target;
          if (
            !(video instanceof HTMLVideoElement) ||
            !video.closest('[data-gallery-element="item"][data-index="0"]')
          ) {
            return;
          }
          record({
            type: 'play',
            atPageMonotonicMs: performance.now(),
            source: video.getAttribute('src'),
            currentSource: video.currentSrc,
            errorCode: video.error?.code ?? null,
            trusted: event.isTrusted,
            responseStatus: null,
          });
        };
        const onMutation = (mutations: MutationRecord[]) => {
          for (const mutation of mutations) {
            const video = mutation.target;
            if (
              !(video instanceof HTMLVideoElement) ||
              !video.closest('[data-gallery-element="item"][data-index="0"]')
            ) {
              continue;
            }
            record({
              type: 'src',
              atPageMonotonicMs: performance.now(),
              source: video.getAttribute('src'),
              currentSource: video.currentSrc,
              errorCode: video.error?.code ?? null,
              trusted: null,
              responseStatus: null,
            });
          }
        };
        const observer = new MutationObserver(onMutation);
        observer.observe(gallery, { subtree: true, attributes: true, attributeFilter: ['src'] });
        document.addEventListener('error', onError, true);
        document.addEventListener('play', onPlay, true);
        window.__xegSelectedVideoFailureObservation = {
          records,
          get overflow() {
            return overflow;
          },
          dispose: () => {
            document.removeEventListener('error', onError, true);
            document.removeEventListener('play', onPlay, true);
            observer.disconnect();
          },
        };
      }, bestUrl);
      const pendingBeforePlay = await itemState(page, 0);
      assert(pendingBeforePlay);
      assert.equal(pendingBeforePlay.src, bestUrl);
      assert.equal(pendingBeforePlay.paused, true);
      assert(pendingBeforePlay.currentTime <= 0.05);
      const playObservationStartedAt = performance.now();
      const pendingVideo = gallery.locator('[data-gallery-element="item"][data-index="0"] video');
      const inputs: Array<'native-video-click' | 'focused-video-space'> = [];
      const observeTrustedPlay = () =>
        waitForValue(
          async () => {
            const observed = await readObserver();
            return observed.records.some(
              (event) => event.type === 'play' && event.source === bestUrl && event.trusted
            )
              ? true
              : undefined;
          },
          'trusted selected play event before the held fault response',
          1_500
        ).catch(() => false);
      inputs.push('native-video-click');
      let clickError: string | undefined;
      await pendingVideo.click({ timeout: 3_000 }).catch((error) => {
        clickError = String(error).slice(0, 500);
      });
      let trustedPlay = await observeTrustedPlay();
      let pendingAfterPlay = await itemState(page, 0);
      if (!trustedPlay || pendingAfterPlay?.paused) {
        await pendingVideo.focus();
        await page.keyboard.press('Space');
        inputs.push('focused-video-space');
        trustedPlay = await observeTrustedPlay();
        pendingAfterPlay = await itemState(page, 0);
      }
      receipt.faultPlayAttempt = {
        inputs,
        before: { paused: pendingBeforePlay.paused, currentTime: pendingBeforePlay.currentTime },
        after: pendingAfterPlay
          ? { paused: pendingAfterPlay.paused, currentTime: pendingAfterPlay.currentTime }
          : null,
        trustedPlayEvent: trustedPlay,
        observationMs: performance.now() - playObservationStartedAt,
        ...(clickError === undefined ? {} : { clickError }),
      };
      assert(
        trustedPlay && pendingAfterPlay?.paused === false,
        'Fault-side native Play prerequisite was not observed before the response'
      );
      release();
      receipt.nativeError = await waitForValue(
        async () => {
          const observed = await readObserver();
          return observed.records.find(
            (event) => event.type === 'error' && event.source === bestUrl
          );
        },
        'selected native media error',
        20_000
      );
      assert.equal(receipt.nativeError.trusted, true, 'Native media error must be trusted');
      assert(
        [1, 2, 3, 4].includes(receipt.nativeError.errorCode ?? -1),
        'Native media error code is unavailable'
      );
      const exposedDenial =
        (fault.status === 401 || fault.status === 403) &&
        (receipt.nativeError.responseStatus === 401 || receipt.nativeError.responseStatus === 403);
      const shouldFallback = [3, 4].includes(receipt.nativeError.errorCode ?? -1) && !exposedDenial;
      if (shouldFallback) {
        receipt.faultOutcome = await stateWhen(
          0,
          (state) =>
            state.src === lowerUrl &&
            state.currentSrc === lowerUrl &&
            state.metadata === 'true' &&
            state.readyState >= 2 &&
            state.videoWidth === 320 &&
            state.videoHeight === 180 &&
            state.error === null &&
            state.currentIndex === 0 &&
            state.focusedIndex === 0,
          'native error same-item lower-source recovery'
        );
        assert(
          receipt.requests.some(
            (record) =>
              record.index === 0 &&
              record.quality === 'lower' &&
              (record.status === 200 || record.status === 206) &&
              typeof record.fulfilledAtMonotonicMs === 'number'
          ),
          'Recoverable error did not request the selected lower source'
        );
        assert.equal(
          await gallery
            .locator('[data-gallery-element="item"][data-index="0"] [role="alert"]')
            .count(),
          0,
          'Recovered selected video must not retain a terminal error alert'
        );
      } else {
        await gallery
          .locator('[data-gallery-element="item"][data-index="0"] [role="alert"]')
          .waitFor({ state: 'visible' });
        await page.waitForTimeout(500);
        const terminal = await itemState(page, 0);
        assert(terminal);
        receipt.faultOutcome = terminal;
        assert(
          receipt.requests.every((record) => record.index !== 0 || record.quality !== 'lower'),
          'Terminal native error attempted a lower source'
        );
      }
      assert(receipt.faultOutcome);
      assertBestSource(receipt.faultOutcome, bestUrl);
      assert(
        [bestUrl, lowerUrl].includes(receipt.faultOutcome.src ?? ''),
        'Selected video source escaped the two owned variants'
      );
      assert(
        [bestUrl, lowerUrl, ''].includes(receipt.faultOutcome.currentSrc),
        'Selected native source escaped the two owned variants'
      );
      receipt.attribution = { failed: await readAttribution(), recovered: '' };
      await gallery
        .locator('[data-gallery-element="toolbar"] button[aria-label="Download"]')
        .focus();
      await page.keyboard.press('ArrowRight');
      receipt.neighbor = await stateWhen(
        1,
        (state) =>
          state.src === neighborUrl &&
          state.currentSrc === neighborUrl &&
          state.metadata === 'true' &&
          state.readyState >= 2 &&
          state.videoWidth === 320 &&
          state.videoHeight === 180 &&
          state.error === null &&
          state.currentIndex === 1 &&
          state.focusedIndex === 1,
        'healthy neighboring video after selected failure'
      );
      assertBestSource(receipt.neighbor, neighborUrl);
      await page.keyboard.press('ArrowLeft');
      receipt.returned = await stateWhen(
        0,
        (state) =>
          state.currentIndex === 0 && state.focusedIndex === 0 && state.displayUrl === bestUrl,
        'return to selected failed video'
      );
      assert(
        [bestUrl, lowerUrl].includes(receipt.returned.src ?? '') &&
          [bestUrl, lowerUrl, ''].includes(receipt.returned.currentSrc),
        'Returned selected source escaped the two owned variants'
      );
      if (fault.kind === 'invalid-mp4-200') {
        const screenshot = 'src02-invalid-mp4-error.png';
        await page.screenshot({ path: join(output, screenshot) });
        receipt.screenshot = screenshot;
      }
      await captureObserver();
      assert.equal(receipt.overflow, false, 'Selected video request observations overflowed');
      assert.deepEqual(receipt.unexpectedVideo, []);
      assert.deepEqual(receipt.pageErrors, []);
      assert.equal(receipt.api.length, 1, 'Fault open needs one physical metadata request');
      assert.equal(receipt.api[0]?.status, 200);
      assert(
        receipt.responses.some(
          (response) => response.url === receipt.api[0]?.url && response.status === 200
        ),
        'Fault metadata response was not observed by the owned page'
      );
      const faultRequests = receipt.requests.filter(
        (request) => request.index === 0 && request.quality === 'best'
      );
      assert(
        faultRequests.some((request) => typeof request.fulfilledAtMonotonicMs === 'number'),
        'Selected best fault route did not serve a physical response'
      );
      assert(
        faultRequests.every(
          (request) =>
            request.url === bestUrl &&
            request.status === fault.status &&
            request.bytes === fault.body.length
        ),
        'Selected best fault response changed status or bytes'
      );
      assert(
        receipt.responses.some(
          (response) => response.url === bestUrl && response.status === fault.status
        ),
        'Owned page did not observe the selected best response'
      );
      assert(
        new Set(
          receipt.requests.filter((request) => request.index === 0).map((request) => request.url)
        ).size <= 2,
        'Selected video attempted more than two owned sources'
      );
      receipt.faultPhysicalRangeRequests = receipt.requests.filter(
        (request) => request.range !== null
      ).length;
      receipt.faultSelectedSourceAttempts = [
        ...new Set(
          receipt.requests.filter((request) => request.index === 0).map((request) => request.url)
        ),
      ];
      await page.keyboard.press('Escape');
      await gallery.waitFor({ state: 'detached' });
      const firstClose = await page.evaluate(() => ({
        scrollY,
        bodyStyle: document.body.getAttribute('style'),
        activeTarget: document.activeElement?.getAttribute('data-video-target') ?? null,
      }));
      assert.deepEqual(firstClose, before, 'Fault close did not restore host state');
      faultActive = false;
      const healthyMark = receipt.requests.length;
      await trigger.click();
      await gallery.waitFor({ state: 'visible' });
      receipt.recovered = await stateWhen(
        0,
        (state) =>
          state.src === bestUrl &&
          state.currentSrc === bestUrl &&
          state.metadata === 'true' &&
          state.readyState >= 2 &&
          state.videoWidth === 320 &&
          state.videoHeight === 180 &&
          state.error === null &&
          state.paused &&
          state.currentIndex === 0 &&
          state.focusedIndex === 0,
        'same-document healthy best video recovery'
      );
      assertBestSource(receipt.recovered, bestUrl);
      assert(
        receipt.requests
          .slice(healthyMark)
          .some(
            (request) =>
              request.url === bestUrl &&
              (request.status === 200 || request.status === 206) &&
              request.sha256 !== null &&
              typeof request.fulfilledAtMonotonicMs === 'number'
          ),
        'Healthy reopen did not physically fetch the selected best source'
      );
      assert(
        receipt.requests
          .slice(healthyMark)
          .every((request) => request.index !== 0 || request.url === bestUrl),
        'Healthy selected recovery unexpectedly substituted a lower source'
      );
      receipt.attribution.recovered = await readAttribution();
      assert.equal(
        receipt.attribution.recovered,
        receipt.attribution.failed,
        'Selected video attribution changed after recovery'
      );
      await gallery
        .locator('[data-gallery-element="toolbar"] button[aria-label="Download"]')
        .focus();
      await page.keyboard.press('ArrowRight');
      receipt.recoveredNeighbor = await stateWhen(
        1,
        (state) =>
          state.src === neighborUrl &&
          state.currentSrc === neighborUrl &&
          state.metadata === 'true' &&
          state.readyState >= 2 &&
          state.videoWidth === 320 &&
          state.videoHeight === 180 &&
          state.error === null &&
          state.paused &&
          state.currentIndex === 1 &&
          state.focusedIndex === 1,
        'same-document healthy neighbor after recovery'
      );
      assertBestSource(receipt.recoveredNeighbor, neighborUrl);
      await page.keyboard.press('ArrowLeft');
      const ready = await stateWhen(
        0,
        (state) =>
          state.currentIndex === 0 &&
          state.focusedIndex === 0 &&
          state.src === bestUrl &&
          state.currentSrc === bestUrl &&
          state.paused,
        'fresh selected video before ordinary play'
      );
      const beforePlay = ready.currentTime;
      assert(beforePlay <= 0.05, 'Healthy reopen was not a fresh paused video');
      await gallery.locator('[data-gallery-element="item"][data-index="0"] video').click();
      const playing = await stateWhen(
        0,
        (state) => !state.paused && state.currentTime > beforePlay + 0.15,
        'fresh selected video ordinary playback progress'
      );
      receipt.playback = { before: beforePlay, after: playing.currentTime };
      await page.keyboard.press('Escape');
      await gallery.waitFor({ state: 'detached' });
      const after = await page.evaluate(() => ({
        scrollY,
        bodyStyle: document.body.getAttribute('style'),
        activeTarget: document.activeElement?.getAttribute('data-video-target') ?? null,
      }));
      receipt.host = { before, firstClose, after };
      assert.deepEqual(after, before, 'Selected video close did not restore host state');
      const documentAfter = await page.evaluate(() => ({
        url: location.href,
        timeOrigin: performance.timeOrigin,
      }));
      receipt.document = { before: documentBefore, after: documentAfter };
      assert.deepEqual(
        documentAfter,
        documentBefore,
        'Selected video failure and recovery left the original document'
      );
      await captureObserver();
      assertConsoleDiagnostics();
      assert.equal(receipt.overflow, false);
      assert.deepEqual(receipt.unexpectedVideo, []);
      assert.deepEqual(receipt.pageErrors, []);
      receipt.totalPhysicalRangeRequests = receipt.requests.filter(
        (request) => request.range !== null
      ).length;
      receipt.status = 'passed';
    } catch (error) {
      failures.push(error);
      receipt.status = 'failed';
      receipt.error = String(error).slice(0, 1000);
      if (page && !page.isClosed() && !receipt.screenshot) {
        const screenshot = 'src02-' + fault.kind + '-error.png';
        await page
          .screenshot({ path: join(output, screenshot) })
          .then(() => {
            receipt.screenshot = screenshot;
          })
          .catch((screenshotError) => {
            receipt.screenshotError = String(screenshotError).slice(0, 500);
          });
      }
    } finally {
      release();
      if (page) {
        if (!page.isClosed()) {
          try {
            const observed = await page.evaluate(() => {
              const observer = window.__xegSelectedVideoFailureObservation;
              const result = {
                installed: Boolean(observer),
                records: observer?.records ?? [],
                overflow: observer?.overflow ?? false,
              };
              observer?.dispose();
              delete window.__xegSelectedVideoFailureObservation;
              return result;
            });
            if (observed.installed) {
              receipt.events = observed.records;
              if (observed.overflow) {
                receipt.overflow = true;
              }
            }
            receipt.cleanup.observerRemoved = true;
          } catch (error) {
            receipt.cleanup.errors.push(String(error).slice(0, 500));
            failures.push(error);
          }
        }
        if (routeArmed) {
          try {
            await page.unroute('**/*', routeHandler);
            receipt.cleanup.routeRemoved = true;
          } catch (error) {
            receipt.cleanup.errors.push(String(error).slice(0, 500));
            failures.push(error);
          }
        } else {
          receipt.cleanup.routeRemoved = true;
        }
        try {
          page.off('console', onConsole);
          page.off('pageerror', onPageError);
          page.off('response', onResponse);
          receipt.cleanup.listenersRemoved = true;
        } catch (error) {
          receipt.cleanup.errors.push(String(error).slice(0, 500));
          failures.push(error);
        }
        if (receipt.status === 'passed') {
          try {
            assert.equal(receipt.overflow, false, 'Selected video late observations overflowed');
            assert(
              receipt.events.every(
                ({ source, currentSource }) =>
                  (source === null || source === bestUrl || source === lowerUrl) &&
                  (currentSource === '' || currentSource === bestUrl || currentSource === lowerUrl)
              ),
              'Selected video late events escaped the two owned variants'
            );
            assertConsoleDiagnostics();
            assert.deepEqual(receipt.pageErrors, []);
          } catch (error) {
            failures.push(error);
            receipt.status = 'failed';
            receipt.error = String(error).slice(0, 1000);
          }
        }
        try {
          await page.close();
          receipt.cleanup.pageClosed = true;
        } catch (error) {
          receipt.cleanup.errors.push(String(error).slice(0, 500));
          failures.push(error);
        }
      } else {
        receipt.cleanup.observerRemoved = true;
        receipt.cleanup.routeRemoved = true;
        receipt.cleanup.listenersRemoved = true;
        receipt.cleanup.pageClosed = true;
      }
      receipt.totalPhysicalRangeRequests = receipt.requests.filter(
        (request) => request.range !== null
      ).length;
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
    evidence.errors = failures.map((error) => String(error).slice(0, 1000));
    throw new AggregateError(failures, 'Selected video failure validation or cleanup failed');
  }
}

/** A bounded real decode failure after playback; MP4 metadata and early samples stay valid. */
export function assertMetadataSourceRequestSettlement(
  protocol: MetadataReadinessEvidence['protocol'],
  transfer: MetadataReadinessEvidence['transfer'],
  assetBytes: number,
  tailReleasedAtMs: number
): NonNullable<MetadataReadinessEvidence['requestSettlement']> {
  assert(Number.isSafeInteger(assetBytes) && assetBytes > 0);
  assert(Number.isFinite(tailReleasedAtMs));
  const requests = protocol.filter((event) => event.phase === 'request');
  assert(requests.length >= 1 && requests.length <= 4, 'Expected 1 to 4 selected source requests');
  assert.equal(new Set(requests.map((event) => event.requestId)).size, requests.length);
  assert.equal(transfer.length, requests.length, 'Every request needs a bounded byte count');
  assert.equal(new Set(transfer.map((record) => record.requestId)).size, transfer.length);
  assert.equal(
    protocol.length,
    requests.length * 3,
    'Each request needs one response and one terminal event'
  );
  let nextByte = 0;
  let abortedIndex = -1;
  let abortedAtMs: number | undefined;
  let previousRequestAtMs = -Infinity;
  let finishedCount = 0;
  const settled: NonNullable<MetadataReadinessEvidence['requestSettlement']>['requests'] = [];
  for (const [index, request] of requests.entries()) {
    assert(request.atMs > previousRequestAtMs, 'Selected source requests are out of order');
    previousRequestAtMs = request.atMs;
    if (abortedAtMs !== undefined) {
      assert(request.atMs > abortedAtMs, 'Continuation must follow the aborted request');
    }
    const events = protocol.filter((event) => event.requestId === request.requestId);
    assert.equal(events.length, 3, 'Duplicate or missing request lifecycle event');
    const responses = events.filter((event) => event.phase === 'response');
    const terminals = events.filter(
      (event) => event.phase === 'finished' || event.phase === 'failed'
    );
    assert.equal(responses.length, 1, 'Request needs exactly one response');
    assert.equal(terminals.length, 1, 'Request needs exactly one terminal event');
    const terminal = terminals[0]!;
    assert(request.atMs <= responses[0]!.atMs && responses[0]!.atMs <= terminal.atMs);
    const fullBody = requests.length === 1 && request.range == null && responses[0]?.status === 200;
    if (!fullBody) {
      assert.equal(responses[0]?.status, 206, 'Ranged source response must be partial content');
    }
    const range = fullBody
      ? null
      : /^bytes=(0|[1-9]\d*)-(?:(0|[1-9]\d*))?$/u.exec(request.range ?? '');
    assert(fullBody || range, 'Selected source request needs an exact byte range');
    const start = fullBody ? 0 : Number(range![1]);
    const end = fullBody
      ? assetBytes - 1
      : range![2] === undefined
        ? assetBytes - 1
        : Number(range![2]);
    assert(Number.isSafeInteger(start) && Number.isSafeInteger(end));
    assert(
      start === nextByte && end >= start && end < assetBytes,
      'Range has a hole or exceeds the asset'
    );
    const received = transfer.find((record) => record.requestId === request.requestId);
    assert(received && Number.isSafeInteger(received.dataBytes));
    assert(received.chunks > 0 && received.dataBytes > 0);
    assert(received.dataBytes <= end - start + 1, 'Request received beyond its range');
    if (terminal.phase === 'failed') {
      assert.equal(terminal.errorText, 'net::ERR_ABORTED', 'Unexpected source request failure');
      assert.equal(terminal.blockedReason, undefined);
      assert(terminal.atMs >= tailReleasedAtMs, 'Source request aborted before tail release');
      assert(abortedIndex === -1 && index < requests.length - 1, 'Abort needs one continuation');
      assert(received.dataBytes < end - start + 1, 'Aborted request already covered its range');
      abortedIndex = index;
      abortedAtMs = terminal.atMs;
    } else {
      assert.equal(received.dataBytes, end - start + 1, 'Finished request has incomplete bytes');
      finishedCount++;
      if (abortedIndex !== -1) {
        assert.equal(index, requests.length - 1, 'Abort continuation must be final');
      }
    }
    nextByte += received.dataBytes;
    settled.push({
      requestId: request.requestId,
      rangeStart: start,
      receivedBytes: received.dataBytes,
      terminal: terminal.phase === 'failed' ? 'aborted' : 'finished',
    });
  }
  assert(finishedCount >= 1, 'At least one selected source request must finish');
  assert.equal(nextByte, assetBytes, 'Selected source requests did not cover the asset');
  if (abortedIndex !== -1) {
    assert.equal(abortedIndex, requests.length - 2, 'Abort needs an immediate final continuation');
  }
  return { outcome: abortedIndex === -1 ? 'finished' : 'aborted-continued', requests: settled };
}

async function runMetadataReadinessCase({
  context,
  root,
  output,
  nativeLoopback,
  evidence,
}: {
  context: BrowserContext;
  root: string;
  output: string;
  nativeLoopback: NativeLoopback;
  evidence: MetadataReadinessEvidence;
}) {
  const id = METADATA_READINESS_ID;
  const bestPath = new URL(evidence.bestUrl).pathname;
  const startedAtMs = performance.now();
  const elapsedMs = () => performance.now() - startedAtMs;
  let page: Page | undefined;
  let protocol: CDPSession | undefined;
  let routeArmed = false;
  let nativeMark: number | undefined;
  let primaryError: unknown;
  let caughtPrimaryError = false;
  let lastMetadataPoll: ItemState | null | undefined;
  let captureFrameDiagnostics:
    | ((phase: MetadataFrameSnapshot['phase']) => Promise<void>)
    | undefined;
  const boundedProtocol = (record: MetadataReadinessEvidence['protocol'][number]) => {
    if (evidence.protocol.length >= 32) {
      evidence.overflow = true;
      return;
    }
    evidence.protocol.push(record);
  };
  const onPageError = (error: Error) => {
    if (evidence.pageErrors.length >= 8) {
      evidence.overflow = true;
      return;
    }
    evidence.pageErrors.push(error.message.slice(0, 500));
  };
  const onConsole = (message: ConsoleMessage) => {
    if (message.type() !== 'error') {
      return;
    }
    if (evidence.consoleErrors.length >= 8) {
      evidence.overflow = true;
      return;
    }
    evidence.consoleErrors.push({
      text: message.text().slice(0, 500),
      location: message.location().url.slice(0, 500),
    });
  };
  const routeHandler = async (route: Route) => {
    const request = route.request();
    const target = new URL(request.url());
    if (request.isNavigationRequest() && request.url() === evidence.fixtureUrl) {
      return route.continue();
    }
    if (target.hostname === 'x.com' && target.pathname.endsWith('/TweetResultByRestId')) {
      let requestedId: unknown;
      try {
        requestedId = field(JSON.parse(target.searchParams.get('variables') ?? '{}'), 'tweetId');
      } catch {
        requestedId = undefined;
      }
      if (requestedId !== id || evidence.api.length >= 2) {
        evidence.overflow = true;
        return route.fulfill({ status: 503, body: '' });
      }
      evidence.api.push({ requestedId: id, status: 200 });
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponse(id, 'intentrecovery', 1, 192)),
      });
    }
    if (
      target.hostname === 'pbs.twimg.com' &&
      target.pathname === `/ext_tw_video_thumb/${id}/pu/img/video-0.png`
    ) {
      return route.fulfill({ status: 200, contentType: 'image/png', body: POSTER_PNG });
    }
    if (target.hostname === 'video.twimg.com') {
      if (request.url() !== evidence.bestUrl) {
        evidence.overflow = true;
        return route.fulfill({ status: 503, body: '' });
      }
      return route.continue();
    }
    return route.fallback();
  };
  try {
    const bytes = await readFile(join(root, 'test/e2e/fixtures/installed-metadata-readiness.mp4'));
    assert.equal(bytes.length, 117289, 'Metadata readiness VP9 asset size changed');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), evidence.assetSha256);
    assert.equal(evidence.prefixEnd, 32768, 'The held response prefix boundary changed');
    nativeLoopback.setRecoveryPayloads({ tweetId: id, validMp4: bytes, badMp4: bytes });
    nativeLoopback.setRecoveryDocument({
      tweetId: id,
      html: fixtureHtml(id, 'intentrecovery', 1, 192),
    });
    nativeLoopback.armVideoHold(bestPath, evidence.prefixEnd);
    nativeMark = nativeLoopback.mark();
    const nativeBaseline = nativeLoopback.snapshot();
    page = await context.newPage();
    page.on('pageerror', onPageError);
    page.on('console', onConsole);
    await page.route('**/*', routeHandler);
    routeArmed = true;
    protocol = await context.newCDPSession(page);
    const mediaPlayers = new Map<
      string,
      { matched: boolean; pending: MetadataReadinessEvidence['mediaDiagnostics']['records'] }
    >();
    let mediaRecordCount = 0;
    const media = evidence.mediaDiagnostics;
    const mediaPlayer = (value: unknown) => {
      if (typeof value !== 'string' || value.length > 80) {
        return undefined;
      }
      let player = mediaPlayers.get(value);
      if (!player) {
        if (mediaPlayers.size >= 2) {
          media.overflow = true;
          return undefined;
        }
        player = { matched: false, pending: [] };
        mediaPlayers.set(value, player);
        media.players.push(value);
      }
      return player;
    };
    const decodedMediaValue = (value: unknown): unknown => {
      if (typeof value !== 'string') {
        return undefined;
      }
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    };
    const safeMediaScalar = (value: unknown) =>
      (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') &&
      String(value).length <= 80 &&
      !String(value).includes('://')
        ? String(value)
        : undefined;
    const mediaTracksSummary = (value: unknown) => {
      const parts: string[] = [];
      const walk = (node: unknown, depth: number) => {
        if (depth > 3 || parts.length >= 8) {
          return;
        }
        if (Array.isArray(node)) {
          node.slice(0, 2).forEach((entry) => walk(entry, depth + 1));
        } else if (isRecord(node)) {
          for (const [key, entry] of Object.entries(node)) {
            if (parts.length >= 8) {
              break;
            }
            if (/^(codec|codecName|profile|width|height|codedSize|naturalSize)$/iu.test(key)) {
              const scalar = safeMediaScalar(entry);
              if (scalar) {
                parts.push(`${key}=${scalar}`);
              }
            } else if (Array.isArray(entry) || isRecord(entry)) {
              walk(entry, depth + 1);
            }
          }
        }
      };
      walk(value, 0);
      return parts.length ? parts.join(',').slice(0, 200) : undefined;
    };
    const recordMedia = (playerId: unknown, name: string, value: string) => {
      const player = mediaPlayer(playerId);
      if (!player) {
        return;
      }
      if (mediaRecordCount >= 64) {
        media.overflow = true;
        return;
      }
      mediaRecordCount++;
      const record = { playerId: playerId as string, atMs: elapsedMs(), name, value };
      if (player.matched) {
        media.records.push(record);
      } else {
        player.pending.push(record);
      }
    };
    const matchMediaPlayer = (playerId: unknown) => {
      const player = mediaPlayer(playerId);
      if (!player || player.matched) {
        return;
      }
      player.matched = true;
      media.matchedPlayers.push(playerId as string);
      media.records.push(...player.pending);
      player.pending.length = 0;
    };
    protocol.on('Media.playerPropertiesChanged', (event: unknown) => {
      const playerId = field(event, 'playerId');
      const properties = field(event, 'properties');
      if (!Array.isArray(properties)) {
        return;
      }
      for (const property of properties.slice(0, 32)) {
        const name = field(property, 'name');
        const value = decodedMediaValue(field(property, 'value'));
        if (name === 'kVideoTracks') {
          const summary = mediaTracksSummary(value);
          if (summary) {
            recordMedia(playerId, name, summary);
          }
        } else if (name === 'kResolution') {
          const width = field(value, 'width');
          const height = field(value, 'height');
          if (typeof width === 'number' && typeof height === 'number') {
            recordMedia(playerId, name, `${width}x${height}`);
          }
        } else if (
          name === 'kVideoDecoderName' ||
          name === 'kRendererName' ||
          name === 'kIsPlatformVideoDecoder'
        ) {
          const scalar = safeMediaScalar(value);
          if (scalar) {
            recordMedia(playerId, name, scalar);
          }
        }
      }
      if (properties.length > 32) {
        media.overflow = true;
      }
    });
    protocol.on('Media.playerEventsAdded', (event: unknown) => {
      const playerId = field(event, 'playerId');
      const events = field(event, 'events');
      if (!Array.isArray(events)) {
        return;
      }
      for (const playerEvent of events.slice(0, 32)) {
        const type = field(playerEvent, 'type');
        const value = decodedMediaValue(field(playerEvent, 'value'));
        // kFrameUrl identifies the document; kLoad identifies this exact video resource.
        if (
          type === 'kLoad' &&
          (value === evidence.bestUrl || field(value, 'url') === evidence.bestUrl)
        ) {
          matchMediaPlayer(playerId);
        } else if (type === 'kPipelineStateChange') {
          const state = safeMediaScalar(field(value, 'pipeline_state'));
          if (state) {
            recordMedia(playerId, type, state);
          }
        } else if (type === 'kVideoSizeChanged') {
          const dimensions = field(value, 'dimensions');
          const width = field(dimensions, 'width');
          const height = field(dimensions, 'height');
          if (typeof width === 'number' && typeof height === 'number') {
            recordMedia(playerId, type, `${width}x${height}`);
          }
        }
      }
      if (events.length > 32) {
        media.overflow = true;
      }
    });
    await protocol.send('Media.enable').then(
      () => {
        media.enabled = true;
      },
      (error) => {
        media.error = String(error).slice(0, 300);
      }
    );
    const sourceRequestIds = new Set<string>();
    protocol.on('Network.requestWillBeSent', (event) => {
      if (event.request.url !== evidence.bestUrl) {
        return;
      }
      if (sourceRequestIds.size >= 8 && !sourceRequestIds.has(event.requestId)) {
        evidence.overflow = true;
        return;
      }
      sourceRequestIds.add(event.requestId);
      boundedProtocol({
        requestId: event.requestId,
        phase: 'request',
        atMs: elapsedMs(),
        range: event.request.headers.Range ?? event.request.headers.range ?? null,
      });
    });
    protocol.on('Network.responseReceived', (event) => {
      if (sourceRequestIds.has(event.requestId)) {
        boundedProtocol({
          requestId: event.requestId,
          phase: 'response',
          atMs: elapsedMs(),
          status: event.response.status,
        });
      }
    });
    protocol.on('Network.dataReceived', (event) => {
      if (!sourceRequestIds.has(event.requestId)) {
        return;
      }
      const atMs = elapsedMs();
      let transfer = evidence.transfer.find((record) => record.requestId === event.requestId);
      if (!transfer) {
        if (evidence.transfer.length >= 8) {
          evidence.overflow = true;
          return;
        }
        transfer = {
          requestId: event.requestId,
          chunks: 0,
          dataBytes: 0,
          encodedBytes: 0,
          firstAtMs: atMs,
          lastAtMs: atMs,
        };
        evidence.transfer.push(transfer);
      }
      transfer.chunks++;
      transfer.dataBytes += event.dataLength;
      transfer.encodedBytes += event.encodedDataLength;
      transfer.lastAtMs = atMs;
    });
    protocol.on('Network.loadingFinished', (event) => {
      if (sourceRequestIds.has(event.requestId)) {
        boundedProtocol({ requestId: event.requestId, phase: 'finished', atMs: elapsedMs() });
      }
    });
    protocol.on('Network.loadingFailed', (event) => {
      if (sourceRequestIds.has(event.requestId)) {
        boundedProtocol({
          requestId: event.requestId,
          phase: 'failed',
          atMs: elapsedMs(),
          errorText: event.errorText.slice(0, 200),
          ...(event.blockedReason ? { blockedReason: event.blockedReason } : {}),
        });
      }
    });
    await protocol.send('Network.enable');
    await page.goto(evidence.fixtureUrl);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    const documentBefore = await page.evaluate(() => ({
      url: location.href,
      timeOrigin: performance.timeOrigin,
    }));
    const permissionBefore = await page.evaluate(
      async () => (await navigator.permissions.query({ name: 'loopback-network' })).state
    );
    evidence.permission = { before: permissionBefore };
    await page.evaluate(() => {
      let watchedVideo: HTMLVideoElement | undefined;
      let pendingFrameCallback: number | null = null;
      let disposed = false;
      const state: MetadataReadinessObserver = {
        records: [],
        overflow: false,
        frames: [],
        frameOverflow: false,
        frameSupported: null,
        dispose: () => {
          disposed = true;
          for (const type of ['loadedmetadata', 'loadeddata', 'error']) {
            document.removeEventListener(type, onMediaEvent, true);
          }
          mutationObserver.disconnect();
          let frameCallbackCanceled = pendingFrameCallback === null;
          if (pendingFrameCallback !== null && watchedVideo) {
            watchedVideo.cancelVideoFrameCallback(pendingFrameCallback);
            pendingFrameCallback = null;
            frameCallbackCanceled = true;
          }
          return {
            mutationObserverDisconnected: true,
            frameCallbackCanceled,
          };
        },
      };
      const onVideoFrame: VideoFrameRequestCallback = (_now, metadata) => {
        pendingFrameCallback = null;
        if (disposed) {
          return;
        }
        if (state.frames.length >= 8) {
          state.frameOverflow = true;
          return;
        }
        state.frames.push({
          atPageMonotonicMs: performance.now(),
          presentedFrames: metadata.presentedFrames,
          mediaTime: metadata.mediaTime,
          width: metadata.width,
          height: metadata.height,
        });
        if (state.frames.length < 8 && watchedVideo) {
          pendingFrameCallback = watchedVideo.requestVideoFrameCallback(onVideoFrame);
        } else if (state.frames.length >= 8) {
          state.frameOverflow = true;
        }
      };
      const watchVideo = () => {
        if (watchedVideo || disposed) {
          return;
        }
        const video = document.querySelector<HTMLVideoElement>(
          '[data-gallery-element="item"][data-index="0"] video'
        );
        if (!video) {
          return;
        }
        watchedVideo = video;
        state.frameSupported = typeof video.requestVideoFrameCallback === 'function';
        if (state.frameSupported) {
          pendingFrameCallback = video.requestVideoFrameCallback(onVideoFrame);
        }
      };
      const mutationObserver = new MutationObserver(watchVideo);
      mutationObserver.observe(document.documentElement, { childList: true, subtree: true });
      watchVideo();
      const onMediaEvent = (event: Event) => {
        const video = event.target;
        if (
          !(video instanceof HTMLVideoElement) ||
          !video.closest('[data-gallery-element="item"][data-index="0"]')
        ) {
          return;
        }
        if (state.records.length >= 32) {
          state.overflow = true;
          return;
        }
        state.records.push({
          type: event.type as MetadataReadinessEvent['type'],
          trusted: event.isTrusted,
          atPageMonotonicMs: performance.now(),
          currentSrc: video.currentSrc,
          readyState: video.readyState,
          errorCode: video.error?.code ?? null,
        });
      };
      for (const type of ['loadedmetadata', 'loadeddata', 'error']) {
        document.addEventListener(type, onMediaEvent, true);
      }
      window.__xegMetadataReadinessObservation = state;
    });
    captureFrameDiagnostics = async (phase: MetadataFrameSnapshot['phase']) => {
      if (!page || page.isClosed() || evidence.frameDiagnostics.snapshots.length >= 8) {
        return;
      }
      try {
        const snapshot = await page.evaluate(
          ({ expectedVideoUrl, expectedPoster }) => {
            const frames = window.__xegMetadataReadinessObservation?.frames ?? [];
            const video = document.querySelector<HTMLVideoElement>(
              '[data-gallery-element="item"][data-index="0"] video'
            );
            if (!video) {
              return {
                callbackCount: frames.length,
                lastCallback: frames.at(-1) ?? null,
                video: null,
              };
            }
            const style = getComputedStyle(video);
            const parentStyle = video.parentElement ? getComputedStyle(video.parentElement) : null;
            const rect = video.getBoundingClientRect();
            const quality = video.getVideoPlaybackQuality?.();
            const decoded = (video as HTMLVideoElement & { webkitDecodedFrameCount?: number })
              .webkitDecodedFrameCount;
            return {
              callbackCount: frames.length,
              lastCallback: frames.at(-1) ?? null,
              video: {
                currentSrcMatches: video.currentSrc === expectedVideoUrl,
                posterPresent: Boolean(video.poster),
                posterMatches: video.poster === expectedPoster,
                controls: video.controls,
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                objectFit: style.objectFit,
                parentDisplay: parentStyle?.display ?? null,
                parentVisibility: parentStyle?.visibility ?? null,
                parentOpacity: parentStyle?.opacity ?? null,
                width: video.videoWidth,
                height: video.videoHeight,
                rect: { width: rect.width, height: rect.height },
                ...(quality
                  ? {
                      quality: {
                        totalVideoFrames: quality.totalVideoFrames,
                        droppedVideoFrames: quality.droppedVideoFrames,
                        corruptedVideoFrames: quality.corruptedVideoFrames,
                      },
                    }
                  : {}),
                ...(typeof decoded === 'number' ? { webkitDecodedFrameCount: decoded } : {}),
              },
            };
          },
          { expectedVideoUrl: evidence.bestUrl, expectedPoster: posterUrl(id, 0) }
        );
        evidence.frameDiagnostics.snapshots.push({ phase, atMs: elapsedMs(), ...snapshot });
      } catch (error) {
        if (evidence.frameDiagnostics.errors.length < 8) {
          evidence.frameDiagnostics.errors.push(String(error).slice(0, 300));
        }
      }
    };
    const trigger = page.locator('[data-video-target="0"]');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    const beforeHost = await page.evaluate(() => ({
      scrollY,
      bodyStyle: document.body.getAttribute('style'),
      activeTarget: document.activeElement?.getAttribute('data-video-target') ?? null,
    }));
    assert.equal(beforeHost.activeTarget, '0');
    await trigger.click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    const stateWhen = (
      predicate: (state: ItemState) => boolean,
      description: string,
      sampleMetadata = false
    ) =>
      waitForValue(
        async () => {
          const state = await itemState(page!, 0);
          if (sampleMetadata) {
            lastMetadataPoll = state;
            if (evidence.stateSamples.length === 0) {
              evidence.stateSamples.push({ phase: 'first-poll', atMs: elapsedMs(), state });
              await captureFrameDiagnostics?.('first-poll');
            }
          }
          return state && predicate(state) ? state : undefined;
        },
        description,
        15_000
      );
    const metadataBefore = await stateWhen(
      (state) =>
        state.currentIndex === 0 &&
        state.focusedIndex === 0 &&
        state.src === evidence.bestUrl &&
        state.currentSrc === evidence.bestUrl &&
        state.displayUrl === evidence.bestUrl &&
        state.metadata === 'true' &&
        state.firstFrame === 'false' &&
        state.readyState === 1 &&
        state.videoWidth === 320 &&
        state.videoHeight === 192 &&
        state.error === null &&
        state.paused &&
        state.currentTime <= 0.05,
      'selected metadata without a decoded frame',
      true
    );
    const metadataStartedAt = performance.now();
    await page.waitForTimeout(700);
    const metadataAfter = await itemState(page, 0);
    await captureFrameDiagnostics('stable-hold');
    assert(metadataAfter);
    for (const state of [metadataBefore, metadataAfter]) {
      assert.equal(state.readyState, 1);
      assert.equal(state.firstFrame, 'false');
      assert.equal(state.error, null);
      assert.equal(state.paused, true);
      assert(state.currentTime <= 0.05);
      assert.equal(state.currentSrc, evidence.bestUrl);
      assert.equal(state.videoWidth, 320);
      assert.equal(state.videoHeight, 192);
    }
    evidence.metadata = {
      before: metadataBefore,
      after: metadataAfter,
      observationMs: performance.now() - metadataStartedAt,
    };
    assert(nativeLoopback.videoHeld(), 'The native video tail must still be held');
    evidence.nativeBeforeRelease = nativeLoopback.since(nativeMark);
    const held = evidence.nativeBeforeRelease.find(
      (event) =>
        event.host === 'video.twimg.com' && event.path === bestPath && event.result === 'video-held'
    );
    assert(held, 'No exact native held video request reached the loopback');
    assert.equal(held.prefixBytesQueued, evidence.prefixEnd);
    assert([200, 206].includes(held.status));
    assert.equal(held.finishedAtMs, undefined);
    const eventsBefore = await page.evaluate(() => {
      const state = window.__xegMetadataReadinessObservation;
      return state ? { records: state.records, overflow: state.overflow } : null;
    });
    assert(eventsBefore && !eventsBefore.overflow);
    assert(
      eventsBefore.records.some(
        (event) =>
          event.type === 'loadedmetadata' && event.trusted && event.currentSrc === evidence.bestUrl
      ),
      'A native selected loadedmetadata event was not observed'
    );
    assert(
      eventsBefore.records.every((event) => event.type !== 'loadeddata' && event.type !== 'error'),
      'A first frame or media error arrived before the held tail was released'
    );
    assert(
      evidence.protocol.some((event) => event.phase === 'request') &&
        evidence.protocol.some(
          (event) => event.phase === 'response' && [200, 206].includes(event.status ?? 0)
        ),
      'The source request and response headers were not observed through CDP'
    );
    const metadataScreenshot = 'src03-metadata-only.png';
    await page.screenshot({ path: join(output, metadataScreenshot) });
    evidence.screenshots.push(metadataScreenshot);
    await captureFrameDiagnostics('pre-tail-release');
    const beforeTailFrame = evidence.frameDiagnostics.snapshots.at(-1);
    assert.equal(beforeTailFrame?.phase, 'pre-tail-release');
    assert.equal(beforeTailFrame.callbackCount, 0, 'A frame was presented before tail release');
    assert.equal(beforeTailFrame.video?.quality?.totalVideoFrames, 0);
    assert.equal(beforeTailFrame.video?.webkitDecodedFrameCount ?? 0, 0);
    nativeLoopback.completeVideoHold();
    evidence.timing.tailReleasedAtMs = elapsedMs();
    const frameBefore = await stateWhen(
      (state) =>
        state.src === evidence.bestUrl &&
        state.currentSrc === evidence.bestUrl &&
        state.firstFrame === 'true' &&
        state.readyState >= 2 &&
        state.videoWidth === 320 &&
        state.videoHeight === 192 &&
        state.error === null &&
        state.paused &&
        state.currentTime <= 0.05,
      'first native frame while the fresh video remains paused'
    );
    const frameStartedAt = performance.now();
    await page.waitForTimeout(700);
    const frameAfter = await itemState(page, 0);
    await captureFrameDiagnostics('after-tail');
    const afterTailFrame = evidence.frameDiagnostics.snapshots.at(-1);
    assert.equal(afterTailFrame?.phase, 'after-tail');
    assert(afterTailFrame.callbackCount >= 1, 'No frame callback followed tail release');
    assert((afterTailFrame.video?.quality?.totalVideoFrames ?? 0) >= 1);
    if (afterTailFrame.video?.webkitDecodedFrameCount !== undefined) {
      assert(afterTailFrame.video.webkitDecodedFrameCount >= 1);
    }
    assert.equal(afterTailFrame.lastCallback?.width, 320);
    assert.equal(afterTailFrame.lastCallback?.height, 192);
    assert(frameAfter);
    for (const state of [frameBefore, frameAfter]) {
      assert.equal(state.src, evidence.bestUrl);
      assert.equal(state.currentSrc, evidence.bestUrl);
      assert.equal(state.firstFrame, 'true');
      assert(state.readyState >= 2);
      assert.equal(state.error, null);
      assert.equal(state.paused, true);
      assert(state.currentTime <= 0.05);
    }
    evidence.firstFrame = {
      before: frameBefore,
      after: frameAfter,
      observationMs: performance.now() - frameStartedAt,
    };
    const eventsAfter = await page.evaluate(() => {
      const state = window.__xegMetadataReadinessObservation;
      return state ? { records: state.records, overflow: state.overflow } : null;
    });
    assert(
      eventsAfter?.records.some(
        (event) =>
          event.type === 'loadeddata' && event.trusted && event.currentSrc === evidence.bestUrl
      ),
      'A native first-frame loadeddata event was not observed'
    );
    const frameScreenshot = 'src03-first-frame-paused.png';
    await page.screenshot({ path: join(output, frameScreenshot) });
    evidence.screenshots.push(frameScreenshot);
    await gallery.locator('[data-gallery-element="item"][data-index="0"] video').click();
    const playing = await stateWhen(
      (state) =>
        state.src === evidence.bestUrl &&
        state.currentSrc === evidence.bestUrl &&
        state.error === null &&
        !state.paused &&
        state.currentTime > frameAfter.currentTime + 0.15,
      'ordinary Play to advance the selected preferred video'
    );
    await captureFrameDiagnostics('play');
    evidence.playback = { before: frameAfter, after: playing };
    const playingScreenshot = 'src03-playing.png';
    await page.screenshot({ path: join(output, playingScreenshot) });
    evidence.screenshots.push(playingScreenshot);
    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    const afterHost = await page.evaluate(() => ({
      scrollY,
      bodyStyle: document.body.getAttribute('style'),
      activeTarget: document.activeElement?.getAttribute('data-video-target') ?? null,
    }));
    evidence.host = { before: beforeHost, after: afterHost };
    assert.deepEqual(afterHost, beforeHost, 'SRC-03 close did not restore the host state');
    const documentAfter = await page.evaluate(() => ({
      url: location.href,
      timeOrigin: performance.timeOrigin,
    }));
    assert.deepEqual(documentAfter, documentBefore, 'SRC-03 left its original document');
    evidence.permission.after = await page.evaluate(
      async () => (await navigator.permissions.query({ name: 'loopback-network' })).state
    );
    assert.equal(evidence.permission.after, evidence.permission.before);
    evidence.nativeAfterRelease = nativeLoopback.since(nativeMark);
    const completed = evidence.nativeAfterRelease.find((event) => event.atMs === held.atMs);
    assert(
      completed && completed.result === 'served' && typeof completed.finishedAtMs === 'number'
    );
    const servedStart = completed.range?.start ?? 0;
    const servedEnd = completed.range?.end ?? bytes.length - 1;
    const servedSlice = bytes.subarray(servedStart, servedEnd + 1);
    assert.equal(completed.bytes, servedSlice.length);
    assert.equal(completed.sha256, createHash('sha256').update(servedSlice).digest('hex'));
    assert(
      evidence.nativeAfterRelease.some(
        (event) =>
          event.host === 'x.com' &&
          event.path === new URL(evidence.fixtureUrl).pathname &&
          event.result === 'served'
      ),
      'The requesting document was not served by the native HTTPS loopback'
    );
    evidence.requestSettlement = assertMetadataSourceRequestSettlement(
      evidence.protocol,
      evidence.transfer,
      bytes.length,
      evidence.timing.tailReleasedAtMs!
    );
    const nativeVideoTransfers = evidence.nativeAfterRelease.filter(
      (event) => event.host === 'video.twimg.com' && event.path === bestPath
    );
    for (const event of nativeVideoTransfers) {
      assert.equal(event.result, 'served', 'Native video transfer did not finish');
      const start: number = event.range?.start ?? 0;
      const end: number = event.range?.end ?? bytes.length - 1;
      assert(start >= 0 && end >= start && end < bytes.length);
      const slice = bytes.subarray(start, end + 1);
      assert.equal(event.bytes, slice.length);
      assert.equal(event.sha256, createHash('sha256').update(slice).digest('hex'));
    }
    for (const request of evidence.requestSettlement.requests) {
      assert(
        nativeVideoTransfers.some((event) => (event.range?.start ?? 0) === request.rangeStart),
        'Selected browser range lacks a matching native transfer'
      );
    }
    assert.equal(evidence.api.length, 1);
    assert.equal(evidence.overflow, false);
    assert.deepEqual(evidence.pageErrors, []);
    assert.deepEqual(evidence.consoleErrors, []);
    const nativeAfter = nativeLoopback.snapshot();
    assert.equal(nativeAfter.unexpectedCount, nativeBaseline.unexpectedCount);
    assert.equal(nativeAfter.overflow, false);
    evidence.status = 'passed';
  } catch (error) {
    caughtPrimaryError = true;
    primaryError = error;
    evidence.status = 'failed';
    evidence.error = String(error).slice(0, 1000);
    evidence.timing.failureAtMs = elapsedMs();
    if (lastMetadataPoll !== undefined && evidence.stateSamples.length < 4) {
      evidence.stateSamples.push({
        phase: 'last-poll',
        atMs: elapsedMs(),
        state: lastMetadataPoll,
      });
    }
    if (nativeMark !== undefined && evidence.nativeBeforeRelease === undefined) {
      evidence.nativeBeforeRelease = nativeLoopback.since(nativeMark);
    }
    const heldBeforeRelease = nativeLoopback.videoHeld();
    const probe: NonNullable<MetadataReadinessEvidence['failureProbe']> = {
      heldBeforeRelease,
      outcome: heldBeforeRelease ? 'unavailable' : 'not-held',
      terminalObserved: false,
    };
    evidence.failureProbe = probe;
    if (page && !page.isClosed()) {
      try {
        const state = await itemState(page, 0);
        if (evidence.stateSamples.length < 4) {
          evidence.stateSamples.push({ phase: 'on-failure', atMs: elapsedMs(), state });
        }
      } catch (sampleError) {
        probe.error = `Failure state read: ${String(sampleError).slice(0, 500)}`;
      }
      await captureFrameDiagnostics?.('on-failure');
    }
    if (page && !page.isClosed() && evidence.screenshots.length < 2) {
      const screenshot = 'src03-failure.png';
      await page
        .screenshot({ path: join(output, screenshot) })
        .then(() => {
          evidence.screenshots.push(screenshot);
        })
        .catch((screenshotError) => {
          evidence.screenshotError = String(screenshotError).slice(0, 500);
        });
    }
    if (heldBeforeRelease) {
      try {
        nativeLoopback.completeVideoHold();
        evidence.timing.tailReleasedAtMs = elapsedMs();
        if (page && !page.isClosed()) {
          probe.outcome = 'no-metadata';
          const deadline = Date.now() + 4_000;
          let latestState: ItemState | null = null;
          do {
            latestState = await itemState(page, 0);
            if (latestState?.currentSrc === evidence.bestUrl && latestState.readyState >= 1) {
              probe.outcome = 'metadata';
            }
            probe.terminalObserved =
              nativeMark !== undefined &&
              nativeLoopback
                .since(nativeMark)
                .some(
                  (event) =>
                    event.host === 'video.twimg.com' &&
                    event.path === bestPath &&
                    ['served', 'aborted'].includes(event.result)
                );
            if (probe.outcome === 'metadata' && probe.terminalObserved) {
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
          } while (Date.now() < deadline);
          await page.waitForTimeout(700);
          latestState = await itemState(page, 0);
          await captureFrameDiagnostics?.('after-tail');
          if (evidence.stateSamples.length < 4) {
            evidence.stateSamples.push({
              phase: 'after-tail',
              atMs: elapsedMs(),
              state: latestState,
            });
          }
        }
        if (nativeMark !== undefined) {
          evidence.nativeAfterRelease = nativeLoopback.since(nativeMark);
        }
      } catch (probeError) {
        probe.outcome = 'error';
        probe.error = String(probeError).slice(0, 500);
      }
    }
  } finally {
    if (nativeMark !== undefined && evidence.nativeBeforeRelease === undefined) {
      evidence.nativeBeforeRelease = nativeLoopback.since(nativeMark);
    }
    if (nativeLoopback.videoHeld()) {
      evidence.timing.abortAtMs = elapsedMs();
    }
    nativeLoopback.abortVideoHold();
    evidence.cleanup.videoHoldReleased = !nativeLoopback.videoHeld();
    if (nativeMark !== undefined && evidence.nativeAfterRelease === undefined) {
      evidence.nativeAfterRelease = nativeLoopback.since(nativeMark);
    }
    if (page && !page.isClosed()) {
      try {
        const observed = await page.evaluate(() => {
          const state = window.__xegMetadataReadinessObservation;
          const result = {
            records: state?.records ?? [],
            overflow: state?.overflow ?? false,
            frames: state?.frames ?? [],
            frameOverflow: state?.frameOverflow ?? false,
            frameSupported: state?.frameSupported ?? null,
            frameCleanup: state?.dispose() ?? {
              mutationObserverDisconnected: false,
              frameCallbackCanceled: false,
            },
          };
          delete window.__xegMetadataReadinessObservation;
          return result;
        });
        evidence.events = observed.records;
        evidence.overflow ||= observed.overflow;
        evidence.frameDiagnostics.callbacks = observed.frames;
        evidence.frameDiagnostics.overflow = observed.frameOverflow;
        evidence.frameDiagnostics.supported = observed.frameSupported;
        evidence.frameDiagnostics.cleanup = observed.frameCleanup;
        evidence.cleanup.observerRemoved = true;
      } catch (error) {
        evidence.cleanup.errors.push(String(error).slice(0, 500));
      }
    } else {
      evidence.cleanup.observerRemoved = page === undefined;
    }
    if (page && routeArmed) {
      await page
        .unroute('**/*', routeHandler)
        .then(() => {
          evidence.cleanup.routeRemoved = true;
        })
        .catch((error) => {
          evidence.cleanup.errors.push(String(error).slice(0, 500));
        });
    } else {
      evidence.cleanup.routeRemoved = true;
    }
    if (page) {
      page.off('pageerror', onPageError);
      page.off('console', onConsole);
      evidence.cleanup.listenersRemoved = true;
    } else {
      evidence.cleanup.listenersRemoved = true;
    }
    if (protocol) {
      await protocol
        .detach()
        .then(() => {
          evidence.cleanup.protocolDetached = true;
        })
        .catch((error) => {
          evidence.cleanup.errors.push(String(error).slice(0, 500));
        });
    } else {
      evidence.cleanup.protocolDetached = true;
    }
    if (page) {
      await page
        .close()
        .then(() => {
          evidence.cleanup.pageClosed = true;
        })
        .catch((error) => {
          evidence.cleanup.errors.push(String(error).slice(0, 500));
        });
    } else {
      evidence.cleanup.pageClosed = true;
    }
    if (evidence.cleanup.errors.length) {
      evidence.status = 'failed';
    }
    if (evidence.overflow || evidence.pageErrors.length || evidence.consoleErrors.length) {
      evidence.status = 'failed';
      evidence.error ??= 'Late metadata readiness observations failed their bounded checks';
    }
    await writeFile(
      join(output, 'video-metadata-readiness-observations.json'),
      JSON.stringify(evidence, null, 2)
    ).catch((error) => {
      evidence.cleanup.errors.push(`Receipt write failed: ${String(error).slice(0, 500)}`);
      evidence.status = 'failed';
    });
  }
  if (evidence.cleanup.errors.length) {
    throw new AggregateError(
      caughtPrimaryError ? [primaryError, ...evidence.cleanup.errors] : evidence.cleanup.errors,
      'Metadata readiness case cleanup failed'
    );
  }
  if (caughtPrimaryError) {
    throw primaryError;
  }
  assert.equal(evidence.status, 'passed', evidence.error ?? 'Metadata readiness case failed');
}

/** A bounded real decode failure after playback; MP4 metadata and early samples stay valid. */
function delayedDecodeFailure(validMp4: Buffer) {
  assert.equal(
    createHash('sha256').update(validMp4).digest('hex'),
    '3b05e69ea7e64237743b75168c7c3b605ed6ffb0b8da74554ed97189a5b83916',
    'The declared four-second H.264 fixture changed; recheck its sample table'
  );
  assert.equal(validMp4.length, 207662);
  const bytes = Buffer.from(validMp4);
  // The declared CBR fixture has 72 complete samples before byte 153895 (3 s).
  // Corrupt only later VCL NAL length fields; atoms and sample tables stay intact.
  const lateVclLengths = [
    153919, 161216, 163606, 165379, 167440, 169249, 171144, 172860, 174929, 177159, 179110, 181253,
    183141, 185385, 187421, 189541, 191734, 193740, 195964, 197934, 200092, 202226, 204109, 206090,
  ];
  for (const offset of lateVclLengths) {
    const sampleType = bytes[offset + 4];
    assert(
      sampleType !== undefined && [1, 5].includes(sampleType & 31),
      'Expected a declared VCL sample'
    );
    bytes.writeUInt32BE(0xffffffff, offset);
  }
  return { bytes, prefixEnd: 153895 };
}

async function runRecoveryIntentCases({
  context,
  validMp4,
  auxiliaryMp4,
  output,
  nativeLoopback,
}: {
  context: BrowserContext;
  validMp4: Buffer;
  auxiliaryMp4: Buffer;
  output: string;
  nativeLoopback: NativeLoopback;
}) {
  assert(
    typeof nativeLoopback.armVideoHold === 'function' &&
      typeof nativeLoopback.completeVideoHold === 'function' &&
      typeof nativeLoopback.abortVideoHold === 'function'
  );
  const damaged = delayedDecodeFailure(validMp4);
  const cases: RecoveryCase[] = [];
  const requests: RecoveryRequest[] = [];
  const pages: Page[] = [];
  const evidence: RecoveryEvidence = {
    status: 'running',
    cases,
    requests,
    prefixEnd: damaged.prefixEnd,
    bestPayloadSha256: createHash('sha256').update(damaged.bytes).digest('hex'),
    pausedObservationMs: 700,
    maxMediaEvents: 64,
    cleanup: {
      routesRemoved: false,
      pagesClosed: false,
      videoHoldReleased: false,
      fixturePermissionRestored: false,
      permissionSessionDetached: false,
    },
  };
  let active: RecoveryActive | undefined;
  let primaryError: unknown;
  let caughtPrimaryError = false;
  let cleanupError: AggregateError | undefined;
  let permissionSession: CDPSession | undefined;
  let permissionBefore: PermissionState | undefined;
  let permissionPage: Page | undefined;
  const handler = async (route: Route) => {
    if (!active) {
      return route.fallback();
    }
    const target = new URL(route.request().url());
    if (route.request().isNavigationRequest() && target.href === active.url) {
      // Keep the requesting document's address space observable to the browser.
      return route.continue();
    }
    if (target.hostname === 'x.com' && target.pathname.endsWith('/TweetResultByRestId')) {
      let id: unknown;
      try {
        id = field(JSON.parse(target.searchParams.get('variables') ?? '{}'), 'tweetId');
      } catch {
        return route.fallback();
      }
      if (id === active.id) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(apiResponse(id, 'intentrecovery')),
        });
      }
    }
    if (
      target.hostname === 'pbs.twimg.com' &&
      target.pathname.startsWith(`/ext_tw_video_thumb/${active.id}/pu/img/video-`)
    ) {
      return route.fulfill({ status: 200, contentType: 'image/png', body: POSTER_PNG });
    }
    if (target.hostname === 'video.twimg.com') {
      const match = new RegExp(
        `^/ext_tw_video/${active.id}/pu/vid/320x180/video-([0-7])-(best|lower)\\.mp4$`,
        'u'
      ).exec(target.pathname);
      if (!match || (match[2] === 'lower' && match[1] !== '0')) {
        return route.fallback();
      }
      assert(requests.length < MAX_REQUESTS, 'Recovery-intent request observations overflowed');
      const record: RecoveryRequest = {
        case: active.name,
        index: Number(match[1]),
        quality: match[2],
        atMonotonicMs: performance.now(),
        range: route.request().headers().range ?? null,
      };
      requests.push(record);
      if (match[1] === '0' && match[2] === 'best') {
        // Only this exact declared source reaches the bounded mapped HTTPS server.
        return route.continue();
      }
      if (match[2] === 'lower') {
        await active.lowerGate;
      }
      const payload = match[1] === '0' ? validMp4 : auxiliaryMp4;
      const range = /^bytes=(\d+)-(\d*)$/u.exec(route.request().headers().range ?? '');
      const start = range ? Number(range[1]) : 0;
      const end = Math.min(range?.[2] ? Number(range[2]) : payload.length - 1, payload.length - 1);
      assert(
        start >= 0 && start <= end && end < payload.length,
        'Unexpected controlled media range'
      );
      const bytes = payload.subarray(start, end + 1);
      record.fulfilledAtMonotonicMs = performance.now();
      return route.fulfill({
        status: range ? 206 : 200,
        contentType: 'video/mp4',
        body: bytes,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': String(bytes.length),
          ...(range ? { 'Content-Range': `bytes ${start}-${end}/${payload.length}` } : {}),
        },
      });
    }
    return route.fallback();
  };
  const stateWhen = (
    page: Page,
    predicate: (value: ItemState) => boolean,
    description: string,
    timeout = 15_000
  ) =>
    waitForValue(
      async () => {
        const value = await itemState(page, 0);
        return value !== null && predicate(value) ? value : undefined;
      },
      description,
      timeout
    );
  const scrollOut = async (page: Page) => {
    await page.locator('[data-xeg-gallery-container] [data-gallery-element="items"]').hover();
    await page.mouse.wheel(0, 1500);
    return stateWhen(
      page,
      (value) => value.box.bottom < value.viewport.top - 4 && value.paused && value.muted,
      'recovering video to become outside, paused and visibility-muted'
    );
  };
  const scrollBack = async (page: Page) => {
    await page.locator('[data-xeg-gallery-container] [data-gallery-element="items"]').hover();
    await page.mouse.wheel(0, -1500);
    return stateWhen(
      page,
      (value) =>
        value.box.top >= value.viewport.top - 1 && value.box.bottom <= value.viewport.bottom + 1,
      'recovering video to return inside the scrollport'
    );
  };
  const stablePaused = async (page: Page, expectedSource: string) => {
    const first = await stateWhen(
      page,
      (value) => value.metadata === 'true' && value.readyState >= 1 && !value.seeking,
      'replacement metadata and settled seek'
    );
    await page.waitForTimeout(evidence.pausedObservationMs);
    const after = await itemState(page, 0);
    assert(after);
    for (const state of [first, after]) {
      assert.equal(
        state.src,
        expectedSource,
        'Paused observation changed the recovery source attribute'
      );
      assert.equal(
        state.currentSrc,
        expectedSource,
        'Paused observation used a different active source'
      );
      assert.equal(state.error, null, 'Paused replacement developed a native media error');
    }
    assert.equal(after.paused, true, 'Delayed recovery resumed contrary to fresh intent');
    assert(
      after.currentTime - first.currentTime <= 0.05,
      'Playback progressed during the required paused observation'
    );
    return { before: first, after, progress: after.currentTime - first.currentTime };
  };
  await context.route('**/*', handler);
  try {
    // Native HTTPS document and media share the owned loopback address space.
    // Permission observations are read-only; no permission is overridden.
    permissionPage = context.pages().find((value) => value.url().startsWith('https://x.com/'));
    assert(permissionPage, 'An existing owned fixture page is required');
    const browser = context.browser();
    assert(browser, 'The installed persistent Chromium browser is required');
    permissionSession = await browser.newBrowserCDPSession();
    const contexts = await permissionSession.send('Target.getBrowserContexts');
    assert.deepEqual(
      contexts.browserContextIds,
      [],
      'This fixture requires its isolated persistent default context'
    );
    permissionBefore = await permissionPage.evaluate(
      async () => (await navigator.permissions.query({ name: 'loopback-network' })).state
    );
    evidence.fixturePermission = {
      name: 'loopback-network',
      origin: 'https://x.com',
      context: 'owned-persistent-default',
      before: permissionBefore,
      modified: false,
    };
    evidence.browserVersion = await permissionSession.send('Browser.getVersion');
    for (const [index, name] of [
      'metadata-while-outside',
      'reenter-before-metadata',
      'later-user-pause-mute-volume',
    ].entries()) {
      const id = `466600011122233377${index + 1}`;
      let releaseLower: () => void = () => {};
      const lowerGate = new Promise<void>((resolve) => {
        releaseLower = resolve;
      });
      active = { id, name, url: `https://x.com/intentrecovery/status/${id}`, lowerGate };
      nativeLoopback.setRecoveryPayloads({ tweetId: id, validMp4, badMp4: damaged.bytes });
      nativeLoopback.setRecoveryDocument({ tweetId: id, html: fixtureHtml(id, 'intentrecovery') });
      const nativeMark = nativeLoopback.mark();
      nativeLoopback.armVideoHold(new URL(videoUrl(id, 0)).pathname, damaged.prefixEnd);
      const page = await context.newPage();
      pages.push(page);
      const observed: RecoveryCase = {
        name,
        id,
        status: 'running',
        best: videoUrl(id, 0),
        lower: videoUrl(id, 0, 'lower'),
        pageErrors: [],
        requestFailures: [],
        consoleErrors: [],
        networkProtocol: {
          requests: [],
          clientSecurity: [],
          failures: [],
          issues: [],
          overflow: false,
        },
      };
      cases.push(observed);
      const protocol = await context.newCDPSession(page);
      const nativeRequestIds = new Set<string>();
      const boundedProtocolRecord = (
        records: Record<string, unknown>[],
        record: Record<string, unknown>
      ) => {
        if (records.length >= MAX_REQUESTS) {
          observed.networkProtocol.overflow = true;
          return;
        }
        records.push(record);
      };
      protocol.on('Network.requestWillBeSent', (event) => {
        if (event.request.url !== observed.best) {
          return;
        }
        if (nativeRequestIds.size >= MAX_REQUESTS && !nativeRequestIds.has(event.requestId)) {
          observed.networkProtocol.overflow = true;
          return;
        }
        nativeRequestIds.add(event.requestId);
        boundedProtocolRecord(observed.networkProtocol.requests, {
          requestId: event.requestId,
          frameId: event.frameId,
          type: event.type,
          initiatorType: event.initiator.type,
        });
      });
      protocol.on('Network.loadingFailed', (event) => {
        if (!nativeRequestIds.has(event.requestId)) {
          return;
        }
        boundedProtocolRecord(observed.networkProtocol.failures, {
          requestId: event.requestId,
          errorText: event.errorText,
          blockedReason: event.blockedReason,
          corsErrorStatus: event.corsErrorStatus,
        });
      });
      protocol.on('Network.requestWillBeSentExtraInfo', (event) => {
        if (!nativeRequestIds.has(event.requestId) || !event.clientSecurityState) {
          return;
        }
        boundedProtocolRecord(observed.networkProtocol.clientSecurity, {
          requestId: event.requestId,
          clientSecurityState: event.clientSecurityState,
        });
      });
      const requestingDocumentUrl = active.url;
      protocol.on('Network.responseReceived', (event) => {
        if (event.response.url !== requestingDocumentUrl) {
          return;
        }
        observed.requestingDocumentTransport = {
          remoteAddress: event.response.remoteIPAddress,
          remotePort: event.response.remotePort,
          protocol: event.response.protocol,
          fromServiceWorker: event.response.fromServiceWorker,
        };
      });
      protocol.on('Audits.issueAdded', ({ issue }) => {
        const details = issue.details.corsIssueDetails;
        if (details?.request?.url !== observed.best) {
          return;
        }
        boundedProtocolRecord(observed.networkProtocol.issues, {
          code: issue.code,
          corsErrorStatus: details.corsErrorStatus,
          requestId: details.request.requestId,
          resourceIPAddressSpace: details.resourceIPAddressSpace,
          clientSecurityState: details.clientSecurityState,
          initiatorOrigin: details.initiatorOrigin,
        });
      });
      await protocol.send('Network.enable');
      await protocol.send('Audits.enable');
      const onPageError = (error: Error) => {
        if (observed.pageErrors.length >= MAX_REQUESTS) {
          observed.eventOverflow = true;
          return;
        }
        observed.pageErrors.push(error.message.slice(0, 500));
      };
      const onRequestFailed = (request: Request) => {
        if (observed.requestFailures.length >= MAX_REQUESTS) {
          observed.eventOverflow = true;
          return;
        }
        observed.requestFailures.push({ url: request.url(), reason: request.failure()?.errorText });
      };
      const onConsole = (message: ConsoleMessage) => {
        if (message.type() !== 'error') {
          return;
        }
        if (observed.consoleErrors.length >= MAX_REQUESTS) {
          observed.eventOverflow = true;
          return;
        }
        observed.consoleErrors.push({
          text: message.text().slice(0, 500),
          location: message.location().url,
        });
      };
      page.on('pageerror', onPageError);
      page.on('requestfailed', onRequestFailed);
      page.on('console', onConsole);
      try {
        await page.setViewportSize({ width: 1280, height: 500 });
        await page.goto(active.url);
        await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
        observed.permission = await page.evaluate(
          async () => (await navigator.permissions.query({ name: 'loopback-network' })).state
        );
        const { frameTree } = await protocol.send('Page.getFrameTree');
        observed.requestingFrame = {
          id: frameTree.frame.id,
          securityOrigin: frameTree.frame.securityOrigin,
          secureContextType: frameTree.frame.secureContextType,
          childFrameCount: frameTree.childFrames?.length ?? 0,
        };
        observed.documentSecurity = await page.evaluate(async () => ({
          origin: location.origin,
          secureContext: isSecureContext,
          permission: (await navigator.permissions.query({ name: 'loopback-network' })).state,
        }));
        await page.locator('[data-video-target="0"]').click();
        await page.locator('[data-xeg-gallery-container]').waitFor({ state: 'visible' });
        const originalControl = page
          .locator('[data-xeg-gallery-container]')
          .getByRole('button', { name: 'Original', exact: true });
        if ((await originalControl.getAttribute('aria-pressed')) !== 'true') {
          await originalControl.click();
        }
        const video = page.locator('[data-gallery-element="item"][data-index="0"] video');
        await video.evaluate((element) => {
          if (!(element instanceof HTMLVideoElement)) {
            throw new Error('The recovery item is not a video');
          }
          const state: RecoveryEventState = { records: [], overflow: false, listeners: [] };
          for (const type of [
            'loadstart',
            'loadedmetadata',
            'loadeddata',
            'play',
            'playing',
            'pause',
            'error',
            'volumechange',
            'keydown',
          ]) {
            const listener = (event: Event) => {
              if (state.records.length >= 64) {
                state.overflow = true;
                return;
              }
              state.records.push({
                type,
                trusted: event.isTrusted,
                atPageMonotonicMs: performance.now(),
                source: element.currentSrc,
                attribute: element.getAttribute('src'),
                error: element.error?.code ?? null,
                time: element.currentTime,
                paused: element.paused,
                muted: element.muted,
                volume: element.volume,
                key: event instanceof KeyboardEvent ? event.key : null,
              });
            };
            element.addEventListener(type, listener, true);
            state.listeners.push([type, listener]);
          }
          window.__xegRecoveryEventObservation = state;
        });
        observed.initialMetadata = await stateWhen(
          page,
          (value) =>
            value.readyState >= 1 &&
            !value.error &&
            value.videoWidth === 320 &&
            value.videoHeight === 180,
          'initial metadata before the trusted playback control'
        );
        await video.focus();
        const beforeMute = await itemState(page, 0);
        assert(beforeMute);
        if (beforeMute.muted) {
          await page.keyboard.press('m');
        }
        const beforePlay = await itemState(page, 0);
        assert(beforePlay);
        observed.beforePlay = beforePlay;
        assert.equal(
          beforePlay.src,
          observed.best,
          'The trusted initial play action must target the preferred source'
        );
        assert.equal(
          beforePlay.muted,
          false,
          'Ordinary mute control did not unmute the visible video'
        );
        await video.click();
        observed.playingOriginal = await stateWhen(
          page,
          (value) =>
            value.readyState >= 2 &&
            !value.error &&
            value.videoWidth === 320 &&
            value.videoHeight === 180 &&
            !value.paused &&
            value.currentTime > beforePlay.currentTime + 0.15,
          'actual trusted playback progression before corruption'
        );
        assert.equal(
          nativeLoopback.videoHeld(),
          true,
          'The native HTTPS source must still hold later samples during actual playback'
        );
        assert.equal(
          observed.playingOriginal.currentSrc,
          observed.best,
          'Initial playback must progress on the preferred source'
        );
        observed.lowerRequestsBeforeTailRelease = requests.filter(
          (record) => record.case === name && record.index === 0 && record.quality === 'lower'
        ).length;
        assert.equal(
          observed.lowerRequestsBeforeTailRelease,
          0,
          'Recovery must not begin before the corrupt tail is released'
        );
        const beforeTailRelease = await page.evaluate(() => {
          const state = window.__xegRecoveryEventObservation;
          if (!state) {
            throw new Error('Missing recovery event observation');
          }
          return {
            atPageMonotonicMs: performance.now(),
            errors: state.records.filter((event) => event.type === 'error'),
          };
        });
        assert.deepEqual(
          beforeTailRelease.errors,
          [],
          'Initial playback must not have a native error before the corrupt tail release'
        );
        const pageReleaseStartedAt = beforeTailRelease.atPageMonotonicMs;
        observed.corruptTailReleaseStartedAtPageMonotonicMs = pageReleaseStartedAt;
        const releaseStartedAt = performance.now();
        observed.corruptTailReleaseStartedAtMonotonicMs = releaseStartedAt;
        nativeLoopback.completeVideoHold();
        observed.corruptTailReleasedAtMonotonicMs = performance.now();
        await waitForValue(
          async () =>
            requests.some(
              (record) =>
                record.case === name &&
                record.index === 0 &&
                record.quality === 'lower' &&
                record.atMonotonicMs >= releaseStartedAt
            )
              ? true
              : undefined,
          'native decoder error to select and request the same-item replacement'
        );
        const eventRecords = await page.evaluate(() => {
          const state = window.__xegRecoveryEventObservation;
          if (!state) {
            throw new Error('Missing recovery event observation');
          }
          return state.records;
        });
        // Match outside the page: the observer records native events without injecting them.
        const decodeError = eventRecords.find(
          (event) =>
            event.type === 'error' &&
            event.error === 3 &&
            event.source === observed.best &&
            event.trusted &&
            event.atPageMonotonicMs >= pageReleaseStartedAt
        );
        assert(decodeError, 'A real native code-3 error after playback is required');
        observed.decodeError = decodeError;
        observed.pending = await itemState(page, 0);
        assert(observed.pending);
        assert.equal(observed.pending.src, observed.lower);

        if (name === 'later-user-pause-mute-volume') {
          await video.focus();
          await page.keyboard.press('Space');
          await stateWhen(
            page,
            (value) => !value.paused,
            'pending-source play intent from supported Space control'
          );
          // The production Space control debounces consecutive presses for 150 ms.
          await page.waitForTimeout(200);
          await page.keyboard.press('Space');
          observed.userPaused = await stateWhen(
            page,
            (value) => value.paused,
            'subsequent deliberate pause through supported Space control'
          );
          const volumeBefore = observed.userPaused.volume;
          await page.keyboard.press('ArrowDown');
          await stateWhen(
            page,
            (value) => value.volume < volumeBefore,
            'later volume change through the supported keyboard control'
          );
          const beforeUserMute = await itemState(page, 0);
          assert(beforeUserMute);
          if (!beforeUserMute.muted) {
            await page.keyboard.press('m');
          }
          observed.userControls = await stateWhen(
            page,
            (value) => value.muted,
            'later deliberate mute before replacement metadata'
          );
          releaseLower();
          observed.pausedAfterMetadata = await stablePaused(page, observed.lower);
          assert.equal(observed.pausedAfterMetadata.after.muted, observed.userControls.muted);
          assert.equal(observed.pausedAfterMetadata.after.volume, observed.userControls.volume);
          await scrollOut(page);
          await scrollBack(page);
          observed.pausedAfterReentry = await stablePaused(page, observed.lower);
        } else {
          observed.outsideBeforeMetadata = await scrollOut(page);
          if (name === 'reenter-before-metadata') {
            observed.reenteredBeforeMetadata = await scrollBack(page);
          }
          releaseLower();
          if (name === 'metadata-while-outside') {
            observed.pausedOutside = await stablePaused(page, observed.lower);
            assert.equal(
              observed.pausedOutside.after.muted,
              true,
              'Recovery metadata undid visibility-imposed mute'
            );
            observed.reentered = await scrollBack(page);
          }
          const resumeStart = await stateWhen(
            page,
            (value) =>
              value.metadata === 'true' && value.currentSrc === observed.lower && !value.seeking,
            'replacement metadata before legitimate resume progress'
          );
          observed.resumed = await stateWhen(
            page,
            (value) =>
              !value.error &&
              value.readyState >= 2 &&
              !value.paused &&
              !value.muted &&
              value.currentTime > resumeStart.currentTime + 0.15,
            'latest visible playback intent to resume with positive progress'
          );
        }
        assertBestSource(await itemState(page, 0), observed.best);
        assert.equal(
          observed.networkProtocol.overflow,
          false,
          'Native request protocol observations overflowed'
        );
        assert.equal(observed.eventOverflow ?? false, false, 'Native page observations overflowed');
        observed.nativeRequests = nativeLoopback.since(nativeMark);
        const activeUrl = active.url;
        assert(
          observed.nativeRequests.some(
            (record) =>
              record.host === 'x.com' &&
              record.path === new URL(activeUrl).pathname &&
              record.result === 'served'
          ),
          'The requesting document must come from the bounded real HTTPS fixture'
        );
        assert(
          observed.nativeRequests.some(
            (record) =>
              record.path === new URL(observed.best).pathname && record.result === 'served'
          ),
          'The bounded real HTTPS source was not served'
        );
        assert.deepEqual(observed.pageErrors, []);
        const expectedLifecycleAborts = observed.requestFailures.filter(
          (record) =>
            record.reason === 'net::ERR_ABORTED' &&
            [observed.best, observed.lower].includes(record.url) &&
            requests.some(
              (request) =>
                request.case === name &&
                request.index === 0 &&
                request.quality === (record.url === observed.best ? 'best' : 'lower')
            )
        );
        observed.expectedLifecycleAborts = expectedLifecycleAborts;
        assert.deepEqual(
          observed.requestFailures.filter((record) => !expectedLifecycleAborts.includes(record)),
          [],
          'Recovery fixture has failures beyond the current source range and seek lifecycle'
        );
        assert.deepEqual(
          observed.consoleErrors.filter(
            (record) =>
              !expectedLifecycleAborts.some((abort) => abort.url === record.location) ||
              !record.text.includes('net::ERR_ABORTED')
          ),
          [],
          'Recovery fixture logged an unexpected console error'
        );
        const replacementPlays = await page.evaluate(() => {
          const state = window.__xegRecoveryEventObservation;
          if (!state) {
            throw new Error('Missing recovery event observation');
          }
          return state.records.filter((event) => event.type === 'play');
        });
        observed.replacementPlayCount = replacementPlays.filter(
          (event) => event.source === observed.lower
        ).length;
        assert.equal(
          observed.replacementPlayCount,
          1,
          'The replacement must have exactly one intended native play transition'
        );
        observed.status = 'passed';
      } catch (error) {
        observed.status = 'failed';
        observed.error = error instanceof Error ? error.message : String(error);
        observed.failureState = await itemState(page, 0).catch(() => null);
        observed.nativeRequests = nativeLoopback.since(nativeMark);
      } finally {
        releaseLower();
        nativeLoopback.abortVideoHold();
        if (!page.isClosed()) {
          observed.mediaEvents = await page.evaluate(() => {
            const state = window.__xegRecoveryEventObservation;
            if (!state) {
              return { records: [], overflow: false };
            }
            const video = document.querySelector(
              '[data-gallery-element="item"][data-index="0"] video'
            );
            if (video) {
              for (const [type, listener] of state.listeners) {
                video.removeEventListener(type, listener, true);
              }
            }
            delete window.__xegRecoveryEventObservation;
            return { records: state.records, overflow: state.overflow };
          });
          if (observed.networkProtocol.overflow || observed.eventOverflow) {
            observed.status = 'failed';
            observed.error = `${observed.error ?? 'Native recovery case'}; bounded observations overflowed`;
          }
          assert.equal(
            observed.mediaEvents.overflow,
            false,
            'Native media event observation overflowed'
          );
          await page.screenshot({ path: join(output, `video-recovery-intent-${name}.png`) });
          if (await page.locator('[data-xeg-gallery-container]').count()) {
            await page.keyboard.press('Escape');
          }
        }
        page.off('pageerror', onPageError);
        page.off('requestfailed', onRequestFailed);
        page.off('console', onConsole);
        await protocol.detach();
        await page.close();
      }
    }
    assert.deepEqual(
      cases
        .filter((item) => item.status !== 'passed')
        .map((item) => ({ name: item.name, error: item.error })),
      [],
      'Required native recovery intent cases failed'
    );
    evidence.status = 'passed';
  } catch (error) {
    caughtPrimaryError = true;
    primaryError = error;
    evidence.status = 'failed';
    evidence.error = error instanceof Error ? error.message : String(error);
  } finally {
    const errors = [];
    nativeLoopback.abortVideoHold();
    evidence.cleanup.videoHoldReleased = !nativeLoopback.videoHeld();
    await context
      .unroute('**/*', handler)
      .then(() => {
        evidence.cleanup.routesRemoved = true;
      })
      .catch((error) => errors.push(error));
    if (permissionSession && permissionBefore && permissionPage && evidence.fixturePermission) {
      try {
        const after = await permissionPage.evaluate(
          async () => (await navigator.permissions.query({ name: 'loopback-network' })).state
        );
        assert.equal(after, permissionBefore, 'The read-only fixture permission state changed');
        evidence.fixturePermission.after = after;
        evidence.cleanup.fixturePermissionRestored = true;
      } catch (error) {
        errors.push(error);
      }
    } else {
      evidence.cleanup.fixturePermissionRestored = true;
    }
    if (permissionSession) {
      await permissionSession
        .detach()
        .then(() => {
          evidence.cleanup.permissionSessionDetached = true;
        })
        .catch((error) => errors.push(error));
    } else {
      evidence.cleanup.permissionSessionDetached = true;
    }
    const closing = await Promise.allSettled(
      pages.filter((page) => !page.isClosed()).map((page) => page.close())
    );
    evidence.cleanup.pagesClosed = pages.every((page) => page.isClosed());
    errors.push(
      ...closing.filter((result) => result.status === 'rejected').map((result) => result.reason)
    );
    evidence.cleanup.errors = errors.map((error) =>
      error instanceof Error ? error.message : String(error)
    );
    if (errors.length) {
      evidence.status = 'failed';
    }
    await writeFile(
      join(output, 'video-recovery-intent-observations.json'),
      JSON.stringify(evidence, null, 2)
    );
    if (errors.length) {
      cleanupError = new AggregateError(
        caughtPrimaryError ? [primaryError, ...errors] : errors,
        'Recovery intent fixture cleanup failed'
      );
    }
  }
  if (cleanupError) {
    throw cleanupError;
  }
  if (caughtPrimaryError) {
    throw primaryError;
  }
  return evidence;
}

/** Real layout/IntersectionObserver observations; no observer or application replacement. */
async function runAdmissionGeometryCases({
  context,
  validMp4,
  output,
}: {
  context: BrowserContext;
  validMp4: Buffer;
  output: string;
}) {
  const count = 12;
  const cases: GeometryCase[] = [];
  const requests: GeometryRequest[] = [];
  const pages: Page[] = [];
  const evidence: GeometryEvidence = {
    status: 'running',
    cases,
    requests,
    admissionDeadlineMs: 1_500,
    distantObservationMs: 800,
    cleanup: { routesRemoved: false, pagesClosed: false },
  };
  let active: (GeometryDescriptor & { url: string }) | undefined;
  let primaryError: unknown;
  let caughtPrimaryError = false;
  let cleanupError: AggregateError | undefined;
  const handler = async (route: Route) => {
    if (!active) {
      return route.fallback();
    }
    const target = new URL(route.request().url());
    if (route.request().isNavigationRequest() && target.href === active.url) {
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: fixtureHtml(active.id, 'admissioncheck', count),
      });
    }
    if (target.hostname === 'x.com' && target.pathname.endsWith('/TweetResultByRestId')) {
      let id: unknown;
      try {
        id = field(JSON.parse(target.searchParams.get('variables') ?? '{}'), 'tweetId');
      } catch {
        return route.fallback();
      }
      if (id === active.id) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(apiResponse(id, 'admissioncheck', count)),
        });
      }
    }
    if (
      target.hostname === 'pbs.twimg.com' &&
      target.pathname.startsWith(`/ext_tw_video_thumb/${active.id}/pu/img/video-`)
    ) {
      return route.fulfill({ status: 200, contentType: 'image/png', body: POSTER_PNG });
    }
    if (target.hostname === 'video.twimg.com') {
      const matched = new RegExp(
        `^/ext_tw_video/${active.id}/pu/vid/320x180/video-(\\d+)-best\\.mp4$`,
        'u'
      ).exec(target.pathname);
      if (matched && Number(matched[1]) < count) {
        assert(requests.length < MAX_REQUESTS, 'Geometry media request cap exceeded');
        requests.push({
          case: active.name,
          index: Number(matched[1]),
          atMonotonicMs: performance.now(),
          range: route.request().headers().range ?? null,
        });
        return route.fulfill({ status: 200, contentType: 'video/mp4', body: validMp4 });
      }
    }
    return route.fallback();
  };
  const readAll = async (page: Page): Promise<ItemState[]> => {
    const states: ItemState[] = [];
    for (let index = 0; index < count; index++) {
      const state = await itemState(page, index);
      assert(state, 'The real gallery geometry inventory is incomplete');
      states.push(state);
    }
    assert(states.every(Boolean), 'The real gallery geometry inventory is incomplete');
    return states;
  };
  const isNear = (state: ItemState, direction: GeometryDescriptor['direction']) =>
    state.index !== state.currentIndex &&
    state.index !== state.focusedIndex &&
    (direction === 'below'
      ? state.box.top > state.viewport.bottom + 8 &&
        state.box.top < state.viewport.bottom + state.viewport.clientHeight - 8
      : state.box.bottom < state.viewport.top - 8 &&
        state.box.bottom > state.viewport.top - state.viewport.clientHeight + 8);
  const isFar = (state: ItemState) =>
    state.box.top > state.viewport.bottom + state.viewport.clientHeight + 8 ||
    state.box.bottom < state.viewport.top - state.viewport.clientHeight - 8;
  const checkNear = async (page: Page, target: ItemState, descriptor: GeometryDescriptor) => {
    await waitForValue(
      async () => {
        const now = await itemState(page, target.index);
        return now?.admitted === 'true' &&
          now.src === videoUrl(descriptor.id, target.index) &&
          requests.some(
            (record) => record.case === descriptor.name && record.index === target.index
          )
          ? now
          : undefined;
      },
      `unselected ${descriptor.direction} video admission`,
      evidence.admissionDeadlineMs
    );
    const now = await itemState(page, target.index);
    assert(now);
    assert(
      isNear(now, descriptor.direction),
      'Admission must precede selection/focus/visible entry'
    );
    assert.equal(now.paused, true, 'Advance admission must not play the off-screen video');
    return now;
  };
  await context.route('**/*', handler);
  try {
    const descriptors: GeometryDescriptor[] = [
      {
        name: 'below-normal-resize',
        id: '4666000111222333661',
        selected: 0,
        direction: 'below',
        viewport: { width: 1280, height: 500 },
        resize: { width: 1280, height: 900 },
      },
      {
        name: 'above-narrow-tall-resize',
        id: '4666000111222333662',
        selected: 11,
        direction: 'above',
        viewport: { width: 700, height: 800 },
        resize: { width: 700, height: 1200 },
      },
    ];
    for (const descriptor of descriptors) {
      active = { ...descriptor, url: `https://x.com/admissioncheck/status/${descriptor.id}` };
      const page = await context.newPage();
      pages.push(page);
      const observed: GeometryCase = { ...descriptor, status: 'running' };
      cases.push(observed);
      try {
        await page.setViewportSize(descriptor.viewport);
        await page.goto(active.url);
        await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
        await page.locator(`[data-video-target="${descriptor.selected}"]`).click();
        await page.locator('[data-xeg-gallery-container]').waitFor({ state: 'visible' });
        await waitForValue(async () => {
          const selected = await itemState(page, descriptor.selected);
          return selected?.metadata === 'true' &&
            selected.readyState >= 1 &&
            selected.currentIndex === descriptor.selected &&
            selected.focusedIndex === descriptor.selected
            ? true
            : undefined;
        }, 'selected real-layout video metadata and identity');
        const states = await readAll(page);
        observed.initial = states;
        const near = states.find((state) => isNear(state, descriptor.direction));
        assert(near, 'Fixture has no unselected/unfocused near-but-not-visible target');
        const distant = states.filter((state) => isFar(state) && state.src === null);
        assert(distant.length > 0, 'Fixture has no separate never-admitted far target');
        observed.nearBefore = near;
        observed.nearAfter = await checkNear(page, near, descriptor);
        observed.distant = distant;
        await page.waitForTimeout(evidence.distantObservationMs);
        assert(
          distant.every(
            (state) =>
              !requests.some(
                (record) => record.case === descriptor.name && record.index === state.index
              )
          ),
          'A never-admitted distant video requested its body'
        );

        await page.setViewportSize(descriptor.resize);
        await page.waitForTimeout(100);
        const resized = await readAll(page);
        observed.resized = resized;
        assert(
          resized[0] &&
            states[0] &&
            resized[0].viewport.clientHeight > states[0].viewport.clientHeight,
          'The actual gallery scrollport did not grow with the viewport'
        );
        const entering = resized.find(
          (state) =>
            distant.some((old) => old.index === state.index) && isNear(state, descriptor.direction)
        );
        assert(entering, 'Resize did not move a never-admitted item into the advance region');
        observed.admittedAfterResize = await checkNear(page, entering, descriptor);
        const oldRoot = await page
          .locator('[data-xeg-gallery-container] [data-gallery-element="items"]')
          .elementHandle();
        assert(oldRoot);
        await page.keyboard.press('Escape');
        await page.locator('[data-xeg-gallery-container]').waitFor({ state: 'detached' });
        assert.equal(await oldRoot.evaluate((root) => root.isConnected), false);
        await page.locator(`[data-video-target="${descriptor.selected}"]`).click();
        await page.locator('[data-xeg-gallery-container]').waitFor({ state: 'visible' });
        const reopened = await waitForValue(async () => {
          const values = await readAll(page);
          const target = values.find((value) => isNear(value, descriptor.direction));
          return target ? target : undefined;
        }, 'replacement gallery root near target');
        observed.reopenedNear = await checkNear(page, reopened, descriptor);
        observed.retiredRootDisconnected = true;
        await oldRoot.dispose();
        observed.status = 'passed';
      } catch (error) {
        observed.status = 'failed';
        observed.error = error instanceof Error ? error.message : String(error);
      } finally {
        await page.screenshot({ path: join(output, `video-admission-${descriptor.name}.png`) });
        if (await page.locator('[data-xeg-gallery-container]').count()) {
          await page.keyboard.press('Escape');
        }
        await page.close();
      }
    }
    assert.deepEqual(
      cases
        .filter((item) => item.status !== 'passed')
        .map((item) => ({ name: item.name, error: item.error })),
      [],
      'Required actual-scroll-root geometry cases failed'
    );
    evidence.status = 'passed';
  } catch (error) {
    caughtPrimaryError = true;
    primaryError = error;
    evidence.status = 'failed';
    evidence.error = error instanceof Error ? error.message : String(error);
  } finally {
    const errors = [];
    await context
      .unroute('**/*', handler)
      .then(() => {
        evidence.cleanup.routesRemoved = true;
      })
      .catch((error) => errors.push(error));
    const closing = await Promise.allSettled(
      pages.filter((page) => !page.isClosed()).map((page) => page.close())
    );
    evidence.cleanup.pagesClosed = pages.every((page) => page.isClosed());
    errors.push(
      ...closing.filter((result) => result.status === 'rejected').map((result) => result.reason)
    );
    evidence.cleanup.errors = errors.map((error) =>
      error instanceof Error ? error.message : String(error)
    );
    if (errors.length) {
      evidence.status = 'failed';
    }
    await writeFile(
      join(output, 'video-admission-geometry-observations.json'),
      JSON.stringify(evidence, null, 2)
    );
    if (errors.length) {
      cleanupError = new AggregateError(
        caughtPrimaryError ? [primaryError, ...errors] : errors,
        'Geometry fixture cleanup failed'
      );
    }
  }
  if (cleanupError) {
    throw cleanupError;
  }
  if (caughtPrimaryError) {
    throw primaryError;
  }
  return evidence;
}
