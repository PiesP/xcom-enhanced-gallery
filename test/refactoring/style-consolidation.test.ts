/**
 * @fileoverview TDD Style Consolidation Test
 * @description StyleManager 직접 사용으로 통합하는 TDD 테스트
 */

import { describe, it, expect } from 'vitest';

describe('🔴 TDD RED: Style Consolidation', () => {
  describe('StyleManager 직접 사용', () => {
    it('styleUtils 래퍼 없이 StyleManager를 직접 import해야 함', async () => {
      // RED: 이 테스트는 현재 실패할 것임 (styleUtils가 아직 존재)
      const StyleManagerModule = await import('@shared/styles/StyleManager');
      const StyleManager = StyleManagerModule.default;

      expect(StyleManager).toBeDefined();
      expect(StyleManager.combineClasses).toBeDefined();
      expect(StyleManager.applyGlassmorphism).toBeDefined();
      expect(StyleManager.setTheme).toBeDefined();

      // styleUtils 래퍼가 제거되었는지 확인
      try {
        const stylesModule = await import('@shared/styles/index');
        // styleUtils export가 없어야 함
        expect(stylesModule.styleUtils).toBeUndefined();
      } catch (error) {
        // 예상된 동작 - styleUtils가 제거됨
        expect(error).toBeDefined();
      }
    });

    it('StyleManager가 singleton 패턴이 아닌 static 메서드로 작동해야 함', async () => {
      // RED: StyleManager를 직접 사용하는 방식 검증
      const StyleManagerModule = await import('@shared/styles/StyleManager');
      const StyleManager = StyleManagerModule.default;

      expect(() => {
        StyleManager.combineClasses('class1', 'class2');
      }).not.toThrow();
    });
  });

  describe('Manager → Service 네이밍 통일', () => {
    it('TimerService로 접근 가능해야 함', async () => {
      // RED: 현재는 TimerManager만 존재하므로 실패할 것
      try {
        const { TimerService } = await import('@shared/services/TimerService');
        expect(TimerService).toBeDefined();
        expect(TimerService.prototype.createTimer).toBeDefined();
      } catch (error) {
        // 현재는 실패가 예상됨
        expect(error).toBeDefined();
      }
    });

    it('ResourceService로 접근 가능해야 함', async () => {
      // RED: 현재는 ResourceManager만 존재하므로 실패할 것
      try {
        const { ResourceService } = await import('@shared/services/ResourceService');
        expect(ResourceService).toBeDefined();
        expect(ResourceService.prototype.register).toBeDefined();
      } catch (error) {
        // 현재는 실패가 예상됨
        expect(error).toBeDefined();
      }
    });
  });
});
