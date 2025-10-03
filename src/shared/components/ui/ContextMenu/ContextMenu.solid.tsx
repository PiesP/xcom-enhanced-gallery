/**
 * ContextMenu 컴포넌트
 * Epic CONTEXT-MENU-UI Phase 2: GREEN (최소 구현)
 *
 * 커스텀 컨텍스트 메뉴 - 네이티브 브라우저 메뉴 대체
 * - PC 전용 입력 (Touch/Pointer 금지)
 * - 접근성 (ARIA, 키보드 네비게이션)
 * - 디자인 토큰 사용
 */

import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import type { ContextMenuProps } from './types';
import styles from './ContextMenu.module.css';

const solid = getSolidCore();
const { Show, For, createEffect, onCleanup, onMount } = solid;

export function ContextMenu(props: ContextMenuProps): JSX.Element {
  let menuRef: HTMLDivElement | undefined;
  let firstItemRef: HTMLButtonElement | undefined;
  const { createSignal } = solid;
  const [focusedIndex, setFocusedIndex] = createSignal(0);

  // 외부 클릭 감지
  createEffect(() => {
    if (!props.isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef && !menuRef.contains(e.target as Node)) {
        props.onClose();
      }
    };

    // 약간의 지연을 두고 등록 (메뉴가 열리는 클릭과 구분)
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    onCleanup(() => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    });
  });

  // 키보드 이벤트 처리
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        props.onClose();
        break;

      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = (prev + 1) % props.actions.length;
          focusMenuItem(next);
          return next;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = (prev - 1 + props.actions.length) % props.actions.length;
          focusMenuItem(next);
          return next;
        });
        break;

      case 'Enter': {
        e.preventDefault();
        const currentAction = props.actions[focusedIndex()];
        if (currentAction) {
          currentAction.onClick();
          props.onClose();
        }
        break;
      }

      default:
        break;
    }
  };

  // 메뉴 항목 포커스 헬퍼
  const focusMenuItem = (index: number) => {
    if (!menuRef) return;
    const items = menuRef.querySelectorAll('[role="menuitem"]');
    const item = items[index] as HTMLElement;
    item?.focus();
  };

  // 메뉴가 열릴 때 첫 번째 항목에 포커스
  onMount(() => {
    if (props.isVisible && firstItemRef) {
      firstItemRef.focus();
    }
  });

  return (
    <Show when={props.isVisible}>
      <div
        ref={menuRef}
        class={styles.contextMenu}
        role='menu'
        aria-label={props.ariaLabel || 'Context menu'}
        style={{
          left: `${props.position.x}px`,
          top: `${props.position.y}px`,
        }}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <For each={props.actions}>
          {(action, index) => (
            <button
              ref={index() === 0 ? firstItemRef : undefined}
              class={styles.menuItem}
              role='menuitem'
              data-action={action.id}
              tabIndex={-1}
              onClick={() => {
                action.onClick();
                props.onClose();
              }}
            >
              {action.label}
            </button>
          )}
        </For>
      </div>
    </Show>
  );
}
