import type { SettingsControlsProps } from '@shared/components/ui/Settings/SettingsControls';
import type { JSXElement } from '@shared/external/vendors';
import { lazy, Suspense } from 'solid-js';

const LazySettingsControls = lazy(() =>
  import('@shared/components/ui/Settings/SettingsControls').then((module) => ({
    default: module.SettingsControls,
  })),
);
export const SettingsControlsFallback = (): JSXElement => {
  return <div style={{ height: '7.5rem' }} />;
};
export const SettingsControlsLazy = (props: SettingsControlsProps): JSXElement => (
  <Suspense fallback={<SettingsControlsFallback />}>
    <LazySettingsControls {...props} />
  </Suspense>
);
