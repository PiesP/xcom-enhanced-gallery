/**
 * @fileoverview Solid.js utility helper functions
 * @description Phase 141.3: Accessor type conversion helper, remove type assertions
 *              Phase 602: Accessor utilities consolidated from Toolbar/accessor-utils.ts
 * @version 4.0.0 - Removed resolveAccessorValue (use resolveOptional)
 *
 * @deprecated Prefer importing from '@shared/utils/solid/accessor-utils' directly.
 *             This file is maintained for backward compatibility only.
 *             Will be removed in a future major version.
 */

// Re-export all accessor utilities from the consolidated module
export type { MaybeAccessor } from './accessor-utils';
export {
  isAccessor,
  resolve,
  resolveOptional,
  toAccessor,
  toOptionalAccessor,
  toRequiredAccessor,
} from './accessor-utils';
