/**
 * Core Types Export
 *
 * Phase 1 Step 2: Core 타입 통합 완료
 * 모든 타입이 core-types.ts로 통합되어 파일 수가 크게 감소했습니다.
 */

// Consolidated core types (Phase 1 Step 2)
export * from './core-types';

// Legacy files maintained for backward compatibility during migration
export * from './services.types';
export * from './gallery.types';  
export * from './view-mode.types';

// Essential business types
export * from './core.types';
export * from './media.types';

// Infrastructure types (migrated)
export * from './lifecycle.types';
export * from './userscript.d';
