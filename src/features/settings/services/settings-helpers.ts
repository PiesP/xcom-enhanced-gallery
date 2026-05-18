/**
 * @fileoverview Settings service helper utilities
 */

/** Resolve nested object property by dot-notation path */
export function resolveNestedPath<T = unknown>(source: unknown, path: string): T | undefined {
  if (typeof path !== 'string' || path === '') return undefined;

  let current: unknown = source;
  for (const segment of path.split('.')) {
    if (!segment || current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }

  return current as T | undefined;
}

/** Assign value to nested object property by dot-notation path */
export function assignNestedPath(target: unknown, path: string, value: unknown): boolean {
  if (target === null || typeof target !== 'object') return false;
  if (typeof path !== 'string' || path === '') return false;

  const segments = path.split('.');
  const last = segments[segments.length - 1];
  if (!last) return false;

  let current = target as Record<string, unknown>;

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    if (!segment) return false;
    const existing = Object.hasOwn(current, segment) ? current[segment] : undefined;
    if (existing === null || typeof existing !== 'object') {
      const next = Object.create(null) as Record<string, unknown>;
      current[segment] = next;
      current = next;
      continue;
    }
    current = existing as Record<string, unknown>;
  }

  current[last] = value;
  return true;
}

/** Validate a setting value against its default type */
export function isValidSettingValue(defaultValue: unknown, value: unknown): boolean {
  if (defaultValue === undefined) return true;
  if (Array.isArray(defaultValue)) return Array.isArray(value);
  if (typeof defaultValue === 'object' && defaultValue !== null) {
    return typeof value === 'object' && value !== null;
  }
  return typeof value === typeof defaultValue;
}
