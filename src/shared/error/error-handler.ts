// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Global error handler for uncaught errors and unhandled rejections
 * @description Singleton service that captures and logs runtime errors (dev mode).
 */

import { getEventManager } from '@shared/container/container';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import { SingletonBase } from '@shared/services/singleton-base';

const formatErrorLocation = (
  filename: string | undefined,
  lineno: number | undefined,
  colno: number | undefined
): string | undefined => filename && `${filename}:${lineno ?? 0}:${colno ?? 0}`;

const formatRejectionMessage = (reason: unknown): string => {
  const message = normalizeErrorMessage(reason);
  if (reason instanceof Error) return message;
  if (typeof reason === 'string') return message;
  return `Unhandled rejection: ${message}`;
};

let _errorHandlerInstance: GlobalErrorHandler | null = null;

export class GlobalErrorHandler {
  private isInitialized = false;
  private controller: AbortController | null = null;

  private constructor() {}

  public static getInstance(): GlobalErrorHandler {
    return SingletonBase.get(
      () => _errorHandlerInstance,
      (inst) => {
        _errorHandlerInstance = inst;
      },
      () => new GlobalErrorHandler()
    );
  }

  public static resetForTests(): void {
    SingletonBase.reset(
      () => _errorHandlerInstance,
      (inst) => {
        _errorHandlerInstance = inst;
      }
    );
  }

  public destroy(): void {
    this.controller?.abort();
    this.controller = null;
    getEventManager().removeByContext('global-error-handler');
    this.isInitialized = false;
  }

  private readonly errorListener = (event: ErrorEvent): void => {
    const message = event.message || 'Unknown error';
    const location = formatErrorLocation(event.filename, event.lineno, event.colno);
    if (__DEV__) {
      logger.error(`[UncaughtError] ${message}`, {
        type: 'uncaught-error',
        location,
        error: event.error,
      });
    }
  };

  private readonly rejectionListener = (event: PromiseRejectionEvent): void => {
    const message = formatRejectionMessage(event.reason);
    if (__DEV__) {
      logger.error(`[UnhandledRejection] ${message}`, {
        type: 'unhandled-rejection',
        reason: event.reason,
      });
    }
  };

  /**
   * Initialize the global error handler.
   * Sets up listeners for uncaught errors and unhandled promise rejections.
   * Safe to call multiple times - subsequent calls are ignored.
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    const eventManager = getEventManager();
    this.controller = new AbortController();

    eventManager.addEventListener(window, 'error', this.errorListener as EventListener, {
      signal: this.controller.signal,
      context: 'global-error-handler',
    });

    eventManager.addEventListener(
      window,
      'unhandledrejection',
      this.rejectionListener as EventListener,
      {
        signal: this.controller.signal,
        context: 'global-error-handler',
      }
    );

    this.isInitialized = true;
  }
}
