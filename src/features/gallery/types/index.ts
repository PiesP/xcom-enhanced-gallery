/**
 * @fileoverview Gallery Types Barrel Export
 * @version 1.0.0 - Phase 219
 * @description 갤러리 기능의 backward compatibility 계층
 *
 * **구조**:
 * - toolbar.types.ts: @shared/types/toolbar.types로부터의 re-export
 *   (구 위치에서 마이그레이션된 타입들)
 *
 * **마이그레이션 권고**:
 * - 기존: `import { ToolbarState } from '@features/gallery/types'`
 * - 신규: `import type { ToolbarState } from '@shared/types'`
 *
 * **유지 이유**:
 * - backward compatibility 보장
 * - 외부 스크립트/의존성이 이 경로를 사용할 수 있음
 */

// Backward compatibility re-export
export type { ToolbarDataState, FitMode, ToolbarState, ToolbarActions } from './toolbar.types';
