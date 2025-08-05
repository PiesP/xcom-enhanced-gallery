/**
 * @fileoverview Performance utilities exports - Phase 5 Bundle Optimization
 */

export * from './performance-utils-enhanced';

// Re-export main functions for easier access
export {
  rafThrottle,
  throttle,
  debounce,
  createDebouncer,
  measurePerformance,
} from './performance-utils-enhanced';

// Performance utility class for direct use
export { PerformanceUtils } from './performance-utils-enhanced';
