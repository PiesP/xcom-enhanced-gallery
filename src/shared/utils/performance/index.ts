/**
 * Minimal barrel for performance-related helpers that remain in production.
 */

// Gallery preload helper
export { computePreloadIndices } from './preload';

// Scheduling helpers
export { scheduleIdle } from './schedulers';
export type { IdleHandle } from './schedulers';
