import { getSolid } from '../../../shared/external/vendors';
import { toolbarSlideDown, toolbarSlideUp } from '../../../shared/utils/animations';

export interface UseToolbarPositionBasedOptions {
  readonly toolbarElement: HTMLElement | null | undefined;
  readonly hoverZoneElement: HTMLElement | null | undefined;
  readonly enabled?: boolean;
  readonly initialAutoHideDelay?: number; // not used in minimal impl
}

export function useToolbarPositionBased(options: UseToolbarPositionBasedOptions): {
  isVisible: () => boolean;
  show: () => void;
  hide: () => void;
} {
  const { createEffect, onCleanup, useRef, createSignal } = getSolid();
  const enabled = options.enabled !== false;

  const [isVisible, setIsVisible] = createSignal<boolean>(enabled);
  const hoverEnterRef = useRef<((e?: Event) => void) | null>(null);
  const hoverLeaveRef = useRef<((e?: Event) => void) | null>(null);
  const toolbarEnterRef = useRef<((e?: Event) => void) | null>(null);
  const toolbarLeaveRef = useRef<((e?: Event) => void) | null>(null);

  const applyVisibility = (visible: boolean): void => {
    try {
      document.documentElement.style.setProperty('--toolbar-opacity', visible ? '1' : '0');
      document.documentElement.style.setProperty(
        '--toolbar-pointer-events',
        visible ? 'auto' : 'none'
      );
    } catch {
      // no-op in non-DOM environments
    }
  };

  const show = (): void => {
    setIsVisible(true);
    applyVisibility(true);
    // S2: 통일된 애니메이션 경로 사용 (가능할 때만)
    const el = options.toolbarElement ?? null;
    if (el) {
      // 비동기 호출 - 테스트 환경 안정성을 위해 결과는 기다리지 않음
      void toolbarSlideDown(el);
    }
  };

  const hide = (): void => {
    setIsVisible(false);
    applyVisibility(false);
    // S2: 통일된 애니메이션 경로 사용 (가능할 때만)
    const el = options.toolbarElement ?? null;
    if (el) {
      // 비동기 호출 - 테스트 환경 안정성을 위해 결과는 기다리지 않음
      void toolbarSlideUp(el);
    }
  };

  createEffect(() => {
    setIsVisible(enabled);
    applyVisibility(enabled);
  });

  createEffect(() => {
    const hoverEl = options.hoverZoneElement ?? null;
    const toolbarEl = options.toolbarElement ?? null;

    if (!enabled || (!hoverEl && !toolbarEl)) return;

    const onEnter = () => show();
    const onLeave = () => hide();

    hoverEnterRef.current = onEnter;
    hoverLeaveRef.current = onLeave;
    toolbarEnterRef.current = onEnter;
    toolbarLeaveRef.current = onLeave;

    hoverEl?.addEventListener('mouseenter', onEnter as EventListener);
    hoverEl?.addEventListener('mouseleave', onLeave as EventListener);
    toolbarEl?.addEventListener('mouseenter', onEnter as EventListener);
    toolbarEl?.addEventListener('mouseleave', onLeave as EventListener);

    onCleanup(() => {
      hoverEl?.removeEventListener('mouseenter', onEnter as EventListener);
      hoverEl?.removeEventListener('mouseleave', onLeave as EventListener);
      toolbarEl?.removeEventListener('mouseenter', onEnter as EventListener);
      toolbarEl?.removeEventListener('mouseleave', onLeave as EventListener);
    });
  });

  return { isVisible, show, hide };
}

export default useToolbarPositionBased;
