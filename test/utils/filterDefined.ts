export function filterDefined<T>(values: readonly (T | undefined)[]): T[] {
  return values.filter((value): value is T => value !== undefined);
}
