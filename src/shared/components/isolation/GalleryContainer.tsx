/**
 * @fileoverview 갤러리 컨테이너
 * @description Solid 기반 갤러리 컨테이너와 Shadow DOM 마운트 도우미
 */

import type { JSX } from 'solid-js';
import { getSolidCore, getSolidWeb } from '@shared/external/vendors';
import { logger } from '@shared/logging';

type GalleryChild = JSX.Element | JSX.Element[] | string | number | boolean | null | undefined;

const containerRegistry = new WeakMap<
  Element,
  {
    dispose: () => void;
    shadowRoot?: ShadowRoot;
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
  /** Shadow DOM 사용 여부 */
  readonly useShadowDOM?: boolean;
}

const HOST_RULES = `
  :host {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: var(--xeg-z-overlay);
    isolation: isolate;
  }
`;

function injectShadowStyles(shadowRoot: ShadowRoot): void {
  const globalCssText = (globalThis as { XEG_CSS_TEXT?: string }).XEG_CSS_TEXT ?? '';
  const styleElement = document.createElement('style');
  styleElement.textContent = `${globalCssText}\n${HOST_RULES}`;
  shadowRoot.appendChild(styleElement);
}

function ensureShadowRoot(container: Element): ShadowRoot | undefined {
  if (!(container instanceof HTMLElement)) {
    return undefined;
  }
  if (!('attachShadow' in container)) {
    return undefined;
  }

  if (container.shadowRoot) {
    return container.shadowRoot;
  }

  try {
    return container.attachShadow({ mode: 'open' });
  } catch (error) {
    logger.warn('Shadow DOM attachment failed, falling back to light DOM', error);
    return undefined;
  }
}

function prepareShadowDom(container: Element): { shadowRoot?: ShadowRoot; renderTarget: Element } {
  const shadowRoot = ensureShadowRoot(container);
  if (!shadowRoot) {
    container.replaceChildren();
    return { renderTarget: container };
  }

  // cleanup previous nodes while preserving new structure
  while (shadowRoot.firstChild) {
    shadowRoot.removeChild(shadowRoot.firstChild);
  }

  injectShadowStyles(shadowRoot);

  const contentRoot = document.createElement('div');
  contentRoot.setAttribute('data-xeg-shadow-content', 'true');
  shadowRoot.appendChild(contentRoot);

  logger.info('Gallery mounted with Shadow DOM for style isolation');

  return { shadowRoot, renderTarget: contentRoot };
}

/**
 * 갤러리 마운트 함수 - Solid 기반 Shadow DOM 지원
 */
export function mountGallery(
  container: Element,
  element: JSX.Element | (() => JSX.Element),
  useShadowDOM = false
): { root: Element; shadowRoot?: ShadowRoot } {
  if (typeof document === 'undefined') {
    throw new Error('mountGallery cannot run without a DOM environment');
  }

  const { render } = getSolidWeb();

  try {
    const { shadowRoot, renderTarget } = useShadowDOM
      ? prepareShadowDom(container)
      : { shadowRoot: undefined, renderTarget: container };

    if (!shadowRoot) {
      container.replaceChildren();
      logger.debug('Gallery mounted without Shadow DOM (fallback mode)');
    }

    const factory: () => JSX.Element =
      typeof element === 'function' ? (element as () => JSX.Element) : () => element;

    const dispose = render(factory, renderTarget as unknown as HTMLElement);

    containerRegistry.set(
      container,
      shadowRoot
        ? { dispose, shadowRoot, contentRoot: renderTarget }
        : { dispose, contentRoot: renderTarget }
    );

    return shadowRoot ? { root: renderTarget, shadowRoot } : { root: renderTarget };
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
    if (lifecycle?.shadowRoot) {
      const { shadowRoot } = lifecycle;
      if (shadowRoot) {
        while (shadowRoot.firstChild) {
          shadowRoot.removeChild(shadowRoot.firstChild);
        }
      }
    } else {
      container.replaceChildren();
    }
  } catch (error) {
    logger.warn('Error clearing gallery container', error);
  }

  containerRegistry.delete(container);
  logger.debug('Gallery unmounted successfully');
}

/**
 * 갤러리 컨테이너 컴포넌트 - Shadow DOM 지원
 */
export function GalleryContainer({
  children,
  onClose,
  className = '',
  useShadowDOM = false,
}: GalleryContainerProps) {
  const { createEffect, onCleanup } = getSolidCore();
  let containerRef: HTMLDivElement | undefined;

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

  createEffect(() => {
    if (useShadowDOM && containerRef && 'attachShadow' in containerRef) {
      logger.debug('Shadow DOM container initialized');
    }
  });

  return (
    <div
      ref={node => {
        containerRef = node ?? undefined;
      }}
      class={`xeg-gallery-overlay xeg-gallery-container gallery-container ${className}`.trim()}
      data-shadow={useShadowDOM ? 'true' : undefined}
    >
      {children}
    </div>
  );
}

export default GalleryContainer;
