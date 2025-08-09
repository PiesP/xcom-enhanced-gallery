/**
 * Safe wrappers for Preact Compat APIs (memo, forwardRef)
 * - Avoid throwing before vendor initialization
 * - Use getter functions so external deps remain mockable
 */

import { getPreactCompat } from '@shared/external/vendors';

// Generic types kept loose to remain framework-agnostic while preserving strictness via explicit annotations.
export type PropsRecord = Record<string, unknown>;
export type CompareFn<P = PropsRecord> = (prevProps: P, nextProps: P) => boolean;
export type ForwardRefRenderFunction<P = PropsRecord> = (props: P, ref: unknown) => unknown;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memo<P = PropsRecord>(component: any, compare?: CompareFn<P>): any {
  try {
    const compat = getPreactCompat();

    return typeof compat.memo === 'function' ? compat.memo(component, compare as never) : component;
  } catch {
    // Before vendors are initialized, return component as-is (no memoization)

    return component;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function forwardRef<P = PropsRecord>(render: ForwardRefRenderFunction<P>): any {
  try {
    const compat = getPreactCompat();

    return typeof compat.forwardRef === 'function'
      ? compat.forwardRef(render as never)
      : (props: P & { ref?: unknown }) => render(props, (props as { ref?: unknown }).ref);
  } catch {
    // Fallback: call render with props.ref manually; still usable without compat

    return (props: P & { ref?: unknown }) => render(props, (props as { ref?: unknown }).ref);
  }
}
