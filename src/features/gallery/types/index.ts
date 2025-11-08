/**
 * @fileoverview Gallery Types Barrel Export
 * @version 1.0.0 - Phase 219
 * @description Backward compatibility layer for gallery feature types
 *
 * **Structure**:
 * - toolbar.types.ts: Re-export from @shared/types/toolbar.types
 *   (Types migrated from old location)
 *
 * **Migration Guide**:
 * - Old: `import { ToolbarState } from '@features/gallery/types'`
 * - New: `import type { ToolbarState } from '@shared/types'` (recommended)
 *
 * **Retention Reason**:
 * - Ensures backward compatibility
 * - External scripts/dependencies may use this path
 */

// Backward compatibility re-export
export type { ToolbarDataState, FitMode, ToolbarState, ToolbarActions } from './toolbar.types';
