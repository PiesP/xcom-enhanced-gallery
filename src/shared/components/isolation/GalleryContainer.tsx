/**
 * @fileoverview 갤러리 컨테이너
 * @description Light DOM 기반 갤러리 컨테이너 (Cascade Layers로 스타일 격리)
 */

import { getSolid, type ComponentChildren, type JSXElement } from '../../external/vendors';
import { logger } from '../../logging';
import { EventManager } from '../../services/event-manager';

const DISPOSE_SYMBOL = Symbol('xeg-gallery-container-dispose');

/**
 * 갤러리 컨테이너 Props
 */
export interface GalleryContainerProps {
  /** 자식 컴포넌트 */
  children: ComponentChildren;
  /** 갤러리 닫기 콜백 */
  onClose?: () => void;
  /** CSS 클래스명 */
  className?: string;
}

/**
 * 갤러리 마운트 함수 - Light DOM 전용
 * @param container - 마운트할 DOM 컨테이너
 * @param element - 렌더링할 Preact 요소
 */
export function mountGallery(container: Element, element: unknown): Element {
  const solid = getSolid();

  try {
    const host = container as HTMLElement & {
      [DISPOSE_SYMBOL]?: () => void;
    };

    host[DISPOSE_SYMBOL]?.();

    const factory: () => JSXElement =
      typeof element === 'function' ? (element as () => JSXElement) : () => element as JSXElement;

    host[DISPOSE_SYMBOL] = solid.render(factory, host);
    logger.debug('Gallery mounted with Light DOM (Cascade Layers for style isolation)');
    return container;
  } catch (error) {
    logger.error('Failed to mount gallery:', error);
    throw error;
  }
}

/**
 * 갤러리 언마운트 함수
 * Phase 294: Twitter 네비게이션 호환성 개선
 * Phase 300.1: Reflow 최적화 - 조건부 실행으로 성능 영향 최소화
 *
 * @param container - 언마운트할 DOM 컨테이너
 */
export function unmountGallery(container: Element): void {
  try {
    const host = container as HTMLElement & {
      [DISPOSE_SYMBOL]?: () => void;
    };

    // 1. Solid dispose 호출
    host[DISPOSE_SYMBOL]?.();
    delete host[DISPOSE_SYMBOL];

    // 2. Phase 294: DOM 요소 완전 제거 (Twitter 스크롤 복원 호환성)
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // 3. Phase 300.1: Twitter 스크롤 컨테이너 참조 최적화
    // Twitter의 scrollRestoration 로직이 올바른 viewport를 계산하도록 지원
    // 단, 성능 영향 최소화를 위해 Twitter 페이지에서만 실행
    if (window.location.hostname === 'x.com' || window.location.hostname === 'twitter.com') {
      const twitterScroll = document.querySelector('[data-testid="primaryColumn"]');
      if (twitterScroll) {
        // IntersectionObserver로 viewport 내에 있을 때만 reflow
        // 단, 이미 언마운트 시점이므로 간단히 scrollHeight 읽기로 충분
        void twitterScroll.scrollHeight; // Read property to trigger layout recalculation

        logger.debug('Twitter scroll container refreshed for restoration compatibility');
      }
    }

    logger.debug(
      'Gallery unmounted successfully (Phase 300.1: DOM cleaned + conditional Twitter scroll refresh)'
    );
  } catch (error) {
    logger.error('Failed to unmount gallery:', error);
    throw error;
  }
}

/**
 * 갤러리 컨테이너 컴포넌트 - Light DOM 기반
 */
export function GalleryContainer({
  children,
  onClose,
  className = '',
}: GalleryContainerProps): JSXElement {
  const { createEffect, onCleanup } = getSolid();

  createEffect(() => {
    if (!onClose) {
      return;
    }

    const listenerId = EventManager.getInstance().addListener(document, 'keydown', event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === 'Escape') {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        onClose();
      }
    });

    onCleanup(() => {
      EventManager.getInstance().removeListener(listenerId);
    });
  });

  return (
    <div
      class={`xeg-gallery-overlay xeg-gallery-container gallery-container ${className}`.trim()}
      data-xeg-gallery-container=''
    >
      {children}
    </div>
  );
}

export default GalleryContainer;
