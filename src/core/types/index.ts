/**
 * Core Types Export
 *
 * Phase 1A: 의존성 위반 해결 및 타입 통합
 * 중복된 export를 제거하고 명확한 타입 구조를 유지합니다.
 */

// Primary consolidated core types (Phase 1 Step 2)
export * from './core-types';

// Essential business types (non-conflicting exports only)
export * from './media.types';

// Application types (새로 추가 - Phase 1A)
export * from './app.types';

// Infrastructure types (migrated)
export * from './lifecycle.types';
export * from './userscript.d';
