import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  formatErrorMessage,
  formatErrorForLogging,
  createErrorContext,
  type ErrorContext,
  type FormattedError,
} from '../../../src/shared/services/error-formatter';

describe('Error formatter', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns compact formatted error data', () => {
    const context: ErrorContext = {
      environment: 'userscript',
      method: 'GET',
      url: 'https://api.example.com/data',
      status: 403,
      timeout: undefined,
      message: 'Forbidden',
    };

    const formatted: FormattedError = formatErrorMessage(context);

    expect(formatted.message).toContain('[GET] https://api.example.com/data failed');
    expect(formatted.context).toContain('Environment: userscript');
    expect(formatted.userFriendlyMessage).toBe('Request failed (403).');
  });

  it('prints simplified log output', () => {
    const context = createErrorContext('GET', 'https://api.example.com/data', 500, 'Server error');
    const logMessage = formatErrorForLogging(new Error('Request failed'), context);

    expect(logMessage).toContain('HTTP Request Error');
    expect(logMessage).toContain('Server error');
    expect(logMessage).not.toContain('Retryable');
  });

  it('preserves custom timeout metadata', () => {
    const context = createErrorContext('POST', 'https://api.example.com/data', 408, 'Timeout', {
      timeout: 3000,
      message: 'Custom timeout',
    });

    expect(context.timeout).toBe(3000);
    expect(context.message).toBe('Custom timeout');
  });
});
