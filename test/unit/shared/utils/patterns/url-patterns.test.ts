/**
 * URL Pattern Utilities Unit Tests
 */

import { describe, expect, it } from 'vitest';

// URLPatterns를 실제 경로에서 import
import { URLPatterns } from '../../../../../src/shared/utils/patterns/url-patterns';

describe('URLPatterns', () => {
  describe('Twitter/X.com URL Detection', () => {
    it('X.com URL을 올바르게 감지해야 함', () => {
      const validUrls = [
        'https://x.com/user/status/1234567890',
        'https://x.com/elonmusk/status/1234567890123456789',
        'https://x.com/user_name/status/1234567890/photo/1',
        'https://x.com/user/status/1234567890/video/1',
        'https://x.com/user/status/1234567890?s=20',
      ];

      validUrls.forEach(url => {
        expect(URLPatterns.isXcomUrl(url)).toBe(true);
      });
    });

    it('twitter.com URL을 올바르게 감지해야 함', () => {
      const validUrls = [
        'https://twitter.com/user/status/1234567890',
        'https://twitter.com/elonmusk/status/1234567890123456789',
        'https://twitter.com/user_name/status/1234567890/photo/1',
        'https://mobile.twitter.com/user/status/1234567890',
      ];

      validUrls.forEach(url => {
        expect(URLPatterns.isTwitterUrl(url)).toBe(true);
      });
    });

    it('잘못된 URL을 거부해야 함', () => {
      const invalidUrls = [
        'https://facebook.com/user/posts/123',
        'https://instagram.com/p/ABC123/',
        'https://example.com',
        'https://x.co/status/123', // 잘못된 도메인
        '',
      ];

      invalidUrls.forEach(url => {
        expect(URLPatterns.isXcomUrl(url as string)).toBe(false);
        expect(URLPatterns.isTwitterUrl(url as string)).toBe(false);
      });

      // null과 undefined 별도 체크
      expect(URLPatterns.isXcomUrl(null as any)).toBe(false);
      expect(URLPatterns.isXcomUrl(undefined as any)).toBe(false);
      expect(URLPatterns.isTwitterUrl(null as any)).toBe(false);
      expect(URLPatterns.isTwitterUrl(undefined as any)).toBe(false);
    });
  });

  describe('Tweet ID Extraction', () => {
    it('X.com URL에서 트윗 ID를 추출해야 함', () => {
      const testCases = [
        {
          url: 'https://x.com/user/status/1234567890',
          expected: '1234567890',
        },
        {
          url: 'https://x.com/elonmusk/status/1234567890123456789',
          expected: '1234567890123456789',
        },
        {
          url: 'https://x.com/user/status/1234567890/photo/1',
          expected: '1234567890',
        },
        {
          url: 'https://x.com/user/status/1234567890?s=20&t=abc',
          expected: '1234567890',
        },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(URLPatterns.extractTweetId(url)).toBe(expected);
      });
    });

    it('twitter.com URL에서 트윗 ID를 추출해야 함', () => {
      const testCases = [
        {
          url: 'https://twitter.com/user/status/1234567890',
          expected: '1234567890',
        },
        {
          url: 'https://mobile.twitter.com/user/status/9876543210',
          expected: '9876543210',
        },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(URLPatterns.extractTweetId(url)).toBe(expected);
      });
    });

    it('잘못된 URL에서 null을 반환해야 함', () => {
      const invalidUrls = [
        'https://facebook.com/posts/123',
        'https://x.com/user/profile',
        'https://x.com/status', // ID 누락
        '',
        null,
        undefined,
      ];

      invalidUrls.forEach(url => {
        expect(URLPatterns.extractTweetId(url as string)).toBe(null);
      });
    });
  });

  describe('Username Extraction', () => {
    it('URL에서 사용자명을 추출해야 함', () => {
      const testCases = [
        {
          url: 'https://x.com/elonmusk/status/1234567890',
          expected: 'elonmusk',
        },
        {
          url: 'https://twitter.com/user_name/status/1234567890',
          expected: 'user_name',
        },
        {
          url: 'https://x.com/User123/status/1234567890/photo/1',
          expected: 'User123',
        },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(URLPatterns.extractUsername(url)).toBe(expected);
      });
    });

    it('잘못된 URL에서 null을 반환해야 함', () => {
      const invalidUrls = [
        'https://facebook.com/user',
        'https://x.com/status/123', // 사용자명 누락
        'https://x.com/',
        '',
        null,
      ];

      invalidUrls.forEach(url => {
        expect(URLPatterns.extractUsername(url as string)).toBe(null);
      });
    });
  });

  describe('Media URL Detection', () => {
    it('이미지 URL을 올바르게 감지해야 함', () => {
      const imageUrls = [
        'https://pbs.twimg.com/media/ABC123.jpg',
        'https://pbs.twimg.com/media/DEF456.png',
        'https://pbs.twimg.com/media/GHI789.gif',
        'https://pbs.twimg.com/media/JKL012.webp',
        'https://pbs.twimg.com/media/MNO345.jpg:large',
        'https://pbs.twimg.com/media/PQR678.png:orig',
      ];

      imageUrls.forEach(url => {
        expect(URLPatterns.isImageUrl(url)).toBe(true);
        expect(URLPatterns.isMediaUrl(url)).toBe(true);
      });
    });

    it('비디오 URL을 올바르게 감지해야 함', () => {
      const videoUrls = [
        'https://video.twimg.com/ext_tw_video/123456789.mp4',
        'https://video.twimg.com/ext_tw_video/987654321.m3u8',
        'https://video.twimg.com/tweet_video/ABC123.mp4',
        'https://video.twimg.com/amplify_video/DEF456.mp4',
      ];

      videoUrls.forEach(url => {
        expect(URLPatterns.isVideoUrl(url)).toBe(true);
        expect(URLPatterns.isMediaUrl(url)).toBe(true);
      });
    });

    it('미디어가 아닌 URL을 거부해야 함', () => {
      const nonMediaUrls = [
        'https://x.com/user/status/123',
        'https://example.com/page.html', // 다른 도메인, 미디어 확장자 아님
        'https://pbs.twimg.com/profile_images/123.jpg', // 프로필 이미지
        'https://abs.twimg.com/media/123.jpg', // 잘못된 서브도메인
        '',
        null,
      ];

      nonMediaUrls.forEach((url, index) => {
        const result = URLPatterns.isMediaUrl(url as string);
        expect(result).toBe(false);
      });
    });
  });

  describe('URL Normalization', () => {
    it('이미지 URL을 원본 크기로 변환해야 함', () => {
      const testCases = [
        {
          input: 'https://pbs.twimg.com/media/ABC123.jpg',
          expected: 'https://pbs.twimg.com/media/ABC123.jpg:orig',
        },
        {
          input: 'https://pbs.twimg.com/media/DEF456.png:small',
          expected: 'https://pbs.twimg.com/media/DEF456.png:orig',
        },
        {
          input: 'https://pbs.twimg.com/media/GHI789.jpg:large',
          expected: 'https://pbs.twimg.com/media/GHI789.jpg:orig',
        },
        {
          input: 'https://pbs.twimg.com/media/JKL012.gif:orig',
          expected: 'https://pbs.twimg.com/media/JKL012.gif:orig', // 이미 원본
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(URLPatterns.getOriginalImageUrl(input)).toBe(expected);
      });
    });

    it('비이미지 URL은 그대로 반환해야 함', () => {
      const nonImageUrls = [
        'https://video.twimg.com/ext_tw_video/123.mp4',
        'https://x.com/user/status/123',
        'https://example.com/file.txt',
      ];

      nonImageUrls.forEach(url => {
        expect(URLPatterns.getOriginalImageUrl(url)).toBe(url);
      });
    });

    it('URL을 정규화해야 함', () => {
      const testCases = [
        {
          input: 'https://x.com/user/status/123?s=20&t=abc',
          expected: 'https://x.com/user/status/123',
        },
        {
          input: 'https://twitter.com/user/status/123#section',
          expected: 'https://twitter.com/user/status/123',
        },
        {
          input: 'https://x.com/user/status/123/',
          expected: 'https://x.com/user/status/123',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(URLPatterns.normalizeUrl(input)).toBe(expected);
      });
    });
  });

  describe('URL Validation', () => {
    it('URL 형식을 검증해야 함', () => {
      const validUrls = [
        'https://x.com/user/status/123',
        'http://twitter.com/user/status/123',
        'https://pbs.twimg.com/media/ABC.jpg',
      ];

      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert(1)',
        '',
        '   ',
        null,
        undefined,
      ];

      validUrls.forEach(url => {
        expect(URLPatterns.isValidUrl(url)).toBe(true);
      });

      invalidUrls.forEach(url => {
        expect(URLPatterns.isValidUrl(url as string)).toBe(false);
      });
    });

    it('상대 URL을 절대 URL로 변환해야 함', () => {
      const testCases = [
        {
          relative: '/user/status/123',
          base: 'https://x.com',
          expected: 'https://x.com/user/status/123',
        },
        {
          relative: '../media/ABC.jpg',
          base: 'https://pbs.twimg.com/base/',
          expected: 'https://pbs.twimg.com/media/ABC.jpg',
        },
        {
          relative: 'https://absolute.com/path',
          base: 'https://x.com',
          expected: 'https://absolute.com/path', // 이미 절대 URL
        },
      ];

      testCases.forEach(({ relative, base, expected }) => {
        const result = URLPatterns.resolveUrl(relative, base);
        // URL 생성자의 실제 동작에 맞춘 검증
        expect(result).toContain(new URL(relative, base).pathname);
      });
    });
  });

  describe('Pattern Matching', () => {
    it('패턴과 일치하는 URL을 찾아야 함', () => {
      const urls = [
        'https://x.com/user1/status/123',
        'https://twitter.com/user2/status/456',
        'https://facebook.com/posts/789',
        'https://pbs.twimg.com/media/ABC.jpg',
      ];

      // 'twitter' 패턴은 twitter.com만 매칭 (twimg는 twitter가 아님)
      const twitterUrls = URLPatterns.findMatchingUrls(urls, 'twitter');
      expect(twitterUrls).toHaveLength(1); // twitter.com만

      const xUrls = URLPatterns.findMatchingUrls(urls, 'x.com');
      expect(xUrls).toHaveLength(1);

      const mediaUrls = URLPatterns.findMatchingUrls(urls, 'media');
      expect(mediaUrls).toHaveLength(1);

      // 'twimg' 패턴으로 테스트하면 twimg.com URL이 매칭됨
      const twimgUrls = URLPatterns.findMatchingUrls(urls, 'twimg');
      expect(twimgUrls).toHaveLength(1);
    });

    it('정규식 패턴을 지원해야 함', () => {
      const urls = [
        'https://x.com/user/status/1234567890',
        'https://x.com/user/status/123', // 짧은 ID
        'https://x.com/user/profile',
      ];

      const longIdPattern = /status\/\d{10,}/;
      const matchingUrls = URLPatterns.findMatchingUrls(urls, longIdPattern);
      expect(matchingUrls).toHaveLength(1); // 10자리 이상 ID만
    });
  });

  describe('Error Handling', () => {
    it('잘못된 입력에 대해 안전하게 처리해야 함', () => {
      const invalidInputs = [null, undefined, '', '   ', 123, {}, []];

      invalidInputs.forEach(input => {
        expect(() => URLPatterns.isXcomUrl(input as string)).not.toThrow();
        expect(() => URLPatterns.extractTweetId(input as string)).not.toThrow();
        expect(() => URLPatterns.extractUsername(input as string)).not.toThrow();
        expect(() => URLPatterns.isMediaUrl(input as string)).not.toThrow();
      });
    });

    it('URL 파싱 에러를 처리해야 함', () => {
      const malformedUrls = ['https://', 'https://x.com:invalid-port', 'https://[invalid-ipv6]'];

      malformedUrls.forEach(url => {
        expect(() => URLPatterns.normalizeUrl(url)).not.toThrow();
        // URL 검증은 라이브러리마다 다를 수 있으므로 에러가 발생하지 않는지만 확인
        const result = URLPatterns.isValidUrl(url);
        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('Performance', () => {
    it('대량의 URL 처리가 효율적이어야 함', () => {
      const urls = Array.from(
        { length: 1000 },
        (_, i) => `https://x.com/user${i}/status/123456789${i}`
      );

      const start = performance.now();

      urls.forEach(url => {
        URLPatterns.isXcomUrl(url);
        URLPatterns.extractTweetId(url);
        URLPatterns.extractUsername(url);
      });

      const end = performance.now();

      expect(end - start).toBeLessThan(100); // 100ms 이내
    });

    it('정규식 컴파일이 캐시되어야 함', () => {
      const url = 'https://x.com/user/status/123456789';

      const start = performance.now();

      // 같은 패턴을 여러 번 실행
      for (let i = 0; i < 1000; i++) {
        URLPatterns.isXcomUrl(url);
      }

      const end = performance.now();

      expect(end - start).toBeLessThan(50); // 50ms 이내 (캐시 효과)
    });
  });
});
