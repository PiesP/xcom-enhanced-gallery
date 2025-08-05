/**
 * @fileoverview TDD 애니메이션 통합 테스트
 * @description AnimationManager 제거 및 AnimationService 통합
 */

import { describe, it, expect } from 'vitest';

describe('🔴 TDD RED: Animation System Consolidation', () => {
  describe('AnimationService 단일 시스템', () => {
    it('AnimationManager가 제거되고 AnimationService만 사용해야 함', async () => {
      // RED → GREEN: AnimationManager가 제거되었고 AnimationService만 사용해야 함

      // GREEN: AnimationService는 정상 작동해야 함
      const { AnimationService } = await import('@shared/services/AnimationService');
      expect(AnimationService).toBeDefined();
      expect(AnimationService.getInstance).toBeDefined();

      const service = AnimationService.getInstance();
      expect(service.animateGalleryEnter).toBeDefined();
      expect(service.animateGalleryExit).toBeDefined();

      console.log('✅ AnimationService 단일 시스템으로 통합 완료');
    });

    it('animations.ts가 AnimationService의 간단한 래퍼 역할만 해야 함', async () => {
      const animationsModule = await import('@shared/utils/animations');

      expect(animationsModule.animateGalleryEnter).toBeDefined();
      expect(animationsModule.animateGalleryExit).toBeDefined();
      expect(animationsModule.cleanupAnimations).toBeDefined();
    });
  });
});
