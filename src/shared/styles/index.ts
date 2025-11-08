/**
 * @fileoverview Shared Styles Exports
 * @description Style-related utility and namespaced styles exports
 */

// 네임스페이스 스타일 관리
export {
  initializeNamespacedStyles,
  cleanupNamespacedStyles,
  createNamespacedClass,
  createNamespacedSelector,
} from './namespaced-styles';

// 테마 유틸리티
export {
  isInsideGallery,
  getXEGVariable,
  setGalleryTheme,
  STYLE_CONSTANTS,
  type Theme,
} from './theme-utils';
