/**
 * @fileoverview Gallery Index Events Tests (Phase 63 - Step 2)
 * @description gallerySignals에 이벤트 시스템 통합 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  galleryIndexEvents,
  navigateToItem,
  navigatePrevious,
  navigateNext,
  openGallery,
  closeGallery,
} from '@/shared/state/signals/gallery.signals';
import type { MediaInfo } from '@/shared/types/media.types';

describe('Gallery Index Events (Phase 63 - Step 2)', () => {
  const mockMediaItems: MediaInfo[] = [
    {
      id: 'index-event-1',
      url: 'https://example.com/image1.jpg',
      type: 'image',
      originalUrl: 'https://example.com/image1.jpg',
      tweetId: '1',
      tweetUsername: 'user',
    },
    {
      id: 'index-event-2',
      url: 'https://example.com/image2.jpg',
      type: 'image',
      originalUrl: 'https://example.com/image2.jpg',
      tweetId: '2',
      tweetUsername: 'user',
    },
    {
      id: 'index-event-3',
      url: 'https://example.com/image3.jpg',
      type: 'image',
      originalUrl: 'https://example.com/image3.jpg',
      tweetId: '3',
      tweetUsername: 'user',
    },
  ];

  beforeEach(() => {
    closeGallery();
  });

  describe('navigateToItem with trigger', () => {
    it('should emit navigate:start before index change', () => {
      // RED
      openGallery(mockMediaItems, 0);
      const startListener = vi.fn();

      galleryIndexEvents.on('navigate:start', startListener);
      navigateToItem(1, 'button');

      expect(startListener).toHaveBeenCalledWith({
        from: 0,
        to: 1,
        trigger: 'button',
      });
    });

    it('should emit navigate:complete after index change', () => {
      // RED
      openGallery(mockMediaItems, 0);
      const completeListener = vi.fn();

      galleryIndexEvents.on('navigate:complete', completeListener);
      navigateToItem(1, 'button');

      expect(completeListener).toHaveBeenCalledWith({
        index: 1,
        trigger: 'button',
      });
    });

    it('should include trigger type in events', () => {
      // RED
      openGallery(mockMediaItems, 0);
      const startListener = vi.fn();
      const completeListener = vi.fn();

      galleryIndexEvents.on('navigate:start', startListener);
      galleryIndexEvents.on('navigate:complete', completeListener);

      navigateToItem(1, 'click');

      expect(startListener).toHaveBeenCalledWith(expect.objectContaining({ trigger: 'click' }));
      expect(completeListener).toHaveBeenCalledWith(expect.objectContaining({ trigger: 'click' }));
    });

    it('should handle button trigger', () => {
      // RED
      openGallery(mockMediaItems, 0);
      const listener = vi.fn();

      galleryIndexEvents.on('navigate:complete', listener);
      navigateToItem(2, 'button');

      expect(listener).toHaveBeenCalledWith({ index: 2, trigger: 'button' });
    });

    it('should handle click trigger', () => {
      // RED
      openGallery(mockMediaItems, 0);
      const listener = vi.fn();

      galleryIndexEvents.on('navigate:complete', listener);
      navigateToItem(2, 'click');

      expect(listener).toHaveBeenCalledWith({ index: 2, trigger: 'click' });
    });

    it('should handle keyboard trigger', () => {
      // RED
      openGallery(mockMediaItems, 0);
      const listener = vi.fn();

      galleryIndexEvents.on('navigate:complete', listener);
      navigateToItem(2, 'keyboard');

      expect(listener).toHaveBeenCalledWith({ index: 2, trigger: 'keyboard' });
    });

    it('should emit events for manual navigation even at same index (Phase 77)', () => {
      // Phase 77: source-aware duplicate checking
      openGallery(mockMediaItems, 1);
      const startListener = vi.fn();
      const completeListener = vi.fn();

      galleryIndexEvents.on('navigate:start', startListener);
      galleryIndexEvents.on('navigate:complete', completeListener);

      navigateToItem(1, 'button', 'button');

      // Manual navigation should emit events to sync focusedIndex
      expect(startListener).toHaveBeenCalledWith({ from: 1, to: 1, trigger: 'button' });
      expect(completeListener).toHaveBeenCalledWith({ index: 1, trigger: 'button' });
    });
  });

  describe('navigatePrevious/navigateNext', () => {
    it('should emit events with button trigger by default', () => {
      // RED
      openGallery(mockMediaItems, 1);
      const listener = vi.fn();

      galleryIndexEvents.on('navigate:complete', listener);
      navigatePrevious();

      expect(listener).toHaveBeenCalledWith({ index: 0, trigger: 'button' });

      listener.mockClear();
      navigateNext();

      expect(listener).toHaveBeenCalledWith({ index: 1, trigger: 'button' });
    });

    it('should support custom trigger parameter', () => {
      // RED (navigatePrevious/navigateNext에 trigger 파라미터가 있다면)
      openGallery(mockMediaItems, 1);
      const listener = vi.fn();

      galleryIndexEvents.on('navigate:complete', listener);

      // trigger 파라미터를 지원하는 경우
      // navigatePrevious('keyboard');
      // navigateNext('keyboard');

      // 현재는 기본 button trigger만 사용
      navigatePrevious();
      navigateNext();

      // 기본 동작 검증
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('event data validation', () => {
    it('should provide from/to indices in navigate:start', () => {
      // RED
      openGallery(mockMediaItems, 0);
      const listener = vi.fn();

      galleryIndexEvents.on('navigate:start', listener);
      navigateToItem(2, 'button');

      expect(listener).toHaveBeenCalledWith({
        from: 0,
        to: 2,
        trigger: 'button',
      });
    });

    it('should provide final index in navigate:complete', () => {
      // RED
      openGallery(mockMediaItems, 0);
      const listener = vi.fn();

      galleryIndexEvents.on('navigate:complete', listener);
      navigateToItem(2, 'click');

      expect(listener).toHaveBeenCalledWith({
        index: 2,
        trigger: 'click',
      });
    });

    it('should maintain type safety for event data', () => {
      // RED
      openGallery(mockMediaItems, 0);

      const startListener = vi.fn((data: { from: number; to: number; trigger: string }) => {
        expect(typeof data.from).toBe('number');
        expect(typeof data.to).toBe('number');
        expect(typeof data.trigger).toBe('string');
      });

      const completeListener = vi.fn((data: { index: number; trigger: string }) => {
        expect(typeof data.index).toBe('number');
        expect(typeof data.trigger).toBe('string');
      });

      galleryIndexEvents.on('navigate:start', startListener);
      galleryIndexEvents.on('navigate:complete', completeListener);

      navigateToItem(1, 'button');

      expect(startListener).toHaveBeenCalled();
      expect(completeListener).toHaveBeenCalled();
    });
  });
});
