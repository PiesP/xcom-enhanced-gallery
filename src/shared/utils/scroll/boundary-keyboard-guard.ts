/**
 * boundary-keyboard-guard (RED stub)
 * 키보드 네비게이션(Home/End/PageUp/PageDown/Space) 경계 기반 prevent 판단 유틸
 * 목표 정책:
 *  - non-scrollable: true (소비)
 *  - top boundary + (Home|PageUp): true
 *  - bottom boundary + (End|PageDown|Space): true
 *  - 그 외: false
 * 현재는 RED 유도 위해 잘못된 반환(항상 false) 구현.
 */

export interface BoundaryKeyboardContext {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  key: string; // 처리 중인 KeyboardEvent.key
}

export function shouldConsumeKeyboardAtBoundary(ctx: BoundaryKeyboardContext): boolean {
  const { scrollTop, scrollHeight, clientHeight, key } = ctx;

  // Non-scrollable 혹은 스크롤 여유 없음 → 소비 (외부 body 전파 방지)
  if (scrollHeight <= clientHeight) return true;

  const maxScrollTop = scrollHeight - clientHeight;
  const atTop = scrollTop <= 0;
  const atBottom = scrollTop >= maxScrollTop;

  const upwardKeys = key === 'Home' || key === 'PageUp';
  const downwardKeys = key === 'End' || key === 'PageDown' || key === ' ' || key === 'Space';

  if (atTop && upwardKeys) return true;
  if (atBottom && downwardKeys) return true;
  return false;
}
