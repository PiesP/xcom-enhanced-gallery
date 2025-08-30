/**
 * @fileoverview TDD: 다운로드 함수 중복 제거 테스트 (간소화)
 * @description MediaService와 BulkDownloadService 간 다운로드 함수 중복 해결
 * @version 1.0.0 - Phase 1.2 통합
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

describe.skip('TDD Phase 1.2: 다운로드 함수 중복 제거 (간소화)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GREEN: 중복 제거 성공 검증', () => {
    test('MediaService에서 중복된 다운로드 메서드가 제거됨', async () => {
      const { MediaService } = await import('@shared/services/MediaService');
      const mediaService = MediaService.getInstance();

      // GREEN: 클래스에서 직접 다운로드 메서드들이 제거되었음
      expect(typeof mediaService.downloadSingle).toBe('undefined');
      expect(typeof mediaService.downloadMultiple).toBe('undefined');
      expect(typeof mediaService.downloadBulk).toBe('undefined');

      // GREEN: 대신 getDownloadService 메서드 제공
      expect(typeof mediaService.getDownloadService).toBe('function');
    });

    test('BulkDownloadService에 직접 접근 가능', async () => {
      const { MediaService } = await import('@shared/services/MediaService');
      const mediaService = MediaService.getInstance();

      // GREEN: 다운로드 서비스 인스턴스 반환
      const downloadService = mediaService.getDownloadService();

      expect(downloadService).toBeDefined();
      expect(typeof downloadService.downloadSingle).toBe('function');
      expect(typeof downloadService.downloadMultiple).toBe('function');
      expect(typeof downloadService.downloadBulk).toBe('function');
    });

    test('export된 별칭 함수들을 통한 호환성 유지', async () => {
      const { downloadSingle, downloadMultiple, downloadBulk } = await import(
        '@shared/services/MediaService'
      );

      // GREEN: export 함수들이 제공됨
      expect(typeof downloadSingle).toBe('function');
      expect(typeof downloadMultiple).toBe('function');
      expect(typeof downloadBulk).toBe('function');
    });
  });

  describe('REFACTOR: 아키텍처 개선 확인', () => {
    test('단일 책임 원칙 적용 - MediaService는 다운로드 서비스 제공만 담당', async () => {
      const { MediaService } = await import('@shared/services/MediaService');
      const mediaService = MediaService.getInstance();

      // REFACTOR: MediaService는 다운로드 로직을 직접 구현하지 않고 서비스 제공만 함
      expect(typeof mediaService.getDownloadService).toBe('function');

      // 직접 다운로드 메서드는 없어야 함
      expect(mediaService.downloadSingle).toBeUndefined();
      expect(mediaService.downloadMultiple).toBeUndefined();
      expect(mediaService.downloadBulk).toBeUndefined();
    });

    test('의존성 주입 패턴 적용 확인', async () => {
      const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');

      // REFACTOR: BulkDownloadService는 독립적으로 사용 가능
      expect(() => new BulkDownloadService()).not.toThrow();

      const bulkService = new BulkDownloadService();
      expect(typeof bulkService.downloadSingle).toBe('function');
      expect(typeof bulkService.downloadMultiple).toBe('function');
    });

    test('호환성 메서드 deprecation 확인', async () => {
      const { MediaService } = await import('@shared/services/MediaService');
      const mediaService = MediaService.getInstance();

      // REFACTOR: downloadMedia는 여전히 존재하지만 내부적으로 getDownloadService 사용
      expect(typeof mediaService.downloadMedia).toBe('function');
    });
  });
});
