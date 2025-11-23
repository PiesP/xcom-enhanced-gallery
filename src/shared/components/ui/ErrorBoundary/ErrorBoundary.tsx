/**
 * @fileoverview Error Boundary - Error Recovery Component
 * @description Catches render errors from child components and notifies users via Tampermonkey notifications.
 * Failed component silently replaces with empty fallback (no text rendering).
 * Adheres to PC-only events and vendor getter policies (Phase 309+).
 * 5. Language/notification service errors are silently ignored
 *
 * **Design Decisions**:
 * - Silent UI recovery: Users see no error message on screen (notification-only mode)
 * - One-time reporting: Duplicate errors ignored (reportedError deduplication)
 * - Fault tolerant: Notification/language service failures don't crash error boundary
 * - PC-only: No touch/pointer events, uses getSolid() vendor getter
 *
 * @version 1.0.0
 * @module shared/components/ui/ErrorBoundary
 */

import {
  getSolid,
  type ComponentChildren,
  type JSXElement,
} from "@shared/external/vendors";
import { NotificationService } from "@shared/services/notification-service";
import { languageService } from "@shared/services/language-service";

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
 * - Notify user via NotificationService
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
  const { children: resolveChildren, createMemo, createSignal } = getSolid();
  let lastReportedError: unknown = null;
  const [currentError, setCurrentError] = createSignal<unknown>(undefined);
  const fallbackElement = (
    <span data-xeg-error-boundary-reset hidden aria-hidden="true" />
  );

  /**
   * Report error to user via NotificationService
   * Deduplicates identical errors to prevent notification spam
   *
   * @param {unknown} err - Error object from child component
   * @returns {void}
   *
   * @description
   * - Compares by reference to deduplicate (reportedError === err)
   * - Retrieves localized error messages from language service
   * - Formats error message with error.message or String fallback
   * - Silently ignores Notification/language service failures
   */
  const reportError = (err: unknown): void => {
    // Deduplicate: ignore if same error already reported
    if (lastReportedError === err) {
      return;
    }
    lastReportedError = err;

    try {
      // Fetch localized error title and body
      const title = languageService.translate("messages.errorBoundary.title");
      const body = languageService.translate("messages.errorBoundary.body", {
        error: err instanceof Error ? err.message : String(err),
      });
      // Notify user with Tampermonkey notification
      NotificationService.getInstance().error(title, body);
    } catch {
      // Silently ignore notification/language service failures
      // Error boundary must never crash due to notification failures
    }
  };

  const safeChildren = createMemo<JSXElement>(() => {
    if (currentError() !== undefined) {
      return fallbackElement;
    }

    try {
      const childAccessor = resolveChildren(() => children);
      return childAccessor() ?? <></>;
    } catch (err) {
      reportError(err);
      setCurrentError(err);
      return fallbackElement;
    }
  });

  return safeChildren();
}
