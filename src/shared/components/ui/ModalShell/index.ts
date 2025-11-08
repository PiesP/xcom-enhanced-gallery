/**
 * @fileoverview ModalShell Component Barrel Export
 * @version 1.2.0 - Phase 389: Enhanced documentation, integration patterns
 * @description Public API for modal dialog shell component
 * @module shared/components/ui/ModalShell
 *
 * **Modal System Overview**:
 * - ModalShell: Reusable modal container with semantic variants
 * - Size System: sm, md (default), lg, xl for different use cases
 * - Surface Variants: glass (overlay), solid (default), elevated (emphasis)
 * - Interaction: ESC key and backdrop click close handlers
 * - Accessibility: WCAG 2.1 Level AA compliant (Phase 389)
 *
 * **Export Categories**:
 * 1. Component: ModalShell (functional component)
 * 2. Types: ModalShellProps (TypeScript interface)
 * 3. Default: ModalShell (for ES6 default imports)
 *
 * **Usage Patterns**:
 * ```typescript
 * // Static import
 * import { ModalShell } from '@shared/components/ui/ModalShell';
 * import type { ModalShellProps } from '@shared/components/ui/ModalShell';
 *
 * // Default import
 * import ModalShell from '@shared/components/ui/ModalShell';
 * ```
 *
 * **Component Usage**:
 * ```tsx
 * import { ModalShell } from '@shared/components/ui/ModalShell';
 * import { createSignal } from 'solid-js';
 *
 * export function MyDialog() {
 *   const [isOpen, setIsOpen] = createSignal(false);
 *
 *   return (
 *     <ModalShell
 *       isOpen={isOpen()}
 *       onClose={() => setIsOpen(false)}
 *       size='md'
 *       surfaceVariant='glass'
 *       aria-label='My Dialog'
 *     >
 *       <div className='dialog-content'>
 *         <h2>Dialog Title</h2>
 *         <p>Dialog content here</p>
 *       </div>
 *     </ModalShell>
 *   );
 * }
 * ```
 *
 * **Integration Points** (Phase 389+):
 * - ErrorBoundary: Error dialogs can use ModalShell wrapper
 * - Toolbar: Settings panel uses ModalShell variant
 * - Gallery: Media info overlays (future)
 * - Global: Modals, alerts, confirmations
 *
 * **CSS Module**:
 * - Semantic classes: modal-backdrop, modal-shell
 * - Size classes: modal-size-sm, modal-size-md, modal-size-lg, modal-size-xl
 * - Variant classes: modal-surface-glass, modal-surface-solid, modal-surface-elevated
 * - State: modal-open (applied when isOpen=true)
 *
 * @see {@link ./ModalShell.tsx} - Component implementation
 * @see {@link ./ModalShell.module.css} - Semantic styling
 */

export { ModalShell, ModalShell as default } from './ModalShell';
export type { ModalShellProps } from './ModalShell';
