/**
 * boundary-wheel-guard (RED stub)
 * 경계 기반 wheel 소비 판단 유틸 (feature flag on 시 사용 예정)
 */

export interface BoundaryWheelContext {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  deltaY: number;
}

/**
 * 경계에서만 true(소비 필요) 반환할 예정 — 현재는 RED 유도 위해 throw
 */
export function shouldConsumeWheelAtBoundary(ctx: BoundaryWheelContext): boolean {
  const { scrollTop, scrollHeight, clientHeight, deltaY } = ctx;
  // Non-scrollable (or trivially scrollable) → 소비하여 상위 체인 방지
  if (scrollHeight <= clientHeight) return true;

  const maxScrollTop = scrollHeight - clientHeight;
  const atTop = scrollTop <= 0;
  const atBottom = scrollTop >= maxScrollTop;

  // 위로 스크롤(deltaY < 0) 시 top 경계면 소비
  if (atTop && deltaY < 0) return true;
  // 아래로 스크롤(deltaY > 0) 시 bottom 경계면 소비
  if (atBottom && deltaY > 0) return true;

  // 그 외 여유 영역 → 소비 불필요 (false)
  return false;
}
