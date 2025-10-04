/**
 * ContextMenu 컴포넌트 타입 정의
 * Epic CONTEXT-MENU-UI Phase 2: GREEN
 * Sub-Epic 4: CONTEXTMENU-ARIA-ENHANCEMENT Phase 2: GREEN
 */

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  /** ARIA labelledby 속성 (선택적) */
  ariaLabelledBy?: string;
}

export interface ContextMenuProps {
  isVisible: boolean;
  position: ContextMenuPosition;
  actions: ContextMenuAction[];
  onClose: () => void;
  ariaLabel?: string;
}
