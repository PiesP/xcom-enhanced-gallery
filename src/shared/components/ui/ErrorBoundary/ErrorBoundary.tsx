/**
 * @fileoverview SolidJS Error Boundary with Localized Notifications
 * @description Wraps SolidJS `<ErrorBoundary>` to provide localized error notifications
 * and a retry-friendly fallback UI. Deduplicates errors to prevent notification spam.
 *
 * Design choices:
 * - Uses SolidJS primitives (createSignal) for idiomatic reactivity
 * - Uses Show-based remounting for reliable retry behavior
 * - Deduplicates reported errors to avoid notification spam
 * - Swallows translation/notification failures to keep UI resilient
 */

import { getLanguageService } from '@shared/container/service-accessors';
import type { JSXElement } from '@shared/external/vendors';
import { NotificationService } from '@shared/services/notification-service';
import { createSignal, Show, ErrorBoundary as SolidErrorBoundary } from 'solid-js';
import type { ErrorBoundaryProps } from './error-boundary.types';

/**
 * Converts an unknown error to a readable string representation.
 *
 * Handles Error objects specially, falls back to String() conversion,
 * and returns a safe fallback for unserializable errors.
 *
 * @param error - The error to stringify
 * @returns A string representation of the error
 */
function stringifyError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  try {
    return String(error);
  } catch {
    return 'Unknown error';
  }
}

/**
 * Translates an error to localized title and body text.
 *
 * Uses the language service to fetch localized error messages.
 * Falls back to English text if translation or language service fails.
 *
 * @param error - The error to translate
 * @returns An object with localized title and body strings
 */
function translateError(error: unknown): { body: string; title: string } {
  try {
    const languageService = getLanguageService();
    return {
      title: languageService.translate('msg.err.t'),
      body: languageService.translate('msg.err.b', {
        error: stringifyError(error),
      }),
    };
  } catch {
    return {
      body: stringifyError(error),
      title: 'Unexpected error',
    };
  }
}

/**
 * Error Boundary component with notification and retry support.
 *
 * Wraps content in a SolidJS error boundary that:
 * - Catches errors and displays localized notifications
 * - Shows a fallback UI with a retry button
 * - Prevents notification spam by deduplicating errors
 *
 * @param props - ErrorBoundary component props
 * @returns JSX element wrapping children with error handling
 */
export function ErrorBoundary(props: ErrorBoundaryProps): JSXElement {
  let lastReportedError: unknown;
  const [caughtError, setCaughtError] = createSignal<unknown>(undefined);
  const [boundaryMounted, setBoundaryMounted] = createSignal(true);

  /**
   * Notifies the user of an error via notification service.
   *
   * Deduplicates errors to prevent spam. Uses translation service
   * to localize error messages. Silently catches notification failures.
   *
   * @param error - The error to notify
   */
  const notifyError = (error: unknown): void => {
    if (lastReportedError === error) return;
    lastReportedError = error;

    const copy = translateError(error);
    try {
      NotificationService.getInstance().error(copy.title, copy.body);
    } catch {
      // Notification failures must never propagate
    }
  };

  /**
   * Handles retry by resetting error state and remounting the boundary.
   *
   * Uses queueMicrotask to ensure proper cleanup and remount sequence.
   */
  const handleRetry = (): void => {
    lastReportedError = undefined;
    setCaughtError(undefined);
    // Force remount by toggling the boundary off and on
    setBoundaryMounted(false);
    queueMicrotask(() => setBoundaryMounted(true));
  };

  /**
   * Renders the fallback UI when an error is caught.
   *
   * Displays the localized error message and a retry button.
   *
   * @param error - The caught error
   * @returns JSX element with error display and retry button
   */
  const renderFallback = (error: unknown): JSXElement => {
    const { title, body } = translateError(error);

    return (
      <div aria-live="polite" data-xeg-error-boundary="" role="alert">
        <p class="xeg-error-boundary__title">{title}</p>
        <p class="xeg-error-boundary__body">{body}</p>
        <button class="xeg-error-boundary__action" onClick={handleRetry} type="button">
          Retry
        </button>
      </div>
    );
  };

  return (
    <>
      <Show when={boundaryMounted()}>
        <SolidErrorBoundary
          fallback={(boundaryError) => {
            notifyError(boundaryError);
            setCaughtError(boundaryError);
            return null;
          }}
        >
          {props.children}
        </SolidErrorBoundary>
      </Show>
      <Show when={caughtError()}>{(error) => renderFallback(error())}</Show>
    </>
  );
}
