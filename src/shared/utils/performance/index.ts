/**
 * Minimal barrel for performance-related helpers that remain in production.
 */

// Gallery preload helper
export { computePreloadIndices } from './preload';

// Scheduling helpers
export { scheduleIdle, type IdleHandle } from './idle-scheduler';

// Observer pool
export { SharedObserver } from './observer-pool';
