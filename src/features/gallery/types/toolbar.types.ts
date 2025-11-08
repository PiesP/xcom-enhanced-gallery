/**
 * @fileoverview Toolbar Types - Backward Compatibility Re-export
 * @version 3.0.0 - Phase 219
 * @description Re-export of types moved to @shared/types/toolbar.types
 *
 * **Migration Guide**:
 * - Old: `import { ToolbarState } from '@features/gallery/types'`
 * - New: `import type { ToolbarState } from '@shared/types'` (recommended)
 * - Both paths currently work, but new path is recommended
 *
 * **Retention Reason**:
 * - Ensures backward compatibility with legacy codebase
 * - Maintains compatibility with external script dependencies
 */

export type {
  ToolbarDataState,
  FitMode,
  ToolbarState,
  ToolbarActions,
} from '@shared/types/toolbar.types';
