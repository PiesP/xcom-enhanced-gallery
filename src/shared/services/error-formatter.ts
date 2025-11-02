/**
 * HTTP Error Context Formatter - Phase 314-6
 * Provides environment-aware error messages with recovery strategies
 *
 * @see src/shared/services/http-request-service.ts
 * @see docs/ARCHITECTURE.md - Phase 314
 */

import { logger } from '../logging';
import { detectEnvironment, getEnvironmentDescription } from '../external/userscript';

/**
 * Error severity levels - Phase 314-6
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Recovery strategy recommendations - Phase 314-6
 */
export enum ErrorRecoveryStrategy {
  RETRY_IMMEDIATE = 'retry-immediate',
  RETRY_EXPONENTIAL = 'retry-exponential',
  INCREASE_TIMEOUT = 'increase-timeout',
  CHECK_CREDENTIALS = 'check-credentials',
  CHECK_PERMISSIONS = 'check-permissions',
  VERIFY_URL = 'verify-url',
  CHECK_NETWORK = 'check-network',
  REPORT_SERVER_ERROR = 'report-server-error',
  NONE = 'none',
}

/**
 * Context information for error formatting - Phase 314-6
 */
export interface ErrorContext {
  environment: 'userscript' | 'test' | 'extension' | 'console';
  method: string;
  url: string;
  status: number;
  timeout: number | undefined;
  message: string;
}

/**
 * Formatted error message with context - Phase 314-6
 */
export interface FormattedError {
  message: string;
  context: string;
  suggestion: string;
  canRetry: boolean;
  severity: ErrorSeverity;
  recoveryStrategy: ErrorRecoveryStrategy;
  userFriendlyMessage: string;
}

/**
 * Helper: Get severity level for HTTP status - Phase 314-6
 */
function getSeverityLevel(status: number): ErrorSeverity {
  if (status === 0 || status === undefined) return ErrorSeverity.HIGH;
  if (status >= 500) return ErrorSeverity.HIGH;
  if (status === 401 || status === 403) return ErrorSeverity.MEDIUM;
  if (status === 404) return ErrorSeverity.LOW;
  return ErrorSeverity.MEDIUM;
}

/**
 * Helper: Get recovery strategy - Phase 314-6
 */
function getRecoveryStrategy(
  status: number,
  _environment: string,
  hasTimeout: boolean
): ErrorRecoveryStrategy {
  if (hasTimeout) return ErrorRecoveryStrategy.INCREASE_TIMEOUT;
  if (status === 0 || status === undefined) return ErrorRecoveryStrategy.CHECK_NETWORK;
  if (status === 401) return ErrorRecoveryStrategy.CHECK_CREDENTIALS;
  if (status === 403) return ErrorRecoveryStrategy.CHECK_PERMISSIONS;
  if (status === 404) return ErrorRecoveryStrategy.VERIFY_URL;
  if (status === 429) return ErrorRecoveryStrategy.RETRY_EXPONENTIAL;
  if (status >= 500) return ErrorRecoveryStrategy.RETRY_EXPONENTIAL;
  if (status >= 400) return ErrorRecoveryStrategy.RETRY_IMMEDIATE;
  return ErrorRecoveryStrategy.RETRY_IMMEDIATE;
}

/**
 * Helper: Get user-friendly error message - Phase 314-6
 */
function getUserFriendlyMessage(status: number): string {
  if (status === 0 || status === undefined) {
    return '❌ Network connection failed. Check your internet connection.';
  }
  if (status === 401) {
    return '🔐 Authentication failed. Please log in again.';
  }
  if (status === 403) {
    return '⛔ You do not have permission to access this resource.';
  }
  if (status === 404) {
    return '🔍 The requested resource was not found.';
  }
  if (status === 429) {
    return '⏱️ Too many requests. Please wait a moment and try again.';
  }
  if (status >= 500) {
    return '⚠️ The server is experiencing issues. Please try again later.';
  }
  if (status >= 400) {
    return `❌ Request error (${status}). Please check your input.`;
  }
  return `❌ An error occurred (${status}). Please try again.`;
}

/**
 * Get environment-specific error message - Phase 314-6
 *
 * @param context Error context information
 * @returns Formatted error with actionable suggestions and recovery strategies
 *
 * @example
 * ```typescript
 * const context: ErrorContext = {
 *   environment: 'userscript',
 *   method: 'GET',
 *   url: 'https://api.example.com/data',
 *   status: 403,
 *   message: 'Forbidden'
 * };
 * const formatted = formatErrorMessage(context);
 * console.error(formatted.userFriendlyMessage);
 * ```
 */
export function formatErrorMessage(context: ErrorContext): FormattedError {
  const env = detectEnvironment();
  const envDescription = getEnvironmentDescription(env);

  // Build message based on error type
  const baseMessage = `[${context.method}] ${context.url} failed`;
  const statusInfo = context.status ? ` (Status: ${context.status})` : '';
  const message = `${baseMessage}${statusInfo}: ${context.message}`;

  // Determine error severity and recovery strategy
  const severity = getSeverityLevel(context.status);
  const hasTimeout = !!context.timeout;
  const recoveryStrategy = getRecoveryStrategy(context.status, context.environment, hasTimeout);
  const userFriendlyMessage = getUserFriendlyMessage(context.status);

  // Provide context-specific suggestions
  let suggestion = '';
  let canRetry = true;

  // Check timeout first (has priority)
  if (context.timeout) {
    suggestion = `Request timeout after ${context.timeout}ms. Try increasing timeout duration or check network connectivity.`;
    canRetry = true;
  } else if (context.status === 0 || context.status === undefined) {
    // Network error (CORS, timeout, connection refused)
    if (context.environment === 'userscript') {
      suggestion =
        'Network error in Tampermonkey. Verify @connect directives in UserScript header allow this domain.';
    } else if (context.environment === 'test') {
      suggestion = 'Network error in test environment. Mock fetch API if testing HTTP requests.';
    } else if (context.environment === 'extension') {
      suggestion =
        'Network error in extension. Check manifest.json permissions for cross-origin requests.';
    } else {
      suggestion =
        'Network error. Verify CORS headers are configured and target URL is accessible.';
    }
    canRetry = true;
  } else if (context.status === 401) {
    suggestion =
      'Unauthorized access. Verify authentication credentials are valid and not expired.';
    canRetry = false;
  } else if (context.status === 403) {
    suggestion =
      'Access denied. Check user permissions for this resource. You may need elevated privileges.';
    canRetry = false;
  } else if (context.status === 404) {
    suggestion = 'Resource not found. Verify the URL path is correct and the resource exists.';
    canRetry = false;
  } else if (context.status === 429) {
    suggestion = 'Too many requests. Implement exponential backoff and retry after a delay.';
    canRetry = true;
  } else if (context.status >= 500) {
    suggestion =
      'Server error detected. Retry after a short delay. If persists, report to server administrators.';
    canRetry = true;
  } else if (context.status >= 400) {
    suggestion = 'Client error. Check request parameters and method are correct.';
    canRetry = false;
  }

  const contextStr = `Environment: ${context.environment} | ${envDescription}`;

  logger.debug('[HttpErrorFormatter]', {
    message,
    context: contextStr,
    suggestion,
    severity,
    recoveryStrategy,
    userFriendlyMessage,
    canRetry,
  });

  return {
    message,
    context: contextStr,
    suggestion,
    canRetry,
    severity,
    recoveryStrategy,
    userFriendlyMessage,
  };
}

/**
 * Format error for logging with full context
 *
 * @param error Error instance or message
 * @param context HTTP request context
 * @returns Console-friendly error message
 */
export function formatErrorForLogging(error: Error | string, context: ErrorContext): string {
  const formatted = formatErrorMessage(context);
  const errorMsg = typeof error === 'string' ? error : error.message;

  return `
❌ HTTP Request Error
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formatted.message}
${formatted.context}
Suggestion: ${formatted.suggestion}
Retryable: ${formatted.canRetry ? '✅ Yes' : '❌ No'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Original: ${errorMsg}
  `.trim();
}

/**
 * Create error context from HTTP response
 *
 * @param method HTTP method (GET, POST, etc)
 * @param url Request URL
 * @param status HTTP status code
 * @param statusText HTTP status text
 * @param options Optional request parameters
 * @returns Error context for formatting
 */
export function createErrorContext(
  method: string,
  url: string,
  status: number,
  statusText: string,
  options?: {
    timeout?: number;
    message?: string;
  }
): ErrorContext {
  const env = detectEnvironment();

  return {
    environment: env.environment,
    method,
    url,
    status,
    timeout: options?.timeout ?? undefined,
    message: options?.message || statusText,
  };
}
