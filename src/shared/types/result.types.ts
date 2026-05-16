/**
 * Error codes for machine-readable error identification.
 *
 * Using const object instead of enum for tree-shaking optimization.
 */
export const ErrorCode = {
  // Generic error codes
  NONE: 'NONE',
  CANCELLED: 'CANCELLED',
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  EMPTY_INPUT: 'EMPTY_INPUT',
  ALL_FAILED: 'ALL_FAILED',
  PARTIAL_FAILED: 'PARTIAL_FAILED',
  UNKNOWN: 'UNKNOWN',

  // Media extraction specific error codes
  ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND',
  INVALID_ELEMENT: 'INVALID_ELEMENT',
  NO_MEDIA_FOUND: 'NO_MEDIA_FOUND',
  INVALID_URL: 'INVALID_URL',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

/** Type for ErrorCode values */
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
