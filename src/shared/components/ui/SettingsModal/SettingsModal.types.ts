/**
 * @fileoverview SettingsModal Props Types (순환 의존성 방지용 타입 분리)
 */

import type { JSX } from 'solid-js';

export interface SettingsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly mode?: 'panel' | 'modal';
  readonly position?: 'toolbar-below' | 'top-right' | 'center' | 'bottom-sheet';
  readonly children?: JSX.Element;
  readonly className?: string;
  readonly 'data-testid'?: string;
}
