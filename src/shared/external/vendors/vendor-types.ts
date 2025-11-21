/**
 * @fileoverview Vendor API type definitions
 * @description Type safety for external libraries (Solid.js, PreactCompat, etc.)
 *
 * **Purpose**: Central type hub for vendor system (Phase 373)
 * **Pattern**: Interface definitions + type aliases for consistency
 * **Principle**: Enable strict typing for vendor APIs
 *
 * **Scope**: Types for Solid.js component compatibility helpers.
 *
 * **Related**:
 * - {@link vendor-api-safe.ts} - TDZ-safe vendor access layer
 * - {@link vendor-manager-static.ts} - Singleton manager implementation
 * - {@link index.ts} - Barrel export with usage guidance
 *
 * @version 12.0.0 - Phase 373: Comprehensive English documentation, @internal marking
 * Previous version was 11.0.0 - Phase 200: Simplified comments
 */

type SolidJSXElement = import('solid-js').JSX.Element;

/**
 * Generic component type (universal)
 *
 * Represents a Solid.js component that:
 * - Accepts props object (P)
 * - Returns JSXElement (or null for optional rendering)
 * - May have displayName property (for debugging in React DevTools)
 *
 * **Usage**: Base type for memoized and forwarded components
 *
 * @typeParam P - Props object type (default: empty Record)
 * @internal
 */
export type PreactComponent<P = Record<string, unknown>> = ((
  props: P
) => SolidJSXElement | null) & {
  displayName?: string;
};

/**
 * Memo comparison function
 *
 * Compares previous props with next props to determine if re-render is needed.
 * Returns `true` if props are equivalent (skip render), `false` if different (render).
 *
 * **Pattern**: React.memo compare function (PreactCompat polyfill)
 *
 * @typeParam P - Props object type (default: empty Record)
 * @returns true if props unchanged (skip re-render), false otherwise
 * @internal Used by {@link PreactCompat.memo}
 */
export type MemoCompareFunction<P = Record<string, unknown>> = (
  prevProps: P,
  nextProps: P
) => boolean;

/**
 * ForwardRef component type
 *
 * Represents a component that accepts refs and props.
 * Enables ref forwarding for Solid.js components (PreactCompat pattern).
 *
 * **Pattern**: React.forwardRef component (PreactCompat polyfill)
 *
 * @typeParam P - Props object type (default: empty Record)
 * @returns JSXElement or null
 * @internal Used by {@link PreactCompat.forwardRef}
 */
export type ForwardRefComponent<P = Record<string, unknown>> = (
  props: P,
  ref: unknown
) => SolidJSXElement | null;

/**
 * PreactCompat type definition
 *
 * Polyfill interface that provides React-like APIs (memo, forwardRef) for Solid.js.
 * Enables limited React compatibility for component patterns.
 *
 * **Methods**:
 * - `memo<P>(Component, compare?)`: Memoize component (skip renders if props unchanged)
 * - `forwardRef<P>(Component)`: Forward refs to inner component
 *
 * **Implementation**: Solid.js versions use displayName assignment (React DevTools compatible)
 *
 * @internal Used by vendor API layer for component compatibility
 */
export interface PreactCompat {
  memo: <P = Record<string, unknown>>(
    Component: PreactComponent<P>,
    compare?: MemoCompareFunction<P>
  ) => PreactComponent<P>;

  forwardRef: <P = Record<string, unknown>>(
    Component: ForwardRefComponent<P>
  ) => PreactComponent<P>;
}
