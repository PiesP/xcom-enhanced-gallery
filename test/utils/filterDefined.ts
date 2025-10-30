export function filterDefined<T>(values: readonly (T | null | undefined)[]): T[] {
  return values.filter((value): value is T => value !== undefined && value !== null);
}
