/**
 * useFocusTrap Hook
 * @description 통합 유틸(@shared/utils/focusTrap) 위임 기반의 포커스 트랩 훅
 * @version 3.0.0 - Implementation unified (util-delegation)
 */

import { getPreactHooks } from '../external/vendors';
import {
  createFocusTrap,
  type FocusTrap as FocusTrapUtil,
  type FocusTrapOptions as UtilOptions,
} from '../utils/focusTrap';

export interface FocusTrapOptions extends UtilOptions {}

export interface FocusTrapResult {
  /** Focus trap 활성 상태 */
  isActive: boolean;
  /** Focus trap 활성화 */
  activate: () => void;
  /** Focus trap 비활성화 */
  deactivate: () => void;
}

type RefLike = { current: HTMLElement | null } | null;

function isRefLike(v: unknown): v is { current: HTMLElement | null } {
  if (typeof v !== 'object' || v === null) return false;
  const rec = v as Record<string, unknown>;
  return Object.prototype.hasOwnProperty.call(rec, 'current');
}

function toRef(input: RefLike | HTMLElement | null): { current: HTMLElement | null } {
  if (!input) return { current: null };
  if (isRefLike(input)) return input;
  return { current: input as HTMLElement };
}

export function useFocusTrap(
  containerOrRef: RefLike | HTMLElement | null,
  isActive: boolean,
  options: FocusTrapOptions = {}
): FocusTrapResult {
  const { useLayoutEffect, useMemo, useRef } = getPreactHooks();

  const ref = useMemo(() => toRef(containerOrRef), [containerOrRef]);
  const trapRef = useRef<FocusTrapUtil | null>(null);
  const activeRef = useRef<boolean>(false);

  // 컨테이너 변경 시 trap 인스턴스 생성/정리
  useLayoutEffect(() => {
    const el = ref.current;
    // 기존 파기
    trapRef.current?.destroy();
    trapRef.current = null;
    activeRef.current = false;

    if (!el) return;
    trapRef.current = createFocusTrap(el, options);
    if (isActive) {
      trapRef.current.activate();
      activeRef.current = true;
    }
    return () => {
      try {
        trapRef.current?.destroy();
      } finally {
        trapRef.current = null;
        activeRef.current = false;
      }
    };
  }, [ref, options, isActive]);

  // 활성 상태 변경 반영
  useLayoutEffect(() => {
    const trap = trapRef.current;
    if (!trap) return;
    if (isActive && !activeRef.current) {
      trap.activate();
      activeRef.current = true;
    } else if (!isActive && activeRef.current) {
      trap.deactivate();
      activeRef.current = false;
    }
  }, [isActive]);

  return {
    get isActive() {
      return activeRef.current;
    },
    activate: () => {
      const trap = trapRef.current;
      if (!trap) return;
      trap.activate();
      activeRef.current = true;
    },
    deactivate: () => {
      const trap = trapRef.current;
      if (!trap) return;
      trap.deactivate();
      activeRef.current = false;
    },
  } as FocusTrapResult;
}
