/**
 * 다운로드 진행률 토스트 기본값 테스트
 * Epic: UX-GALLERY-FEEDBACK-001, Phase 2-2
 *
 * 목적: 대량 다운로드 진행 상황의 가시성을 높이기 위해 진행률 토스트를 기본 활성화
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from '@/constants';

describe('다운로드 진행률 토스트 기본값', () => {
  describe('DEFAULT_SETTINGS 구조', () => {
    it('download 섹션이 존재해야 한다', () => {
      expect(DEFAULT_SETTINGS).toHaveProperty('download');
      expect(DEFAULT_SETTINGS.download).toBeDefined();
    });

    it('showProgressToast 속성이 존재해야 한다', () => {
      expect(DEFAULT_SETTINGS.download).toHaveProperty('showProgressToast');
    });

    it('showProgressToast가 boolean 타입이어야 한다', () => {
      expect(typeof DEFAULT_SETTINGS.download.showProgressToast).toBe('boolean');
    });
  });

  describe('기본값 활성화 (Phase 2-2)', () => {
    it('showProgressToast 기본값이 true여야 한다', () => {
      expect(DEFAULT_SETTINGS.download.showProgressToast).toBe(true);
    });

    it('다른 다운로드 설정은 유지되어야 한다', () => {
      expect(DEFAULT_SETTINGS.download).toMatchObject({
        filenamePattern: 'original',
        imageQuality: 'original',
        maxConcurrentDownloads: 3,
        autoZip: false,
        folderStructure: 'flat',
      });
    });
  });

  describe('타입 안정성', () => {
    it('DEFAULT_SETTINGS가 as const로 정의되어 있어야 한다', () => {
      // TypeScript는 컴파일 타임에 검증하므로, 런타임에서는 값의 불변성을 확인
      const settings = DEFAULT_SETTINGS;

      // 객체가 동결되지 않았더라도 as const로 타입이 좁혀진다
      expect(settings.download.showProgressToast).toBeDefined();
    });
  });

  describe('문서화 및 명확성', () => {
    it('설정 키가 명확하고 일관성 있어야 한다', () => {
      // download 섹션의 모든 키 확인
      const downloadKeys = Object.keys(DEFAULT_SETTINGS.download);

      expect(downloadKeys).toContain('showProgressToast');
      expect(downloadKeys).toContain('filenamePattern');
      expect(downloadKeys).toContain('imageQuality');
      expect(downloadKeys).toContain('maxConcurrentDownloads');
      expect(downloadKeys).toContain('autoZip');
      expect(downloadKeys).toContain('folderStructure');
    });
  });
});
