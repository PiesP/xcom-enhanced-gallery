// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

// These are routed X responses, not substitutes for extension code or its API client.
export const QUOTED_CASES = [
  {
    name: 'recognized', route: 'recognized', handle: 'outer_one', outer: '8111111111111111111',
    owner: '9111111111111111111', username: 'quote_one',
    media: 'quote-one', expectedPosition: 2, close: 'escape',
    poster: 'quote-one',
  },
  {
    name: 'unmarked', route: 'unmarked', handle: 'outer_two', outer: '8222222222222222222',
    owner: '9222222222222222222', username: 'quote_two',
    media: 'quote-two', expectedPosition: 2, close: 'button',
    poster: 'quote-two',
  },
  {
    name: 'linked', route: 'linked', handle: 'outer_four', outer: '8444444444444444444',
    owner: '9444444444444444444', username: 'quote_four',
    media: 'linked-four', expectedPosition: 2, close: 'escape',
    poster: 'linked-four',
  },
  {
    name: 'nested-from-outer', route: 'nested', handle: 'outer_three', outer: '8333333333333333333',
    owner: '9333333333333333333', username: 'quote_three',
    media: 'quote-three', expectedPosition: 1, close: 'escape',
    poster: 'quote-three',
  },
  {
    name: 'nested-direct-quote', route: 'nested-direct', handle: 'quote_three', outer: '9333333333333333333',
    owner: '9333333333333333333', username: 'quote_three',
    media: 'quote-three', expectedPosition: 2, close: 'button',
    poster: 'quote-three',
  },
];

export const NESTED_OWNER = '7333333333333333333';
const outerNames = {
  '8111111111111111111': 'outer_one',
  '8222222222222222222': 'outer_two',
  '8333333333333333333': 'outer_three',
  '8444444444444444444': 'outer_four',
};

function video(id, marker, index) {
  return {
    type: 'video', id_str: `${id}${index}`, media_key: `7_${id}${index}`,
    media_url_https: `https://pbs.twimg.com/ext_tw_video_thumb/${id}/pu/img/${marker}.jpg`,
    expanded_url: `https://x.com/${marker}/status/${id}/video/${index + 1}`,
    original_info: { width: 320, height: 180 },
    video_info: {
      aspect_ratio: [16, 9],
      variants: [{ content_type: 'video/mp4', bitrate: 832000,
        url: `https://video.twimg.com/ext_tw_video/${id}/pu/vid/320x180/${marker}.mp4` }],
    },
  };
}

function photo(id, marker, index) {
  return {
    type: 'photo', id_str: `${id}${index}`, media_key: `3_${id}${index}`,
    media_url_https: `https://pbs.twimg.com/media/${marker}.jpg`,
    original_info: { width: 320, height: 180 },
  };
}

function tweet(id, username, media, quoted) {
  return {
    __typename: 'Tweet', rest_id: id,
    core: { user_results: { result: { rest_id: id, legacy: { screen_name: username,
      name: username } } } },
    legacy: { id_str: id, full_text: `${username} deterministic installed media`,
      extended_entities: { media } },
    ...(quoted ? { quoted_status_result: { result: quoted } } : {}),
  };
}

export function quotedVideoApiResponse(tweetId) {
  const selected = QUOTED_CASES.find(({ outer }) => outer === tweetId);
  if (!selected && tweetId !== QUOTED_CASES[2].owner) return null;
  const quoteOne = tweet(QUOTED_CASES[0].owner, 'quote_one', [
    photo(QUOTED_CASES[0].owner, 'QQuoteOnePhoto', 0),
    video(QUOTED_CASES[0].owner, 'quote-one', 1),
  ]);
  const quoteTwo = tweet(QUOTED_CASES[1].owner, 'quote_two', [
    photo(QUOTED_CASES[1].owner, 'QQuoteTwoPhoto', 0),
    video(QUOTED_CASES[1].owner, 'quote-two', 1),
  ]);
  const quoteFour = tweet(QUOTED_CASES[2].owner, 'quote_four', [
    photo(QUOTED_CASES[2].owner, 'QQuoteFourPhoto', 0),
    video(QUOTED_CASES[2].owner, 'linked-four', 1),
  ]);
  const nested = tweet(NESTED_OWNER, 'nested_c', [video(NESTED_OWNER, 'nested-c', 0)]);
  const quoteThree = tweet(QUOTED_CASES[3].owner, 'quote_three', [
    video(QUOTED_CASES[3].owner, 'quote-three', 0),
  ], nested);
  if (tweetId === quoteThree.rest_id) {
    return { data: { tweetResult: { result: quoteThree } } };
  }
  if (tweetId === quoteFour.rest_id) {
    return { data: { tweetResult: { result: quoteFour } } };
  }
  const quoted = selected.name === 'recognized' ? quoteOne
    : selected.name === 'unmarked' ? quoteTwo
    : selected.name === 'linked' ? quoteFour : quoteThree;
  const outerMedia = selected.name === 'nested-from-outer'
    ? [photo(tweetId, 'QOuterThreePhoto', 0)]
    : [video(tweetId, `outer-${selected.name}`, 0)];
  return { data: { tweetResult: { result: tweet(
    tweetId, outerNames[tweetId], outerMedia, quoted
  ) } } };
}
