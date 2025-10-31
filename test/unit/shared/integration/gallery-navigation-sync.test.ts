/**
 * @file Phase 63 - Step 4: Gallery Navigation Synchronization Integration Tests
 * @description 갤러리 네비게이션 동기화 통합 테스트 - trigger 파라미터 전달 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSolid } from '@shared/external/vendors';
import {
  openGallery,
  closeGallery,
  navigateToItem,
  navigatePrevious,
  navigateNext,
  galleryIndexEvents,
} from '@shared/state/signals/gallery.signals';

const { createRoot } = getSolid();

describe('Phase 63 - Step 4: Gallery Navigation Synchronization (Integration)', () => {
  let dispose: (() => void) | null = null;

  beforeEach(() => {
    // 갤러리 초기화
    const mockMediaItems = [
      { id: '1', url: 'https://example.com/1.jpg', type: 'image' as const },
      { id: '2', url: 'https://example.com/2.jpg', type: 'image' as const },
      { id: '3', url: 'https://example.com/3.jpg', type: 'image' as const },
    ];
    openGallery(mockMediaItems, 0);
  });

  afterEach(() => {
    if (dispose) {
      dispose();
      dispose = null;
    }
    closeGallery();
  });

  describe('Toolbar button navigation', () => {
    it('should emit navigate:complete with button trigger on navigatePrevious', () => {
      const navigateCompleteSpy = vi.fn();

      dispose = createRoot(disposeRoot => {
        galleryIndexEvents.on('navigate:complete', navigateCompleteSpy);
        return disposeRoot;
      });

      navigatePrevious('button');

      expect(navigateCompleteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: 'button',
          index: expect.any(Number),
        })
      );
    });

    it('should emit navigate:complete with button trigger on navigateNext', () => {
      const navigateCompleteSpy = vi.fn();

      dispose = createRoot(disposeRoot => {
        galleryIndexEvents.on('navigate:complete', navigateCompleteSpy);
        return disposeRoot;
      });

      navigateNext('button');

      expect(navigateCompleteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: 'button',
          index: expect.any(Number),
        })
      );
    });
  });

  describe('Media item click navigation', () => {
    it('should emit navigate:complete with click trigger on navigateToItem', () => {
      const navigateCompleteSpy = vi.fn();

      dispose = createRoot(disposeRoot => {
        galleryIndexEvents.on('navigate:complete', navigateCompleteSpy);
        return disposeRoot;
      });

      navigateToItem(2, 'click');

      expect(navigateCompleteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: 'click',
          index: 2,
        })
      );
    });
  });

  describe('Keyboard navigation', () => {
    it('should emit navigate:complete with keyboard trigger', () => {
      const navigateCompleteSpy = vi.fn();

      dispose = createRoot(disposeRoot => {
        galleryIndexEvents.on('navigate:complete', navigateCompleteSpy);
        return disposeRoot;
      });

      navigateToItem(1, 'keyboard');

      expect(navigateCompleteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: 'keyboard',
          index: 1,
        })
      );
    });
  });

  describe('Rapid navigation events', () => {
    it('should handle multiple rapid button clicks correctly', () => {
      const navigateCompleteSpy = vi.fn();

      dispose = createRoot(disposeRoot => {
        galleryIndexEvents.on('navigate:complete', navigateCompleteSpy);
        return disposeRoot;
      });

      navigateNext('button');
      navigateNext('button');
      navigatePrevious('button');

      expect(navigateCompleteSpy).toHaveBeenCalledTimes(3);
      expect(navigateCompleteSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ trigger: 'button' })
      );
      expect(navigateCompleteSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ trigger: 'button' })
      );
      expect(navigateCompleteSpy).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ trigger: 'button' })
      );
    });
  });

  describe('Mixed navigation sources', () => {
    it('should correctly identify trigger source for each navigation', () => {
      const navigateCompleteSpy = vi.fn();

      dispose = createRoot(disposeRoot => {
        galleryIndexEvents.on('navigate:complete', navigateCompleteSpy);
        return disposeRoot;
      });

      navigateToItem(1, 'click');
      navigateNext('button');
      navigateToItem(0, 'keyboard');

      expect(navigateCompleteSpy).toHaveBeenCalledTimes(3);
      expect(navigateCompleteSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ trigger: 'click', index: 1 })
      );
      expect(navigateCompleteSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ trigger: 'button', index: 2 })
      );
      expect(navigateCompleteSpy).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ trigger: 'keyboard', index: 0 })
      );
    });
  });

  describe('Event lifecycle', () => {
    it('should emit navigate:start before navigate:complete', () => {
      const events: string[] = [];

      dispose = createRoot(disposeRoot => {
        galleryIndexEvents.on('navigate:start', () => {
          events.push('start');
        });
        galleryIndexEvents.on('navigate:complete', () => {
          events.push('complete');
        });
        return disposeRoot;
      });

      navigateToItem(1, 'button');

      expect(events).toEqual(['start', 'complete']);
    });

    it('should cleanup all event listeners on dispose', () => {
      const navigateCompleteSpy = vi.fn();
      let unsubscribe: (() => void) | null = null;

      dispose = createRoot(disposeRoot => {
        unsubscribe = galleryIndexEvents.on('navigate:complete', navigateCompleteSpy);
        return disposeRoot;
      });

      navigateToItem(1, 'button');
      expect(navigateCompleteSpy).toHaveBeenCalledTimes(1);

      // 수동으로 unsubscribe 호출
      unsubscribe?.();

      navigateToItem(2, 'button');
      // unsubscribe 후에는 이벤트가 발행되지만 리스너는 호출되지 않음
      expect(navigateCompleteSpy).toHaveBeenCalledTimes(1);
    });
  });
});
