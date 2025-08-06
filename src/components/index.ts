/**
 * @fileoverview 통합 컴포넌트
 * @version 1.0.0 - 단순화된 구조
 *
 * 모든 UI 컴포넌트를 하나의 위치에서 관리합니다.
 */

// ================================
// 기존 컴포넌트 재export
// ================================

// 공통 UI 컴포넌트들
export * from '../shared/components';

// 갤러리 컴포넌트들
export * from '../features/gallery/components';

// ================================
// 통합된 컴포넌트 시스템
// ================================

// 갤러리 앱 진입점
export { GalleryApp } from '../features/gallery/gallery-app';
export { GalleryRenderer } from '../features/gallery/gallery-renderer';

// 설정 관련
export * from '../features/settings';
