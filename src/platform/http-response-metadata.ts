// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import type { HttpErrorCategory, HttpRequestResponse } from './types';

/** Saturation is above the 90-second interactive budget; it never schedules an early retry. */
export const MAX_RETRY_AFTER_MS = 24 * 60 * 60 * 1000;
const MAX_RETRY_AFTER_CHARS = 128;
const MAX_RAW_HEADERS_CHARS = 8192;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LONG_WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function httpDateMs(value: string, nowMs: number): number | undefined {
  const imf =
    /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat), (\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{2}):(\d{2}):(\d{2}) GMT$/.exec(
      value
    );
  const rfc850 =
    /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), (\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2}) (\d{2}):(\d{2}):(\d{2}) GMT$/.exec(
      value
    );
  const asctime =
    /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( [1-9]|[12]\d|3[01]) (\d{2}):(\d{2}):(\d{2}) (\d{4})$/.exec(
      value
    );
  if (!imf && !rfc850 && !asctime) return undefined;

  const month = MONTHS.indexOf((asctime ? asctime[2] : (imf?.[3] ?? rfc850?.[3])) ?? '');
  const day = Number(asctime ? asctime[3] : (imf?.[2] ?? rfc850?.[2]));
  const hour = Number(asctime ? asctime[4] : (imf?.[5] ?? rfc850?.[5]));
  const minute = Number(asctime ? asctime[5] : (imf?.[6] ?? rfc850?.[6]));
  const second = Number(asctime ? asctime[6] : (imf?.[7] ?? rfc850?.[7]));
  if (
    month < 0 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 60 ||
    (second === 60 && (hour !== 23 || minute !== 59))
  )
    return undefined;
  const representableSecond = Math.min(second, 59);

  let year = Number(asctime ? asctime[7] : (imf?.[4] ?? rfc850?.[4]));
  if (rfc850) {
    const currentYear = new Date(nowMs).getUTCFullYear();
    year += Math.floor(currentYear / 100) * 100;
    if (year < currentYear - 50) year += 100;
    const futureLimit = new Date(nowMs);
    futureLimit.setUTCFullYear(currentYear + 50);
    const candidate = new Date(0);
    candidate.setUTCFullYear(year, month, day);
    candidate.setUTCHours(hour, minute, representableSecond, 0);
    if (candidate.getTime() > futureLimit.getTime()) year -= 100;
  }

  const parsed = new Date(0);
  parsed.setUTCFullYear(year, month, day);
  parsed.setUTCHours(hour, minute, representableSecond, 0);
  const weekday = asctime?.[1] ?? imf?.[1] ?? rfc850?.[1];
  const actualWeekday = rfc850
    ? LONG_WEEKDAYS[parsed.getUTCDay()]
    : SHORT_WEEKDAYS[parsed.getUTCDay()];
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month ||
    parsed.getUTCDate() !== day ||
    parsed.getUTCHours() !== hour ||
    parsed.getUTCMinutes() !== minute ||
    parsed.getUTCSeconds() !== representableSecond ||
    actualWeekday !== weekday
  )
    return undefined;
  // JavaScript Date uses POSIX seconds; represent a valid :60 at the following
  // instant after validating the date and weekday of its original minute.
  return parsed.getTime() + (second === 60 ? 1000 : 0);
}

export function validatedHttpStatus(status: unknown): number {
  return typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599
    ? status
    : 0;
}

/** Parse only the Retry-After field; no other response headers escape the adapter. */
export function parseRetryAfter(
  value: string | null | undefined,
  nowMs = Date.now()
): number | undefined {
  if (value === null || value === undefined || !Number.isFinite(nowMs)) return undefined;
  // A present but oversized field is ambiguous; saturation cannot schedule a
  // retry before guidance that may be hidden beyond the scan limit.
  if (value.length > MAX_RETRY_AFTER_CHARS) return MAX_RETRY_AFTER_MS;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed);
    return Number.isFinite(seconds)
      ? Math.min(seconds * 1000, MAX_RETRY_AFTER_MS)
      : MAX_RETRY_AFTER_MS;
  }
  const dateMs = httpDateMs(trimmed, nowMs);
  if (dateMs === undefined) {
    // Fetch Headers may combine duplicate decimal fields into one comma list.
    // A conflicting or malformed list is conservatively deferred.
    if (/^\d+(?:,\s*\d+)+$/.test(trimmed)) {
      const delays = trimmed.split(',').map((part) => parseRetryAfter(part.trim(), nowMs));
      return delays.every((delay) => delay === delays[0]) ? delays[0] : MAX_RETRY_AFTER_MS;
    }
    if (/^\d+\s*,|GMT\s*,/.test(trimmed)) return MAX_RETRY_AFTER_MS;
    return undefined;
  }
  return Math.min(Math.max(0, dateMs - nowMs), MAX_RETRY_AFTER_MS);
}

export function retryAfterFromRawHeaders(
  headers: string | undefined,
  nowMs = Date.now()
): number | undefined {
  if (!headers || headers.length > MAX_RAW_HEADERS_CHARS) return undefined;
  let found = false;
  let delayMs: number | undefined;
  let offset = 0;
  while (offset < headers.length) {
    const newline = headers.indexOf('\n', offset);
    const end = newline < 0 ? headers.length : newline;
    const line = headers.slice(offset, end).trimEnd();
    const colon = line.indexOf(':');
    if (colon >= 0 && line.slice(0, colon).toLowerCase() === 'retry-after') {
      const parsed = parseRetryAfter(line.slice(colon + 1), nowMs);
      // Duplicate fields with conflicting or unreadable guidance saturate. Never
      // take an earlier shorter value when a later field disagrees with it.
      if (found && (parsed === undefined || delayMs === undefined || parsed !== delayMs)) {
        return MAX_RETRY_AFTER_MS;
      }
      found = true;
      delayMs = parsed;
    }
    offset = end + 1;
  }
  return delayMs;
}

export function safeResponseMetadata(
  response: HttpRequestResponse,
  readable: boolean,
  errorCategory?: HttpErrorCategory
): Pick<
  HttpRequestResponse,
  'status' | 'responseHeaders' | 'readable' | 'retryAfterMs' | 'errorCategory'
> {
  const status = validatedHttpStatus(response.status);
  const retryAfterMs =
    status === 0
      ? undefined
      : typeof response.retryAfterMs === 'number' &&
          Number.isFinite(response.retryAfterMs) &&
          response.retryAfterMs >= 0
        ? Math.min(response.retryAfterMs, MAX_RETRY_AFTER_MS)
        : retryAfterFromRawHeaders(response.responseHeaders);
  return {
    status,
    responseHeaders: '',
    readable,
    ...(retryAfterMs !== undefined ? { retryAfterMs } : {}),
    ...(errorCategory ? { errorCategory } : {}),
  };
}
