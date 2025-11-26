/**
 * Logging Infrastructure Barrel Export Module
 *
 * **Purpose**: Central export point for all logging utilities, types, and interfaces.
 * Provides production-safe logging with automatic tree-shaking of debug code.
 *
 * **Version**: 2.1.0
 * **Phase**: 378 - Logging Infrastructure Optimization
 * **Status**: ✅ Complete (Phase 137, 290 integrated, English-only documentation)
 *
 * **Exported Modules**:
 * 1. **Logger** (logger.ts)
 *    - Core logging system with multi-level support (debug, info, warn, error)
 *    - Scoped loggers for automatic prefix management
 *    - Tree-shaking: All debug code removed in production
 *
 * **Usage Examples**:
 * ```typescript
 * // Basic logging
 * import { logger, createScopedLogger } from '@shared/logging';
 * logger.info('App initialized');
 *
 * // Scoped logger
 * const slog = createScopedLogger('MediaExtractor');
 * slog.debug('Processing:', url);
 * slog.error('Failed:', error);
 * ```
 *
 * **Development vs Production**:
 * - **Dev**: Full logging (debug+), timestamps, stack traces
 * - **Prod**: Warn+ only, minimal output, zero overhead from removed code
 * - **Test**: Error level only (suppresses console noise)
 *
 * **Architecture**:
 * ```
 * Application Code
 *   ↓
 * Logger Interface (Logger)
 *   ↓
 * (Dev) Full Implementation | (Prod) Minimal Implementation
 *   ↓
 * console.log/warn/error
 * ```
 *
 * **Tree-Shaking Impact**:
 * - Development code completely removed in production build
 * - Debug methods become no-ops (tree-shaken)
 * - Performance: No runtime overhead in production
 *
 * **Global Exposure** (Dev Only):
 * - Logging helpers are intentionally not exposed globally (Phase 420)
 *
 * @related [Services](../services/), [Utils](../utils/)
 */

// Logger
export { createLogger, logger, createScopedLogger, logError } from './logger';

export type { LogLevel, LoggableData, Logger } from './logger';
