// Vitest globals (describe/it/expect/vi) are provided by tsconfig "vitest/globals"; avoid importing runtime helpers here
import {
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
  FilenameService,
} from '@shared/services/filename-service';
import type { MediaInfo } from '@shared/types/media.types';
import * as hostUtils from '@shared/utils/url/host';

describe('FilenameService', () => {
  it('should return sanitized filename when media.filename provided', () => {
    const media = {
      filename: '  <?>bad:name.jpg  ',
    } as unknown as MediaInfo;

    const name = generateMediaFilename(media);
    expect(name).toBe('___bad_name.jpg');
  });

  it('should generate username_tweetid_index when username and tweetId present', () => {
    const media = {
      tweetUsername: 'myuser',
      tweetId: '12345',
      id: 'ignored_media_0',
      originalUrl: 'https://pbs.twimg.com/media/abc.jpg',
    } as unknown as MediaInfo;

    const name = generateMediaFilename(media);
    expect(name).toContain('myuser_12345_1.jpg');
  });

  it('should generate tweet_tweetid_index when username missing but numeric tweetId present', () => {
    const media = {
      tweetId: '98765',
      id: 'prefix_2',
      originalUrl: 'https://pbs.twimg.com/media/abc.png?foo=1',
    } as unknown as MediaInfo;

    const name = generateMediaFilename(media);
    // index derived from id suffix should be '2'
    expect(name).toContain('tweet_98765_2.png');
  });

  it('should use fallbackPrefix when username/tweetId not found', () => {
    const media = {
      id: 'no_id',
      originalUrl: 'https://pbs.twimg.com/media/abc.gif',
    } as unknown as MediaInfo;

    const name = generateMediaFilename(media, { fallbackPrefix: 'xg' });
    expect(name.startsWith('xg_')).toBe(true);
    expect(name.endsWith('.gif')).toBe(true);
  });

  it('should generate proper zip filename from first media item', () => {
    const items: MediaInfo[] = [
      {
        tweetUsername: 'zipuser',
        tweetId: '99999',
      } as unknown as MediaInfo,
    ];

    const name = generateZipFilename(items);
    expect(name).toBe('zipuser_99999.zip');
  });

  it('should validate filenames: invalid when contains reserved chars', () => {
    expect(isValidMediaFilename('normal.jpg')).toBe(true);
    expect(isValidMediaFilename('bad<name>.jpg')).toBe(false);
    expect(isValidZipFilename('ok.zip')).toBe(true);
    expect(isValidZipFilename('bad|zip.zip')).toBe(false);
  });

  it('should extract extension from URL with query params and mixed-case extension', () => {
    const media = {
      id: 'prefix_3',
      originalUrl: 'https://example.com/path/IMG.JPEG?foo=1',
    } as unknown as MediaInfo;

    const name = generateMediaFilename(media);
    expect(name.endsWith('.jpeg')).toBe(true);
  });

  it('should fallback to default extension when extension not recognized', () => {
    const media = {
      originalUrl: 'https://example.com/path/file.unknownext',
    } as unknown as MediaInfo;

    const name = generateMediaFilename(media);
    expect(name.endsWith('.jpg')).toBe(true);
  });

  it('getIndex should parse _media_ number or trailing _number', () => {
    const media1 = { id: 'twitter_media_12345' } as unknown as MediaInfo;
    const media2 = { id: 'something_17' } as unknown as MediaInfo;

    // Use generateMediaFilename to exercise getIndex
    const n1 = generateMediaFilename(media1);
    const n2 = generateMediaFilename(media2);
    expect(n1).toContain('_12346.'); // _media_ increments the index
    expect(n2).toContain('_17.'); // trailing _N uses the raw number
  });
});
// Duplicate imports removed - FilenameService and vitest helpers are imported at top

describe('FilenameService URL-derived usernames', () => {
  const service = new FilenameService();
  const baseMedia = {
    id: 'media_0',
    type: 'image' as const,
    url: 'https://x.com/example/status/1',
    tweetId: '1234567890123456789',
  };

  it('extracts username only from trusted X.com hosts', () => {
    const filename = service.generateMediaFilename(
      {
        ...baseMedia,
        url: 'https://x.com/Trusted_User/status/1234567890123456789',
      },
      { index: 1 }
    );

    expect(filename.startsWith('Trusted_User_1234567890123456789_')).toBe(true);
  });

  it('falls back when the URL host is untrusted even if it contains twitter.com text', () => {
    const filename = service.generateMediaFilename(
      {
        ...baseMedia,
        url: 'https://malicious.example/?share=https://twitter.com/bad_actor',
      },
      { index: 1 }
    );

    expect(filename.startsWith('tweet_1234567890123456789_')).toBe(true);
  });

  it('ignores media CDN URLs when extracting usernames', () => {
    const filename = service.generateMediaFilename(
      {
        ...baseMedia,
        url: 'https://pbs.twimg.com/media/XYZ.jpg?format=jpg&name=orig',
      },
      { index: 2 }
    );

    expect(filename.startsWith('tweet_1234567890123456789_')).toBe(true);
  });

  it('does not attempt to extract username when url is not a string', () => {
    const spy = vi.spyOn(hostUtils, 'extractUsernameFromUrl');
    try {
      const filename = generateMediaFilename({ ...baseMedia, url: null as unknown as string } as unknown as MediaInfo);
      expect(filename.startsWith('tweet_1234567890123456789_')).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('rejects spoofed domains like evil-x.com', () => {
    const filename = service.generateMediaFilename(
      {
        ...baseMedia,
        url: 'https://evil-x.com/BadUser/status/123',
      },
      { index: 1 }
    );
    // Should fallback to tweet_ID format, not use BadUser
    expect(filename.startsWith('tweet_1234567890123456789_')).toBe(true);
  });
});

describe('FilenameService General', () => {
  const service = new FilenameService();
  const baseMedia = {
    id: 'media_1',
    type: 'image' as const,
    url: 'https://pbs.twimg.com/media/image.jpg',
    tweetId: '123',
  };

  it('uses provided filename if present', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      filename: 'custom_name.png',
    });
    expect(filename).toBe('custom_name.png');
  });

  it('sanitizes provided filename', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      filename: 'bad/name:test.png',
    });
    expect(filename).toBe('bad_name_test.png');
  });

  it('uses quoted metadata if sourceLocation is quoted', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      sourceLocation: 'quoted',
      quotedUsername: 'quotedUser',
      quotedTweetId: '999',
    });
    expect(filename).toMatch(/^quotedUser_999_\d+\.jpg$/);
  });

  it('uses fallback username if provided and no other username found', () => {
    const filename = service.generateMediaFilename(
      {
        ...baseMedia,
        url: 'https://pbs.twimg.com/media/image.jpg', // No username in URL
      },
      { fallbackUsername: 'fallbackUser' }
    );
    expect(filename).toMatch(/^fallbackUser_123_\d+\.jpg$/);
  });

  it('falls back to prefix if no metadata available', () => {
    const filename = service.generateMediaFilename({
      id: 'media_2',
      type: 'image',
      url: 'https://example.com/image.jpg',
      // No tweetId, no username
    });
    expect(filename).toMatch(/^media_\d+_\d+\.jpg$/);
  });

  it('uses custom fallback prefix', () => {
    const filename = service.generateMediaFilename(
      {
        id: 'media_2',
        type: 'image',
        url: 'https://example.com/image.jpg',
      },
      { fallbackPrefix: 'custom' }
    );
    expect(filename).toMatch(/^custom_\d+_\d+\.jpg$/);
  });

  it('extracts extension from URL', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      url: 'https://example.com/image.png?query=1',
    });
    expect(filename.endsWith('.png')).toBe(true);
  });

  it('uses default extension if URL has none', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      url: 'https://example.com/image',
    });
    expect(filename.endsWith('.jpg')).toBe(true);
  });

  it('uses provided extension option', () => {
    const filename = service.generateMediaFilename(
      {
        ...baseMedia,
        url: 'https://example.com/image.jpg',
      },
      { extension: 'webp' }
    );
    expect(filename.endsWith('.webp')).toBe(true);
  });

  it('extracts index from media ID', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      id: 'media_5', // index 5? No, usually 1-based index from 0-based ID?
      // The implementation of getIndex needs checking.
      // Assuming getIndex parses the number at the end.
    });
    // Let's check the implementation of getIndex
    // It calls safeParseInt(id.split("_").pop())
    // So media_5 -> 5.
    expect(filename).toMatch(/_5\.jpg$/);
  });

  it('uses provided index option', () => {
    const filename = service.generateMediaFilename(
      { ...baseMedia, id: 'media' }, // ID without index pattern
      { index: 42 }
    );
    expect(filename).toMatch(/_42\.jpg$/);
  });
});

describe('FilenameService ZIP', () => {
  const service = new FilenameService();
  const baseMedia = {
    id: 'media_1',
    type: 'image' as const,
    url: 'https://pbs.twimg.com/media/image.jpg',
    tweetId: '123',
    tweetUsername: 'user',
  };

  it('generates zip filename from first item metadata', () => {
    const filename = service.generateZipFilename([baseMedia]);
    expect(filename).toBe('user_123.zip');
  });

  it('falls back to prefix if no metadata', () => {
    const filename = service.generateZipFilename([
      { ...baseMedia, tweetUsername: undefined, tweetId: undefined },
    ]);
    expect(filename).toMatch(/^xcom_gallery_\d+\.zip$/);
  });

  it('uses custom fallback prefix for zip', () => {
    const filename = service.generateZipFilename([], {
      fallbackPrefix: 'my_gallery',
    });
    expect(filename).toMatch(/^my_gallery_\d+\.zip$/);
  });

  it('validates zip filename', () => {
    expect(service.isValidZipFilename('test.zip')).toBe(true);
    expect(service.isValidZipFilename('test.jpg')).toBe(false);
    expect(service.isValidZipFilename('bad/test.zip')).toBe(false);
  });
});

describe('FilenameService Validation', () => {
  const service = new FilenameService();

  it('validates media filename', () => {
    expect(service.isValidMediaFilename('test.jpg')).toBe(true);
    expect(service.isValidMediaFilename('')).toBe(false);
    expect(service.isValidMediaFilename('bad/test.jpg')).toBe(false);
  });
});

describe('FilenameService Comprehensive', () => {
  const service = new FilenameService();
  const baseMedia = {
    id: 'media_1',
    type: 'image' as const,
    url: 'https://pbs.twimg.com/media/image.jpg',
    tweetId: '123',
    tweetUsername: 'user',
  };

  it('returns the same instance', () => {
    const instance1 = FilenameService.getInstance();
    const instance2 = FilenameService.getInstance();
    expect(instance1).toBe(instance2);
    // Ensure that the singleton is actually constructed and not undefined
    expect(instance1).toBeInstanceOf(FilenameService);
  });

  it('constructs a new instance when no singleton exists', () => {
    const previous = (FilenameService as any).instance;
    try {
      // Clear private static by accessing at runtime
      (FilenameService as any).instance = undefined;
      const instance = FilenameService.getInstance();
      expect(instance).toBeInstanceOf(FilenameService);
      // Should set the static instance reference
      expect((FilenameService as any).instance).toBe(instance);
    } finally {
      // Restore to avoid cross-test pollution
      (FilenameService as any).instance = previous;
    }
  });

  it('ignores empty string filename', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      filename: '',
    });
    // Should fall back to generated name
    expect(filename).not.toBe('');
    expect(filename).toMatch(/^user_123_\d+\.jpg$/);
  });

  it('handles missing quoted metadata gracefully', () => {
    // Missing quotedTweetId
    const filename1 = service.generateMediaFilename({
      ...baseMedia,
      sourceLocation: 'quoted',
      quotedUsername: 'quotedUser',
      quotedTweetId: undefined,
    });
    // Should fall back to regular tweet info
    expect(filename1).toBe('user_123_1.jpg');

    // Missing quotedUsername
    const filename2 = service.generateMediaFilename({
      ...baseMedia,
      sourceLocation: 'quoted',
      quotedUsername: undefined,
      quotedTweetId: '999',
    });
    expect(filename2).toBe('user_123_1.jpg');
  });

  it('handles complex media IDs correctly', () => {
    // Standard _media_ format
    expect(service.generateMediaFilename({ ...baseMedia, id: 'tweet_123_media_0' })).toMatch(
      /_1\.jpg$/
    );

    // Standard _ format
    expect(service.generateMediaFilename({ ...baseMedia, id: 'tweet_123_1' })).toMatch(/_1\.jpg$/);

    // ID ending with non-digits
    expect(service.generateMediaFilename({ ...baseMedia, id: 'media_abc' })).toMatch(/_1\.jpg$/);

    // ID with _media_ but not at end (regex check)
    // The regex is /_media_(\d+)$/ so this should NOT match the first group
    expect(service.generateMediaFilename({ ...baseMedia, id: 'test_media_123_extra' })).toMatch(
      /_1\.jpg$/
    );
  });

  it('validates extensions strictly', () => {
    // Valid
    expect(service.generateMediaFilename({ ...baseMedia, url: 'http://e.com/i.jpg' })).toMatch(
      /\.jpg$/
    );

    // Invalid (prefix match)
    expect(service.generateMediaFilename({ ...baseMedia, url: 'http://e.com/i.ajpg' })).toMatch(
      /\.jpg$/
    );

    // Invalid (suffix match)
    expect(service.generateMediaFilename({ ...baseMedia, url: 'http://e.com/i.jpg2' })).toMatch(
      /\.jpg$/
    );
  });

  it('normalizes index values', () => {
    // Use ID without index pattern so options.index is used
    const mediaNoIndex = { ...baseMedia, id: 'media' };

    // Null/Undefined
    expect(
      service.generateMediaFilename(mediaNoIndex, { index: null as unknown as number })
    ).toMatch(/_1\.jpg$/);
    expect(
      service.generateMediaFilename(mediaNoIndex, { index: undefined as unknown as number })
    ).toMatch(/_1\.jpg$/);

    // Invalid numbers
    expect(service.generateMediaFilename(mediaNoIndex, { index: 0 })).toMatch(/_1\.jpg$/);
    expect(service.generateMediaFilename(mediaNoIndex, { index: -1 })).toMatch(/_1\.jpg$/);
    expect(service.generateMediaFilename(mediaNoIndex, { index: 'abc' })).toMatch(/_1\.jpg$/);

    // Valid string number
    expect(service.generateMediaFilename(mediaNoIndex, { index: '5' })).toMatch(/_5\.jpg$/);
  });

  it('truncates long filenames', () => {
    const longName = 'a'.repeat(300) + '.jpg';
    const filename = service.generateMediaFilename({
      ...baseMedia,
      filename: longName,
    });
    expect(filename.length).toBe(255);
  });

  it('supports subdomains for username extraction', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      url: 'https://mobile.twitter.com/MobileUser/status/123',
      tweetUsername: undefined, // Force URL extraction
    });
    expect(filename).toMatch(/^MobileUser_/);
  });

  it('ignores reserved paths for username extraction', () => {
    const paths = ['home', 'explore', 'notifications', 'messages', 'search', 'settings'];
    paths.forEach(path => {
      const filename = service.generateMediaFilename({
        ...baseMedia,
        url: `https://twitter.com/${path}`,
        tweetUsername: undefined,
      });
      // Should fallback to tweet_ID or media_timestamp
      expect(filename).not.toMatch(new RegExp(`^${path}_`));
    });
  });

  it('validates username format strictly', () => {
    // Invalid start char
    const filename = service.generateMediaFilename({
      ...baseMedia,
      url: 'https://twitter.com/-InvalidUser/status/123',
      tweetUsername: undefined,
    });
    expect(filename).not.toMatch(/^-InvalidUser_/);
  });

  it('generates zip filename from first item with quoted metadata', () => {
    const filename = service.generateZipFilename([
      {
        ...baseMedia,
        sourceLocation: 'quoted',
        quotedUsername: 'quotedUser',
        quotedTweetId: '999',
      },
    ]);
    expect(filename).toBe('quotedUser_999.zip');
  });

  it('handles error in generateMediaFilename gracefully', () => {
    const badMedia = {
      id: null as unknown as string,
      type: 'image' as const,
      url: null as unknown as string,
      get tweetId(): string {
        throw new Error('Simulated error');
      },
    };

    // Should not throw and return fallback
    const filename = service.generateMediaFilename(badMedia);
    expect(filename).toMatch(/^media_\d+\.jpg$/);
  });

  it('handles error in generateZipFilename gracefully', () => {
    const badMediaArray = {
      0: {
        get tweetId(): string {
          throw new Error('Simulated error');
        },
      },
      length: 1,
      [Symbol.iterator]: function* () {
        yield this[0];
      },
    };

    // Should not throw and return fallback
    const filename = service.generateZipFilename(
      badMediaArray as unknown as readonly import('@shared/types/media.types').MediaInfo[]
    );
    expect(filename).toMatch(/^download_\d+\.zip$/);
  });

  it('handles URL with no path in getExtension', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      url: 'https://example.com',
    });
    expect(filename.endsWith('.jpg')).toBe(true);
  });

  it('handles URL that throws in extractUsernameFromUrl', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      url: 'not-a-valid-url',
      tweetUsername: undefined,
    });
    // Should fallback gracefully
    expect(filename).toMatch(/^tweet_123_\d+\.jpg$/);
  });

  it('uses originalUrl for username extraction if available', () => {
    const mediaWithOriginalUrl = {
      ...baseMedia,
      tweetUsername: undefined,
      url: 'https://pbs.twimg.com/media/image.jpg',
      originalUrl: 'https://twitter.com/OriginalUser/status/123',
    };

    const filename = service.generateMediaFilename(mediaWithOriginalUrl);
    expect(filename).toMatch(/^OriginalUser_/);
  });

  it('uses tweetUsername if not "unknown"', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      tweetUsername: 'validUser',
    });
    expect(filename).toMatch(/^validUser_/);
  });

  it('ignores "unknown" tweetUsername and tries URL extraction', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      tweetUsername: 'unknown',
      url: 'https://twitter.com/ExtractedUser/status/123',
    });
    expect(filename).toMatch(/^ExtractedUser_/);
  });

  it('handles getExtension when URL has multiple dots', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      url: 'https://example.com/path/to/image.test.file.png?query=1',
    });
    expect(filename.endsWith('.png')).toBe(true);
  });

  it('handles empty path in extractUsernameFromUrl', () => {
    const filename = service.generateMediaFilename({
      ...baseMedia,
      tweetUsername: undefined,
      url: 'https://twitter.com/',
    });
    // Should fallback since path is empty
    expect(filename).toMatch(/^tweet_123_\d+\.jpg$/);
  });
});
