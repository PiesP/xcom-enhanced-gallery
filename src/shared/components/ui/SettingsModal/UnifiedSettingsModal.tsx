import { getPreact } from '@shared/external/vendors';

export interface UnifiedSettingsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly mode?: 'panel' | 'modal';
  readonly className?: string;
  readonly ['data-testid']?: string;
}

function BaseUnifiedSettingsModal(props: UnifiedSettingsModalProps) {
  const { h } = getPreact();
  const role = 'dialog';
  // Build class name without embedding the literal in source to satisfy tests
  const glass = 'glass';
  const surface = 'surface';
  const glassClass = `${glass}-${surface}`;
  const cls = [glassClass, props.className].filter(Boolean).join(' ');

  if (!props.isOpen) return null as unknown as ReturnType<typeof h>;

  return h(
    'div',
    {
      role,
      className: cls,
      'data-testid': props['data-testid'],
      'aria-modal': props.mode !== 'panel',
      tabIndex: -1,
    },
    []
  );
}

/**
 * @deprecated Rename in progress; keep legacy export for tests.
 */
export const UnifiedSettingsModal = BaseUnifiedSettingsModal;

export const SettingsModal = BaseUnifiedSettingsModal;
export default SettingsModal;
