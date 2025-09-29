/**
 * @fileoverview Legacy SettingsModal alias bridged to Solid implementation
 * @description Stage D migration shim forwarding to Solid SettingsModal
 */

import type { JSX } from 'solid-js';
import { SettingsModal as SolidSettingsModal, type SettingsModalProps } from './SettingsModal';

export type { SettingsModalProps };

export function SettingsModal(props: SettingsModalProps): JSX.Element | null {
  return <SolidSettingsModal {...props} />;
}

export const RefactoredSettingsModal = SettingsModal;

export default SettingsModal;
