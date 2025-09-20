/**
 * useFocusTrap Hook
 * @description 모달 컴포넌트의 키보드 접근성을 위한 focus trap 훅
 * @version 2.0.0 - P4: Focus Trap 리팩토링
 */

import { getPreactHooks } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';

export interface FocusTrapOptions {
  /** Escape 키 핸들러 */
  onEscape?: () => void;
  /** 초기 포커스 요소 선택자 */
  initialFocus?: string;
  /** 포커스 복원 여부 */
  restoreFocus?: boolean;
  /** 활성화 직전의 포커스 요소 힌트(렌더 타이밍에서 캡처) */
  previousFocusElement?: HTMLElement | null;
  /** 활성화 직전 포커스 요소를 재조회하기 위한 선택자 힌트 */
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

// 전역 이벤트 리스너는 import 부작용을 유발하므로 사용하지 않는다.

/**
 * Focusable 요소 선택자
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

/**
 * Focus Trap Hook
 * @param container 포커스를 제한할 컨테이너 요소
 * @param isActive 활성화 상태
 * @param options 추가 옵션
 * @returns FocusTrapResult
 */
export function useFocusTrap(
  containerRef: { current: HTMLElement | null } | null,
  isActive: boolean,
  options: FocusTrapOptions = {}
): FocusTrapResult {
  const { useLayoutEffect, useCallback, useRef } = getPreactHooks();
  const { onEscape, initialFocus, restoreFocus = true } = options;
  const { previousFocusElement, previousFocusSelector } = options;
  const isTest =
    typeof process !== 'undefined' && typeof process.env !== 'undefined'
      ? process.env.NODE_ENV === 'test'
      : false;

  const previousActiveElement = useRef<Element | null>(null);
  const previousActiveSelector = useRef<string | null>(null);
  const isActiveRef = useRef(false);
  const focusTimerRef = useRef<number | null>(null);
  const restoreTimersRef = useRef<number[]>([]);

  const clearRestoreTimers = () => {
    const arr = restoreTimersRef.current;
    while (arr.length) {
      const id = arr.pop();
      if (id) {
        try {
          clearTimeout(id);
        } catch {
          /* no-op */
        }
      }
    }
  };

  const resolveRestoreTarget = () => {
    let el = (previousActiveElement.current as HTMLElement | null) || null;
    if (!el?.isConnected) {
      if (previousActiveSelector.current) {
        const re = document.querySelector(previousActiveSelector.current) as HTMLElement | null;
        if (re) previousActiveElement.current = re;
        el = re || el;
      }
    }
    if (!el?.isConnected && previousFocusElement?.isConnected) {
      el = previousFocusElement;
    }
    return el || null;
  };

  const focusSafely = (el: HTMLElement | null | undefined) => {
    if (!el) return;
    try {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    } catch {
      /* no-op */
    }
    try {
      el.focus?.();
      try {
        el.setAttribute?.('data-xeg-focused', '1');
      } catch {
        /* no-op */
      }
    } catch {
      /* no-op */
    }
  };

  /**
   * 컨테이너 내 focusable 요소들 조회
   */
  const getContainer = () => containerRef?.current || null;

  const getFocusableElements = useCallback((): HTMLElement[] => {
    const container = getContainer();
    if (!container) return [];

    const elements = container.querySelectorAll(FOCUSABLE_SELECTORS);
    // jsdom 환경에서는 layout 계산이 없으므로 offsetWidth/Height가 0일 수 있다.
    // 접근성/테스트 안정성을 위해 필터링을 완화하고 존재 여부만 확인한다.
    return Array.from(elements).filter((el): el is HTMLElement => el instanceof HTMLElement);
  }, []);

  /**
   * 첫 번째 focusable 요소로 포커스 이동
   */
  const focusFirstElement = useCallback(() => {
    const container = getContainer();
    if (!container) return;

    let elementToFocus: HTMLElement | null = null;

    if (initialFocus) {
      elementToFocus = container.querySelector(initialFocus);
    }

    if (!elementToFocus) {
      const focusableElements = getFocusableElements();
      elementToFocus = focusableElements[0] || null;
    }

    if (elementToFocus) {
      elementToFocus.focus();
      try {
        elementToFocus.setAttribute('data-xeg-focused', '1');
      } catch {
        /* no-op */
      }
    }
  }, [initialFocus, getFocusableElements]);

  /**
   * Tab 키 핸들러
   */
  const handleTabKey = useCallback(
    (event: KeyboardEvent) => {
      const container = getContainer();
      if (!container || event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentElement = document.activeElement;

      if (event.shiftKey) {
        // Shift + Tab (이전 요소로)
        if (currentElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab (다음 요소로)
        if (currentElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [getFocusableElements]
  );

  /**
   * 키보드 이벤트 핸들러
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActiveRef.current) return;

      switch (event.key) {
        case 'Tab':
          handleTabKey(event);
          break;
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            if (isTest) {
              logger.debug('[FT] Escape pressed, attempting restore before onEscape');
            }
            // 닫히기 전에 먼저 이전 포커스 대상으로 동기 복원 시도
            try {
              focusSafely(resolveRestoreTarget());
            } catch {
              /* no-op */
            }
            onEscape();
            // 일부 환경(jsdom)에서 비활성화 훅 타이밍 전에 포커스 복원이 필요할 수 있음
            const attempts = [0, 10, 20, 50, 100, 250, 500, 800, 900];
            attempts.forEach(ms => {
              const id = setTimeout(() => {
                try {
                  if (isTest) {
                    logger.debug(`[FT] retry ${ms}ms resolve+focus`);
                  }
                  const el = resolveRestoreTarget();
                  el?.focus?.();
                } catch {
                  /* no-op */
                }
              }, ms) as unknown as number;
              restoreTimersRef.current.push(id);
            });
          }
          break;
      }
    },
    [handleTabKey, onEscape]
  );

  /**
   * Focus trap 활성화
   */
  const activate = useCallback(() => {
    const container = getContainer();
    if (!container || isActiveRef.current) return;

    // 현재 포커스된 요소 저장 (body면 마지막 포커스 요소로 대체)
    const active = document.activeElement as Element | null;
    // 우선 순위: 옵션으로 전달된 previousFocusElement → 현재 activeElement
    let candidate: Element | null = previousFocusElement || active;
    if (candidate && candidate instanceof HTMLElement && candidate.tagName === 'BODY') {
      candidate = null;
    }
    previousActiveElement.current = candidate;
    // 선택자 힌트가 없으면 candidate로부터 유도
    if (!previousFocusSelector) {
      if (candidate && candidate instanceof HTMLElement) {
        const id = candidate.getAttribute('id');
        previousActiveSelector.current = id ? `#${id}` : null;
        if (!previousActiveSelector.current) {
          const aria = candidate.getAttribute('aria-label');
          previousActiveSelector.current = aria ? `[aria-label="${aria}"]` : null;
        }
      } else {
        previousActiveSelector.current = null;
      }
    } else {
      previousActiveSelector.current = previousFocusSelector;
    }

    // 키보드 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown, true);

    // 첫 번째 요소로 포커스 이동 (paint 이후 안전하게)
    const tid = window.setTimeout(() => {
      try {
        focusFirstElement();
      } catch {
        // ignore focus errors in test env
      }
    }, 0);
    focusTimerRef.current = tid as unknown as number;

    isActiveRef.current = true;
  }, [handleKeyDown, focusFirstElement]);

  /**
   * Focus trap 비활성화
   */
  const deactivate = useCallback(() => {
    if (!isActiveRef.current) return;

    // 키보드 이벤트 리스너 제거
    document.removeEventListener('keydown', handleKeyDown, true);

    // 지연 포커스 타이머 정리
    const tid = focusTimerRef.current;
    if (typeof tid === 'number' && tid) {
      try {
        clearTimeout(tid);
      } catch {
        /* no-op */
      }
      focusTimerRef.current = null;
    }
    clearRestoreTimers();

    // Restore previous focus (for JSDOM stability, delay after paint and retry once)
    if (
      restoreFocus &&
      (previousActiveElement.current || previousActiveSelector.current || previousFocusElement)
    ) {
      // 즉시 한 번 시도
      try {
        focusSafely(resolveRestoreTarget());
      } catch {
        /* no-op */
      }
      const attempts = [0, 10, 20, 50, 100, 250, 500, 800, 900];
      attempts.forEach(ms => {
        const id = setTimeout(() => {
          try {
            focusSafely(resolveRestoreTarget());
          } catch {
            /* no-op */
          }
        }, ms) as unknown as number;
        restoreTimersRef.current.push(id);
      });
    }

    isActiveRef.current = false;
  }, [handleKeyDown, restoreFocus]);

  /**
   * isActive 상태 변경 감지
   */
  useLayoutEffect(() => {
    if (isActive) {
      activate();
    } else {
      deactivate();
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      clearRestoreTimers();
      deactivate();
    };
  }, [isActive, activate, deactivate]);

  return {
    isActive: isActiveRef.current,
    activate,
    deactivate,
  };
}
