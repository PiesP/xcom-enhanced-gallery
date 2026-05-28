// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Wraps SolidJS `<ErrorBoundary>` with localized error notifications.
 * Provides a retry-friendly fallback UI and deduplicates error notifications.
 */

import { getLanguageService } from '@shared/container/container';
import { getUserscript } from '@shared/external/userscript/adapter';
import type { ComponentChildren } from '@shared/types/component.types';
import type { JSXElement } from 'solid-js';
import { createSignal, Show, ErrorBoundary as SolidErrorBoundary } from 'solid-js';

/**
 * Props for ErrorBoundary component
 *
 * The ErrorBoundary wraps SolidJS `<ErrorBoundary>` to provide localized error notifications
 * and a retry-friendly fallback UI. It deduplicates error notifications to prevent spam.
 *
 * @property children - Content to wrap with error boundary protection
 */
export interface ErrorBoundaryProps {
  readonly children?: ComponentChildren;
}

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
    if (retryCount() >= 3) return;
    setLastError(undefined);
    setCaughtError(undefined);
    setRetryCount((c) => c + 1);
    setMounted(false);
    queueMicrotask(() => setMounted(true));
  };

  const getRetryLabel = (): string => {
    if (retryCount() >= 3) return 'No more retries';
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
                disabled={retryCount() >= 3}
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
