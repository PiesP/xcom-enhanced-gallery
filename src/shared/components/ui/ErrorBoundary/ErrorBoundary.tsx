/**
 * @fileoverview Error Boundary - Error Recovery Component
 * @description Catches render errors from child components and notifies users via toast.
 * Failed component silently replaces with empty fallback (no text rendering).
 * Adheres to PC-only events and vendor getter policies (Phase 309+).
 * @version 1.0.0
 * @module shared/components/ui/ErrorBoundary
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <GalleryApp />
 * </ErrorBoundary>
 * ```
 *
 * **Error Flow**:
 * 1. Child component throws during render
 * 2. ErrorBoundary catches error
 * 3. Notifies user via ToastManager.error()
 * 4. Renders silent fallback (empty span, no text)
 * 5. Language/Toast service errors are silently ignored
 *
 * **Design Decisions**:
 * - Silent UI recovery: Users see no error message on screen (toast-only mode)
 * - One-time reporting: Duplicate errors ignored (reportedError deduplication)
 * - Fault tolerant: Toast/language service failures don't crash error boundary
 * - PC-only: No touch/pointer events, uses getSolid() vendor getter
 */

import { getSolid, type ComponentChildren, type JSXElement } from '@shared/external/vendors';
import { ToastManager } from '@shared/services/unified-toast-manager';
import { languageService } from '@shared/services/language-service';
import styles from './ErrorBoundary.module.css';

/**
 * @description Props for ErrorBoundary component
 * @property {ComponentChildren} [children] - Child components to wrap
 */
type Props = {
  children?: ComponentChildren;
};

/**
 * Error Boundary - High-order component for catching child render errors
 *
 * **Responsibilities**:
 * - Catch render errors from child components
 * - Notify user via ToastManager
 * - Silent UI recovery (no error display)
 * - Deduplicate duplicate errors
 *
 * **PC-Only Policy**: Uses getSolid() vendor getter (Phase 309+)
 *
 * @param {Props} props - Component props
 * @returns {JSXElement} Solid.js JSX element with error boundary wrapper
 *
 * @throws Never throws - all errors are caught and silently handled
 */
export function ErrorBoundary({ children }: Props): JSXElement {
  const { ErrorBoundary: SolidErrorBoundary } = getSolid();
  let reportedError: unknown = null;

  /**
   * Report error to user via ToastManager
   * Deduplicates identical errors to prevent notification spam
   *
   * @param {unknown} err - Error object from child component
   * @returns {void}
   *
   * @description
   * - Compares by reference to deduplicate (reportedError === err)
   * - Retrieves localized error messages from language service
   * - Formats error message with error.message or String fallback
   * - Silently ignores Toast/language service failures
   */
  const reportError = (err: unknown): void => {
    // Deduplicate: ignore if same error already reported
    if (reportedError === err) {
      return;
    }
    reportedError = err;

    try {
      // Fetch localized error title and body
      const title = languageService.getString('messages.errorBoundary.title');
      const body = languageService.getFormattedString('messages.errorBoundary.body', {
        error: err instanceof Error ? err.message : String(err),
      });
      // Notify user with toast-only mode (no persistent UI)
      ToastManager.getInstance().error(title, body, { route: 'toast-only' });
    } catch {
      // Silently ignore toast/language service failures
      // Error boundary must never crash due to notification failures
    }
  };

  return (
    <SolidErrorBoundary
      fallback={(err, reset) => {
        // Report error to user via toast
        reportError(err);
        return (
          <>
            {reset && typeof reset === 'function' && (
              // Hidden reset span: used internally by test/monitoring
              // No visible UI rendered (silent recovery)
              <span class={styles.hiddenReset} data-xeg-error-boundary-reset />
            )}
          </>
        );
      }}
    >
      {children ?? <></>}
    </SolidErrorBoundary>
  );
}

export default ErrorBoundary;
