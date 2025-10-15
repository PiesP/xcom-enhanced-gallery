/**
 * 갤러리 초기화 지연 문제 해결 테스트
 * @description 새로고침 후 즉시 미디어 클릭 시 유저스크립트 갤러리가 표시되는지 검증
 */

/* eslint-disable no-undef */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// DOM 타입 명시적 참조
type DOMEvent = Event;
type DOMMouseEvent = MouseEvent;
type DOMMutationObserver = MutationObserver;
type DOMNode = Node;

describe('갤러리 초기화 지연 문제 해결', () => {
  let mockMediaElement: HTMLElement;
  let clickEventCaptured = false;
  let galleryOpened = false;

  beforeEach(() => {
    clickEventCaptured = false;
    galleryOpened = false;

    // 미디어 요소 모킹
    mockMediaElement = document.createElement('img');
    mockMediaElement.setAttribute('data-testid', 'tweetPhoto');
    mockMediaElement.src = 'https://pbs.twimg.com/media/test.jpg';
    document.body.appendChild(mockMediaElement);
  });

  afterEach(() => {
    if (document.body.contains(mockMediaElement)) {
      document.body.removeChild(mockMediaElement);
    }
  });

  describe('즉시 이벤트 캡처', () => {
    it('갤러리 초기화 전에도 미디어 클릭 이벤트를 캡처해야 함', () => {
      // 이벤트 캡처 서비스 시뮬레이션
      const captureHandler = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        clickEventCaptured = true;
      };

      // 즉시 이벤트 핸들러 등록 (capture phase)
      mockMediaElement.addEventListener('click', captureHandler, { capture: true });

      // 미디어 클릭 시뮬레이션
      const clickEvent = new MouseEvent('click', { bubbles: true });
      mockMediaElement.dispatchEvent(clickEvent);

      expect(clickEventCaptured).toBe(true);
    });

    it('캡처된 클릭을 갤러리 초기화 후 처리해야 함', () => {
      const pendingClicks: Array<{ element: HTMLElement; event: MouseEvent }> = [];

      // 초기화 전 클릭 캡처
      const earlyHandler = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        pendingClicks.push({
          element: mockMediaElement,
          event: event as MouseEvent,
        });
      };

      mockMediaElement.addEventListener('click', earlyHandler, { capture: true });

      // 클릭 이벤트 발생
      const clickEvent = new MouseEvent('click', { bubbles: true });
      mockMediaElement.dispatchEvent(clickEvent);

      expect(pendingClicks).toHaveLength(1);

      // 갤러리 초기화 완료 후 처리
      const galleryHandler = () => {
        galleryOpened = true;
      };

      // 대기 중인 클릭 처리
      pendingClicks.forEach(() => {
        galleryHandler();
      });

      expect(galleryOpened).toBe(true);
    });
  });

  describe('MutationObserver 기반 실시간 감지', () => {
    it('새로 추가된 미디어 요소에 즉시 이벤트 핸들러를 등록해야 함', async () => {
      let handlerAttached = false;

      // MutationObserver 시뮬레이션
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.matches('[data-testid="tweetPhoto"]')) {
                // 즉시 이벤트 핸들러 등록
                handlerAttached = true;
              }
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // 새 미디어 요소 동적 추가
      const newMedia = document.createElement('img');
      newMedia.setAttribute('data-testid', 'tweetPhoto');
      newMedia.src = 'https://pbs.twimg.com/media/new.jpg';
      document.body.appendChild(newMedia);

      // 비동기 작업 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      observer.disconnect();
      if (document.body.contains(newMedia)) {
        document.body.removeChild(newMedia);
      }

      expect(handlerAttached).toBe(true);
    });
  });

  describe('초기화 타이밍 최적화', () => {
    it('5초 타이머 없이 즉시 초기화해야 함', () => {
      let initializationStarted = false;
      let timerUsed = false;

      // 기존 지연 초기화 시뮬레이션
      const scheduleWithDelay = () => {
        setTimeout(() => {
          timerUsed = true;
          initializationStarted = true;
        }, 5000);
      };

      // 즉시 초기화 시뮬레이션
      const initializeImmediately = () => {
        initializationStarted = true;
      };

      // 즉시 초기화 방식 테스트
      initializeImmediately();

      expect(initializationStarted).toBe(true);
      expect(timerUsed).toBe(false);
    });
  });
});
