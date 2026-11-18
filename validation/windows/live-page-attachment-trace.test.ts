// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { test } from 'vite-plus/test';
import { summarizeTweetResultResponse } from './live-page.ts';

test('bounded live trace retains owner collection order and validated repeated hints', () => {
  const ownerId = '2119670174475522225';
  const media = ['jpg', 'png', 'png', 'jpg'].map((format, index) => ({
    id_str: String(900 + index),
    type: 'photo',
    media_url_https: `https://pbs.twimg.com/media/Source${index}?format=${format}&name=medium`,
    expanded_url: `https://x.com/instiz/status/${ownerId}/photo/1`,
  }));
  const summary = summarizeTweetResultResponse(
    `https://x.com/i/api/graphql/id/TweetResultByRestId?variables=${encodeURIComponent(JSON.stringify({ tweetId: ownerId }))}`,
    200,
    {
      data: {
        tweetResult: {
          result: {
            rest_id: ownerId,
            legacy: { extended_entities: { media } },
          },
        },
      },
    }
  );
  assert.equal(summary?.result?.id, ownerId);
  assert.equal(summary?.result?.collectionCount, 4);
  assert.deepEqual(
    summary?.result?.media.map(({ id, entityOrdinal, navigationHint, sourceFormat, poster }) => ({
      id,
      entityOrdinal,
      navigationHint,
      sourceFormat,
      poster,
    })),
    [
      {
        id: '900',
        entityOrdinal: 0,
        navigationHint: { kind: 'photo', ordinal: 0 },
        sourceFormat: 'jpg',
        poster: { host: 'pbs.twimg.com', path: '/media/Source0' },
      },
      {
        id: '901',
        entityOrdinal: 1,
        navigationHint: { kind: 'photo', ordinal: 0 },
        sourceFormat: 'png',
        poster: { host: 'pbs.twimg.com', path: '/media/Source1' },
      },
      {
        id: '902',
        entityOrdinal: 2,
        navigationHint: { kind: 'photo', ordinal: 0 },
        sourceFormat: 'png',
        poster: { host: 'pbs.twimg.com', path: '/media/Source2' },
      },
      {
        id: '903',
        entityOrdinal: 3,
        navigationHint: { kind: 'photo', ordinal: 0 },
        sourceFormat: 'jpg',
        poster: { host: 'pbs.twimg.com', path: '/media/Source3' },
      },
    ]
  );
});

test('live trace rejects foreign hints and exposes the twelve-entity observation cap', () => {
  const ownerId = '111';
  const media = Array.from({ length: 14 }, (_, index) => ({
    id_str: String(index + 1),
    type: 'photo',
    media_url_https: `https://pbs.twimg.com/media/Photo${index}.jpg`,
    expanded_url: `https://x.com/other/status/222/photo/${index + 1}`,
  }));
  const summary = summarizeTweetResultResponse(
    `https://x.com/i/api/graphql/id/TweetResultByRestId?variables=${encodeURIComponent(JSON.stringify({ tweetId: ownerId }))}`,
    200,
    {
      data: {
        tweetResult: { result: { rest_id: ownerId, legacy: { extended_entities: { media } } } },
      },
    }
  );
  assert.equal(summary?.result?.collectionCount, 14);
  assert.equal(summary?.result?.media.length, 12);
  assert(summary?.result?.media.every(({ navigationHint }) => navigationHint === null));
});

test('explicit collection trace retains all owner-local positions without flattening nested quotes', () => {
  const requestedId = '2121025509215850557';
  const directId = '2121007970545017041';
  const nestedId = '2120999999999999999';
  const media = (prefix: string) =>
    Array.from({ length: 20 }, (_, ordinal) => ({
      id_str: `${prefix}${ordinal}`,
      type: 'photo',
      media_url_https: `https://pbs.twimg.com/media/${prefix}${ordinal}.jpg`,
      expanded_url: `https://x.com/shinchilla_/status/${prefix === 'A' ? requestedId : directId}/photo/${ordinal + 1}`,
    }));
  const summary = summarizeTweetResultResponse(
    `https://x.com/i/api/graphql/id/TweetResultByRestId?variables=${encodeURIComponent(JSON.stringify({ tweetId: requestedId }))}`,
    200,
    {
      data: {
        tweetResult: {
          result: {
            rest_id: requestedId,
            legacy: { extended_entities: { media: media('A') } },
            quoted_status_result: {
              result: {
                rest_id: directId,
                legacy: { extended_entities: { media: media('B') } },
                quoted_status_result: { result: { rest_id: nestedId } },
              },
            },
          },
        },
      },
    },
    40
  );
  assert.equal(summary?.result?.collectionCount, 20);
  assert.equal(summary?.directQuote?.collectionCount, 20);
  assert.equal(summary?.result?.media.length, 20);
  assert.equal(summary?.directQuote?.media.length, 20);
  assert.deepEqual(
    [0, 3, 4, 9, 12, 13, 19].map((index) => [
      summary?.result?.media[index]?.entityOrdinal,
      summary?.directQuote?.media[index]?.entityOrdinal,
    ]),
    [0, 3, 4, 9, 12, 13, 19].map((index) => [index, index])
  );
  assert.equal(summary?.nestedQuoteId, nestedId);
  assert.throws(() =>
    summarizeTweetResultResponse(
      `https://x.com/i/api/graphql/id/TweetResultByRestId?variables=${encodeURIComponent(JSON.stringify({ tweetId: requestedId }))}`,
      200,
      {},
      41
    )
  );
});
