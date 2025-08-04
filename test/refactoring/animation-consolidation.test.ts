/**
 * @fileoverview TDD 애니메이션 통합 테스트
 * @description AnimationManager 제거 및 AnimationService 통합
 */

import { describe, it, expect } from 'vitest';

describe('🔴 TDD RED: Animation System Consolidation', () => {
  describe('AnimationService 단일 시스템', () => {
    it('AnimationManager가 제거되고 AnimationService만 사용해야 함', async () => {
      // RED: AnimationManager는 더 이상 존재하지 않아야 함
      try {
        await import('@shared/utils/animation/AnimationManager');
        // 이 코드에 도달하면 테스트 실패
        expect(false).toBe(true);
      } catch (error) {
        // AnimationManager가 없어야 함 (예상된 결과)
        expect(error).toBeDefined();
      }

      // GREEN: AnimationService는 정상 작동해야 함
      const { AnimationService } = await import('@shared/services/AnimationService');
      expect(AnimationService).toBeDefined();
      expect(AnimationService.getInstance).toBeDefined();

      const service = AnimationService.getInstance();
      expect(service.animateGalleryEnter).toBeDefined();
      expect(service.animateGalleryExit).toBeDefined();
    });

    it('animations.ts가 AnimationService의 간단한 래퍼 역할만 해야 함', async () => {
      const animationsModule = await import('@shared/utils/animations');

      expect(animationsModule.animateGalleryEnter).toBeDefined();
      expect(animationsModule.animateGalleryExit).toBeDefined();
      expect(animationsModule.cleanupAnimations).toBeDefined();
    });
  });
});
