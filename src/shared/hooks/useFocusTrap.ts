/**
 * useFocusTrap Hook
 * @description 모달 컴포넌트의 키보드 접근성을 위한 focus trap 훅
 * @version 2.0.0 - P4: Focus Trap 리팩토링
 */

import { getPreactHooks } from '@shared/external/vendors';

export interface FocusTrapOptions {
  /** Escape 키 핸들러 */
  onEscape?: () => void;
  /** 초기 포커스 요소 선택자 */
  initialFocus?: string;
  /** 포커스 복원 여부 */
  restoreFocus?: boolean;
}

export interface FocusTrapResult {
  /** Focus trap 활성 상태 */
  isActive: boolean;
  /** Focus trap 활성화 */
  activate: () => void;
  /** Focus trap 비활성화 */
  deactivate: () => void;
}

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
  container: HTMLElement | null,
  isActive: boolean,
  options: FocusTrapOptions = {}
): FocusTrapResult {
  const { useEffect, useCallback, useRef } = getPreactHooks();
  const { onEscape, initialFocus, restoreFocus = true } = options;

  const previousActiveElement = useRef<Element | null>(null);
  const isActiveRef = useRef(false);

  /**
   * 컨테이너 내 focusable 요소들 조회
   */
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!container) return [];

    const elements = container.querySelectorAll(FOCUSABLE_SELECTORS);
    return Array.from(elements).filter((el): el is HTMLElement => {
      return (
        el instanceof HTMLElement &&
        el.offsetWidth > 0 &&
        el.offsetHeight > 0 &&
        !el.hasAttribute('hidden')
      );
    });
  }, [container]);

  /**
   * 첫 번째 focusable 요소로 포커스 이동
   */
  const focusFirstElement = useCallback(() => {
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
    }
  }, [container, initialFocus, getFocusableElements]);

  /**
   * Tab 키 핸들러
   */
  const handleTabKey = useCallback(
    (event: KeyboardEvent) => {
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
    [container, getFocusableElements]
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
            onEscape();
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
    if (!container || isActiveRef.current) return;

    // 현재 포커스된 요소 저장
    previousActiveElement.current = document.activeElement;

    // 키보드 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown, true);

    // 첫 번째 요소로 포커스 이동
    focusFirstElement();

    isActiveRef.current = true;
  }, [container, handleKeyDown, focusFirstElement]);

  /**
   * Focus trap 비활성화
   */
  const deactivate = useCallback(() => {
    if (!isActiveRef.current) return;

    // 키보드 이벤트 리스너 제거
    document.removeEventListener('keydown', handleKeyDown, true);

    // 이전 포커스 복원
    if (restoreFocus && previousActiveElement.current) {
      const elementToRestore = previousActiveElement.current as HTMLElement;
      if (elementToRestore.focus) {
        elementToRestore.focus();
      }
    }

    isActiveRef.current = false;
  }, [handleKeyDown, restoreFocus]);

  /**
   * isActive 상태 변경 감지
   */
  useEffect(() => {
    if (isActive) {
      activate();
    } else {
      deactivate();
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      deactivate();
    };
  }, [isActive, activate, deactivate]);

  return {
    isActive: isActiveRef.current,
    activate,
    deactivate,
  };
}
