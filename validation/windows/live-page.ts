// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BrowserContext, ElementHandle, JSHandle, Page } from '@playwright/test';

type Source = { host: string; path: string };
type Identity = { handle: string; statusId: string };
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
};
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
type QuoteTarget = {
  kind: 'quoted-video';
  articleIndex: number;
  quoteBoundary: string;
  quoteIndex: number;
  nestedArticleIndex: number;
  quoteStatusIds: string[];
  ownershipPath: { tag: string; testId: string | null }[];
  videoIndex: number;
  playerIndex: number;
  previewIndex: number;
  posterIndex: number;
  hitKind: string;
  posterSource: Source | null;
  hostVideoSource: Source | null;
  initialHitTest?: ReturnType<typeof inspectHitTestedVideoActionDocument>;
  hitTestAfterNativePlayback?: ReturnType<typeof inspectHitTestedVideoActionDocument>;
  nativePlayback?: {
    status: string;
    before?: ReturnType<typeof inspectHostVideoDocument>;
    confirmation?: {
      inQuote: boolean;
      nativePlay: NonNullable<ReturnType<typeof inspectHitTestedVideoActionDocument>>['nativePlay'];
      rejectedControls: number;
    } | null;
    action?: NonNullable<ReturnType<typeof inspectHitTestedVideoActionDocument>>['nativePlay'];
    pointShift?: { x: number; y: number };
    galleryOpenedOnControlClick?: boolean;
    after?: ReturnType<typeof inspectHostVideoDocument> | null;
  };
  galleryActionKind?: string;
};
type ImageTarget = {
  kind: 'image';
  articleIndex: number;
  imageIndex: number;
  imageLoaded: boolean;
  imageSource: Source;
  imageVisible: boolean;
  quoteBoundary?: 'compact-two-level';
  directQuoteId?: string;
  ownerStatusId?: string;
  ownerHandle?: string;
  selectedPhotoIndex?: number;
  actionAriaLabel?: string | null;
  actionIndex?: number;
  actionPath?: string;
  duplicateActionCount?: number;
};
type NativePreviewTarget = {
  kind: 'native-preview-photo';
  articleIndex: number;
  actionIndex: number;
  actionPath: string;
  ownerHandle: string;
  ownerStatusId: string;
  photoNumber: number;
  quoteBoundary: 'flat-nested-preview';
};
type LiveTarget = QuoteTarget | ImageTarget | NativePreviewTarget;
type LiveReadiness =
  | { state: 'ready'; target: LiveTarget }
  | { state: 'ambiguous' | 'terminal'; reason: string; candidateCount?: number }
  | false;
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
  owner?: ReturnType<typeof quotedOwnerForSource>;
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
  classification?: string;
  providerRejection?: ReturnType<typeof summarizeQuoteProviderRejection>;
  error?: string;
  expectedLifecycleCancellationCount?: number;
  controlledProbe?: ControlledProbe;
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
type StorageRecord = { exists: boolean; value: unknown; settings: unknown };

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

export function classifyLiveHostDiagnostics(observation: LiveObservation) {
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
  const expectedLifecycleCancellationCount =
    allRequired && family
      ? observation.hostDiagnostics.filter((record) => {
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
  return {
    expectedLifecycleCancellationCount,
    evidenceStatus:
      allRequired &&
      observation.hostDiagnosticOverflow === 0 &&
      expectedLifecycleCancellationCount === observation.hostDiagnostics.length
        ? 'observed'
        : 'unverified',
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

function attachDiagnostics(page: Page, observation: LiveObservation) {
  const pendingResponses = new Set<Promise<void>>();
  page.on('console', (message) => {
    if (message.type() !== 'error') {
      return;
    }
    const record = {
      kind: 'console',
      location: sanitizedUrl(message.location().url || 'about:blank'),
      text: sanitizedText(message.text()),
    };
    const product = isProductConsoleError(record);
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
    const url = new URL(request.url());
    const record = {
      kind: 'request-failed',
      error: sanitizedText(request.failure()?.errorText ?? 'unknown', 200),
      url: sanitizedUrl(request.url()),
      hadQuery: Boolean(url.search || url.hash),
      hadCredentials: Boolean(url.username || url.password),
      hadPort: hasExplicitUrlPort(request.url()),
    };
    const product = record.url.startsWith('chrome-extension:');
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

export function inspectLiveTargetDocument({ handle, statusId }: Identity): LiveReadiness {
  const statusPath = `/${handle}/status/${statusId}`.toLowerCase();
  const parseVideo = (value: string | null | undefined) => {
    if (!value) {
      return null;
    }
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'video.twimg.com'
        ? { host: url.hostname, path: url.pathname }
        : null;
    } catch {
      return null;
    }
  };
  const isVisible = (element: Element) => {
    const style = getComputedStyle(element);
    const rectangle = element.getBoundingClientRect();
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity) !== 0 &&
      rectangle.width > 0 &&
      rectangle.height > 0
    );
  };
  const parseLink = (anchor: HTMLAnchorElement) => {
    try {
      const url = new URL(anchor.href, location.href);
      if (!['x.com', 'twitter.com'].includes(url.hostname.toLowerCase())) {
        return null;
      }
      return { host: url.hostname.toLowerCase(), path: url.pathname };
    } catch {
      return null;
    }
  };
  const parseMedia = (image: HTMLImageElement) => {
    for (const value of [image.currentSrc, image.src, image.getAttribute('src')]) {
      try {
        const url = new URL(value ?? '', location.href);
        if (
          url.protocol === 'https:' &&
          url.hostname.toLowerCase() === 'pbs.twimg.com' &&
          url.pathname.startsWith('/media/')
        ) {
          return { host: url.hostname.toLowerCase(), path: url.pathname };
        }
      } catch {
        // Try the next image source candidate.
      }
    }
    return null;
  };
  const compactOwnerPath = (anchor: HTMLAnchorElement) =>
    /^(\/[A-Za-z0-9_]{1,15}\/status\/[1-9]\d*)(?:\/photo\/[1-9]\d*)?$/u.exec(
      parseLink(anchor)?.path ?? ''
    )?.[1] ?? null;
  const parsePoster = (value: string | null | undefined) => {
    if (!value) {
      return null;
    }
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' &&
        url.hostname.toLowerCase() === 'pbs.twimg.com' &&
        /^\/(?:amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|video_thumb)\//u.test(
          url.pathname
        )
        ? { host: url.hostname.toLowerCase(), path: url.pathname }
        : null;
    } catch {
      return null;
    }
  };

  const articles = [...document.querySelectorAll<HTMLElement>('article')];
  for (let articleIndex = 0; articleIndex < articles.length; articleIndex += 1) {
    const article = articles[articleIndex];
    if (!article) {
      continue;
    }
    const ownsStatus = [...article.querySelectorAll<HTMLAnchorElement>('a[href]')].some(
      (anchor) => {
        const link = parseLink(anchor);
        return anchor.closest('article') === article && link?.path.toLowerCase() === statusPath;
      }
    );
    if (!ownsStatus) {
      continue;
    }

    const directNestedArticles = [...article.querySelectorAll('article')].filter(
      (nested) => nested.parentElement?.closest('article') === article
    );
    const quoteCards = [...article.querySelectorAll('[data-testid="quoteTweet"]')].filter(
      (card) => card.closest('article') === article
    );
    const scopes = directNestedArticles.length
      ? directNestedArticles
      : quoteCards.length
        ? quoteCards
        : [article];
    const videoTargets: { state: 'ready'; target: QuoteTarget }[] = [];
    for (let scopeIndex = 0; scopeIndex < scopes.length; scopeIndex += 1) {
      const quote = scopes[scopeIndex];
      if (!quote) {
        continue;
      }
      const players: Element[] = [
        ...quote.querySelectorAll(
          '[data-testid="videoPlayer"], video, [data-testid="previewInterstitial"]'
        ),
      ].filter(
        (candidate) =>
          candidate.closest('article') === (directNestedArticles.length ? quote : article) &&
          (candidate.matches('[data-testid="videoPlayer"]') ||
            !candidate.closest('[data-testid="videoPlayer"]')) &&
          (!candidate.matches('[data-testid="previewInterstitial"]') ||
            (candidate.closest('[data-testid="tweetPhoto"]') &&
              candidate.querySelector('[data-testid="playButton"]') &&
              !candidate.closest('[data-testid="videoPlayer"]')))
      );
      for (const player of players) {
        const video = player instanceof HTMLVideoElement ? player : player.querySelector('video');
        const preview = player instanceof HTMLVideoElement ? null : player.querySelector('img');
        const playButton = player.matches('[data-testid="previewInterstitial"]')
          ? player.querySelector('[data-testid="playButton"]')
          : null;
        const poster = parsePoster(video?.poster);
        const matchingPosters: HTMLImageElement[] = poster
          ? [...quote.querySelectorAll<HTMLImageElement>('img')].filter((image) => {
              const source = parsePoster(image.currentSrc || image.src);
              return (
                image.closest('article') === (directNestedArticles.length ? quote : article) &&
                source?.path === poster.path &&
                isVisible(image) &&
                image.complete &&
                image.naturalWidth > 0
              );
            })
          : [];
        const matchingPoster = matchingPosters.length === 1 ? matchingPosters[0] : null;
        const hitTarget: Element | null =
          playButton && isVisible(playButton)
            ? playButton
            : video && isVisible(video)
              ? video
              : preview && isVisible(preview) && preview.complete && preview.naturalWidth > 0
                ? preview
                : (matchingPoster ?? (isVisible(player) ? player : null));
        if (!hitTarget) {
          continue;
        }
        const quoteLinks = [...quote.querySelectorAll<HTMLAnchorElement>('a[href]')].flatMap(
          (anchor) => {
            if (directNestedArticles.length && anchor.closest('article') !== quote) {
              return [];
            }
            const link = parseLink(anchor);
            const match = link?.path.match(/^\/[A-Za-z0-9_]{1,15}\/status\/(\d+)(?:\/|$)/u);
            return match?.[1] && match[1] !== statusId ? [match[1]] : [];
          }
        );
        const quoteStatusIds = [...new Set(quoteLinks)].slice(0, 8);
        const path: { tag: string; testId: string | null }[] = [];
        for (
          let node: Element | null = hitTarget;
          node && node !== article && path.length < 10;
          node = node.parentElement
        ) {
          path.push({
            tag: node.tagName.toLowerCase(),
            testId: [
              'quoteTweet',
              'videoPlayer',
              'tweetPhoto',
              'videoComponent',
              'videoPlayerOverlay',
              'videoPlayerControls',
            ].includes(node.getAttribute('data-testid') ?? '')
              ? node.getAttribute('data-testid')
              : null,
          });
        }
        videoTargets.push({
          state: 'ready',
          target: {
            kind: 'quoted-video',
            articleIndex,
            quoteBoundary: directNestedArticles.length
              ? 'nested-article'
              : quoteCards.length
                ? 'quoteTweet'
                : 'unmarked-candidate',
            quoteIndex: quoteCards.length && !directNestedArticles.length ? scopeIndex : -1,
            nestedArticleIndex: directNestedArticles.length
              ? [...article.querySelectorAll<Element>('article')].indexOf(quote)
              : -1,
            quoteStatusIds,
            ownershipPath: path,
            videoIndex: video ? [...article.querySelectorAll('video')].indexOf(video) : -1,
            playerIndex: [...article.querySelectorAll('[data-testid="videoPlayer"]')].indexOf(
              player
            ),
            previewIndex: [
              ...article.querySelectorAll('[data-testid="previewInterstitial"]'),
            ].indexOf(player),
            posterIndex: matchingPoster
              ? [...article.querySelectorAll('img')].indexOf(matchingPoster)
              : hitTarget instanceof HTMLImageElement
                ? [...article.querySelectorAll('img')].indexOf(hitTarget)
                : -1,
            hitKind: hitTarget.tagName.toLowerCase(),
            posterSource: poster ?? parsePoster(preview?.currentSrc || preview?.src),
            hostVideoSource: video ? parseVideo(video.currentSrc || video.src) : null,
          },
        });
      }
    }
    if (videoTargets.length > 1) {
      return {
        state: 'ambiguous',
        reason: 'multiple-visible-video-candidates',
        candidateCount: Math.min(videoTargets.length, 20),
      };
    }
    if (videoTargets.length === 1 && videoTargets[0]) {
      return videoTargets[0];
    }
    if (
      scopes.some((quote) =>
        quote.querySelector(
          '[data-testid="videoPlayer"], video, [data-testid="previewInterstitial"]'
        )
      )
    ) {
      return false;
    }

    const images = [...article.querySelectorAll<HTMLImageElement>('img')];
    for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
      const image = images[imageIndex];
      if (!image) {
        continue;
      }
      const source = parseMedia(image);
      if (
        image.closest('article') !== article ||
        image.closest('[data-testid="videoPlayer"], [data-testid="previewInterstitial"]') ||
        !source ||
        !isVisible(image) ||
        !image.complete ||
        image.naturalWidth <= 0
      ) {
        continue;
      }
      return {
        state: 'ready',
        target: {
          kind: 'image',
          articleIndex,
          imageIndex,
          imageLoaded: true,
          imageSource: source,
          imageVisible: true,
        },
      };
    }
    // The public compact layout places C's photo in an unmarked role-link inside
    // B's nested article. Admit only the observed A > B > C ownership chain and
    // a unique image covered by a second link to that same C status.
    const compactTargets: ImageTarget[] = [];
    for (const quoteArticle of directNestedArticles) {
      for (const compact of quoteArticle.querySelectorAll<HTMLElement>('[role="link"]')) {
        if (compact.closest('article') !== quoteArticle) {
          continue;
        }
        const ownLinks = [...compact.querySelectorAll<HTMLAnchorElement>('a[href]')];
        const compactPaths = ownLinks.map(compactOwnerPath);
        const ownerPath = compactPaths[0];
        const ownerMatch = /^\/([A-Za-z0-9_]{1,15})\/status\/([1-9]\d*)$/u.exec(ownerPath ?? '');
        if (!ownerMatch || compactPaths.some((path) => path !== ownerPath)) {
          continue;
        }
        const [, ownerHandle, ownerStatusId] = ownerMatch;
        if (!ownerHandle || !ownerStatusId || ownerStatusId === statusId) {
          continue;
        }
        const directQuoteIds = new Set(
          [...quoteArticle.querySelectorAll<HTMLAnchorElement>('a[href]')]
            .filter(
              (anchor) => anchor.closest('article') === quoteArticle && !compact.contains(anchor)
            )
            .map(
              (anchor) =>
                /^\/[A-Za-z0-9_]{1,15}\/status\/([1-9]\d*)$/u.exec(
                  parseLink(anchor)?.path ?? ''
                )?.[1]
            )
            .filter((id): id is string => !!id)
        );
        if (directQuoteIds.size !== 1) {
          continue;
        }
        const directQuoteId = [...directQuoteIds][0];
        if (!directQuoteId || directQuoteId === statusId || directQuoteId === ownerStatusId) {
          continue;
        }
        for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
          const image = images[imageIndex];
          if (!image || !compact.contains(image) || image.closest('article') !== quoteArticle) {
            continue;
          }
          const source = parseMedia(image);
          if (!source || !isVisible(image) || !image.complete || image.naturalWidth <= 0) {
            continue;
          }
          const imageLink = image.closest<HTMLAnchorElement>('a[href]');
          const imagePath = imageLink ? parseLink(imageLink)?.path : null;
          if (!imageLink || compactOwnerPath(imageLink) !== ownerPath) {
            continue;
          }
          const rectangle = image.getBoundingClientRect();
          const x = rectangle.left + rectangle.width / 2;
          const y = rectangle.top + rectangle.height / 2;
          if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) {
            continue;
          }
          const hit = document.elementFromPoint(x, y);
          const hitLink = hit?.closest<HTMLAnchorElement>('a[href]');
          if (!hitLink || hitLink === imageLink || parseLink(hitLink)?.path !== imagePath) {
            continue;
          }
          let region = image.parentElement;
          for (let hops = 0; region && !region.contains(hit) && hops < 4; hops += 1) {
            region = region.parentElement;
          }
          if (!region || !region.contains(hit) || !compact.contains(region) || region === compact) {
            continue;
          }
          const regionImages = [...region.querySelectorAll<HTMLImageElement>('img')].filter(
            parseMedia
          );
          const regionLinks = [...region.querySelectorAll<HTMLAnchorElement>('a[href]')];
          if (
            regionImages.length !== 1 ||
            regionImages[0] !== image ||
            regionLinks.length !== 2 ||
            regionLinks.some((anchor) => parseLink(anchor)?.path !== imagePath)
          ) {
            continue;
          }
          compactTargets.push({
            kind: 'image',
            articleIndex,
            imageIndex,
            imageLoaded: true,
            imageSource: source,
            imageVisible: true,
            quoteBoundary: 'compact-two-level',
            directQuoteId,
            ownerStatusId,
            ownerHandle,
          });
        }
      }
    }
    if (compactTargets.length > 1) {
      return {
        state: 'ambiguous',
        reason: 'multiple-compact-quote-images',
        candidateCount: compactTargets.length,
      };
    }
    if (compactTargets[0]) {
      return { state: 'ready', target: compactTargets[0] };
    }

    // The authenticated flat layout exposes C's native photo action without an
    // image. Its unmarked B wrapper does not establish a B-to-C post identity.
    const previewActions = [
      ...article.querySelectorAll<HTMLAnchorElement>('a[data-testid="nestedQuotePreviewMedia"]'),
    ];
    if (previewActions.length > 1) {
      return {
        state: 'ambiguous',
        reason: 'multiple-native-preview-actions',
        candidateCount: Math.min(previewActions.length, 20),
      };
    }
    const action = previewActions[0];
    if (action) {
      const preview = action.closest('div[role="link"][data-testid="nestedQuotePreview"]');
      const wrapper = preview?.parentElement?.closest('div[role="link"]');
      const rectangle = action.getBoundingClientRect();
      const x = rectangle.left + rectangle.width / 2;
      const y = rectangle.top + rectangle.height / 2;
      const hit =
        x >= 0 && y >= 0 && x < innerWidth && y < innerHeight
          ? document.elementFromPoint(x, y)
          : null;
      let owner: RegExpExecArray | null = null;
      let actionPath: string | null = null;
      try {
        const url = new URL(action.href, location.href);
        if (
          url.protocol === 'https:' &&
          ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
          !url.username &&
          !url.password &&
          !url.port &&
          !url.search &&
          !url.hash
        ) {
          owner = /^\/([A-Za-z0-9_]{1,15})\/status\/([1-9]\d*)\/photo\/([1-9]\d*)$/u.exec(
            url.pathname
          );
          actionPath = url.pathname;
        }
      } catch {
        // An unrecognized native action cannot establish C's identity.
      }
      const photoNumber = Number(owner?.[3]);
      const exactArticleCount = articles.filter((candidate) =>
        [...candidate.querySelectorAll<HTMLAnchorElement>('a[href]')].some((anchor) => {
          try {
            const url = new URL(anchor.href, location.href);
            return (
              anchor.closest('article') === candidate &&
              url.protocol === 'https:' &&
              ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
              url.pathname.toLowerCase() === statusPath
            );
          } catch {
            return false;
          }
        })
      ).length;
      if (
        action.getAttribute('role') === 'link' &&
        preview?.closest('article') === article &&
        wrapper?.closest('article') === article &&
        article.querySelectorAll('div[role="link"][data-testid="nestedQuotePreview"]').length ===
          1 &&
        exactArticleCount === 1 &&
        owner?.[1] &&
        owner[2] &&
        owner[2] !== statusId &&
        Number.isSafeInteger(photoNumber) &&
        photoNumber > 0 &&
        isVisible(action) &&
        hit &&
        action.contains(hit) &&
        hit.closest('a[href]') === action &&
        actionPath
      ) {
        return {
          state: 'ready',
          target: {
            kind: 'native-preview-photo',
            articleIndex,
            actionIndex: [...article.querySelectorAll<HTMLAnchorElement>('a[href]')].indexOf(
              action
            ),
            actionPath,
            ownerHandle: owner[1],
            ownerStatusId: owner[2],
            photoNumber,
            quoteBoundary: 'flat-nested-preview',
          },
        };
      }
    }
  }
  const text = document.body?.innerText ?? document.body?.textContent ?? '';
  if (
    /verify you are human|unusual activity|captcha|this post is unavailable|page doesn.?t exist/iu.test(
      text
    )
  ) {
    return { state: 'terminal', reason: 'host-challenge-or-unavailable' };
  }
  return false;
}

export function inspectLiveCandidateDocument({ handle, statusId }: Identity) {
  const path = `/${handle}/status/${statusId}`.toLowerCase();
  const articles = [...document.querySelectorAll<HTMLElement>('article')];
  const statusPath = (value: string) => {
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' &&
        ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
        /^\/[A-Za-z0-9_]{1,15}\/status\/\d+(?:\/|$)/u.test(url.pathname)
        ? url.pathname
        : null;
    } catch {
      return null;
    }
  };
  const mediaPath = (value: string) => {
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' &&
        url.hostname === 'pbs.twimg.com' &&
        /^\/(?:amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|video_thumb)\//u.test(
          url.pathname
        )
        ? { host: url.hostname, path: url.pathname }
        : null;
    } catch {
      return null;
    }
  };
  const nodePath = (element: Element, article: Element) => {
    const nodes: {
      tag: string;
      testId: string | null;
      role: string | null;
      statusPath: string | null;
      visibleBox: boolean;
      bounds: { x: number; y: number; width: number; height: number };
    }[] = [];
    for (
      let node: Element | null = element;
      node && node !== article && nodes.length < 12;
      node = node.parentElement
    ) {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const testId = node.getAttribute('data-testid');
      const role = node.getAttribute('role');
      nodes.push({
        tag: node.tagName.toLowerCase(),
        testId: [
          'quoteTweet',
          'tweetPhoto',
          'videoPlayer',
          'videoComponent',
          'previewInterstitial',
          'playButton',
          'card.wrapper',
        ].includes(testId ?? '')
          ? testId
          : null,
        role: ['link', 'button', 'presentation', 'application'].includes(role ?? '') ? role : null,
        statusPath: node instanceof HTMLAnchorElement ? statusPath(node.href) : null,
        visibleBox:
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number(style.opacity) !== 0,
        bounds: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      });
    }
    return nodes;
  };
  const articleOwnership = (element: Element, outerArticle: HTMLElement) => {
    const ancestorArticleIndexes = [];
    for (
      let node = element.closest('article');
      node && outerArticle.contains(node);
      node = node.parentElement?.closest('article') ?? null
    ) {
      ancestorArticleIndexes.push(articles.indexOf(node));
      if (node === outerArticle || ancestorArticleIndexes.length >= 6) {
        break;
      }
    }
    const nearest = element.closest('article');
    const ownStatusAnchors = nearest
      ? [...nearest.querySelectorAll<HTMLAnchorElement>('a[href]')]
          .filter((anchor) => anchor.closest('article') === nearest)
          .flatMap((anchor) => {
            const path = statusPath(anchor.href);
            if (!path) {
              return [];
            }
            const structure = [];
            for (
              let node: Element | null = anchor;
              node && node !== nearest && structure.length < 6;
              node = node.parentElement
            ) {
              const role = node.getAttribute('role');
              const testId = node.getAttribute('data-testid');
              structure.push({
                tag: ['a', 'div', 'span', 'time', 'article'].includes(node.tagName.toLowerCase())
                  ? node.tagName.toLowerCase()
                  : 'other',
                role: ['link', 'button', 'presentation'].includes(role ?? '') ? role : null,
                testId: ['User-Name', 'tweet', 'quoteTweet', 'videoPlayer'].includes(testId ?? '')
                  ? testId
                  : null,
              });
            }
            return [
              {
                path,
                containsTime: Boolean(anchor.querySelector('time')),
                nearestArticleIndex: articles.indexOf(nearest),
                structure,
              },
            ];
          })
          .slice(0, 8)
      : [];
    const ownStatusPaths = ownStatusAnchors.map((anchor) => anchor.path);
    return {
      nearestArticleIndex: nearest ? articles.indexOf(nearest) : -1,
      ancestorArticleIndexes,
      ownStatusPaths,
      ownStatusAnchors,
    };
  };
  const article = articles.find((candidate) =>
    [...candidate.querySelectorAll<HTMLAnchorElement>('a[href]')].some((anchor) => {
      try {
        const url = new URL(anchor.href, location.href);
        return (
          ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
          url.pathname.toLowerCase() === path &&
          anchor.closest('article') === candidate
        );
      } catch {
        return false;
      }
    })
  );
  if (!article) {
    return { exactArticleFound: false, articleCount: Math.min(articles.length, 50) };
  }
  const videoDetails = [...article.querySelectorAll<HTMLVideoElement>('video')]
    .slice(0, 6)
    .map((video) => {
      const rect = video.getBoundingClientRect();
      const x = Math.min(innerWidth - 1, Math.max(0, rect.x + rect.width / 2));
      const y = Math.min(innerHeight - 1, Math.max(0, rect.y + rect.height / 2));
      return {
        sourceKind:
          video.currentSrc?.startsWith('blob:') || video.src.startsWith('blob:')
            ? 'blob'
            : video.currentSrc || video.src
              ? 'other'
              : 'none',
        poster: mediaPath(video.poster),
        ...articleOwnership(video, article),
        nodePath: nodePath(video, article),
        hitPath:
          rect.width > 0 && rect.height > 0 && typeof document.elementsFromPoint === 'function'
            ? document
                .elementsFromPoint(x, y)
                .slice(0, 4)
                .map((node) => ({
                  tag: node.tagName.toLowerCase(),
                  testId: [
                    'videoPlayer',
                    'videoComponent',
                    'playButton',
                    'previewInterstitial',
                  ].includes(node.getAttribute('data-testid') ?? '')
                    ? node.getAttribute('data-testid')
                    : null,
                }))
            : [],
      };
    });
  const thumbnailDetails = [];
  for (const element of [...article.querySelectorAll('*')].slice(0, 800)) {
    if (thumbnailDetails.length >= 8) {
      break;
    }
    const image =
      element instanceof HTMLImageElement ? mediaPath(element.currentSrc || element.src) : null;
    const background = getComputedStyle(element).backgroundImage;
    const backgroundUrl = background.match(/^url\(["']?(.*?)["']?\)$/u)?.[1];
    const backgroundSource = backgroundUrl ? mediaPath(backgroundUrl) : null;
    if (!image && !backgroundSource) {
      continue;
    }
    thumbnailDetails.push({
      source: image ?? backgroundSource,
      sourceKind: image ? 'image' : 'background',
      ...articleOwnership(element, article),
      nodePath: nodePath(element, article),
    });
  }
  const statusIds = [
    ...new Set(
      [...article.querySelectorAll<HTMLAnchorElement>('a[href]')].flatMap((anchor) => {
        try {
          const url = new URL(anchor.href, location.href);
          const match = ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase())
            ? url.pathname.match(/^\/[A-Za-z0-9_]{1,15}\/status\/(\d+)(?:\/|$)/u)
            : null;
          return match ? [match[1]] : [];
        } catch {
          return [];
        }
      })
    ),
  ].slice(0, 12);
  return {
    exactArticleFound: true,
    articleIndex: articles.indexOf(article),
    outerArticleOwnStatusAnchors: articleOwnership(article, article).ownStatusAnchors,
    quoteCardCount: Math.min(article.querySelectorAll('[data-testid="quoteTweet"]').length, 20),
    videoPlayerCount: Math.min(article.querySelectorAll('[data-testid="videoPlayer"]').length, 20),
    previewInterstitialCount: Math.min(
      article.querySelectorAll('[data-testid="previewInterstitial"]').length,
      20
    ),
    playButtonCount: Math.min(article.querySelectorAll('[data-testid="playButton"]').length, 20),
    videoCount: Math.min(article.querySelectorAll('video').length, 20),
    statusIds,
    videoDetails,
    thumbnailDetails,
  };
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

export async function inspectHitTestedAction(
  image: import('@playwright/test').Locator,
  identity: Identity,
  target?: ImageTarget
): Promise<{
  actionAriaLabel: string | null;
  actionIndex: number;
  actionPath: string;
  duplicateActionCount: number;
} | null> {
  return image.evaluate(
    (element, { identity: { handle, statusId }, target }) => {
      const article = element.closest('article');
      if (!(element instanceof HTMLImageElement) || !article) {
        return null;
      }
      const mediaPath = new RegExp(`^/${handle}/status/${statusId}/photo/\\d+$`, 'iu');
      const anchors = [...article.querySelectorAll<HTMLAnchorElement>('a[href]')];
      const parseLink = (anchor: HTMLAnchorElement) => {
        try {
          const url = new URL(anchor.href, location.href);
          return ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) ? url : null;
        } catch {
          return null;
        }
      };
      const rectangle = element.getBoundingClientRect();
      if (
        rectangle.bottom <= 0 ||
        rectangle.top >= innerHeight ||
        rectangle.right <= 0 ||
        rectangle.left >= innerWidth
      ) {
        return null;
      }
      const x = Math.max(0, Math.min(innerWidth - 1, rectangle.left + rectangle.width / 2));
      const y = Math.max(0, Math.min(innerHeight - 1, rectangle.top + rectangle.height / 2));
      if (target?.quoteBoundary === 'compact-two-level') {
        if (
          !target.ownerHandle ||
          !target.ownerStatusId ||
          !target.directQuoteId ||
          !element.complete ||
          element.naturalWidth <= 0
        ) {
          return null;
        }
        try {
          const source = new URL(element.currentSrc || element.src);
          if (
            source.hostname !== target.imageSource.host ||
            source.pathname !== target.imageSource.path
          ) {
            return null;
          }
        } catch {
          return null;
        }
        const outerArticle = document.querySelectorAll('article')[target.articleIndex];
        const compact = element.closest('[role="link"]');
        const ownerPath = `/${target.ownerHandle}/status/${target.ownerStatusId}`;
        const compactOwnerPath = (anchor: HTMLAnchorElement) =>
          /^(\/[A-Za-z0-9_]{1,15}\/status\/[1-9]\d*)(?:\/photo\/[1-9]\d*)?$/u.exec(
            parseLink(anchor)?.pathname ?? ''
          )?.[1] ?? null;
        const imageLink = element.closest<HTMLAnchorElement>('a[href]');
        const hit = document.elementFromPoint(x, y);
        const hitLink = hit?.closest<HTMLAnchorElement>('a[href]');
        const imagePath = imageLink ? parseLink(imageLink)?.pathname : null;
        const actionPath = hitLink ? parseLink(hitLink)?.pathname : null;
        if (
          !outerArticle?.contains(article) ||
          !compact ||
          compact.closest('article') !== article ||
          !imageLink ||
          !hitLink ||
          imageLink === hitLink ||
          compactOwnerPath(imageLink) !== ownerPath ||
          actionPath !== imagePath ||
          !actionPath ||
          [...compact.querySelectorAll<HTMLAnchorElement>('a[href]')].some(
            (anchor) => compactOwnerPath(anchor) !== ownerPath
          )
        ) {
          return null;
        }
        const directQuoteIds = new Set(
          [...article.querySelectorAll<HTMLAnchorElement>('a[href]')]
            .filter((anchor) => anchor.closest('article') === article && !compact.contains(anchor))
            .map(
              (anchor) =>
                /^\/[A-Za-z0-9_]{1,15}\/status\/([1-9]\d*)$/u.exec(
                  parseLink(anchor)?.pathname ?? ''
                )?.[1]
            )
            .filter((id): id is string => !!id)
        );
        if (directQuoteIds.size !== 1 || !directQuoteIds.has(target.directQuoteId)) {
          return null;
        }
        let region = element.parentElement;
        for (let hops = 0; region && !region.contains(hit) && hops < 4; hops += 1) {
          region = region.parentElement;
        }
        if (!region || !region.contains(hit) || !compact.contains(region) || region === compact) {
          return null;
        }
        const mediaImages = [...region.querySelectorAll<HTMLImageElement>('img')].filter(
          (candidate) => {
            try {
              const url = new URL(candidate.currentSrc || candidate.src);
              return (
                url.protocol === 'https:' &&
                url.hostname === 'pbs.twimg.com' &&
                url.pathname.startsWith('/media/')
              );
            } catch {
              return false;
            }
          }
        );
        const regionLinks = [...region.querySelectorAll<HTMLAnchorElement>('a[href]')];
        if (
          mediaImages.length !== 1 ||
          mediaImages[0] !== element ||
          regionLinks.length !== 2 ||
          regionLinks.some((anchor) => parseLink(anchor)?.pathname !== actionPath)
        ) {
          return null;
        }
        const outerAnchors = [...outerArticle.querySelectorAll<HTMLAnchorElement>('a[href]')];
        const actionIndex = outerAnchors.indexOf(hitLink);
        if (actionIndex < 0) {
          return null;
        }
        return {
          actionAriaLabel: hitLink.getAttribute('aria-label'),
          actionIndex,
          actionPath,
          duplicateActionCount: regionLinks.length,
        };
      }
      const hitAnchors = [
        ...new Set(
          document
            .elementsFromPoint(x, y)
            .map((candidate) => candidate.closest<HTMLAnchorElement>('a[href]'))
            .filter((candidate): candidate is HTMLAnchorElement => candidate !== null)
        ),
      ];
      const action = hitAnchors.find((anchor) => {
        const url = parseLink(anchor);
        return anchor.closest('article') === article && url && mediaPath.test(url.pathname);
      });
      if (!action) {
        return null;
      }
      const actionUrl = parseLink(action);
      if (!actionUrl) {
        return null;
      }
      const duplicateActionCount = anchors.filter((anchor) => {
        const url = parseLink(anchor);
        return anchor.closest('article') === article && url?.pathname === actionUrl.pathname;
      }).length;
      return {
        actionAriaLabel: action.getAttribute('aria-label'),
        actionIndex: anchors.indexOf(action),
        actionPath: actionUrl.pathname,
        duplicateActionCount,
      };
    },
    { identity, target }
  );
}

export async function inspectHitTestedNativePreviewAction(
  action: import('@playwright/test').Locator,
  identity: Identity,
  target: NativePreviewTarget
): Promise<boolean> {
  return action.evaluate(
    (element, { identity: { handle, statusId }, target }) => {
      const article = document.querySelectorAll('article')[target.articleIndex];
      const preview = element.closest('div[role="link"][data-testid="nestedQuotePreview"]');
      const wrapper = preview?.parentElement?.closest('div[role="link"]');
      if (
        !(element instanceof HTMLAnchorElement) ||
        !article ||
        element.closest('article') !== article ||
        element.getAttribute('role') !== 'link' ||
        element.getAttribute('data-testid') !== 'nestedQuotePreviewMedia' ||
        preview?.closest('article') !== article ||
        wrapper?.closest('article') !== article ||
        article.querySelectorAll('a[data-testid="nestedQuotePreviewMedia"]').length !== 1 ||
        article.querySelectorAll('div[role="link"][data-testid="nestedQuotePreview"]').length !==
          1 ||
        [...article.querySelectorAll<HTMLAnchorElement>('a[href]')].indexOf(element) !==
          target.actionIndex
      ) {
        return false;
      }
      const exactArticleCount = [...document.querySelectorAll('article')].filter((candidate) =>
        [...candidate.querySelectorAll<HTMLAnchorElement>('a[href]')].some((anchor) => {
          try {
            const url = new URL(anchor.href, location.href);
            return (
              anchor.closest('article') === candidate &&
              url.protocol === 'https:' &&
              ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
              url.pathname.toLowerCase() === `/${handle}/status/${statusId}`.toLowerCase()
            );
          } catch {
            return false;
          }
        })
      ).length;
      const rectangle = element.getBoundingClientRect();
      const x = rectangle.left + rectangle.width / 2;
      const y = rectangle.top + rectangle.height / 2;
      const hit =
        x >= 0 && y >= 0 && x < innerWidth && y < innerHeight
          ? document.elementFromPoint(x, y)
          : null;
      try {
        const url = new URL(element.href, location.href);
        return (
          exactArticleCount === 1 &&
          url.protocol === 'https:' &&
          ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
          !url.username &&
          !url.password &&
          !url.port &&
          !url.search &&
          !url.hash &&
          url.pathname === target.actionPath &&
          url.pathname ===
            `/${target.ownerHandle}/status/${target.ownerStatusId}/photo/${target.photoNumber}` &&
          rectangle.width > 0 &&
          rectangle.height > 0 &&
          getComputedStyle(element).display !== 'none' &&
          getComputedStyle(element).visibility !== 'hidden' &&
          Number(getComputedStyle(element).opacity) !== 0 &&
          hit !== null &&
          element.contains(hit) &&
          hit.closest('a[href]') === element
        );
      } catch {
        return false;
      }
    },
    { identity, target }
  );
}

export function inspectNativePreviewOwnerDocument(): string | null {
  const galleries = document.querySelectorAll('[data-xeg-gallery-container]');
  const panel =
    galleries.length === 1
      ? galleries[0]?.querySelector('[data-gallery-element="tweet-panel"]')
      : null;
  const paths = [...(panel?.querySelectorAll<HTMLAnchorElement>('a[href]') ?? [])].flatMap(
    (anchor) => {
      try {
        const url = new URL(anchor.href, location.href);
        return url.protocol === 'https:' &&
          ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
          !url.username &&
          !url.password &&
          !url.port &&
          !url.search &&
          !url.hash &&
          /^\/[A-Za-z0-9_]{1,15}\/status\/[1-9]\d*$/u.test(url.pathname)
          ? [url.pathname]
          : [];
      } catch {
        return [];
      }
    }
  );
  return paths.length === 1 ? (paths[0] ?? null) : null;
}

export function inspectSelectedGalleryDocument({
  expectedIndex,
  expectedPath,
  allowPhotoFormatVariant = false,
}: {
  expectedIndex: number | null;
  expectedPath: string;
  allowPhotoFormatVariant?: boolean;
}) {
  const galleries = document.querySelectorAll('[data-xeg-gallery-container]');
  const gallery = galleries.length === 1 ? galleries[0] : null;
  const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
  const position = toolbar?.querySelector('#xeg-toolbar-counter[data-gallery-element="position"]');
  const items = [...(gallery?.querySelectorAll('[data-gallery-element="item"]') ?? [])];
  const resolvedIndex = expectedIndex ?? Number(position?.getAttribute('data-position'));
  const selectedItems = items.filter(
    (candidate) => candidate.getAttribute('data-index') === String(resolvedIndex - 1)
  );
  const item = selectedItems.length === 1 ? selectedItems[0] : null;
  if (
    !(gallery instanceof HTMLElement) ||
    !(toolbar instanceof HTMLElement) ||
    !(position instanceof HTMLElement) ||
    !(item instanceof HTMLElement)
  ) {
    return false;
  }

  const total = Number(position.getAttribute('data-total'));
  if (
    !Number.isSafeInteger(resolvedIndex) ||
    resolvedIndex < 1 ||
    !Number.isSafeInteger(total) ||
    total !== items.length ||
    resolvedIndex > total ||
    position.getAttribute('data-position') !== String(resolvedIndex) ||
    position.getAttribute('data-current-index') !== String(resolvedIndex - 1) ||
    position.getAttribute('data-focused-index') !== String(resolvedIndex - 1) ||
    toolbar.getAttribute('data-current-index') !== String(resolvedIndex - 1) ||
    toolbar.getAttribute('data-focused-index') !== String(resolvedIndex - 1)
  ) {
    return false;
  }

  const isVisible = (element: Element) => {
    const style = getComputedStyle(element);
    const rectangle = element.getBoundingClientRect();
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity) !== 0 &&
      rectangle.bottom > 0 &&
      rectangle.top < innerHeight &&
      rectangle.right > 0 &&
      rectangle.left < innerWidth
    );
  };
  const matchingImages = [...gallery.querySelectorAll('[data-gallery-element="item"] img')].filter(
    (candidate) => {
      if (
        !(candidate instanceof HTMLImageElement) ||
        !candidate.complete ||
        candidate.naturalWidth <= 0 ||
        !isVisible(candidate)
      ) {
        return false;
      }
      try {
        const url = new URL(candidate.currentSrc || candidate.src);
        if (url.hostname !== 'pbs.twimg.com') {
          return false;
        }
        if (url.pathname === expectedPath) {
          return true;
        }
        if (!allowPhotoFormatVariant) {
          return false;
        }
        const stem = (path: string) => path.replace(/\.(?:jpe?g|png|webp|gif)$/iu, '');
        return (
          expectedPath.startsWith('/media/') &&
          url.pathname.startsWith('/media/') &&
          stem(url.pathname) === stem(expectedPath)
        );
      } catch {
        return false;
      }
    }
  );
  const selectedImage = matchingImages.length === 1 ? matchingImages[0] : null;
  if (
    item.getAttribute('data-media-loaded') !== 'true' ||
    !isVisible(item) ||
    !(selectedImage instanceof HTMLImageElement) ||
    !item.contains(selectedImage)
  ) {
    return false;
  }
  const source = new URL(selectedImage.currentSrc || selectedImage.src);
  return {
    imageSource: { host: source.hostname, path: source.pathname },
    itemIndex: Number(item.getAttribute('data-index')),
    itemVisible: true,
    positionValue: Number(position.getAttribute('data-position')),
  };
}

export function inspectSelectedGalleryVideoDocument() {
  const galleries = document.querySelectorAll('[data-xeg-gallery-container]');
  const gallery = galleries.length === 1 ? galleries[0] : null;
  const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
  const position = toolbar?.querySelector('#xeg-toolbar-counter[data-gallery-element="position"]');
  const items = [...(gallery?.querySelectorAll('[data-gallery-element="item"]') ?? [])];
  const current = Number(position?.getAttribute('data-current-index'));
  const total = Number(position?.getAttribute('data-total'));
  const item = Number.isSafeInteger(current) && current >= 0 ? items[current] : null;
  const video = item?.querySelector('video');
  if (
    !(gallery instanceof HTMLElement) ||
    !(toolbar instanceof HTMLElement) ||
    !(position instanceof HTMLElement) ||
    !(item instanceof HTMLElement) ||
    !(video instanceof HTMLVideoElement) ||
    !Number.isSafeInteger(total) ||
    total !== items.length ||
    current >= total ||
    position.getAttribute('data-position') !== String(current + 1) ||
    position.getAttribute('data-focused-index') !== String(current) ||
    toolbar.getAttribute('data-current-index') !== String(current) ||
    toolbar.getAttribute('data-focused-index') !== String(current)
  ) {
    return false;
  }
  const style = getComputedStyle(video);
  const rect = video.getBoundingClientRect();
  const visible =
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity) !== 0 &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.top < innerHeight &&
    rect.right > 0 &&
    rect.left < innerWidth;
  let source = null;
  try {
    const url = new URL(video.currentSrc || video.src);
    if (url.protocol === 'https:' && url.hostname === 'video.twimg.com') {
      source = { host: url.hostname, path: url.pathname };
    }
  } catch {
    // An unrecognized or blob-only source cannot establish video identity.
  }
  return {
    index: current,
    position: current + 1,
    total,
    itemLoaded: item.getAttribute('data-media-loaded') === 'true',
    visible,
    source,
    readyState: video.readyState,
    width: video.videoWidth,
    height: video.videoHeight,
    mediaErrorCode: video.error?.code ?? null,
    currentTime: video.currentTime,
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

export function inspectHitTestedVideoActionDocument(
  element: Element,
  { posterPath }: { posterPath: string | null }
) {
  if (!(element instanceof HTMLElement) || typeof document.elementsFromPoint !== 'function') {
    return null;
  }
  const quoteArticle = element.closest('article');
  if (!quoteArticle) {
    return null;
  }
  const scopeCounts = (scope: Element, depth: number) => {
    if (depth > 3) {
      return null;
    }
    const counts = {
      scopeDepth: depth,
      videoCount: 0,
      totalImageCount: 0,
      trustedVideoThumbnailCount: 0,
      ordinaryImageCount: 0,
    };
    const media = [scope, ...scope.querySelectorAll('video, img')];
    for (const node of media) {
      if (node.closest('article') !== quoteArticle) {
        continue;
      }
      if (node instanceof HTMLVideoElement) {
        counts.videoCount = Math.min(counts.videoCount + 1, 20);
        continue;
      }
      if (!(node instanceof HTMLImageElement)) {
        continue;
      }
      counts.totalImageCount = Math.min(counts.totalImageCount + 1, 20);
      let trusted = false;
      try {
        const url = new URL(node.currentSrc || node.src, location.href);
        trusted =
          url.protocol === 'https:' &&
          url.hostname === 'pbs.twimg.com' &&
          /^\/(?:amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|video_thumb)\//u.test(
            url.pathname
          );
      } catch {
        // Count unknown images without retaining their source.
      }
      const key = trusted ? 'trustedVideoThumbnailCount' : 'ordinaryImageCount';
      counts[key] = Math.min(counts[key] + 1, 20);
    }
    return counts;
  };
  if (posterPath) {
    const value =
      element instanceof HTMLImageElement
        ? element.currentSrc || element.src
        : element instanceof HTMLVideoElement
          ? element.poster
          : element.querySelector('video')?.poster ||
            element.querySelector('img')?.currentSrc ||
            element.querySelector('img')?.src;
    try {
      const url = new URL(value ?? '', location.href);
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'pbs.twimg.com' ||
        url.pathname !== posterPath
      ) {
        return null;
      }
    } catch {
      return null;
    }
  }
  const rect = element.getBoundingClientRect();
  const samples: [number, number][] = [
    [0.2, 0.2],
    [0.8, 0.2],
    [0.2, 0.4],
    [0.8, 0.4],
    [0.5, 0.25],
    [0.5, 0.45],
    [0.2, 0.6],
    [0.8, 0.6],
    [0.5, 0.7],
  ];
  let rejectedControls = 0;
  let nativePlay: {
    x: number;
    y: number;
    topTag: string;
    mediaScopeDepth: number;
    scopeCounts: ReturnType<typeof scopeCounts>;
  } | null = null;
  for (const [fx, fy] of samples) {
    const x = Math.round(rect.left + rect.width * fx);
    const y = Math.round(rect.top + rect.height * fy);
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) {
      continue;
    }
    const top = document.elementsFromPoint(x, y)[0];
    if (!top || top.closest('article') !== quoteArticle) {
      continue;
    }
    const control = top.closest(
      'button, [role="button"], input, select, textarea, [data-testid="videoPlayerControls"]'
    );
    if (control) {
      rejectedControls += 1;
      if (!nativePlay && control.matches('button, [role="button"]')) {
        let mediaScope: HTMLElement | null = element;
        for (
          let depth = 0;
          mediaScope && depth <= 5 && mediaScope !== quoteArticle;
          depth += 1, mediaScope = mediaScope.parentElement
        ) {
          if (mediaScope.contains(control)) {
            nativePlay = {
              x,
              y,
              topTag: top.tagName.toLowerCase(),
              mediaScopeDepth: depth,
              scopeCounts: scopeCounts(mediaScope, depth),
            };
            break;
          }
        }
      }
      continue;
    }
    let mediaScope: HTMLElement | null = element;
    for (
      let depth = 0;
      mediaScope && depth <= 3 && mediaScope !== quoteArticle;
      depth += 1, mediaScope = mediaScope.parentElement
    ) {
      if (mediaScope.contains(top)) {
        return {
          inQuote: true,
          x,
          y,
          topTag: top.tagName.toLowerCase(),
          topTestId: [
            'videoPlayer',
            'videoComponent',
            'previewInterstitial',
            'tweetPhoto',
          ].includes(top.getAttribute('data-testid') ?? '')
            ? top.getAttribute('data-testid')
            : null,
          mediaScopeDepth: depth,
          rejectedControls,
          nativePlay,
        };
      }
    }
  }
  return {
    inQuote: false,
    x: null,
    y: null,
    topTag: null,
    topTestId: null,
    mediaScopeDepth: null,
    rejectedControls,
    nativePlay,
  };
}

export function findHitTestedVideoControlDocument(
  element: Element,
  { x, y, posterPath }: { x: number; y: number; posterPath: string | null }
) {
  if (!(element instanceof HTMLElement) || typeof document.elementsFromPoint !== 'function') {
    return null;
  }
  const quoteArticle = element.closest('article');
  if (
    !quoteArticle ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 0 ||
    y < 0 ||
    x >= innerWidth ||
    y >= innerHeight
  ) {
    return null;
  }
  if (posterPath) {
    const value =
      element instanceof HTMLImageElement
        ? element.currentSrc || element.src
        : element instanceof HTMLVideoElement
          ? element.poster
          : element.querySelector('video')?.poster ||
            element.querySelector('img')?.currentSrc ||
            element.querySelector('img')?.src;
    try {
      const url = new URL(value ?? '', location.href);
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'pbs.twimg.com' ||
        url.pathname !== posterPath
      ) {
        return null;
      }
    } catch {
      return null;
    }
  }
  const top = document.elementsFromPoint(x, y)[0];
  if (!top || top.closest('article') !== quoteArticle) {
    return null;
  }
  const control = top.closest('button, [role="button"]');
  if (!(control instanceof HTMLElement)) {
    return null;
  }
  for (
    let scope: HTMLElement | null = element, depth = 0;
    scope && scope !== quoteArticle && depth <= 5;
    scope = scope.parentElement, depth += 1
  ) {
    if (scope.contains(control)) {
      return control;
    }
  }
  return null;
}

export function inspectHostVideoDocument(
  video: Element,
  { posterPath }: { posterPath: string | null }
) {
  if (!(video instanceof HTMLVideoElement) || !video.closest('article')) {
    return null;
  }
  const parsePoster = (value: string) => {
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' &&
        url.hostname === 'pbs.twimg.com' &&
        /^\/(?:amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|video_thumb)\//u.test(
          url.pathname
        )
        ? { host: url.hostname, path: url.pathname }
        : null;
    } catch {
      return null;
    }
  };
  const ownArticle = video.closest('article');
  if (!ownArticle) {
    return null;
  }
  const attributePoster = video.poster ? parsePoster(video.poster) : null;
  const matchingSiblings = [...ownArticle.querySelectorAll('img')].filter(
    (image) =>
      image.closest('article') === ownArticle &&
      parsePoster(image.currentSrc || image.src)?.path === posterPath
  );
  const posterEvidence =
    video.poster && attributePoster?.path !== posterPath
      ? 'conflict'
      : attributePoster?.path === posterPath
        ? 'video-attribute'
        : matchingSiblings.length === 1
          ? 'unique-sibling-image'
          : matchingSiblings.length > 1
            ? 'ambiguous-sibling-images'
            : 'missing';
  const poster =
    ['video-attribute', 'unique-sibling-image'].includes(posterEvidence) && posterPath
      ? { host: 'pbs.twimg.com', path: posterPath }
      : null;
  const sourceValue = video.currentSrc || video.src;
  let sourceKind = 'none';
  let source = null;
  if (sourceValue.startsWith('blob:')) {
    sourceKind = 'blob';
  } else if (sourceValue) {
    try {
      const url = new URL(sourceValue);
      if (url.protocol === 'https:' && url.hostname === 'video.twimg.com') {
        sourceKind = 'trusted-video-cdn';
        source = { host: url.hostname, path: url.pathname };
      } else {
        sourceKind = 'other';
      }
    } catch {
      sourceKind = 'other';
    }
  }
  return {
    poster,
    posterEvidence,
    matchingSiblingCount: Math.min(matchingSiblings.length, 20),
    sourceKind,
    source,
    readyState: video.readyState,
    width: video.videoWidth,
    height: video.videoHeight,
    mediaErrorCode: video.error?.code ?? null,
    currentTime: video.currentTime,
    paused: video.paused,
  };
}

export function quotedVideoHitTestPassed({
  controlledVideoClickMode,
  galleryActionKind,
  initialHit,
  finalHit,
  identityBeforeClick,
  focusPrepared,
  meaningfulFocusTarget,
  focusedControlStillOwnsClick,
}: {
  controlledVideoClickMode: string | null;
  galleryActionKind: string | undefined;
  initialHit: ReturnType<typeof inspectHitTestedVideoActionDocument>;
  finalHit: ReturnType<typeof inspectHitTestedVideoActionDocument>;
  identityBeforeClick: boolean;
  focusPrepared: boolean;
  meaningfulFocusTarget: boolean;
  focusedControlStillOwnsClick: boolean | undefined;
}) {
  if (!identityBeforeClick) {
    return false;
  }
  if (galleryActionKind === 'non-control-media-surface') {
    return initialHit?.inQuote === true && finalHit?.inQuote === true;
  }
  if (
    galleryActionKind !== 'media-scoped-control-under-allow-all' ||
    controlledVideoClickMode !== 'allow-all' ||
    initialHit?.inQuote !== false ||
    finalHit?.inQuote !== false ||
    !focusPrepared ||
    !meaningfulFocusTarget ||
    focusedControlStillOwnsClick !== true
  ) {
    return false;
  }
  return [initialHit.nativePlay, finalHit.nativePlay].every(
    (control) =>
      control &&
      Number.isFinite(control.x) &&
      Number.isFinite(control.y) &&
      Number.isInteger(control.mediaScopeDepth) &&
      control.mediaScopeDepth >= 0 &&
      control.mediaScopeDepth <= 5
  );
}

export function captureActivationFocusDocument(
  surface: Element,
  { articleIndex, point }: { articleIndex: number; point: { x: number; y: number } }
) {
  const article = document.querySelectorAll('article')[articleIndex];
  const state: { focus: HTMLElement | null; captured: boolean } = { focus: null, captured: false };
  const onClick = (event: MouseEvent) => {
    if (
      state.captured ||
      !event.isTrusted ||
      event.button !== 0 ||
      Math.abs(event.clientX - point.x) > 1 ||
      Math.abs(event.clientY - point.y) > 1 ||
      !(event.target instanceof Element) ||
      !article?.contains(surface) ||
      !surface.contains(event.target) ||
      !article.contains(event.target)
    ) {
      return;
    }
    const focused = document.activeElement;
    if (
      !(focused instanceof HTMLElement) ||
      !focused.isConnected ||
      !article.contains(focused) ||
      ['BODY', 'HTML'].includes(focused.tagName)
    ) {
      return;
    }
    state.focus = focused;
    state.captured = true;
  };
  window.addEventListener('click', onClick, true);
  return {
    get focus() {
      return state.focus;
    },
    get captured() {
      return state.captured;
    },
    dispose() {
      window.removeEventListener('click', onClick, true);
    },
  };
}

export function findActivationHitDocument(
  surface: Element,
  { articleIndex, point }: { articleIndex: number; point: { x: number; y: number } }
) {
  const article = document.querySelectorAll('article')[articleIndex];
  const top = document.elementsFromPoint(point.x, point.y)[0];
  if (
    !(top instanceof Element) ||
    !article?.contains(surface) ||
    !article.contains(top) ||
    surface.closest('article') !== top.closest('article')
  ) {
    return null;
  }
  if (surface === top || surface.contains(top)) {
    return top;
  }
  if (surface.matches('button, [role="button"]')) {
    return null;
  }
  const mediaShell = surface.closest(
    '[data-testid="videoPlayer"], [data-testid="previewInterstitial"]'
  );
  return mediaShell?.contains(top) ? top : null;
}

export function quotedVideoSurface(
  target: Pick<
    QuoteTarget,
    'playerIndex' | 'previewIndex' | 'posterIndex' | 'videoIndex' | 'hitKind'
  >
) {
  if (target.playerIndex >= 0) {
    return { selector: '[data-testid="videoPlayer"]', index: target.playerIndex };
  }
  if (target.previewIndex >= 0) {
    return { selector: '[data-testid="previewInterstitial"]', index: target.previewIndex };
  }
  // Playback can remove the sibling poster while retaining the identified video.
  if (target.hitKind === 'video' && target.videoIndex >= 0) {
    return { selector: 'video', index: target.videoIndex };
  }
  if (target.posterIndex >= 0) {
    return { selector: 'img', index: target.posterIndex };
  }
  return { selector: 'video', index: target.videoIndex };
}

async function observeQuotedVideo(
  page: Page,
  observation: LiveObservation,
  identity: Identity,
  output: string,
  index: string | number,
  settleApi: () => Promise<void>,
  controlledVideoClickMode: string | null
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
    const playback = {
      startTime,
      endTime: afterPlayback?.currentTime ?? null,
      progressed: Boolean(afterPlayback && afterPlayback.currentTime >= startTime + 0.15),
    };
    observation.gallery.playback = playback;
    await settleApi();
    const owner = quotedOwnerForSource(
      observation.api.observations,
      identity.statusId,
      afterPlayback?.source
    );
    observation.gallery.owner = owner;
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
      directQuotedOwner:
        owner.status === 'matched-direct-quote-variant' &&
        (target.quoteStatusIds.length === 0 ||
          (typeof owner.ownerId === 'string' && target.quoteStatusIds.includes(owner.ownerId))),
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
  settleApi: () => Promise<void>
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

async function observeOne(
  context: BrowserContext,
  extensionId: string,
  targetUrl: string,
  output: string,
  index: string | number,
  controlledVideoClickMode: string | null = null,
  verifyControlledMode: (() => Promise<string | null>) | null = null
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
    videoClickMode: controlledVideoClickMode ?? 'default',
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
  const settleApi = attachDiagnostics(page, observation);
  let actionHandle: ElementHandle<SVGElement | HTMLElement> | null | undefined;
  try {
    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    observation.responseStatus = response?.status() ?? null;
    observation.finalUrl = sanitizedUrl(page.url());
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
    observation.target = readiness.target;
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
    if (controlledVideoClickMode === 'allow-all') {
      observation.extension.storedModeAfterReadiness = (await verifyControlledMode?.()) ?? null;
      if (observation.extension.storedModeAfterReadiness !== 'allow-all') {
        throw new Error('Controlled video click mode was not observed after live-page readiness');
      }
    }

    if (observation.target.kind === 'quoted-video') {
      await observeQuotedVideo(
        page,
        observation,
        identity,
        output,
        index,
        settleApi,
        controlledVideoClickMode
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
      await observeNativePreviewPhoto(
        page,
        observation,
        identity,
        observation.target,
        output,
        index,
        settleApi
      );
      observation.status = 'core-flow-observed';
      return observation;
    }

    const article = page.locator('article').nth(observation.target.articleIndex);
    const image = article.locator('img').nth(observation.target.imageIndex);
    await image.scrollIntoViewIfNeeded({ timeout: ACTION_TIMEOUT_MS });
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
    const action = article.locator('a[href]').nth(actionIdentity.actionIndex);
    actionHandle = await action.elementHandle();
    if (!actionHandle) {
      throw new Error('Selected target action detached before interaction');
    }
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

    if (compactQuote) {
      const refreshedAction = await inspectHitTestedAction(image, identity, observation.target);
      if (
        !refreshedAction ||
        refreshedAction.actionIndex !== actionIdentity.actionIndex ||
        refreshedAction.actionPath !== actionIdentity.actionPath
      ) {
        throw new Error('Compact quote owner or image changed before click');
      }
    }

    const identityBeforeClick = await actionHandle.evaluate(
      (element, expected) => {
        const article = element.closest('article');
        if (!(element instanceof HTMLAnchorElement) || !article) {
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
      { actionPath: observation.target.actionPath }
    );
    observation.gallery.identityBeforeClick = identityBeforeClick;
    if (!identityBeforeClick) {
      throw new Error('Top media action identity changed before click');
    }

    await recordHostGeometry('before-click');
    await actionHandle.click({ timeout: ACTION_TIMEOUT_MS });
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT_MS });
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
        Object.assign(observation, classifyLiveHostDiagnostics(observation));
      }
    }
    if (
      observation.target?.kind === 'native-preview-photo' &&
      observation.status === 'core-flow-observed'
    ) {
      refreshNativePreviewObservation(observation);
    }
    if (actionHandle) {
      await actionHandle.dispose().catch(() => {});
    }
    observation.finalUrl = sanitizedUrl(page.url());
    await writeFile(join(output, `live-page-${index}.json`), JSON.stringify(observation, null, 2));
    await page.close().catch(() => {});
  }
  return observation;
}

export function decodeStoredValue(raw: unknown): unknown {
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
    return parsed.value;
  }
  return parsed;
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
  const prior = await extensionPage.evaluate(async (storageKey) => {
    const values = await chrome.storage.local.get(storageKey);
    return { exists: Object.hasOwn(values, storageKey), value: values[storageKey] ?? null };
  }, key);
  return { ...prior, settings: decodeStoredValue(prior.value) };
}

export async function restoreStoredVideoSettings(
  extensionPage: Page,
  previous: Pick<StorageRecord, 'exists' | 'value'>
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
  return extensionPage.evaluate(
    async ({ storageKey, previous }) => {
      const values = await chrome.storage.local.get(storageKey);
      return (
        Object.hasOwn(values, storageKey) === previous.exists &&
        (!previous.exists || JSON.stringify(values[storageKey]) === JSON.stringify(previous.value))
      );
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
  index: number
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
      async ({ storageKey, value }) => {
        await chrome.storage.local.set({ [storageKey]: value });
      },
      { storageKey: key, value: next }
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
      async () => storedVideoClickMode((await readStoredVideoSettings(extensionPage)).settings)
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
}: {
  context: BrowserContext;
  extensionId: string;
  liveUrls: unknown;
  output: string;
}) {
  const urls = validateLiveUrls(liveUrls);
  if (!urls.length) {
    return { status: 'not-requested', evidenceStatus: 'not-applicable', pages: [] };
  }
  const pages: LiveObservation[] = [];
  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    if (!url) {
      continue;
    }
    const page = await observeOne(context, extensionId, url, output, index + 1);
    if (page.classification === 'native-play-observed-gallery-action-unavailable') {
      page.controlledProbe = await observeControlledVideoMode(
        context,
        extensionId,
        url,
        output,
        index + 1
      ).catch((error) => ({
        status: 'failed',
        error: safeError(error),
        cleanup: { restored: false, extensionPageClosed: false },
      }));
    }
    pages.push(page);
  }
  const passedPage = (page: LiveObservation) =>
    page.status === 'core-flow-observed' ||
    (page.controlledProbe?.observation?.status === 'core-flow-observed' &&
      page.controlledProbe?.cleanup?.restored === true);
  const failed = pages.filter((page) => !passedPage(page));
  const controlled = pages.some(
    (page) => page.controlledProbe?.observation?.status === 'core-flow-observed'
  );
  const summary = {
    status: failed.length
      ? 'failed'
      : controlled
        ? 'controlled-flow-observed'
        : 'core-flow-observed',
    evidenceStatus: pages.every(
      (page) =>
        passedPage(page) &&
        (page.status === 'core-flow-observed'
          ? page.evidenceStatus
          : page.controlledProbe?.observation?.evidenceStatus) === 'observed'
    )
      ? 'observed'
      : 'unverified',
    pages,
  };
  await writeFile(join(output, 'live-observations.json'), JSON.stringify(summary, null, 2));
  if (failed.length) {
    const error = new AggregateError(
      failed.map(
        (page) =>
          new Error(
            page.controlledProbe?.error ?? page.controlledProbe?.observation?.error ?? page.error
          )
      ),
      `${failed.length} live X observation(s) missed required assertions`
    );
    throw Object.assign(error, { summary });
  }
  return summary;
}
