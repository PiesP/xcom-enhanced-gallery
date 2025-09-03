/**
 * Pure decision helper for inertia wheel preventDefault logic.
 * Returns true if the gallery wheel should be prevented (i.e., internal handling + page scroll suppression).
 */
export interface InertiaPreventDecisionInput {
  variant: 'A' | 'B';
  flagEnabled: boolean; // FEATURE_INERTIA_CONDITIONAL_PREVENT
  deltaY: number; // raw wheel delta
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
}

export function decideInertiaPrevent(input: InertiaPreventDecisionInput): boolean {
  const { variant, flagEnabled, deltaY, scrollTop, clientHeight, scrollHeight } = input;
  // 기본 동작: 항상 차단 (Variant A 또는 플래그 비활성)
  if (!flagEnabled || variant === 'A') return true;
  // Variant B + 플래그 활성: 경계 overscroll 방향이면 차단 해제
  const atTop = scrollTop <= 0;
  const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
  if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) return false;
  return true;
}
