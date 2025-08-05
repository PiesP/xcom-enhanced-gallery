/**
 * @fileoverview 스타일 유틸리티 export
 * @description CSS 클래스 및 스타일 관련 유틸리티
 * @version 2.0.0
 */

// CSS utilities
export * from '@shared/styles/style-manager';
export { default } from '@shared/styles/style-manager';

// Backward compatibility utilities for existing components
export { toggleClass, getCSSVariable, applyTheme } from './style-utils';
