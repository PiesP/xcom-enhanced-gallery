/**
 * Higher-Order Components Barrel Export
 *
 * HOC 컴포넌트들을 중앙집중식으로 export합니다.
 * Version 4.0 - 간소화된 HOC 시스템 (Phase 3)
 */

// 갤러리 HOC (메인)
// 배럴 표면 최소화: 실제 사용되는 심볼만 노출
export { withGallery, type GalleryComponentProps } from './GalleryHOC';
