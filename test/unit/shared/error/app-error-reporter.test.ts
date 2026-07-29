// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { afterEach, describe, expect, it, vi } from 'vitest';

const { logger } = vi.hoisted(() => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@shared/logging/logger', () => ({ logger }));

import {
  galleryErrorReporter,
  normalizeErrorMessage,
} from '@shared/error/app-error-reporter';

describe('app error reporter', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reports warnings and errors through the production-capable logger', () => {
    galleryErrorReporter.warn('slow response', { code: 'SLOW' });
    galleryErrorReporter.error(new Error('failed'), { code: 'FAILED' });
    galleryErrorReporter.critical(new Error('fatal'), { code: 'FATAL' });

    expect(logger.warn).toHaveBeenCalledWith(
      'slow response',
      expect.objectContaining({ context: 'gallery', severity: 'warning', code: 'SLOW' })
    );
    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith(
      'failed',
      expect.objectContaining({ context: 'gallery', severity: 'error', code: 'FAILED' })
    );
    expect(logger.error).toHaveBeenCalledWith(
      'fatal',
      expect.objectContaining({ context: 'gallery', severity: 'critical', code: 'FATAL' })
    );
  });

  it('normalizes empty user-facing errors to a non-empty fallback', () => {
    expect(normalizeErrorMessage('')).toBe('Unknown error');
    expect(normalizeErrorMessage('   ')).toBe('Unknown error');
    expect(normalizeErrorMessage({ message: '' })).toBe('Unknown error');
    expect(normalizeErrorMessage({ toString: () => '' })).toBe('Unknown error');
    expect(normalizeErrorMessage('  failed  ')).toBe('failed');
    expect(normalizeErrorMessage({ message: '  failed  ' })).toBe('failed');
    expect(normalizeErrorMessage(Object.create(null))).toBe('Unknown error');
    expect(
      normalizeErrorMessage({
        toString: () => {
          throw new Error('conversion failed');
        },
      })
    ).toBe('Unknown error');
  });
});
