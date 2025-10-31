/**
 * @fileoverview Phase 64 Step 4: Toolbar focusedIndex 우선 표시 테스트
 * @description
 * - Toolbar의 currentIndex 표시를 focusedIndex 우선으로 변경
 * - focusedIndex가 null일 때 currentIndex로 폴백
 * - 스크롤 기반 포커스와 버튼 네비게이션 동기화 검증
 *
 * TDD RED 단계: 이 테스트는 실패해야 합니다 (구현 전)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getSolid } from '@/shared/external/vendors';
import { useGalleryToolbarLogic } from '@/shared/hooks/use-gallery-toolbar-logic';
import {
  setFocusedIndex,
  gallerySignals,
  openGallery,
  closeGallery,
} from '@/shared/state/signals/gallery.signals';
import type { MediaInfo } from '@/shared/types/media.types';

describe('Phase 64 Step 4: Toolbar focusedIndex 우선 표시', () => {
  const { createRoot } = getSolid();

  const mockMediaItems: MediaInfo[] = [
    {
      id: '1',
      type: 'image',
      url: 'https://example.com/image1.jpg',
      filename: 'image1.jpg',
      originalUrl: 'https://example.com/image1.jpg',
    },
    {
      id: '2',
      type: 'image',
      url: 'https://example.com/image2.jpg',
      filename: 'image2.jpg',
      originalUrl: 'https://example.com/image2.jpg',
    },
    {
      id: '3',
      type: 'image',
      url: 'https://example.com/image3.jpg',
      filename: 'image3.jpg',
      originalUrl: 'https://example.com/image3.jpg',
    },
    {
      id: '4',
      type: 'image',
      url: 'https://example.com/image4.jpg',
      filename: 'image4.jpg',
      originalUrl: 'https://example.com/image4.jpg',
    },
    {
      id: '5',
      type: 'image',
      url: 'https://example.com/image5.jpg',
      filename: 'image5.jpg',
      originalUrl: 'https://example.com/image5.jpg',
    },
  ];

  beforeEach(() => {
    // 각 테스트 전 갤러리 초기화 및 mediaItems 설정
    closeGallery();
    openGallery(mockMediaItems, 0);
    setFocusedIndex(null);
  });

  it('RED: focusedIndex가 null일 때 currentIndex 표시', () => {
    createRoot(dispose => {
      const props = {
        currentIndex: 2,
        totalCount: 5,
        isDownloading: false,
        disabled: false,
        onPrevious: () => {},
        onNext: () => {},
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
        onClose: () => {},
        onOpenSettings: () => {},
        onFitOriginal: () => {},
        onFitWidth: () => {},
        onFitHeight: () => {},
        onFitContainer: () => {},
      };

      const { state } = useGalleryToolbarLogic(props);

      // focusedIndex가 null이면 currentIndex를 표시해야 함
      expect(gallerySignals.focusedIndex.value).toBe(null);
      expect(state.displayIndex()).toBe(2); // currentIndex 표시

      dispose();
    });
  });

  it('RED: focusedIndex가 있을 때 focusedIndex 표시', () => {
    createRoot(dispose => {
      const props = {
        currentIndex: 2,
        totalCount: 5,
        isDownloading: false,
        disabled: false,
        onPrevious: () => {},
        onNext: () => {},
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
        onClose: () => {},
        onOpenSettings: () => {},
        onFitOriginal: () => {},
        onFitWidth: () => {},
        onFitHeight: () => {},
        onFitContainer: () => {},
      };

      const { state } = useGalleryToolbarLogic(props);

      // focusedIndex 설정 (스크롤로 인한 변경 시뮬레이션)
      setFocusedIndex(4);

      // focusedIndex가 있으면 focusedIndex를 표시해야 함
      expect(gallerySignals.focusedIndex.value).toBe(4);
      expect(state.displayIndex()).toBe(4); // focusedIndex 표시

      dispose();
    });
  });

  it('RED: focusedIndex와 currentIndex가 다를 때 focusedIndex 우선', () => {
    createRoot(dispose => {
      const props = {
        currentIndex: 2,
        totalCount: 5,
        isDownloading: false,
        disabled: false,
        onPrevious: () => {},
        onNext: () => {},
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
        onClose: () => {},
        onOpenSettings: () => {},
        onFitOriginal: () => {},
        onFitWidth: () => {},
        onFitHeight: () => {},
        onFitContainer: () => {},
      };

      const { state } = useGalleryToolbarLogic(props);

      // focusedIndex 설정 (스크롤로 인한 변경 시뮬레이션)
      setFocusedIndex(3);

      // focusedIndex(3)와 currentIndex(2)가 다를 때 focusedIndex 우선
      expect(state.displayIndex()).toBe(3); // focusedIndex 우선

      dispose();
    });
  });

  it('RED: focusedIndex가 null로 변경되면 currentIndex로 폴백', () => {
    createRoot(dispose => {
      const props = {
        currentIndex: 2,
        totalCount: 5,
        isDownloading: false,
        disabled: false,
        onPrevious: () => {},
        onNext: () => {},
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
        onClose: () => {},
        onOpenSettings: () => {},
        onFitOriginal: () => {},
        onFitWidth: () => {},
        onFitHeight: () => {},
        onFitContainer: () => {},
      };

      const { state } = useGalleryToolbarLogic(props);

      // 초기 focusedIndex 설정
      setFocusedIndex(4);
      expect(state.displayIndex()).toBe(4);

      // focusedIndex를 null로 변경 (포커스 해제 시뮬레이션)
      setFocusedIndex(null);
      expect(state.displayIndex()).toBe(2); // currentIndex로 폴백

      dispose();
    });
  });

  it('RED: mediaCounter는 displayIndex 기반으로 계산되어야 함', () => {
    createRoot(dispose => {
      const props = {
        currentIndex: 2,
        totalCount: 5,
        isDownloading: false,
        disabled: false,
        onPrevious: () => {},
        onNext: () => {},
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
        onClose: () => {},
        onOpenSettings: () => {},
        onFitOriginal: () => {},
        onFitWidth: () => {},
        onFitHeight: () => {},
        onFitContainer: () => {},
      };

      const { state } = useGalleryToolbarLogic(props);

      // focusedIndex 설정
      setFocusedIndex(4);

      // mediaCounter는 displayIndex(4) 기반으로 계산
      const counter = state.mediaCounter();
      expect(counter.current).toBe(5); // displayIndex(4) + 1
      expect(counter.total).toBe(5);
      expect(counter.progress).toBeCloseTo(100, 0);

      dispose();
    });
  });

  it('RED: focusedIndex 변경 시 displayIndex가 반응적으로 업데이트되어야 함', () => {
    createRoot(dispose => {
      const props = {
        currentIndex: 2,
        totalCount: 5,
        isDownloading: false,
        disabled: false,
        onPrevious: () => {},
        onNext: () => {},
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
        onClose: () => {},
        onOpenSettings: () => {},
        onFitOriginal: () => {},
        onFitWidth: () => {},
        onFitHeight: () => {},
        onFitContainer: () => {},
      };

      const { state } = useGalleryToolbarLogic(props);

      // 초기 상태: focusedIndex null, currentIndex 표시
      expect(state.displayIndex()).toBe(2);

      // focusedIndex 변경 → displayIndex 반응
      setFocusedIndex(0);
      expect(state.displayIndex()).toBe(0);

      setFocusedIndex(1);
      expect(state.displayIndex()).toBe(1);

      setFocusedIndex(4);
      expect(state.displayIndex()).toBe(4);

      // focusedIndex null → currentIndex 폴백
      setFocusedIndex(null);
      expect(state.displayIndex()).toBe(2);

      dispose();
    });
  });
});
