import { FilenameService } from '@shared/services/filename-service';
import type { MediaInfo } from '@shared/types/media.types';

describe('FilenameService Mutation Tests', () => {
  let service: FilenameService;

  beforeEach(() => {
    service = FilenameService.getInstance();
  });

  describe('generateMediaFilename', () => {
    it('should ignore empty string filename provided in media', () => {
      const media = {
        url: 'https://x.com/user/status/123/photo/1.jpg',
        filename: '', // Empty string
        tweetId: '123',
        tweetUsername: 'user',
      } as unknown as MediaInfo;

      const result = service.generateMediaFilename(media);
      // Should generate based on metadata, not use empty string
      expect(result).toBe('user_123_1.jpg');
    });

    it('should fallback to media prefix when tweetId contains non-digits', () => {
      const media = {
        url: 'https://example.com/img.jpg',
        tweetId: '123a', // Non-digit
        tweetUsername: null,
      } as unknown as MediaInfo;

      const result = service.generateMediaFilename(media, { fallbackPrefix: 'custom' });
      expect(result).toMatch(/^custom_\d+_1\.jpg$/);
    });

    it('should NOT use quoted metadata if sourceLocation is not quoted', () => {
      const media = {
        url: 'https://x.com/user/status/123/photo/1.jpg',
        sourceLocation: 'tweet', // Not quoted
        quotedUsername: 'quotedUser',
        quotedTweetId: '999',
        tweetUsername: 'mainUser',
        tweetId: '123',
      } as unknown as MediaInfo;

      const result = service.generateMediaFilename(media);
      expect(result).toBe('mainUser_123_1.jpg');
    });

    it('should ignore "unknown" tweetUsername', () => {
      const media = {
        url: 'https://x.com/realUser/status/123/photo/1.jpg',
        tweetUsername: 'unknown',
        tweetId: '123',
      } as unknown as MediaInfo;

      // Should extract 'realUser' from URL since tweetUsername is 'unknown'
      const result = service.generateMediaFilename(media);
      expect(result).toBe('realUser_123_1.jpg');
    });

    it('should handle URL extraction failure gracefully', () => {
      const media = {
        url: 'not-a-url',
        tweetUsername: 'unknown',
        tweetId: '123',
      } as unknown as MediaInfo;

      const result = service.generateMediaFilename(media);
      // Should fall back to tweet_123_1.jpg because username extraction failed
      expect(result).toBe('tweet_123_1.jpg');
    });

    it('should handle non-string URL in extraction', () => {
      const media = {
        url: null as unknown as string,
        tweetUsername: 'unknown',
        tweetId: '123',
      } as unknown as MediaInfo;

      const result = service.generateMediaFilename(media);
      expect(result).toBe('tweet_123_1.jpg');
    });
  });

  describe('Index Normalization', () => {
    it('should normalize undefined index to "1"', () => {
      const media = { url: 'https://example.com/img.jpg' } as unknown as MediaInfo;
      const result = service.generateMediaFilename(media, {});
      expect(result).toMatch(/_1\.jpg$/);
    });

    it('should normalize null index to "1"', () => {
      const media = { url: 'https://example.com/img.jpg' } as unknown as MediaInfo;
      const result = service.generateMediaFilename(media, { index: null as unknown as number });
      expect(result).toMatch(/_1\.jpg$/);
    });

    it('should normalize 0 index to "1"', () => {
      const media = { url: 'https://example.com/img.jpg' } as unknown as MediaInfo;
      const result = service.generateMediaFilename(media, { index: 0 });
      expect(result).toMatch(/_1\.jpg$/);
    });

    it('should normalize negative index to "1"', () => {
      const media = { url: 'https://example.com/img.jpg' } as unknown as MediaInfo;
      const result = service.generateMediaFilename(media, { index: -5 });
      expect(result).toMatch(/_1\.jpg$/);
    });
  });

  describe('Sanitization', () => {
    it('should trim leading/trailing dots and spaces', () => {
      const media = {
        url: 'https://x.com/user/status/123.jpg',
        filename: ' . test . ',
      } as unknown as MediaInfo;

      const result = service.generateMediaFilename(media);
      expect(result).toBe('test');
    });

    it('should fallback to "media" if sanitized name is empty', () => {
      const media = {
        url: 'https://x.com/user/status/123.jpg',
        filename: '   ', // Only spaces
      } as unknown as MediaInfo;

      // If filename becomes empty after sanitize, it might fall back to generated name logic in generateMediaFilename
      // But let's test the internal sanitize behavior via public method if possible.
      // Since we can't access private sanitize, we rely on generateMediaFilename behavior.
      // If filename is provided but sanitizes to empty, generateMediaFilename returns the sanitized result?
      // Looking at code: if (media.filename && media.filename.length > 0) { return this.sanitize(media.filename); }
      // sanitize returns 'media' if !name.

      const result = service.generateMediaFilename(media);
      expect(result).toBe('media');
    });
  });

  describe('Extension Logic', () => {
    it('should default to jpg if URL has no path', () => {
      const media = { url: 'https://example.com' } as unknown as MediaInfo;
      const result = service.generateMediaFilename(media);
      expect(result).toMatch(/\.jpg$/);
    });

    it('should default to jpg if URL has no extension', () => {
      const media = { url: 'https://example.com/image' } as unknown as MediaInfo;
      const result = service.generateMediaFilename(media);
      expect(result).toMatch(/\.jpg$/);
    });

    it('should default to jpg if extension is invalid', () => {
      const media = { url: 'https://example.com/image.exe' } as unknown as MediaInfo;
      const result = service.generateMediaFilename(media);
      expect(result).toMatch(/\.jpg$/);
    });
  });

  describe('Username Extraction Edge Cases', () => {
    it('should reject usernames that are too long', () => {
      const longUser = 'a'.repeat(16);
      const media = {
        url: `https://x.com/${longUser}/status/123`,
        tweetUsername: 'unknown',
        tweetId: '123',
      } as unknown as MediaInfo;

      const result = service.generateMediaFilename(media);
      // Should fail extraction and fallback to tweet_123
      expect(result).toBe('tweet_123_1.jpg');
    });

    it('should reject reserved paths as usernames', () => {
      const media = {
        url: 'https://x.com/home/status/123',
        tweetUsername: 'unknown',
        tweetId: '123',
      } as unknown as MediaInfo;

      const result = service.generateMediaFilename(media);
      expect(result).toBe('tweet_123_1.jpg');
    });
  });

  describe('Media ID Parsing', () => {
    it('should parse _media_ format correctly', () => {
      // Test the regex match(/_media_(\d+)$/)
      const media = {
        url: 'https://example.com/img.jpg',
        id: 'tweet_123_media_5',
      } as unknown as MediaInfo;

      // getIndex logic: if _media_ match, returns idx + 1
      // 5 -> 6
      const result = service.generateMediaFilename(media);
      expect(result).toMatch(/_6\.jpg$/);
    });

    it('should parse simple underscore format correctly', () => {
      // Test the regex match(/_(\d+)$/)
      const media = {
        url: 'https://example.com/img.jpg',
        id: 'image_5',
      } as unknown as MediaInfo;

      // getIndex logic: if simple match, returns match[1] (5)
      const result = service.generateMediaFilename(media);
      expect(result).toMatch(/_5\.jpg$/);
    });

    it('should return null index for non-matching ID', () => {
      const media = {
        url: 'https://example.com/img.jpg',
        id: 'nomatch',
      } as unknown as MediaInfo;

      // Should fallback to options.index (default 1)
      const result = service.generateMediaFilename(media);
      expect(result).toMatch(/_1\.jpg$/);
    });
  });

  describe('Additional Mutation Coverage', () => {
    it('should fallback to default zip filename when tweetId is missing', () => {
      const mediaItems = [
        { url: 'https://x.com/user/status/123/photo/1', tweetUsername: 'user123' } as MediaInfo,
      ];
      const filename = service.generateZipFilename(mediaItems);
      expect(filename).toMatch(/^xcom_gallery_\d+\.zip$/);
    });

    it('should fallback to default zip filename when username is missing', () => {
      const mediaItems = [{ url: 'https://example.com/img.jpg', tweetId: '987654' } as MediaInfo];
      const filename = service.generateZipFilename(mediaItems);
      expect(filename).toMatch(/^xcom_gallery_\d+\.zip$/);
    });

    it('should parse multi-digit index in media ID', () => {
      const media = {
        url: 'https://example.com/img.jpg',
        id: 'tweet_123_media_12',
      } as unknown as MediaInfo;

      const filename = service.generateMediaFilename(media);
      expect(filename).toContain('_13.');
    });

    it('should handle tweetId with non-digit prefix correctly', () => {
      const media = {
        url: 'https://example.com/img.jpg',
        tweetId: 'abc123',
      } as unknown as MediaInfo;

      const filename = service.generateMediaFilename(media);
      expect(filename).toMatch(/^media_\d+_\d+\.jpg$/);
      expect(filename).not.toContain('abc123');
    });

    it('should prioritize username over fallbackUsername', () => {
      const media = {
        url: 'https://example.com/img.jpg',
        tweetUsername: 'realUser',
        tweetId: '12345',
      } as unknown as MediaInfo;

      const filename = service.generateMediaFilename(media, { fallbackUsername: 'fallbackUser' });
      expect(filename).toContain('realUser');
      expect(filename).not.toContain('fallbackUser');
    });

    it('should handle URL without path for extension', () => {
      const media = {
        url: 'https://example.com', // no path, no extension
        tweetId: '12345',
      } as unknown as MediaInfo;

      const filename = service.generateMediaFilename(media);
      expect(filename).toMatch(/\.jpg$/);
    });
  });

  describe('Extended Mutation Coverage', () => {
    describe('getIndex Logic', () => {
      it('should increment index when mediaId contains "_media_"', () => {
        const media = {
          url: 'https://x.com/user/status/123/photo/1.jpg',
          id: 'some_media_1',
          tweetId: '123',
          tweetUsername: 'user',
        } as unknown as MediaInfo;
        expect(service.generateMediaFilename(media)).toBe('user_123_2.jpg');
      });

      it('should use index as-is when mediaId contains "_" but not "_media_"', () => {
        const media = {
          url: 'https://x.com/user/status/123/photo/1.jpg',
          id: 'some_1',
          tweetId: '123',
          tweetUsername: 'user',
        } as unknown as MediaInfo;
        expect(service.generateMediaFilename(media)).toBe('user_123_1.jpg');
      });
    });

    describe('Username Extraction', () => {
      it('should ignore reserved paths', () => {
        const reserved = ['home', 'explore', 'notifications', 'messages', 'search', 'settings'];
        reserved.forEach(path => {
          const media = {
            url: `https://x.com/${path}/status/123`,
            tweetUsername: 'unknown',
            tweetId: '123',
          } as unknown as MediaInfo;
          expect(service.generateMediaFilename(media)).toBe('tweet_123_1.jpg');
        });
      });

      it('should ignore invalid usernames in URL', () => {
        const media = {
          url: 'https://x.com/invalid-user-name/status/123',
          tweetUsername: 'unknown',
          tweetId: '123',
        } as unknown as MediaInfo;
        expect(service.generateMediaFilename(media)).toBe('tweet_123_1.jpg');
      });

      it('should ignore non-matching hosts', () => {
        const media = {
          url: 'https://google.com/user/status/123',
          tweetUsername: 'unknown',
          tweetId: '123',
        } as unknown as MediaInfo;
        expect(service.generateMediaFilename(media)).toBe('tweet_123_1.jpg');
      });
    });

    describe('Extension Logic', () => {
      it('should allow valid extensions', () => {
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi'];
        extensions.forEach(ext => {
          const media = {
            url: `https://example.com/file.${ext}`,
            tweetId: '123',
            tweetUsername: 'user',
          } as unknown as MediaInfo;
          expect(service.generateMediaFilename(media)).toBe(`user_123_1.${ext}`);
        });
      });

      it('should lowercase extensions', () => {
        const media = {
          url: 'https://example.com/file.PNG',
          tweetId: '123',
          tweetUsername: 'user',
        } as unknown as MediaInfo;
        expect(service.generateMediaFilename(media)).toBe('user_123_1.png');
      });

      it('should fallback to jpg for invalid extensions', () => {
        const media = {
          url: 'https://example.com/file.exe',
          tweetId: '123',
          tweetUsername: 'user',
        } as unknown as MediaInfo;
        expect(service.generateMediaFilename(media)).toBe('user_123_1.jpg');
      });
    });

    describe('Sanitization', () => {
      it('should replace forbidden characters', () => {
        const media = {
          filename: 'file<with>forbidden:chars?.jpg',
        } as unknown as MediaInfo;
        expect(service.generateMediaFilename(media)).toBe('file_with_forbidden_chars_.jpg');
      });
    });
  });

  describe('Validation', () => {
    describe('isValidMediaFilename', () => {
      it('should return true for valid filename', () => {
        expect(service.isValidMediaFilename('valid_file.jpg')).toBe(true);
      });

      it('should return false for empty filename', () => {
        expect(service.isValidMediaFilename('')).toBe(false);
      });

      it('should return false for filename with forbidden characters', () => {
        const forbidden = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
        forbidden.forEach((char) => {
          expect(service.isValidMediaFilename(`file${char}name.jpg`)).toBe(false);
        });
      });
    });

    describe('isValidZipFilename', () => {
      it('should return true for valid zip filename', () => {
        expect(service.isValidZipFilename('archive.zip')).toBe(true);
      });

      it('should return false if extension is not .zip', () => {
        expect(service.isValidZipFilename('archive.rar')).toBe(false);
      });

      it('should return false for zip filename with forbidden characters', () => {
        const forbidden = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
        forbidden.forEach((char) => {
          expect(service.isValidZipFilename(`arch${char}ive.zip`)).toBe(false);
        });
      });
    });
  });

  describe('Quoted Metadata Edge Cases', () => {
    it('should fallback to tweet metadata if quotedUsername is missing', () => {
      const media = {
        url: 'https://x.com/user/status/123/photo/1.jpg',
        sourceLocation: 'quoted',
        quotedTweetId: '999',
        // quotedUsername missing
        tweetUsername: 'mainUser',
        tweetId: '123',
      } as unknown as MediaInfo;

      const result = service.generateMediaFilename(media);
      expect(result).toBe('mainUser_123_1.jpg');
    });

    it('should fallback to tweet metadata if quotedTweetId is missing', () => {
      const media = {
        url: 'https://x.com/user/status/123/photo/1.jpg',
        sourceLocation: 'quoted',
        quotedUsername: 'quotedUser',
        // quotedTweetId missing
        tweetUsername: 'mainUser',
        tweetId: '123',
      } as unknown as MediaInfo;

      const result = service.generateMediaFilename(media);
      expect(result).toBe('mainUser_123_1.jpg');
    });
  });
});
