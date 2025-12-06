/**
 * @fileoverview Solid.js utility helper functions
 * @description Phase 141.3: Accessor type conversion helper, remove type assertions
 *              Phase 602: Accessor utilities consolidated from Toolbar/accessor-utils.ts
 * @version 3.0.0 - Re-export from accessor-utils.ts (consolidation)
 *
 * @deprecated Prefer importing from '@shared/utils/solid/accessor-utils' directly.
 *             This file is maintained for backward compatibility only.
 */

// Re-export all accessor utilities from the consolidated module
export type { MaybeAccessor } from './accessor-utils';
export {
  isAccessor,
  resolve,
  resolveAccessorValue,
  resolveOptional,
  toAccessor,
  toOptionalAccessor,
  toRequiredAccessor,
} from './accessor-utils';
