/**
 * @fileoverview CSS 애니메이션 시스템 → AnimationService 리다이렉트
 * @version 4.0.0 - Phase 3: AnimationService로 통합됨
 *
 * @deprecated This file will be removed in v3.0.0
 * @migration Use AnimationService directly:
 *   import { AnimationService } from '@shared/services/AnimationService'
 *   const service = AnimationService.getInstance()
 *   service.animateGalleryEnter(element)
 */

import {
  AnimationService,
  ANIMATION_CONSTANTS,
  ANIMATION_CLASSES,
} from '../services/AnimationService';

// 하위 호환성을 위한 re-export
export { ANIMATION_CONSTANTS, ANIMATION_CLASSES };
export type { AnimationConfig as CSSAnimationOptions } from '../services/AnimationService';

/**
 * @deprecated AnimationService.getInstance()를 사용하세요
 */
export function injectAnimationStyles(): void {
  // 스타일은 AnimationService에서 자동으로 주입됩니다
  AnimationService.getInstance();
}

/**
 * @deprecated service.animateGalleryEnter()를 사용하세요
 */
export async function animateGalleryEnter(
  element: Element,
  options: { onComplete?: () => void } = {}
): Promise<void> {
  const service = AnimationService.getInstance();
  return service.animateGalleryEnter(element, options);
}

/**
 * @deprecated service.animateGalleryExit()를 사용하세요
 */
export async function animateGalleryExit(
  element: Element,
  options: { onComplete?: () => void } = {}
): Promise<void> {
  const service = AnimationService.getInstance();
  return service.animateGalleryExit(element, options);
}

/**
 * @deprecated service.animateImageItemsEnter()를 사용하세요
 */
export async function animateImageItemsEnter(elements: Element[]): Promise<void> {
  const service = AnimationService.getInstance();
  return service.animateImageItemsEnter(elements);
}

/**
 * @deprecated service.cleanupAnimations()를 사용하세요
 */
export function cleanupAnimations(element: Element): void {
  const service = AnimationService.getInstance();
  return service.cleanupAnimations(element);
}
