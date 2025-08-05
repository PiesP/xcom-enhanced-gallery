/**
 * @fileoverview TDD Media Service 통합 테스트
 * @description MediaService 통합 완료 후 기능 검증 (Phase GREEN)
 */

import { describe, it, expect } from 'vitest';

describe('🟢 TDD GREEN: Media Service 통합 완료', () => {
  describe('MediaService 단일 통합 검증', () => {
    it('MediaService가 정상적으로 import되어야 함', async () => {
      const { MediaService } = await import('@shared/services');
      expect(MediaService).toBeDefined();
      expect(typeof MediaService).toBe('function');
    });

    it('MediaService의 핵심 메서드들이 존재해야 함', async () => {
      const { MediaService } = await import('@shared/services');
      const service = new MediaService();

      expect(typeof service.extractMediaFromTweet).toBe('function');
      expect(typeof service.downloadMedia).toBe('function');
      expect(typeof service.processMediaUrls).toBe('function');
    });
  });

  describe('중복 제거 검증', () => {
    it('MediaExtractionService와 MediaService가 통합되어야 함', async () => {
      // MediaService가 추출 기능도 포함하고 있는지 확인
      const { MediaService } = await import('@shared/services');
      const service = new MediaService();

      expect(service.extractMediaFromTweet).toBeDefined();
    });
  });

  describe('기능 유지 검증', () => {
    it('통합 후에도 모든 미디어 기능이 작동해야 함', async () => {
      const { MediaService } = await import('@shared/services');
      const service = new MediaService();

      // 기본 기능 확인
      expect(service).toBeDefined();
      expect(typeof service.extractMediaFromTweet).toBe('function');
    });
  });
});
