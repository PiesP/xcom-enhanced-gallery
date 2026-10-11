// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { normalizeOriginalImageUrl } from '@shared/utils/media/media-source';
import { describe, expect, it } from 'vitest';

describe('ordinary CDN photo originals', () => {
  it.each([
    ['EXAMPLE.jpg', 'EXAMPLE.jpg?format=jpg&name=orig'],
    ['EXAMPLE.jpeg:large', 'EXAMPLE.jpeg?format=jpeg&name=orig'],
    ['EXAMPLE?format=png&name=small', 'EXAMPLE?format=png&name=orig'],
    ['EX%41MPLE.webp?name=900x900', 'EX%41MPLE.webp?format=webp&name=orig'],
    ['EXAMPLE?FORMAT=JPG&format=jpg&NAME=SMALL&name=small', 'EXAMPLE?format=jpg&name=orig'],
    ['EXAMPLE.jpg?format=png&name=orig&token=a%2Fb', 'EXAMPLE.jpg?token=a%2Fb&format=png&name=orig'],
  ])('preserves identity and format for %s', (input, expected) => {
    const result = normalizeOriginalImageUrl(`https://pbs.twimg.com/media/${input}`);
    expect(result).toBe(`https://pbs.twimg.com/media/${expected}`);
    expect(normalizeOriginalImageUrl(result!)).toBe(result);
  });

  it.each([
    'http://pbs.twimg.com/media/EXAMPLE.jpg',
    'https://pbs.twimg.com.evil.invalid/media/EXAMPLE.jpg',
    'https://user@pbs.twimg.com/media/EXAMPLE.jpg',
    'https://pbs.twimg.com:444/media/EXAMPLE.jpg',
    'https://pbs.twimg.com/profile_images/EXAMPLE.jpg',
    'https://pbs.twimg.com/card_img/EXAMPLE.jpg',
    'https://pbs.twimg.com/ext_tw_video_thumb/222/img/EXAMPLE.jpg',
    'https://video.twimg.com/ext_tw_video/222/EXAMPLE.jpg',
    'https://pbs.twimg.com/media/EXAMPLE?arbitrary=jpg',
    'https://pbs.twimg.com/media/EXAMPLE?format=svg&name=small',
    'https://pbs.twimg.com/media/EXAMPLE?format=jpg&FORMAT=png',
    'https://pbs.twimg.com/media/EXAMPLE.jpg?name=small&NAME=large',
    'https://pbs.twimg.com/media/EXAMPLE.jpg?name=unknown',
    'https://pbs.twimg.com/media/EX%2FAMPLE.jpg',
    'https://pbs.twimg.com/media/EX%ZZAMPLE.jpg',
    'https://pbs.twimg.com/media/EXAMPLE.jpg#fragment',
    ' https://pbs.twimg.com/media/EXAMPLE.jpg',
    'not-a-url',
  ])('does not invent an original for %s', (input) => {
    expect(normalizeOriginalImageUrl(input)).toBeNull();
  });
});
