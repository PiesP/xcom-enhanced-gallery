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
  Route,
} from '@playwright/test';
import {
  PUBLIC_PREPLAYER_CASE,
  QUOTED_CASES,
  quotedVideoApiResponse,
  RAPID_CLICK_A,
  RAPID_CLICK_B,
  UNAVAILABLE_SEQUENCE,
} from '../../test/e2e/fixtures/installed-quoted-video-api.ts';
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
import { extensionInventorySha256, readUpgradeInput } from './release-upgrade/source.ts';
import { runVideoLoadingProfile } from './video-loading-profile.ts';

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
type ApiRecord = {
  tweetId?: string;
  method: string;
  status: number;
  url?: string;
  requestedAt?: string;
  requestedAtMonotonicMs?: number;
  fulfilledAt?: string;
  fulfilledAtMonotonicMs?: number | null;
  routeSettledAtMonotonicMs?: number | null;
  transportState?: string;
  transportSettledAtMonotonicMs?: number | null;
  abortedAfterNavigation?: boolean;
  resultTypename?: string | null;
  providerErrors?: number;
};
type QualityRequest = {
  path: string;
  name: string | null;
  resourceType: string;
  bytes: number;
  sha256: string;
};
type DelayedFailureGate = { tweetId: string; promise: Promise<void>; release: () => void };
type ImageFixtures = [Buffer, Buffer, Buffer];
type PageFetch = { host: string; path: string; resourceType: string };
type QuotedCase = (typeof QUOTED_CASES)[number];
type ConsoleErrorRecord = { location: string; text: string };
type MemoryRequest = {
  phase: string;
  marker: string;
  resourceType: string;
  pathname: string;
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
  expectedConsoleErrors?: ConsoleErrorRecord[];
  recoveryTransport?: unknown;
  recoveryScreenshot?: string;
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
  notification?: { id: string };
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
type DelayedVideoCase = {
  name: string;
  pageUrl: string;
  tweetId: string;
  before: Awaited<ReturnType<typeof hostVideoState>>;
  request: ApiRecord;
  pending: unknown;
  pendingStart: Awaited<ReturnType<typeof hostVideoState>>;
  pendingEnd: Awaited<ReturnType<typeof hostVideoState>>;
  navigation?: unknown;
  failureObservation?: unknown;
  failure?: unknown;
  notificationObserverRestored?: unknown;
  settingRestored?: boolean;
};
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
  restoration?: unknown;
  api?: ApiRecord[];
  screenshots?: string[];
  elapsedMs?: number;
  error?: string;
  failureScreenshot?: string;
  screenshotError?: string;
};
type AcceptanceReceipt = {
  status: string;
  error?: string;
  api?: ApiRecord[];
  expectedConsoleErrors?: ConsoleErrorRecord[];
  boundary?: unknown;
  boundaryError?: string;
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
  fixture?: Awaited<ReturnType<typeof exerciseInstalledExtension>>;
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
const TWEET_ID = '1234567890123456789';
const DELAYED_FAILURE_ID = '8777777777777777777';
const DELAYED_NAVIGATION_ID = '8777777777777777778';
const FIXTURE_URL = `https://x.com/testuser/status/${TWEET_ID}`;
const QUALITY_TWEET_ID = '4666000000000000001';
const QUALITY_FIXTURE_URL = `https://x.com/qualityuser/status/${QUALITY_TWEET_ID}`;
const QUALITY_IMAGE_PATHS = ['GkE1234ABCDEF', 'GkE5678GHIJKL.jpg', 'GkE9012MNOPQR.jpg'];
const PUBLIC_TWEET_ID = '9876543210987654321';
const PUBLIC_FIXTURE_URL = `https://x.com/public_user/status/${PUBLIC_TWEET_ID}`;
const DOWNLOAD_TRACKING_STORAGE_KEY = 'xeg.download-tracking.v1';
const MV3_RESTART_BLOB_BYTES = 256 * 1024 * 1024;
const IMAGE_URL_MARKERS = ['GkE1234', 'GkE5678', 'GkE9012'];
const MAX_AGGREGATE_DEPTH = 2;
const MAX_AGGREGATE_ERRORS = 4;
const MAX_ERROR_SUMMARY_LENGTH = 2000;
const MAX_UNAVAILABLE_API_RECORDS = 8;
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

function imageReceipt(bytes: Uint8Array) {
  return { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
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

export async function enableDeveloperMode(context: BrowserContext, browserName: string) {
  const page = await context.newPage();
  try {
    await page.goto(browserName === 'msedge' ? 'edge://extensions/' : 'chrome://extensions/');
    const toggle = page.locator(browserName === 'msedge' ? '#dev-switch:visible' : '#devMode');
    await toggle.waitFor({ state: 'visible' });
    if (!(await toggle.evaluate((element) => 'checked' in element && element.checked))) {
      await toggle.click();
    }
    assert(
      await toggle.evaluate((element) => 'checked' in element && element.checked),
      'Extension developer mode is disabled'
    );
  } finally {
    await page.close();
  }
}

export async function verifyDownloadDirectory(context: BrowserContext, downloads: string) {
  const page = await context.newPage();
  try {
    await page.goto('chrome://settings/downloads');
    const directory = await page.evaluate(
      () =>
        new Promise<string>((resolveDirectory) => {
          chrome.settingsPrivate.getPref('download.default_directory', (preference) => {
            resolveDirectory(preference.value);
          });
        })
    );
    assert.equal(
      resolve(directory),
      resolve(downloads),
      'Chrome must use the task-owned download directory'
    );
  } finally {
    await page.close();
  }
}

export async function createImageFixtures(
  context: BrowserContext,
  scale = 1
): Promise<ImageFixtures> {
  const page = await context.newPage();
  try {
    await page.goto('about:blank');
    const encoded = await page.evaluate(
      (scale) =>
        [
          { color: '#155a91', label: 'Fixture 1' },
          { color: '#9a5d16', label: 'Fixture 2' },
          { color: '#27764b', label: 'Fixture 3' },
        ].map(({ color, label }, index) => {
          const canvas = document.createElement('canvas');
          canvas.width = (480 + index * 80) * scale;
          canvas.height = (320 + index * 40) * scale;
          const drawing = canvas.getContext('2d');
          if (!drawing) {
            throw new Error('Canvas 2D context unavailable');
          }
          drawing.fillStyle = color;
          drawing.fillRect(0, 0, canvas.width, canvas.height);
          drawing.fillStyle = '#ffffff';
          drawing.font = `bold ${36 * scale}px Segoe UI`;
          drawing.fillText(label, 36 * scale, 72 * scale);
          return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        }),
      scale
    );
    const images = encoded.map((value) => {
      assert(value, 'Fixture image encoding failed');
      return Buffer.from(value, 'base64');
    });
    const [first, second, third] = images;
    assert(first && second && third, 'Expected three fixture images');
    return [first, second, third];
  } finally {
    await page.close();
  }
}

function imageIndex(url: string) {
  const index = IMAGE_URL_MARKERS.findIndex((marker) => url.includes(marker));
  return index < 0 ? 0 : index;
}

export async function installFixtureRoutes(
  context: BrowserContext,
  root: string,
  images: ImageFixtures,
  displayImages: ImageFixtures
) {
  const html = await readFile(join(root, 'test/e2e/fixtures/installed-gallery-page.html'), 'utf8');
  const extensionHtml = QUALITY_IMAGE_PATHS.reduce((page, path) => {
    const sharedPath = path.endsWith('.jpg') ? path : `${path}.jpg`;
    const sharedSource = `https://pbs.twimg.com/media/${sharedPath}?format=jpg&amp;name=large`;
    assert(page.includes(sharedSource), 'Expected shared fixture image source is missing');
    return page.replace(
      sharedSource,
      `https://pbs.twimg.com/media/${path}?format=jpg&amp;name=small`
    );
  }, html);
  const quotedHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-quoted-video-page.html'),
    'utf8'
  );
  const preplayerHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-public-preplayer-page.html'),
    'utf8'
  );
  const unavailableHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-unavailable-sequence-page.html'),
    'utf8'
  );
  const unmarkedVideoHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-unmarked-video-page.html'),
    'utf8'
  );
  const rapidVideoHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-rapid-video-page.html'),
    'utf8'
  );
  const videoPayloads: Record<string, Buffer> = Object.fromEntries(
    await Promise.all(
      ['quote-one', 'quote-two', 'linked-four', 'quote-three', 'nested-c'].map(async (name) => [
        name,
        await readFile(join(root, `test/e2e/fixtures/installed-${name}.mp4`)),
      ])
    )
  );
  const apiResponses: ApiRecord[] = [];
  const quotedApiResponses: ApiRecord[] = [];
  const unavailableApiResponses: ApiRecord[] = [];
  const qualityApiResponses: ApiRecord[] = [];
  const qualityRequests: QualityRequest[] = [];
  let unavailableApiOverflow = 0;
  let sequenceRouteActive = false;
  let delayedFailureGate: DelayedFailureGate | null = null;
  const delayedRequests = new Map<Request, ApiRecord>();
  const recordDelayedTransport = (request: Request, state: string) => {
    const record = delayedRequests.get(request);
    if (record) {
      record.transportState = state;
      record.transportSettledAtMonotonicMs = performance.now();
    }
  };
  const delayedRequestFinished = (request: Request) => recordDelayedTransport(request, 'finished');
  const delayedRequestFailed = (request: Request) => recordDelayedTransport(request, 'failed');
  context.on('requestfinished', delayedRequestFinished);
  context.on('requestfailed', delayedRequestFailed);
  const routeHandler = async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.protocol === 'chrome-extension:') {
      await route.continue();
      return;
    }
    if (url.hostname === 'x.com' && url.pathname === '/favicon.ico') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    if (url.hostname === 'x.com' && url.pathname.endsWith('/TweetResultByRestId')) {
      let tweetId: string | undefined;
      try {
        const variables: unknown = JSON.parse(url.searchParams.get('variables') ?? '{}');
        tweetId =
          typeof variables === 'object' &&
          variables !== null &&
          'tweetId' in variables &&
          typeof variables.tweetId === 'string'
            ? variables.tweetId
            : undefined;
      } catch {
        tweetId = undefined;
      }
      if (
        tweetId === DELAYED_FAILURE_ID ||
        tweetId === DELAYED_NAVIGATION_ID ||
        tweetId === RAPID_CLICK_A
      ) {
        const rapidResponse = tweetId === RAPID_CLICK_A ? quotedVideoApiResponse(tweetId) : null;
        const record: ApiRecord = {
          tweetId,
          method: route.request().method(),
          status: 403,
          requestedAtMonotonicMs: performance.now(),
          fulfilledAtMonotonicMs: null,
          routeSettledAtMonotonicMs: null,
          transportState: 'pending',
          transportSettledAtMonotonicMs: null,
        };
        delayedRequests.set(route.request(), record);
        if (rapidResponse) {
          record.status = 200;
        }
        quotedApiResponses.push(record);
        assert(
          delayedFailureGate?.tweetId === tweetId,
          'Delayed extraction request must match its owned response gate'
        );
        await delayedFailureGate.promise;
        try {
          await route.fulfill({
            status: record.status,
            contentType: 'application/json',
            body: rapidResponse ? JSON.stringify(rapidResponse) : '{}',
          });
          record.fulfilledAtMonotonicMs = performance.now();
        } catch (error) {
          if (tweetId !== DELAYED_NAVIGATION_ID && tweetId !== RAPID_CLICK_A) {
            throw error;
          }
          record.abortedAfterNavigation = true;
        } finally {
          record.routeSettledAtMonotonicMs = performance.now();
        }
        return;
      }
      if (tweetId === QUALITY_TWEET_ID) {
        assert(qualityApiResponses.length < 8, 'Source-quality API observation overflow');
        const record: ApiRecord = {
          tweetId,
          method: route.request().method(),
          status: 200,
          requestedAtMonotonicMs: performance.now(),
        };
        qualityApiResponses.push(record);
        const media = QUALITY_IMAGE_PATHS.map((path, index) => ({
          type: 'photo',
          id_str: `46660${index}`,
          media_url_https: `https://pbs.twimg.com/media/${path}?format=jpg&name=small`,
          original_info: { width: 480 + index * 80, height: 320 + index * 40 },
        }));
        const result = {
          __typename: 'Tweet',
          rest_id: QUALITY_TWEET_ID,
          core: {
            user_results: {
              result: { legacy: { screen_name: 'qualityuser', name: 'qualityuser' } },
            },
          },
          legacy: {
            id_str: QUALITY_TWEET_ID,
            full_text: 'Three source-quality fixtures',
            extended_entities: { media },
          },
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { tweetResult: { result } } }),
        });
        record.fulfilledAtMonotonicMs = performance.now();
        return;
      }
      const quotedResponse = tweetId === undefined ? undefined : quotedVideoApiResponse(tweetId);
      if (tweetId !== undefined && quotedResponse) {
        const record: ApiRecord = {
          method: route.request().method(),
          status: 200,
          tweetId,
          url: url.pathname,
          requestedAt: new Date().toISOString(),
          requestedAtMonotonicMs: performance.now(),
          resultTypename: quotedResponse.data?.tweetResult?.result?.__typename ?? null,
          providerErrors:
            'errors' in quotedResponse && Array.isArray(quotedResponse.errors)
              ? quotedResponse.errors.length
              : 0,
        };
        quotedApiResponses.push(record);
        if (sequenceRouteActive) {
          if (unavailableApiResponses.length < MAX_UNAVAILABLE_API_RECORDS) {
            unavailableApiResponses.push(record);
          } else {
            unavailableApiOverflow += 1;
          }
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(quotedResponse),
        });
        record.fulfilledAt = new Date().toISOString();
        return;
      }
      apiResponses.push({ method: route.request().method(), status: 403, url: url.pathname });
      await route.fulfill({ status: 403, contentType: 'application/json', body: '{}' });
      return;
    }
    if (url.hostname === 'x.com' && route.request().isNavigationRequest()) {
      const quotedCase = QUOTED_CASES.find(
        ({ handle, outer }) => url.pathname === `/${handle}/status/${outer}`
      );
      const unavailableRoute =
        url.pathname ===
        `/${UNAVAILABLE_SEQUENCE.handle}/status/${UNAVAILABLE_SEQUENCE.failures[0]?.outer}`;
      sequenceRouteActive = unavailableRoute;
      await route.fulfill({
        contentType: 'text/html',
        body: unavailableRoute
          ? unavailableHtml
          : [DELAYED_FAILURE_ID, DELAYED_NAVIGATION_ID].some(
                (id) => url.pathname === `/delayed_host/status/${id}`
              )
            ? quotedHtml
                .replaceAll('8111111111111111111', url.pathname.split('/').at(-1) ?? '')
                .replaceAll('9111111111111111111', '9777777777777777777')
                .replaceAll('/outer_one/status/', '/delayed_host/status/')
            : url.pathname === '/quote_one/status/9111111111111111111'
              ? unmarkedVideoHtml
              : url.pathname === `/rapid_a/status/${RAPID_CLICK_A}`
                ? rapidVideoHtml
                : quotedCase
                  ? quotedCase.name === 'public-preplayer'
                    ? preplayerHtml
                    : quotedHtml.replace(
                        '<body data-quote-case="recognized">',
                        `<body data-quote-case="${quotedCase.route}">`
                      )
                  : url.pathname === new URL(QUALITY_FIXTURE_URL).pathname
                    ? extensionHtml
                        .replaceAll(TWEET_ID, QUALITY_TWEET_ID)
                        .replaceAll('testuser', 'qualityuser')
                    : url.pathname === new URL(PUBLIC_FIXTURE_URL).pathname
                      ? html.replace(
                          '<body data-fixture-route="classic">',
                          '<body data-fixture-route="public">'
                        )
                      : extensionHtml,
      });
      return;
    }
    if (url.hostname === 'video.twimg.com') {
      const name = url.pathname
        .split('/')
        .at(-1)
        ?.replace(/\.mp4$/u, '');
      const payload =
        (name === undefined ? undefined : videoPayloads[name]) ??
        (name?.startsWith('outer-') ? videoPayloads['nested-c'] : undefined);
      if (!payload) {
        await route.abort('blockedbyclient');
        return;
      }
      const range = route.request().headers().range;
      const match = range?.match(/^bytes=(\d+)-(\d*)$/u);
      const start = match ? Number(match[1]) : 0;
      const requestedEnd = match?.[2] ? Number(match[2]) : payload.length - 1;
      const end = Math.min(requestedEnd, payload.length - 1);
      if (match && (start >= payload.length || end < start)) {
        await route.fulfill({
          status: 416,
          headers: {
            'Content-Range': `bytes */${payload.length}`,
          },
        });
        return;
      }
      const selectedBytes = match ? payload.subarray(start, end + 1) : payload;
      await route.fulfill({
        status: match ? 206 : 200,
        contentType: 'video/mp4',
        body: selectedBytes,
        headers: {
          'Access-Control-Allow-Origin': 'https://x.com',
          'Access-Control-Allow-Credentials': 'true',
          'Accept-Ranges': 'bytes',
          'Content-Length': String(selectedBytes.length),
          ...(match ? { 'Content-Range': `bytes ${start}-${end}/${payload.length}` } : {}),
        },
      });
      return;
    }
    if (url.hostname === 'pbs.twimg.com') {
      const index = imageIndex(url.href);
      const original = url.searchParams.get('name') === 'orig';
      const body = original ? images[index] : displayImages[index];
      assert(body, 'Fixture image index must resolve to a loaded image');
      if (
        url.pathname.startsWith('/media/') &&
        IMAGE_URL_MARKERS.some((marker) => url.pathname.includes(marker))
      ) {
        assert(qualityRequests.length < 200, 'Source-quality request observation overflow');
        qualityRequests.push({
          path: url.pathname,
          name: url.searchParams.get('name'),
          resourceType: route.request().resourceType(),
          ...imageReceipt(body),
        });
      }
      await route.fulfill({
        contentType: 'image/jpeg',
        body,
        headers: {
          'Access-Control-Allow-Origin': 'https://x.com',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
      return;
    }
    await route.abort('blockedbyclient');
  };
  await context.route('**/*', routeHandler);
  return {
    apiResponses,
    qualityApiResponses,
    quotedApiResponses,
    unavailableApiResponses,
    qualityRequests,
    getUnavailableApiOverflow: () => unavailableApiOverflow,
    videoPayloads,
    armDelayedFailure(tweetId: string) {
      assert.equal(delayedFailureGate, null, 'Only one delayed extraction may own the gate');
      assert([DELAYED_FAILURE_ID, DELAYED_NAVIGATION_ID, RAPID_CLICK_A].includes(tweetId));
      let release = () => {};
      const promise = new Promise<void>((resolve) => {
        release = resolve;
      });
      delayedFailureGate = { tweetId, promise, release };
    },
    releaseDelayedFailure() {
      delayedFailureGate?.release();
      delayedFailureGate = null;
    },
    async remove() {
      delayedFailureGate?.release();
      delayedFailureGate = null;
      context.off('requestfinished', delayedRequestFinished);
      context.off('requestfailed', delayedRequestFailed);
      delayedRequests.clear();
      await context.unroute('**/*', routeHandler);
    },
  };
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
  restoreSettings: { mode: string; scope: string } | null = null
) {
  assert.equal(page.url(), FIXTURE_URL, 'Browser zoom must target the exact owned fixture page');
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
    { url: FIXTURE_URL, zoomFactor: factor, restore: restoreSettings }
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
    const declaredBytes =
      phase === 'declared-large' && marker === IMAGE_URL_MARKERS[0]
        ? evidence.policy.declaredBytes
        : body.length;
    const request: MemoryRequest = {
      phase,
      marker,
      resourceType,
      pathname: url.pathname,
      declaredBytes,
      actualBodyBytes: body.length,
      startedAtMs: performance.now(),
    };
    evidence.requests.push(request);
    await route.fulfill({
      status: 200,
      contentType: 'image/jpeg',
      body,
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
    await page.waitForFunction(
      () => {
        const root = document.querySelector('[data-xeg-gallery-container]');
        const error = root?.querySelector('[aria-live="polite"][aria-atomic="true"]');
        const text = error?.textContent?.toLowerCase() ?? '';
        return (
          text.includes('zip includes 2 files') &&
          text.includes('1 files were left out') &&
          text.includes('download memory limit') &&
          text.includes('reload this page')
        );
      },
      null,
      { timeout: 15_000 }
    );
    const errorText =
      (
        await gallery.locator('[aria-live="polite"][aria-atomic="true"]').first().textContent()
      )?.trim() ?? '';
    assert(
      errorText.length > 0 && errorText.length <= 512,
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
    // The two successful partial-ZIP entries remain in the page's media cache.
    // Only the rejected entry needs another fetch; all saved bytes are checked above.
    const recoveryRequests = evidence.requests
      .filter(({ phase: requestPhase }) => requestPhase === 'small-zip')
      .map(({ marker }) => marker);
    assert.deepEqual(
      recoveryRequests,
      [IMAGE_URL_MARKERS[0]],
      'Recovered ZIP must fetch only the previously rejected image'
    );
    evidence.recoveryTransport = {
      freshMediaRequests: recoveryRequests,
      reusedEntries: partialVerified.entryOrder,
      savedEntries: parsedZip.entryOrder,
      verification:
        'Exact ZIP bytes and CRCs; successful partial entries need no new application fetch',
    };
    assert(
      await gallery.evaluate((node, original) => node === original, galleryHandle),
      'Memory recovery replaced the gallery app element'
    );
    await page.screenshot({ path: join(output, 'installed-memory-recovery.png') });
    evidence.recoveryScreenshot = 'installed-memory-recovery.png';
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
        const allowedNames = new Set([expectedFilename(0), `testuser_${TWEET_ID}.zip`]);
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
  const file = `quoted-${name}-checkpoint.json`;
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

async function assertQuotedOriginLink(
  gallery: Locator,
  expectedUrl: string,
  allowMediaPath = false
) {
  const button = gallery.locator('#tweet-text-button');
  assert.equal(await button.count(), 1, 'Selected media must expose originating post metadata');
  await button.click();
  const link = gallery.locator('#toolbar-tweet-panel a[href^="https://x.com/"]');
  await link.waitFor({ state: 'visible' });
  const observed = await link.getAttribute('href');
  assert(
    observed === expectedUrl || (allowMediaPath && observed === `${expectedUrl}/video/2`),
    'Toolbar source link must identify the selected post'
  );
  await button.click();
  return observed;
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
      async ({ storageKey, value }) => {
        await chrome.storage.local.set({ [storageKey]: value });
      },
      { storageKey: key, value: next }
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

async function runUnavailableSequence({
  apiResponses,
  extensionPage,
  output,
  page,
  sequenceApiResponses,
  getUnavailableApiOverflow,
  settingEvidence,
  evidence,
}: {
  apiResponses: ApiRecord[];
  extensionPage: Page;
  output: string;
  page: Page;
  sequenceApiResponses: ApiRecord[];
  getUnavailableApiOverflow: () => number;
  settingEvidence: ControlledSettingEvidence;
  evidence: UnavailableEvidence;
}) {
  return withControlledFixtureVideoMode(extensionPage, settingEvidence, async () => {
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
      step.notification = notification;
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

async function observeNativeNotificationCreates(context: BrowserContext, extensionId: string) {
  const worker = context
    .serviceWorkers()
    .find((item) => item.url() === `chrome-extension://${extensionId}/background.js`);
  assert(worker, 'Installed worker must be available for the native notification observer');
  const observerId = randomUUID();
  await worker.evaluate((id) => {
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
      return Reflect.apply(original, this, args);
    };
    chrome.notifications.create = state.wrapper;
  }, observerId);
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
  output,
  page,
}: {
  context: BrowserContext;
  extensionId: string;
  extensionPage: Page;
  fixtureRoutes: Awaited<ReturnType<typeof installFixtureRoutes>>;
  output: string;
  page: Page;
}) {
  const cases: DelayedVideoCase[] = [];
  const delayedCases: Array<[string, string]> = [
    ['failure', DELAYED_FAILURE_ID],
    ['navigation', DELAYED_NAVIGATION_ID],
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
    const priorSetting = name === 'failure' ? await readStoredVideoSettings(extensionPage) : null;
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
    let shortcutIssued = false;
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
      if (name === 'navigation') {
        await page.goto(FIXTURE_URL);
        await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
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
        shortcutIssued = true;
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
          apiStart + 1,
          'Native recovery must not start another extraction request'
        );
        observation.failure = {
          notification,
          failedHost,
          switchedMode,
          nativeClick,
          nativeRecovery: await hostVideoState(video),
        };
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
      if (shortcutIssued) {
        try {
          assert(priorSetting, 'Recovery shortcut prior setting is missing');
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
  downloads,
  extensionPage,
  fixtureRoutes,
  nativeLoopback,
  output,
  page,
  pageFetches,
}: {
  downloads: string;
  extensionPage: Page;
  fixtureRoutes: Awaited<ReturnType<typeof installFixtureRoutes>>;
  nativeLoopback: NativeLoopback;
  output: string;
  page: Page;
  pageFetches: PageFetch[];
}) {
  const pageUrl = `https://x.com/rapid_a/status/${RAPID_CLICK_A}`;
  await page.goto(pageUrl);
  await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
  const first = page.locator('[data-rapid="a"] video');
  const second = page.locator('[data-rapid="b"] video');
  await first.scrollIntoViewIfNeeded();
  await first.focus();
  const apiStart = fixtureRoutes.quotedApiResponses.length;
  fixtureRoutes.armDelayedFailure(RAPID_CLICK_A);
  try {
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
    await second.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => ({
      scrollY: window.scrollY,
      body: document.body.style.cssText,
    }));
    await second.click();
    const pendingB = await writeVideoBoundaryCheckpoint({
      output,
      name: 'rapid-a-b',
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
    assert.equal(bRequests.length, 1, 'B must make one independent owner request');
    assert.equal(bRequests[0]?.status, 200);
    fixtureRoutes.releaseDelayedFailure();
    await page.waitForTimeout(350);
    const retained = await assertQuotedSelection(page, {
      position: 2,
      total: 2,
      type: 'video',
      path: `/ext_tw_video/${RAPID_CLICK_B}/pu/vid/320x180/quote-two.mp4`,
    });
    const knownIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    const nativeMark = nativeLoopback.mark();
    const fetchMark = pageFetches.length;
    const filename = `rapid_b_${RAPID_CLICK_B}_1.mp4`;
    await opened.gallery
      .locator('[data-gallery-element="toolbar"] button[aria-label="Download"]')
      .click();
    const download = await waitForDownload(extensionPage, knownIds, filename);
    const relativeDownload = relative(downloads, download.filename);
    assert(relativeDownload && !relativeDownload.startsWith('..') && !isAbsolute(relativeDownload));
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
    await opened.gallery
      .locator('[data-gallery-element="toolbar"] button[aria-label="Close"]')
      .click();
    await opened.gallery.waitFor({ state: 'detached' });
    const after = await page.evaluate(() => ({
      scrollY: window.scrollY,
      body: document.body.style.cssText,
    }));
    assert.deepEqual(after, before, 'Rapid B close must restore host scroll and body styles');
    await page.screenshot({ path: join(output, 'quoted-rapid-a-b-after.png') });
    return {
      status: 'passed',
      pageUrl,
      heldA,
      pendingB,
      bRequests,
      selected: opened.selectedMedia,
      retained,
      originUrl,
      download: {
        filename,
        bytes: bytes.length,
        native,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      },
      restoration: after,
    };
  } finally {
    fixtureRoutes.releaseDelayedFailure();
  }
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
  const shell = article.locator('[data-video-key]');
  const preview = shell.locator('[data-quote-target]');
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
  await page.screenshot({ path: join(output, `quoted-${quotedCase.name}-before.png`) });

  const apiStart = quotedApiResponses.length;
  const previewClickCount = await page.evaluate(() => window.__quoteFixtureClicks.length);
  await captureQuotedOpeningScroll(preview);
  await preview.click();
  const previewPending = await writeVideoBoundaryCheckpoint({
    output,
    name: `${quotedCase.name}-preview`,
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
  const previewOriginUrl = await assertQuotedOriginLink(
    initial.gallery,
    `https://x.com/${quotedCase.username}/status/${quotedCase.owner}`,
    quotedCase.name === 'linked'
  );
  const previewNavigation = await navigateQuotedAwayAndBack(page, quotedCase, initial.total);
  await page.screenshot({ path: join(output, `quoted-${quotedCase.name}-preview-gallery.png`) });
  const previewClose = await closeQuotedGallery({
    gallery: initial.gallery,
    page,
    method: 'escape',
    before: previewBefore,
    caseName: quotedCase.route,
    selector: '[data-quote-target]',
  });

  const hostPlay = shell.locator('[data-testid="playButton"]');
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
  const hostVideo = shell.locator('video:not([data-host-action])');
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
  await hostVideo.focus();
  const playingBefore = await quotedHostSnapshot(page, quotedCase.route, '[data-video-key] video');
  assert.equal(playingBefore.active, true, 'Blob-backed host player must hold focus');
  const hostHit = await hostVideo.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return (
      document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === element
    );
  });
  assert.equal(hostHit, true, 'Blob-backed player must be the ordinary hit-tested click target');
  await captureQuotedOpeningScroll(hostVideo);
  const playingClickCount = await page.evaluate(() => window.__quoteFixtureClicks.length);
  await hostVideo.click();
  const playingPending = await writeVideoBoundaryCheckpoint({
    output,
    name: `${quotedCase.name}-playing`,
    page,
    api: quotedApiResponses.slice(apiStart),
  });
  const playingClick = await quotedClickRecord(page, playingClickCount, 'video');
  playingBefore.scrollY = Number(await hostVideo.getAttribute('data-opening-scroll-y'));
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
  await page.screenshot({ path: join(output, `quoted-${quotedCase.name}-playing-gallery.png`) });

  const knownIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const nativeMark = nativeLoopback.mark();
  const fetchMark = pageFetches.length;
  const filename = `${quotedCase.username}_${quotedCase.owner}_${quotedCase.expectedPosition - 1}.mp4`;
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
  const copiedName = `quoted-${quotedCase.name}-download.mp4`;
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
    selector: '[data-video-key] video',
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
  await page.screenshot({ path: join(output, `quoted-${quotedCase.name}-after.png`) });
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
    videoClickSettings,
    preview: {
      source: previewState.poster,
      click: previewClick,
      pending: previewPending,
      selected: initial.selectedMedia,
      originUrl: previewOriginUrl,
      navigation: previewNavigation,
      close: previewClose,
    },
    hostPlaying: {
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
  evidence.api = qualityApiResponses.slice(apiStart);
  evidence.requests = qualityRequests.slice(requestStart);
  assert(
    QUALITY_IMAGE_PATHS.every((path) =>
      evidence.requests.some(
        (request) => request.path === `/media/${path}` && request.name === 'orig'
      )
    ),
    'Source-quality ZIP must request the original form of all three images'
  );
  evidence.screenshots = [
    'source-quality-before.png',
    'source-quality-gallery.png',
    'source-quality-after.png',
  ];
  evidence.elapsedMs = performance.now() - startedAtMs;
  evidence.status = 'passed';
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
  let delayedVideoFailures: AcceptanceReceipt = { status: 'pending' };
  let rapidVideoClicks: AcceptanceReceipt = { status: 'pending' };
  let modelessRenderRecovery: AcceptanceReceipt = { status: 'pending' };
  const acceptanceFailures: unknown[] = [];
  const unavailableSequence: UnavailableEvidence & {
    controlledSetting?: ControlledSettingEvidence;
    error?: string;
    api?: ApiRecord[];
    screenshotError?: string;
  } = { status: 'pending', steps: [] };
  let fixtureVideoAssets: Record<string, { bytes: number; sha256: string }> | undefined;
  const mv3RestartCancellation: Mv3RestartEvidence = {
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
  let apiReuse: unknown = { status: 'pending' };
  let videoLoading: unknown = { status: 'pending' };
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
    fixtureRoutes = await installFixtureRoutes(context, root, images, displayImages);
    fixtureVideoAssets = Object.fromEntries(
      Object.entries(fixtureRoutes.videoPayloads).map(([name, bytes]) => [
        name,
        { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') },
      ])
    );
    nativeLoopback.setPayloads(images, fixtureRoutes.videoPayloads);
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
    await verifyMv3RestartCancellation({
      downloads,
      evidence: mv3RestartCancellation,
      extensionId,
      extensionPage,
      page,
      workerObserver,
    });
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
    for (const quotedCase of QUOTED_CASES) {
      const settingEvidence: ControlledSettingEvidence = {};
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
          screenshot: `quoted-${quotedCase.name}-failure.png`,
        };
        await attachVideoBoundaryFailure(diagnostic, {
          output,
          name: `${quotedCase.name}-failure`,
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
          join(output, `quoted-${quotedCase.name}-failure.json`),
          JSON.stringify(diagnostic, null, 2)
        ).catch(() => {});
        acceptanceFailures.push(error);
      }
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
        downloads,
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
    const expectedMemoryErrors = new Set(downloadMemory.expectedConsoleErrors ?? []);
    const expectedRenderFaultErrors = new Set(modelessRenderRecovery.expectedConsoleErrors ?? []);
    const unexpectedConsoleErrors = consoleErrors.filter(
      (record) =>
        !isExpectedFixtureApiConsoleError(record) &&
        !expectedMemoryErrors.has(record) &&
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
      apiReuse,
      videoLoading,
      sourceQualityApiResponses: fixtureRoutes.qualityApiResponses,
      sourceQualityRequests: fixtureRoutes.qualityRequests,
      mv3RestartCancellation,
      directRestart,
      trustedDownloadInput,
      downloadMemory,
      notification,
      nativeTransport,
      packagingAssets,
      publicDom,
      quotedVideoCycles,
      svgTargetMatrix,
      blockAllDirectVideo,
      directVideoAllowedModes,
      delayedVideoFailures,
      rapidVideoClicks,
      modelessRenderRecovery,
      unavailableSequence,
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
            apiReuse,
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
            svgTargetMatrix,
            blockAllDirectVideo,
            directVideoAllowedModes,
            delayedVideoFailures,
            rapidVideoClicks,
            modelessRenderRecovery,
            unavailableSequence,
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
  const validatedLiveUrls = validateLiveUrls(liveUrls);
  validateLiveObservation(liveObservation);
  await mkdir(output, { recursive: true });
  const profile = await mkdtemp(join(root, PROFILE_PREFIX));
  const installedExtensionPath = upgradeInput
    ? join(profile, 'owned-extension')
    : join(root, 'dist-extension');
  if (upgradeInput) {
    await cp(upgradeInput.previousExtensionPath, installedExtensionPath, { recursive: true });
    assert.equal(
      await extensionInventorySha256(installedExtensionPath),
      upgradeInput.previousExtensionInventorySha256
    );
  }
  const downloads = join(profile, 'downloads');
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
    scope: validatedLiveUrls.length
      ? 'deterministic fixture followed by opt-in public X status diagnostics; no auth, consent, CAPTCHA, live download, native Save As, Explorer, or performance claim'
      : 'deterministic fixture; no live or authenticated X.com, native Save As, Explorer, or performance claim',
    status: 'failed',
  };
  try {
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
    if (upgradeInput) {
      result.upgrade = await runExtensionUpgrade({
        context,
        extensionId,
        extensionPath: installedExtensionPath,
        input: upgradeInput,
        output,
        root,
      });
    }
    const images = await createImageFixtures(context);
    const displayImages = await createImageFixtures(context, 0.25);
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
    const live = await observeLiveUrls({
      context,
      extensionId,
      liveUrls: validatedLiveUrls,
      output,
    });
    result.live = live;
    result.evidenceStatus = validatedLiveUrls.length ? live.evidenceStatus : 'fixture-observed';
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
