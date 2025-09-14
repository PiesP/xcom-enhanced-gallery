import { getPreact } from '../../../external/vendors';
import { SettingsModal as RealSettingsModal, type SettingsModalProps } from './SettingsModal';

export interface UnifiedSettingsModalProps extends SettingsModalProps {}

// 통합 엔트리: 실제 SettingsModal을 래핑하여 테스트 호환(class/role) 유지
export function UnifiedSettingsModal(props: UnifiedSettingsModalProps) {
  const { h } = getPreact();
  const outerClass = ['glass-surface', props.className].filter(Boolean).join(' ');
  if (!props.isOpen) return null as unknown as ReturnType<typeof h>;
  return h(
    'div',
    { className: outerClass, role: 'dialog', 'aria-modal': props.mode !== 'panel' },
    h(RealSettingsModal, props)
  );
}

// 레거시 별칭 유지: SettingsModal도 동일 엔트리로 노출(테스트 경로 호환)
export const SettingsModal = UnifiedSettingsModal;
export default UnifiedSettingsModal;
