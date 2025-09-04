/**
 * @fileoverview useFocusTrap Hook (TDD Phase T4)
 * @description Modal에서 포커스를 가둬두는 훅
 */

import { useEffect, useRef } from 'preact/hooks';

export interface FocusTrapOptions {
  enabled: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
}

export function useFocusTrap(options: FocusTrapOptions) {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!options.enabled) return;

    const container = containerRef.current;
    if (!container) return;

    // 이전 활성 요소 저장
    if (options.restoreFocus !== false) {
      previousActiveElementRef.current = document.activeElement;
    }

    // Auto focus
    if (options.autoFocus !== false) {
      const firstFocusable = container.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    // Tab 키 핸들러
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          if (lastElement) {
            lastElement.focus();
          }
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          if (firstElement) {
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // 포커스 복원
      if (options.restoreFocus !== false && previousActiveElementRef.current) {
        (previousActiveElementRef.current as HTMLElement).focus?.();
      }
    };
  }, [options.enabled, options.autoFocus, options.restoreFocus]);

  return {
    containerRef,
  };
}
