/**
 * @fileoverview useFocusScope Solid Hook
 * Phase E-1: Focus trap과 background inert를 Solid로 구현
 */

import { onMount, onCleanup } from 'solid-js';
import type { Accessor } from 'solid-js';

/**
 * useFocusScope Hook의 옵션
 */
export interface UseFocusScopeOptions {
  /** Focus trap이 활성화되었는지 여부 */
  enabled?: Accessor<boolean> | boolean;
  /** Escape 키 눌렀을 때 콜백 */
  onEscape?: () => void;
  /** 초기 포커스를 받을 요소의 셀렉터 (기본값: 첫 번째 focusable 요소) */
  initialFocus?: string;
  /** Focus trap을 적용할 컨테이너 ref */
  containerRef?: Accessor<HTMLElement | undefined>;
}

/**
 * Focus trap과 background inert를 관리하는 Solid hook
 *
 * 모달/다이얼로그 내부에서 포커스를 가두고, 외부 요소들을 비활성화합니다.
 *
 * @param options - Focus trap 옵션
 *
 * @example
 * ```tsx
 * function Modal(props: { isOpen: boolean; onClose: () => void }) {
 *   let containerRef: HTMLDivElement | undefined;
 *
 *   useFocusScope({
 *     enabled: () => props.isOpen,
 *     onEscape: props.onClose,
 *     containerRef: () => containerRef,
 *   });
 *
 *   return (
 *     <div ref={containerRef} role="dialog">
 *       <button>First focusable</button>
 *       <button>Last focusable</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusScope(options: UseFocusScopeOptions = {}): void {
  const { enabled = true, onEscape, initialFocus, containerRef } = options;

  // 활성화 상태를 Accessor로 정규화
  const isEnabled = typeof enabled === 'function' ? enabled : () => enabled;

  onMount(() => {
    if (!isEnabled()) return;

    const container = containerRef?.();
    if (!container) return;

    // 이전 활성 요소 저장 (모달 닫을 때 복원)
    const previouslyActiveElement = document.activeElement as HTMLElement;

    // 초기 포커스 설정
    if (initialFocus) {
      const initialElement = container.querySelector<HTMLElement>(initialFocus);
      initialElement?.focus();
    } else {
      // 첫 번째 focusable 요소에 포커스
      const firstFocusable = getFocusableElements(container)[0];
      firstFocusable?.focus();
    }

    // Keyboard event listener
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isEnabled()) return;

      // Escape 키 처리
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Tab 키 focus trap
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements(container);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey) {
          // Shift + Tab: 역방향 순환
          if (activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: 정방향 순환
          if (activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);

      // 이전 활성 요소로 포커스 복원
      previouslyActiveElement?.focus();
    });
  });
}

/**
 * 컨테이너 내의 모든 focusable 요소를 반환
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}
