// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Error reporting: pre-bound reporters for each context.
 */

import { logger } from '@shared/logging/logger';

const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

function ensureErrorMessage(message: string, fallback: string = UNKNOWN_ERROR_MESSAGE): string {
  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function normalizeErrorMessage(error: unknown): string {
  try {
    if (error instanceof Error) {
      return ensureErrorMessage(error.message, ensureErrorMessage(error.name, 'Error'));
    }
    if (typeof error === 'string') return ensureErrorMessage(error);
    if (error == null) return UNKNOWN_ERROR_MESSAGE;
    if (typeof error === 'object') {
      const msg = (error as Record<string, unknown>).message;
      if (typeof msg === 'string') return ensureErrorMessage(msg);
    }
    return ensureErrorMessage(String(error));
  } catch {
    return UNKNOWN_ERROR_MESSAGE;
  }
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
