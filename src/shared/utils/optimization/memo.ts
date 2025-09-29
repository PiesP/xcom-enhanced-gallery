/**
 * Legacy memo utility preserved as a no-op during Solid migration.
 *
 * The original Preact-based implementation has been removed. This stub keeps the
 * public API available for tooling and backwards-compatibility tests while the
 * Solid rewrite progresses. Consumers should migrate to Solid `createMemo`
 * or component-level memoization instead.
 */

import { logger } from '@shared/logging/logger';

export type LegacyMemoComponent<TProps extends Record<string, unknown>> = (
  props: TProps
) => unknown;

export function memo<TProps extends Record<string, unknown>>(
  component: LegacyMemoComponent<TProps>
): LegacyMemoComponent<TProps> {
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('[utils/optimization] memo() stub invoked. Migrate to Solid equivalents.');
  }
  return component;
}
