/**
 * @fileoverview [DEPRECATED] CSS 유틸리티 - Use StyleManager directly
 * @description Use '@shared/styles/style-manager' directly instead of these utilities
 * @version 3.0.0 - DEPRECATED
 */

// Re-export from StyleManager for backward compatibility
export {
  setCSSVariable,
  getCSSVariable,
  setCSSVariables,
  updateComponentState,
  createThemedClassName,
  applyTheme,
} from '@shared/styles/style-manager';
