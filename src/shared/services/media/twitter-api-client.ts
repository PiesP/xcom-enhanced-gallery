// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Twitter Video Extractor - GraphQL API Integration
 * @description Facade for Twitter API interactions, delegating to specialized services.
 */

import { buildTweetResultByRestIdUrl, TWITTER_API_CONFIG } from '@shared/core/twitter-api/endpoint';
import { logger } from '@shared/logging/logger';
import { getHttpRequestService } from '@shared/services/http-request-service';
import {
  getCsrfTokenAsync,
  resolveBearerToken,
} from '@shared/services/media/twitter-auth/twitter-auth';
import {
  extractMediaFromTweet,
  normalizeLegacyTweet,
  normalizeLegacyUser,
} from '@shared/services/media/twitter-parser/twitter-response-parser';
import type {
  TweetMediaEntry,
  TwitterAPIResponse,
  TwitterTweet,
} from '@shared/services/media/types';
import { sortMediaByVisualOrder } from '@shared/utils/media/media-dimensions';

/** An attempted transport or provider failure, distinct from local extraction. */
export class TwitterAPIRequestError extends Error {
  constructor(
    message: string,
    cause?: unknown,
    readonly category:
      | 'denied'
      | 'unreadable'
      | 'rate-limited'
      | 'deferred'
      | 'provider-error'
      | 'mismatch'
      | 'transport' = 'transport',
    readonly retryAfterMs?: number,
    readonly status?: number,
    readonly readable?: boolean
  ) {
    super(message, { cause });
    this.name = 'TwitterAPIRequestError';
  }
}

/** One physical request can serve several independently cancelled clicks. */
export interface TweetMetadataResult {
  readonly entries: TweetMediaEntry[];
  readonly physicalRequestToken?: object;
}

export class TweetMetadataRequestError extends TwitterAPIRequestError {
  constructor(
    error: TwitterAPIRequestError,
    readonly physicalRequestToken: object
  ) {
    super(
      error.message,
      error.cause,
      error.category,
      error.retryAfterMs,
      error.status,
      error.readable
    );
  }
}

interface ApiRequestContext {
  readonly authorization: string;
  readonly csrfToken: string;
  readonly origin: string | undefined;
  readonly href: string | undefined;
}

// ============================================================================
// Location Config (injected for referential transparency / testability)
// ============================================================================

/** Location properties used by the Twitter API client. */
export interface LocationConfig {
  readonly hostname: string | undefined;
  readonly href: string | undefined;
  readonly origin: string | undefined;
}

/** Resolve location info from globalThis.location (browser default). */
function resolveLocationConfig(): LocationConfig {
  const loc = typeof globalThis !== 'undefined' ? globalThis.location : undefined;
  return {
    hostname: loc?.hostname,
    href: loc?.href,
    origin: loc?.origin,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function resolveTwitterApiHost(
  hostname: string | null | undefined,
  supportedHosts: readonly string[],
  defaultHost: string
): string {
  if (!hostname) return defaultHost;

  const normalized = hostname.toLowerCase();

  for (const host of supportedHosts) {
    if (normalized === host || normalized.endsWith(`.${host}`)) {
      return host;
    }
  }
  return defaultHost;
}

function getSafeHost(location?: LocationConfig): string {
  const loc = location ?? resolveLocationConfig();
  return resolveTwitterApiHost(
    loc.hostname,
    TWITTER_API_CONFIG.SUPPORTED_HOSTS,
    TWITTER_API_CONFIG.DEFAULT_HOST
  );
}

function createTweetEndpointUrl(tweetId: string, location?: LocationConfig): string {
  const host = getSafeHost(location);

  const variables = {
    tweetId,
    withCommunity: false,
    includePromotedContent: false,
    withVoice: false,
  };

  return buildTweetResultByRestIdUrl({
    host,
    queryId: TWITTER_API_CONFIG.TWEET_RESULT_BY_REST_ID_QUERY_ID,
    variables,
    features: {
      creator_subscriptions_tweet_preview_api_enabled: true,
      premium_content_api_read_enabled: false,
      communities_web_enable_tweet_community_results_fetch: true,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      responsive_web_grok_analyze_button_fetch_trends_enabled: false,
      responsive_web_grok_analyze_post_followups_enabled: false,
      responsive_web_jetfuel_frame: false,
      responsive_web_grok_share_attachment_enabled: true,
      articles_preview_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      responsive_web_grok_show_grok_translated_post: false,
      responsive_web_grok_analysis_button_from_backend: false,
      creator_subscriptions_quote_tweet_preview_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      profile_label_improvements_pcf_label_in_post_enabled: true,
      rweb_tipjar_consumption_enabled: true,
      verified_phone_label_enabled: false,
      responsive_web_grok_image_annotation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_enhance_cards_enabled: false,
    } as const,
    fieldToggles: {
      withArticleRichContentState: true,
      withArticlePlainText: false,
      withGrokAnalyze: false,
      withDisallowedReplyControls: false,
    } as const,
  });
}

function unwrapTweet(input: TwitterTweet): TwitterTweet | null {
  let result = input;
  // Support at most two TweetWithVisibilityResults wrappers, including legacy
  // untagged { tweet } envelopes. Never traverse quoted_status_result here.
  for (let depth = 0; depth <= 2; depth += 1) {
    if (!result || typeof result !== 'object' || Array.isArray(result)) return null;
    if (result.tweet === undefined) {
      return result.__typename === undefined ||
        result.__typename === 'Tweet' ||
        result.__typename === 'TweetUnavailable' ||
        result.__typename === 'TweetTombstone'
        ? result
        : null;
    }
    if (
      depth === 2 ||
      (result.__typename !== undefined && result.__typename !== 'TweetWithVisibilityResults')
    )
      return null;
    result = result.tweet;
  }
  return null;
}

function numericTweetId(tweet: TwitterTweet): string | null {
  const ids = [tweet.rest_id, tweet.id_str, tweet.legacy?.id_str].filter((id) => id !== undefined);
  if (
    ids.some((id) => typeof id !== 'string' || !/^[1-9]\d*$/u.test(id)) ||
    new Set(ids).size !== 1
  )
    return null;
  return ids[0] ?? null;
}

function noApiMedia(json: TwitterAPIResponse): TweetMediaEntry[] {
  // An unavailable-looking result must not conceal provider errors. Usable
  // partial-data responses still pass through normal parsing and ownership.
  if (json.errors?.length) {
    throw new TwitterAPIRequestError(
      'Twitter API returned a provider error',
      undefined,
      'provider-error'
    );
  }
  return [];
}

async function resolveRequestContext(location?: LocationConfig): Promise<ApiRequestContext> {
  const loc = location ?? resolveLocationConfig();
  const csrfToken = (await getCsrfTokenAsync()) ?? '';
  return {
    authorization: resolveBearerToken(),
    csrfToken,
    origin: loc.origin,
    href: loc.href,
  };
}

function safeRetryAfter(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 86_400_000
    ? value
    : undefined;
}

function classifyHttpFailure(
  status: number,
  readable: boolean | undefined,
  category: unknown,
  retryAfterMs?: number
): TwitterAPIRequestError['category'] {
  if (status === 429) return 'rate-limited';
  if (status === 401 || status === 403) return 'denied';
  if (category === 'timeout' || category === 'network') return 'transport';
  if (readable === false || category === 'unreadable') return 'unreadable';
  if (retryAfterMs !== undefined && (status === 408 || status === 425 || status >= 500))
    return 'deferred';
  return 'transport';
}

function transportError(error: unknown): TwitterAPIRequestError {
  const candidate =
    error instanceof Error
      ? (error as Error & {
          readonly status?: unknown;
          readonly readable?: unknown;
          readonly category?: unknown;
          readonly retryAfterMs?: unknown;
        })
      : null;
  const status =
    typeof candidate?.status === 'number' &&
    Number.isInteger(candidate.status) &&
    candidate.status >= 100 &&
    candidate.status <= 599
      ? candidate.status
      : 0;
  const readable = typeof candidate?.readable === 'boolean' ? candidate.readable : undefined;
  const retryAfterMs = safeRetryAfter(candidate?.retryAfterMs);
  const category = classifyHttpFailure(status, readable, candidate?.category, retryAfterMs);
  return new TwitterAPIRequestError(
    'Twitter API transport failed',
    error,
    category,
    retryAfterMs,
    status,
    readable
  );
}

async function apiRequest(
  url: string,
  location?: LocationConfig,
  signal?: AbortSignal,
  context?: ApiRequestContext
): Promise<TwitterAPIResponse> {
  const requestContext = context ?? (await resolveRequestContext(location));

  const headers = new Headers({
    authorization: requestContext.authorization,
    'x-csrf-token': requestContext.csrfToken,
    'x-twitter-client-language': 'en',
    'x-twitter-active-user': 'yes',
    'content-type': 'application/json',
    'x-twitter-auth-type': 'OAuth2Session',
  });

  if (requestContext.href) {
    headers.append('referer', requestContext.href);
  }
  if (requestContext.origin) {
    headers.append('origin', requestContext.origin);
  }

  const httpService = getHttpRequestService();
  const response = await httpService
    .get<TwitterAPIResponse>(url, {
      headers: Object.fromEntries(headers.entries()),
      responseType: 'json',
      ...(signal ? { signal } : {}),
    })
    .catch((error: unknown) => {
      if (
        signal?.aborted ||
        ((error instanceof Error || error instanceof DOMException) && error.name === 'AbortError')
      )
        throw error;
      throw transportError(error);
    });

  if (!response.ok) {
    const status =
      Number.isInteger(response.status) && response.status >= 100 && response.status <= 599
        ? response.status
        : 'invalid';
    if (__DEV__) {
      logger.warn('Twitter API request failed', { status });
    }
    const metadata = response as typeof response & {
      readonly readable?: boolean;
      readonly retryAfterMs?: number;
      readonly errorCategory?: string;
    };
    const retryAfterMs = safeRetryAfter(metadata.retryAfterMs);
    throw new TwitterAPIRequestError(
      `TW:${status}`,
      undefined,
      classifyHttpFailure(response.status, metadata.readable, metadata.errorCategory, retryAfterMs),
      retryAfterMs,
      typeof status === 'number' ? status : undefined,
      metadata.readable
    );
  }

  const json = response.data;
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new TwitterAPIRequestError('Twitter API response unreadable', undefined, 'unreadable');
  }
  // Successful responses without media are not outages. Provider error responses are.
  if (json.errors?.length && !json.data?.tweetResult?.result) {
    throw new TwitterAPIRequestError(
      'Twitter API returned a provider error',
      undefined,
      'provider-error'
    );
  }

  if (__DEV__ && json.errors && json.errors.length > 0) {
    logger.warn('Twitter API returned provider errors', {
      count: json.errors.length,
      codes: json.errors
        .slice(0, 8)
        .map((error) => (Number.isSafeInteger(error?.code) ? error.code : 'invalid')),
    });
  }

  return json;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get Tweet Medias - Main API Entry Point
 */
export async function getTweetMedias(
  tweetId: string,
  location?: LocationConfig,
  signal?: AbortSignal,
  context?: ApiRequestContext
): Promise<TweetMediaEntry[]> {
  const url = createTweetEndpointUrl(tweetId, location);
  const json = await apiRequest(url, location, signal, context);

  if (json.data?.tweetResult?.result == null) return noApiMedia(json);

  const root = unwrapTweet(json.data.tweetResult.result);
  if (!root) {
    throw new TwitterAPIRequestError(
      'Twitter API returned an unexpected tweet owner',
      undefined,
      'mismatch'
    );
  }
  const rootId = numericTweetId(root);
  if (root.__typename === 'TweetUnavailable' || root.__typename === 'TweetTombstone') {
    const hasId = [root.rest_id, root.id_str, root.legacy?.id_str].some((id) => id !== undefined);
    if (hasId && rootId !== tweetId) {
      throw new TwitterAPIRequestError(
        'Twitter API returned an unexpected tweet owner',
        undefined,
        'mismatch'
      );
    }
    return noApiMedia(json);
  }
  if (!rootId || rootId !== tweetId) {
    throw new TwitterAPIRequestError(
      'Twitter API returned an unexpected tweet owner',
      undefined,
      'mismatch'
    );
  }
  const tweetResult = normalizeLegacyTweet(root);

  let tweetUser = tweetResult.core?.user_results?.result;

  if (!tweetUser) return noApiMedia(json);
  tweetUser = normalizeLegacyUser(tweetUser);

  let result = extractMediaFromTweet(tweetResult, tweetUser, 'original');

  result = sortMediaByVisualOrder(result);

  if (tweetResult.quoted_status_result?.result) {
    const quote = unwrapTweet(tweetResult.quoted_status_result.result);
    const quotedId = quote && numericTweetId(quote);
    const quotedTweet = quote && normalizeLegacyTweet(quote);
    let quotedUser = quotedTweet?.core?.user_results?.result;
    if (
      quotedTweet &&
      quotedId &&
      quotedId !== rootId &&
      quotedUser &&
      quotedTweet.__typename !== 'TweetUnavailable' &&
      quotedTweet.__typename !== 'TweetTombstone'
    ) {
      quotedUser = normalizeLegacyUser(quotedUser);

      const quotedMedia = extractMediaFromTweet(quotedTweet, quotedUser, 'quoted')
        .filter((media) => media.tweet_id === quotedId)
        .map((media) => ({ ...media, quoteParentTweetId: rootId, quotedTweetId: quotedId }));

      const sortedQuotedMedia = sortMediaByVisualOrder(quotedMedia);

      const adjustedResult = result.map((media) => ({
        ...media,
        index: media.index + sortedQuotedMedia.length,
      }));

      result = [...sortedQuotedMedia, ...adjustedResult];
    }
  }
  return result.length ? result : noApiMedia(json);
}

interface MetadataFlight {
  readonly controller: AbortController;
  readonly token: object;
  readonly promise: Promise<TweetMediaEntry[]>;
  readonly pageHref?: string;
  waiters: number;
}

interface CachedMetadata {
  readonly entries: TweetMediaEntry[];
  readonly expiresAt: number;
}

/** Page-scoped reuse of normalized provider media. Selection remains caller-owned. */
export class TweetMetadataReuse {
  private static readonly TTL_MS = 5_000;
  private static readonly MAX_CACHE_ENTRIES = 4;
  private static readonly MAX_FLIGHTS = 8;
  private static readonly MAX_MEDIA = 32;
  private static readonly MAX_JSON_CHARS = 64_000;

  private readonly flights = new Map<string, MetadataFlight>();
  private readonly cache = new Map<string, CachedMetadata>();
  private context: ApiRequestContext | null = null;
  private disposed = false;

  private sameContext(next: ApiRequestContext): boolean {
    const previous = this.context;
    return (
      !!previous &&
      previous.authorization === next.authorization &&
      previous.csrfToken === next.csrfToken &&
      previous.origin === next.origin &&
      previous.href === next.href
    );
  }

  /** Explicit refresh, navigation or authentication-context change. */
  invalidate(): void {
    this.cache.clear();
    for (const flight of this.flights.values()) flight.controller.abort();
    this.flights.clear();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.invalidate();
    this.context = null;
  }

  async get(
    tweetId: string,
    location?: LocationConfig,
    signal?: AbortSignal
  ): Promise<TweetMetadataResult> {
    if (this.disposed || signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const resolvedLocation = location ?? resolveLocationConfig();
    const nextContext = await resolveRequestContext(resolvedLocation);
    if (this.disposed || signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (this.context && !this.sameContext(nextContext)) this.invalidate();
    this.context = nextContext;

    // The endpoint URL contains the operation, feature contract and tweet ID.
    // Authentication values only participate in private equality comparisons.
    const key = createTweetEndpointUrl(tweetId, resolvedLocation);
    const cached = this.cache.get(key);
    if (cached) {
      if (cached.expiresAt > performance.now()) {
        return { entries: structuredClone(cached.entries) };
      }
      this.cache.delete(key);
    }

    let flight = this.flights.get(key);
    if (!flight) {
      if (this.flights.size >= TweetMetadataReuse.MAX_FLIGHTS) {
        throw new TwitterAPIRequestError(
          'Metadata request capacity reached',
          undefined,
          'deferred'
        );
      }
      const controller = new AbortController();
      const token = {};
      const request = getTweetMedias(tweetId, resolvedLocation, controller.signal, nextContext);
      const candidate: MetadataFlight = {
        controller,
        token,
        waiters: 0,
        ...(location === undefined && resolvedLocation.href !== undefined
          ? { pageHref: resolvedLocation.href }
          : {}),
        promise: request
          .then(
            (entries) => {
              if (this.flights.get(key) === candidate && candidate.waiters > 0) {
                this.remember(key, entries);
              }
              return entries;
            },
            (error: unknown) => {
              if (error instanceof TwitterAPIRequestError) {
                throw new TweetMetadataRequestError(error, token);
              }
              throw error;
            }
          )
          .finally(() => {
            if (this.flights.get(key) === candidate) this.flights.delete(key);
          }),
      };
      flight = candidate;
      this.flights.set(key, flight);
      // The last subscriber may abort during dispatch, before awaitFlight can
      // attach its handlers. Keep a rejected orphan observed without changing
      // the failure delivered to remaining subscribers.
      void flight.promise.catch(() => undefined);
    }
    return this.awaitFlight(key, flight, signal);
  }

  private remember(key: string, entries: TweetMediaEntry[]): void {
    if (
      entries.length === 0 ||
      entries.length > TweetMetadataReuse.MAX_MEDIA ||
      entries.every((entry) => entry.availability === 'unsupported-hls')
    )
      return;
    // Oversized results still serve the current click without entering the cache.
    const serialized = JSON.stringify(entries);
    if (serialized.length > TweetMetadataReuse.MAX_JSON_CHARS) return;
    const copy = structuredClone(entries);
    this.cache.delete(key);
    this.cache.set(key, {
      entries: copy,
      expiresAt: performance.now() + TweetMetadataReuse.TTL_MS,
    });
    while (this.cache.size > TweetMetadataReuse.MAX_CACHE_ENTRIES) {
      this.cache.delete(this.cache.keys().next().value!);
    }
  }

  private awaitFlight(
    key: string,
    flight: MetadataFlight,
    signal?: AbortSignal
  ): Promise<TweetMetadataResult> {
    flight.waiters++;
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (): boolean => {
        if (settled) return false;
        settled = true;
        signal?.removeEventListener('abort', onAbort);
        flight.controller.signal.removeEventListener('abort', onAbort);
        flight.waiters--;
        if (flight.waiters === 0) {
          if (this.flights.get(key) === flight) this.flights.delete(key);
          flight.controller.abort();
        }
        return true;
      };
      const onAbort = (): void => {
        if (finish()) reject(new DOMException('Aborted', 'AbortError'));
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      flight.controller.signal.addEventListener('abort', onAbort, { once: true });
      if (signal?.aborted || flight.controller.signal.aborted) {
        onAbort();
        return;
      }
      void flight.promise.then(
        (entries) => {
          const wasAborted = flight.controller.signal.aborted;
          if (!finish()) return;
          if (
            wasAborted ||
            this.disposed ||
            (flight.pageHref !== undefined && flight.pageHref !== resolveLocationConfig().href)
          ) {
            reject(new DOMException('Aborted', 'AbortError'));
          } else {
            resolve({ entries: structuredClone(entries), physicalRequestToken: flight.token });
          }
        },
        (error: unknown) => {
          const wasAborted = flight.controller.signal.aborted;
          if (finish()) reject(wasAborted ? new DOMException('Aborted', 'AbortError') : error);
        }
      );
    });
  }
}
