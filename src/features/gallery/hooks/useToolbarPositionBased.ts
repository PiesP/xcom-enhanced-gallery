import { getPreactHooks } from '../../../shared/external/vendors';

export interface UseToolbarPositionBasedOptions {
  readonly toolbarElement: HTMLElement | null | undefined;
  readonly hoverZoneElement: HTMLElement | null | undefined;
  readonly enabled?: boolean;
  readonly initialAutoHideDelay?: number; // not used in minimal impl
}

export function useToolbarPositionBased(options: UseToolbarPositionBasedOptions): {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
} {
  const { useEffect, useRef, useState } = getPreactHooks();
  const enabled = options.enabled !== false;

  const [isVisible, setIsVisible] = useState<boolean>(enabled);
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
  };

  const hide = (): void => {
    setIsVisible(false);
    applyVisibility(false);
  };

  useEffect(() => {
    // set initial visibility according to enabled
    setIsVisible(enabled);
    applyVisibility(enabled);
  }, [enabled]);

  useEffect(() => {
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

    return () => {
      hoverEl?.removeEventListener('mouseenter', onEnter as EventListener);
      hoverEl?.removeEventListener('mouseleave', onLeave as EventListener);
      toolbarEl?.removeEventListener('mouseenter', onEnter as EventListener);
      toolbarEl?.removeEventListener('mouseleave', onLeave as EventListener);
    };
  }, [options.hoverZoneElement, options.toolbarElement, enabled]);

  return { isVisible, show, hide };
}

export default useToolbarPositionBased;
