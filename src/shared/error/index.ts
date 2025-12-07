export type {
  ContextBoundReporter,
  ErrorContext,
  ErrorReportOptions,
  ErrorReportResult,
  ErrorSeverity,
} from './app-error-reporter';
export {
  AppErrorReporter,
  bootstrapErrorReporter,
  downloadErrorReporter,
  eventErrorReporter,
  galleryErrorReporter,
  mediaErrorReporter,
  networkErrorReporter,
  normalizeErrorMessage,
  settingsErrorReporter,
  storageErrorReporter,
  uiErrorReporter,
} from './app-error-reporter';
export { GlobalErrorHandler, globalErrorHandler } from './error-handler';

// Higher-Order Function pattern (functional alternative)
export type {
  ErrorHandlingOptions,
  ErrorHandlingResult,
  ResultHandlingOptions,
} from './error-handling-hof';
export {
  // Pre-bound context handlers
  bootstrapErrors,
  // Factory
  createErrorHandlers,
  downloadErrors,
  eventErrors,
  galleryErrors,
  mediaErrors,
  networkErrors,
  settingsErrors,
  storageErrors,
  // One-off utilities
  tryAsync,
  trySync,
  uiErrors,
  // HOFs (legacy ErrorHandlingResult pattern)
  withErrorHandling,
  withErrorResult,
  // HOFs (Result<T> pattern)
  withResultHandling,
  withSyncErrorHandling,
  withSyncErrorResult,
  withSyncResultHandling,
} from './error-handling-hof';
