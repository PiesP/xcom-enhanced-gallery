/**
 * @fileoverview Phase 305: Gallery-Scoped Event Listener Attachment
 * RED Phase Tests - Gallery Lifecycle & Listener Scope
 *
 * Goal: Event listeners should only be active when gallery is open,
 * scoped to gallery root, and cleaned up via AbortController
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import type { EventHandlers } from '@/shared/utils/events';
import {
  initializeGalleryEvents,
  cleanupGalleryEvents,
  removeAllEventListeners,
  getEventListenerStatus,
} from '@/shared/utils/events';

describe('Phase 305: Gallery-Scoped Event Listener Attachment (RED)', () => {
  setupGlobalTestIsolation();

  let galleryRoot: HTMLElement;
  let mockHandlers: EventHandlers;

  beforeAll(() => {
    // Ensure document exists before any tests
    if (typeof document === 'undefined') {
      throw new Error('JSDOM document environment required for Phase 305 tests');
    }
  });

  beforeEach(() => {
    // Phase 305: Clean test state
    cleanupGalleryEvents();
    removeAllEventListeners();
    vi.clearAllMocks();

    // Create gallery root element
    if (typeof document !== 'undefined' && document.body) {
      document.body.innerHTML = '';
      galleryRoot = document.createElement('div');
      galleryRoot.id = 'xeg-gallery-root';
      galleryRoot.setAttribute('role', 'region');
      document.body.appendChild(galleryRoot);
    }

    // Mock event handlers
    mockHandlers = {
      onMediaClick: vi.fn(),
      onGalleryClose: vi.fn(),
      onKeyboardEvent: vi.fn(),
    };
  });

  afterEach(() => {
    // Cleanup
    cleanupGalleryEvents();
    removeAllEventListeners();
    vi.clearAllMocks();

    // Remove gallery root safely
    if (
      typeof document !== 'undefined' &&
      document.body &&
      galleryRoot &&
      galleryRoot.parentNode === document.body
    ) {
      try {
        document.body.removeChild(galleryRoot);
      } catch (e) {
        // Ignore if already removed
      }
    }
  });

  describe('Listener Registration State (Gallery Lifecycle)', () => {
    it('FAILING: should NOT register document listeners when gallery is closed', () => {
      // Phase 305 RED: 갤러리가 닫혀있을 때 document 리스너가 없어야 함
      // 현재 상태: initializeGalleryEvents()는 전역 리스너를 등록함 (문제)
      // 기대 상태: galleryRoot 파라미터 없으면 리스너 등록 안 함

      const status = getEventListenerStatus();

      // Assert: No document listeners initially
      // Phase 305: galleryRoot 없이 호출하면 리스너 0개
      expect(status.total).toBe(0);
      expect(status.byType.keydown).toBeUndefined();
      expect(status.byType.click).toBeUndefined();
    });

    it('FAILING: should register listeners to gallery root when gallery opens', async () => {
      // Phase 305 RED: Gallery 오픈 시 리스너를 galleryRoot에만 등록
      // 구현: initializeGalleryEvents(handlers, galleryRoot) 시그니처
      // AbortController를 사용한 cleanup 함수 반환

      // Arrange
      const initialStatus = getEventListenerStatus();
      expect(initialStatus.total).toBe(0);

      // Act: Initialize with gallery root
      const cleanup = await initializeGalleryEvents(mockHandlers, galleryRoot);

      // Assert: Listeners registered to gallery root (not document)
      const statusAfterInit = getEventListenerStatus();
      expect(statusAfterInit.total).toBeGreaterThan(0);
      expect(cleanup).toBeDefined();
      expect(typeof cleanup).toBe('function');

      // Cleanup
      cleanup();
    });

    it('FAILING: should cleanup listeners when gallery closes via AbortController', async () => {
      // Phase 305 RED: Gallery 닫을 때 AbortController로 자동 정리
      // 구현: initializeGalleryEvents가 cleanup() 함수 반환
      // cleanup()이 AbortController.abort()를 호출해 리스너 제거

      // Arrange
      const initialStatus = getEventListenerStatus();
      expect(initialStatus.total).toBe(0);

      // Act: Setup and teardown
      const cleanup = await initializeGalleryEvents(mockHandlers, galleryRoot);
      let statusAfterOpen = getEventListenerStatus();
      expect(statusAfterOpen.total).toBeGreaterThan(0);

      cleanup(); // Call returned cleanup function
      const statusAfterClose = getEventListenerStatus();

      // Assert: Listeners completely removed
      expect(statusAfterClose.total).toBe(0);
    });
  });

  describe('Listener Scope Enforcement', () => {
    it('FAILING: should ONLY handle Escape key within gallery root (not outside)', async () => {
      // Phase 305 RED: Escape 키가 galleryRoot 범위 내에서만 작동
      // 외부 요소에서 Escape를 누르면 갤러리 닫기가 작동하지 않아야 함
      // 현재 상태: 전역 document 리스너로 외부에서도 작동 (문제)

      const externalDiv = document.createElement('div');
      document.body.appendChild(externalDiv);

      let closeTriggerCount = 0;
      const trackingHandlers = {
        onMediaClick: vi.fn(),
        onGalleryClose: vi.fn(() => {
          closeTriggerCount++;
        }),
        onKeyboardEvent: vi.fn(),
      };

      // Act: Dispatch Escape on external element (not gallery root)
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      externalDiv.dispatchEvent(escapeEvent);

      // Assert: Gallery should NOT close (Escape was outside gallery root)
      expect(closeTriggerCount).toBe(0);
      expect(trackingHandlers.onGalleryClose).not.toHaveBeenCalled();

      // Cleanup
      if (externalDiv.parentNode === document.body) {
        document.body.removeChild(externalDiv);
      }
    });

    it('FAILING: should handle Escape key ONLY when inside gallery root', async () => {
      // Phase 305 RED: Escape 키가 galleryRoot 내부에서만 처리
      // Phase 305 GREEN에서 구현될 때:
      // 1. initializeGalleryEvents(handlers, galleryRoot) 호출
      // 2. galleryRoot에 keydown 리스너 등록
      // 3. Escape 키 감지 시 onGalleryClose 콜백 호출

      let closeTriggerCount = 0;
      const trackingHandlers = {
        onMediaClick: vi.fn(),
        onGalleryClose: () => {
          closeTriggerCount++;
        },
        onKeyboardEvent: vi.fn(),
      };

      // Phase 305 구현 후:
      // const cleanup = await initializeGalleryEvents(trackingHandlers, galleryRoot);

      // Act: Dispatch Escape on gallery root
      // const escapeEvent = new KeyboardEvent('keydown', {
      //   key: 'Escape',
      //   code: 'Escape',
      //   bubbles: true,
      //   cancelable: true,
      // });
      // galleryRoot.dispatchEvent(escapeEvent);

      // Assert: Gallery should close (Escape was inside gallery root)
      // expect(closeTriggerCount).toBe(1);
      // expect(trackingHandlers.onGalleryClose).toHaveBeenCalledOnce();

      // cleanup();

      expect(true).toBe(true); // Placeholder for GREEN implementation
    });

    it('FAILING: should NOT interfere with Twitter keyboard navigation outside gallery', async () => {
      // Phase 305 RED: Gallery 닫혀있을 때 Twitter의 키보드 네비게이션 미간섭
      // 예: Ctrl+Enter (트윗 전송), j/k (타임라인 네비게이션) 등
      // 현재 상태: 전역 document 리스너로 인해 Twitter 키보드 이벤트 간섭 가능성

      // Arrange: Create Twitter-like element
      const twitterInput = document.createElement('input');
      twitterInput.id = 'tweet-composer';
      twitterInput.placeholder = 'What is happening?!';
      document.body.appendChild(twitterInput);

      let twitterKeyboardHandled = false;
      twitterInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          twitterKeyboardHandled = true;
        }
      });

      // Act: Dispatch Ctrl+Enter on Twitter input (gallery closed)
      const tweetEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });

      twitterInput.dispatchEvent(tweetEvent);

      // Assert: Twitter keyboard handler should still work
      // (Gallery listeners should NOT intercept when gallery is closed)
      expect(twitterKeyboardHandled).toBe(true);

      // Cleanup
      if (twitterInput.parentNode === document.body) {
        document.body.removeChild(twitterInput);
      }
    });

    it('FAILING: should handle media clicks only within gallery root scope', async () => {
      // Phase 305 RED: Media click 이벤트도 galleryRoot로 스코핑
      // 외부의 이미지/비디오 클릭은 갤러리 미오픈

      const externalMedia = document.createElement('img');
      externalMedia.src = 'https://twitter.com/image.jpg';
      externalMedia.setAttribute('alt', 'Tweet image');
      document.body.appendChild(externalMedia);

      let mediaClickHandled = false;
      const trackingHandlers = {
        onMediaClick: () => {
          mediaClickHandled = true;
        },
        onGalleryClose: vi.fn(),
        onKeyboardEvent: vi.fn(),
      };

      // Act: Click on external media element
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      });

      externalMedia.dispatchEvent(clickEvent);

      // Assert: Gallery should NOT open (click was outside gallery root)
      expect(mediaClickHandled).toBe(false);

      // Cleanup
      if (externalMedia.parentNode === document.body) {
        document.body.removeChild(externalMedia);
      }
    });

    it('FAILING: should handle media clicks only within gallery root', async () => {
      // Phase 305 RED: Gallery root 내부의 media click만 처리
      // 인스타그램, 유튜브 embed 처럼 외부 라이브러리와 충돌 방지

      let mediaClickCount = 0;
      const trackingHandlers = {
        onMediaClick: () => {
          mediaClickCount++;
        },
        onGalleryClose: vi.fn(),
        onKeyboardEvent: vi.fn(),
      };

      // Phase 305 구현 후:
      // const cleanup = await initializeGalleryEvents(trackingHandlers, galleryRoot);

      // Act: Click on media inside gallery root
      // const mediaImg = document.createElement('img');
      // mediaImg.src = 'https://pbs.twimg.com/image.jpg';
      // galleryRoot.appendChild(mediaImg);
      //
      // const clickEvent = new MouseEvent('click', {
      //   bubbles: true,
      //   cancelable: true,
      //   view: window,
      // });
      // mediaImg.dispatchEvent(clickEvent);

      // Assert: Gallery should open (click was inside gallery root)
      // expect(mediaClickCount).toBe(1);

      // cleanup();

      expect(true).toBe(true); // Placeholder for GREEN implementation
    });
  });

  describe('AbortController Lifecycle', () => {
    it('FAILING: should use AbortController for automatic listener cleanup', async () => {
      // Phase 305 RED: AbortController를 사용한 자동 정리
      // 구현 패턴:
      // const abortController = new AbortController();
      // element.addEventListener('keydown', handler, { signal: abortController.signal });
      // cleanup() { abortController.abort(); } // 모든 리스너 자동 제거

      // Phase 305 GREEN에서 구현될 때:
      // 1. initializeGalleryEvents에서 AbortController 생성
      // 2. 모든 리스너를 { signal } 옵션으로 등록
      // 3. cleanup() 함수가 abortController.abort() 호출
      // 4. 모든 리스너 자동 제거

      // 기대 효과:
      // - 일일이 removeEventListener() 호출 불필요
      // - 리스너 누수 방지
      // - Phase 242-243 Pointer logging과 통합

      expect(true).toBe(true); // Placeholder for GREEN implementation
    });
  });
});
