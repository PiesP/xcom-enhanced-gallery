/**
 * @fileoverview Error Boundary Barrel Export
 * @version 1.0.0
 * @description Public API for ErrorBoundary component
 * @module shared/components/ui/ErrorBoundary
 *
 * **Export Strategy**:
 * - Lazy: Dynamic import (Phase 385+)
 * - Type-safe: Full type annotations
 * - ESM: ES module syntax only
 *
 * **Usage**:
 * ```tsx
 * // Lazy import
 * const { ErrorBoundary } = await import('@shared/components/ui/ErrorBoundary');
 *
 * // Direct import (not recommended)
 * import { ErrorBoundary } from '@shared/components/ui/ErrorBoundary';
 * ```
 */

export { ErrorBoundary, default } from './ErrorBoundary';
