/**
 * @fileoverview Auto-focus Sync 통합 테스트
 * Epic: GALLERY-ENHANCEMENT-001 Sub-Epic 3
 * TDD Phase: RED (테스트 작성)
 *
 * 목표:
 * - visibleIndex가 변경되면 currentIndex도 자동으로 동기화되는지 검증
 * - 300ms debounce 적용 검증
 * - auto-scroll 비활성화 검증 (skipScroll flag)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { MediaInfo } from '@shared/types';

describe('Auto-focus Sync (Sub-Epic 3)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Phase 3-1: visibleIndex → currentIndex 동기화 (RED)', () => {
    it('[RED] should sync currentIndex when visibleIndex changes', async () => {
      // 이 테스트는 SolidGalleryShell.solid.tsx에
      // createEffect(() => { navigateToItem(visibleIndex(), { skipScroll: true }) })
      // 로직이 추가될 때까지 실패할 것으로 예상

      const mockMediaItems: MediaInfo[] = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'image',
          filename: 'test1.jpg',
        },
        {
          id: '2',
          url: 'https://pbs.twimg.com/media/test2.jpg',
          type: 'image',
          filename: 'test2.jpg',
        },
        {
          id: '3',
          url: 'https://pbs.twimg.com/media/test3.jpg',
          type: 'image',
          filename: 'test3.jpg',
        },
      ];

      // galleryState 모킹
      const gallerySignalsModule = await import('@shared/state/signals/gallery.signals');
      const mockGalleryState = {
        mediaItems: mockMediaItems,
        currentIndex: 0,
        isOpen: true,
        isLoading: false,
        isActive: false,
        error: null,
      };

      vi.spyOn(gallerySignalsModule, 'galleryState', 'get').mockReturnValue(() => mockGalleryState);

      // navigateToItem spy
      const navigateToItemSpy = vi.spyOn(gallerySignalsModule, 'navigateToItem');

      // useVisibleIndex 모킹 - visibleIndex가 1로 변경됨
      const useVisibleIndexModule = await import('@/features/gallery/hooks/useVisibleIndex');
      const mockVisibleIndexAccessor = vi.fn(() => 1);
      vi.spyOn(useVisibleIndexModule, 'useGalleryVisibleIndex').mockReturnValue({
        visibleIndex: 1,
        visibleIndexAccessor: mockVisibleIndexAccessor,
        recompute: vi.fn(),
      });

      // SolidGalleryShell 렌더링
      const { getSolidWeb } = await import('@shared/external/vendors');
      const { render } = getSolidWeb();
      const SolidGalleryShell = (await import('@/features/gallery/solid/SolidGalleryShell.solid'))
        .default;

      const container = document.createElement('div');
      document.body.appendChild(container);

      const cleanup = render(
        () =>
          SolidGalleryShell({
            onClose: vi.fn(),
            onPrevious: vi.fn(),
            onNext: vi.fn(),
            onDownloadCurrent: vi.fn(),
            onDownloadAll: vi.fn(),
          }),
        container
      );

      // 300ms debounce 대기
      await vi.advanceTimersByTimeAsync(350);

      // 검증: navigateToItem이 visibleIndex=1로 호출되었는가?
      expect(navigateToItemSpy).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ skipScroll: true })
      );

      cleanup();
    });

    it('[RED] should debounce sync with 300ms delay', async () => {
      const mockMediaItems: MediaInfo[] = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'image',
          filename: 'test1.jpg',
        },
        {
          id: '2',
          url: 'https://pbs.twimg.com/media/test2.jpg',
          type: 'image',
          filename: 'test2.jpg',
        },
      ];

      const gallerySignalsModule = await import('@shared/state/signals/gallery.signals');
      const mockGalleryState = {
        mediaItems: mockMediaItems,
        currentIndex: 0,
        isOpen: true,
        isLoading: false,
        isActive: false,
        error: null,
      };

      vi.spyOn(gallerySignalsModule, 'galleryState', 'get').mockReturnValue(() => mockGalleryState);

      const navigateToItemSpy = vi.spyOn(gallerySignalsModule, 'navigateToItem');

      const useVisibleIndexModule = await import('@/features/gallery/hooks/useVisibleIndex');
      vi.spyOn(useVisibleIndexModule, 'useGalleryVisibleIndex').mockReturnValue({
        visibleIndex: 1,
        visibleIndexAccessor: vi.fn(() => 1),
        recompute: vi.fn(),
      });

      const { getSolidWeb } = await import('@shared/external/vendors');
      const { render } = getSolidWeb();
      const SolidGalleryShell = (await import('@/features/gallery/solid/SolidGalleryShell.solid'))
        .default;

      const container = document.createElement('div');
      document.body.appendChild(container);

      const cleanup = render(
        () =>
          SolidGalleryShell({
            onClose: vi.fn(),
            onPrevious: vi.fn(),
            onNext: vi.fn(),
            onDownloadCurrent: vi.fn(),
            onDownloadAll: vi.fn(),
          }),
        container
      );

      // 200ms 대기 - 아직 debounce 시간 미달
      await vi.advanceTimersByTimeAsync(200);
      expect(navigateToItemSpy).not.toHaveBeenCalled();

      // 추가 150ms 대기 - 총 350ms, debounce 완료
      await vi.advanceTimersByTimeAsync(150);
      expect(navigateToItemSpy).toHaveBeenCalledTimes(1);

      cleanup();
    });

    it('[RED] should not trigger auto-scroll when syncing', async () => {
      const mockMediaItems: MediaInfo[] = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'image',
          filename: 'test1.jpg',
        },
        {
          id: '2',
          url: 'https://pbs.twimg.com/media/test2.jpg',
          type: 'image',
          filename: 'test2.jpg',
        },
      ];

      const gallerySignalsModule = await import('@shared/state/signals/gallery.signals');
      const mockGalleryState = {
        mediaItems: mockMediaItems,
        currentIndex: 0,
        isOpen: true,
        isLoading: false,
        isActive: false,
        error: null,
      };

      vi.spyOn(gallerySignalsModule, 'galleryState', 'get').mockReturnValue(() => mockGalleryState);

      const navigateToItemSpy = vi.spyOn(gallerySignalsModule, 'navigateToItem');

      const useVisibleIndexModule = await import('@/features/gallery/hooks/useVisibleIndex');
      vi.spyOn(useVisibleIndexModule, 'useGalleryVisibleIndex').mockReturnValue({
        visibleIndex: 1,
        visibleIndexAccessor: vi.fn(() => 1),
        recompute: vi.fn(),
      });

      const { getSolidWeb } = await import('@shared/external/vendors');
      const { render } = getSolidWeb();
      const SolidGalleryShell = (await import('@/features/gallery/solid/SolidGalleryShell.solid'))
        .default;

      const container = document.createElement('div');
      document.body.appendChild(container);

      const cleanup = render(
        () =>
          SolidGalleryShell({
            onClose: vi.fn(),
            onPrevious: vi.fn(),
            onNext: vi.fn(),
            onDownloadCurrent: vi.fn(),
            onDownloadAll: vi.fn(),
          }),
        container
      );

      await vi.advanceTimersByTimeAsync(350);

      // 검증: skipScroll 플래그가 true인지 확인
      expect(navigateToItemSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({ skipScroll: true })
      );

      cleanup();
    });
  });

  describe('Phase 3-2: 동기화 조건 검증 (GREEN)', () => {
    it('[GREEN] should not sync when gallery is closed', async () => {
      const mockMediaItems: MediaInfo[] = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'image',
          filename: 'test1.jpg',
        },
      ];

      const gallerySignalsModule = await import('@shared/state/signals/gallery.signals');
      const mockGalleryState = {
        mediaItems: mockMediaItems,
        currentIndex: 0,
        isOpen: false, // 갤러리 닫힘
        isLoading: false,
        isActive: false,
        error: null,
      };

      vi.spyOn(gallerySignalsModule, 'galleryState', 'get').mockReturnValue(() => mockGalleryState);

      const navigateToItemSpy = vi.spyOn(gallerySignalsModule, 'navigateToItem');

      const useVisibleIndexModule = await import('@/features/gallery/hooks/useVisibleIndex');
      vi.spyOn(useVisibleIndexModule, 'useGalleryVisibleIndex').mockReturnValue({
        visibleIndex: 1,
        visibleIndexAccessor: vi.fn(() => 1),
        recompute: vi.fn(),
      });

      const { getSolidWeb } = await import('@shared/external/vendors');
      const { render } = getSolidWeb();
      const SolidGalleryShell = (await import('@/features/gallery/solid/SolidGalleryShell.solid'))
        .default;

      const container = document.createElement('div');
      document.body.appendChild(container);

      const cleanup = render(
        () =>
          SolidGalleryShell({
            onClose: vi.fn(),
            onPrevious: vi.fn(),
            onNext: vi.fn(),
            onDownloadCurrent: vi.fn(),
            onDownloadAll: vi.fn(),
          }),
        container
      );

      await vi.advanceTimersByTimeAsync(350);

      // 검증: 갤러리가 닫혀있으면 동기화하지 않음
      expect(navigateToItemSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('[GREEN] should not sync when visibleIndex equals currentIndex', async () => {
      const mockMediaItems: MediaInfo[] = [
        {
          id: '1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'image',
          filename: 'test1.jpg',
        },
      ];

      const gallerySignalsModule = await import('@shared/state/signals/gallery.signals');
      const mockGalleryState = {
        mediaItems: mockMediaItems,
        currentIndex: 1, // visibleIndex와 동일
        isOpen: true,
        isLoading: false,
        isActive: false,
        error: null,
      };

      vi.spyOn(gallerySignalsModule, 'galleryState', 'get').mockReturnValue(() => mockGalleryState);

      const navigateToItemSpy = vi.spyOn(gallerySignalsModule, 'navigateToItem');

      const useVisibleIndexModule = await import('@/features/gallery/hooks/useVisibleIndex');
      vi.spyOn(useVisibleIndexModule, 'useGalleryVisibleIndex').mockReturnValue({
        visibleIndex: 1,
        visibleIndexAccessor: vi.fn(() => 1),
        recompute: vi.fn(),
      });

      const { getSolidWeb } = await import('@shared/external/vendors');
      const { render } = getSolidWeb();
      const SolidGalleryShell = (await import('@/features/gallery/solid/SolidGalleryShell.solid'))
        .default;

      const container = document.createElement('div');
      document.body.appendChild(container);

      const cleanup = render(
        () =>
          SolidGalleryShell({
            onClose: vi.fn(),
            onPrevious: vi.fn(),
            onNext: vi.fn(),
            onDownloadCurrent: vi.fn(),
            onDownloadAll: vi.fn(),
          }),
        container
      );

      await vi.advanceTimersByTimeAsync(350);

      // 검증: 이미 동일하면 동기화하지 않음
      expect(navigateToItemSpy).not.toHaveBeenCalled();

      cleanup();
    });
  });
});
