import type { JSXElement } from '../../../external/vendors';

export interface HeadlessSettingsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly children: (state: Record<string, unknown>) => JSXElement;
}

export function HeadlessSettingsModal(props: HeadlessSettingsModalProps): JSXElement | null {
  if (!props.isOpen) return null;
  const state = {
    currentTheme: 'auto',
    currentLanguage: 'auto',
    handleThemeChange: () => void 0,
    handleLanguageChange: () => void 0,
    containerRef: null,
  } as const;
  return props.children(state as unknown as Record<string, unknown>);
}

export default HeadlessSettingsModal;
