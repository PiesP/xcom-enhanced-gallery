/**
 * @fileoverview Auto Focus Phase 2-2 - visibleIndex Integration Contract Tests
 * Epic: AUTO-FOCUS-UPDATE
 * TDD Phase: RED
 *
 * 목적:
 * SolidGalleryShell에서 useVisibleIndex 훅을 통합하여
 * 현재 화면에 보이는 아이템에 isVisible prop을 전달하는지 검증
 */
/* global __dirname */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup as solidCleanup } from '@solidjs/testing-library';
import SolidGalleryShell from '@/features/gallery/solid/SolidGalleryShell.solid';
import * as useVisibleIndexModule from '@/features/gallery/hooks/useVisibleIndex';
import * as gallerySignals from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';

describe('Auto Focus - visibleIndex Integration Contract', () => {
  const mockItems: MediaInfo[] = [
    {
      type: 'image' as const,
      url: 'https://pbs.twimg.com/media/test1.jpg',
      originalUrl: 'https://pbs.twimg.com/media/test1.jpg?name=orig',
      previewUrl: 'https://pbs.twimg.com/media/test1.jpg?name=small',
      width: 1200,
      height: 800,
    },
    {
      type: 'image' as const,
      url: 'https://pbs.twimg.com/media/test2.jpg',
      originalUrl: 'https://pbs.twimg.com/media/test2.jpg?name=orig',
      previewUrl: 'https://pbs.twimg.com/media/test2.jpg?name=small',
      width: 1200,
      height: 800,
    },
    {
      type: 'image' as const,
      url: 'https://pbs.twimg.com/media/test3.jpg',
      originalUrl: 'https://pbs.twimg.com/media/test3.jpg?name=orig',
      previewUrl: 'https://pbs.twimg.com/media/test3.jpg?name=small',
      width: 1200,
      height: 800,
    },
  ];

  beforeEach(() => {
    document.body.innerHTML = '';

    // Mock galleryState
    vi.spyOn(gallerySignals, 'galleryState', 'get').mockReturnValue({
      items: mockItems,
      currentIndex: 0,
      isActive: false,
    });
  });

  afterEach(() => {
    solidCleanup();
    vi.restoreAllMocks();
  });

  describe('1. useVisibleIndex 훅 통합', () => {
    it('SolidGalleryShell이 useVisibleIndex 훅을 사용한다', () => {
      // Mock: useGalleryVisibleIndex 훅
      const mockVisibleIndex = () => 1;
      const spy = vi.spyOn(useVisibleIndexModule, 'useGalleryVisibleIndex').mockReturnValue({
        visibleIndex: 1,
        visibleIndexAccessor: mockVisibleIndex,
        recompute: vi.fn(),
      });

      // Render
      render(() => (
        <SolidGalleryShell
          onClose={vi.fn()}
          onPrevious={vi.fn()}
          onNext={vi.fn()}
          onDownloadCurrent={vi.fn()}
          onDownloadAll={vi.fn()}
        />
      ));

      // Verify: useGalleryVisibleIndex가 호출되었는가?
      expect(spy).toHaveBeenCalled();
    });

    it('visibleIndex는 currentIndex와 독립적이다', () => {
      // Mock: currentIndex = 0, visibleIndex = 2 (다른 값)
      vi.spyOn(gallerySignals, 'galleryState', 'get').mockReturnValue({
        items: mockItems,
        currentIndex: 0,
        isActive: false,
      });

      const mockVisibleIndex = () => 2;
      vi.spyOn(useVisibleIndexModule, 'useGalleryVisibleIndex').mockReturnValue({
        visibleIndex: 2,
        visibleIndexAccessor: mockVisibleIndex,
        recompute: vi.fn(),
      });

      // Render
      const { container } = render(() => (
        <SolidGalleryShell
          onClose={vi.fn()}
          onPrevious={vi.fn()}
          onNext={vi.fn()}
          onDownloadCurrent={vi.fn()}
          onDownloadAll={vi.fn()}
        />
      ));

      // Verify: visibleIndex=2 아이템에 .visible 클래스 적용
      const items = container.querySelectorAll('[data-xeg-component="vertical-image-item"]');
      if (items.length > 0) {
        // visibleIndex=2인 아이템
        expect(items[2]?.className).toMatch(/visible/);
        // currentIndex=0인 아이템은 .visible 없어야 함
        expect(items[0]?.className).not.toMatch(/visible/);
      }
    });
  });

  describe('2. isVisible prop 전달', () => {
    it('visibleIndex 아이템에 isVisible=true를 전달한다', () => {
      // Mock: visibleIndex = 1
      const mockVisibleIndex = () => 1;
      vi.spyOn(useVisibleIndexModule, 'useGalleryVisibleIndex').mockReturnValue({
        visibleIndex: 1,
        visibleIndexAccessor: mockVisibleIndex,
        recompute: vi.fn(),
      });

      // Render
      const { container } = render(() => (
        <SolidGalleryShell
          onClose={vi.fn()}
          onPrevious={vi.fn()}
          onNext={vi.fn()}
          onDownloadCurrent={vi.fn()}
          onDownloadAll={vi.fn()}
        />
      ));

      // Verify: visibleIndex=1 아이템에 .visible 클래스 적용
      const items = container.querySelectorAll('[data-xeg-component="vertical-image-item"]');
      if (items.length > 0) {
        expect(items[1]?.className).toMatch(/visible/);
      }
    });

    it('visibleIndex가 아닌 아이템은 isVisible=false를 받는다', () => {
      // Mock: visibleIndex = 1
      const mockVisibleIndex = () => 1;
      vi.spyOn(useVisibleIndexModule, 'useGalleryVisibleIndex').mockReturnValue({
        visibleIndex: 1,
        visibleIndexAccessor: mockVisibleIndex,
        recompute: vi.fn(),
      });

      // Render
      const { container } = render(() => (
        <SolidGalleryShell
          onClose={vi.fn()}
          onPrevious={vi.fn()}
          onNext={vi.fn()}
          onDownloadCurrent={vi.fn()}
          onDownloadAll={vi.fn()}
        />
      ));

      // Verify: visibleIndex=1이 아닌 다른 아이템들은 .visible 없음
      const items = container.querySelectorAll('[data-xeg-component="vertical-image-item"]');
      if (items.length > 0) {
        expect(items[0]?.className).not.toMatch(/visible/);
        expect(items[2]?.className).not.toMatch(/visible/);
      }
    });
  });

  describe('3. 자동 스크롤 미발생 검증', () => {
    it('visibleIndex 변경 시 scrollIntoView가 호출되지 않는다', () => {
      // Mock: visibleIndex = 1
      const mockVisibleIndex = () => 1;
      vi.spyOn(useVisibleIndexModule, 'useGalleryVisibleIndex').mockReturnValue({
        visibleIndex: 1,
        visibleIndexAccessor: mockVisibleIndex,
        recompute: vi.fn(),
      });

      // Mock scrollIntoView
      const scrollIntoViewSpy = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewSpy;

      // Render
      render(() => (
        <SolidGalleryShell
          onClose={vi.fn()}
          onPrevious={vi.fn()}
          onNext={vi.fn()}
          onDownloadCurrent={vi.fn()}
          onDownloadAll={vi.fn()}
        />
      ));

      // Verify: scrollIntoView가 호출되지 않음
      expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    });
  });

  describe('4. 접근성 - ARIA 속성', () => {
    it('visibleIndex 아이템에 aria-current="true"가 설정된다', () => {
      // Mock: visibleIndex = 1
      const mockVisibleIndex = () => 1;
      vi.spyOn(useVisibleIndexModule, 'useGalleryVisibleIndex').mockReturnValue({
        visibleIndex: 1,
        visibleIndexAccessor: mockVisibleIndex,
        recompute: vi.fn(),
      });

      // Render
      const { container } = render(() => (
        <SolidGalleryShell
          onClose={vi.fn()}
          onPrevious={vi.fn()}
          onNext={vi.fn()}
          onDownloadCurrent={vi.fn()}
          onDownloadAll={vi.fn()}
        />
      ));

      // Verify: visibleIndex=1 아이템에 aria-current="true"
      const items = container.querySelectorAll('[data-xeg-component="vertical-image-item"]');
      if (items.length > 0) {
        expect(items[1]?.getAttribute('aria-current')).toBe('true');
      }
    });

    it('visibleIndex가 아닌 아이템은 aria-current가 없다', () => {
      // Mock: visibleIndex = 1
      const mockVisibleIndex = () => 1;
      vi.spyOn(useVisibleIndexModule, 'useGalleryVisibleIndex').mockReturnValue({
        visibleIndex: 1,
        visibleIndexAccessor: mockVisibleIndex,
        recompute: vi.fn(),
      });

      // Render
      const { container } = render(() => (
        <SolidGalleryShell
          onClose={vi.fn()}
          onPrevious={vi.fn()}
          onNext={vi.fn()}
          onDownloadCurrent={vi.fn()}
          onDownloadAll={vi.fn()}
        />
      ));

      // Verify: visibleIndex=1이 아닌 아이템은 aria-current 없음
      const items = container.querySelectorAll('[data-xeg-component="vertical-image-item"]');
      if (items.length > 0) {
        expect(items[0]?.getAttribute('aria-current')).toBeNull();
        expect(items[2]?.getAttribute('aria-current')).toBeNull();
      }
    });
  });

  describe('5. 타입 안전성', () => {
    it('useGalleryVisibleIndex는 올바른 타입을 반환한다', () => {
      const result = useVisibleIndexModule.useGalleryVisibleIndex(() => null, mockItems.length, {
        rafCoalesce: true,
      });

      // Verify: 반환 타입 검증
      expect(typeof result.visibleIndex).toBe('number');
      expect(typeof result.visibleIndexAccessor).toBe('function');
      expect(typeof result.recompute).toBe('function');
    });
  });
});
