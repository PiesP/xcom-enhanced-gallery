/**
 * Shared Types Barrel Export
 *
 * @fileoverview 전체 타입 생태계의 단일 import 지점
 * @version 5.0.0 - Phase 197: 명확한 구조 개선
 *
 * **구조**:
 * ```
 * types/
 * ├── index.ts (현재) - 배럴 export
 * ├── app.types.ts - 앱 전역 타입 + 재-export 허브
 * ├── ui.types.ts - UI/테마 타입
 * ├── component.types.ts - 컴포넌트 Props/이벤트
 * ├── media.types.ts - 미디어 관련 타입
 * ├── result.types.ts - Result 패턴 & ErrorCode
 * ├── navigation.types.ts - 네비게이션 타입
 * └── core/ - 핵심 도메인 & 인프라
 *     ├── core-types.ts - 핵심 타입들
 *     ├── base-service.types.ts - BaseService (순환 의존성 방지)
 *     ├── extraction.types.ts - 추출 타입 (backward compat)
 *     ├── userscript.d.ts - UserScript API
 *     └── index.ts - core 배럴
 * ```
 *
 * **사용 가이드**:
 * - 일반적인 경우: `import type { ... } from '@shared/types'`
 * - 세부 타입이 필요한 경우: `import type { ... } from '@shared/types/media.types'`
 * - Result 패턴만: `import { success, failure } from '@shared/types/core/core-types'`
 *
 * **Phase 197 변경사항**:
 * - app.types.ts 350줄 → 205줄 (재-export 중심 구조화)
 * - BaseService 중복 제거 (core-types.ts에서 base-service.types.ts 재-export)
 * - JSDoc 현대화 및 명확성 개선
 * - toolbar-types.ts 제거 (features/gallery/types/toolbar.types.ts 사용)
 */

// ==========================================
// Shared Types Barrel Export
// ==========================================

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

// 툴바 UI 상태 타입들
export * from './toolbar.types';

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
