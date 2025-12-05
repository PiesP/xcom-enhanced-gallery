/**
 * @fileoverview SolidJS-native Error Boundary
 * @description Wraps SolidJS `<ErrorBoundary>` to provide localized notifications and a retry-friendly fallback.
 *
 * Design choices:
 * - Uses SolidJS primitives directly (createSignal) for idiomatic reactivity
 * - Uses Show-based remounting for reliable retry behavior
 * - Deduplicates reported errors to avoid notification spam
 * - Swallows translation/notification failures to keep UI resilient
 */

import { getLanguageService } from '@shared/container/service-accessors';
import { type ComponentChildren, type JSXElement } from '@shared/external/vendors';
import {
  ErrorBoundary as SolidErrorBoundary,
  Show,
  createSignal,
} from '@shared/external/vendors/solid-hooks';
import { NotificationService } from '@shared/services/notification-service';

type Props = {
  children?: ComponentChildren;
};

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

function translateError(error: unknown): { title: string; body: string } {
  try {
    const languageService = getLanguageService();
    return {
      title: languageService.translate('messages.errorBoundary.title'),
      body: languageService.translate('messages.errorBoundary.body', {
        error: stringifyError(error),
      }),
    };
  } catch {
    return {
      title: 'Unexpected error',
      body: stringifyError(error),
    };
  }
}

export function ErrorBoundary(props: Props): JSXElement {
  let lastReportedError: unknown;
  const [caughtError, setCaughtError] = createSignal<unknown>(undefined);
  const [boundaryMounted, setBoundaryMounted] = createSignal(true);

  const notifyError = (error: unknown): void => {
    if (lastReportedError === error) return;
    lastReportedError = error;

    try {
      const copy = translateError(error);
      NotificationService.getInstance().error(copy.title, copy.body);
    } catch {
      // Notification failures must never propagate
    }
  };

  const handleRetry = () => {
    lastReportedError = undefined;
    setCaughtError(undefined);
    // Force remount by toggling the boundary off and on
    setBoundaryMounted(false);
    queueMicrotask(() => setBoundaryMounted(true));
  };

  const renderFallback = (error: unknown): JSXElement => {
    let title = 'Unexpected error';
    let body = stringifyError(error);

    try {
      const copy = translateError(error);
      title = copy.title;
      body = copy.body;
    } catch {
      // Even translation failures should not break rendering
    }

    return (
      <div role="alert" data-xeg-error-boundary="" aria-live="polite">
        <p class="xeg-error-boundary__title">{title}</p>
        <p class="xeg-error-boundary__body">{body}</p>
        <button type="button" class="xeg-error-boundary__action" onClick={handleRetry}>
          Retry
        </button>
      </div>
    );
  };

  return (
    <>
      <Show when={boundaryMounted()}>
        <SolidErrorBoundary
          fallback={boundaryError => {
            notifyError(boundaryError);
            setCaughtError(boundaryError);
            return null;
          }}
        >
          {props.children}
        </SolidErrorBoundary>
      </Show>
      <Show when={caughtError()}>{error => renderFallback(error())}</Show>
    </>
  );
}
