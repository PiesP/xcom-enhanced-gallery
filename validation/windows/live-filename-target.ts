// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';

/** The historical selector remains valid for the completed #482 qualification. */
export const PREVIOUS_LIVE_FILENAME_TARGET = {
  pageUrl: 'https://x.com/yukurach/status/2118323627615785399',
  mediaBasename: 'HWXMF0bbcAEnfk6',
} as const;

export type LiveFilenameTarget = {
  readonly pageUrl: string;
  readonly mediaBasename: string;
};

/** Parse an exact task-owned selector; the media basename is a filter, not an expected filename. */
export function parseLiveFilenameTarget(value: unknown): LiveFilenameTarget {
  assert(value && typeof value === 'object' && !Array.isArray(value));
  const input = value as Record<string, unknown>;
  assert.deepEqual(Object.keys(input).sort(), ['mediaBasename', 'pageUrl']);
  assert(
    typeof input.pageUrl === 'string' &&
      /^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}\/status\/[0-9]{1,20}$/u.test(input.pageUrl),
    'Live filename target must be one exact public X status URL'
  );
  assert(
    typeof input.mediaBasename === 'string' &&
      /^[A-Za-z0-9_-]{1,40}$/u.test(input.mediaBasename),
    'Live filename target must be one exact CDN media basename'
  );
  return { pageUrl: input.pageUrl, mediaBasename: input.mediaBasename };
}

export function parseLiveFilenameSelector(value: unknown): LiveFilenameTarget {
  assert(value && typeof value === 'object' && !Array.isArray(value));
  const input = value as Record<string, unknown>;
  if (input.target === undefined) {
    assert.deepEqual(input, { scenario: 'reported-live-filename' });
    return PREVIOUS_LIVE_FILENAME_TARGET;
  }
  assert.deepEqual(Object.keys(input).sort(), ['scenario', 'target']);
  assert.equal(input.scenario, 'reported-live-filename');
  return parseLiveFilenameTarget(input.target);
}

/** Accept only a selected original from the exact configured attachment. */
export function isLiveFilenameOriginal(sourceUrl: unknown, target: LiveFilenameTarget): boolean {
  if (typeof sourceUrl !== 'string') {
    return false;
  }
  let source: URL;
  try {
    source = new URL(sourceUrl);
  } catch {
    return false;
  }
  if (
    source.href !== sourceUrl ||
    source.origin !== 'https://pbs.twimg.com' ||
    source.username ||
    source.password ||
    source.hash ||
    source.port
  ) {
    return false;
  }
  const path = /^\/media\/([A-Za-z0-9_-]{1,40})(?:\.(jpg|jpeg|png|webp|gif))?$/u.exec(
    source.pathname
  );
  if (path?.[1] !== target.mediaBasename) {
    return false;
  }
  const pairs = [...source.searchParams].sort();
  const format = pairs[0]?.[1];
  return (
    pairs.length === 2 &&
    pairs[0]?.[0] === 'format' &&
    /^(?:jpg|jpeg|png|webp|gif)$/u.test(format ?? '') &&
    pairs[1]?.[0] === 'name' &&
    pairs[1][1] === 'orig' &&
    (!path?.[2] || path[2] === format)
  );
}
