/**
 * Minimal barrel for performance-related helpers that remain in production.
 */

// Scheduling helpers
export { type IdleHandle, scheduleIdle } from './idle-scheduler';
// Observer pool
export { SharedObserver } from './observer-pool';
// Gallery preload helper
export { computePreloadIndices } from './preload';
