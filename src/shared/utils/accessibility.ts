/**
 * Accessibility root facade
 * Remove duplicate implementations and expose internal barrel (`./accessibility/index`) directly.
 * This provides the same surface in import path `@/shared/utils/accessibility`.
 */
export * from './accessibility/index';
