/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview 스크롤 격리 테스트 유틸리티
 * @description 스크롤 관련 테스트를 위한 헬퍼 함수들
 */

/**
 * wheel 이벤트 Mock 생성 헬퍼
 */
export function createMockWheelEvent(options: {
  deltaY: number;
  target: HTMLElement;
  preventDefault?: () => void;
  stopPropagation?: () => void;
}): WheelEvent {
  const { deltaY, target, preventDefault, stopPropagation } = options;

  const event = new WheelEvent('wheel', {
    deltaY,
    bubbles: true,
    cancelable: true,
  });

  // Mock preventDefault와 stopPropagation
  if (preventDefault) {
    Object.defineProperty(event, 'preventDefault', {
      value: preventDefault,
      writable: false,
    });
  }

  if (stopPropagation) {
    Object.defineProperty(event, 'stopPropagation', {
      value: stopPropagation,
      writable: false,
    });
  }

  Object.defineProperty(event, 'target', {
    value: target,
    writable: false,
  });

  return event;
}

/**
 * 갤러리 Mock DOM 생성 헬퍼
 */
export function createGalleryMockDOM() {
  const container = document.createElement('div');
  container.className = 'xeg-gallery-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.zIndex = '9999';

  const itemsList = document.createElement('div');
  itemsList.className = 'itemsList';
  itemsList.setAttribute('data-xeg-role', 'items-list');
  itemsList.style.overflowY = 'auto';
  itemsList.style.height = '80vh';

  const twitterContainer = document.createElement('div');
  twitterContainer.setAttribute('data-testid', 'primaryColumn');
  twitterContainer.style.height = '200vh'; // 스크롤 가능하게

  container.appendChild(itemsList);

  return {
    container,
    itemsList,
    twitterContainer,
    cleanup: () => {
      container.remove();
      twitterContainer.remove();
    },
  };
}

/**
 * 이벤트 차단 여부 추적 헬퍼
 */
export function createEventBlockTracker() {
  let prevented = false;
  let stopped = false;

  const preventDefault = () => {
    prevented = true;
  };
  const stopPropagation = () => {
    stopped = true;
  };

  const reset = () => {
    prevented = false;
    stopped = false;
  };

  return {
    preventDefault,
    stopPropagation,
    isPrevented: () => prevented,
    isStopped: () => stopped,
    reset,
  };
}
