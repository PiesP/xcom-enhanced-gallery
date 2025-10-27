/**
 * @fileoverview Toolbar Types (Gallery Features - Re-export Layer)
 * @version 3.0.0 - Phase 197.1: Backward Compatibility
 * @description 타입이 @shared/types/toolbar.types.ts로 이동되었습니다.
 * 이 파일은 backward compatibility를 위해 재-export만 수행합니다.
 *
 * **이동 이유**:
 * - @shared/utils/toolbar-utils.ts와 @shared/hooks/use-toolbar-state.ts가 의존
 * - 의존성 역행 해결 필요
 * - ToolbarState/ToolbarActions는 UI 상태 타입으로 충분히 일반적
 *
 * **마이그레이션**:
 * - 기존: `import { ToolbarState } from '@features/gallery/types'`
 * - 신규: `import type { ToolbarState } from '@shared/types'` (권장)
 * - 둘 다 작동 (이 파일에서 재-export)
 */

// Re-export from @shared/types for backward compatibility
export type {
  ToolbarDataState,
  FitMode,
  ToolbarState,
  ToolbarActions,
} from '@shared/types/toolbar.types';
