/**
 * @fileoverview Phase 3: MediaProcessor TDD 테스트
 * @description HTML → MediaDescriptor[] 추출 로직 검증
 */

import { describe, it, expect } from 'vitest';

describe('Phase 3: MediaProcessor 도입 (GREEN 테스트)', () => {
  describe('1. MediaProcessor 기본 구조', () => {
    it('MediaProcessor 클래스가 존재해야 한다', async () => {
      // GREEN: 클래스 import 성공
      const { MediaProcessor } = await import('@shared/media/MediaProcessor');
      expect(typeof MediaProcessor).toBe('function');
    });

    it('processMedia 함수가 존재해야 한다', async () => {
      // GREEN: 함수 import 성공
      const { processMedia } = await import('@shared/media/MediaProcessor');
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
      const { processMedia } = await import('@shared/media/MediaProcessor');
      const div = document.createElement('div');
      const result = processMedia(div);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('img 요소에서 MediaDescriptor를 추출해야 한다', async () => {
      // GREEN: img 추출 로직 검증
      const { processMedia } = await import('@shared/media/MediaProcessor');
      const div = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://example.com/image.jpg';
      div.appendChild(img);

      const result = processMedia(div);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].url).toBe('https://example.com/image.jpg');
        expect(result.data[0].type).toBe('image');
      }
    });

    it('video 요소에서 MediaDescriptor를 추출해야 한다', async () => {
      // GREEN: video 추출 로직 검증
      const { processMedia } = await import('@shared/media/MediaProcessor');
      const div = document.createElement('div');
      const video = document.createElement('video');
      video.src = 'https://example.com/video.mp4';
      div.appendChild(video);

      const result = processMedia(div);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].url).toBe('https://example.com/video.mp4');
        expect(result.data[0].type).toBe('video');
      }
    });
  });

  describe('5. Result 패턴 적용', () => {
    it('processMedia가 Result<MediaDescriptor[]>를 반환해야 한다', async () => {
      // GREEN: Result 패턴 검증
      const { processMedia } = await import('@shared/media/MediaProcessor');
      const div = document.createElement('div');

      const result = processMedia(div);

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      if (result.success) {
        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
      } else {
        expect(result).toHaveProperty('error');
      }
    });

    it('에러 시 Result.error를 반환해야 한다', async () => {
      // GREEN: 에러 처리 검증
      const { processMedia } = await import('@shared/media/MediaProcessor');

      // null을 전달하여 에러 유발
      const result = processMedia(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });
});
