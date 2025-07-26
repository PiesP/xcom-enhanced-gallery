/**
 * @fileoverview 통합된 갤러리 HOC 시스템
 * @description 모든 갤러리 HOC를 단일 시스템으로 통합
 * @version 1.0.0 - Phase 2-2 HOC 최적화
 */

import { logger } from '@shared/logging/logger';
import type { ComponentChildren, ComponentType } from '@shared/types/app.types';
import { getPreact } from '@shared/external/vendors';
import type { VNode } from '@shared/external/vendors';

/**
 * 통합 갤러리 마킹 타입
 */
export type UnifiedGalleryType = 'container' | 'item' | 'control' | 'overlay' | 'viewer';

/**
 * 통합 갤러리 HOC 옵션
 */
export interface UnifiedGalleryOptions {
  /** 갤러리 타입 */
  readonly type: UnifiedGalleryType;
  /** 추가 클래스명 */
  readonly className?: string;
  /** 이벤트 처리 옵션 */
  readonly events?: {
    /** 클릭 이벤트 차단 여부 */
    preventClick?: boolean;
    /** 키보드 이벤트 차단 여부 */
    preventKeyboard?: boolean;
    /** 트위터 네이티브 갤러리 차단 여부 */
    blockTwitterNative?: boolean;
  };
  /** 커스텀 데이터 속성 */
  readonly customData?: Record<string, string>;
  /** 접근성 속성 */
  readonly accessibility?: {
    role?: string;
    ariaLabel?: string;
    tabIndex?: number;
  };
}

/**
 * 갤러리 컴포넌트 기본 Props
 */
export interface UnifiedGalleryComponentProps {
  children?: ComponentChildren;
  className?: string;
  onClick?: (event: MouseEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  [key: string]: unknown;
}

/**
 * 타입별 기본 옵션
 */
const TYPE_DEFAULTS: Record<UnifiedGalleryType, Partial<UnifiedGalleryOptions>> = {
  container: {
    events: { preventClick: false, preventKeyboard: false, blockTwitterNative: true },
    accessibility: { role: 'dialog', tabIndex: 0 },
  },
  item: {
    events: { preventClick: true, preventKeyboard: false, blockTwitterNative: true },
    accessibility: { role: 'button', tabIndex: 0 },
  },
  control: {
    events: { preventClick: false, preventKeyboard: false, blockTwitterNative: false },
    accessibility: { role: 'button', tabIndex: 0 },
  },
  overlay: {
    events: { preventClick: false, preventKeyboard: true, blockTwitterNative: true },
    accessibility: { role: 'dialog', tabIndex: -1 },
  },
  viewer: {
    events: { preventClick: false, preventKeyboard: false, blockTwitterNative: true },
    accessibility: { role: 'img', tabIndex: 0 },
  },
};

/**
 * 통합 갤러리 HOC
 *
 * @description
 * 모든 갤러리 관련 컴포넌트에 대한 통합 HOC입니다.
 * - 일관된 마킹 시스템
 * - 타입별 최적화된 기본값
 * - 향상된 이벤트 처리
 * - 트위터 네이티브 갤러리 차단
 * - 접근성 지원
 *
 * @example
 * ```tsx
 * const GalleryButton = withUnifiedGallery(Button, {
 *   type: 'control',
 *   className: 'download-btn'
 * });
 * ```
 */
export function withUnifiedGallery<P extends UnifiedGalleryComponentProps>(
  Component: ComponentType<P>,
  options: UnifiedGalleryOptions
): ComponentType<P> {
  // 타입별 기본값과 사용자 옵션 병합
  const mergedOptions = mergeOptionsWithDefaults(options);

  const UnifiedGalleryComponent = (props: P): VNode | null => {
    const { createElement } = getPreact();

    // 마킹 속성 생성
    const markerAttributes = createUnifiedMarkerAttributes(mergedOptions);

    // 클래스명 통합
    const unifiedClassName = createUnifiedClassName(props.className, mergedOptions);

    // 이벤트 핸들러 생성
    const eventHandlers = createUnifiedEventHandlers(props, mergedOptions);

    // 접근성 속성 생성
    const accessibilityAttributes = createAccessibilityAttributes(mergedOptions);

    // 최종 Props 구성
    const finalProps = {
      ...props,
      ...markerAttributes,
      ...eventHandlers,
      ...accessibilityAttributes,
      className: unifiedClassName,
    };

    logger.debug(`Rendering unified gallery component: ${mergedOptions.type}`, {
      type: mergedOptions.type,
      className: unifiedClassName,
      events: mergedOptions.events,
    });

    return createElement(Component, finalProps) as unknown as VNode;
  };

  // 컴포넌트 이름 설정
  const componentName = getComponentName(Component);
  (UnifiedGalleryComponent as { displayName?: string }).displayName =
    `withUnifiedGallery(${componentName})`;

  return UnifiedGalleryComponent;
}

/**
 * 옵션과 기본값 병합
 */
function mergeOptionsWithDefaults(options: UnifiedGalleryOptions): Required<UnifiedGalleryOptions> {
  const typeDefaults = TYPE_DEFAULTS[options.type] || {};

  return {
    type: options.type,
    className: options.className || '',
    events: {
      preventClick: false,
      preventKeyboard: false,
      blockTwitterNative: true,
      ...typeDefaults.events,
      ...options.events,
    },
    customData: {
      ...options.customData,
    },
    accessibility: {
      role: 'button',
      ...typeDefaults.accessibility,
      ...options.accessibility,
    },
  };
}

/**
 * 통합 마킹 속성 생성
 */
function createUnifiedMarkerAttributes(
  options: Required<UnifiedGalleryOptions>
): Record<string, string> {
  const attributes: Record<string, string> = {
    'data-xeg-gallery': 'true',
    'data-xeg-gallery-type': options.type,
    'data-xeg-gallery-version': '2.0',
  };

  // 이벤트 차단 정보
  if (options.events.preventClick) {
    attributes['data-xeg-prevent-click'] = 'true';
  }

  if (options.events.preventKeyboard) {
    attributes['data-xeg-prevent-keyboard'] = 'true';
  }

  if (options.events.blockTwitterNative) {
    attributes['data-xeg-block-twitter'] = 'true';
  }

  // 커스텀 데이터 속성
  Object.entries(options.customData).forEach(([key, value]) => {
    attributes[`data-xeg-${key}`] = value;
  });

  return attributes;
}

/**
 * 통합 클래스명 생성
 */
function createUnifiedClassName(
  existingClassName?: string,
  options?: Required<UnifiedGalleryOptions>
): string {
  const classNames = [
    'xeg-gallery',
    `xeg-gallery-${options?.type}`,
    options?.className,
    existingClassName,
  ].filter(Boolean);

  return classNames.join(' ');
}

/**
 * 통합 이벤트 핸들러 생성
 */
function createUnifiedEventHandlers<P extends UnifiedGalleryComponentProps>(
  props: P,
  options: Required<UnifiedGalleryOptions>
): Partial<UnifiedGalleryComponentProps> {
  const handlers: Partial<UnifiedGalleryComponentProps> = {};

  // 클릭 이벤트 핸들러
  if (options.events.preventClick || options.events.blockTwitterNative) {
    handlers.onClick = (event: MouseEvent): void => {
      logger.debug(`Unified gallery click handler: ${options.type}`, {
        preventDefault: options.events.preventClick,
        blockTwitter: options.events.blockTwitterNative,
      });

      // 기존 핸들러 호출
      if (props.onClick) {
        props.onClick(event);
      }

      // 트위터 네이티브 갤러리 차단
      if (options.events.blockTwitterNative) {
        event.stopImmediatePropagation();
      }

      // 클릭 이벤트 차단
      if (options.events.preventClick) {
        event.stopPropagation();
        event.preventDefault();
      }
    };
  }

  // 키보드 이벤트 핸들러
  if (options.events.preventKeyboard) {
    handlers.onKeyDown = (event: KeyboardEvent): void => {
      logger.debug(`Unified gallery keyboard handler: ${options.type}`);

      // 기존 핸들러 호출
      if (props.onKeyDown) {
        props.onKeyDown(event);
      }

      // 특정 키 차단
      if (['Space', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.stopPropagation();
        event.preventDefault();
      }
    };
  }

  return handlers;
}

/**
 * 접근성 속성 생성
 */
function createAccessibilityAttributes(
  options: Required<UnifiedGalleryOptions>
): Record<string, string | number> {
  const attributes: Record<string, string | number> = {};

  if (options.accessibility.role) {
    attributes.role = options.accessibility.role;
  }

  if (options.accessibility.ariaLabel) {
    attributes['aria-label'] = options.accessibility.ariaLabel;
  }

  if (typeof options.accessibility.tabIndex === 'number') {
    attributes.tabIndex = options.accessibility.tabIndex;
  }

  return attributes;
}

/**
 * 컴포넌트 이름 추출
 */
function getComponentName<T>(Component: ComponentType<T>): string {
  return (
    (Component as { displayName?: string; name?: string }).displayName ??
    (Component as { displayName?: string; name?: string }).name ??
    'Component'
  );
}

/**
 * 타입별 편의 함수들
 */

/**
 * 갤러리 컨테이너 HOC
 */
export function withGalleryContainer<P extends UnifiedGalleryComponentProps>(
  Component: ComponentType<P>,
  additionalOptions: Partial<UnifiedGalleryOptions> = {}
): ComponentType<P> {
  return withUnifiedGallery(Component, {
    type: 'container',
    ...additionalOptions,
  });
}

/**
 * 갤러리 아이템 HOC
 */
export function withGalleryItem<P extends UnifiedGalleryComponentProps>(
  Component: ComponentType<P>,
  additionalOptions: Partial<UnifiedGalleryOptions> = {}
): ComponentType<P> {
  return withUnifiedGallery(Component, {
    type: 'item',
    ...additionalOptions,
  });
}

/**
 * 갤러리 컨트롤 HOC
 */
export function withGalleryControl<P extends UnifiedGalleryComponentProps>(
  Component: ComponentType<P>,
  additionalOptions: Partial<UnifiedGalleryOptions> = {}
): ComponentType<P> {
  return withUnifiedGallery(Component, {
    type: 'control',
    ...additionalOptions,
  });
}

/**
 * 갤러리 마커 HOC (하위 호환성)
 */
export function withGalleryMarker<P extends UnifiedGalleryComponentProps>(
  Component: ComponentType<P>,
  options: { type: UnifiedGalleryType; [key: string]: unknown }
): ComponentType<P> {
  logger.warn('withGalleryMarker is deprecated. Use withUnifiedGallery instead.');
  return withUnifiedGallery(Component, options as UnifiedGalleryOptions);
}

/**
 * 유틸리티 함수들
 */

/**
 * DOM 요소가 통합 갤러리 요소인지 확인
 */
export function isUnifiedGalleryElement(element: Element): boolean {
  return (
    element.hasAttribute('data-xeg-gallery') &&
    element.getAttribute('data-xeg-gallery-version') === '2.0'
  );
}

/**
 * DOM 요소의 갤러리 타입 반환
 */
export function getUnifiedGalleryType(element: Element): UnifiedGalleryType | null {
  const type = element.getAttribute('data-xeg-gallery-type');
  return type as UnifiedGalleryType | null;
}

/**
 * 이벤트가 통합 갤러리 요소에서 발생했는지 확인
 */
export function isEventFromUnifiedGallery(event: Event): boolean {
  const target = event.target as Element | null;
  if (!target) return false;

  const galleryElement = target.closest('[data-xeg-gallery-version="2.0"]');
  return galleryElement !== null;
}
