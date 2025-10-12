/**
 * useFocusTrap Hook
 * @description 통합 유틸(@shared/utils/focusTrap) 위임 기반의 포커스 트랩 훅
 * @version 3.0.0 - Implementation unified (util-delegation)
 */

import { getSolid } from '../external/vendors';
import {
  createFocusTrap,
  type FocusTrap as FocusTrapUtil,
  type FocusTrapOptions as UtilOptions,
} from '../utils/focusTrap';

export interface FocusTrapOptions extends UtilOptions {
  previousFocusElement?: HTMLElement | null;
  previousFocusSelector?: string | null;
}

export interface FocusTrapResult {
  /** Focus trap 활성 상태 */
  isActive: boolean;
  /** Focus trap 활성화 */
  activate: () => void;
  /** Focus trap 비활성화 */
  deactivate: () => void;
}

type RefLike = { current: HTMLElement | null } | null;
type Accessor<T> = () => T;
type MaybeAccessor<T> = T | Accessor<T>;

function isRefLike(value: unknown): value is { current: HTMLElement | null } {
  if (typeof value !== 'object' || value === null) return false;
  return Object.prototype.hasOwnProperty.call(value as Record<string, unknown>, 'current');
}

function resolveElement(candidate: RefLike | HTMLElement | null): HTMLElement | null {
  if (!candidate) return null;
  if (isRefLike(candidate)) {
    return candidate.current;
  }
  return candidate as HTMLElement | null;
}

export function useFocusTrap(
  containerOrRef: MaybeAccessor<RefLike | HTMLElement | null>,
  isActiveInput: MaybeAccessor<boolean>,
  options: FocusTrapOptions = {}
): FocusTrapResult {
  const { createEffect, onCleanup } = getSolid();

  const resolveContainer: Accessor<RefLike | HTMLElement | null> =
    typeof containerOrRef === 'function'
      ? (containerOrRef as Accessor<RefLike | HTMLElement | null>)
      : () => containerOrRef;
  const resolveIsActive: Accessor<boolean> =
    typeof isActiveInput === 'function'
      ? (isActiveInput as Accessor<boolean>)
      : () => isActiveInput;
  let trap: FocusTrapUtil | null = null;
  let isActive = false;

  createEffect(() => {
    const element = resolveElement(resolveContainer());

    trap?.destroy();
    trap = null;
    isActive = false;

    if (!element) {
      return;
    }

    trap = createFocusTrap(element, options);
    if (resolveIsActive()) {
      trap.activate();
      isActive = true;
    }

    onCleanup(() => {
      try {
        trap?.destroy();
      } finally {
        trap = null;
        isActive = false;
      }
    });
  });

  // 활성 상태 변경 반영
  createEffect(() => {
    if (!trap) return;
    const active = resolveIsActive();
    if (active && !isActive) {
      trap.activate();
      isActive = true;
    } else if (!active && isActive) {
      trap.deactivate();
      isActive = false;
    }
  });

  return {
    get isActive() {
      return isActive;
    },
    activate: () => {
      if (!trap) return;
      trap.activate();
      isActive = true;
    },
    deactivate: () => {
      if (!trap) return;
      trap.deactivate();
      isActive = false;
    },
  } as FocusTrapResult;
}
