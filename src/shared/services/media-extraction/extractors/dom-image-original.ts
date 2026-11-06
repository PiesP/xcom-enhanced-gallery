// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { getHttpRequestAdapter } from '@platform/index';
import { safeHeadContentType } from '@platform/http-response-metadata';
import type { HttpRequestResponse } from '@platform/types';
import { DOWNLOAD_LIVE_BYTE_LIMIT } from '@shared/services/download/live-byte-budget';
import type { MediaInfo } from '@shared/types/media.types';
import { normalizeOriginalImageUrl } from '@shared/utils/media/media-source';

const PROBE_TIMEOUT_MS = 1_500;

type ProbeFormat = 'webp' | 'jpg' | 'png';
type ProbeOutcome = {
  readonly url: string;
  readonly status: number | null;
  readonly mime: string | null;
  readonly sameSource: boolean;
};

function contentType(headers: string): string | null {
  const line = safeHeadContentType(headers);
  const mime = line ? line.slice('Content-Type: '.length) : null;
  return mime && /^image\/(?:webp|jpeg|png)$/u.test(mime) ? mime : null;
}

function probe(url: string, signal?: AbortSignal): Promise<ProbeOutcome> {
  if (signal?.aborted) {
    return Promise.resolve({ url, status: null, mime: null, sameSource: false });
  }
  return new Promise((resolve) => {
    let settled = false;
    let control: { abort(): void } | undefined;
    const timer = setTimeout(() => onAbort(), PROBE_TIMEOUT_MS);
    const finish = (response?: HttpRequestResponse): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve({
        url,
        status: response?.status ?? null,
        mime: response ? contentType(response.responseHeaders) : null,
        sameSource: response?.finalUrl === url,
      });
    };
    const onAbort = (): void => {
      try {
        control?.abort();
      } catch {
        // A broken adapter must not strand a pending source decision.
      } finally {
        finish();
      }
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) {
      onAbort();
      return;
    }
    try {
      control = getHttpRequestAdapter().request({
        method: 'HEAD',
        url,
        responseType: 'text',
        // HEAD has no body; retain the application's existing advertised-size ceiling.
        maxResponseBytes: DOWNLOAD_LIVE_BYTE_LIMIT,
        timeout: PROBE_TIMEOUT_MS,
        onload: finish,
        onerror: () => finish(),
        onabort: () => finish(),
        ontimeout: () => finish(),
      });
      if (signal?.aborted) {
        control.abort();
      }
    } catch {
      finish();
    }
  });
}

export function getDomImageOriginalProbeUrl(media: MediaInfo): string | null {
  if (
    media.type !== 'image' ||
    media.downloadSource?.quality !== 'cdn-original' ||
    media.downloadSource.provenance !== 'dom'
  ) {
    return null;
  }
  const normalized = normalizeOriginalImageUrl(media.downloadSource.url);
  if (normalized !== media.downloadSource.url) {
    return null;
  }
  const parsed = new URL(normalized);
  if (
    parsed.hostname !== 'pbs.twimg.com' ||
    !/^\/media\/[^/.:]+$/u.test(parsed.pathname) ||
    parsed.searchParams.get('format') !== 'webp' ||
    parsed.searchParams.get('name') !== 'orig'
  ) {
    return null;
  }
  return parsed.href;
}

/** Confirm the original of an extensionless DOM WebP before planning a save. */
export async function resolveDomImageOriginal(
  media: MediaInfo,
  signal?: AbortSignal
): Promise<MediaInfo> {
  const original = getDomImageOriginalProbeUrl(media);
  if (!original) {
    return media;
  }

  const attempts: ProbeOutcome[] = [];
  let selected: string | null = null;
  const candidate = new URL(original);
  for (const format of ['webp', 'jpg', 'png'] as const satisfies readonly ProbeFormat[]) {
    candidate.searchParams.set('format', format);
    const outcome = await probe(candidate.href, signal);
    attempts.push(outcome);
    if (signal?.aborted) {
      break;
    }
    const expectedMime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    if (outcome.sameSource && outcome.status === 200 && outcome.mime === expectedMime) {
      selected = outcome.url;
      break;
    }
    // Only a missing original justifies trying another encoding.
    if (!outcome.sameSource || (outcome.status !== 404 && outcome.status !== 410)) {
      break;
    }
  }

  return {
    ...media,
    originalUrl: selected || original,
    downloadSource: selected
      ? { url: selected, quality: 'cdn-original', provenance: 'dom' }
      : { url: '', quality: 'unverified-original', provenance: 'dom' },
    metadata: {
      ...media.metadata,
      originalSourceResolution: {
        requestedUrl: original,
        selectedUrl: selected,
        attempts: attempts.map(({ url, status, mime }) => ({ url, status, mime })),
      },
    },
  };
}

/** Preserve an observed photo without authorizing an unprobed original save. */
export function markDomImageOriginalProbeLimit(media: MediaInfo, original: string): MediaInfo {
  return {
    ...media,
    originalUrl: original,
    downloadSource: { url: '', quality: 'unverified-original', provenance: 'dom' },
    metadata: {
      ...media.metadata,
      originalSourceResolution: {
        requestedUrl: original,
        selectedUrl: null,
        attempts: [],
        reason: 'probe-limit',
      },
    },
  };
}
