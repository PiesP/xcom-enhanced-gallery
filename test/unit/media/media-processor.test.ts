/**
 * @fileoverview Phase 3: MediaProcessor TDD 테스트
 * @description HTML → MediaDescriptor[] 추출 로직 검증
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';

describe('Phase 3: MediaProcessor 도입 (GREEN 테스트)', () => {
  setupGlobalTestIsolation();

  describe('1. MediaProcessor 기본 구조', () => {
    it('MediaProcessor 클래스가 존재해야 한다', async () => {
      // GREEN: 클래스 import 성공
      const { MediaProcessor } = await import('@shared/media/media-processor');
      expect(typeof MediaProcessor).toBe('function');
    });

    it('processMedia 함수가 존재해야 한다', async () => {
      // GREEN: 함수 import 성공
      const { processMedia } = await import('@shared/media/media-processor');
      expect(typeof processMedia).toBe('function');
    });
  });

  describe('2. MediaDescriptor 타입', () => {
    it('MediaDescriptor 타입이 정의되어야 한다', async () => {
      // GREEN: 타입 import 성공
      const module = await import('@shared/media/types');
      expect(module).toBeDefined();
      expect(typeof module).toBe('object');
    });
  });

  describe('3. 파이프라인 단계별 함수', () => {
    it('collectNodes 함수가 존재해야 한다', async () => {
      // GREEN: 함수 import 성공
      const { collectNodes } = await import('@shared/media/pipeline');
      expect(typeof collectNodes).toBe('function');
    });

    it('extractRawData 함수가 존재해야 한다', async () => {
      // GREEN: 함수 import 성공
      const { extractRawData } = await import('@shared/media/pipeline');
      expect(typeof extractRawData).toBe('function');
    });

    it('normalize 함수가 존재해야 한다', async () => {
      // GREEN: 함수 import 성공
      const { normalize } = await import('@shared/media/pipeline');
      expect(typeof normalize).toBe('function');
    });

    it('dedupe 함수가 존재해야 한다', async () => {
      // GREEN: 함수 import 성공
      const { dedupe } = await import('@shared/media/pipeline');
      expect(typeof dedupe).toBe('function');
    });

    it('validate 함수가 존재해야 한다', async () => {
      // GREEN: 함수 import 성공
      const { validate } = await import('@shared/media/pipeline');
      expect(typeof validate).toBe('function');
    });
  });

  describe('4. 기본 동작 검증', () => {
    it('빈 DOM에서 빈 배열을 반환해야 한다', async () => {
      // GREEN: 기본 동작 검증
      const { processMedia } = await import('@shared/media/media-processor');
      const div = document.createElement('div');
      const result = processMedia(div);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data).toEqual([]);
      }
    });

    it('img 요소에서 MediaDescriptor를 추출해야 한다', async () => {
      // GREEN: img 추출 로직 검증
      const { processMedia } = await import('@shared/media/media-processor');
      const div = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://example.com/image.jpg';
      div.appendChild(img);

      const result = processMedia(div);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].url).toBe('https://example.com/image.jpg');
        expect(result.data[0].type).toBe('image');
      }
    });

    it('video 요소에서 MediaDescriptor를 추출해야 한다', async () => {
      // GREEN: video 추출 로직 검증
      const { processMedia } = await import('@shared/media/media-processor');
      const div = document.createElement('div');
      const video = document.createElement('video');
      video.src = 'https://example.com/video.mp4';
      div.appendChild(video);

      const result = processMedia(div);

      expect(result.status === 'success').toBe(true);
      if (result.status === 'success') {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].url).toBe('https://example.com/video.mp4');
        expect(result.data[0].type).toBe('video');
      }
    });
  });

  describe('5. Result 패턴 적용', () => {
    it('processMedia가 Result<MediaDescriptor[]>를 반환해야 한다', async () => {
      // GREEN: Result 패턴 검증
      const { processMedia } = await import('@shared/media/media-processor');
      const div = document.createElement('div');

      const result = processMedia(div);

      expect(result).toHaveProperty('status');
      expect(typeof result.status).toBe('string');
      if (result.status === 'success') {
        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
      } else {
        expect(result).toHaveProperty('error');
      }
    });

    it('에러 시 Result.error를 반환해야 한다', async () => {
      // GREEN: 에러 처리 검증
      const { processMedia } = await import('@shared/media/media-processor');

      // null을 전달하여 에러 유발 (런타임 null 유지)
      const result = processMedia(null as unknown as HTMLElement);

      expect(result.status === 'success').toBe(false);
      if (!result.status === 'success') {
        const errorResult = result as Extract<typeof result, { success: false }>;
        expect(errorResult.error).toBeTruthy();
        expect(errorResult.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('6. 고급 케이스 (C2 커버리지 보강)', () => {
    it('data-src 속성에서도 URL을 추출해야 한다', async () => {
      const { processMedia } = await import('@shared/media/media-processor');
      const root = document.createElement('div');
      const img = document.createElement('img');
      img.setAttribute('data-src', '/assets/pic.png');
      root.appendChild(img);

      const result = processMedia(root);
      expect(result.status === 'success').toBe(true);
      if (result.status === 'success') {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].url).toBe('/assets/pic.png');
        expect(result.data[0].type).toBe('image');
      }
    });

    it('<video>와 <source>가 함께 있을 때 중복 없이 한 항목만 생성해야 한다', async () => {
      const { processMedia } = await import('@shared/media/media-processor');
      const root = document.createElement('div');
      const video = document.createElement('video');
      video.src = 'https://example.com/clip.mp4';
      const source = document.createElement('source');
      source.src = 'https://example.com/clip.mp4';
      video.appendChild(source);
      root.appendChild(video);

      const result = processMedia(root);
      expect(result.status === 'success').toBe(true);
      if (result.status === 'success') {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].url).toBe('https://example.com/clip.mp4');
        expect(result.data[0].type).toBe('video');
      }
    });

    it('상대 경로와 data: URL도 유효로 간주해야 한다', async () => {
      const { processMedia } = await import('@shared/media/media-processor');
      const root = document.createElement('div');
      const img1 = document.createElement('img');
      img1.src = '/images/pic.jpg';
      const img2 = document.createElement('img');
      img2.src = 'data:image/png;base64,iVBORw0KGgo=';
      root.appendChild(img1);
      root.appendChild(img2);

      const result = processMedia(root);
      expect(result.status === 'success').toBe(true);
      if (result.status === 'success') {
        expect(result.data).toHaveLength(2);
        const urls = result.data.map(d => d.url);
        expect(urls).toContain('/images/pic.jpg');
        expect(urls).toContain('data:image/png;base64,iVBORw0KGgo=');
      }
    });

    it('img와 source가 같은 URL을 가리키면 dedupe되어야 한다', async () => {
      const { processMedia } = await import('@shared/media/media-processor');
      const root = document.createElement('div');
      const picture = document.createElement('picture');
      const source = document.createElement('source');
      source.src = 'https://example.com/image.jpg';
      const img = document.createElement('img');
      img.src = 'https://example.com/image.jpg';
      picture.appendChild(source);
      picture.appendChild(img);
      root.appendChild(picture);

      const result = processMedia(root);
      expect(result.status === 'success').toBe(true);
      if (result.status === 'success') {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].url).toBe('https://example.com/image.jpg');
        expect(result.data[0].type).toBe('image');
      }
    });
  });
});
