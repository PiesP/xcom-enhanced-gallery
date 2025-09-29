/**
 * @fileoverview 위치 기반 툴바 가시성 관리 훅 (Solid)
 * @description 호버 존/툴바 DOM 이벤트를 기반으로 CSS 토큰을 업데이트하며,
 *              PC 전용 입력 규칙을 준수합니다.
 */

import type { Accessor } from 'solid-js';

import { getSolidCore } from '@shared/external/vendors';

type MaybeAccessor<T> = T | Accessor<T>;

export interface UseToolbarPositionBasedOptions {
  readonly toolbarElement: MaybeAccessor<HTMLElement | null> | null;
  readonly hoverZoneElement: MaybeAccessor<HTMLElement | null> | null;
  readonly enabled?: MaybeAccessor<boolean | undefined>;
}

export interface UseToolbarPositionBasedResult {
  /** 현재 가시성 상태 (enabled를 고려한 최종 상태) */
  readonly isVisible: boolean;
  /** Solid 컴포넌트에서 직접 구독 가능한 accessor */
  readonly isVisibleAccessor: Accessor<boolean>;
  /** 수동으로 툴바를 표시 */
  show: () => void;
  /** 수동으로 툴바를 숨김 */
  hide: () => void;
}

const TOOLBAR_OPACITY_TOKEN = '--xeg-toolbar-opacity';
const TOOLBAR_POINTER_EVENTS_TOKEN = '--xeg-toolbar-pointer-events';

function resolveMaybeAccessor<T>(
  candidate: MaybeAccessor<T> | null | undefined
): T | null | undefined {
  if (typeof candidate === 'function') {
    return (candidate as Accessor<T>)();
  }
  return candidate;
}

function applyDocumentTokens(visible: boolean): void {
  const root = globalThis.document?.documentElement;
  const style = root?.style;
  if (!style || typeof style.setProperty !== 'function') {
    return;
  }
  style.setProperty(TOOLBAR_OPACITY_TOKEN, visible ? '1' : '0');
  style.setProperty(TOOLBAR_POINTER_EVENTS_TOKEN, visible ? 'auto' : 'none');
}

function applyToolbarInlineStyle(toolbar: HTMLElement | null, visible: boolean): void {
  const style = toolbar?.style;
  if (!style || typeof style.setProperty !== 'function') {
    return;
  }
  style.setProperty('opacity', visible ? '1' : '0');
  style.setProperty('pointer-events', visible ? 'auto' : 'none');
}

export function useToolbarPositionBased(
  options: UseToolbarPositionBasedOptions
): UseToolbarPositionBasedResult {
  const { createSignal, createMemo, createEffect, onCleanup } = getSolidCore();

  const enabledMemo = createMemo<boolean>(() => {
    const resolved = resolveMaybeAccessor(options.enabled);
    if (typeof resolved === 'boolean') {
      return resolved;
    }
    return true;
  });

  const toolbarMemo = createMemo<HTMLElement | null>(
    () => resolveMaybeAccessor(options.toolbarElement) ?? null
  );

  const hoverZoneMemo = createMemo<HTMLElement | null>(
    () => resolveMaybeAccessor(options.hoverZoneElement) ?? null
  );

  const [visibilityIntent, setVisibilityIntent] = createSignal<boolean>(true);

  const resolvedVisibility = createMemo<boolean>(() => {
    if (!enabledMemo()) {
      return false;
    }
    return visibilityIntent();
  });

  const setVisibility = (next: boolean) => {
    setVisibilityIntent(prev => (prev === next ? prev : next));
  };

  const show = () => {
    setVisibility(true);
  };

  const hide = () => {
    setVisibility(false);
  };

  createEffect(() => {
    const visible = resolvedVisibility();
    const toolbarElement = toolbarMemo();
    applyDocumentTokens(visible);
    applyToolbarInlineStyle(toolbarElement, visible);
  });

  createEffect(() => {
    const enabled = enabledMemo();
    const hoverZone = hoverZoneMemo();
    const toolbar = toolbarMemo();

    const attachments: Array<[HTMLElement, string, EventListener]> = [];

    if (enabled) {
      const handleShow: EventListener = () => {
        show();
      };
      const handleHide: EventListener = () => {
        hide();
      };

      if (hoverZone) {
        hoverZone.addEventListener('mouseenter', handleShow);
        hoverZone.addEventListener('mouseleave', handleHide);
        attachments.push([hoverZone, 'mouseenter', handleShow]);
        attachments.push([hoverZone, 'mouseleave', handleHide]);
      }

      if (toolbar) {
        toolbar.addEventListener('mouseenter', handleShow);
        toolbar.addEventListener('mouseleave', handleHide);
        attachments.push([toolbar, 'mouseenter', handleShow]);
        attachments.push([toolbar, 'mouseleave', handleHide]);
      }
    }

    if (!enabled) {
      hide();
    }

    onCleanup(() => {
      for (const [element, type, handler] of attachments) {
        element.removeEventListener(type, handler);
      }
    });
  });

  onCleanup(() => {
    // Solid 컴포넌트 언마운트 시 마지막으로 적용된 CSS 토큰을 정리하여 일관성 유지
    applyDocumentTokens(false);
    const toolbarElement = toolbarMemo();
    applyToolbarInlineStyle(toolbarElement, false);
  });

  return {
    get isVisible() {
      return resolvedVisibility();
    },
    isVisibleAccessor: resolvedVisibility,
    show,
    hide,
  };
}

export default useToolbarPositionBased;
