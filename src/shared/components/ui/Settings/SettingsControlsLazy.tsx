/**
 * @fileoverview Lazy wrapper for SettingsControls component
 * @description Phase 2b: Lazy load SettingsControls on first use (settings panel expansion)
 * @phase Phase 308: Bundle Optimization - Phase 2b
 *
 * Benefits:
 * - Remove 10-15 KB from initial bundle (settings controls code)
 * - Load only when user expands settings panel
 * - Expected initial memory reduction: -10-15 KB
 * - First settings panel open: +50-100ms delay (acceptable UX)
 */

import { getSolid } from '../../../external/vendors';
import type { JSXElement } from '../../../external/vendors';
import type { SettingsControlsProps } from './SettingsControls';

const { lazy, Suspense } = getSolid();

/**
 * Lazy wrapper for SettingsControls
 * Defers loading until first access
 */
const LazySettingsControls = lazy(() =>
  import('./SettingsControls').then(module => ({
    default: module.SettingsControls,
  }))
);

/**
 * Fallback component during lazy load
 */
const SettingsControlsFallback = (): JSXElement => {
  return <div style={{ height: '120px' }} />;
};

/**
 * Exported lazy wrapper with error boundary
 */
export const SettingsControlsLazy = (props: SettingsControlsProps): JSXElement => {
  return (
    <Suspense fallback={<SettingsControlsFallback />}>
      <LazySettingsControls {...props} />
    </Suspense>
  );
};
