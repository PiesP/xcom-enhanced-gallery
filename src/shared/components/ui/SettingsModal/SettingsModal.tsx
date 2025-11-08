import type { JSXElement } from '../../../external/vendors';
import { ModalShell } from '../ModalShell/ModalShell';
import type { ModalShellProps } from '../ModalShell/ModalShell';
import { SettingsControlsLazy } from '../Settings/SettingsControlsLazy';
import type { SettingsControlsProps } from '../Settings/SettingsControls';
import styles from './SettingsModal.module.css';

type SettingsControlsBindings = Pick<
  SettingsControlsProps,
  'currentTheme' | 'currentLanguage' | 'onThemeChange' | 'onLanguageChange'
>;

export interface SettingsModalProps extends SettingsControlsBindings {
  /** Controls modal visibility */
  open: boolean;
  /** Called when the modal should close */
  onClose?: () => void;
  /** Allow backdrop click to close the modal */
  closeOnBackdropClick?: ModalShellProps['closeOnBackdropClick'];
  /** Allow escape key to close the modal */
  closeOnEscape?: ModalShellProps['closeOnEscape'];
  /** Optional heading text rendered above the controls */
  heading?: string;
  /** Optional description rendered under the heading */
  description?: string;
  /** Optional width preset shared with ModalShell */
  size?: ModalShellProps['size'];
  /** Optional surface variant forwarded to ModalShell */
  surfaceVariant?: ModalShellProps['surfaceVariant'];
  /** Append custom class names to the modal content wrapper */
  className?: string;
  /** Data attribute propagated to ModalShell */
  'data-testid'?: string;
}

export function SettingsModal({
  open,
  onClose,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  heading,
  description,
  size = 'md',
  surfaceVariant = 'glass',
  className,
  'data-testid': testId,
  currentTheme,
  currentLanguage,
  onThemeChange,
  onLanguageChange,
}: SettingsModalProps): JSXElement {
  const contentClass = [styles.modal, className].filter(Boolean).join(' ');

  return (
    <ModalShell
      isOpen={open}
      size={size}
      surfaceVariant={surfaceVariant}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}
      aria-label={heading ?? 'Settings'}
      {...(testId ? { 'data-testid': testId } : {})}
      {...(onClose ? { onClose } : {})}
    >
      <div class={contentClass}>
        {heading ? <h2 class={styles.heading}>{heading}</h2> : null}
        {description ? <p class={styles.description}>{description}</p> : null}
        <SettingsControlsLazy
          currentTheme={currentTheme}
          currentLanguage={currentLanguage}
          onThemeChange={onThemeChange}
          onLanguageChange={onLanguageChange}
        />
      </div>
    </ModalShell>
  );
}
