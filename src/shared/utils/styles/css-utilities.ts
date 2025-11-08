/**
 * @fileoverview CSS Utilities
 * @description Simple utility functions for manipulating CSS classes and variables
 */

/**
 * Class name combining utility
 * @param classes - Array of class names to combine (falsy values are auto-filtered)
 * @returns Space-separated class name string
 * @example
 * ```typescript
 * combineClasses('btn', 'btn-primary', undefined, false) // 'btn btn-primary'
 * ```
 */
export function combineClasses(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Class toggle utility
 * @param element - Target HTML element
 * @param className - Class name to toggle
 * @param condition - Toggle condition (defaults to opposite of current state if not specified)
 * @returns void
 * @example
 * ```typescript
 * toggleClass(element, 'active'); // toggle
 * toggleClass(element, 'active', true); // add
 * ```
 */
export function toggleClass(element: HTMLElement, className: string, condition?: boolean): void {
  const shouldHave = condition ?? !element.classList.contains(className);
  element.classList.toggle(className, shouldHave);
}

/**
 * Set CSS variable
 * @param element - Target HTML element (ignored if null)
 * @param variable - CSS variable name (auto-adds '--' prefix)
 * @param value - CSS variable value
 * @returns void
 * @example
 * ```typescript
 * setCSSVariable(element, 'color-primary', 'oklch(...)')
 * // element.style.setProperty('--color-primary', 'oklch(...)')
 * ```
 */
export function setCSSVariable(element: HTMLElement | null, variable: string, value: string): void {
  if (!element) return;
  const varName = variable.startsWith('--') ? variable : `--${variable}`;
  element.style.setProperty(varName, value);
}

/**
 * Set multiple CSS variables at once
 * @param element - Target HTML element (ignored if null)
 * @param variables - CSS variable name-value object
 * @returns void
 * @example
 * ```typescript
 * setCSSVariables(element, {
 *   'color-primary': 'oklch(...)',
 *   'space-md': '1rem'
 * })
 * ```
 */
export function setCSSVariables(
  element: HTMLElement | null,
  variables: Record<string, string>
): void {
  if (!element) return;
  Object.entries(variables).forEach(([key, value]) => {
    setCSSVariable(element, key, value);
  });
}

/**
 * Update class based on component state
 * @param element - Target HTML element
 * @param state - State to apply ('loading' | 'error' | 'success' | 'idle')
 * @param baseClass - Base class name (default: 'component')
 * @returns void
 * @example
 * ```typescript
 * updateComponentState(element, 'loading', 'modal')
 * // Add 'modal--loading' class, remove existing state classes
 * ```
 */
export function updateComponentState(
  element: HTMLElement,
  state: 'loading' | 'error' | 'success' | 'idle',
  baseClass: string = 'component'
): void {
  const states = ['loading', 'error', 'success', 'idle'];
  states.forEach(s => element.classList.remove(`${baseClass}--${s}`));
  element.classList.add(`${baseClass}--${state}`);
}

/**
 * Create themed class name
 * @param baseClass - Base class name
 * @param theme - Theme name (default: 'auto')
 * @returns Class name with theme applied
 * @example
 * ```typescript
 * createThemedClassName('button', 'dark') // 'button--dark'
 * createThemedClassName('button', 'auto') // 'button'
 * ```
 */
export function createThemedClassName(baseClass: string, theme: string = 'auto'): string {
  return theme === 'auto' ? baseClass : `${baseClass}--${theme}`;
}
