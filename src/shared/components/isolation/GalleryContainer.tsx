/**
 * @fileoverview 갤러리 컨테이너
 * @description Solid 기반 갤러리 컨테이너와 Light DOM 마운트 도우미
 */

import type { JSX } from 'solid-js';
import { getSolidCore, getSolidWeb } from '@shared/external/vendors';
import { logger } from '@shared/logging';

type GalleryChild = JSX.Element | JSX.Element[] | string | number | boolean | null | undefined;

const containerRegistry = new WeakMap<
  Element,
  {
    dispose: () => void;
    contentRoot: Element;
  }
>();

/**
 * 갤러리 컨테이너 Props
 */
export interface GalleryContainerProps {
  /** 자식 컴포넌트 */
  readonly children?: GalleryChild;
  /** 갤러리 닫기 콜백 */
  readonly onClose?: () => void;
  /** CSS 클래스명 */
  readonly className?: string;
  /** 갤러리 열림 상태 */
  readonly isOpen?: boolean;
}

/**
 * Light DOM 전역 스타일 주입 (단일 인스턴스)
 */
let lightDomStyleInjected = false;

function injectLightDomStyles(): void {
  if (lightDomStyleInjected) {
    return;
  }

  const globalCssText = (globalThis as { XEG_CSS_TEXT?: string }).XEG_CSS_TEXT ?? '';

  // JSDOM 환경에서는 CSS 파싱 문제로 인해 스타일 주입 스킵
  // (테스트 환경에서는 실제 스타일 적용이 필요하지 않음)
  const isJSDOM = typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom');

  if (isJSDOM) {
    lightDomStyleInjected = true;
    logger.debug('Light DOM styles skipped in JSDOM environment');
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-xeg-global', 'true');
  styleElement.textContent = globalCssText;
  document.head.appendChild(styleElement);

  lightDomStyleInjected = true;
  logger.debug('Light DOM styles injected to document.head');
}

/**
 * 갤러리 마운트 함수 - Solid 기반 Light DOM
 */
export function mountGallery(
  container: Element,
  element: JSX.Element | (() => JSX.Element),
  _useShadowDOM = false // 하위 호환성을 위해 파라미터 유지 (미사용)
): { root: Element } {
  if (typeof document === 'undefined') {
    throw new Error('mountGallery cannot run without a DOM environment');
  }

  const { render } = getSolidWeb();

  try {
    // Light DOM 모드: 전역 스타일 주입
    injectLightDomStyles();
    container.replaceChildren();
    logger.debug('Gallery mounted in Light DOM mode');

    const factory: () => JSX.Element =
      typeof element === 'function' ? (element as () => JSX.Element) : () => element;

    const dispose = render(factory, container as unknown as HTMLElement);

    containerRegistry.set(container, { dispose, contentRoot: container });

    return { root: container };
  } catch (error) {
    logger.error('Failed to mount gallery:', error);
    throw error;
  }
}

/**
 * 갤러리 언마운트 함수 (Solid 렌더러 정리)
 */
export function unmountGallery(container: Element): void {
  const lifecycle = containerRegistry.get(container);

  try {
    lifecycle?.dispose();
  } catch (error) {
    logger.warn('Error disposing gallery renderer', error);
  }

  try {
    container.replaceChildren();
  } catch (error) {
    logger.warn('Error clearing gallery container', error);
  }

  containerRegistry.delete(container);
  logger.debug('Gallery unmounted successfully');
}

/**
 * 갤러리 컨테이너 컴포넌트 - Light DOM
 */
export function GalleryContainer({
  children,
  onClose,
  className = '',
  isOpen = true,
}: GalleryContainerProps) {
  const { createEffect, onCleanup } = getSolidCore();

  createEffect(() => {
    if (!onClose) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  return (
    <div
      class={`xeg-gallery-overlay xeg-gallery-container gallery-container ${className}`.trim()}
      data-open={isOpen ? 'true' : 'false'}
    >
      {children}
    </div>
  );
}

export default GalleryContainer;
