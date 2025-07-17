/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 스크롤 이벤트 처리 유틸리티
 * @description 스크롤 이벤트의 안전한 등록과 처리를 위한 유틸리티 함수들
 */

import { logger } from '@infrastructure/logging/logger';
import { createDebouncer } from './performance/Debouncer';

interface ScrollHandlerOptions {
  /** 휠 이벤트에서 preventDefault 호출 여부 */
  preventDefaultOnWheel?: boolean;
  /** 문서 전체에 이벤트 등록 여부 */
  captureOnDocument?: boolean;
  /** 패시브 리스너 사용 여부 */
  passive?: boolean;
}

/**
 * 스크롤 이벤트 처리를 위한 유틸리티 함수
 *
 * @param element - 스크롤을 감지할 요소
 * @param onScroll - 스크롤 발생 시 실행할 콜백 함수
 * @param options - 추가 옵션
 * @returns 이벤트 리스너 정리 함수
 */
export function createScrollHandler(
  element: HTMLElement | null,
  onScroll: (event: WheelEvent) => void,
  options: ScrollHandlerOptions = {}
): () => void {
  if (!element) {
    return () => {};
  }

  const {
    preventDefaultOnWheel = false,
    captureOnDocument = false,
    passive = !preventDefaultOnWheel,
  } = options;

  const wheelHandler = (event: WheelEvent) => {
    try {
      if (preventDefaultOnWheel) {
        event.preventDefault();
      }
      onScroll(event);
    } catch (error) {
      logger.error('createScrollHandler: 스크롤 핸들러 실행 실패', error);
    }
  };

  const targetElement = captureOnDocument ? document : element;

  try {
    (targetElement as Document | Element).addEventListener('wheel', wheelHandler as EventListener, {
      passive,
    });

    logger.debug('createScrollHandler: 휠 이벤트 리스너 등록', {
      captureOnDocument,
      passive,
      preventDefaultOnWheel,
    });

    return () => {
      try {
        (targetElement as Document | Element).removeEventListener(
          'wheel',
          wheelHandler as EventListener
        );
        logger.debug('createScrollHandler: 휠 이벤트 리스너 제거');
      } catch (error) {
        logger.warn('createScrollHandler: 이벤트 리스너 제거 실패', error);
      }
    };
  } catch (error) {
    logger.error('createScrollHandler: 이벤트 리스너 등록 실패', error);
    // 테스트에서 감지할 수 있도록 예외 재 throw
    throw error;
  }
}

/**
 * 안전한 스크롤 이벤트 전파 방지
 *
 * @param event - 이벤트 객체
 * @param stopPropagation - 이벤트 전파 중단 여부
 * @param preventDefault - 기본 동작 방지 여부
 */
export function preventScrollPropagation(
  event: Event,
  stopPropagation = true,
  preventDefault = false
): void {
  try {
    if (stopPropagation) {
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
    if (preventDefault) {
      event.preventDefault();
    }
  } catch (error) {
    logger.warn('preventScrollPropagation: 이벤트 처리 실패', error);
  }
}

/**
 * 트위터 페이지의 스크롤 컨테이너 찾기
 *
 * @returns 트위터 메인 스크롤 컨테이너 또는 null
 */
export function findTwitterScrollContainer(): HTMLElement | null {
  const selectors = [
    'main[role="main"]',
    '[data-testid="primaryColumn"]',
    '[aria-label="Timeline: Your Home Timeline"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      logger.debug('findTwitterScrollContainer: 트위터 컨테이너 발견', { selector });
      return element;
    }
  }

  logger.warn('findTwitterScrollContainer: 트위터 컨테이너를 찾을 수 없음');
  return null;
}

/**
 * 요소가 갤러리 내부 요소인지 확인
 *
 * @param element - 확인할 요소
 * @returns 갤러리 내부 요소 여부
 */
export function isGalleryElement(element: HTMLElement | null): boolean {
  if (!element) {
    return false;
  }

  const gallerySelectors = [
    '.xeg-gallery-container',
    '[data-xeg-gallery]',
    '.vertical-gallery-view',
    '[data-xeg-role="gallery"]',
  ];

  return gallerySelectors.some(selector => element.closest(selector) !== null);
}

/**
 * 스크롤 이벤트 디바운싱을 위한 유틸리티
 *
 * @param callback - 실행할 콜백 함수
 * @param delay - 디바운스 지연 시간 (밀리초)
 * @returns 디바운스된 함수와 정리 함수
 */
export function createScrollDebouncer(
  callback: () => void,
  delay = 150
): { debouncedFn: () => void; cleanup: () => void } {
  const debouncer = createDebouncer(callback, delay);

  return {
    debouncedFn: () => debouncer.execute(),
    cleanup: () => debouncer.cancel(),
  };
}

/**
 * 갤러리 요소에서 UI 상태와 무관하게 스크롤이 가능하도록 보장
 *
 * @param element - 갤러리 컨테이너 요소
 */
export function ensureGalleryScrollAvailable(element: HTMLElement | null): void {
  if (!element) {
    return;
  }

  try {
    // pointer-events 속성을 명시적으로 auto로 설정하여 스크롤 이벤트 차단 방지
    element.style.setProperty('pointer-events', 'auto', 'important');

    // 동적으로 스크롤 가능한 요소들을 찾아서 보장
    const scrollableElements = element.querySelectorAll(
      '[data-xeg-scroll]'
    ) as NodeListOf<HTMLElement>;

    // data-xeg-scroll 속성이 없는 경우 기본 선택자들 시도
    if (scrollableElements.length === 0) {
      const fallbackSelectors = ['[data-xeg-role="items-list"]', '.itemsList', '.content'];

      fallbackSelectors.forEach(selector => {
        const elements = element.querySelectorAll(selector) as NodeListOf<HTMLElement>;
        elements.forEach(el => {
          el.style.setProperty('pointer-events', 'auto', 'important');
          el.setAttribute('data-xeg-scroll', 'enabled'); // 마킹하여 중복 처리 방지
        });
      });
    } else {
      // data-xeg-scroll 요소들에 대해 스크롤 보장
      scrollableElements.forEach(el => {
        el.style.setProperty('pointer-events', 'auto', 'important');
      });
    }

    logger.debug('ensureGalleryScrollAvailable: 갤러리 스크롤 가용성 보장 완료', {
      mainElement: !!element,
      scrollableElementsCount: scrollableElements.length,
    });
  } catch (error) {
    logger.warn('ensureGalleryScrollAvailable: 스크롤 보장 처리 실패', error);
  }
}
