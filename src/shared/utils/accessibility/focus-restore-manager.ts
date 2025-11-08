/**
 * Focus Restore Manager
 * Phase 5 (Accessibility) minimal implementation – When entering a focus scope, remember the current activeElement.
 * When the returned clean-up function is called, safely restore the focus.
 *
 * Requirements (RED test criteria):
 *  - beginFocusScope() call returns restore function
 *  - restore() execution refocuses original element if still in DOM
 *  - If removed, graceful fallback to body or documentElement
 *  - Must not throw exceptions
 *  - (Nested scopes for future expansion) – Currently supports single scope only
 */

// Explicit type definition (strict mode)
export type FocusRestoreFn = () => void;

/**
 * Begin focus scope – Remember current activeElement and return restore function
 */
export function beginFocusScope(): FocusRestoreFn {
  // jsdom/browser environment considerations (SSR environment defense)
  if (typeof document === 'undefined') {
    return () => {};
  }
  const original: Element | null = document.activeElement;

  return function restore(): void {
    if (typeof document === 'undefined') return;

    if (original && original instanceof HTMLElement && document.contains(original)) {
      try {
        original.focus({ preventScroll: true });
        return;
      } catch {
        // Proceed to fallback on failure
      }
    }

    // Fallback: body priority, fallback to documentElement if missing
    const fallback: HTMLElement | null =
      (document.body as HTMLElement | null) ?? document.documentElement;
    if (fallback) {
      // body/html may not be focusable by default, so add tabindex
      if (!fallback.hasAttribute('tabindex')) {
        try {
          fallback.setAttribute('tabindex', '-1');
        } catch {
          /* ignore */
        }
      }
      try {
        // Blur current active element then move focus
        if (document.activeElement && document.activeElement instanceof HTMLElement) {
          try {
            (document.activeElement as HTMLElement).blur();
          } catch {
            /* ignore */
          }
        }
        fallback.focus({ preventScroll: true });
      } catch {
        // Final failure silently ignored
      }
    }
  };
}
