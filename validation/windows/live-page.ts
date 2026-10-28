// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isAbsolute, join } from 'node:path';
import type { BrowserContext, ElementHandle, JSHandle, Page } from '@playwright/test';
import {
  observeSameDocumentPostNavigationAfterClose,
  observeActualSiteVideoNavigation,
  runActualSiteAcceptance,
} from './live-acceptance.ts';
import {
  inspectHitTestedAction,
  inspectHitTestedNativePreviewAction,
  inspectLiveTargetDocument,
  resolveLiveImageDocument,
  resolveLiveImageActionDocument,
  isBoundLiveImageOwnerDocument,
  inspectLiveCandidateDocument,
  inspectNativePreviewOwnerDocument,
  inspectSelectedGalleryDocument,
  eligibleLiveImageGalleryCountDocument,
  inspectSelectedGalleryVideoDocument,
  readSelectedCurrentVideoUrlDocument,
  inspectHitTestedVideoActionDocument,
  findHitTestedVideoControlDocument,
  inspectHostVideoDocument,
  quotedVideoHitTestPassed,
  captureActivationFocusDocument,
  findActivationHitDocument,
  quotedVideoSurface,
} from './live-page-document.ts';
import type {
  Source,
  Identity,
  NativePreviewTarget,
  LiveTarget,
  LiveReadiness,
  QuoteTarget,
} from './live-page-document.ts';
export type {
  Source,
  Identity,
  QuoteTarget,
  ImageTarget,
  NativePreviewTarget,
  LiveReadiness,
} from './live-page-document.ts';
export {
  inspectHitTestedAction,
  inspectHitTestedNativePreviewAction,
  inspectLiveTargetDocument,
  inspectLiveCandidateDocument,
  inspectNativePreviewOwnerDocument,
  inspectSelectedGalleryDocument,
  inspectSelectedGalleryVideoDocument,
  readSelectedCurrentVideoUrlDocument,
  inspectHitTestedVideoActionDocument,
  findHitTestedVideoControlDocument,
  inspectHostVideoDocument,
  quotedVideoHitTestPassed,
  captureActivationFocusDocument,
  findActivationHitDocument,
  quotedVideoSurface,
} from './live-page-document.ts';

type TweetMedia = {
  id: string | null;
  type: string;
  poster: Source | null;
  playableVariants: (Source | null)[];
};
type TweetSummary = { id: string | null; media: TweetMedia[] };
type ApiObservation = {
  operation: string;
  requestedTweetId: string | null;
  httpStatus: number;
  providerErrors: boolean;
  result: TweetSummary | null;
  directQuote: TweetSummary | null;
  nestedQuoteId: string | null;
  bodyOutcome?: string;
};
type ApiEvidence = {
  tweetResultByRestId: { requests: number; responses: number[] };
  observations: ApiObservation[];
  overflow: number;
};
type Diagnostic = {
  kind: string;
  location?: string;
  text?: string;
  name?: string;
  message?: string;
  status?: number;
  url?: string;
  error?: string;
  hadQuery?: boolean;
  hadCredentials?: boolean;
  hadPort?: boolean;
  hadFragment?: boolean;
  messageSha256?: string;
  messageByteLength?: number;
  inlineHandlerCsp?: boolean;
  nonceCanonical?: HostCspNonceCanonical;
  urlIdentitySha256?: string;
  queryIdentityMatched?: boolean;
};
type HostCspNonceCanonical = {
  algorithm: 'script-src-quoted-nonce-v1';
  sha256: string;
  count: number;
  lengths: number[];
};
type HostCspFingerprint = {
  script: string;
  messageSha256: string;
  messageByteLength: number;
  nonceCanonical?: HostCspNonceCanonical;
};
type ApiVideoIdentity = {
  ownerId: string;
  mediaId: string;
  mediaIndex: number;
  source: Source;
  rawUrl: string;
};
type DiagnosticIdentities = {
  selectedVideo: { source: Source; rawUrl: string } | null;
  apiVariants: ApiVideoIdentity[];
  apiVariantOverflow: boolean;
  requestUrls: Array<{ record: Diagnostic; rawUrl: string }>;
  requestUrlOverflow: boolean;
};
export type BorrowedHostDiagnosticProof = {
  schemaVersion: 1;
  kind: 'BorrowedHostDiagnosticProof';
  baseline: {
    receiptSha256: string;
    sourceSha: string;
    coreSha: string;
    bundleSha256: string;
    browserPid: number;
    browserBirthUtcTicks: string;
    browserSessionId: number;
    browserSidSha256: string;
    profilePathSha256: string;
    portReceiptSha256: string;
    status: 'baseline-observed';
    completedAtUtc: string;
    ownedPagesClosed: true;
    originalPagesPreserved: true;
    focusRestored: true;
    disconnected: true;
    inventory: {
      count: number;
      developerMode: false;
      relatedCount: 0;
      unrelatedDigest: string;
    };
    pages: Array<{
      requestedUrl: string;
      finalUrl: string;
      responseStatus: 200;
      articleVisible: true;
      closed: true;
      consoleErrors: Array<{
        kind: 'console-error';
        script: string;
        sourceKind: 'x-host-script-location';
        inlineHandlerCsp: true;
        messageSha256: string;
        messageByteLength: number;
        nonceCanonical?: HostCspNonceCanonical;
      }>;
      consoleOverflow: 0;
      pageErrorCount: 0;
      pageErrorOverflow: 0;
    }>;
  };
  current: {
    sourceSha: string;
    coreSha: string;
    bundleSha256: string;
    browserPid: number;
    browserBirthUtcTicks: string;
    browserSessionId: number;
    browserSidSha256: string;
    profilePathSha256: string;
    portReceiptSha256: string;
    unrelatedCount: number;
    unrelatedDigest: string;
    targetCount: 1;
    runtimeResourceCount: 12;
    runtimeResourceBinding: 'matched';
    extensionSourcePathVerified: true;
  };
};
export type OwnedCandidateInBorrowedBrowser = {
  kind: 'task-owned-extension-in-borrowed-browser';
  extensionId: string;
  installedPathSha256: string;
  newlyLoaded: true;
  sourcePathVerified: true;
  runtimeResourceCount: 12;
  runtimeResourceBinding: 'matched';
  newPagesOnly: true;
  downloadsPath: string;
  downloadsDirectoryOwned: true;
};

export function validateOwnedCandidateInBorrowedBrowser(
  proof: OwnedCandidateInBorrowedBrowser | null,
  extensionId: string,
  downloadsPath: string | null
): boolean {
  return (
    proof?.kind === 'task-owned-extension-in-borrowed-browser' &&
    /^[a-p]{32}$/u.test(extensionId) &&
    proof.extensionId === extensionId &&
    SHA256_PATTERN.test(proof.installedPathSha256) &&
    proof.newlyLoaded === true &&
    proof.sourcePathVerified === true &&
    proof.runtimeResourceCount === 12 &&
    proof.runtimeResourceBinding === 'matched' &&
    proof.newPagesOnly === true &&
    proof.downloadsDirectoryOwned === true &&
    downloadsPath !== null &&
    proof.downloadsPath === downloadsPath &&
    isAbsolute(downloadsPath)
  );
}
type ProductDiagnostic = Diagnostic & { location: string; text: string };
type HostSnapshot = {
  bodyStyle: { left: string; overflow: string; position: string; right: string; top: string };
  scrollRestoration: ScrollRestoration;
  scrollY: number;
};
type RestoredHostState = {
  after: HostSnapshot;
  focusRestored: boolean;
  bodyStylesRestored: boolean;
  scrollRestorationRestored: boolean;
  scrollRestored: boolean;
};

type LiveCandidate = ReturnType<typeof inspectLiveCandidateDocument>;
type GalleryObservation = {
  status: string;
  hostTimeline?: Array<Awaited<ReturnType<typeof captureHostGeometry>>>;
  before?: HostSnapshot;
  after?: HostSnapshot;
  focusPrepared?: boolean;
  identityBeforeClick?: boolean;
  hitTestBeforeClick?: ReturnType<typeof inspectHitTestedVideoActionDocument>;
  focusedControlStillOwnsClick?: boolean;
  activationFocusCaptured?: boolean;
  activationFocusChanged?: boolean;
  focusTarget?: string;
  opened?: {
    ariaModal: string | null;
    role: string | null;
    selectedGallery?: ReturnType<typeof inspectSelectedGalleryDocument> | null;
    selectedVideo?: ReturnType<typeof inspectSelectedGalleryVideoDocument> | null;
  };
  playback?: { startTime: number; endTime: number | null; progressed: boolean };
  owner?: ReturnType<typeof quotedOwnerForSource> | ReturnType<typeof directOwnerForSource>;
  ownerPath?: string | null;
  closeMethod?: string;
  detached?: boolean;
  focusRestored?: boolean;
  bodyStylesRestored?: boolean;
  scrollRestorationRestored?: boolean;
  scrollRestored?: boolean;
};
type LiveObservation = {
  schemaVersion: number;
  kind: string;
  requestedUrl: string;
  finalUrl: string | null;
  responseStatus: number | null;
  extension: {
    id: string;
    readinessMarker: boolean | null;
    readinessMarkerAtNavigation?: boolean;
    storedModeAfterReadiness?: string | null;
    videoClickModeSource?: 'unset-default' | 'primary-valid' | 'fallback-valid';
  };
  videoClickMode: string;
  target: LiveTarget | null;
  targetCandidatesBefore?: LiveCandidate | null;
  targetCandidates?: LiveCandidate | null;
  gallery: GalleryObservation;
  api: ApiEvidence;
  productErrors: Diagnostic[];
  productErrorOverflow: number;
  pageErrors: Diagnostic[];
  pageErrorOverflow: number;
  hostDiagnostics: Diagnostic[];
  hostDiagnosticOverflow: number;
  screenshots: { before?: string; open?: string; after?: string; error?: string };
  missingAssertions: string[];
  requiredAssertions?: Record<string, boolean>;
  evidenceStatus: string;
  status: string;
  cleanup?: { pageClosed: boolean; pageCloseError?: string };
  classification?: string;
  providerRejection?: ReturnType<typeof summarizeQuoteProviderRejection>;
  error?: string;
  expectedLifecycleCancellationCount?: number;
  controlledProbe?: ControlledProbe;
  actualSiteAcceptance?: Awaited<ReturnType<typeof runActualSiteAcceptance>>;
  sameDocumentPostNavigationAfterClose?: Awaited<
    ReturnType<typeof observeSameDocumentPostNavigationAfterClose>
  >;
  actualSiteVideoNavigation?: Awaited<ReturnType<typeof observeActualSiteVideoNavigation>>;
  imageBinding?: {
    status: 'bound' | 'timeout';
    timeoutMs: number;
    sameSourceImages?: {
      articleIndex: number;
      nearestArticleOwnsStatus: boolean;
      complete: boolean;
      naturalWidth: number;
    }[];
    sameSourceOverflow?: boolean;
  };
};
type ControlledProbe = {
  kind?: string;
  requestedMode?: string;
  priorStoredMode?: string | null;
  appliedMode?: string | null;
  observation?: LiveObservation | null;
  modeAfterObservation?: string | null;
  cleanup: {
    restored: boolean;
    extensionPageClosed: boolean;
    restoreError?: string;
    extensionPageError?: string;
  };
  status: string;
  error?: string;
};
type LiveCompletionOutcome = {
  status: string;
  cleanup?: { pageClosed: boolean };
  controlledProbe?: {
    status: string;
    observation?: { status: string; cleanup?: { pageClosed: boolean } } | null;
    cleanup: { restored: boolean; extensionPageClosed: boolean };
  } | null;
};

function controlledRetryComplete(page: LiveCompletionOutcome): boolean {
  const retry = page.controlledProbe;
  return (
    page.cleanup?.pageClosed !== false &&
    retry?.status === 'core-flow-observed' &&
    retry.observation?.status === 'core-flow-observed' &&
    retry.observation.cleanup?.pageClosed !== false &&
    retry.cleanup.restored === true &&
    retry.cleanup.extensionPageClosed === true
  );
}

export function liveCompletionPassed(page: LiveCompletionOutcome): boolean {
  return (
    page.cleanup?.pageClosed !== false &&
    (page.status === 'core-flow-observed' || controlledRetryComplete(page))
  );
}
type StoredField = { exists: boolean; value: unknown };
type StorageRecord = {
  exists: boolean;
  value: unknown;
  settings: unknown;
  fields?: Record<string, StoredField>;
};
type BorrowedVideoClickMode = {
  mode: 'block-all' | 'block-controls-only' | 'allow-all';
  source: 'unset-default' | 'primary-valid' | 'fallback-valid';
};

// Match DEFAULT_SETTINGS.gallery.videoClickMode in src/constants/settings.ts.
// This Windows script is packaged without src/, so the focused test guards drift.
const DEFAULT_VIDEO_CLICK_MODE = 'block-controls-only' as const;
const SETTINGS_FIELD_KEYS = [
  'gallery.preloadCount',
  'gallery.imageFitMode',
  'gallery.theme',
  'gallery.animations',
  'gallery.enableKeyboardNav',
  'gallery.videoVolume',
  'gallery.videoMuted',
  'gallery.videoClickMode',
  'toolbar.autoHideDelay',
  'features.gallery',
  'features.settings',
  'features.download',
  'features.mediaExtraction',
  'features.accessibility',
] as const;
const settingsFieldStorageKey = (key: string): string => `xeg-app-settings:field:${key}`;

export function resolveBorrowedVideoClickMode(
  stored: StorageRecord,
  fallbackRaw: string | null,
  fallbackFieldRaw: string | null = null
): BorrowedVideoClickMode {
  const fieldKey = settingsFieldStorageKey('gallery.videoClickMode');
  const field = stored.fields?.[fieldKey];
  if (field?.exists || fallbackFieldRaw !== null) {
    const primaryField = field?.exists ? decodeStoredRecord(field.value) : null;
    const fallbackField = fallbackFieldRaw === null ? null : decodeStoredRecord(fallbackFieldRaw);
    if ((field?.exists && !primaryField) || (fallbackFieldRaw !== null && !fallbackField)) {
      throw new Error('Borrowed video click field could not be decoded');
    }
    const fallbackWins =
      !primaryField ||
      (fallbackField &&
        fallbackField.updatedAt !== undefined &&
        (primaryField.updatedAt === undefined || fallbackField.updatedAt > primaryField.updatedAt));
    const selected = fallbackWins ? fallbackField : primaryField;
    if (
      selected?.value === 'block-all' ||
      selected?.value === 'block-controls-only' ||
      selected?.value === 'allow-all'
    ) {
      return { mode: selected.value, source: fallbackWins ? 'fallback-valid' : 'primary-valid' };
    }
    throw new Error('Borrowed effective video click field is unknown or invalid');
  }
  const primary = stored.exists && stored.value != null ? decodeStoredRecord(stored.value) : null;
  const fallback = fallbackRaw === null ? null : decodeStoredRecord(fallbackRaw);
  if (stored.exists && stored.value != null && !primary) {
    throw new Error('Borrowed extension settings record could not be decoded');
  }
  if (fallbackRaw !== null && !fallback) {
    throw new Error('Borrowed X-origin fallback settings record could not be decoded');
  }
  if (!primary && !fallback) {
    return { mode: DEFAULT_VIDEO_CLICK_MODE, source: 'unset-default' };
  }
  const fallbackWins =
    !primary ||
    (fallback &&
      fallback.updatedAt !== undefined &&
      (primary.updatedAt === undefined || fallback.updatedAt > primary.updatedAt));
  const selected = fallbackWins ? fallback : primary;
  const mode = storedVideoClickMode(selected?.value);
  if (mode === 'block-all' || mode === 'block-controls-only' || mode === 'allow-all') {
    return { mode, source: fallbackWins ? 'fallback-valid' : 'primary-valid' };
  }
  throw new Error('Borrowed effective video click mode is unknown or invalid');
}

function storedVideoClickMode(settings: unknown): string | null {
  const mode = field(field(settings, 'gallery'), 'videoClickMode');
  return typeof mode === 'string' ? mode : null;
}

declare const chrome: {
  storage: {
    local: {
      get(key: string): Promise<Record<string, unknown>>;
      set(value: Record<string, unknown>): Promise<void>;
      remove(key: string): Promise<void>;
    };
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function field(value: unknown, key: string): unknown {
  return record(value)?.[key];
}

const ACTION_TIMEOUT_MS = 15_000;
const NAVIGATION_TIMEOUT_MS = 45_000;
const READINESS_TIMEOUT_MS = 20_000;
const MAX_DIAGNOSTICS = 50;
const MAX_API_OBSERVATIONS = 12;
const MAX_API_BODY_BYTES = 2_000_000;
const LIVE_URL_PATTERN = /^https:\/\/(x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})\/status\/(\d+)$/u;

export function validateLiveUrls(values: unknown): string[] {
  if (!Array.isArray(values)) {
    throw new Error('X live URLs must be an array');
  }
  if (values.length > 3) {
    throw new Error('At most three X live URLs are supported');
  }
  return values.map((value) => {
    if (typeof value !== 'string' || /[\s\\]/u.test(value) || !LIVE_URL_PATTERN.test(value)) {
      throw new Error('Live URL must be an exact public X or Twitter status HTTPS URL');
    }
    const url = new URL(value);
    if (url.username || url.password || url.port || url.search || url.hash) {
      throw new Error('Live URL must not contain credentials, ports, query, or fragment');
    }
    return value;
  });
}

export function validateLiveObservation(value: unknown) {
  if (value !== null) {
    throw new Error('X live status validation does not support duration mode');
  }
}

function targetIdentity(value: string): Identity {
  const match = LIVE_URL_PATTERN.exec(value);
  if (!match) {
    throw new Error('Validated live URL lost its status identity');
  }
  const handle = match[2];
  const statusId = match[3];
  if (!handle || !statusId) {
    throw new Error('Validated live URL lost its status identity');
  }
  return { handle, statusId };
}

function sanitizedUrl(value: string) {
  try {
    const url = new URL(value);
    if (!['https:', 'chrome-extension:', 'about:'].includes(url.protocol)) {
      return url.protocol;
    }
    if (url.protocol === 'about:') {
      return 'about:blank';
    }
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return '[invalid-url]';
  }
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const SHA1_PATTERN = /^[0-9a-f]{40}$/u;
const INLINE_HANDLER_CSP_PREFIX =
  'Executing inline event handler violates the following Content Security Policy directive';
const MAX_CSP_MESSAGE_BYTES = 4096;
const MAX_BORROWED_BASELINE_AGE_MS = 2 * 60 * 60 * 1000;
const TIMELINE_SCRIPT_PATTERN =
  /^https:\/\/abs\.twimg\.com\/responsive-web\/client-web\/loader\.TimelineRenderer\.[a-z0-9]+\.js$/iu;
const CSP_NONCE_TOKEN = /'nonce-([A-Za-z0-9+/_-]{16,256}={0,2})'/gu;
const CSP_NONCE_ALGORITHM = 'script-src-quoted-nonce-v1';

function validNonceCanonical(value: unknown): value is HostCspNonceCanonical {
  const item = record(value);
  return Boolean(
    item &&
    Object.keys(item).sort().join(',') === 'algorithm,count,lengths,sha256' &&
    item.algorithm === CSP_NONCE_ALGORITHM &&
    typeof item.sha256 === 'string' &&
    SHA256_PATTERN.test(item.sha256) &&
    Number.isSafeInteger(item.count) &&
    Number(item.count) >= 1 &&
    Number(item.count) <= 20 &&
    Array.isArray(item.lengths) &&
    item.lengths.length === item.count &&
    item.lengths.every((length) => Number.isSafeInteger(length) && length >= 16 && length <= 258)
  );
}

// This hashes the full console message. Only nonce values inside its one quoted
// script-src directive are replaced for the optional canonical comparison.
export function fingerprintKnownInlineHandlerCsp(
  rawMessage: unknown,
  rawScript: unknown
): HostCspFingerprint | null {
  if (
    typeof rawMessage !== 'string' ||
    typeof rawScript !== 'string' ||
    Buffer.byteLength(rawScript, 'utf8') > 256 ||
    !TIMELINE_SCRIPT_PATTERN.test(rawScript) ||
    !rawMessage.startsWith(INLINE_HANDLER_CSP_PREFIX) ||
    Buffer.byteLength(rawMessage, 'utf8') > MAX_CSP_MESSAGE_BYTES
  ) {
    return null;
  }
  const full = {
    script: rawScript,
    messageSha256: sha256(rawMessage),
    messageByteLength: Buffer.byteLength(rawMessage, 'utf8'),
  };
  const marker = " 'script-src ";
  const start = rawMessage.indexOf(marker, INLINE_HANDLER_CSP_PREFIX.length);
  const end = start < 0 ? -1 : rawMessage.indexOf("'.", start + marker.length);
  if (
    start !== INLINE_HANDLER_CSP_PREFIX.length ||
    end < 0 ||
    end - start > 3500 ||
    rawMessage.indexOf(marker, start + marker.length) !== -1
  ) {
    return full;
  }
  const directive = rawMessage.slice(start, end + 1);
  const strict = [...directive.matchAll(CSP_NONCE_TOKEN)];
  if (
    strict.length < 1 ||
    strict.length > 20 ||
    (directive.match(/nonce-/gu) ?? []).length !== strict.length
  ) {
    return full;
  }
  const asciiWhitespace = (value: string | undefined) =>
    value !== undefined && /^[\t\n\f\r ]$/u.test(value);
  if (
    strict.some((match) => {
      const index = match.index;
      const afterIndex = index + match[0].length;
      const after = directive[afterIndex];
      return (
        !asciiWhitespace(directive[index - 1]) ||
        !(
          asciiWhitespace(after) ||
          afterIndex === directive.length ||
          (after === "'" && afterIndex === directive.length - 1)
        )
      );
    })
  ) {
    return full;
  }
  const canonical =
    rawMessage.slice(0, start) +
    directive.replace(CSP_NONCE_TOKEN, "'nonce-[value]'") +
    rawMessage.slice(end + 1);
  return {
    ...full,
    nonceCanonical: {
      algorithm: CSP_NONCE_ALGORITHM,
      sha256: sha256(canonical),
      count: strict.length,
      lengths: strict.map((match) => match[1]!.length),
    },
  };
}

function hasControlCharacter(value: string) {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code < 32 || code === 127) {
      return true;
    }
  }
  return false;
}

export function fullVideoUrlIdentity(value: unknown): {
  rawUrl: string;
  source: Source;
  hadQuery: boolean;
} | null {
  if (
    typeof value !== 'string' ||
    value.length > 2048 ||
    Buffer.byteLength(value, 'utf8') > 2048 ||
    !value.startsWith('https://video.twimg.com/') ||
    hasControlCharacter(value)
  ) {
    return null;
  }
  try {
    const url = new URL(value);
    if (
      url.href !== value ||
      url.protocol !== 'https:' ||
      url.hostname !== 'video.twimg.com' ||
      url.username ||
      url.password ||
      url.port ||
      hasExplicitUrlPort(value) ||
      url.hash
    ) {
      return null;
    }
    return {
      rawUrl: value,
      source: { host: url.hostname, path: url.pathname },
      hadQuery: Boolean(url.search),
    };
  } catch {
    return null;
  }
}

// The private caller verifies the receipt bytes and actual process/profile/source
// identities before constructing this packet. This check binds those claims to
// the URLs and diagnostics used by this observation; it does not read the VM.
export function validateBorrowedHostProof(
  proof: unknown,
  urls: string[]
): Map<string, HostCspFingerprint[]> | null {
  const packet = record(proof);
  const baseline = record(packet?.baseline);
  const current = record(packet?.current);
  const inventory = record(baseline?.inventory);
  const sha256Fields = [
    'bundleSha256',
    'browserSidSha256',
    'profilePathSha256',
    'portReceiptSha256',
  ];
  const completedAt =
    typeof baseline?.completedAtUtc === 'string' &&
    /^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/u.test(baseline.completedAtUtc)
      ? Date.parse(baseline.completedAtUtc)
      : NaN;
  if (
    packet?.schemaVersion !== 1 ||
    packet.kind !== 'BorrowedHostDiagnosticProof' ||
    !baseline ||
    !current ||
    !inventory ||
    typeof baseline.receiptSha256 !== 'string' ||
    !SHA256_PATTERN.test(baseline.receiptSha256) ||
    typeof baseline.sourceSha !== 'string' ||
    !SHA1_PATTERN.test(baseline.sourceSha) ||
    typeof baseline.coreSha !== 'string' ||
    !SHA1_PATTERN.test(baseline.coreSha) ||
    sha256Fields.some(
      (key) =>
        typeof baseline[key] !== 'string' ||
        !SHA256_PATTERN.test(baseline[key]) ||
        baseline[key] !== current[key]
    ) ||
    baseline.sourceSha !== current.sourceSha ||
    baseline.coreSha !== current.coreSha ||
    !Number.isSafeInteger(baseline.browserPid) ||
    Number(baseline.browserPid) <= 0 ||
    baseline.browserPid !== current.browserPid ||
    typeof baseline.browserBirthUtcTicks !== 'string' ||
    !/^\d{12,20}$/u.test(baseline.browserBirthUtcTicks) ||
    baseline.browserBirthUtcTicks !== current.browserBirthUtcTicks ||
    !Number.isSafeInteger(baseline.browserSessionId) ||
    Number(baseline.browserSessionId) < 0 ||
    baseline.browserSessionId !== current.browserSessionId ||
    baseline.status !== 'baseline-observed' ||
    !Number.isFinite(completedAt) ||
    completedAt > Date.now() ||
    Date.now() - completedAt > MAX_BORROWED_BASELINE_AGE_MS ||
    baseline.ownedPagesClosed !== true ||
    baseline.originalPagesPreserved !== true ||
    baseline.focusRestored !== true ||
    baseline.disconnected !== true ||
    inventory.developerMode !== false ||
    inventory.relatedCount !== 0 ||
    !Number.isSafeInteger(inventory.count) ||
    Number(inventory.count) < 0 ||
    Number(inventory.count) > 100 ||
    inventory.count !== current.unrelatedCount ||
    typeof inventory.unrelatedDigest !== 'string' ||
    !SHA256_PATTERN.test(inventory.unrelatedDigest) ||
    inventory.unrelatedDigest !== current.unrelatedDigest ||
    current.targetCount !== 1 ||
    current.runtimeResourceCount !== 12 ||
    current.runtimeResourceBinding !== 'matched' ||
    current.extensionSourcePathVerified !== true ||
    !Array.isArray(baseline.pages) ||
    baseline.pages.length !== urls.length ||
    urls.length === 0 ||
    urls.length > 3 ||
    urls.some((url) => typeof url !== 'string' || !LIVE_URL_PATTERN.test(url)) ||
    new Set(urls).size !== urls.length
  ) {
    return null;
  }
  const expected = new Map<string, HostCspFingerprint[]>();
  for (const value of baseline.pages) {
    const page = record(value);
    if (
      !page ||
      typeof page.requestedUrl !== 'string' ||
      !urls.includes(page.requestedUrl) ||
      expected.has(page.requestedUrl) ||
      page.finalUrl !== page.requestedUrl ||
      page.responseStatus !== 200 ||
      page.articleVisible !== true ||
      page.closed !== true ||
      page.consoleOverflow !== 0 ||
      page.pageErrorCount !== 0 ||
      page.pageErrorOverflow !== 0 ||
      !Array.isArray(page.consoleErrors) ||
      page.consoleErrors.length > 50
    ) {
      return null;
    }
    const fingerprints: HostCspFingerprint[] = [];
    for (const value of page.consoleErrors) {
      const item = record(value);
      if (
        !item ||
        item.kind !== 'console-error' ||
        item.sourceKind !== 'x-host-script-location' ||
        item.inlineHandlerCsp !== true ||
        typeof item.script !== 'string' ||
        Buffer.byteLength(item.script, 'utf8') > 256 ||
        !TIMELINE_SCRIPT_PATTERN.test(item.script) ||
        typeof item.messageSha256 !== 'string' ||
        !SHA256_PATTERN.test(item.messageSha256) ||
        !Number.isSafeInteger(item.messageByteLength) ||
        Number(item.messageByteLength) < INLINE_HANDLER_CSP_PREFIX.length ||
        Number(item.messageByteLength) > MAX_CSP_MESSAGE_BYTES ||
        (Object.hasOwn(item, 'nonceCanonical') && !validNonceCanonical(item.nonceCanonical))
      ) {
        return null;
      }
      fingerprints.push({
        script: item.script,
        messageSha256: item.messageSha256,
        messageByteLength: Number(item.messageByteLength),
        ...(Object.hasOwn(item, 'nonceCanonical')
          ? { nonceCanonical: item.nonceCanonical as HostCspNonceCanonical }
          : {}),
      });
    }
    expected.set(page.requestedUrl, fingerprints);
  }
  return expected.size === urls.length ? expected : null;
}

function sanitizedText(value: unknown, maximum = 600) {
  return String(value)
    .replace(/https?:\/\/[^\s<>"']+/giu, (match) => sanitizedUrl(match.replace(/[),.;]+$/u, '')))
    .replace(/\bBearer\s+[^\s,;]+/giu, 'Bearer [redacted]')
    .replace(
      /\b(token|authorization|auth|api[_-]?key|code|state|session|cookie)\s*([=:])\s*[^\s,;]+/giu,
      '$1$2[redacted]'
    )
    .replace(/[A-Za-z]:\\[^\r\n\t]*/gu, '[path]')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, maximum);
}

function safeError(error: unknown) {
  return sanitizedText(error instanceof Error ? `${error.name}: ${error.message}` : error, 2_000);
}

function addBounded<T>(
  list: T[],
  value: T,
  observation: LiveObservation,
  overflowKey: 'productErrorOverflow' | 'hostDiagnosticOverflow' | 'pageErrorOverflow'
) {
  if (list.length < MAX_DIAGNOSTICS) {
    list.push(value);
  } else {
    observation[overflowKey] += 1;
  }
}

function mediaSource(value: unknown, kind: 'video' | 'image'): Source | null {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    const url = new URL(value);
    const allowed =
      kind === 'video'
        ? url.protocol === 'https:' && url.hostname === 'video.twimg.com'
        : url.protocol === 'https:' &&
          url.hostname === 'pbs.twimg.com' &&
          (/^\/media\//u.test(url.pathname) ||
            /^\/(?:ext_tw_video_thumb|amplify_video_thumb)\//u.test(url.pathname));
    return allowed ? { host: url.hostname, path: url.pathname } : null;
  } catch {
    return null;
  }
}

function unwrapTweet(value: unknown): Record<string, unknown> | null {
  const result = field(value, 'result') ?? value;
  return record(field(result, 'tweet') ?? result);
}

function summarizeTweet(value: unknown): TweetSummary | null {
  const tweet = unwrapTweet(value);
  if (!tweet || typeof tweet !== 'object') {
    return null;
  }
  const id = tweet.rest_id ?? field(tweet.legacy, 'id_str') ?? tweet.id_str;
  const media =
    field(field(tweet.legacy, 'extended_entities'), 'media') ??
    field(tweet.extended_entities, 'media') ??
    [];
  return {
    id: typeof id === 'string' && /^\d+$/u.test(id) ? id : null,
    media: Array.isArray(media)
      ? media.slice(0, 12).map((item): TweetMedia => {
          const mediaId = field(item, 'id_str');
          const mediaType = field(item, 'type');
          const variants = field(field(item, 'video_info'), 'variants');
          return {
            id: typeof mediaId === 'string' && /^\d{1,40}$/u.test(mediaId) ? mediaId : null,
            type:
              typeof mediaType === 'string' &&
              ['photo', 'video', 'animated_gif'].includes(mediaType)
                ? mediaType
                : 'unknown',
            poster: mediaSource(field(item, 'media_url_https'), 'image'),
            playableVariants: Array.isArray(variants)
              ? variants
                  .slice(0, 12)
                  .filter(
                    (variant) =>
                      field(variant, 'content_type') === 'video/mp4' &&
                      mediaSource(field(variant, 'url'), 'video')
                  )
                  .map((variant) => mediaSource(field(variant, 'url'), 'video'))
              : [],
          };
        })
      : [],
  };
}

export function summarizeTweetResultResponse(
  urlValue: string,
  status: number,
  body: unknown
): ApiObservation | null {
  const url = new URL(urlValue);
  if (!url.pathname.endsWith('/TweetResultByRestId')) {
    return null;
  }
  let requestedTweetId = null;
  try {
    const variables: unknown = JSON.parse(url.searchParams.get('variables') ?? '{}');
    const tweetId = field(variables, 'tweetId');
    if (typeof tweetId === 'string' && /^\d+$/u.test(tweetId)) {
      requestedTweetId = tweetId;
    }
  } catch {
    // Record a missing ID without retaining the request query.
  }
  const result = unwrapTweet(field(field(field(body, 'data'), 'tweetResult'), 'result'));
  const directQuote = unwrapTweet(result?.quoted_status_result);
  const providerErrors = field(body, 'errors');
  return {
    operation: 'TweetResultByRestId',
    requestedTweetId,
    httpStatus: status,
    providerErrors: Array.isArray(providerErrors) && providerErrors.length > 0,
    result: summarizeTweet(result),
    directQuote: summarizeTweet(directQuote),
    nestedQuoteId: summarizeTweet(unwrapTweet(directQuote?.quoted_status_result))?.id ?? null,
  };
}

export function captureApiVideoIdentities(
  body: unknown,
  summary: ApiObservation,
  identities: DiagnosticIdentities
): void {
  if (summary.httpStatus !== 200 || summary.providerErrors) {
    return;
  }
  const result = unwrapTweet(field(field(field(body, 'data'), 'tweetResult'), 'result'));
  const directQuote = unwrapTweet(result?.quoted_status_result);
  for (const [tweet, summarized] of [
    [result, summary.result],
    [directQuote, summary.directQuote],
  ] as const) {
    if (!tweet || !summarized?.id || !/^\d{1,40}$/u.test(summarized.id)) {
      continue;
    }
    const media =
      field(field(tweet.legacy, 'extended_entities'), 'media') ??
      field(tweet.extended_entities, 'media');
    if (!Array.isArray(media)) {
      continue;
    }
    for (const [mediaIndex, rawMedia] of media.slice(0, 12).entries()) {
      const item = summarized.media[mediaIndex];
      if (item?.type !== 'video' && item?.type !== 'animated_gif') {
        continue;
      }
      if (!item.id || !/^\d{1,40}$/u.test(item.id)) {
        continue;
      }
      const variants = field(field(rawMedia, 'video_info'), 'variants');
      if (!Array.isArray(variants)) {
        continue;
      }
      for (const variant of variants.slice(0, 12)) {
        if (field(variant, 'content_type') !== 'video/mp4') {
          continue;
        }
        const identity = fullVideoUrlIdentity(field(variant, 'url'));
        if (
          !identity ||
          !item.playableVariants.some(
            (source) =>
              source?.host === identity.source.host && source.path === identity.source.path
          )
        ) {
          continue;
        }
        if (identities.apiVariants.length >= 96) {
          identities.apiVariantOverflow = true;
          return;
        }
        identities.apiVariants.push({
          ownerId: summarized.id,
          mediaId: item.id,
          mediaIndex,
          source: identity.source,
          rawUrl: identity.rawUrl,
        });
      }
    }
  }
}

export function summarizeQuoteProviderRejection(api: ApiEvidence | null | undefined) {
  const observations = Array.isArray(api?.observations) ? api.observations : [];
  const rejected = observations.find(
    (item) =>
      item?.operation === 'TweetResultByRestId' &&
      ((Number.isInteger(item.httpStatus) && item.httpStatus >= 400 && item.httpStatus <= 599) ||
        item.providerErrors === true)
  );
  const statuses = api?.tweetResultByRestId?.responses;
  const fallbackStatus = Array.isArray(statuses)
    ? statuses.find((status) => Number.isInteger(status) && status >= 400 && status <= 599)
    : null;
  if (!rejected && fallbackStatus == null) {
    return null;
  }
  const status = rejected?.httpStatus ?? fallbackStatus;
  const httpError =
    typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599;
  const validStatus =
    typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599;
  return {
    operation: 'TweetResultByRestId',
    kind: httpError ? 'http-rejection' : 'graphql-errors',
    httpStatus: validStatus ? status : null,
    requestedTweetId:
      typeof rejected?.requestedTweetId === 'string' && /^\d+$/u.test(rejected.requestedTweetId)
        ? rejected.requestedTweetId
        : null,
  };
}

export function summarizeCompactImageEvidence(
  api: ApiEvidence,
  ownerStatusId: string,
  sourcePath: string,
  selectedItemIndex: number | null
): {
  providerRejection: ReturnType<typeof summarizeQuoteProviderRejection>;
  providerConfirmed: boolean;
  apiMediaIndex: number | null;
} {
  const relevant = api.observations.filter(
    (item) => item.operation === 'TweetResultByRestId' && item.requestedTweetId === ownerStatusId
  );
  const providerRejection = summarizeQuoteProviderRejection({
    tweetResultByRestId: { requests: relevant.length, responses: [] },
    observations: relevant,
    overflow: 0,
  });
  const stem = (path: string) => path.replace(/\.(?:jpe?g|png|webp|gif)$/iu, '');
  const healthy = relevant.filter(
    (item) => item.httpStatus === 200 && !item.providerErrors && item.result?.id === ownerStatusId
  );
  const matchingIndexes = healthy.flatMap((item) =>
    (item.result?.media ?? []).flatMap((media, index) =>
      media.type === 'photo' &&
      media.poster?.host === 'pbs.twimg.com' &&
      media.poster.path.startsWith('/media/') &&
      stem(media.poster.path) === stem(sourcePath)
        ? [index]
        : []
    )
  );
  return {
    providerRejection,
    providerConfirmed:
      api.overflow === 0 &&
      !providerRejection &&
      healthy.length === 1 &&
      matchingIndexes.length === 1 &&
      matchingIndexes[0] === selectedItemIndex,
    apiMediaIndex: matchingIndexes.length === 1 ? (matchingIndexes[0] ?? null) : null,
  };
}

export function refreshNativePreviewObservation(observation: LiveObservation) {
  const target = observation.target;
  const required = observation.requiredAssertions;
  if (target?.kind !== 'native-preview-photo' || !required) {
    throw new Error('Native preview assertions were not recorded');
  }
  const expectedOwnerPath = `/${target.ownerHandle}/status/${target.ownerStatusId}`;
  const evidence = summarizeNativePreviewEvidence(
    observation.api,
    target.ownerStatusId,
    target.photoNumber,
    observation.gallery.opened?.selectedGallery ?? null,
    observation.gallery.ownerPath ?? null,
    expectedOwnerPath
  );
  required.exactCProviderPhoto = evidence.providerConfirmed;
  required.selectedCPhoto = evidence.selectedConfirmed;
  required.canonicalCOwner = evidence.ownerConfirmed;
  required.noProductErrors =
    observation.productErrors.length === 0 && observation.productErrorOverflow === 0;
  required.noPageErrors =
    observation.pageErrors.length === 0 && observation.pageErrorOverflow === 0;
  observation.missingAssertions = Object.entries(required)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  if (evidence.providerRejection) {
    observation.providerRejection = evidence.providerRejection;
    observation.classification = 'provider-rejection-observed-gallery-unverified';
  }
  if (observation.missingAssertions.length) {
    observation.status = 'failed';
    observation.error = `Missing native-preview assertions: ${observation.missingAssertions.join(', ')}`;
    observation.classification ??= 'native-preview-evidence-unverified';
  }
  observation.evidenceStatus =
    observation.missingAssertions.length ||
    observation.hostDiagnostics.length ||
    observation.hostDiagnosticOverflow > 0
      ? 'unverified'
      : 'observed';
  return observation.missingAssertions;
}

export function summarizeNativePreviewEvidence(
  api: ApiEvidence,
  ownerStatusId: string,
  photoNumber: number,
  selected: ReturnType<typeof inspectSelectedGalleryDocument> | null,
  ownerPath: string | null,
  expectedOwnerPath: string
) {
  const relevant = api.observations.filter(
    (item) => item.operation === 'TweetResultByRestId' && item.requestedTweetId === ownerStatusId
  );
  const providerRejection = summarizeQuoteProviderRejection({
    tweetResultByRestId: { requests: relevant.length, responses: [] },
    observations: relevant,
    overflow: 0,
  });
  const healthy = relevant.filter(
    (item) => item.httpStatus === 200 && !item.providerErrors && item.result?.id === ownerStatusId
  );
  const media = healthy.length === 1 ? healthy[0]?.result?.media[photoNumber - 1] : null;
  const source =
    media?.type === 'photo' &&
    media.poster?.host === 'pbs.twimg.com' &&
    media.poster.path.startsWith('/media/')
      ? media.poster
      : null;
  return {
    providerRejection,
    source,
    apiMediaIndex: source ? photoNumber - 1 : null,
    providerConfirmed:
      api.overflow === 0 &&
      api.tweetResultByRestId.requests === api.tweetResultByRestId.responses.length &&
      !providerRejection &&
      relevant.length === 1 &&
      source !== null,
    selectedConfirmed:
      source !== null &&
      selected !== null &&
      selected !== false &&
      selected.itemVisible === true &&
      selected.itemIndex === photoNumber - 1 &&
      selected.positionValue === photoNumber &&
      selected.imageSource.host === source.host &&
      selected.imageSource.path === source.path,
    ownerConfirmed:
      /^\/[A-Za-z0-9_]{1,15}\/status\/[1-9]\d*$/u.test(expectedOwnerPath) &&
      ownerPath === expectedOwnerPath,
  };
}

export function classifyLiveFailure(
  classification: string | undefined,
  galleryStatus: string,
  providerRejection: ReturnType<typeof summarizeQuoteProviderRejection>
) {
  if (classification === 'controlled-media-click-did-not-open-gallery' && providerRejection) {
    return 'provider-rejection-observed-gallery-unverified';
  }
  if (classification) {
    return classification;
  }
  if (providerRejection) {
    return 'provider-failure-with-unverified-product-flow';
  }
  return galleryStatus === 'attempting' || galleryStatus === 'observed'
    ? 'product-flow-unverified'
    : 'target-or-product-unverified';
}

function ownedVideoPath(source: Source | null | undefined, mediaId: string) {
  const match = /^\/(amplify_video|ext_tw_video)\/(\d{1,40})\//u.exec(source?.path ?? '');
  return source?.host === 'video.twimg.com' && match?.[2] === mediaId ? (match?.[1] ?? null) : null;
}

function hasExplicitUrlPort(value: string) {
  const authority = /^https:\/\/([^/?#]+)/iu.exec(value)?.[1];
  return /:\d+$/u.test(authority ?? '');
}

function matchedCspCount(records: Diagnostic[], expected: HostCspFingerprint[] | null) {
  if (!expected) {
    return 0;
  }
  const consoleErrors = records.filter((record) => record.kind === 'console');
  if (consoleErrors.length !== expected.length) {
    return 0;
  }
  const actual: HostCspFingerprint[] = [];
  for (const record of consoleErrors) {
    if (
      record.inlineHandlerCsp !== true ||
      typeof record.location !== 'string' ||
      Buffer.byteLength(record.location, 'utf8') > 256 ||
      !TIMELINE_SCRIPT_PATTERN.test(record.location) ||
      typeof record.messageSha256 !== 'string' ||
      !SHA256_PATTERN.test(record.messageSha256) ||
      !Number.isSafeInteger(record.messageByteLength) ||
      Number(record.messageByteLength) < INLINE_HANDLER_CSP_PREFIX.length ||
      Number(record.messageByteLength) > MAX_CSP_MESSAGE_BYTES ||
      (Object.hasOwn(record, 'nonceCanonical') && !validNonceCanonical(record.nonceCanonical))
    ) {
      return 0;
    }
    actual.push({
      script: record.location,
      messageSha256: record.messageSha256,
      messageByteLength: Number(record.messageByteLength),
      ...(record.nonceCanonical ? { nonceCanonical: record.nonceCanonical } : {}),
    });
  }
  const matches = (seen: HostCspFingerprint, reference: HostCspFingerprint) => {
    if (
      seen.script !== reference.script ||
      seen.messageByteLength !== reference.messageByteLength
    ) {
      return false;
    }
    if (seen.messageSha256 === reference.messageSha256) {
      return true;
    }
    const a = seen.nonceCanonical;
    const b = reference.nonceCanonical;
    return (
      validNonceCanonical(a) &&
      validNonceCanonical(b) &&
      a.algorithm === b.algorithm &&
      a.sha256 === b.sha256 &&
      a.count === b.count &&
      a.lengths.every((length, index) => length === b.lengths[index])
    );
  };
  // Exact multiset matching handles duplicate CSP messages without allowing one
  // baseline entry to qualify several observed records.
  const occupied = Array<number>(expected.length).fill(-1);
  const assign = (index: number, visited: Set<number>): boolean => {
    for (let slot = 0; slot < expected.length; slot += 1) {
      if (visited.has(slot) || !matches(actual[index]!, expected[slot]!)) {
        continue;
      }
      visited.add(slot);
      if (occupied[slot] === -1 || assign(occupied[slot]!, visited)) {
        occupied[slot] = index;
        return true;
      }
    }
    return false;
  };
  return actual.every((_, index) => assign(index, new Set())) ? actual.length : 0;
}

function matchesSelectedQueryAbort(
  record: Diagnostic,
  observation: LiveObservation,
  identities: DiagnosticIdentities | null
) {
  if (
    !identities?.selectedVideo ||
    identities.apiVariantOverflow ||
    identities.requestUrlOverflow ||
    observation.api.overflow !== 0 ||
    record.kind !== 'request-failed' ||
    record.error !== 'net::ERR_ABORTED' ||
    record.hadQuery !== true ||
    record.hadFragment !== false ||
    record.hadCredentials === true ||
    record.hadPort === true ||
    typeof record.url !== 'string'
  ) {
    return false;
  }
  const owner = observation.gallery.owner;
  if (
    owner?.status !== 'matched-direct-quote-variant' ||
    !owner.ownerId ||
    !owner.mediaId ||
    !Number.isSafeInteger(owner.mediaIndex)
  ) {
    return false;
  }
  let request: URL;
  try {
    request = new URL(record.url);
  } catch {
    return false;
  }
  const selected = identities.selectedVideo.source;
  if (
    request.protocol !== 'https:' ||
    request.hostname !== 'video.twimg.com' ||
    request.pathname !== selected.path ||
    selected.host !== request.hostname ||
    !ownedVideoPath(selected, owner.mediaId)
  ) {
    return false;
  }
  const rawUrl = identities.requestUrls.find((item) => item.record === record)?.rawUrl;
  const full = fullVideoUrlIdentity(rawUrl);
  if (
    !full?.hadQuery ||
    full.rawUrl !== identities.selectedVideo.rawUrl ||
    full.source.host !== selected.host ||
    full.source.path !== selected.path
  ) {
    return false;
  }
  const variants = identities.apiVariants.filter(
    (variant) =>
      variant.ownerId === owner.ownerId &&
      variant.mediaId === owner.mediaId &&
      variant.mediaIndex === owner.mediaIndex &&
      variant.source.host === selected.host &&
      variant.source.path === selected.path
  );
  const uniqueUrls = new Set(variants.map((variant) => variant.rawUrl));
  const matched = uniqueUrls.size === 1 && uniqueUrls.has(full.rawUrl);
  if (matched) {
    record.urlIdentitySha256 = sha256(full.rawUrl);
    record.queryIdentityMatched = true;
  }
  return matched;
}

export function classifyLiveHostDiagnostics(
  observation: LiveObservation,
  proof: { expectedCsp: HostCspFingerprint[]; identities: DiagnosticIdentities } | null = null
) {
  const required = observation.requiredAssertions;
  const allRequired =
    required &&
    Object.keys(required).length >= 13 &&
    Object.values(required).every((passed) => passed === true) &&
    observation.productErrors?.length === 0 &&
    observation.productErrorOverflow === 0 &&
    observation.pageErrors?.length === 0 &&
    observation.pageErrorOverflow === 0;
  const owner = observation.gallery?.owner;
  const selectedVideo = observation.gallery?.opened?.selectedVideo;
  const source = selectedVideo ? selectedVideo.source : null;
  const mediaId = owner?.mediaId;
  const family =
    owner?.status === 'matched-direct-quote-variant' && mediaId && /^\d{1,40}$/u.test(mediaId)
      ? ownedVideoPath(source, mediaId)
      : null;
  const proofEligible = proof !== null && observation.missingAssertions.length === 0;
  const expectedLifecycleCancellationCount =
    allRequired && family
      ? observation.hostDiagnostics.filter((record) => {
          if (
            proof &&
            proofEligible &&
            matchesSelectedQueryAbort(record, observation, proof.identities)
          ) {
            return true;
          }
          if (
            record.kind !== 'request-failed' ||
            record.error !== 'net::ERR_ABORTED' ||
            record.hadQuery === true ||
            record.hadCredentials === true ||
            record.hadPort === true ||
            !record.url
          ) {
            return false;
          }
          try {
            const url = new URL(record.url);
            return (
              url.protocol === 'https:' &&
              !url.username &&
              !url.password &&
              !hasExplicitUrlPort(record.url) &&
              !url.search &&
              !url.hash &&
              ownedVideoPath({ host: url.hostname, path: url.pathname }, mediaId ?? '') === family
            );
          } catch {
            return false;
          }
        }).length
      : 0;
  const qualifiedCspCount =
    proof && proofEligible && allRequired
      ? matchedCspCount(observation.hostDiagnostics, proof.expectedCsp)
      : 0;
  return {
    expectedLifecycleCancellationCount,
    evidenceStatus:
      allRequired &&
      observation.hostDiagnosticOverflow === 0 &&
      expectedLifecycleCancellationCount + qualifiedCspCount === observation.hostDiagnostics.length
        ? 'observed'
        : 'unverified',
    ...(proof ? { qualifiedCspCount } : {}),
  };
}

export function refreshQuotedVideoErrorAssertions(observation: LiveObservation) {
  const required = observation.requiredAssertions;
  if (!required) {
    throw new Error('Quoted video assertions were not recorded');
  }
  required.noProductErrors =
    observation.productErrors.length === 0 && observation.productErrorOverflow === 0;
  required.noPageErrors =
    observation.pageErrors.length === 0 && observation.pageErrorOverflow === 0;
  observation.missingAssertions = Object.entries(required)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  return observation.missingAssertions;
}

function isProductConsoleError(record: ProductDiagnostic) {
  return (
    record.location.startsWith('chrome-extension:') ||
    /\bXEG\b|X\.com Enhanced Gallery|\[(?:MediaExtractor|DOMFallbackExtractor|Gallery)\]/iu.test(
      record.text
    )
  );
}

function attachDiagnostics(
  page: Page,
  observation: LiveObservation,
  identities: DiagnosticIdentities | null = null
) {
  const pendingResponses = new Set<Promise<void>>();
  page.on('console', (message) => {
    if (message.type() !== 'error') {
      return;
    }
    const raw = message.text();
    const rawScript = message.location().url || 'about:blank';
    const location = sanitizedUrl(rawScript);
    const fingerprint = identities ? fingerprintKnownInlineHandlerCsp(raw, rawScript) : null;
    const record = {
      kind: 'console',
      location,
      text: sanitizedText(raw),
      ...(fingerprint
        ? {
            inlineHandlerCsp: true,
            messageSha256: fingerprint.messageSha256,
            messageByteLength: fingerprint.messageByteLength,
            ...(fingerprint.nonceCanonical ? { nonceCanonical: fingerprint.nonceCanonical } : {}),
          }
        : {}),
    };
    const product = isProductConsoleError(record);
    if (fingerprint) {
      record.text = record.text.replace(/nonce-[^\s'"<>]*/gu, 'nonce-[redacted]');
    }
    addBounded(
      product ? observation.productErrors : observation.hostDiagnostics,
      record,
      observation,
      product ? 'productErrorOverflow' : 'hostDiagnosticOverflow'
    );
  });
  page.on('pageerror', (error) => {
    addBounded(
      observation.pageErrors,
      {
        kind: 'page-error',
        name: sanitizedText(error.name, 100),
        message: sanitizedText(error.message),
      },
      observation,
      'pageErrorOverflow'
    );
  });
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('/TweetResultByRestId')) {
      observation.api.tweetResultByRestId.requests += 1;
    }
  });
  page.on('response', (response) => {
    const url = response.url();
    const path = new URL(url).pathname;
    if (path.endsWith('/TweetResultByRestId')) {
      observation.api.tweetResultByRestId.responses.push(response.status());
      if (observation.api.observations.length + pendingResponses.size < MAX_API_OBSERVATIONS) {
        const capture = (async () => {
          let body = null;
          let bodyOutcome = 'not-readable';
          const length = Number(response.headers()['content-length']);
          if (!Number.isFinite(length) || length <= MAX_API_BODY_BYTES) {
            try {
              const bytes = await response.body();
              if (bytes.length <= MAX_API_BODY_BYTES) {
                body = JSON.parse(bytes.toString('utf8'));
                bodyOutcome = 'parsed';
              } else {
                bodyOutcome = 'too-large';
              }
            } catch {
              bodyOutcome = 'not-readable';
            }
          } else {
            bodyOutcome = 'too-large';
          }
          const summary = summarizeTweetResultResponse(url, response.status(), body);
          if (summary) {
            observation.api.observations.push({ ...summary, bodyOutcome });
            if (identities && bodyOutcome === 'parsed') {
              captureApiVideoIdentities(body, summary, identities);
            }
          }
        })();
        pendingResponses.add(capture);
        capture.finally(() => pendingResponses.delete(capture));
      } else {
        observation.api.overflow += 1;
      }
    }
    if (response.status() >= 400) {
      addBounded(
        observation.hostDiagnostics,
        { kind: 'http-response', status: response.status(), url: sanitizedUrl(url) },
        observation,
        'hostDiagnosticOverflow'
      );
    }
  });
  page.on('requestfailed', (request) => {
    const rawUrl = request.url();
    const url = new URL(rawUrl);
    const fullIdentity = identities ? fullVideoUrlIdentity(rawUrl) : null;
    const record = {
      kind: 'request-failed',
      error: sanitizedText(request.failure()?.errorText ?? 'unknown', 200),
      url: sanitizedUrl(rawUrl),
      hadQuery: Boolean(url.search || url.hash),
      hadCredentials: Boolean(url.username || url.password),
      hadPort: hasExplicitUrlPort(rawUrl),
      ...(identities ? { hadFragment: Boolean(url.hash) } : {}),
    };
    const product = record.url.startsWith('chrome-extension:');
    if (identities && !product && fullIdentity?.hadQuery) {
      if (
        identities.requestUrls.length < MAX_DIAGNOSTICS &&
        observation.hostDiagnostics.length < MAX_DIAGNOSTICS
      ) {
        identities.requestUrls.push({ record, rawUrl: fullIdentity.rawUrl });
      } else {
        identities.requestUrlOverflow = true;
      }
    }
    addBounded(
      product ? observation.productErrors : observation.hostDiagnostics,
      record,
      observation,
      product ? 'productErrorOverflow' : 'hostDiagnosticOverflow'
    );
  });
  return async () => {
    await Promise.allSettled([...pendingResponses]);
  };
}

async function hostSnapshot(page: Page): Promise<HostSnapshot> {
  return page.evaluate(() => {
    const style = document.body.style;
    return {
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
}

async function captureHostGeometry(action: ElementHandle<SVGElement | HTMLElement>, phase: string) {
  return action
    .evaluate((element, phase) => {
      const geometry = (target: Element | null) => {
        if (!target) {
          return null;
        }
        const bounds = target.getBoundingClientRect();
        return { top: bounds.top, bottom: bounds.bottom, height: bounds.height };
      };
      return {
        phase,
        atMs: performance.now(),
        timeOrigin: performance.timeOrigin,
        scrollY: window.scrollY,
        maxScrollY: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        bodyHeight: document.body.getBoundingClientRect().height,
        bodyPosition: document.body.style.position,
        bodyTop: document.body.style.top,
        action: geometry(element),
        article: geometry(element.closest('article')),
        galleryPresent: document.querySelector('[data-xeg-gallery-container]') !== null,
      };
    }, phase)
    .catch(() => ({ phase, unavailable: true as const }));
}

async function waitForRestoredHostState(
  page: Page,
  actionHandle: JSHandle<Node | null>,
  before: HostSnapshot,
  deadline = Date.now() + 3_000
) {
  let state: RestoredHostState;
  do {
    const after = await hostSnapshot(page);
    const focusRestored = await actionHandle
      .evaluate((element) => document.activeElement === element)
      .catch(() => false);
    state = {
      after,
      focusRestored,
      bodyStylesRestored: JSON.stringify(after.bodyStyle) === JSON.stringify(before.bodyStyle),
      scrollRestorationRestored: after.scrollRestoration === before.scrollRestoration,
      scrollRestored: after.scrollY === before.scrollY,
    };
    if (
      state.focusRestored &&
      state.bodyStylesRestored &&
      state.scrollRestorationRestored &&
      state.scrollRestored
    ) {
      return state;
    }
    await page.waitForTimeout(50);
  } while (Date.now() < deadline);
  return state;
}

async function captureScreenshot(page: Page, output: string, filename: string) {
  await page.screenshot({ path: join(output, filename) });
  return filename;
}

async function waitForTarget(page: Page, identity: Identity) {
  const handle = await page.waitForFunction(inspectLiveTargetDocument, identity, {
    timeout: READINESS_TIMEOUT_MS,
    polling: 100,
  });
  try {
    return await handle.jsonValue();
  } finally {
    await handle.dispose();
  }
}

async function observeQuotedVideo(
  page: Page,
  observation: LiveObservation,
  identity: Identity,
  output: string,
  index: string | number,
  settleApi: () => Promise<void>,
  controlledVideoClickMode: string | null,
  verifyBorrowedMode: (() => Promise<void>) | null = null,
  identities: DiagnosticIdentities | null = null,
  actualSiteAcceptance = false
) {
  const target = observation.target;
  if (!target || target.kind !== 'quoted-video') {
    throw new Error('Quoted video target is unavailable');
  }
  const article = page.locator('article').nth(target.articleIndex);
  const surface = quotedVideoSurface(target);
  let clickSurface = article.locator(surface.selector).nth(surface.index);
  await clickSurface.scrollIntoViewIfNeeded({ timeout: ACTION_TIMEOUT_MS });
  if ((await hostSnapshot(page)).scrollY === 0) {
    await page.mouse.wheel(0, 160);
  }
  let hit = await clickSurface.evaluate(inspectHitTestedVideoActionDocument, {
    posterPath: target.posterSource?.path ?? null,
  });
  target.initialHitTest = hit;
  if (
    !hit?.inQuote &&
    hit?.nativePlay &&
    target.videoIndex >= 0 &&
    controlledVideoClickMode !== 'allow-all'
  ) {
    const hostVideo = article.locator('video').nth(target.videoIndex);
    const beforeNative = await hostVideo.evaluate(inspectHostVideoDocument, {
      posterPath: target.posterSource?.path ?? null,
    });
    const confirmation = await clickSurface.evaluate(inspectHitTestedVideoActionDocument, {
      posterPath: target.posterSource?.path ?? null,
    });
    target.nativePlayback = {
      status: 'preflight',
      before: beforeNative,
      confirmation: confirmation
        ? {
            inQuote: confirmation.inQuote,
            nativePlay: confirmation.nativePlay,
            rejectedControls: confirmation.rejectedControls,
          }
        : null,
    };
    if (
      !beforeNative?.poster ||
      !confirmation?.nativePlay ||
      confirmation.nativePlay.mediaScopeDepth > 5
    ) {
      throw new Error('Native quote play action changed before click');
    }
    target.nativePlayback.status = 'attempting';
    target.nativePlayback.action = confirmation.nativePlay;
    target.nativePlayback.pointShift = {
      x: confirmation.nativePlay.x - hit.nativePlay.x,
      y: confirmation.nativePlay.y - hit.nativePlay.y,
    };
    await verifyBorrowedMode?.();
    await page.mouse.click(confirmation.nativePlay.x, confirmation.nativePlay.y);
    target.nativePlayback.galleryOpenedOnControlClick =
      (await page.locator('[data-xeg-gallery-container]').count()) > 0;
    if (target.nativePlayback.galleryOpenedOnControlClick) {
      throw new Error('Native play control unexpectedly opened the gallery');
    }
    await page
      .waitForFunction(
        ({ articleIndex, videoIndex, startTime }) => {
          const article = document.querySelectorAll('article')[articleIndex];
          const video = article?.querySelectorAll('video')[videoIndex];
          return (
            video &&
            !video.error &&
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0 &&
            video.currentTime >= startTime + 0.15
          );
        },
        {
          articleIndex: target.articleIndex,
          videoIndex: target.videoIndex,
          startTime: beforeNative.currentTime,
        },
        { timeout: 8_000, polling: 100 }
      )
      .catch(() => {});
    const afterNative = await hostVideo
      .evaluate(inspectHostVideoDocument, { posterPath: target.posterSource?.path ?? null })
      .catch(() => null);
    target.nativePlayback = {
      ...target.nativePlayback,
      status:
        afterNative &&
        afterNative.readyState >= 2 &&
        afterNative.width > 0 &&
        afterNative.height > 0 &&
        afterNative.mediaErrorCode === null &&
        afterNative.currentTime >= beforeNative.currentTime + 0.15
          ? 'playing'
          : 'unverified',
      after: afterNative,
    };
    if (target.nativePlayback.status !== 'playing') {
      observation.classification = 'host-video-provider-unavailable';
      throw new Error('Native quote video did not play after ordinary control click');
    }
    clickSurface = hostVideo;
    hit = await clickSurface.evaluate(inspectHitTestedVideoActionDocument, {
      posterPath: target.posterSource?.path ?? null,
    });
    target.hitTestAfterNativePlayback = hit;
  }
  const controlledAction =
    controlledVideoClickMode === 'allow-all' && !hit?.inQuote && hit?.nativePlay;
  if (!hit?.inQuote && !controlledAction) {
    if (target.nativePlayback?.status === 'playing') {
      observation.classification = 'native-play-observed-gallery-action-unavailable';
    }
    throw new Error('No non-control quoted video gallery action was hit-tested');
  }
  target.galleryActionKind = controlledAction
    ? 'media-scoped-control-under-allow-all'
    : 'non-control-media-surface';
  const actionHandle = await clickSurface.elementHandle();
  if (!actionHandle) {
    throw new Error('Quoted video detached before interaction');
  }
  let focusHandle: JSHandle<Element | null> | undefined;
  let activationCaptureHandle:
    | JSHandle<ReturnType<typeof captureActivationFocusDocument>>
    | undefined;
  let activationFocusHandle: JSHandle<HTMLElement | null> | undefined;
  let activationHitHandle: JSHandle<Element | null> | undefined;
  try {
    if (controlledAction) {
      const focusHit = await clickSurface.evaluate(inspectHitTestedVideoActionDocument, {
        posterPath: target.posterSource?.path ?? null,
      });
      if (!focusHit?.nativePlay) {
        throw new Error('Controlled quote control changed before focus');
      }
      focusHandle = await actionHandle.evaluateHandle(findHitTestedVideoControlDocument, {
        x: focusHit.nativePlay.x,
        y: focusHit.nativePlay.y,
        posterPath: target.posterSource?.path ?? null,
      });
      if (!focusHandle.asElement()) {
        throw new Error('Controlled quote focus target was not a bounded media button');
      }
      await focusHandle.evaluate((element) => {
        if (element instanceof HTMLElement) {
          element.focus();
        }
      });
    } else {
      focusHandle = await actionHandle.evaluateHandle((element) => {
        const focusable =
          element instanceof HTMLVideoElement && element.controls
            ? element
            : element.closest('a[href], button, [tabindex]');
        if (focusable instanceof HTMLElement) {
          focusable.focus();
        }
        return document.activeElement;
      });
    }
    const before = await hostSnapshot(page);
    const focusPrepared = await focusHandle.evaluate(
      (element) => document.activeElement === element
    );
    const meaningfulFocusTarget = await focusHandle.evaluate(
      (element) => element instanceof HTMLElement && !['BODY', 'HTML'].includes(element.tagName)
    );
    observation.gallery = {
      status: 'attempting',
      before,
      focusPrepared,
      activationFocusCaptured: false,
      activationFocusChanged: false,
      focusTarget: controlledAction
        ? 'bounded-native-video-control'
        : meaningfulFocusTarget
          ? 'native-media-focus'
          : 'body-only',
    };
    if (controlledAction && (!focusPrepared || !meaningfulFocusTarget)) {
      throw new Error('Controlled quote button could not be focused before gallery click');
    }
    observation.screenshots.before = await captureScreenshot(
      page,
      output,
      `live-page-${index}-before.png`
    );
    const finalHit = await clickSurface.evaluate(inspectHitTestedVideoActionDocument, {
      posterPath: target.posterSource?.path ?? null,
    });
    const clickPoint = controlledAction
      ? !finalHit?.inQuote
        ? finalHit?.nativePlay
        : null
      : finalHit?.inQuote
        ? finalHit
        : null;
    observation.gallery.identityBeforeClick = Boolean(clickPoint);
    observation.gallery.hitTestBeforeClick = finalHit;
    if (!observation.gallery.identityBeforeClick) {
      throw new Error('Quoted video hit target changed before click');
    }
    if (!clickPoint || clickPoint.x === null || clickPoint.y === null) {
      throw new Error('Quoted video click coordinates are unavailable');
    }
    const point = { x: clickPoint.x, y: clickPoint.y };
    if (controlledAction) {
      const sameControl = await focusHandle.evaluate((element, point) => {
        const top = document.elementsFromPoint(point.x, point.y)[0];
        return (
          top?.closest('button, [role="button"]') === element && document.activeElement === element
        );
      }, point);
      observation.gallery.focusedControlStillOwnsClick = sameControl;
      if (!sameControl) {
        throw new Error('Focused quote button changed before click');
      }
    }
    const activationSurfaceHandle: ElementHandle<Element> | null = controlledAction
      ? focusHandle.asElement()
      : actionHandle.asElement();
    if (!activationSurfaceHandle) {
      throw new Error('Quoted video activation surface is unavailable');
    }
    activationHitHandle = await activationSurfaceHandle.evaluateHandle(findActivationHitDocument, {
      articleIndex: target.articleIndex,
      point,
    });
    if (!activationHitHandle.asElement()) {
      throw new Error('Quoted-video activation hit changed outside the bounded media surface');
    }
    activationCaptureHandle = await activationHitHandle.evaluateHandle(
      captureActivationFocusDocument,
      {
        articleIndex: target.articleIndex,
        point,
      }
    );
    await verifyBorrowedMode?.();
    await page.mouse.click(point.x, point.y);
    observation.gallery.activationFocusCaptured = await activationCaptureHandle.evaluate(
      (capture) => capture.captured
    );
    if (!observation.gallery.activationFocusCaptured) {
      observation.missingAssertions.push('exactFocusRestored');
      throw new Error('Trusted quoted-video activation focus was not captured');
    }
    activationFocusHandle = await activationCaptureHandle.evaluateHandle(
      (capture) => capture.focus
    );
    observation.gallery.activationFocusChanged = await focusHandle.evaluate(
      (prepared, actual) => prepared !== actual,
      activationFocusHandle
    );
    await activationCaptureHandle.evaluate((capture) => capture.dispose());
    const gallery = page.locator('[data-xeg-gallery-container]');
    const openedGallery = await gallery
      .waitFor({ state: 'visible', timeout: ACTION_TIMEOUT_MS })
      .then(
        () => true,
        () => false
      );
    if (!openedGallery) {
      if (controlledVideoClickMode === 'allow-all') {
        observation.classification = 'controlled-media-click-did-not-open-gallery';
      }
      throw new Error('Quoted video media click did not open the gallery');
    }
    const selectedHandle = await page
      .waitForFunction(
        () => {
          const item = document.querySelector<HTMLVideoElement>(
            '[data-xeg-gallery-container] [data-gallery-element="item"] video'
          );
          return (
            item instanceof HTMLVideoElement &&
            item.readyState >= 2 &&
            item.videoWidth > 0 &&
            item.videoHeight > 0
          );
        },
        null,
        { timeout: ACTION_TIMEOUT_MS, polling: 100 }
      )
      .catch(() => null);
    await selectedHandle?.dispose();
    const opened = (await page.evaluate(inspectSelectedGalleryVideoDocument)) || null;
    const galleryOpenedState = {
      ariaModal: await gallery.getAttribute('aria-modal'),
      role: await gallery.getAttribute('role'),
      selectedVideo: opened,
    };
    observation.gallery.opened = galleryOpenedState;
    observation.screenshots.open = await captureScreenshot(
      page,
      output,
      `live-page-${index}-gallery.png`
    );
    const selectedVideo = gallery
      .locator('[data-gallery-element="item"]')
      .nth(opened?.index ?? 0)
      .locator('video');
    const startTime = opened?.currentTime ?? 0;
    if (opened && opened.readyState >= 2) {
      await page.waitForTimeout(400);
      const inProgress = await page.evaluate(inspectSelectedGalleryVideoDocument);
      if (!inProgress || inProgress.currentTime < startTime + 0.15) {
        await selectedVideo.click({ timeout: ACTION_TIMEOUT_MS }).catch(() => {});
      }
      await page
        .waitForFunction(
          ({ index, start }) => {
            const item = document.querySelectorAll(
              '[data-xeg-gallery-container] [data-gallery-element="item"]'
            )[index];
            const video = item?.querySelector('video');
            return video && !video.error && video.currentTime >= start + 0.15;
          },
          { index: opened.index, start: startTime },
          { timeout: 5_000, polling: 100 }
        )
        .catch(() => {});
    }
    const afterPlayback = (await page.evaluate(inspectSelectedGalleryVideoDocument)) || null;
    if (identities && afterPlayback?.source) {
      const rawSource = await page.evaluate(
        readSelectedCurrentVideoUrlDocument,
        afterPlayback.index
      );
      const full = fullVideoUrlIdentity(rawSource);
      if (
        full?.source.host === afterPlayback.source.host &&
        full.source.path === afterPlayback.source.path
      ) {
        identities.selectedVideo = { source: full.source, rawUrl: full.rawUrl };
      }
    }
    const playback = {
      startTime,
      endTime: afterPlayback?.currentTime ?? null,
      progressed: Boolean(afterPlayback && afterPlayback.currentTime >= startTime + 0.15),
    };
    observation.gallery.playback = playback;
    await settleApi();
    const directOwnerCandidate =
      target.quoteBoundary === 'unmarked-candidate' && target.quoteStatusIds.length === 0;
    const owner = directOwnerCandidate
      ? directOwnerForSource(
          observation.api.observations,
          identity.statusId,
          afterPlayback?.source,
          target
        )
      : quotedOwnerForSource(
          observation.api.observations,
          identity.statusId,
          afterPlayback?.source
        );
    observation.gallery.owner = owner;
    if (actualSiteAcceptance) {
      observation.actualSiteVideoNavigation = await observeActualSiteVideoNavigation(page);
      if (observation.actualSiteVideoNavigation.status === 'failed') {
        throw new Error(
          `Actual-site video navigation failed: ${observation.actualSiteVideoNavigation.error ?? 'unknown'}`
        );
      }
    }
    await page.keyboard.press('Escape');
    const detached = await gallery.waitFor({ state: 'detached', timeout: ACTION_TIMEOUT_MS }).then(
      () => true,
      () => false
    );
    const restored = await waitForRestoredHostState(page, activationFocusHandle, before);
    observation.gallery = {
      ...observation.gallery,
      status: 'observed',
      closeMethod: 'Escape',
      detached,
      focusRestored: restored.focusRestored,
      after: restored.after,
      bodyStylesRestored: restored.bodyStylesRestored,
      scrollRestorationRestored: restored.scrollRestorationRestored,
      scrollRestored: restored.scrollRestored,
    };
    const video = galleryOpenedState.selectedVideo;
    const finalUrl = new URL(page.url());
    const required = {
      exactFinalStatus:
        ['x.com', 'twitter.com'].includes(finalUrl.hostname.toLowerCase()) &&
        finalUrl.pathname.toLowerCase() ===
          `/${identity.handle}/status/${identity.statusId}`.toLowerCase(),
      quotedVideoHitTest: quotedVideoHitTestPassed({
        controlledVideoClickMode,
        galleryActionKind: target.galleryActionKind,
        initialHit: hit,
        finalHit,
        identityBeforeClick: Boolean(clickPoint),
        focusPrepared,
        meaningfulFocusTarget,
        focusedControlStillOwnsClick: observation.gallery.focusedControlStillOwnsClick,
      }),
      galleryDialog:
        galleryOpenedState.role === 'dialog' && galleryOpenedState.ariaModal === 'true',
      selectedPlayableVideo: Boolean(
        video?.visible &&
        video.itemLoaded &&
        video.readyState >= 2 &&
        video.width > 0 &&
        video.height > 0 &&
        video.mediaErrorCode === null
      ),
      ...(directOwnerCandidate
        ? {
            directStatusOwner:
              owner.status === 'matched-direct-owner-variant' &&
              owner.ownerId === identity.statusId,
          }
        : {
            directQuotedOwner:
              owner.status === 'matched-direct-quote-variant' &&
              (target.quoteStatusIds.length === 0 ||
                (typeof owner.ownerId === 'string' &&
                  target.quoteStatusIds.includes(owner.ownerId))),
          }),
      playbackProgress: playback.progressed,
      escapeClosed: detached,
      exactFocusRestored:
        meaningfulFocusTarget &&
        focusPrepared &&
        observation.gallery.activationFocusCaptured === true &&
        restored.focusRestored,
      scrollRestored: restored.scrollRestored,
      scrollRestorationRestored: restored.scrollRestorationRestored,
      bodyStylesRestored: restored.bodyStylesRestored,
      noProductErrors:
        observation.productErrors.length === 0 && observation.productErrorOverflow === 0,
      noPageErrors: observation.pageErrors.length === 0 && observation.pageErrorOverflow === 0,
    };
    observation.requiredAssertions = required;
    observation.missingAssertions = Object.entries(required)
      .filter(([, passed]) => !passed)
      .map(([name]) => name);
    observation.screenshots.after = await captureScreenshot(
      page,
      output,
      `live-page-${index}-after.png`
    );
    if (refreshQuotedVideoErrorAssertions(observation).length) {
      throw new Error(
        `Missing live quoted-video assertions: ${observation.missingAssertions.join(', ')}`
      );
    }
  } finally {
    await activationCaptureHandle?.evaluate((capture) => capture.dispose()).catch(() => {});
    await activationFocusHandle?.dispose().catch(() => {});
    await activationCaptureHandle?.dispose().catch(() => {});
    await activationHitHandle?.dispose().catch(() => {});
    await focusHandle?.dispose().catch(() => {});
    await actionHandle.dispose().catch(() => {});
  }
}

function photoIndexFromActionPath(path: string) {
  const match = path.match(/\/photo\/([1-9]\d*)$/u);
  const value = Number(match?.[1]);
  if (!Number.isSafeInteger(value)) {
    throw new Error('Selected media action has no safe photo index');
  }
  return value;
}

async function observeNativePreviewPhoto(
  page: Page,
  observation: LiveObservation,
  identity: Identity,
  target: NativePreviewTarget,
  output: string,
  index: string | number,
  settleApi: () => Promise<void>,
  verifyBorrowedMode: (() => Promise<void>) | null = null
) {
  const article = page.locator('article').nth(target.articleIndex);
  const action = article.locator('a[href]').nth(target.actionIndex);
  await action.scrollIntoViewIfNeeded({ timeout: ACTION_TIMEOUT_MS });
  if (!(await inspectHitTestedNativePreviewAction(action, identity, target))) {
    throw new Error('Native preview action was not the owned top hit');
  }
  const actionHandle = await action.elementHandle();
  if (!actionHandle) {
    throw new Error('Native preview action detached before interaction');
  }
  try {
    await action.focus({ timeout: ACTION_TIMEOUT_MS });
    if ((await hostSnapshot(page)).scrollY === 0) {
      await page.mouse.wheel(0, 160);
      await page.waitForFunction(() => window.scrollY > 0, null, {
        timeout: ACTION_TIMEOUT_MS,
      });
    }
    await action.focus({ timeout: ACTION_TIMEOUT_MS });
    const before = await hostSnapshot(page);
    const focusPrepared = await actionHandle.evaluate(
      (element) => document.activeElement === element
    );
    observation.gallery = { status: 'attempting', before, focusPrepared };
    observation.screenshots.before = await captureScreenshot(
      page,
      output,
      `live-page-${index}-before.png`
    );
    const identityBeforeClick = await inspectHitTestedNativePreviewAction(action, identity, target);
    observation.gallery.identityBeforeClick = identityBeforeClick;
    if (!identityBeforeClick) {
      throw new Error('Native preview action identity changed before click');
    }
    await verifyBorrowedMode?.();
    await actionHandle.click({ timeout: ACTION_TIMEOUT_MS });
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT_MS });

    const expectedOwnerPath = `/${target.ownerHandle}/status/${target.ownerStatusId}`;
    const deadline = Date.now() + ACTION_TIMEOUT_MS;
    do {
      await settleApi();
      if (
        observation.api.observations.some(
          (item) =>
            item.operation === 'TweetResultByRestId' &&
            item.requestedTweetId === target.ownerStatusId
        )
      ) {
        break;
      }
      await page.waitForTimeout(100);
    } while (Date.now() < deadline);
    let evidence = summarizeNativePreviewEvidence(
      observation.api,
      target.ownerStatusId,
      target.photoNumber,
      null,
      null,
      expectedOwnerPath
    );
    const selectedGalleryHandle =
      evidence.providerConfirmed && evidence.source
        ? await page
            .waitForFunction(
              inspectSelectedGalleryDocument,
              { expectedIndex: target.photoNumber, expectedPath: evidence.source.path },
              { timeout: ACTION_TIMEOUT_MS, polling: 100 }
            )
            .catch(() => null)
        : null;
    const selectedGallery = selectedGalleryHandle ? await selectedGalleryHandle.jsonValue() : null;
    await selectedGalleryHandle?.dispose();

    const ownerButton = gallery.locator('#tweet-text-button');
    if ((await ownerButton.count()) === 1) {
      await ownerButton.click({ timeout: ACTION_TIMEOUT_MS });
    }
    const ownerPath = await page.evaluate(inspectNativePreviewOwnerDocument);
    observation.gallery.opened = {
      ariaModal: await gallery.getAttribute('aria-modal'),
      selectedGallery,
      role: await gallery.getAttribute('role'),
    };
    observation.gallery.ownerPath = ownerPath;
    observation.screenshots.open = await captureScreenshot(
      page,
      output,
      `live-page-${index}-gallery.png`
    );
    await page.keyboard.press('Escape');
    const detached = await gallery.waitFor({ state: 'detached', timeout: ACTION_TIMEOUT_MS }).then(
      () => true,
      () => false
    );
    const restored = await waitForRestoredHostState(page, actionHandle, before);
    observation.gallery = {
      ...observation.gallery,
      status: 'observed',
      closeMethod: 'Escape',
      detached,
      focusRestored: restored.focusRestored,
      after: restored.after,
      bodyStylesRestored: restored.bodyStylesRestored,
      scrollRestorationRestored: restored.scrollRestorationRestored,
      scrollRestored: restored.scrollRestored,
    };
    observation.screenshots.after = await captureScreenshot(
      page,
      output,
      `live-page-${index}-after.png`
    );
    await page.waitForTimeout(100);
    await settleApi();
    evidence = summarizeNativePreviewEvidence(
      observation.api,
      target.ownerStatusId,
      target.photoNumber,
      selectedGallery,
      ownerPath,
      expectedOwnerPath
    );
    if (evidence.providerRejection) {
      observation.providerRejection = evidence.providerRejection;
      observation.classification = 'provider-rejection-observed-gallery-unverified';
    }
    const finalUrl = new URL(page.url());
    const required = {
      exactFinalStatus:
        ['x.com', 'twitter.com'].includes(finalUrl.hostname.toLowerCase()) &&
        finalUrl.pathname.toLowerCase() ===
          `/${identity.handle}/status/${identity.statusId}`.toLowerCase(),
      extensionInjected: observation.extension.readinessMarker === true,
      nativePreviewAction: identityBeforeClick,
      galleryDialog:
        observation.gallery.opened?.role === 'dialog' &&
        observation.gallery.opened.ariaModal === 'true',
      exactCProviderPhoto: evidence.providerConfirmed,
      selectedCPhoto: evidence.selectedConfirmed,
      canonicalCOwner: evidence.ownerConfirmed,
      escapeClosed: detached,
      exactFocusRestored: restored.focusRestored,
      nonzeroScrollPrepared: before.scrollY > 0,
      scrollRestored: restored.scrollRestored,
      scrollRestorationRestored: restored.scrollRestorationRestored,
      bodyStylesRestored: restored.bodyStylesRestored,
      noProductErrors:
        observation.productErrors.length === 0 && observation.productErrorOverflow === 0,
      noPageErrors: observation.pageErrors.length === 0 && observation.pageErrorOverflow === 0,
    };
    observation.requiredAssertions = required;
    observation.missingAssertions = Object.entries(required)
      .filter(([, passed]) => !passed)
      .map(([name]) => name);
    if (observation.missingAssertions.length) {
      throw new Error(
        `Missing native-preview assertions: ${observation.missingAssertions.join(', ')}`
      );
    }
    observation.evidenceStatus =
      observation.hostDiagnostics.length || observation.hostDiagnosticOverflow > 0
        ? 'unverified'
        : 'observed';
  } finally {
    await actionHandle.dispose().catch(() => {});
  }
}

export async function closeObservedLivePage(page: Pick<Page, 'close'>, strict: boolean) {
  if (strict) {
    await page.close();
  } else {
    await page.close().catch(() => {});
  }
}

async function observeOne(
  context: BrowserContext,
  extensionId: string,
  targetUrl: string,
  output: string,
  index: string | number,
  controlledVideoClickMode: string | null = null,
  verifyControlledMode: (() => Promise<string | null>) | null = null,
  borrowedExtensionPage: Page | null = null,
  expectedCsp: HostCspFingerprint[] | null = null,
  actualSiteAcceptance: {
    downloads: string;
    navigationUrl: string | null;
    runMultiImage: boolean;
  } | null = null,
  strictPageClose = false
) {
  const identity = targetIdentity(targetUrl);
  const page = await context.newPage();
  const observation: LiveObservation = {
    schemaVersion: 2,
    kind: 'public-x-status-observation',
    requestedUrl: targetUrl,
    finalUrl: null,
    responseStatus: null,
    extension: { id: extensionId, readinessMarker: null },
    videoClickMode: borrowedExtensionPage ? 'unverified' : (controlledVideoClickMode ?? 'default'),
    target: null,
    gallery: { status: 'not-run' },
    api: { tweetResultByRestId: { requests: 0, responses: [] }, observations: [], overflow: 0 },
    productErrors: [],
    productErrorOverflow: 0,
    pageErrors: [],
    pageErrorOverflow: 0,
    hostDiagnostics: [],
    hostDiagnosticOverflow: 0,
    screenshots: {},
    missingAssertions: [],
    evidenceStatus: 'unverified',
    status: 'pending',
  };
  let borrowedMode: BorrowedVideoClickMode | null = null;
  const identities: DiagnosticIdentities | null = expectedCsp
    ? {
        selectedVideo: null,
        apiVariants: [],
        apiVariantOverflow: false,
        requestUrls: [],
        requestUrlOverflow: false,
      }
    : null;
  const verifyBorrowedMode = borrowedExtensionPage
    ? async () => {
        const finalUrl = new URL(page.url());
        if (
          !['x.com', 'twitter.com'].includes(finalUrl.hostname.toLowerCase()) ||
          finalUrl.pathname.toLowerCase() !==
            `/${identity.handle}/status/${identity.statusId}`.toLowerCase()
        ) {
          throw new Error('Borrowed page left the requested X status origin');
        }
        const current = await readBorrowedVideoClickMode(borrowedExtensionPage, page);
        if (
          borrowedMode &&
          (current.mode !== borrowedMode.mode || current.source !== borrowedMode.source)
        ) {
          throw new Error('Borrowed effective video click mode changed during observation');
        }
        borrowedMode ??= current;
        observation.videoClickMode = borrowedMode.mode;
        observation.extension.videoClickModeSource = borrowedMode.source;
      }
    : null;
  const settleApi = attachDiagnostics(page, observation, identities);
  let actionHandle: ElementHandle<SVGElement | HTMLElement> | null | undefined;
  let imageHandle: ElementHandle<HTMLImageElement> | null = null;
  let imageOwnerHandle: ElementHandle<HTMLElement> | null = null;
  try {
    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    observation.responseStatus = response?.status() ?? null;
    observation.finalUrl = sanitizedUrl(page.url());
    await verifyBorrowedMode?.();
    observation.extension.readinessMarkerAtNavigation =
      (await page.locator('html[data-xeg-gallery-ready="true"]').count()) === 1;
    observation.targetCandidatesBefore = await page
      .evaluate(inspectLiveCandidateDocument, identity)
      .catch(() => null);
    let readiness: LiveReadiness;
    try {
      readiness = await waitForTarget(page, identity);
    } catch (error) {
      observation.missingAssertions.push('targetMediaReady');
      observation.classification = 'quote-unavailable-or-page-blocked';
      observation.extension.readinessMarker =
        (await page.locator('html[data-xeg-gallery-ready="true"]').count()) === 1;
      observation.targetCandidates = await page
        .evaluate(inspectLiveCandidateDocument, identity)
        .catch(() => null);
      throw error;
    }
    if (!readiness) {
      throw new Error('Live target did not become ready');
    }
    if (readiness.state !== 'ready') {
      observation.missingAssertions.push('targetMediaReady');
      observation.classification = 'provider-or-page-unavailable';
      throw new Error(`Live target stopped before media readiness: ${readiness.reason}`);
    }
    const mixedPhotoEntry =
      actualSiteAcceptance !== null &&
      readiness.target.kind === 'quoted-video' &&
      readiness.target.quoteBoundary === 'unmarked-candidate' &&
      readiness.target.quoteStatusIds.length === 0;
    const mixedVideoTarget = mixedPhotoEntry ? readiness.target : null;
    const photoReadiness = mixedPhotoEntry
      ? await page.evaluate(inspectLiveTargetDocument, { ...identity, preferOwnedPhoto: true })
      : false;
    observation.target =
      photoReadiness && photoReadiness.state === 'ready' && photoReadiness.target.kind === 'image'
        ? photoReadiness.target
        : readiness.target;
    const enteredMixedViaPhoto = mixedPhotoEntry && observation.target.kind === 'image';
    observation.targetCandidates = await page
      .evaluate(inspectLiveCandidateDocument, identity)
      .catch(() => null);
    await page
      .locator('html[data-xeg-gallery-ready="true"]')
      .waitFor({
        state: 'attached',
        timeout: ACTION_TIMEOUT_MS,
      })
      .catch(() => {});
    observation.extension.readinessMarker =
      (await page.locator('html[data-xeg-gallery-ready="true"]').count()) === 1;
    if (!observation.extension.readinessMarker) {
      observation.missingAssertions.push('extensionInjected');
      throw new Error('Installed extension readiness marker was not observed');
    }
    if (controlledVideoClickMode === 'allow-all' && !borrowedExtensionPage) {
      observation.extension.storedModeAfterReadiness = (await verifyControlledMode?.()) ?? null;
      if (observation.extension.storedModeAfterReadiness !== 'allow-all') {
        throw new Error('Controlled video click mode was not observed after live-page readiness');
      }
    }
    if (borrowedExtensionPage) {
      await verifyBorrowedMode?.();
      observation.extension.storedModeAfterReadiness = observation.videoClickMode;
    }

    if (observation.target.kind === 'quoted-video') {
      await observeQuotedVideo(
        page,
        observation,
        identity,
        output,
        index,
        settleApi,
        controlledVideoClickMode ??
          (observation.videoClickMode === 'allow-all' ? 'allow-all' : null),
        verifyBorrowedMode,
        identities,
        actualSiteAcceptance !== null
      );
      await settleApi();
      if (refreshQuotedVideoErrorAssertions(observation).length) {
        throw new Error(
          `Missing live quoted-video assertions: ${observation.missingAssertions.join(', ')}`
        );
      }
      observation.status = 'core-flow-observed';
      return observation;
    }

    if (observation.target.kind === 'native-preview-photo') {
      await verifyBorrowedMode?.();
      await observeNativePreviewPhoto(
        page,
        observation,
        identity,
        observation.target,
        output,
        index,
        settleApi,
        verifyBorrowedMode
      );
      observation.status = 'core-flow-observed';
      return observation;
    }

    const imageReference = await page
      .waitForFunction(
        resolveLiveImageDocument,
        { identity, target: observation.target },
        { timeout: ACTION_TIMEOUT_MS, polling: 100 }
      )
      .catch(() => null);
    if (!imageReference) {
      const diagnostic = await page
        .evaluate(
          ({ identity, target }) => {
            const expected = `/${identity.handle}/status/${identity.statusId}`.toLowerCase();
            const matches = [...document.querySelectorAll<HTMLImageElement>('article img')].filter(
              (image) => {
                try {
                  const source = new URL(image.currentSrc || image.src);
                  return (
                    source.hostname.toLowerCase() === target.imageSource.host &&
                    source.pathname === target.imageSource.path
                  );
                } catch {
                  return false;
                }
              }
            );
            return {
              sameSourceImages: matches.slice(0, 12).map((image) => {
                const article = image.closest('article');
                return {
                  articleIndex: article
                    ? [...document.querySelectorAll('article')].indexOf(article)
                    : -1,
                  nearestArticleOwnsStatus: Boolean(
                    article &&
                    [...article.querySelectorAll<HTMLAnchorElement>('a[href]')].some((anchor) => {
                      try {
                        return (
                          anchor.closest('article') === article &&
                          new URL(anchor.href, location.href).pathname.toLowerCase() === expected
                        );
                      } catch {
                        return false;
                      }
                    })
                  ),
                  complete: image.complete,
                  naturalWidth: image.naturalWidth,
                };
              }),
              sameSourceOverflow: matches.length > 12,
            };
          },
          { identity, target: observation.target }
        )
        .catch(() => ({ sameSourceImages: [], sameSourceOverflow: false }));
      observation.imageBinding = {
        status: 'timeout',
        timeoutMs: ACTION_TIMEOUT_MS,
        ...diagnostic,
      };
      throw new Error('Requested image source and owner were not uniquely bound before timeout');
    }
    observation.imageBinding = { status: 'bound', timeoutMs: ACTION_TIMEOUT_MS };
    const image = imageReference.asElement() as ElementHandle<HTMLImageElement> | null;
    if (!image) {
      await imageReference.dispose();
      throw new Error('Requested image source and owner were not uniquely bound');
    }
    imageHandle = image;
    const ownerReference = await image.evaluateHandle((element) => element.closest('article'));
    imageOwnerHandle = ownerReference.asElement() as ElementHandle<HTMLElement> | null;
    if (!imageOwnerHandle) {
      await ownerReference.dispose();
      throw new Error('Requested image owner detached before interaction');
    }
    await image.scrollIntoViewIfNeeded({ timeout: ACTION_TIMEOUT_MS });
    if (!(await image.evaluate(isBoundLiveImageOwnerDocument, imageOwnerHandle))) {
      throw new Error('Requested image moved to a different article');
    }
    const actionIdentity = await inspectHitTestedAction(image, identity, observation.target);
    if (!actionIdentity) {
      throw new Error('No owned top media action was found by hit test');
    }
    const compactQuote = observation.target.quoteBoundary === 'compact-two-level';
    const selectedPhotoIndex = compactQuote
      ? null
      : photoIndexFromActionPath(actionIdentity.actionPath);
    observation.target = {
      ...observation.target,
      ...actionIdentity,
      ...(selectedPhotoIndex === null ? {} : { selectedPhotoIndex }),
    };
    const actionReference = await image.evaluateHandle(resolveLiveImageActionDocument, {
      actionIndex: actionIdentity.actionIndex,
      compactQuote,
    });
    actionHandle = actionReference.asElement() as ElementHandle<HTMLAnchorElement> | null;
    if (!actionHandle) {
      await actionReference.dispose();
      throw new Error('Selected target action detached before interaction');
    }
    await actionHandle.focus();
    if ((await hostSnapshot(page)).scrollY === 0) {
      await page.mouse.wheel(0, 160);
      await page.waitForFunction(() => window.scrollY > 0, null, {
        timeout: ACTION_TIMEOUT_MS,
      });
    }
    await actionHandle.focus();
    const before = await hostSnapshot(page);
    const focusPrepared = await actionHandle.evaluate(
      (element) => document.activeElement === element
    );
    observation.gallery = { status: 'attempting', before, focusPrepared, hostTimeline: [] };
    const recordHostGeometry = async (phase: string) => {
      const timeline = observation.gallery.hostTimeline;
      if (!timeline || timeline.length >= 8 || !actionHandle) {
        throw new Error('Live host geometry observation exceeded its bounded action lifetime');
      }
      timeline.push(await captureHostGeometry(actionHandle, phase));
    };
    await recordHostGeometry('prepared');
    observation.screenshots.before = await captureScreenshot(
      page,
      output,
      `live-page-${index}-before.png`
    );

    const refreshedAction = await inspectHitTestedAction(image, identity, observation.target);
    if (
      !refreshedAction ||
      refreshedAction.actionIndex !== actionIdentity.actionIndex ||
      refreshedAction.actionPath !== actionIdentity.actionPath
    ) {
      throw new Error('Selected image owner or action changed before click');
    }

    const identityBeforeClick = await actionHandle.evaluate(
      (element, expected) => {
        const article = element.closest('article');
        const image = expected.image;
        if (
          !(element instanceof HTMLAnchorElement) ||
          !article ||
          !(image instanceof HTMLImageElement) ||
          !image.isConnected ||
          !(expected.imageOwner instanceof HTMLElement) ||
          image.closest('article') !== expected.imageOwner ||
          image.closest('article') !== article
        ) {
          return false;
        }
        try {
          const source = new URL(image.currentSrc || image.src);
          if (
            source.protocol !== 'https:' ||
            source.hostname.toLowerCase() !== expected.imageSource.host ||
            source.pathname !== expected.imageSource.path
          ) {
            return false;
          }
        } catch {
          return false;
        }
        const rectangle = element.getBoundingClientRect();
        const x = Math.max(0, Math.min(innerWidth - 1, rectangle.left + rectangle.width / 2));
        const y = Math.max(0, Math.min(innerHeight - 1, rectangle.top + rectangle.height / 2));
        const topAction = document
          .elementsFromPoint(x, y)
          .map((candidate) => candidate.closest('a[href]'))
          .find(Boolean);
        return (
          topAction === element &&
          element.closest('article') === article &&
          new URL(element.href, location.href).pathname === expected.actionPath
        );
      },
      {
        actionPath: observation.target.actionPath,
        image,
        imageOwner: imageOwnerHandle,
        imageSource: observation.target.imageSource,
      }
    );
    observation.gallery.identityBeforeClick = identityBeforeClick;
    if (!identityBeforeClick) {
      throw new Error('Top media action identity changed before click');
    }

    await recordHostGeometry('before-click');
    await verifyBorrowedMode?.();
    await actionHandle.click({ timeout: ACTION_TIMEOUT_MS });
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT_MS });
    const galleryItemCount = await gallery.locator('[data-gallery-element="item"]').count();
    const eligibleImageGalleryCount = await gallery.evaluate(eligibleLiveImageGalleryCountDocument);
    await recordHostGeometry('opened');
    const selectedGalleryHandle = await page
      .waitForFunction(
        inspectSelectedGalleryDocument,
        {
          expectedIndex: selectedPhotoIndex,
          expectedPath: observation.target.imageSource.path,
          allowPhotoFormatVariant: compactQuote,
        },
        {
          timeout: ACTION_TIMEOUT_MS,
          polling: 100,
        }
      )
      .catch(() => null);
    const selectedGallery = selectedGalleryHandle ? await selectedGalleryHandle.jsonValue() : null;
    await selectedGalleryHandle?.dispose();
    observation.gallery.opened = {
      ariaModal: await gallery.getAttribute('aria-modal'),
      selectedGallery,
      role: await gallery.getAttribute('role'),
    };
    observation.screenshots.open = await captureScreenshot(
      page,
      output,
      `live-page-${index}-gallery.png`
    );

    if (enteredMixedViaPhoto && mixedVideoTarget?.kind === 'quoted-video') {
      observation.actualSiteVideoNavigation = await observeActualSiteVideoNavigation(
        page,
        'owned-photo'
      );
      if (observation.actualSiteVideoNavigation.status !== 'observed') {
        throw new Error(
          `Actual-site photo-to-video navigation was unverified: ${observation.actualSiteVideoNavigation.error ?? 'unknown'}`
        );
      }
      await settleApi();
      observation.gallery.owner = directOwnerForSource(
        observation.api.observations,
        identity.statusId,
        observation.actualSiteVideoNavigation.neighbor?.source,
        mixedVideoTarget
      );
    }

    await recordHostGeometry('before-Escape');
    await page.keyboard.press('Escape');
    const detached = await gallery.waitFor({ state: 'detached', timeout: ACTION_TIMEOUT_MS }).then(
      () => true,
      () => false
    );
    const restorationDeadline = Date.now() + 3_000;
    await recordHostGeometry('closed');
    const restored = await waitForRestoredHostState(
      page,
      actionHandle,
      before,
      restorationDeadline
    );
    await recordHostGeometry('after-restoration-wait');
    await page.waitForTimeout(50);
    await recordHostGeometry('after-decision-50ms');
    await page.waitForTimeout(200);
    await recordHostGeometry('after-decision-250ms');
    const { after, focusRestored } = restored;
    observation.gallery = {
      ...observation.gallery,
      status: 'observed',
      closeMethod: 'Escape',
      detached,
      focusRestored,
      after,
      bodyStylesRestored: restored.bodyStylesRestored,
      scrollRestorationRestored: restored.scrollRestorationRestored,
      scrollRestored: restored.scrollRestored,
    };
    observation.screenshots.after = await captureScreenshot(
      page,
      output,
      `live-page-${index}-after.png`
    );
    await page.waitForTimeout(100);
    await settleApi();
    const compactEvidence =
      compactQuote && observation.target.ownerStatusId
        ? summarizeCompactImageEvidence(
            observation.api,
            observation.target.ownerStatusId,
            observation.target.imageSource.path,
            selectedGallery ? selectedGallery.itemIndex : null
          )
        : null;
    if (compactEvidence?.providerRejection) {
      observation.providerRejection = compactEvidence.providerRejection;
    }

    const finalUrl = new URL(page.url());
    const finalPath = finalUrl.pathname.toLowerCase();
    const expectedPath = `/${identity.handle}/status/${identity.statusId}`.toLowerCase();
    const required = {
      exactFinalStatus:
        ['x.com', 'twitter.com'].includes(finalUrl.hostname.toLowerCase()) &&
        finalPath === expectedPath,
      extensionInjected: observation.extension.readinessMarker === true,
      loadedTargetImage: observation.target.imageLoaded && observation.target.imageVisible,
      topActionIdentity: identityBeforeClick,
      galleryDialog:
        observation.gallery.opened?.role === 'dialog' &&
        observation.gallery.opened.ariaModal === 'true',
      galleryHostImage: observation.gallery.opened?.selectedGallery != null,
      ...(enteredMixedViaPhoto
        ? {
            mixedVideoNavigation: observation.actualSiteVideoNavigation?.status === 'observed',
            directStatusVideoOwner:
              observation.gallery.owner?.status === 'matched-direct-owner-variant' &&
              observation.gallery.owner.ownerId === identity.statusId,
          }
        : {}),
      ...(compactQuote
        ? { compactProviderOwnership: compactEvidence?.providerConfirmed === true }
        : {}),
      escapeClosed: detached,
      exactFocusRestored: focusRestored,
      nonzeroScrollPrepared: before.scrollY > 0,
      scrollRestored: after.scrollY === before.scrollY,
      scrollRestorationRestored: after.scrollRestoration === before.scrollRestoration,
      bodyStylesRestored: JSON.stringify(after.bodyStyle) === JSON.stringify(before.bodyStyle),
      noProductErrors:
        observation.productErrors.length === 0 && observation.productErrorOverflow === 0,
      noPageErrors: observation.pageErrors.length === 0 && observation.pageErrorOverflow === 0,
    };
    observation.requiredAssertions = required;
    observation.missingAssertions = Object.entries(required)
      .filter(([, passed]) => !passed)
      .map(([name]) => name);
    const requiredProductAssertions = observation.missingAssertions.filter(
      (name) => name !== 'compactProviderOwnership'
    );
    if (requiredProductAssertions.length) {
      throw new Error(`Missing live assertions: ${observation.missingAssertions.join(', ')}`);
    }
    if (actualSiteAcceptance?.runMultiImage && !compactQuote && eligibleImageGalleryCount >= 2) {
      observation.actualSiteAcceptance = await runActualSiteAcceptance({
        context,
        page,
        action: actionHandle as ElementHandle<HTMLAnchorElement>,
        image,
        imageOwner: imageOwnerHandle as ElementHandle<HTMLElement>,
        target: observation.target,
        actionPath: actionIdentity.actionPath,
        extensionId,
        targetUrl,
        navigationUrl: actualSiteAcceptance.navigationUrl,
        downloads: actualSiteAcceptance.downloads,
        output,
        index,
        readSettings: readStoredVideoSettings,
        restoreSettings: restoreStoredVideoSettings,
        readProviderObservations: async () => {
          await settleApi();
          return observation.api.observations;
        },
      });
      await settleApi();
      if (observation.actualSiteAcceptance.status !== 'observed') {
        throw new Error(
          `Actual-site acceptance failed: ${observation.actualSiteAcceptance.error ?? 'unknown'}`
        );
      }
      if (
        observation.productErrors.length ||
        observation.productErrorOverflow ||
        observation.pageErrors.length ||
        observation.pageErrorOverflow
      ) {
        throw new Error('Actual-site acceptance introduced console or page errors');
      }
    }
    if (actualSiteAcceptance && !compactQuote && galleryItemCount === 1) {
      observation.sameDocumentPostNavigationAfterClose =
        await observeSameDocumentPostNavigationAfterClose({
          page,
          image,
          targetUrl,
        });
      await settleApi();
      if (observation.sameDocumentPostNavigationAfterClose.status === 'failed') {
        throw new Error(
          `Actual-site post-close same-document navigation failed: ${observation.sameDocumentPostNavigationAfterClose.reason ?? 'unknown'}`
        );
      }
      if (
        observation.productErrors.length ||
        observation.productErrorOverflow ||
        observation.pageErrors.length ||
        observation.pageErrorOverflow
      ) {
        throw new Error('Actual-site post-close navigation introduced console or page errors');
      }
    }
    observation.status = 'core-flow-observed';
    observation.evidenceStatus =
      observation.hostDiagnostics.length ||
      observation.hostDiagnosticOverflow > 0 ||
      (compactQuote && !compactEvidence?.providerConfirmed)
        ? 'unverified'
        : 'observed';
    if (compactQuote && !compactEvidence?.providerConfirmed) {
      observation.classification = compactEvidence?.providerRejection
        ? 'provider-rejection-observed-gallery-unverified'
        : 'compact-quote-provider-ownership-unverified';
    }
  } catch (error) {
    observation.status = 'failed';
    observation.evidenceStatus = 'unverified';
    observation.error = safeError(error);
    await settleApi();
    const providerRejection = summarizeQuoteProviderRejection(observation.api);
    if (providerRejection) {
      observation.providerRejection = providerRejection;
    }
    observation.classification = classifyLiveFailure(
      observation.classification,
      observation.gallery.status,
      providerRejection
    );
    const errorScreenshot = `live-page-${index}-error.png`;
    if (
      await page.screenshot({ path: join(output, errorScreenshot) }).then(
        () => true,
        () => false
      )
    ) {
      observation.screenshots.error = errorScreenshot;
    }
  } finally {
    await settleApi();
    if (
      observation.target?.kind === 'quoted-video' &&
      observation.status === 'core-flow-observed'
    ) {
      if (refreshQuotedVideoErrorAssertions(observation).length) {
        observation.status = 'failed';
        observation.evidenceStatus = 'unverified';
        observation.error = `Missing live quoted-video assertions: ${observation.missingAssertions.join(', ')}`;
        observation.classification = classifyLiveFailure(
          observation.classification,
          observation.gallery.status,
          summarizeQuoteProviderRejection(observation.api)
        );
      } else {
        Object.assign(
          observation,
          classifyLiveHostDiagnostics(
            observation,
            expectedCsp && identities ? { expectedCsp, identities } : null
          )
        );
      }
    }
    if (
      observation.target?.kind === 'native-preview-photo' &&
      observation.status === 'core-flow-observed'
    ) {
      refreshNativePreviewObservation(observation);
    }
    if (
      expectedCsp &&
      identities &&
      observation.status === 'core-flow-observed' &&
      observation.target?.kind !== 'quoted-video'
    ) {
      Object.assign(
        observation,
        classifyLiveHostDiagnostics(observation, { expectedCsp, identities })
      );
    }
    if (actionHandle) {
      await actionHandle.dispose().catch(() => {});
    }
    if (imageHandle) {
      await imageHandle.dispose().catch(() => {});
    }
    if (imageOwnerHandle) {
      await imageOwnerHandle.dispose().catch(() => {});
    }
    observation.finalUrl = sanitizedUrl(page.url());
    try {
      await writeFile(
        join(output, `live-page-${index}.json`),
        JSON.stringify(observation, null, 2)
      );
    } finally {
      try {
        const requireClose = borrowedExtensionPage !== null || strictPageClose;
        try {
          await closeObservedLivePage(page, requireClose);
          if (requireClose) {
            observation.cleanup = { pageClosed: true };
          }
        } catch (error) {
          const message = `Task-owned live page close failed: ${safeError(error)}`;
          observation.cleanup = { pageClosed: false, pageCloseError: message };
          observation.status = 'failed';
          observation.evidenceStatus = 'unverified';
          observation.error = observation.error ? `${observation.error}; ${message}` : message;
        }
        if (requireClose) {
          await writeFile(
            join(output, `live-page-${index}.json`),
            JSON.stringify(observation, null, 2)
          );
        }
      } finally {
        if (identities) {
          identities.selectedVideo = null;
          identities.apiVariants.length = 0;
          identities.requestUrls.length = 0;
        }
      }
    }
  }
  return observation;
}

function decodeStoredRecord(
  raw: unknown
): { value: unknown; updatedAt: number | undefined } | null {
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (
    isRecord(parsed) &&
    parsed.__xegStorageEnvelope === 1 &&
    typeof parsed.updatedAt === 'number' &&
    Object.hasOwn(parsed, 'value')
  ) {
    return { value: parsed.value, updatedAt: parsed.updatedAt };
  }
  return { value: parsed, updatedAt: undefined };
}

export function decodeStoredValue(raw: unknown): unknown {
  const decoded = decodeStoredRecord(raw);
  return decoded ? decoded.value : null;
}

export async function readStoredLanguage(extensionPage: {
  evaluate(callback: () => Promise<unknown>): Promise<unknown>;
}) {
  const raw = await extensionPage.evaluate(
    async () => (await chrome.storage.local.get('xeg-language'))['xeg-language'] ?? null
  );
  const decoded = decodeStoredValue(raw);
  return {
    exists: raw !== null,
    rawType: typeof raw,
    language: typeof decoded === 'string' ? decoded : null,
  };
}

export async function readStoredVideoSettings(extensionPage: Page): Promise<StorageRecord> {
  const key = 'xeg-app-settings';
  const prior = await extensionPage.evaluate(
    async ({ storageKey, fieldKeys }) => {
      const keys = [storageKey, ...fieldKeys];
      const values = await Promise.all(keys.map((entry) => chrome.storage.local.get(entry)));
      const base = values[0] ?? {};
      const fields: Record<string, StoredField> = {};
      for (let index = 0; index < fieldKeys.length; index++) {
        const fieldKey = fieldKeys[index];
        if (!fieldKey) {
          continue;
        }
        const stored = values[index + 1] ?? {};
        fields[fieldKey] = {
          exists: Object.hasOwn(stored, fieldKey),
          value: stored[fieldKey] ?? null,
        };
      }
      return { exists: Object.hasOwn(base, storageKey), value: base[storageKey] ?? null, fields };
    },
    { storageKey: key, fieldKeys: SETTINGS_FIELD_KEYS.map(settingsFieldStorageKey) }
  );
  const decoded = decodeStoredValue(prior.value);
  let settings: unknown = decoded;
  for (const path of SETTINGS_FIELD_KEYS) {
    const raw = prior.fields[settingsFieldStorageKey(path)];
    if (!raw?.exists) {
      continue;
    }
    const value = decodeStoredValue(raw.value);
    const [group, name] = path.split('.') as [string, string];
    const parent = isRecord(settings) ? settings : {};
    const section = isRecord(parent[group]) ? parent[group] : {};
    settings = { ...parent, [group]: { ...section, [name]: value } };
  }
  return { ...prior, settings };
}

async function readBorrowedVideoClickMode(
  extensionPage: Page,
  livePage: Page
): Promise<BorrowedVideoClickMode> {
  const primary = await readStoredVideoSettings(extensionPage);
  // The content script's PersistentStorage fallback is scoped to the X origin.
  // An extension page's localStorage cannot reveal it.
  const fallback = await livePage.evaluate(() => {
    if (
      location.protocol !== 'https:' ||
      (location.hostname !== 'x.com' && location.hostname !== 'twitter.com')
    ) {
      throw new Error('Borrowed settings fallback is outside the supported X origin');
    }
    return {
      base: localStorage.getItem('xeg-fallback:xeg-app-settings'),
      field: localStorage.getItem('xeg-fallback:xeg-app-settings:field:gallery.videoClickMode'),
    };
  });
  return resolveBorrowedVideoClickMode(primary, fallback.base, fallback.field);
}

export async function restoreStoredVideoSettings(
  extensionPage: Page,
  previous: Pick<StorageRecord, 'exists' | 'value' | 'fields'>
): Promise<boolean> {
  const storageKey = 'xeg-app-settings';
  await extensionPage.evaluate(
    async ({ storageKey, previous }) => {
      if (previous.exists) {
        await chrome.storage.local.set({ [storageKey]: previous.value });
      } else {
        await chrome.storage.local.remove(storageKey);
      }
    },
    { storageKey, previous }
  );
  if (previous.fields) {
    await extensionPage.evaluate(async (fields) => {
      for (const [key, field] of Object.entries(fields)) {
        if (field.exists) {
          await chrome.storage.local.set({ [key]: field.value });
        } else {
          await chrome.storage.local.remove(key);
        }
      }
    }, previous.fields);
  }
  return extensionPage.evaluate(
    async ({ storageKey, previous }) => {
      const values = await chrome.storage.local.get(storageKey);
      const baseMatches =
        Object.hasOwn(values, storageKey) === previous.exists &&
        (!previous.exists || JSON.stringify(values[storageKey]) === JSON.stringify(previous.value));
      if (!baseMatches || !previous.fields) {
        return baseMatches;
      }
      for (const [key, field] of Object.entries(previous.fields)) {
        const stored = await chrome.storage.local.get(key);
        if (
          Object.hasOwn(stored, key) !== field.exists ||
          (field.exists && JSON.stringify(stored[key]) !== JSON.stringify(field.value))
        ) {
          return false;
        }
      }
      return true;
    },
    { storageKey, previous }
  );
}

export function createControlledVideoSettings(
  priorValue: unknown,
  timestamp: number
): Record<string, unknown> & {
  gallery: Record<string, unknown> & { videoClickMode: string };
  __schemaHash: string;
} {
  const decoded = decodeStoredValue(priorValue);
  const base = isRecord(decoded) ? decoded : { version: '1', lastModified: timestamp, gallery: {} };
  return {
    ...base,
    gallery: {
      ...(record(base.gallery) ?? {}),
      videoClickMode: 'allow-all',
    },
    __schemaHash: '1',
  };
}

async function observeControlledVideoMode(
  context: BrowserContext,
  extensionId: string,
  targetUrl: string,
  output: string,
  index: number,
  actualSiteAcceptance: { downloads: string } | null = null,
  strictPageClose = false
): Promise<ControlledProbe> {
  const key = 'xeg-app-settings';
  const extensionPage = await context.newPage();
  const result: ControlledProbe = {
    kind: 'task-owned-extension-setting-probe',
    requestedMode: 'allow-all',
    priorStoredMode: null,
    appliedMode: null,
    observation: null,
    cleanup: { restored: false, extensionPageClosed: false },
    status: 'pending',
  };
  let prior: StorageRecord | undefined;
  let mutated = false;
  try {
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    prior = await readStoredVideoSettings(extensionPage);
    const priorMode = storedVideoClickMode(prior.settings);
    result.priorStoredMode =
      priorMode && ['allow-all', 'block-all', 'block-controls-only'].includes(priorMode)
        ? priorMode
        : null;
    const next = createControlledVideoSettings(prior.value, Date.now());
    mutated = true;
    await extensionPage.evaluate(
      async ({ storageKey, fieldKey, value }) => {
        await chrome.storage.local.set({
          [storageKey]: value,
          [fieldKey]: { __xegStorageEnvelope: 1, updatedAt: Date.now(), value: 'allow-all' },
        });
      },
      { storageKey: key, fieldKey: settingsFieldStorageKey('gallery.videoClickMode'), value: next }
    );
    result.appliedMode = storedVideoClickMode(
      (await readStoredVideoSettings(extensionPage)).settings
    );
    if (result.appliedMode !== 'allow-all') {
      throw new Error('Controlled video click mode was not stored');
    }
    result.observation = await observeOne(
      context,
      extensionId,
      targetUrl,
      output,
      `${index}-allow-all`,
      'allow-all',
      async () => storedVideoClickMode((await readStoredVideoSettings(extensionPage)).settings),
      null,
      null,
      actualSiteAcceptance
        ? { ...actualSiteAcceptance, navigationUrl: null, runMultiImage: false }
        : null,
      strictPageClose
    );
    result.modeAfterObservation = storedVideoClickMode(
      (await readStoredVideoSettings(extensionPage)).settings
    );
    if (result.modeAfterObservation !== 'allow-all') {
      throw new Error('Controlled video click mode changed during observation');
    }
    result.status = result.observation.status;
  } catch (error) {
    result.status = 'failed';
    result.error = safeError(error);
  } finally {
    if (!mutated) {
      result.cleanup.restored = true;
    }
    if (mutated && !prior) {
      result.cleanup.restoreError = 'Stored settings were unavailable for restoration';
    }
    if (mutated && prior) {
      try {
        result.cleanup.restored = await restoreStoredVideoSettings(extensionPage, prior);
      } catch (error) {
        result.cleanup.restoreError = safeError(error);
      }
    }
    await extensionPage.close().then(
      () => {
        result.cleanup.extensionPageClosed = true;
      },
      (error) => {
        result.cleanup.extensionPageError = safeError(error);
      }
    );
    if (!result.cleanup.restored || !result.cleanup.extensionPageClosed) {
      result.status = 'failed';
      result.error ??= 'Task-owned extension settings or page cleanup was incomplete';
    }
  }
  return result;
}

export async function observeLiveUrls({
  context,
  extensionId,
  liveUrls,
  output,
  session = 'owned',
  borrowedHostProof = null,
  ownedCandidateProof = null,
  actualSiteAcceptance = null,
}: {
  context: BrowserContext;
  extensionId: string;
  liveUrls: unknown;
  output: string;
  session?: 'owned' | 'borrowed' | 'borrowed-browser-owned-extension';
  borrowedHostProof?: BorrowedHostDiagnosticProof | null;
  ownedCandidateProof?: OwnedCandidateInBorrowedBrowser | null;
  actualSiteAcceptance?: { downloads: string } | null;
}) {
  if (
    session !== 'owned' &&
    session !== 'borrowed' &&
    session !== 'borrowed-browser-owned-extension'
  ) {
    throw new Error('Unknown live observation session mode');
  }
  const urls = validateLiveUrls(liveUrls);
  if (actualSiteAcceptance && session === 'borrowed') {
    throw new Error('Actual-site acceptance requires a task-owned extension');
  }
  if (
    session === 'borrowed-browser-owned-extension' &&
    (!actualSiteAcceptance ||
      !validateOwnedCandidateInBorrowedBrowser(
        ownedCandidateProof,
        extensionId,
        actualSiteAcceptance.downloads
      ))
  ) {
    throw new Error('Borrowed-browser acceptance requires an attested task-owned candidate');
  }
  if (actualSiteAcceptance && urls.length === 0) {
    throw new Error('Actual-site acceptance requires at least one public status URL');
  }
  if (!urls.length) {
    return { status: 'not-requested', evidenceStatus: 'not-applicable', pages: [] };
  }
  const pages: LiveObservation[] = [];
  const baselineByUrl =
    session !== 'owned' && borrowedHostProof
      ? validateBorrowedHostProof(borrowedHostProof, urls)
      : null;
  if (session === 'borrowed-browser-owned-extension' && !baselineByUrl) {
    throw new Error('Borrowed-browser acceptance requires a validated host baseline');
  }
  let extensionPage: Page | null = null;
  let borrowedMode: BorrowedVideoClickMode | null = null;
  let borrowedError: string | null = null;
  try {
    if (session === 'borrowed') {
      extensionPage = await context.newPage();
      await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    }
    for (let index = 0; index < urls.length; index += 1) {
      const url = urls[index];
      if (!url) {
        continue;
      }
      const page = await observeOne(
        context,
        extensionId,
        url,
        output,
        index + 1,
        null,
        null,
        extensionPage,
        baselineByUrl?.get(url) ?? null,
        actualSiteAcceptance
          ? {
              ...actualSiteAcceptance,
              navigationUrl: urls.find((candidate) => candidate !== url) ?? null,
              runMultiImage: !pages.some(
                (entry) => entry.actualSiteAcceptance?.status === 'observed'
              ),
            }
          : null,
        session === 'borrowed-browser-owned-extension'
      );
      if (
        session === 'borrowed' &&
        pages.length === 0 &&
        page.extension.videoClickModeSource &&
        (page.videoClickMode === 'block-all' ||
          page.videoClickMode === 'block-controls-only' ||
          page.videoClickMode === 'allow-all')
      ) {
        borrowedMode = {
          mode: page.videoClickMode,
          source: page.extension.videoClickModeSource,
        };
      }
      if (
        session !== 'borrowed' &&
        page.classification === 'native-play-observed-gallery-action-unavailable'
      ) {
        page.controlledProbe = await observeControlledVideoMode(
          context,
          extensionId,
          url,
          output,
          index + 1,
          actualSiteAcceptance,
          session === 'borrowed-browser-owned-extension'
        ).catch((error) => ({
          status: 'failed',
          error: safeError(error),
          cleanup: { restored: false, extensionPageClosed: false },
        }));
      }
      pages.push(page);
    }
  } catch (error) {
    if (session !== 'borrowed') {
      throw error;
    }
    borrowedError = safeError(error);
  } finally {
    if (extensionPage) {
      try {
        await extensionPage.close();
      } catch (error) {
        borrowedError ??= `Borrowed extension page cleanup failed: ${safeError(error)}`;
      }
    }
  }
  const failed = pages.filter((page) => !liveCompletionPassed(page));
  const cleanAcceptedPages = pages.filter(liveCompletionPassed);
  const acceptanceCoverage = {
    multiImageDownloadsSettings: cleanAcceptedPages.some(
      (page) => page.actualSiteAcceptance?.status === 'observed'
    ),
    videoNavigation: cleanAcceptedPages.some(
      (page) =>
        page.actualSiteVideoNavigation?.status === 'observed' ||
        (controlledRetryComplete(page) &&
          page.controlledProbe?.observation?.actualSiteVideoNavigation?.status === 'observed')
    ),
    sameDocumentPostNavigationAfterClose: cleanAcceptedPages.some(
      (page) => page.sameDocumentPostNavigationAfterClose?.status === 'observed'
    ),
  };
  const acceptanceMissing =
    actualSiteAcceptance !== null && Object.values(acceptanceCoverage).some((passed) => !passed);
  const controlled = cleanAcceptedPages.some((page) => controlledRetryComplete(page));
  const summary = {
    status:
      failed.length || borrowedError || acceptanceMissing
        ? 'failed'
        : controlled
          ? 'controlled-flow-observed'
          : 'core-flow-observed',
    evidenceStatus:
      !borrowedError &&
      !acceptanceMissing &&
      pages.every(
        (page) =>
          liveCompletionPassed(page) &&
          (page.status === 'core-flow-observed'
            ? page.evidenceStatus
            : page.controlledProbe?.observation?.evidenceStatus) === 'observed'
      )
        ? 'observed'
        : 'unverified',
    pages,
    ...(actualSiteAcceptance
      ? {
          actualSiteAcceptance: {
            status: acceptanceMissing ? 'unverified' : 'observed',
            coverage: acceptanceCoverage,
          },
        }
      : {}),
    ...(session !== 'owned'
      ? {
          session,
          ...(session === 'borrowed'
            ? { borrowedMode: urls.length === 1 ? borrowedMode : null }
            : {
                profileOwned: false,
                extensionOwned: true,
                candidateExtensionId: extensionId,
              }),
          borrowedError,
          hostProofStatus: borrowedHostProof
            ? baselineByUrl
              ? 'validated'
              : 'invalid'
            : 'not-provided',
          hostBaselineReceiptSha256: baselineByUrl
            ? borrowedHostProof?.baseline.receiptSha256
            : null,
        }
      : {}),
  };
  await writeFile(join(output, 'live-observations.json'), JSON.stringify(summary, null, 2));
  if (failed.length || borrowedError || acceptanceMissing) {
    const error = new AggregateError(
      [
        ...failed.map(
          (page) =>
            new Error(
              page.controlledProbe?.error ?? page.controlledProbe?.observation?.error ?? page.error
            )
        ),
        ...(borrowedError ? [new Error(borrowedError)] : []),
        ...(acceptanceMissing
          ? [new Error('Actual-site acceptance coverage remains incomplete')]
          : []),
      ],
      `${failed.length} live X observation(s) missed required assertions${borrowedError ? '; borrowed session check failed' : ''}`
    );
    throw Object.assign(error, { summary });
  }
  return summary;
}

export function directOwnerForSource(
  apiObservations: ApiObservation[],
  outerId: string,
  source: Source | null | undefined,
  target: Pick<QuoteTarget, 'quoteBoundary' | 'quoteStatusIds'>
) {
  if (target.quoteBoundary !== 'unmarked-candidate' || target.quoteStatusIds.length !== 0) {
    return { status: 'not-direct-owner-candidate', ownerId: null, mediaId: null };
  }
  if (!source) {
    return { status: 'missing-video-source', ownerId: null, mediaId: null };
  }
  const matches = new Map<
    string,
    { ownerId: string; mediaId: string | null; mediaIndex: number }
  >();
  for (const entry of apiObservations) {
    if (
      entry.operation !== 'TweetResultByRestId' ||
      entry.requestedTweetId !== outerId ||
      entry.httpStatus !== 200 ||
      entry.providerErrors ||
      entry.result?.id !== outerId ||
      entry.directQuote
    ) {
      continue;
    }
    entry.result.media.forEach((media, mediaIndex) => {
      if (
        media.playableVariants.some(
          (variant) => variant?.host === source.host && variant.path === source.path
        )
      ) {
        matches.set(JSON.stringify([mediaIndex, media.id]), {
          ownerId: outerId,
          mediaId: media.id,
          mediaIndex,
        });
      }
    });
  }
  return matches.size === 1
    ? { status: 'matched-direct-owner-variant', ...[...matches.values()][0] }
    : {
        status: matches.size > 1 ? 'ambiguous-media' : 'no-direct-owner-variant',
        ownerId: null,
        mediaId: null,
      };
}

function quotedOwnerForSource(
  apiObservations: ApiObservation[],
  outerId: string,
  source: Source | null | undefined
) {
  if (!source) {
    return { status: 'missing-video-source', ownerId: null, mediaId: null };
  }
  const matches = new Map<
    string,
    { ownerId: string; mediaId: string | null; mediaIndex: number }
  >();
  const quotedIds = new Set<string>();
  for (const entry of apiObservations) {
    if (entry.result?.id === outerId && entry.directQuote?.id) {
      quotedIds.add(entry.directQuote.id);
    }
  }
  for (const entry of apiObservations) {
    for (const tweet of [entry.result, entry.directQuote]) {
      if (!tweet?.id) {
        continue;
      }
      const directlyQuoted =
        quotedIds.has(tweet.id) ||
        (entry.requestedTweetId === outerId && entry.directQuote === tweet);
      if (!directlyQuoted) {
        continue;
      }
      const ownerId = tweet.id;
      tweet.media.forEach((media, mediaIndex) => {
        if (
          media.playableVariants.some(
            (variant) => variant?.host === source.host && variant.path === source.path
          )
        ) {
          matches.set(`${ownerId}:${mediaIndex}`, {
            ownerId,
            mediaId: media.id,
            mediaIndex,
          });
        }
      });
    }
  }
  return matches.size === 1
    ? { status: 'matched-direct-quote-variant', ...[...matches.values()][0] }
    : {
        status: matches.size > 1 ? 'ambiguous-media' : 'no-direct-quote-variant',
        ownerId: null,
        mediaId: null,
      };
}
