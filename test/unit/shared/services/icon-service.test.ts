import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IconComponent } from '@/shared/services/icon-service';

describe('IconService TDD - RED Phase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 아이콘 로딩', () => {
    it('should load required icons dynamically', async () => {
      // Given: IconService가 존재한다
      const iconService = await import('@/shared/services/icon-service');

      // When: 다운로드 아이콘을 요청한다
      const downloadIcon = await iconService.getIcon('download');

      // Then: 유효한 컴포넌트를 반환한다
      expect(downloadIcon).toBeDefined();
      expect(typeof downloadIcon).toBe('function');
    });

    it('should provide fallback for missing icons', async () => {
      // Given: IconService가 존재한다
      const iconService = await import('@/shared/services/icon-service');

      // When: 존재하지 않는 아이콘을 요청한다
      const fallback = await iconService.getIcon('non-existent-icon' as any);

      // Then: 폴백 아이콘을 반환한다
      expect(fallback).toBeDefined();
      expect(typeof fallback).toBe('function');
    });
  });

  describe('아이콘 타입 안전성', () => {
    it('should provide strongly typed icon names', async () => {
      // Given: IconService가 존재한다
      const iconService = await import('@/shared/services/icon-service');

      // When: 정의된 아이콘 타입들을 확인한다
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
        const icon = await iconService.getIcon(iconName);
        expect(icon).toBeDefined();
      }
    });
  });

  describe('성능 최적화', () => {
    it('should cache loaded icons', async () => {
      // Given: IconService가 존재한다
      const iconService = await import('@/shared/services/icon-service');

      // When: 같은 아이콘을 두 번 요청한다
      const icon1 = await iconService.getIcon('download');
      const icon2 = await iconService.getIcon('download');

      // Then: 같은 참조를 반환한다 (캐싱됨)
      expect(icon1).toBe(icon2);
    });

    it('should support icon preloading', async () => {
      // Given: IconService가 존재한다
      const iconService = await import('@/shared/services/icon-service');

      // When: 여러 아이콘을 프리로드한다
      const preloadPromise = iconService.preloadIcons(['download', 'settings', 'close']);

      // Then: 프리로드가 성공적으로 완료된다
      await expect(preloadPromise).resolves.toBeUndefined();
    });
  });
});
