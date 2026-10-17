// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import {
  MAX_RETRY_AFTER_MS,
  parseRetryAfter,
  retryAfterFromRawHeaders,
} from '@platform/http-response-metadata';
import { describe, expect, it } from 'vite-plus/test';

describe('safe Retry-After metadata', () => {
  const now = Date.UTC(2026, 9, 12, 0, 0, 0);

  it('accepts delay seconds and HTTP dates with injected time', () => {
    expect(parseRetryAfter('7', now)).toBe(7_000);
    expect(parseRetryAfter('Mon, 12 Oct 2026 00:00:09 GMT', now)).toBe(9_000);
    expect(parseRetryAfter('Monday, 12-Oct-26 00:00:09 GMT', now)).toBe(9_000);
    expect(parseRetryAfter('Mon Oct 12 00:00:09 2026', now)).toBe(9_000);
    expect(parseRetryAfter('Mon, 12 Oct 2026 00:00:00 GMT', now)).toBe(0);
    expect(parseRetryAfter('Sun, 11 Oct 2026 23:59:59 GMT', now)).toBe(0);
    expect(parseRetryAfter('Sunday, 06-Nov-94 08:49:37 GMT', now)).toBe(0);
    expect(parseRetryAfter('Sun Nov  6 08:49:37 1994', now)).toBe(0);
    expect(parseRetryAfter('Sat, 31 Dec 2016 23:59:60 GMT', now)).toBe(0);
  });

  it('uses the RFC 850 50-year rule before validating the weekday', () => {
    const future = new Date(Date.UTC(2075, 9, 12));
    const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
      future.getUTCDay()
    ];
    expect(parseRetryAfter(`${weekday}, 12-Oct-75 00:00:00 GMT`, now)).toBe(MAX_RETRY_AFTER_MS);
    // The same two-digit year must resolve to 1994 rather than 2094.
    expect(parseRetryAfter('Sunday, 06-Nov-94 08:49:37 GMT', now)).toBe(0);
  });

  it('rejects malformed and negative values and bounds distant guidance', () => {
    expect(parseRetryAfter('-1', now)).toBeUndefined();
    expect(parseRetryAfter('1.5', now)).toBeUndefined();
    expect(parseRetryAfter('tomorrow', now)).toBeUndefined();
    expect(parseRetryAfter('Tue, 31 Feb 2026 00:00:00 GMT', now)).toBeUndefined();
    expect(parseRetryAfter('Tuesday, 12-Oct-26 00:00:09 GMT', now)).toBeUndefined();
    expect(parseRetryAfter('Mon Oct 32 00:00:09 2026', now)).toBeUndefined();
    expect(parseRetryAfter('Mon, 12 Oct 2026 00:00:60 GMT', now)).toBeUndefined();
    expect(parseRetryAfter('999999999999999999999999999999', now)).toBe(MAX_RETRY_AFTER_MS);
    expect(parseRetryAfter('5, 9', now)).toBe(MAX_RETRY_AFTER_MS);
    expect(parseRetryAfter('5, 5', now)).toBe(5_000);
    expect(parseRetryAfter(new Date(now + 10 * 365 * 24 * 60 * 60 * 1000).toUTCString(), now)).toBe(
      MAX_RETRY_AFTER_MS
    );
  });

  it('reads only an exact Retry-After header line', () => {
    expect(
      retryAfterFromRawHeaders('X-Retry-After: 8\r\nRetry-After: 3\r\nSecret: value', now)
    ).toBe(3_000);
    expect(retryAfterFromRawHeaders('Retry-After: -3', now)).toBeUndefined();
    expect(retryAfterFromRawHeaders('Retry-After: 2\r\nRetry-After: 7', now)).toBe(
      MAX_RETRY_AFTER_MS
    );
    expect(retryAfterFromRawHeaders('Retry-After: 2\r\nRetry-After: 2', now)).toBe(2_000);
    expect(
      retryAfterFromRawHeaders(`Retry-After: 2\r\nX-Filler: ${'x'.repeat(8192)}`, now)
    ).toBeUndefined();
  });
});
