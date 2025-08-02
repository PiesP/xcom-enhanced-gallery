/**
 * @fileoverview Core 모듈 메인 진입점
 * @description 통합된 핵심 기능들의 중앙 export
 * @version 2.0.0 - 구조 개선
 */

// ===== DOM 관리 =====
export * from './dom';
export { coreDOMManager } from './dom';

// ===== 스타일 관리 =====
export * from './styles';
export { coreStyleManager } from './styles';

// ===== 미디어 관리 =====
export * from './media';
export { coreMediaManager } from './media';

// ===== 타입 정의 =====
export * from './types';
