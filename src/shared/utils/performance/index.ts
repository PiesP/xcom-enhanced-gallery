/**
 * @fileoverview Performance utilities exports - Phase 5 Bundle Optimization
 */

export * from '@shared/services/unified-performance-service';

// Re-export main functions for easier access
export {
  rafThrottle,
  createDebouncer,
  measurePerformance,
} from '@shared/services/unified-performance-service';
