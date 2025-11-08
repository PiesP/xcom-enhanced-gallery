/**
 * @fileoverview Style utilities export
 * @description CSS class and style-related utilities
 * @version 3.0.0 - Phase 352: Named export optimization
 */

// CSS utilities
export {
  combineClasses as combineClassesFromCss,
  toggleClass as toggleClassFromCss,
  setCSSVariable as setCSSVariableFromCss,
  setCSSVariables,
  updateComponentState as updateComponentStateFromCss,
} from './css-utilities';

// Style utilities (direct re-export from css-utilities)
export { combineClasses, toggleClass, setCSSVariable, updateComponentState } from './css-utilities';
