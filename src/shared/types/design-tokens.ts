/**
 * @fileoverview Type helpers for CSS design tokens.
 */

import { DESIGN_TOKEN_NAMES } from '@shared/types/generated/design-token-names';
import type { DesignTokenName } from '@shared/types/generated/design-token-names';

export type { DesignTokenName } from '@shared/types/generated/design-token-names';

export function isDesignTokenName(value: string): value is DesignTokenName {
  return DESIGN_TOKEN_NAMES.includes(value as DesignTokenName);
}

export function assertDesignTokenName(value: string): DesignTokenName {
  if (!isDesignTokenName(value)) {
    throw new Error(`Unknown design token: ${value}`);
  }

  return value;
}
