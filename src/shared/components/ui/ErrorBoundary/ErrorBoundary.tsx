// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Wraps SolidJS `<ErrorBoundary>` with localized error notifications.
 * Provides a retry-friendly fallback UI and deduplicates error notifications.
 */

import { getLanguageService } from '@shared/container/container';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { getUserscript } from '@shared/external/userscript/adapter';
import type { ComponentChildren } from '@shared/utils/solid/accessor-utils';
import type { JSXElement } from 'solid-js';
import { createSignal, Show, ErrorBoundary as SolidErrorBoundary } from 'solid-js';

/** Maximum number of retry attempts before disabling the retry button. */
const MAX_RETRIES = 3;

/**
 * Props for ErrorBoundary component
 *
 * The ErrorBoundary wraps SolidJS `<ErrorBoundary>` to provide localized error notifications
 * and a retry-friendly fallback UI. It deduplicates error notifications to prevent spam.
 * @property children - Content to wrap with error boundary protection
 */
export interface ErrorBoundaryProps {
  readonly children?: ComponentChildren;
}

/**
 * Returns localized error title and body using language service.
 */
function translateError(error: unknown): { body: string; title: string } {
  try {
    const lang = getLanguageService();
    return {
      title: lang.translate('msg.err.t'),
      body: lang.translate('msg.err.b', { error: normalizeErrorMessage(error) }),
    };
  } catch {
    return { body: normalizeErrorMessage(error), title: 'Unexpected error' };
  }
}

/**
 * Error Boundary component with localized notifications and retry support.
 */
export function ErrorBoundary(props: ErrorBoundaryProps): JSXElement {
  const [lastError, setLastError] = createSignal<unknown>(undefined);
  const [caughtError, setCaughtError] = createSignal<unknown>(undefined);
  const [mounted, setMounted] = createSignal(true);
  const [retryCount, setRetryCount] = createSignal(0);

  const notifyError = (error: unknown): void => {
    if (lastError() === error) return;
    setLastError(error);
    const { title, body } = translateError(error);
    getUserscript().notification({ title, text: body });
  };

  const handleRetry = (): void => {
    if (retryCount() >= MAX_RETRIES) return;
    setLastError(undefined);
    setCaughtError(undefined);
    setRetryCount((c) => c + 1);
    setMounted(false);
    queueMicrotask(() => setMounted(true));
  };

  const getRetryLabel = (): string => {
    if (retryCount() >= MAX_RETRIES) return 'No more retries';
    return 'Retry';
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
              <button
                class="xeg-error-boundary__action"
                disabled={retryCount() >= MAX_RETRIES}
                onClick={handleRetry}
                type="button"
              >
                {getRetryLabel()}
              </button>
            </div>
          );
        }}
      </Show>
    </>
  );
}
