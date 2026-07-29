// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Error reporting: pre-bound reporters for each context.
 */

import { logger } from '@shared/logging/logger';

const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

function ensureErrorMessage(message: string, fallback: string = UNKNOWN_ERROR_MESSAGE): string {
  return message.trim().length > 0 ? message : fallback;
}

export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return ensureErrorMessage(error.message, ensureErrorMessage(error.name, 'Error'));
  }
  if (typeof error === 'string') return ensureErrorMessage(error);
  if (error == null) return UNKNOWN_ERROR_MESSAGE;
  if (typeof error === 'object') {
    const msg = (error as Record<string, unknown>).message;
    if (typeof msg === 'string' && msg.trim().length > 0) return msg;
    // JSON.stringify on Error objects always returns '{}';
    // fall through to String() for a meaningful representation.
    return ensureErrorMessage(String(error));
  }
  return ensureErrorMessage(String(error));
}

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

interface ReporterOptions {
  readonly code?: string;
  readonly metadata?: Record<string, unknown>;
}

interface ErrorReporter {
  critical: (error: unknown, options?: ReporterOptions) => void;
  error: (error: unknown, options?: ReporterOptions) => void;
  warn: (error: unknown, options?: ReporterOptions) => void;
  info: (error: unknown, options?: ReporterOptions) => void;
}

function createReporter(context: string): ErrorReporter {
  const report = (severity: ErrorSeverity) => (error: unknown, options?: ReporterOptions) => {
    const message = normalizeErrorMessage(error);
    const payload: Record<string, unknown> = { context, severity };
    if (options?.code) payload.code = options.code;
    if (options?.metadata) payload.metadata = options.metadata;

    if (severity === 'info') {
      if (__DEV__) logger.info(message, payload);
    } else if (severity === 'warning') {
      logger.warn(message, payload);
    } else {
      logger.error(message, payload);
    }
  };

  return {
    critical: report('critical'),
    error: report('error'),
    warn: report('warning'),
    info: report('info'),
  };
}

export const bootstrapErrorReporter = createReporter('bootstrap');
export const galleryErrorReporter = createReporter('gallery');
export const mediaErrorReporter = createReporter('media');
export const settingsErrorReporter = createReporter('settings');
