/**
 * @fileoverview Solid ModalShell component
 * @description FRAME-ALT-001 Stage D — Solid parity implementation for modal shell abstraction
 */

import type { JSX } from 'solid-js';

import { getSolidCore } from '@shared/external/vendors';
import { logger } from '@shared/logging';

export interface SolidModalShellProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /** 모달 콘텐츠 */
  children?: JSX.Element;
  /** 표시 여부 */
  isOpen: boolean;
  /** 닫기 핸들러 */
  onClose?: () => void;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 표면 변형 */
  surfaceVariant?: 'glass' | 'solid' | 'elevated';
  /** 백드롭 클릭으로 닫기 */
  closeOnBackdropClick?: boolean;
  /** ESC 키로 닫기 */
  closeOnEscape?: boolean;
  /** 추가 클래스 */
  className?: string;
  /** 테스트 ID */
  'data-testid'?: string;
  /** ARIA 레이블 */
  'aria-label'?: string;
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

const focusSafely = (element: HTMLElement | null | undefined) => {
  if (!element) return;
  try {
    if (element.tabIndex < 0 && !element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
    }
    element.focus();
  } catch (error) {
    logger.debug('[ModalShell.solid] focusSafely failed', error);
  }
};

const getFocusableElements = (container: HTMLElement | null | undefined): HTMLElement[] => {
  if (!container) return [];
  const list = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
  return Array.from(list).filter(el => !el.hasAttribute('disabled'));
};

const isEventFromBackdrop = (event: MouseEvent | KeyboardEvent, backdrop: HTMLElement) => {
  const target = event.target as Node | null;
  return target === backdrop;
};

export const ModalShell = (providedProps: SolidModalShellProps): JSX.Element | null => {
  const solid = getSolidCore();

  const props = solid.mergeProps(
    {
      size: 'md' as const,
      surfaceVariant: 'glass' as const,
      closeOnBackdropClick: true,
      closeOnEscape: true,
    },
    providedProps
  );
  const [local, rest] = solid.splitProps(props, [
    'children',
    'isOpen',
    'onClose',
    'size',
    'surfaceVariant',
    'closeOnBackdropClick',
    'closeOnEscape',
    'className',
    'data-testid',
    'aria-label',
  ]);

  let containerRef: HTMLDivElement | undefined;
  let backdropRef: HTMLDivElement | undefined;
  let previousFocus: HTMLElement | null = null;
  let focusTimer: number | null = null;

  const [trapActive, setTrapActive] = solid.createSignal(false);

  const focusFirstElement = () => {
    if (!containerRef) return;
    const [first] = getFocusableElements(containerRef);
    if (first) {
      focusSafely(first);
      return;
    }
    focusSafely(containerRef);
  };

  const clearFocusTimer = () => {
    if (focusTimer !== null) {
      try {
        clearTimeout(focusTimer);
      } catch {
        /* no-op */
      }
      focusTimer = null;
    }
  };

  const restorePreviousFocus = () => {
    if (!previousFocus) return;
    if (!previousFocus.isConnected) {
      previousFocus = null;
      return;
    }
    focusSafely(previousFocus);
    previousFocus = null;
  };

  const handleClose = () => {
    if (typeof local.onClose === 'function') {
      local.onClose();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!trapActive()) return;
    if (!containerRef?.contains(event.target as Node)) {
      return;
    }

    if (event.key === 'Escape' && local.closeOnEscape) {
      event.preventDefault();
      handleClose();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements(containerRef);
    if (focusable.length === 0) {
      event.preventDefault();
      focusSafely(containerRef);
      return;
    }

    const current = document.activeElement as HTMLElement | null;
    const target = event.target as HTMLElement | null;
    let currentIndex = -1;

    if (target) {
      currentIndex = focusable.indexOf(target);
    }

    if (currentIndex === -1 && current) {
      currentIndex = focusable.indexOf(current);
    }

    if (event.shiftKey) {
      const previousIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
      event.preventDefault();
      focusSafely(focusable[previousIndex]);
      return;
    }

    let nextIndex = currentIndex + 1;
    if (currentIndex === -1 || currentIndex === focusable.length - 1) {
      nextIndex = 0;
    }
    event.preventDefault();
    focusSafely(focusable[nextIndex]);
  };

  const attachListeners = () => {
    if (!trapActive()) {
      document.addEventListener('keydown', handleKeyDown, true);
      setTrapActive(true);
    }
  };

  const detachListeners = () => {
    if (trapActive()) {
      document.removeEventListener('keydown', handleKeyDown, true);
      setTrapActive(false);
    }
  };

  solid.createEffect(() => {
    if (!local.isOpen) {
      clearFocusTimer();
      detachListeners();
      restorePreviousFocus();
      return;
    }

    if (typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active instanceof HTMLElement && containerRef && !containerRef.contains(active)) {
        previousFocus = active;
      } else if (!containerRef && active instanceof HTMLElement) {
        previousFocus = active;
      }
    }

    attachListeners();
    clearFocusTimer();
    focusFirstElement();
    focusTimer = window.setTimeout(() => {
      focusFirstElement();
    }, 0);
  });

  solid.onCleanup(() => {
    clearFocusTimer();
    detachListeners();
    restorePreviousFocus();
  });

  const handleBackdropClick = (event: MouseEvent) => {
    if (!local.closeOnBackdropClick || !backdropRef) return;
    if (isEventFromBackdrop(event, backdropRef)) {
      handleClose();
    }
  };

  const backdropKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && local.closeOnEscape && isEventFromBackdrop(event, backdropRef!)) {
      event.preventDefault();
      handleClose();
    }
  };

  if (!local.isOpen) {
    return null;
  }

  const backdropTestId = local['data-testid'] ? `${local['data-testid']}-backdrop` : undefined;
  const ariaLabel = local['aria-label'] ?? 'Modal';

  return (
    <div
      ref={ref => {
        backdropRef = ref ?? undefined;
      }}
      class={`modal-backdrop ${local.isOpen ? 'modal-open' : ''}`.trim()}
      data-testid={backdropTestId}
      onClick={handleBackdropClick}
      onKeyDown={backdropKeyDown}
    >
      <div
        ref={ref => {
          containerRef = ref ?? undefined;
        }}
        role='dialog'
        aria-modal='true'
        aria-label={ariaLabel}
        data-testid={local['data-testid']}
        class={`modal-shell modal-size-${local.size} modal-surface-${local.surfaceVariant} ${local.className ?? ''}`.trim()}
        {...rest}
      >
        {local.children}
      </div>
    </div>
  );
};

export default ModalShell;
