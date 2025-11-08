/**
 * @fileoverview Gallery public entry point
 * @description Exposes primary gallery runtime APIs and shared types.
 */

export { GalleryApp } from './GalleryApp';
export { GalleryRenderer } from './GalleryRenderer';

export {
  initializeTheme,
  detectSystemTheme,
  getSavedThemeSetting,
  resolveAndApplyTheme,
  applyThemeToDOM,
  setupThemeChangeListener,
} from './services/theme-initialization';

export type {
  ToolbarDataState,
  FitMode,
  ToolbarState,
  ToolbarActions,
} from '@shared/types/toolbar.types';
