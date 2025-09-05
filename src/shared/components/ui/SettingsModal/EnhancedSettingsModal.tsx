/**
 * @fileoverview EnhancedSettingsModal Wrapper
 * @deprecated 통합 RefactoredSettingsModal (mode="modal") 사용.
 */
import { h, type ComponentChildren } from '@shared/external/vendors';
import { RefactoredSettingsModal } from './RefactoredSettingsModal';

export interface EnhancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ComponentChildren;
  'data-testid'?: string;
}

export function EnhancedSettingsModal(props: EnhancedSettingsModalProps) {
  return h(RefactoredSettingsModal, { ...props, mode: 'modal' });
}

export default EnhancedSettingsModal;
