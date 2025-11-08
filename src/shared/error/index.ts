/**
 * @fileoverview Global Error Handler Index - Public API
 * @version 2.1.0 - Phase 196: Window-level exception handling
 * @phase 401: Enhanced documentation and API clarity
 *
 * @section System Purpose
 * Central export point for the error handling module. Provides singleton access to
 * the global error handler implementation.
 *
 * This module specifically handles window-level errors:
 * - **Uncaught Errors**: JavaScript exceptions not caught by try-catch
 * - **Unhandled Rejections**: Promise rejections without .catch() handlers
 *
 * @note For application-level error handling, see @shared/utils/error-handling.ts
 * This module is specialized for browser global scope error capture only.
 *
 * @section Architecture
 * **Singleton Pattern**: GlobalErrorHandler maintains single instance
 * **Lifecycle Management**: initialize() / destroy() pair for resource cleanup
 * **Logging Integration**: All errors routed through @shared/logging
 *
 * @section Exported Components
 * - **GlobalErrorHandler**: Class implementing singleton pattern
 * - **globalErrorHandler**: Singleton instance for global access
 *
 * @section Usage Patterns
 * ```typescript
 * // Bootstrap initialization
 * import { globalErrorHandler } from '@shared/error';
 * globalErrorHandler.initialize();
 * ```
 *
 * @section Lifecycle
 * 1. **Application Start**: Call globalErrorHandler.initialize()
 * 2. **Error Occurs**: Handler captures and logs automatically
 * 3. **Application End**: Call globalErrorHandler.destroy() (optional but recommended)
 *
 * @section Design Principles
 * - **Centralization**: Single point for all window-level errors
 * - **Logging Correlation**: Integration with @shared/logging for tracing
 * - **Development Support**: Enhanced debugging in dev mode
 * - **Production Stability**: Graceful error handling without crashes
 *
 * @section Related Modules
 * - [@shared/logging](../logging/README.md) - Logging and tracing infrastructure
 * - [@shared/utils/error-handling](../utils/error-handling.ts) - Application error utilities
 * - [@shared/types/result.types](../types/result.types.ts) - Result pattern utilities
 *
 * @author X.com Enhanced Gallery | Phase 401 Optimization
 */

export { GlobalErrorHandler, globalErrorHandler } from './error-handler';
