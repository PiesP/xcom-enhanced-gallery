/**
 * @fileoverview Wraps SolidJS `<ErrorBoundary>` with localized error notifications.
 * Provides a retry-friendly fallback UI and deduplicates error notifications.
 */

import { getLanguageService } from '@shared/container/service-accessors';
import type { JSXElement } from '@shared/external/vendors';
import { NotificationService } from '@shared/services/notification-service';
import { createSignal, Show, ErrorBoundary as SolidErrorBoundary } from 'solid-js';
import type { ErrorBoundaryProps } from './ErrorBoundary.types';

/**
 * Converts an error to string, handling Error objects and fallbacks safely.
 */
function stringifyError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  try {
    return String(error);
  } catch {
    return 'Unknown error';
  }
}

/**
 * Returns localized error title and body using language service.
 */
function translateError(error: unknown): { body: string; title: string } {
  try {
    const lang = getLanguageService();
    return {
      title: lang.translate('msg.err.t'),
      body: lang.translate('msg.err.b', { error: stringifyError(error) }),
    };
  } catch {
    return { body: stringifyError(error), title: 'Unexpected error' };
  }
}

/**
 * Error Boundary component with localized notifications and retry support.
 */
export function ErrorBoundary(props: ErrorBoundaryProps): JSXElement {
  let lastError: unknown;
  const [caughtError, setCaughtError] = createSignal<unknown>(undefined);
  const [mounted, setMounted] = createSignal(true);

  const notifyError = (error: unknown): void => {
    if (lastError === error) return;
    lastError = error;
    try {
      const { title, body } = translateError(error);
      NotificationService.getInstance().error(title, body);
    } catch {
      // Notification failures must not propagate
    }
  };

  const handleRetry = (): void => {
    lastError = undefined;
    setCaughtError(undefined);
    setMounted(false);
    queueMicrotask(() => setMounted(true));
  };

  return (
    <>
      <Show when={mounted()}>
        <SolidErrorBoundary
          fallback={(error) => {
            notifyError(error);
            setCaughtError(error);
            return null;
          }}
        >
          {props.children}
        </SolidErrorBoundary>
      </Show>
      <Show when={caughtError()}>
        {(error) => {
          const { title, body } = translateError(error());
          return (
            <div aria-live="polite" data-xeg-error-boundary="" role="alert">
              <p class="xeg-error-boundary__title">{title}</p>
              <p class="xeg-error-boundary__body">{body}</p>
              <button class="xeg-error-boundary__action" onClick={handleRetry} type="button">
                Retry
              </button>
            </div>
          );
        }}
      </Show>
    </>
  );
}
