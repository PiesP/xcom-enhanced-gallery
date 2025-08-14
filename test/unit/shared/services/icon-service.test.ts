import { describe, it, expect, vi, beforeEach } from 'vitest';
import iconService, { getIcon, preloadIcons } from '@/shared/services/icon-service';

describe('IconService TDD - RED Phase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 아이콘 로딩', () => {
    it('should load required icons synchronously', () => {
      // When: 다운로드 아이콘을 요청한다
      const downloadIcon = getIcon('download');

      // Then: 유효한 컴포넌트를 반환한다
      expect(downloadIcon).toBeDefined();
      expect(typeof downloadIcon).toBe('function');
    });

    it('should provide fallback for missing icons', () => {
      // When: 존재하지 않는 아이콘을 요청한다
      const fallback = (iconService as any).getIcon('non-existent-icon');

      // Then: 폴백 아이콘을 반환한다
      expect(fallback).toBeDefined();
      expect(typeof fallback).toBe('function');
    });
  });

  describe('아이콘 매핑', () => {
    it('should provide all required icons', () => {
      // When: 필요한 모든 아이콘을 확인한다
      const validIcons = [
        'download',
        'settings',
        'close',
        'chevron-left',
        'chevron-right',
        'zoom-in',
        'zoom-out',
        'maximize',
        'minimize',
        'rotate-cw',
        'play',
        'pause',
        'volume-2',
        'volume-x',
        'grid',
        'list',
        'eye',
        'eye-off',
        'trash-2',
        'copy',
        'check',
        'x',
      ] as const;

      // Then: 모든 아이콘이 로드 가능해야 한다
      for (const iconName of validIcons) {
        const icon = getIcon(iconName as any);
        expect(icon).toBeDefined();
      }
    });
  });

  describe('성능 최적화', () => {
    it('should cache loaded icons', () => {
      // When: 같은 아이콘을 두 번 요청한다
      const icon1 = getIcon('download');
      const icon2 = getIcon('download');

      // Then: 같은 참조를 반환한다 (캐싱됨)
      expect(icon1).toBe(icon2);
    });

    it('should support icon preloading', () => {
      // When: 여러 아이콘을 프리로드한다
      const preloadResult = preloadIcons(['download', 'settings', 'close']);

      // Then: 프리로드가 성공적으로 완료된다 (동기)
      expect(preloadResult).toBeUndefined(); // void 함수
    });
  });
});
