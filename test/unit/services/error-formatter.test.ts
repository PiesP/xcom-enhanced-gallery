import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { logError, logger } from '../../../src/shared/logging';

describe('Logger error helper (Phase 321)', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs error objects with context and source information', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

    const error = new Error('Download failed');
    logError(error, { mediaId: '123' }, 'BulkDownload');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [message, context] = errorSpy.mock.calls[0] as [string, Record<string, unknown>];

    expect(message).toContain('Error in BulkDownload: Download failed');
    expect(context).toMatchObject({
      source: 'BulkDownload',
      context: { mediaId: '123' },
    });
    expect(typeof context.timestamp).toBe('string');

    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy.mock.calls[0]?.[0]).toBe('Error stack:');
    expect(debugSpy.mock.calls[0]?.[1]).toBe(error.stack);
  });

  it('logs string errors without debug stack output', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

    logError('Network failure', { url: 'https://example.com' }, 'HttpRequestService');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [message, context] = errorSpy.mock.calls[0] as [string, Record<string, unknown>];

    expect(message).toBe('Error in HttpRequestService: Network failure');
    expect(context).toMatchObject({
      source: 'HttpRequestService',
      context: { url: 'https://example.com' },
    });

    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('falls back to empty context when none provided', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    logError('Generic failure');

    const [, context] = errorSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(context.context).toEqual({});
    expect(typeof context.timestamp).toBe('string');
  });
});
