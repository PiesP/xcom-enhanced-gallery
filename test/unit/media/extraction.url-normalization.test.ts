import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { extractOriginalImageUrl, isValidMediaUrl } from '@/shared/utils/media/media-url.util';
import { DOMDirectExtractor } from '@/shared/services/media-extraction/extractors/dom-direct-extractor';

describe('Phase C: 미디어 URL 정규화/유효성', () => {
  setupGlobalTestIsolation();

  describe('isValidMediaUrl', () => {
    it('유효하지 않은 입력을 거부한다', () => {
      expect(isValidMediaUrl('')).toBe(false);
      expect(isValidMediaUrl('javascript:alert(1)')).toBe(false);
      expect(isValidMediaUrl('ftp://pbs.twimg.com/media/abc.jpg')).toBe(false);
      expect(isValidMediaUrl('https://pbs.twimg.com/profile_images/abc.jpg')).toBe(false);
      expect(isValidMediaUrl('https://ton.twimg.com/whatever')).toBe(false);

      const long = 'https://pbs.twimg.com/media/' + 'x'.repeat(5000);
      expect(isValidMediaUrl(long)).toBe(false);
    });

    it('트위터 미디어 도메인만 허용한다', () => {
      expect(isValidMediaUrl('https://pbs.twimg.com/media/abc123?format=jpg&name=small')).toBe(
        true
      );
      expect(isValidMediaUrl('https://video.twimg.com/ext_tw_video/abc/vid/720x1280.mp4')).toBe(
        true
      );
      expect(isValidMediaUrl('https://example.com/image.jpg')).toBe(false);
    });
  });

  describe('extractOriginalImageUrl', () => {
    it('name=orig를 강제한다 (jpg/png/webp)', () => {
      const jpg = extractOriginalImageUrl(
        'https://pbs.twimg.com/media/abc123?format=jpg&name=small'
      );
      const png = extractOriginalImageUrl(
        'https://pbs.twimg.com/media/abc123?format=png&name=large'
      );
      const webp = extractOriginalImageUrl(
        'https://pbs.twimg.com/media/abc123?format=webp&name=medium'
      );

      expect(jpg.includes('name=orig')).toBe(true);
      expect(png.includes('name=orig')).toBe(true);
      expect(webp.includes('name=orig')).toBe(true);
    });

    it('name 파라미터가 없으면 추가한다', () => {
      const url = extractOriginalImageUrl('https://pbs.twimg.com/media/abc123?format=jpg');
      expect(url.includes('name=orig')).toBe(true);
    });
  });

  describe('DOMDirectExtractor와 정규화', () => {
    it.skip('이미지 src에서 name=orig로 정규화된 url을 생성한다', async () => {
      const root = globalThis.document.createElement('article');
      root.setAttribute('data-testid', 'tweet'); // 트윗 컨테이너 마킹
      const img = globalThis.document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/abc123?format=webp&name=small';
      root.appendChild(img);
      globalThis.document.body.appendChild(root); // DOM에 연결

      const extractor = new DOMDirectExtractor();
      const result = await extractor.extract(img, {}, 'test_dom_orig');

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.mediaItems.length).toBe(1);
        const first = result.mediaItems[0];
        const url = first ? first.url : '';
        expect(url.includes('name=orig')).toBe(true);
      }

      globalThis.document.body.removeChild(root); // 정리
    });
  });
});
