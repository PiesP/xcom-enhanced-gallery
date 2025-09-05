import { h } from '@shared/external/vendors';
import {
  RefactoredSettingsModal,
  type RefactoredSettingsModalProps,
} from './RefactoredSettingsModal';

export interface SettingsModalProps extends Omit<RefactoredSettingsModalProps, 'mode'> {}

/**
 * @deprecated 통합된 RefactoredSettingsModal 사용. panel 모드 wrapper.
 *
 * 이 컴포넌트는 RefactoredSettingsModal을 사용하며,
 * RefactoredSettingsModal에서 glass-surface 클래스를 통해 glassmorphism 효과를 적용합니다.
 */
export function SettingsModal(props: SettingsModalProps) {
  return h(RefactoredSettingsModal, { ...props, mode: 'panel' });
}

export default SettingsModal;
