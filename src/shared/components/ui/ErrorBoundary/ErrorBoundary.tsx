// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Wraps SolidJS `<ErrorBoundary>` with localized error notifications.
 * Provides a retry-friendly fallback UI and deduplicates error notifications.
 */

import { getNotificationAdapter } from '@platform/index';
import { getLanguageService } from '@shared/container/container';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import type { ComponentChildren } from '@shared/utils/solid/accessor-utils';
import type { JSXElement } from 'solid-js';
import { createSignal, onCleanup, Show, ErrorBoundary as SolidErrorBoundary } from 'solid-js';
import styles from './ErrorBoundary.module.css';

/** Maximum number of retry attempts before disabling the retry button. */
const MAX_RETRIES = 3;

/** Auto-reset timeout in milliseconds after retries are exhausted. */
const AUTO_RESET_MS = 30_000;

/**
 * Props for ErrorBoundary component
 *
 * The ErrorBoundary wraps SolidJS `<ErrorBoundary>` to provide localized error notifications
 * and a retry-friendly fallback UI. It deduplicates error notifications to prevent spam.
 * @property children - Content to wrap with error boundary protection
 */
export interface ErrorBoundaryProps {
  readonly children?: ComponentChildren;
  /**
   * Called when the error boundary catches a render error.
   * Use this to perform emergency cleanup (e.g., restoring body styles)
   * that would normally happen in onCleanup hooks of child components.
   */
  readonly onError?: (error: unknown) => void;
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

  let autoResetTimer: ReturnType<typeof setTimeout> | undefined;

  const scheduleAutoReset = (): void => {
    if (autoResetTimer) clearTimeout(autoResetTimer);
    autoResetTimer = setTimeout(() => {
      handleReset();
    }, AUTO_RESET_MS);
  };

  onCleanup(() => {
    if (autoResetTimer) clearTimeout(autoResetTimer);
  });

  const notifyError = (error: unknown): void => {
    if (lastError() === error) return;
    setLastError(error);
    const { title, body } = translateError(error);
    getNotificationAdapter().notify(title, body);
  };

  const handleRetry = (): void => {
    if (retryCount() >= MAX_RETRIES) return;
    setLastError(undefined);
    setCaughtError(undefined);
    const nextCount = retryCount() + 1;
    setRetryCount(nextCount);
    setMounted(false);
    queueMicrotask(() => setMounted(true));
    if (nextCount >= MAX_RETRIES) {
      scheduleAutoReset();
    }
  };

  const handleReset = (): void => {
    if (autoResetTimer) {
      clearTimeout(autoResetTimer);
      autoResetTimer = undefined;
    }
    setLastError(undefined);
    setCaughtError(undefined);
    setRetryCount(0);
    setMounted(false);
    queueMicrotask(() => setMounted(true));
  };

  const getRetryLabel = (): string => {
    try {
      const lang = getLanguageService();
      if (retryCount() >= MAX_RETRIES) return lang.translate('msg.err.noMoreRetries');
      return lang.translate('msg.err.retry');
    } catch {
      if (retryCount() >= MAX_RETRIES) return 'No more retries';
      return 'Retry';
    }
  };

  return (
    <>
      <Show when={mounted()}>
        <SolidErrorBoundary
          fallback={(error) => {
            notifyError(error);
            setCaughtError(error);
            // Invoke emergency cleanup callback so parent can restore global
            // state (e.g., body scroll lock) that child onCleanup hooks
            // will never fire for because the render errored.
            props.onError?.(error);
            return null;
          }}
        >
          {props.children}
        </SolidErrorBoundary>
      </Show>
      <Show when={caughtError()}>
        {(error) => {
          const { title, body } = translateError(error());
          const exhausted = retryCount() >= MAX_RETRIES;
          return (
            <div aria-live="polite" data-xeg-error-boundary="">
              <p class={styles['xeg-error-boundary__title']}>{title}</p>
              <p class={styles['xeg-error-boundary__body']}>{body}</p>
              <button
                class={styles['xeg-error-boundary__action']}
                disabled={exhausted}
                onClick={handleRetry}
                type="button"
              >
                {getRetryLabel()}
              </button>
              <Show when={exhausted}>
                <button
                  class={`${styles['xeg-error-boundary__action']} ${styles['xeg-error-boundary__reset']}`}
                  onClick={handleReset}
                  type="button"
                >
                  {(() => {
                    try {
                      const lang = getLanguageService();
                      return lang.translate('msg.err.reset');
                    } catch {
                      return 'Reset';
                    }
                  })()}
                </button>
              </Show>
            </div>
          );
        }}
      </Show>
    </>
  );
}
