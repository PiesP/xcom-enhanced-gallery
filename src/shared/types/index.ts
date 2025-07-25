/**
 * Shared Types Barrel Export
 *
 * Phase 3: 파일 통합 완료
 * 모든 타입을 2개 파일로 통합: media.types.ts, app.types.ts
 */

// 통합 미디어 타입들
export * from './media.types';

// 통합 앱 전역 타입들
export * from './app.types';

// UserScript API 타입들
export * from './core/userscript.d';

// 하위 호환성을 위한 re-export
export type { Result, AsyncResult, Option } from './app.types';
