export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

export type ErrorContext =
  | 'bootstrap'
  | 'gallery'
  | 'media'
  | 'download'
  | 'settings'
  | 'theme'
  | 'event'
  | 'network'
  | 'storage'
  | 'ui'
  | 'unknown';

export interface ErrorReportOptions {
  readonly context: ErrorContext;
  readonly severity?: ErrorSeverity;
  readonly metadata?: Record<string, unknown>;
  readonly notify?: boolean;
  readonly code?: string;
}

export interface ErrorReportResult {
  readonly reported: boolean;
  readonly message: string;
  readonly context: ErrorContext;
  readonly severity: ErrorSeverity;
}

export interface ContextBoundReporter {
  critical: (
    error: unknown,
    options?: Partial<Omit<ErrorReportOptions, 'context'>>
  ) => ErrorReportResult;
  error: (
    error: unknown,
    options?: Partial<Omit<ErrorReportOptions, 'context'>>
  ) => ErrorReportResult;
  warn: (
    error: unknown,
    options?: Partial<Omit<ErrorReportOptions, 'context'>>
  ) => ErrorReportResult;
  info: (
    error: unknown,
    options?: Partial<Omit<ErrorReportOptions, 'context'>>
  ) => ErrorReportResult;
}
