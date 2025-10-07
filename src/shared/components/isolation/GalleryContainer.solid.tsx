/**
 * @fileoverview 갤러리 컨테이너 (Solid.js)
 * @description Light DOM 기반 갤러리 컨테이너 (Cascade Layers로 스타일 격리)
 */

import { createEffect, onCleanup, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { logger } from '@shared/logging';
import { EventManager } from '@shared/services/EventManager';

/**
 * 갤러리 컨테이너 Props
 */
export interface GalleryContainerProps {
  /** 자식 컴포넌트 */
  children: JSX.Element;
  /** 갤러리 닫기 콜백 */
  onClose?: () => void;
  /** CSS 클래스명 */
  className?: string;
}

/**
 * 갤러리 마운트 함수 - Light DOM 전용
 * @param container - 마운트할 DOM 컨테이너
 * @param element - 렌더링할 Solid 요소
 */
export function mountGallery(container: Element, element: () => JSX.Element): Element {
  try {
    render(element, container);
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
    render(() => null, container);
    logger.debug('Gallery unmounted successfully');
  } catch (error) {
    logger.error('Failed to unmount gallery:', error);
    throw error;
  }
}

/**
 * 갤러리 컨테이너 컴포넌트 - Light DOM 기반
 */
export function GalleryContainer(props: GalleryContainerProps): JSX.Element {
  // 키보드 이벤트 핸들러
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && props.onClose) {
      event.preventDefault();
      event.stopPropagation();
      props.onClose();
    }
  };

  // 키보드 이벤트 리스너 등록
  createEffect(() => {
    if (props.onClose) {
      const id = EventManager.getInstance().addListener(
        document,
        'keydown',
        handleKeyDown as unknown as EventListener
      );

      onCleanup(() => {
        EventManager.getInstance().removeListener(id);
      });
    }
  });

  return (
    <div
      class={`xeg-gallery-overlay xeg-gallery-container gallery-container ${props.className || ''}`}
      data-xeg-gallery-container=''
    >
      {props.children}
    </div>
  );
}

export default GalleryContainer;
