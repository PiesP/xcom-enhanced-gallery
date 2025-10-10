/**
 * @fileoverview 갤러리 컨테이너
 * @description Light DOM 기반 갤러리 컨테이너 (Cascade Layers로 스타일 격리)
 */

import { getSolid, type ComponentChildren, type JSXElement } from '../../external/vendors';
import { logger } from '../../logging';
import { EventManager } from '../../services/EventManager';

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
 * @param container - 언마운트할 DOM 컨테이너
 */
export function unmountGallery(container: Element): void {
  try {
    const host = container as HTMLElement & {
      [DISPOSE_SYMBOL]?: () => void;
    };

    host[DISPOSE_SYMBOL]?.();
    delete host[DISPOSE_SYMBOL];
    logger.debug('Gallery unmounted successfully');
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
