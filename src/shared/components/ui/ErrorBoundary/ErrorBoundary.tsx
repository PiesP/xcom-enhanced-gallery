/**
 * @fileoverview SolidJS-native Error Boundary
 * @description Wraps SolidJS `<ErrorBoundary>` to provide localized notifications and a retry-friendly fallback.
 *
 * Design choices:
 * - Uses SolidJS primitives directly (createSignal/createEffect) for idiomatic reactivity
 * - Deduplicates reported errors to avoid notification spam
 * - Swallows translation/notification failures to keep UI resilient
 */

import { getLanguageService } from '@/shared/container/service-accessors';
import { type ComponentChildren, type JSXElement } from '@/shared/external/vendors';
import { ErrorBoundary as SolidErrorBoundary } from '@/shared/external/vendors/solid-hooks';
import { NotificationService } from '@/shared/services/notification-service';

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

  const resetError = () => {
    lastReportedError = undefined;
  };

  const renderFallback = (error: unknown, reset?: () => void): JSXElement => {
    let title = 'Unexpected error';
    let body = stringifyError(error);

    try {
      const copy = translateError(error);
      title = copy.title;
      body = copy.body;
            reset?.();
      // Even translation failures should not break rendering
    }

    return (
      <div role="alert" data-xeg-error-boundary="" aria-live="polite">
        <p class="xeg-error-boundary__title">{title}</p>
        <p class="xeg-error-boundary__body">{body}</p>
        </button>
      </div>
    <SolidErrorBoundary
      fallback={(boundaryError, reset) => {
        notifyError(boundaryError);
        return renderFallback(boundaryError, () => {
          resetError();
          reset?.();
        });
      }}
    >
      {props.children}
    </SolidErrorBoundary>
            console.debug?.('retry clicked', { hasBoundaryReset: Boolean(boundaryReset) });
            const reset = boundaryReset;
            if (reset) {
              reset();
            } else {
              setBoundaryActive(false);
              setBoundaryActive(true);
            }
            resetError();
          })
        }
      </Show>
    </>
  );
}
