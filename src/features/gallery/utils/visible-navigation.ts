/**
 * @file visible-navigation
 * @description visibleIndex와 currentIndex를 입력으로 이전/다음 내비게이션 인덱스를 계산하는 순수 유틸
 */

/** 유효한 인덱스인지 검사 */
function isValidIndex(index: number, total: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < total;
}

/** 내비게이션 기준 인덱스 선택: visibleIndex가 유효하면 우선, 아니면 currentIndex 클램프 */
export function getGalleryBaseIndex(
  visibleIndex: number,
  currentIndex: number,
  total: number
): number {
  if (total <= 0) return 0;
  if (isValidIndex(visibleIndex, total)) return visibleIndex;
  return Math.max(0, Math.min(currentIndex, Math.max(0, total - 1)));
}

/** 다음 인덱스 계산 (순환) */
export function nextGalleryIndexByVisible(
  visibleIndex: number,
  currentIndex: number,
  total: number
): number {
  if (total <= 0) return 0;
  const base = getGalleryBaseIndex(visibleIndex, currentIndex, total);
  return (base + 1) % total;
}

/** 이전 인덱스 계산 (순환) */
export function previousGalleryIndexByVisible(
  visibleIndex: number,
  currentIndex: number,
  total: number
): number {
  if (total <= 0) return 0;
  const base = getGalleryBaseIndex(visibleIndex, currentIndex, total);
  return base > 0 ? base - 1 : total - 1;
}

export default {
  getGalleryBaseIndex,
  nextGalleryIndexByVisible,
  previousGalleryIndexByVisible,
};
