/**
 * @fileoverview Core 모듈 메인 진입점
 * @description 통합된 핵심 기능들의 중앙 export
 * @version 2.0.0 - 구조 개선
 */

// ===== DOM 관리 =====
export { coreDOMManager, CoreDOMManager } from './dom';
export { select, selectAll, updateElement, batchUpdate } from './dom';
export type { DOMUpdate } from './dom';

// ===== 스타일 관리 =====
export { coreStyleManager, CoreStyleManager } from './styles';
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
