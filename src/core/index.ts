/**
 * @fileoverview Core 모듈 메인 진입점
 * @description 통합된 핵심 기능들의 중앙 export
 * @version 2.0.0 - 구조 개선
 */

// ===== DOM 관리 (DOMService로 이전) =====
// CoreDOMManager는 src/shared/dom/DOMService.ts로 통합됨

// ===== 스타일 관리 =====
export {
  coreStyleManager,
  CoreStyleManager,
  combineClasses,
  setCSSVariable,
  getCSSVariable,
  setGlassmorphism,
  applyGlassmorphism,
  updateComponentState,
} from './styles';
export type { GlassmorphismIntensity } from './styles';

// ===== 미디어 관리 =====
export { coreMediaManager, CoreMediaManager, extractMediaUrls } from './media';

// ===== 기본 타입들 =====
export type {
  MediaType,
  MediaQuality,
  MediaInfo,
  MediaEntity,
  MediaExtractionResult,
  MediaExtractionOptions,
} from './types';
