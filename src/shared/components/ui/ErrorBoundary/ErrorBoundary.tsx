// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Wraps SolidJS `<ErrorBoundary>` with localized error notifications.
 * Provides a retry-friendly fallback UI and deduplicates error notifications.
 */

import type { ThemeSetting } from '@constants/setting-options';
import { getNotificationAdapter, notifySafely } from '@platform/index';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import type { TranslationKey } from '@shared/i18n/types';
import { getLanguageService } from '@shared/services/language-service';
import type { ComponentChildren } from '@shared/utils/solid/accessor-utils';
import type { JSXElement } from 'solid-js';
import {
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  Show,
  ErrorBoundary as SolidErrorBoundary,
  splitProps,
} from 'solid-js';
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
  readonly dir?: 'ltr' | 'rtl';
  readonly lang?: string;
  readonly onClose?: () => void;
  /**
   * Called when the error boundary catches a render error.
   * Use this to perform emergency cleanup (e.g., restoring body styles)
   * that would normally happen in onCleanup hooks of child components.
   */
  readonly onError?: (error: unknown) => void;
  /** Effective theme used by the recovery surface. */
  readonly theme?: 'light' | 'dark';
  /** Persisted theme preference exposed to the Quiet Instruments adapter. */
  readonly themeSetting?: ThemeSetting;
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
  const [local] = splitProps(props, [
    'children',
    'dir',
    'lang',
    'onClose',
    'onError',
    'theme',
    'themeSetting',
  ]);
  const [lastError, setLastError] = createSignal<unknown>(undefined);
  const [caughtError, setCaughtError] = createSignal<unknown>(undefined);
  const [mounted, setMounted] = createSignal(true);
  const [retryCount, setRetryCount] = createSignal(0);
  const titleId = createUniqueId();
  const bodyId = createUniqueId();

  let autoResetTimer: ReturnType<typeof setTimeout> | undefined;
  let recoveryFocus: HTMLElement | null = null;

  const translatedError = createMemo(() => {
    const error = caughtError();
    void local.lang;
    return error === undefined ? undefined : translateError(error);
  });

  const clearAutoReset = (): void => {
    if (!autoResetTimer) return;
    clearTimeout(autoResetTimer);
    autoResetTimer = undefined;
  };

  const restoreRecoveryFocus = (): void => {
    if (!recoveryFocus?.isConnected) return;
    try {
      recoveryFocus.focus({ preventScroll: true });
    } catch {
      // The host may have replaced the element during SPA navigation.
    }
  };

  const scheduleAutoReset = (): void => {
    if (autoResetTimer) clearTimeout(autoResetTimer);
    autoResetTimer = setTimeout(() => {
      handleReset();
    }, AUTO_RESET_MS);
  };

  onCleanup(() => {
    clearAutoReset();
  });

  const notifyError = (error: unknown): void => {
    if (lastError() === error) return;
    setLastError(error);
    const { title, body } = translateError(error);
    notifySafely(getNotificationAdapter(), title, body);
  };

  const handleRetry = (): void => {
    if (retryCount() >= MAX_RETRIES) return;
    restoreRecoveryFocus();
    setLastError(undefined);
    setCaughtError(undefined);
    const nextCount = retryCount() + 1;
    setRetryCount(nextCount);
    setMounted(false);
    queueMicrotask(() => setMounted(true));
  };

  const handleReset = (): void => {
    clearAutoReset();
    restoreRecoveryFocus();
    setLastError(undefined);
    setCaughtError(undefined);
    setRetryCount(0);
    setMounted(false);
    queueMicrotask(() => setMounted(true));
  };

  const handleClose = (): void => {
    clearAutoReset();
    restoreRecoveryFocus();
    setCaughtError(undefined);
    setMounted(false);
    local.onClose?.();
  };

  const translate = (key: TranslationKey, fallback: string): string => {
    // Track the language prop so labels refresh if settings change while the
    // modeless recovery surface is visible.
    void local.lang;
    try {
      return getLanguageService().translate(key);
    } catch {
      return fallback;
    }
  };

  const getRetryLabel = (): string =>
    retryCount() >= MAX_RETRIES
      ? translate('msg.err.noMoreRetries', 'No more retries')
      : translate('msg.err.retry', 'Retry');

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
            local.onError?.(error);
            recoveryFocus =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
            if (retryCount() >= MAX_RETRIES) scheduleAutoReset();
            return null;
          }}
        >
          {local.children}
        </SolidErrorBoundary>
      </Show>
      <Show when={caughtError()}>
        <section
          aria-describedby={bodyId}
          aria-labelledby={titleId}
          class={`${styles.recoveryRoot} xeg-theme-scope pp-design`}
          data-pp-product="xeg"
          data-pp-theme={local.themeSetting ?? 'auto'}
          data-theme={local.theme ?? 'light'}
          data-xeg-error-boundary=""
          dir={local.dir ?? 'ltr'}
          lang={local.lang ?? 'en'}
        >
          <div class={styles.recoveryPanel}>
            <div aria-atomic="true" class={styles.recoveryMessage} role="alert">
              <h2 class={styles.recoveryTitle} id={titleId}>
                {translatedError()?.title}
              </h2>
              <p class={styles.recoveryBody} id={bodyId}>
                {translatedError()?.body}
              </p>
            </div>
            <div class={styles.recoveryActions}>
              <button
                class={styles.recoveryAction}
                data-xeg-error-action="retry"
                disabled={retryCount() >= MAX_RETRIES}
                onClick={handleRetry}
                type="button"
              >
                {getRetryLabel()}
              </button>
              <Show when={retryCount() >= MAX_RETRIES}>
                <button
                  class={`${styles.recoveryAction} ${styles.recoveryReset}`}
                  data-xeg-error-action="reset"
                  onClick={handleReset}
                  type="button"
                >
                  {translate('msg.err.reset', 'Reset')}
                </button>
              </Show>
              <button
                class={`${styles.recoveryAction} ${styles.recoveryClose}`}
                data-xeg-error-action="close"
                onClick={handleClose}
                type="button"
              >
                {translate('tb.cls', 'Close')}
              </button>
            </div>
          </div>
        </section>
      </Show>
    </>
  );
}
