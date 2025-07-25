/**
 * @fileoverview Gallery Marker Higher-Order Component
 *
 * 갤러리 관련 컴포넌트들을 표준화된 방식으로 마킹하여
 * 중복 이벤트 처리와 클릭 오동작을 방지하는 HOC입니다.
 *
 * @module GalleryMarker
 * @version 1.0.0
 */

import { logger } from '@shared/logging/logger';
import type { ComponentChildren, ComponentType } from '../../types/app.types';
import { getPreact } from '@shared/external/vendors';
import type { VNode } from '@shared/external/vendors';

/**
 * 갤러리 마킹 옵션
 */
export interface GalleryMarkerOptions {
  /** 갤러리 타입 (컨테이너, 아이템, 컨트롤 등) */
  readonly type: 'container' | 'item' | 'controls' | 'overlay' | 'viewer' | 'control';
  /** 추가 클래스명 */
  readonly className?: string;
  /** 클릭 이벤트 차단 여부 */
  readonly preventClick?: boolean;
  /** 키보드 이벤트 차단 여부 */
  readonly preventKeyboard?: boolean;
  /** 커스텀 데이터 속성 */
  readonly customData?: Record<string, string>;
}

/**
 * 기본 마킹 옵션
 */
const DEFAULT_MARKER_OPTIONS: Required<Omit<GalleryMarkerOptions, 'type'>> = {
  className: '',
  preventClick: true,
  preventKeyboard: false,
  customData: {},
} as const;

/**
 * 갤러리 컴포넌트 프롭스 인터페이스
 */
export interface GalleryComponentProps {
  children?: ComponentChildren;
  className?: string;
  onClick?: (event: MouseEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  [key: string]: unknown;
}

/**
 * Gallery Marker HOC
 *
 * 갤러리 컴포넌트에 공통 마킹 기능을 제공하는 Higher-Order Component입니다.
 * 일관된 클래스명, 이벤트 처리, 접근성 기능을 자동으로 추가합니다.
 *
 * @example
 * ```tsx
 * const MarkedButton = withGalleryMarker(Button, {
 *   type: 'item',
 *   className: 'gallery-item',
 *   preventClick: true
 * });
 * ```
 */
export function withGalleryMarker<P extends GalleryComponentProps>(
  Component: ComponentType<P>,
  options: GalleryMarkerOptions
): ComponentType<P> {
  const markerOptions = { ...DEFAULT_MARKER_OPTIONS, ...options };

  const MarkedComponent = (props: P): VNode | null => {
    const { createElement } = getPreact();

    // 마킹 데이터 속성 생성
    const markerAttributes = createMarkerAttributes(markerOptions);

    // 클래스명 결합
    const combinedClassName = combineClassNames(props.className, markerOptions.className);

    // 이벤트 핸들러 생성
    const eventHandlers = createEventHandlers(props, markerOptions);

    // 최종 프롭스 생성
    const finalProps = {
      ...props,
      ...markerAttributes,
      ...eventHandlers,
      className: combinedClassName,
    };

    logger.debug(`Rendering marked gallery component: ${markerOptions.type}`, markerAttributes);

    // Preact createElement를 사용하여 안전하게 렌더링
    return createElement(Component, finalProps) as unknown as VNode;
  };

  // 디버깅을 위한 컴포넌트 이름 설정
  const componentName =
    (Component as { displayName?: string; name?: string }).displayName ??
    (Component as { displayName?: string; name?: string }).name ??
    'Component';
  (MarkedComponent as { displayName?: string }).displayName = `withGalleryMarker(${componentName})`;

  return MarkedComponent;
}

/**
 * 마킹 데이터 속성 생성
 */
function createMarkerAttributes(options: Required<GalleryMarkerOptions>): Record<string, string> {
  const attributes: Record<string, string> = {
    'data-xeg-gallery': options.type,
    'data-xeg-gallery-type': options.type,
  };

  // 커스텀 데이터 속성 추가
  for (const [key, value] of Object.entries(options.customData)) {
    attributes[`data-xeg-${key}`] = value;
  }

  // 이벤트 차단 정보 추가
  if (options.preventClick) {
    attributes['data-xeg-prevent-click'] = 'true';
  }

  if (options.preventKeyboard) {
    attributes['data-xeg-prevent-keyboard'] = 'true';
  }

  return attributes;
}

/**
 * 클래스명 결합
 */
function combineClassNames(existingClassName?: string, additionalClassName?: string): string {
  const classNames = [
    'xeg-gallery',
    `xeg-gallery-${additionalClassName ? additionalClassName.split(' ')[0] : 'component'}`,
    existingClassName,
    additionalClassName,
  ].filter(Boolean);

  return classNames.join(' ');
}

/**
 * 이벤트 핸들러 생성
 */
function createEventHandlers<P extends GalleryComponentProps>(
  props: P,
  options: Required<GalleryMarkerOptions>
): Partial<GalleryComponentProps> {
  const handlers: Partial<GalleryComponentProps> = {};

  // 클릭 이벤트 핸들러
  if (options.preventClick) {
    handlers.onClick = (event: MouseEvent): void => {
      logger.debug('Gallery component click intercepted:', options.type);

      // 기존 핸들러가 있다면 호출
      if (props.onClick) {
        props.onClick(event);
      }

      // 이벤트 전파 중단
      event.stopPropagation();
      event.preventDefault();
    };
  }

  // 키보드 이벤트 핸들러
  if (options.preventKeyboard) {
    handlers.onKeyDown = (event: KeyboardEvent): void => {
      logger.debug('Gallery component keyboard event intercepted:', options.type);

      // 기존 핸들러가 있다면 호출
      if (props.onKeyDown) {
        props.onKeyDown(event);
      }

      // 특정 키만 차단 (스페이스, 엔터 등)
      if (event.key === ' ' || event.key === 'Enter') {
        event.stopPropagation();
        event.preventDefault();
      }
    };
  }

  return handlers;
}

/**
 * 특정 타입의 갤러리 마커 생성 유틸리티 함수들
 */

/**
 * 갤러리 컨테이너 마커
 */
export function withGalleryContainer<P extends GalleryComponentProps>(
  Component: ComponentType<P>,
  additionalOptions: Partial<GalleryMarkerOptions> = {}
): ComponentType<P> {
  return withGalleryMarker(Component, {
    type: 'container',
    className: 'container',
    preventClick: false, // 컨테이너는 일반적으로 클릭을 허용
    ...additionalOptions,
  });
}

/**
 * 갤러리 아이템 마커
 */
export function withGalleryItem<P extends GalleryComponentProps>(
  Component: ComponentType<P>,
  additionalOptions: Partial<GalleryMarkerOptions> = {}
): ComponentType<P> {
  return withGalleryMarker(Component, {
    type: 'item',
    className: 'item',
    preventClick: true, // 아이템은 클릭 이벤트 차단
    ...additionalOptions,
  });
}

/**
 * 갤러리 컨트롤 마커
 *
 * @param Component - 래핑할 컨트롤 컴포넌트
 * @param additionalOptions - 추가 옵션
 * @returns 갤러리 컨트롤로 마킹된 컴포넌트
 */
export function withGalleryControl<P extends GalleryComponentProps>(
  Component: ComponentType<P>,
  additionalOptions: Partial<GalleryMarkerOptions> = {}
): ComponentType<P> {
  return withGalleryMarker(Component, {
    type: 'control',
    className: 'control',
    preventClick: false,
    preventKeyboard: false,
    ...additionalOptions,
  });
}

/**
 * DOM 요소가 갤러리 마킹된 요소인지 확인
 */
export function isGalleryMarkedElement(element: Element): boolean {
  return element.hasAttribute('data-xeg-gallery');
}

/**
 * DOM 요소의 갤러리 타입 반환
 */
export function getGalleryElementType(element: Element): string | null {
  return element.getAttribute('data-xeg-gallery-type');
}

/**
 * DOM 요소가 특정 갤러리 타입인지 확인
 */
export function isGalleryElementType(element: Element, type: string): boolean {
  return element.getAttribute('data-xeg-gallery-type') === type;
}

/**
 * 클릭 이벤트가 갤러리 마킹된 요소에서 발생했는지 확인
 */
export function isClickOnGalleryElement(event: Event): boolean {
  const target = event.target as Element | null;
  if (!target) {
    return false;
  }

  // 클릭된 요소나 부모 요소 중에 갤러리 마킹이 있는지 확인
  return target.closest('[data-xeg-gallery]') !== null;
}

/**
 * 이벤트가 차단되어야 하는 갤러리 요소에서 발생했는지 확인
 */
export function shouldPreventGalleryEvent(event: Event, eventType: 'click' | 'keyboard'): boolean {
  const target = event.target as Element | null;
  if (!target) {
    return false;
  }

  const galleryElement = target.closest('[data-xeg-gallery]');
  if (!galleryElement) {
    return false;
  }

  const preventAttribute = `data-xeg-prevent-${eventType}`;
  return galleryElement.getAttribute(preventAttribute) === 'true';
}
