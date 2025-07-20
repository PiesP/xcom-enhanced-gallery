/**
 * Infrastructure Layer Export
 *
 * Phase 2B Step 4: 외부 의존성과 기술적 구현체만 export
 */

// Browser and DOM abstractions
export * from './browser';
export * from './dom';

// Infrastructure services
export * from './logging';
export * from './error';
export * from './managers';
export * from './media';
export * from './memory';

// Utility functions
export * from './utils';

// Legacy types (will be moved to core)
export * from './types/lifecycle.types';
export * from './types/media.types';
