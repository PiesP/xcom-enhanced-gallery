// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { planBulkDownload } from '@shared/core/download/download-plan';
import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { downloadAsZip } from '@shared/services/download/zip-download';
import { LiveByteBudget } from '@shared/services/download/live-byte-budget';
import { convertAPIMediaToMediaInfo } from '@shared/services/media/media-factory';
import { extractMediaFromTweet } from '@shared/services/media/twitter-parser/twitter-response-parser';
import type { TwitterMedia, TwitterTweet } from '@shared/services/media/types';
import type { TweetInfo } from '@shared/types/media.types';
import { sortMediaByVisualOrder } from '@shared/utils/media/media-dimensions';
import { verifyStoredZip } from '../../../../../validation/windows/download-memory.ts';
import { describe, expect, it } from 'vite-plus/test';

const owner: TweetInfo = {
  tweetId: '2119670174475522225',
  username: 'instiz',
  tweetUrl: 'https://x.com/instiz/status/2119670174475522225',
  extractionMethod: 'synthetic',
  confidence: 1,
};
// Small independent fixture bytes, not the reporter's ZIP or captured payload.
const sources = [
  { id: 'first', extension: 'jpg', bytes: Buffer.from([0xff, 0xd8, 0xff, 1]) },
  { id: 'second', extension: 'png', bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 2]) },
  { id: 'third', extension: 'png', bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 3]) },
  { id: 'fourth', extension: 'jpg', bytes: Buffer.from([0xff, 0xd8, 0xff, 4]) },
] as const;
const expectedNames = [
  'instiz_2119670174475522225_0.jpg',
  'instiz_2119670174475522225_1.png',
  'instiz_2119670174475522225_2.png',
  'instiz_2119670174475522225_3.jpg',
];

function post(hints = [1, 1, 1, 1]) {
  return {
    rest_id: owner.tweetId,
    extended_entities: {
      media: sources.map((source, index) => ({
        id_str: source.id,
        type: 'photo' as const,
        media_url_https: `https://pbs.twimg.com/media/${source.id}.${source.extension}`,
        expanded_url: `${owner.tweetUrl}/photo/${hints[index]}`,
      })),
    },
  };
}

function convert(tweet: TwitterTweet) {
  return convertAPIMediaToMediaInfo(
    sortMediaByVisualOrder(extractMediaFromTweet(tweet, { screen_name: 'instiz' })),
    owner
  );
}

describe('source-bound attachment identity through actual ZIP generation', () => {
  it.each([
    [1, 1, 1, 1],
    [99, 1, 2, 3],
  ])('retains all four source positions despite navigation hints %j', async (...hints) => {
    const mediaItems = convert(post(hints));
    const budget = new LiveByteBudget(64 * 1024);
    const owners = sources.map(({ bytes }) => ({
      value: new Blob([bytes]),
      lease: budget.reserve(bytes.length),
    }));
    const cachedBlobs = new Map(
      mediaItems.map((media, index) => [media.originalUrl!, owners[index]!])
    );
    const plan = planBulkDownload({ mediaItems, cachedBlobs });
    const zip = await downloadAsZip(plan.items, { liveBudget: budget, concurrency: 1 });
    try {
      expect(plan.items.map(({ url, desiredName }) => [url, desiredName])).toEqual([
        ['https://pbs.twimg.com/media/first.jpg?format=jpg&name=orig', expectedNames[0]],
        ['https://pbs.twimg.com/media/second.png?format=png&name=orig', expectedNames[1]],
        ['https://pbs.twimg.com/media/third.png?format=png&name=orig', expectedNames[2]],
        ['https://pbs.twimg.com/media/fourth.jpg?format=jpg&name=orig', expectedNames[3]],
      ]);
      expect(mediaItems.map((media) => generateMediaFilename(media))).toEqual(expectedNames);
      const archive = verifyStoredZip(
        Buffer.from(await new Blob(zip.zipData).arrayBuffer()),
        sources.map(({ bytes }, index) => ({ filename: expectedNames[index]!, bytes }))
      );
      expect(archive.entries.map(({ filename }) => filename)).toEqual(expectedNames);
      expect(
        new Set(
          archive.entries.map(({ filename }) => filename.replace(/\.[^.]+$/u, '').toLowerCase())
        ).size
      ).toBe(4);
      expect(zip.filesSuccessful).toBe(4);
    } finally {
      zip.dispose();
      owners.forEach(({ lease }) => lease.release());
    }
    expect(budget.usedBytes).toBe(0);
  });

  it('preserves the source gap when an earlier attachment is unavailable', () => {
    const tweet = post();
    const filtered = {
      ...tweet,
      extended_entities: {
        media: tweet.extended_entities.media.map((media, index) =>
          index === 0
            ? { ...media, media_url_https: 'https://evil.invalid/unavailable.jpg' }
            : media
        ),
      },
    };
    expect(convert(filtered).map((media) => generateMediaFilename(media))).toEqual(
      expectedNames.slice(1)
    );
  });

  it.each([
    {
      hints: [2, 4, 1, 3],
      names: [
        'instiz_2119670174475522225_2.png',
        'instiz_2119670174475522225_3.jpg',
        'instiz_2119670174475522225_1.png',
      ],
    },
    {
      hints: [1, 2, 1, 3],
      names: [
        'instiz_2119670174475522225_1.png',
        'instiz_2119670174475522225_2.png',
        'instiz_2119670174475522225_3.jpg',
      ],
    },
  ])(
    'validates presentation hints against even an excluded earlier entity: %j',
    ({ hints, names }) => {
      const tweet = post(hints);
      const media = tweet.extended_entities.media.map((item, index) =>
        index === 0 ? { ...item, media_url_https: 'https://evil.invalid/unavailable.jpg' } : item
      );
      expect(
        convert({ ...tweet, extended_entities: { media } }).map((item) =>
          generateMediaFilename(item)
        )
      ).toEqual(names);
    }
  );

  it('uses one owner collection across image/video kinds rather than per-kind hints', () => {
    const media: TwitterMedia[] = [
      post().extended_entities!.media[0]!,
      {
        id_str: 'clip',
        type: 'video',
        media_url_https: 'https://pbs.twimg.com/media/poster.jpg',
        expanded_url: `${owner.tweetUrl}/video/1`,
        video_info: {
          variants: [
            { content_type: 'video/mp4', url: 'https://video.twimg.com/ext_tw_video/123/clip.mp4' },
          ],
        },
      },
    ];
    expect(
      convert({ rest_id: owner.tweetId, extended_entities: { media } }).map((media) =>
        generateMediaFilename(media)
      )
    ).toEqual(['instiz_2119670174475522225_0.jpg', 'instiz_2119670174475522225_1.mp4']);
  });

  it('keeps complete note-inline identity through later navigation sorting and selection', () => {
    const note_tweet: TwitterTweet['note_tweet'] = {
      note_tweet_results: {
        result: {
          media: {
            inline_media: [
              { media_id: 'fourth', index: 0 },
              { media_id: 'third', index: 10 },
              { media_id: 'second', index: 20 },
              { media_id: 'first', index: 30 },
            ],
          },
        },
      },
    };
    const tweet = { ...post([1, 2, 3, 4]), note_tweet };
    const source = extractMediaFromTweet(tweet, { screen_name: 'instiz' });
    expect(source.map(({ media_id, attachmentOrdinal }) => [media_id, attachmentOrdinal])).toEqual([
      ['fourth', 0],
      ['third', 1],
      ['second', 2],
      ['first', 3],
    ]);
    const media = convert(tweet);
    expect(media.map(({ originalUrl }) => originalUrl)).toEqual([
      'https://pbs.twimg.com/media/first.jpg?format=jpg&name=orig',
      'https://pbs.twimg.com/media/second.png?format=png&name=orig',
      'https://pbs.twimg.com/media/third.png?format=png&name=orig',
      'https://pbs.twimg.com/media/fourth.jpg?format=jpg&name=orig',
    ]);
    expect(media.map((media) => generateMediaFilename(media))).toEqual([
      'instiz_2119670174475522225_3.jpg',
      'instiz_2119670174475522225_2.png',
      'instiz_2119670174475522225_1.png',
      'instiz_2119670174475522225_0.jpg',
    ]);
    expect(planBulkDownload({ mediaItems: [media[1]!] }).items[0]?.desiredName).toBe(
      'instiz_2119670174475522225_2.png'
    );
  });

  it.each(
    [
      [{ media_id: 'fourth', index: 0 }],
      [
        { media_id: 'fourth', index: 0 },
        { media_id: 'third', index: 0 },
        { media_id: 'second', index: 2 },
        { media_id: 'first', index: 3 },
      ],
      [
        { media_id: 'fourth', index: -1 },
        { media_id: 'third', index: 1 },
        { media_id: 'second', index: 2 },
        { media_id: 'first', index: 3 },
      ],
    ].map((inline_media) => ({ inline_media }))
  )(
    'does not let partial or conflicting inline metadata redefine entity order: %j',
    ({ inline_media }) => {
      const tweet: TwitterTweet = {
        ...post(),
        note_tweet: { note_tweet_results: { result: { media: { inline_media } } } },
      };
      expect(convert(tweet).map((media) => generateMediaFilename(media))).toEqual(expectedNames);
    }
  );
});
