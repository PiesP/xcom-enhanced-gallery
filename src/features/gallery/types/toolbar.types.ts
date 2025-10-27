/**
 * @fileoverview Toolbar Types - Backward Compatibility Re-export
 * @version 3.0.0 - Phase 219
 * @description @shared/types/toolbar.types로 이동된 타입들의 재-export
 *
 * **마이그레이션 안내**:
 * - 기존: `import { ToolbarState } from '@features/gallery/types'`
 * - 신규: `import type { ToolbarState } from '@shared/types'` (권장)
 * - 둘 다 현재 작동하지만, 신규 경로 사용 권장
 *
 * **유지 이유**:
 * - 구 코드베이스와의 호환성 보장
 * - 외부 스크립트 의존성 호환성
 */

export type {
  ToolbarDataState,
  FitMode,
  ToolbarState,
  ToolbarActions,
} from '@shared/types/toolbar.types';
