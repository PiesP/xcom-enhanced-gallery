/**
 * Error codes for machine-readable error identification.
 *
 * Using const object instead of enum for tree-shaking optimization.
 */
export const ErrorCode = {
  NONE: 'NONE',
  CANCELLED: 'CANCELLED',
  EMPTY_INPUT: 'EMPTY_INPUT',
  ALL_FAILED: 'ALL_FAILED',
  NO_MEDIA_FOUND: 'NO_MEDIA_FOUND',
} as const;

/** Type for ErrorCode values */
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
