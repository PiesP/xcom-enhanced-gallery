/**
 * @fileoverview Core State Exports
 * @version 1.0.0 - Unified Architecture
 */

// 통합된 갤러리 상태 관리
export * from './signals/unified-gallery.signals';

// 기존 상태 관리 (점진적 마이그레이션을 위해 유지)
export * from './ExtractionStateManager';
