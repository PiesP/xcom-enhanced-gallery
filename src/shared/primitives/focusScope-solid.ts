/**
 * Focus Scope Solid Primitive (Phase 3)
 * @description Solid.js reactive primitive for focus scope management
 * @version 1.0.0 - Migrated from Preact hooks to Solid primitives
 *
 * Migration notes:
 * - In Solid, refs are simpler - just use a variable
 * - This primitive maintains API compatibility with Preact version
 * - For Solid components, can directly use: let ref!: HTMLElement
 */

/**
 * Focus scope API result
 */
export interface FocusScopeResult<T extends HTMLElement = HTMLElement> {
  /** Ref function for element binding */
  ref: (el: T | null) => void;
  /** Get current element */
  getElement: () => T | null;
}

/**
 * Create a focus scope primitive (Solid.js)
 * @returns FocusScopeResult with ref function and getElement accessor
 *
 * @description
 * Provides a ref function to bind to an element and track it.
 * In Solid, this is simpler than Preact's useRef pattern.
 *
 * @example
 * ```typescript
 * const scope = createFocusScope<HTMLDivElement>();
 *
 * return <div ref={scope.ref}>
 *   <button>Button 1</button>
 *   <button>Button 2</button>
 * </div>;
 *
 * // Later, access the element
 * const el = scope.getElement();
 * ```
 */
export function createFocusScope<T extends HTMLElement = HTMLElement>(): FocusScopeResult<T> {
  let element: T | null = null;

  return {
    ref: (el: T | null) => {
      element = el;
    },
    getElement: () => element,
  };
}
