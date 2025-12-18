import type { SettingsControlsProps } from '@shared/components/ui/Settings/SettingsControls';
import { SettingsControls } from '@shared/components/ui/Settings/SettingsControls';
import type { JSXElement } from '@shared/external/vendors';

export const SettingsControlsFallback = (): JSXElement => {
  return <div style={{ height: '7.5rem' }} />;
};
export const SettingsControlsLazy = (props: SettingsControlsProps): JSXElement => (
  <SettingsControls {...props} />
);
