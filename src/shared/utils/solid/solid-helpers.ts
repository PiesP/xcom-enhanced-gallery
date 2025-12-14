/**
 * @fileoverview Solid.js helpers backward compatibility layer
 * @description Re-exports from accessor-utils.ts for backward compatibility
 * @deprecated Import directly from '@shared/utils/solid/accessor-utils' instead
 * @version 1.0.0
 */

export {
  isAccessor,
  type MaybeAccessor,
  resolve,
  resolveOptional,
  toAccessor,
  toOptionalAccessor,
  toRequiredAccessor,
} from './accessor-utils';
