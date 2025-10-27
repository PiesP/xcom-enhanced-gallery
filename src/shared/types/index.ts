/**
 * Shared Types Barrel Export
 *
 * Phase 196: 타입 파일 분할 및 모던화
 * - ui.types.ts: 테마, UI 상태 타입 (신규)
 * - component.types.ts: 컴포넌트 Props 타입 (신규)
 * - app.types.ts: 핵심 앱 타입 (축소/정리)
 * - media.types.ts: 미디어 관련 타입 (유지)
 * - navigation.types.ts: 네비게이션 타입 (유지)
 * - result.types.ts: Result 패턴 (유지)
 */

// 미디어 관련 타입들
export * from './media.types';

// 앱 전역 타입들 (re-export 포함)
export * from './app.types';

// UI/테마 타입들
export * from './ui.types';

// 컴포넌트 Props 타입들
export * from './component.types';

// 네비게이션 상태 타입들
export * from './navigation.types';

// Result 패턴 타입들 (ErrorCode와 Result 관련)
export type {
  BaseResultStatus,
  ErrorCode,
  BaseResult,
  ResultSuccess,
  ResultError,
} from './result.types';

// UserScript API 타입들
export * from './core/userscript.d';

// 하위 호환성을 위한 re-export
export type { Option } from './app.types';
