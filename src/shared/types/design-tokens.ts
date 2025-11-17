/**
 * @fileoverview Type helpers for CSS design tokens.
 */

import { DESIGN_TOKEN_NAMES } from './generated/design-token-names';

export type DesignTokenName = (typeof DESIGN_TOKEN_NAMES)[number];

export function isDesignTokenName(value: string): value is DesignTokenName {
  return DESIGN_TOKEN_NAMES.includes(value as DesignTokenName);
}

export function assertDesignTokenName(value: string): DesignTokenName {
  if (!isDesignTokenName(value)) {
    throw new Error(`Unknown design token: ${value}`);
  }

  return value;
}
