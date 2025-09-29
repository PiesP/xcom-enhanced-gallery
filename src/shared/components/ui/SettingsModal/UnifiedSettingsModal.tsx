import type { JSX } from 'solid-js';

import { SettingsModal } from './SettingsModal';
import type { SettingsModalProps } from './SettingsModal';

export interface UnifiedSettingsModalProps extends SettingsModalProps {}

export const UnifiedSettingsModal = (props: UnifiedSettingsModalProps): JSX.Element | null => {
  return <SettingsModal {...props} />;
};

export { SettingsModal };

export default UnifiedSettingsModal;
