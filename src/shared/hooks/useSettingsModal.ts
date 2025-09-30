/**
 * @fileoverview useSettingsModal Solid Hook
 * Phase E-1: SettingsModal 상태 관리를 Solid Signals로 구현
 */

import { createSignal } from 'solid-js';
import type { Accessor } from 'solid-js';

/**
 * useSettingsModal Hook의 반환 타입
 */
export interface UseSettingsModalReturn {
  /** 모달 열림 상태 */
  isOpen: Accessor<boolean>;
  /** 모달 열기 */
  open: () => void;
  /** 모달 닫기 */
  close: () => void;
  /** 모달 토글 */
  toggle: () => void;
}

/**
 * SettingsModal의 상태를 관리하는 Solid hook
 *
 * @returns {UseSettingsModalReturn} 모달 상태와 제어 함수
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const modal = useSettingsModal();
 *
 *   return (
 *     <>
 *       <button onClick={modal.open}>Open Settings</button>
 *       <Show when={modal.isOpen()}>
 *         <SettingsModal isOpen={true} onClose={modal.close} />
 *       </Show>
 *     </>
 *   );
 * }
 * ```
 */
export function useSettingsModal(): UseSettingsModalReturn {
  const [isOpen, setIsOpen] = createSignal(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
