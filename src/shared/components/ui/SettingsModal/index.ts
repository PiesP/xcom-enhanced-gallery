/**
 * @fileoverview Settings Modal Styles Barrel Export
 * @version 1.0.0 - Phase 392: Semantic styling for modal dialogs
 * @description Central export for settings modal CSS modules and styles
 * @module shared/components/ui/SettingsModal
 *
 * **Settings Modal Architecture** (Phase 45+):
 * Settings modal UI component styling extracted from ModalShell.
 * Provides semantic CSS classes for backdrop and modal container.
 * Now split: ModalShell (component), SettingsControls (content), SettingsModal (styles).
 *
 * **CSS Modules Provided**:
 * - SettingsModal.module.css: Semantic styling for modal UI
 *   - `.backdrop`: Fullscreen overlay behind modal
 *   - `.modal`: Centered dialog container
 *   - `.modal:focus-visible`: Keyboard focus indicator
 */

export { SettingsModal } from './SettingsModal';
export type { SettingsModalProps } from './SettingsModal';

/**
 * - Phase 391: Settings component split
 * - Phase 392: Styling consolidation and documentation
 *
 * **Future Enhancements**:
 * - Media query variants for mobile (full viewport)
 * - Slide-in animation option (bottom sheet on mobile)
 * - Nested modal support (dialog stack)
 * - Transition timing tokens (Phase 254 formalization)
 *
 * @see {@link ./SettingsModal.module.css} - CSS module styles
 * @see {@link ../ModalShell/ModalShell.tsx} - Container component
 * @see {@link ../Settings/SettingsControls.tsx} - Content component
 * @see {@link ../../../styles} - Design token definitions
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/dialogmodal/ - Dialog modal pattern
 */

// This barrel export exists for documentation purposes.
// Import SettingsModal.module.css directly in components that use it.
//
// Example:
// import styles from '@shared/components/ui/SettingsModal/SettingsModal.module.css';
//
// The CSS module is used by ModalShell and related components.
