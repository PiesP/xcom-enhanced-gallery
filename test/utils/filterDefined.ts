/**
 * 간단한 유틸: 배열에서 null/undefined를 제거
 */
export function filterDefined<T>(values: Array<T | null | undefined>): T[] {
  return values.filter((v): v is T => v != null);
}
