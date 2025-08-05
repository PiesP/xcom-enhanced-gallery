/**
 * @fileoverview Performance utilities exports - Phase 5 Bundle Optimization
 */

export * from './performance-utils';

// Re-export main functions for easier access
export { rafThrottle, throttle, measureAsyncPerformance } from './performance-utils';

export { createDebouncer } from '@shared/utils/timer-management';
