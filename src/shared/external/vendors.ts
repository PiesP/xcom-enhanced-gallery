/**
 * Alias shim for @shared/external/vendors
 * Some tools/plugins struggle with directory index resolution on Windows.
 * This file re-exports the intended public API from the vendors directory.
 */
// NOTE: The correct relative path is './vendors/index' because this file
// lives in 'src/shared/external/'. Using './external/vendors/index' would
// incorrectly resolve to 'src/shared/external/external/vendors/index'.
export * from './vendors/index';
