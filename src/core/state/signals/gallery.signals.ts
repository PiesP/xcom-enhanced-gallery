/**
 * @fileoverview Gallery State Signals - Migration Wrapper
 * @version 5.0.0 - Unified Architecture Migration
 *
 * @deprecated 이 파일은 하위 호환성을 위해 유지됩니다.
 * 새로운 코드에서는 @core/state/signals/unified-gallery.signals를 사용하세요.
 *
 * 마이그레이션 가이드:
 * - openGallery → unified-gallery.signals의 openGallery
 * - selectMediaItem → unified-gallery.signals의 navigateToMedia
 * - getCurrentMediaItem → unified-gallery.signals의 getCurrentMedia
 */

// 통합된 signals로 마이그레이션
export * from './migration-wrapper';
