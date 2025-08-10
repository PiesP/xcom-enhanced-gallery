/**
 * @fileoverview 애니메이션 유틸리티 - 통합된 시스템 (Phase 3 TDD)
 * @version 3.0.0 - AnimationService 통합 완료
 *
 * @description
 * AnimationService 기반 통합 시스템으로 완전 전환
 * 하위 호환성을 위한 re-export 및 편의 함수 제공
 */

// === AnimationService Re-exports ===
import {
  AnimationService,
  ANIMATION_CLASSES,
  ANIMATION_CONSTANTS,
  type AnimationConfig,
} from '../services/animation-service';

// 싱글톤 인스턴스 캐시
const animationService = AnimationService.getInstance();

// === Instance Method Re-exports (하위 호환성) ===
export const injectAnimationStyles = () => {
  // AnimationService는 자동으로 스타일을 주입하므로 getInstance만 호출
  AnimationService.getInstance();
};

export const animateGalleryEnter = (element: HTMLElement) =>
  animationService.animateGalleryEnter(element);

export const animateGalleryExit = (element: HTMLElement) =>
  animationService.animateGalleryExit(element);

export const animateImageItemsEnter = (elements: HTMLElement[]) =>
  animationService.animateImageItemsEnter(elements);

export const cleanupAnimations = (element?: HTMLElement) => {
  if (element) {
    animationService.cleanupAnimations(element);
  } else {
    animationService.cleanup();
  }
};

// 기존 함수들을 AnimationService로 리다이렉트
export const animateToolbarShow = (element: HTMLElement) =>
  animationService.animateToolbarShow(element);

export const animateToolbarHide = (element: HTMLElement) =>
  animationService.animateToolbarHide(element);

export const animateImageLoad = (element: HTMLElement) =>
  animationService.animateGalleryEnter(element);

// === Static Method Re-exports (Phase 3 TDD) ===
export const animateCustom = AnimationService.animateCustom;
export const animateParallel = AnimationService.animateParallel;
export const setupScrollAnimation = AnimationService.setupScrollAnimation;
export const setupInViewAnimation = AnimationService.setupInViewAnimation;
export const transformValue = AnimationService.transformValue;

// === Constants Re-exports ===
export { ANIMATION_CLASSES, ANIMATION_CONSTANTS };
export type { AnimationConfig as CSSAnimationOptions };

// 애니메이션 프리셋 (Phase 3 TDD)
export const ANIMATION_PRESETS = AnimationService.ANIMATION_PRESETS;
