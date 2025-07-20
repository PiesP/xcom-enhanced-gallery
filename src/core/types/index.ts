/**
 * Core Types Export
 *
 * Phase 1 Step 3: 타입 충돌 해결 및 서비스 통합
 * 중복된 export를 제거하고 명확한 타입 구조를 유지합니다.
 */

// Primary consolidated core types (Phase 1 Step 2)
export * from './core-types';

// Legacy files maintained for backward compatibility during migration
export * from './services.types';
export * from './gallery.types';
export * from './view-mode.types';

// Essential business types (non-conflicting exports only)
export * from './media.types';

// Infrastructure types (migrated)
export * from './lifecycle.types';
export * from './userscript.d';
