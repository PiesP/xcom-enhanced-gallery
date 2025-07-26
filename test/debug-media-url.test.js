/**
 * 디버그용 간단한 테스트
 */

import { describe, it, expect } from 'vitest';

describe('Debug Media URL', () => {
  it('should test URL constructor in test environment', () => {
    console.log('globalThis.URL:', typeof globalThis.URL);
    console.log('URL constructor available:', !!globalThis.URL);

    if (globalThis.URL) {
      const testUrl = 'https://pbs.twimg.com/media/F1a2b3c4d5e.jpg?format=jpg&name=large';
      try {
        const urlObj = new globalThis.URL(testUrl);
        console.log('URL parsing successful');
        console.log('Hostname:', urlObj.hostname);
        console.log('Pathname:', urlObj.pathname);
        console.log('Has /media/:', urlObj.pathname.includes('/media/'));
        console.log('Has profile_images:', urlObj.pathname.includes('/profile_images/'));

        expect(urlObj.hostname).toBe('pbs.twimg.com');
        expect(urlObj.pathname.includes('/media/')).toBe(true);
        expect(urlObj.pathname.includes('/profile_images/')).toBe(false);
      } catch (error) {
        console.error('URL parsing failed:', error);
        throw error;
      }
    }
  });

  it('should test manual isValidMediaUrl implementation', () => {
    function testIsValidMediaUrl(url) {
      if (!url || typeof url !== 'string') {
        return false;
      }

      if (url.length > 2048) {
        return false;
      }

      try {
        const urlObj = new globalThis.URL(url);

        if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
          return false;
        }

        if (urlObj.hostname === 'pbs.twimg.com') {
          return (
            urlObj.pathname.includes('/media/') && !urlObj.pathname.includes('/profile_images/')
          );
        }

        if (urlObj.hostname === 'video.twimg.com') {
          return true;
        }

        return false;
      } catch {
        return false;
      }
    }

    const testUrls = [
      'https://pbs.twimg.com/media/F1a2b3c4d5e.jpg?format=jpg&name=large',
      'https://video.twimg.com/video.mp4',
      'https://example.com/image.jpg',
    ];

    testUrls.forEach((url, index) => {
      const result = testIsValidMediaUrl(url);
      console.log(`URL ${index + 1}: ${url}`);
      console.log(`Result: ${result}`);

      if (index < 2) {
        expect(result).toBe(true);
      } else {
        expect(result).toBe(false);
      }
    });
  });
});
