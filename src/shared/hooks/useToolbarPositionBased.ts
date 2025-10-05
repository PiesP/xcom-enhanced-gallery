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
  /** 초기 표시 후 자동으로 숨기기까지의 시간(ms). 0이면 자동 숨김 비활성화. 기본값: 5000ms */
  readonly initialAutoHideDelay?: number;
  /** 자동 숨김을 일시 중지할지 여부 (예: 설정 모달 열림 시). true이면 자동 숨김 타이머가 시작되지 않음. */
  readonly pauseAutoHide?: MaybeAccessor<boolean | undefined>;
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
  // 타이머 ID는 reactive하지 않아야 함 (무한 루프 방지)
  let autoHideTimerId: number | null = null;

  const resolvedVisibility = createMemo<boolean>(() => {
    if (!enabledMemo()) {
      return false;
    }
    return visibilityIntent();
  });

  const clearAutoHideTimer = () => {
    if (autoHideTimerId !== null) {
      clearTimeout(autoHideTimerId);
      autoHideTimerId = null;
    }
  };

  const setVisibility = (next: boolean) => {
    setVisibilityIntent(prev => (prev === next ? prev : next));
  };

  const show = () => {
    clearAutoHideTimer(); // show() 호출 시 타이머 취소
    setVisibility(true);
  };

  const hide = () => {
    clearAutoHideTimer(); // hide() 호출 시 타이머 취소
    setVisibility(false);
  };

  createEffect(() => {
    const visible = resolvedVisibility();
    const toolbarElement = toolbarMemo();
    applyDocumentTokens(visible);
    applyToolbarInlineStyle(toolbarElement, visible);
  });

  // pauseAutoHide를 memo로 래핑
  const pauseAutoHideMemo = createMemo<boolean>(() => {
    const resolved = resolveMaybeAccessor(options.pauseAutoHide);
    if (typeof resolved === 'boolean') {
      return resolved;
    }
    return false; // undefined이면 기본값 false (자동 숨김 활성화)
  });

  // 초기 자동 숨김 타이머 설정 (한 번만 실행되도록 의존성 최소화)
  createEffect(() => {
    const enabled = enabledMemo();
    const toolbar = toolbarMemo(); // toolbar가 준비될 때까지 대기
    const delay = options.initialAutoHideDelay ?? 5000; // 기본값 5초
    const paused = pauseAutoHideMemo(); // pauseAutoHide 상태 확인

    // 기존 타이머 정리
    clearAutoHideTimer();

    // paused 상태가 변경될 때 즉시 visibility 업데이트
    if (paused) {
      // paused=true이면 툴바를 표시
      show();
    } else if (enabled && toolbar && delay > 0) {
      // enabled이고, paused가 아니며, toolbar가 존재하고, delay가 0보다 크면 자동 숨김 활성화
      // 새 타이머 시작
      autoHideTimerId = setTimeout(() => {
        hide();
      }, delay) as unknown as number;
    }

    onCleanup(() => {
      clearAutoHideTimer();
    });
  });

  createEffect(() => {
    const enabled = enabledMemo();
    const hoverZone = hoverZoneMemo();
    const toolbar = toolbarMemo();

    const attachments: Array<[HTMLElement, string, EventListener]> = [];

    if (enabled) {
      const handleShow: EventListener = () => {
        show(); // show()는 타이머를 취소함
      };
      const handleHide: EventListener = () => {
        hide(); // hover 이탈 시 즉시 숨김
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

  // 키보드 네비게이션 (PC 전용 입력 정책)
  // Sub-Epic 3: TOOLBAR-HOVER-EXPANSION
  createEffect(() => {
    const enabled = enabledMemo();

    // Guard: document 또는 addEventListener 미존재 시 early return
    if (
      !enabled ||
      typeof document === 'undefined' ||
      typeof document.addEventListener !== 'function'
    ) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape 키로 툴바 토글
      // 갤러리 닫기와 충돌 방지: toolbar가 표시 중일 때만 이벤트 전파 중단
      if (event.key === 'Escape') {
        const currentVisibility = resolvedVisibility();
        if (currentVisibility) {
          // 툴바가 보이면 숨김
          hide();
          event.stopPropagation(); // 갤러리 닫기 이벤트 전파 방지
        } else {
          // 툴바가 숨겨져 있으면 표시
          show();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
      if (typeof document.removeEventListener === 'function') {
        document.removeEventListener('keydown', handleKeyDown);
      }
    });
  });

  onCleanup(() => {
    // Solid 컴포넌트 언마운트 시 마지막으로 적용된 CSS 토큰을 정리하여 일관성 유지
    clearAutoHideTimer();
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
