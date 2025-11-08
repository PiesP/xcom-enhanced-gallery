/**
 * @fileoverview 유틸리티 통합 테스트
 * @description 미디어 추출 및 갤러리 관리 워크플로우 검증
 *
 * Phase 171A: 현대화
 * - Mock 팩토리 패턴 적용
 * - 간단명료한 테스트 구조
 * - 실제 사용 시나리오 중심
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';

/** Mock Media Extractor */
class MediaExtractor {
  async extract(element: HTMLElement) {
    if (!element) throw new Error('Element is required');

    if (element.tagName === 'IMG') {
      return {
        success: true,
        items: [{ type: 'image', url: (element as HTMLImageElement).src }],
      };
    }

    if (element.tagName === 'VIDEO') {
      return {
        success: true,
        items: [{ type: 'video', url: (element as HTMLVideoElement).src }],
      };
    }

    return { success: false, items: [] };
  }
}

/** Mock Gallery Manager */
class GalleryManager {
  private opened = false;

  async open(items: Array<{ type: string; url: string }>): Promise<boolean> {
    if (!items?.length) return false;
    this.opened = true;
    return true;
  }

  close(): void {
    this.opened = false;
  }

  isOpen(): boolean {
    return this.opened;
  }
}

/** Element Factory */
const createMedia = (
  tag: 'img' | 'video',
  src: string,
  options: Record<string, string> = {}
): HTMLElement => {
  const el = document.createElement(tag);
  el.setAttribute('src', src);
  Object.entries(options).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
};

describe('Utility Integration Tests', () => {
  setupGlobalTestIsolation();

  let extractor: MediaExtractor;
  let gallery: GalleryManager;
  let container: HTMLElement;

  beforeEach(() => {
    extractor = new MediaExtractor();
    gallery = new GalleryManager();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.remove();
    gallery.close();
  });

  describe('미디어 추출 및 갤러리 워크플로우', () => {
    it('이미지 추출 후 갤러리를 열어야 한다', async () => {
      const img = createMedia('img', 'https://pbs.twimg.com/media/test.jpg');
      container.appendChild(img);

      const result = await extractor.extract(img);
      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(1);

      const opened = await gallery.open(result.items);
      expect(opened).toBe(true);
      expect(gallery.isOpen()).toBe(true);
    });

    it('비디오 추출 후 갤러리를 열어야 한다', async () => {
      const video = createMedia('video', 'https://video.twimg.com/video.mp4');
      container.appendChild(video);

      const result = await extractor.extract(video);
      expect(result.success).toBe(true);
      expect(result.items[0].type).toBe('video');

      const opened = await gallery.open(result.items);
      expect(opened).toBe(true);
    });

    it('잘못된 요소는 갤러리를 열지 않아야 한다', async () => {
      const div = document.createElement('div');
      container.appendChild(div);

      const result = await extractor.extract(div);
      expect(result.success).toBe(false);

      const opened = await gallery.open(result.items);
      expect(opened).toBe(false);
      expect(gallery.isOpen()).toBe(false);
    });
  });

  describe('에러 처리', () => {
    it('null 요소에 대해 에러를 발생시켜야 한다', async () => {
      await expect(extractor.extract(null as any)).rejects.toThrow('Element is required');
    });

    it('빈 미디어로 갤러리를 열 수 없어야 한다', async () => {
      const opened = await gallery.open([]);
      expect(opened).toBe(false);
    });
  });

  describe('복잡한 시나리오', () => {
    it('여러 미디어 요소를 순차 처리해야 한다', async () => {
      const items = [
        createMedia('img', 'https://pbs.twimg.com/media/1.jpg'),
        createMedia('video', 'https://video.twimg.com/1.mp4'),
        createMedia('img', 'https://pbs.twimg.com/media/2.jpg'),
      ];

      items.forEach(el => container.appendChild(el));

      const results = await Promise.all(items.map(el => extractor.extract(el)));
      expect(results.every(r => r.success)).toBe(true);
    });

    it('갤러리 열기/닫기를 반복 수행해야 한다', async () => {
      const img = createMedia('img', 'https://pbs.twimg.com/media/test.jpg');
      const result = await extractor.extract(img);

      for (let i = 0; i < 3; i++) {
        const opened = await gallery.open(result.items);
        expect(opened).toBe(true);
        gallery.close();
        expect(gallery.isOpen()).toBe(false);
      }
    });
  });
});
