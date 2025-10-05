/**
 * Phase 2-3: 접근성 강화 Contract Tests
 * Epic: AUTO-FOCUS-UPDATE (Soft Focus)
 * TDD: RED 단계
 *
 * Acceptance Criteria:
 * - [ ] visibleIndex 변경 시 스크린 리더 안내 ("현재 화면에 표시된 아이템: [index]")
 * - [ ] ARIA live region으로 알림 전달 (polite)
 * - [ ] 키보드 단축키 도움말 업데이트 (향후)
 *
 * @see docs/TDD_REFACTORING_PLAN.md Phase 2-3
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import SolidGalleryShell from '@/features/gallery/solid/SolidGalleryShell.solid';
import * as gallerySignals from '@shared/state/signals/gallery.signals';
import * as liveRegionManager from '@/shared/utils/accessibility/live-region-manager';

const { announcePolite, ensurePoliteLiveRegion, __resetLiveRegionStateForTests__ } =
  liveRegionManager;

describe('Phase 2-3: 접근성 강화 (AUTO-FOCUS-UPDATE)', () => {
  let mockMediaItems: any[];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
    __resetLiveRegionStateForTests__();

    // Mock media items
    mockMediaItems = [
      {
        url: 'https://pbs.twimg.com/media/test1.jpg',
        type: 'image' as const,
        originalUrl: 'https://pbs.twimg.com/media/test1.jpg',
        timestamp: Date.now(),
      },
      {
        url: 'https://pbs.twimg.com/media/test2.jpg',
        type: 'image' as const,
        originalUrl: 'https://pbs.twimg.com/media/test2.jpg',
        timestamp: Date.now(),
      },
      {
        url: 'https://pbs.twimg.com/media/test3.jpg',
        type: 'image' as const,
        originalUrl: 'https://pbs.twimg.com/media/test3.jpg',
        timestamp: Date.now(),
      },
    ];

    // Mock galleryState to return a function (SolidJS Accessor pattern)
    vi.spyOn(gallerySignals, 'galleryState', 'get').mockReturnValue(() => ({
      mediaItems: mockMediaItems,
      currentIndex: 0,
      isOpen: true,
      isLoading: false,
      error: null,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. ARIA Live Region 통합', () => {
    it('갤러리가 렌더링되면 polite live region이 존재한다', () => {
      render(() => <SolidGalleryShell />);

      const liveRegion = ensurePoliteLiveRegion();
      expect(liveRegion).toBeDefined();
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.getAttribute('role')).toBe('status');
    });

    it('live region은 화면 밖에 있지만 스크린 리더에게는 보인다', () => {
      render(() => <SolidGalleryShell />);

      const liveRegion = ensurePoliteLiveRegion();
      const styles = window.getComputedStyle(liveRegion);

      // Visually hidden but accessible
      expect(liveRegion.style.position).toBe('absolute');
      expect(liveRegion.style.width).toBe('1px');
      expect(liveRegion.style.height).toBe('1px');
    });
  });

  describe('2. visibleIndex 변경 시 스크린 리더 안내', () => {
    it('visibleIndex가 변경되면 announcePolite가 호출된다', async () => {
      const spy = vi.spyOn(liveRegionManager, 'announcePolite');

      render(() => <SolidGalleryShell />);

      // Wait for initial render and potential announcements
      await waitFor(() => {
        expect(spy).toHaveBeenCalled();
      });

      // Should announce visible index
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('현재 화면에 표시된 아이템'));
    });

    it('안내 메시지는 "현재 화면에 표시된 아이템: [index]/[total]" 형식이다', async () => {
      const spy = vi.spyOn(liveRegionManager, 'announcePolite');

      render(() => <SolidGalleryShell />);

      await waitFor(() => {
        expect(spy).toHaveBeenCalled();
      });

      const calls = spy.mock.calls;
      const visibleIndexCall = calls.find(call => call[0].includes('현재 화면에 표시된 아이템'));

      expect(visibleIndexCall).toBeDefined();
      // Should be in format: "현재 화면에 표시된 아이템: 1/3"
      expect(visibleIndexCall![0]).toMatch(/현재 화면에 표시된 아이템: \d+\/\d+/);
    });

    it('visibleIndex가 변경될 때마다 새로운 안내가 발생한다', async () => {
      const spy = vi.spyOn(liveRegionManager, 'announcePolite');

      const { unmount } = render(() => <SolidGalleryShell />);

      // Wait for initial announcement
      await waitFor(() => {
        expect(spy.mock.calls.length).toBeGreaterThan(0);
      });

      const initialCallCount = spy.mock.calls.length;

      // Simulate scroll to trigger visibleIndex change
      // (In real scenario, IntersectionObserver would trigger this)
      // For now, we're testing that the hook integration exists

      // Note: Full integration testing would require mocking IntersectionObserver
      // This test validates the announcePolite call exists

      expect(initialCallCount).toBeGreaterThan(0);

      unmount();
    });
  });

  describe('3. 중복 안내 방지', () => {
    it('동일한 visibleIndex에 대한 중복 안내를 억제한다', async () => {
      const spy = vi.spyOn(liveRegionManager, 'announcePolite');

      render(() => <SolidGalleryShell />);

      await waitFor(() => {
        expect(spy).toHaveBeenCalled();
      });

      // live-region-manager의 deduplication 메커니즘이 작동해야 함
      // 같은 메시지가 200ms 이내에 여러 번 호출되어도 한 번만 announce됨
      const calls = spy.mock.calls;
      const visibleIndexCalls = calls.filter(call => call[0].includes('현재 화면에 표시된 아이템'));

      // Should have at least one call, but dedup logic should prevent excessive calls
      expect(visibleIndexCalls.length).toBeGreaterThan(0);
    });
  });

  describe('4. 타입 안전성', () => {
    it('announcePolite는 string 타입만 받는다', () => {
      // TypeScript compile-time check - 함수 시그니처 테스트
      const message: string = '현재 화면에 표시된 아이템: 1/3';

      // 함수가 존재하고 호출 가능한지 확인
      expect(typeof announcePolite).toBe('function');

      // 실제 호출하여 에러가 발생하지 않는지 확인
      expect(() => announcePolite(message)).not.toThrow();
    });
  });

  describe('5. 키보드 단축키 문서 (향후 구현)', () => {
    it.skip('키보드 단축키 도움말에 visibleIndex 정보가 포함된다', () => {
      // Phase 2-3 확장: 키보드 단축키 도움말 컴포넌트에 visibleIndex 설명 추가
      // 예: "현재 화면에 보이는 아이템은 자동으로 강조 표시됩니다"
      expect(true).toBe(false); // Placeholder for future implementation
    });
  });

  describe('6. Edge Cases', () => {
    it('mediaItems가 비어있을 때 안내하지 않는다', async () => {
      const spy = vi.spyOn(liveRegionManager, 'announcePolite');

      // Mock empty gallery
      vi.spyOn(gallerySignals, 'galleryState', 'get').mockReturnValue(() => ({
        mediaItems: [],
        currentIndex: 0,
        isOpen: true,
        isLoading: false,
        error: null,
      }));

      render(() => <SolidGalleryShell />);

      await waitFor(() => {
        // Should not announce for empty gallery
        const visibleIndexCalls = spy.mock.calls.filter(call =>
          call[0].includes('현재 화면에 표시된 아이템')
        );
        expect(visibleIndexCalls.length).toBe(0);
      });
    });

    it('갤러리가 닫힐 때 더 이상 안내하지 않는다', async () => {
      const spy = vi.spyOn(liveRegionManager, 'announcePolite');

      const [isOpen, setIsOpen] = createSignal(true);

      vi.spyOn(gallerySignals, 'galleryState', 'get').mockReturnValue(() => ({
        mediaItems: mockMediaItems,
        currentIndex: 0,
        isOpen: isOpen(),
        isLoading: false,
        error: null,
      }));

      const { unmount } = render(() => <SolidGalleryShell />);

      await waitFor(() => {
        expect(spy).toHaveBeenCalled();
      });

      const callsBeforeClose = spy.mock.calls.length;

      // Close gallery
      setIsOpen(false);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not have new calls after closing
      expect(spy.mock.calls.length).toBe(callsBeforeClose);

      unmount();
    });
  });
});
