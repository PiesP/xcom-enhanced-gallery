/**
 * Minimal barrel for performance-related helpers that remain in production.
 */

// Gallery preload helper
export { computePreloadIndices } from "./preload";

// Idle scheduling
export { scheduleIdle } from "./idle-scheduler";

// Animation/microtask scheduling
export { scheduleRaf, scheduleMicrotask } from "./schedulers";
