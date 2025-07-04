/**
 * Core Utilities - Simplified
 *
 * DOM manipulation, accessibility utilities (테마 관련 기능 제거)
 */

// DOM utilities
export * from '../dom/isInsideGallery';

// DOM utilities는 통합된 ScrollManager로 대체됨
// @core/services/scroll/ScrollManager 사용하세요

// Accessibility utilities
export * from './accessibility';

// 테마 관련 유틸리티는 단순화를 위해 제거됨:
// - auto-theme-helpers.ts.disabled
// - auto-theme-helpers-simple.ts.disabled
// - theme-helpers.ts.disabled
// - theme.disabled/
