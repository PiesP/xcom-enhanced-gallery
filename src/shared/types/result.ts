/**
 * @fileoverview Result 타입 패턴 - Shared Layer
 * @version 2.0.0 - Phase 2.1 Integration
 *
 * Core 레이어의 Result 타입을 re-export합니다.
 * 이제 모든 Result 관련 타입과 함수는 core-types.ts에서 통합 관리됩니다.
 */

// Core 레이어에서 Result 타입들을 가져와서 re-export
export type { Result, AsyncResult, Option } from '@shared/types/core/core-types';

export {
  success,
  failure,
  safeAsync,
  safe,
  unwrapOr,
  isSuccess,
  isFailure,
  chain,
  map,
} from '@shared/types/core/core-types';
