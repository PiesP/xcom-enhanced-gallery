/**
 * @fileoverview 갤러리 HOC 시스템
 * @description 갤러리 컴포넌트를 위한 고차 컴포넌트 (Phase 2-3B: 통합 완료)
 * @version 3.0.0 - GalleryMarker 기능 통합
 */

import { logger } from '../../logging/logger';
import type { ComponentType } from '../../types/app.types';
import { getPreact } from '../../external/vendors';
import type { VNode } from '../../external/vendors';
import type { GalleryComponentProps as BaseGalleryComponentProps } from '../base/BaseComponentProps';

/**
 * 갤러리 마킹 타입
 */
export type GalleryType = 'container' | 'item' | 'control' | 'overlay' | 'viewer';

/**
 * 갤러리 HOC 옵션
 */
export interface GalleryOptions {
  /** 갤러리 타입 */
  readonly type: GalleryType;
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
 * 갤러리 컴포넌트 Props (통합된 인터페이스)
 */
export interface GalleryComponentProps extends BaseGalleryComponentProps {
  /** 마우스 이벤트 핸들러들 */
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
}

/**
 * 타입별 기본 옵션
 */
const TYPE_DEFAULTS: Record<GalleryType, Partial<GalleryOptions>> = {
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
 * 갤러리 HOC
 *
 * @description
 * 모든 갤러리 관련 컴포넌트에 대한 HOC입니다.
 * - 일관된 마킹 시스템
 * - 타입별 최적화된 기본값
 * - 향상된 이벤트 처리
 * - 트위터 네이티브 갤러리 차단
 * - 접근성 지원
 *
 * @example
 * ```tsx
 * const GalleryButton = withGallery(Button, {
 *   type: 'control',
 *   className: 'download-btn'
 * });
 * ```
 */
export function withGallery<P extends GalleryComponentProps>(
  Component: ComponentType<P>,
  options: GalleryOptions
): ComponentType<P> {
  // 타입별 기본값과 사용자 옵션 병합
  const mergedOptions = mergeOptionsWithDefaults(options);

  const GalleryComponent = (props: P): VNode | null => {
    const { createElement } = getPreact();

    // 마킹 속성 생성
    const markerAttributes = createMarkerAttributes(mergedOptions);

    // 클래스명 통합
    const className = createClassName(props.className, mergedOptions);

    // 이벤트 핸들러 생성
    const eventHandlers = createEventHandlers(props, mergedOptions);

    // 접근성 속성 생성
    const accessibilityAttributes = createAccessibilityAttributes(mergedOptions);

    // 최종 Props 구성
    const finalProps = {
      ...props,
      ...markerAttributes,
      ...eventHandlers,
      ...accessibilityAttributes,
      className,
    };

    logger.debug(`Rendering gallery component: ${mergedOptions.type}`, {
      type: mergedOptions.type,
      className,
      events: mergedOptions.events,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createElement(Component as any, finalProps) as unknown as VNode;
  };

  // 컴포넌트 이름 설정
  const componentName = getComponentName(Component);
  (GalleryComponent as { displayName?: string }).displayName = `withGallery(${componentName})`;

  return GalleryComponent;
}

/**
 * 옵션과 기본값 병합
 */
function mergeOptionsWithDefaults(options: GalleryOptions): Required<GalleryOptions> {
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
 * 마킹 속성 생성
 */
function createMarkerAttributes(options: Required<GalleryOptions>): Record<string, string> {
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
 * 클래스명 생성
 */
function createClassName(existingClassName?: string, options?: Required<GalleryOptions>): string {
  const classNames = [
    'xeg-gallery',
    `xeg-gallery-${options?.type}`,
    options?.className,
    existingClassName,
  ].filter(Boolean);

  return classNames.join(' ');
}

/**
 * 이벤트 핸들러 생성
 */
function createEventHandlers<P extends GalleryComponentProps>(
  props: P,
  options: Required<GalleryOptions>
): Partial<GalleryComponentProps> {
  const handlers: Partial<GalleryComponentProps> = {};

  // 클릭 이벤트 핸들러
  if (options.events.preventClick || options.events.blockTwitterNative) {
    handlers.onClick = (event: MouseEvent): void => {
      logger.debug(`Gallery click handler: ${options.type}`, {
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
      logger.debug(`Gallery keyboard handler: ${options.type}`);

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
  options: Required<GalleryOptions>
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
export function withGalleryContainer<P extends GalleryComponentProps>(
  Component: ComponentType<P>,
  additionalOptions: Partial<GalleryOptions> = {}
): ComponentType<P> {
  return withGallery(Component, {
    type: 'container',
    ...additionalOptions,
  });
}

/**
 * 갤러리 아이템 HOC
 */
export function withGalleryItem<P extends GalleryComponentProps>(
  Component: ComponentType<P>,
  additionalOptions: Partial<GalleryOptions> = {}
): ComponentType<P> {
  return withGallery(Component, {
    type: 'item',
    ...additionalOptions,
  });
}

/**
 * 갤러리 컨트롤 HOC
 */
export function withGalleryControl<P extends GalleryComponentProps>(
  Component: ComponentType<P>,
  additionalOptions: Partial<GalleryOptions> = {}
): ComponentType<P> {
  return withGallery(Component, {
    type: 'control',
    ...additionalOptions,
  });
}

/**
 * 갤러리 오버레이 HOC
 */
export function withGalleryOverlay<P extends GalleryComponentProps>(
  Component: ComponentType<P>,
  additionalOptions: Partial<GalleryOptions> = {}
): ComponentType<P> {
  return withGallery(Component, {
    type: 'overlay',
    ...additionalOptions,
  });
}

/**
 * 기본 갤러리 HOC (withGallery의 별칭)
 */
export const GalleryHOC = withGallery;

/**
 * 유틸리티 함수들
 */

/**
 * DOM 요소가 갤러리 요소인지 확인
 */
export function isGalleryElement(element: Element): boolean {
  return (
    element.hasAttribute('data-xeg-gallery') &&
    element.getAttribute('data-xeg-gallery-version') === '2.0'
  );
}

/**
 * DOM 요소의 갤러리 타입 반환
 */
export function getGalleryType(element: Element): GalleryType | null {
  const type = element.getAttribute('data-xeg-gallery-type');
  return type as GalleryType | null;
}

/**
 * 이벤트가 갤러리 요소에서 발생했는지 확인
 */
export function isEventFromGallery(event: Event): boolean {
  const target = event.target as Element | null;
  if (!target) return false;

  const galleryElement = target.closest('[data-xeg-gallery-version="2.0"]');
  return galleryElement !== null;
}

/**
 * Phase 3: HOC 시스템 통합 검증 유틸리티
 */
export function validateHOCIntegration(element: Element): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 기본 갤러리 마킹 검증
  if (!element.hasAttribute('data-xeg-gallery')) {
    errors.push('Missing required data-xeg-gallery attribute');
  }

  // 버전 검증
  const version = element.getAttribute('data-xeg-gallery-version');
  if (version !== '2.0') {
    if (!version) {
      errors.push('Missing data-xeg-gallery-version attribute');
    } else {
      warnings.push(`Outdated gallery version: ${version}. Expected: 2.0`);
    }
  }

  // 타입 검증
  const type = element.getAttribute('data-xeg-gallery-type');
  if (!type) {
    errors.push('Missing data-xeg-gallery-type attribute');
  } else if (!['container', 'item', 'control', 'overlay', 'viewer'].includes(type)) {
    errors.push(`Invalid gallery type: ${type}`);
  }

  // 접근성 검증
  const role = element.getAttribute('role');
  if (!role) {
    warnings.push('Missing role attribute for accessibility');
  }

  // 레거시 마커 검출
  if (element.hasAttribute('data-gallery-marker')) {
    warnings.push('Legacy gallery marker detected. Consider migrating to GalleryHOC');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Phase 3: HOC와 StandardProps 연동을 위한 Props 생성
 */
export function createHOCStandardProps<T extends GalleryComponentProps>(
  baseProps: T,
  hocOptions: GalleryOptions
): T & {
  'data-xeg-gallery': string;
  'data-xeg-gallery-type': string;
  'data-xeg-gallery-version': string;
  className: string;
} {
  // ComponentStandards 동적 import
  const { ComponentStandards } = require('../ui/StandardProps');

  // 마킹 속성 생성
  const markerAttributes = createMarkerAttributes(mergeOptionsWithDefaults(hocOptions));

  // 표준화된 클래스명 생성
  const standardClassName = ComponentStandards.createClassName(
    baseProps.className,
    hocOptions.className,
    `xeg-gallery-${hocOptions.type}`
  );

  // ARIA 속성 생성
  const ariaProps = ComponentStandards.createAriaProps(baseProps);

  return {
    ...baseProps,
    ...markerAttributes,
    ...ariaProps,
    className: standardClassName,
  } as T & {
    'data-xeg-gallery': string;
    'data-xeg-gallery-type': string;
    'data-xeg-gallery-version': string;
    className: string;
  };
}
