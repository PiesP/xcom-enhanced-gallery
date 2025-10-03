/**
 * 컨텍스트 메뉴 위치 계산 유틸리티
 * Epic CONTEXT-MENU-UI Phase 2: GREEN
 *
 * viewport 경계를 고려하여 메뉴 위치를 조정합니다.
 */

import type { ContextMenuPosition } from '@shared/components/ui/ContextMenu/types';

export interface CalculateMenuPositionOptions {
  mouseX: number;
  mouseY: number;
  menuWidth: number;
  menuHeight: number;
  viewportWidth?: number;
  viewportHeight?: number;
}

/**
 * 메뉴 위치를 계산합니다.
 * viewport 경계를 초과하는 경우 자동으로 조정합니다.
 */
export function calculateMenuPosition(options: CalculateMenuPositionOptions): ContextMenuPosition {
  const {
    mouseX,
    mouseY,
    menuWidth,
    menuHeight,
    viewportWidth = window.innerWidth,
    viewportHeight = window.innerHeight,
  } = options;

  let x = mouseX;
  let y = mouseY;

  // 오른쪽 경계 초과 시 왼쪽으로 조정
  if (x + menuWidth > viewportWidth) {
    x = viewportWidth - menuWidth;
  }

  // 하단 경계 초과 시 위쪽으로 조정
  if (y + menuHeight > viewportHeight) {
    y = viewportHeight - menuHeight;
  }

  // 음수 방지 (화면 밖으로 나가지 않도록)
  x = Math.max(0, x);
  y = Math.max(0, y);

  return { x, y };
}
