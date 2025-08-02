/**
 * @fileoverview Phase 1: Core 모듈 구현 확인 테스트
 * @description TDD Phase 1 - RED-GREEN-REFACTOR
 */

import { describe, it, expect } from 'vitest';

describe('🟢 Phase 1: Core 모듈 구현 완료 (GREEN)', () => {
  describe('Core 스타일 관리자 테스트', () => {
    it('CoreStyleManager 모듈이 올바르게 export되어야 한다', async () => {
      try {
        const coreStyles = await import('@core/styles');

        expect(coreStyles.CoreStyleManager).toBeDefined();
        expect(coreStyles.coreStyleManager).toBeDefined();
        expect(coreStyles.combineClasses).toBeDefined();
        expect(coreStyles.applyGlassmorphism).toBeDefined();
        expect(coreStyles.supportsGlassmorphism).toBeDefined();

        console.log('✅ CoreStyleManager 모든 기능 정상 export');
      } catch (error) {
        console.log('❌ CoreStyleManager 구현 필요:', error);
        throw error;
      }
    });

    it('combineClasses 함수가 정상 작동해야 한다', async () => {
      const { combineClasses } = await import('@core/styles');

      const result = combineClasses('class1', null, 'class2', undefined, false, 'class3');
      expect(result).toBe('class1 class2 class3');

      console.log('✅ combineClasses 함수 정상 작동');
    });
  });

  describe('Core DOM 관리자 테스트', () => {
    it('CoreDOMManager 모듈이 올바르게 export되어야 한다', async () => {
      try {
        const coreDOM = await import('@core/dom');

        expect(coreDOM.CoreDOMManager).toBeDefined();
        expect(coreDOM.coreDOMManager).toBeDefined();
        expect(coreDOM.select).toBeDefined();
        expect(coreDOM.selectAll).toBeDefined();

        console.log('✅ CoreDOMManager 모든 기능 정상 export');
      } catch (error) {
        console.log('❌ CoreDOMManager 구현 필요:', error);
        throw error;
      }
    });

    it('select 함수가 정상 작동해야 한다', async () => {
      const { select } = await import('@core/dom');

      // 테스트 환경에서 body 요소는 존재
      const result = select('body');
      expect(result).not.toBeNull();

      // 존재하지 않는 선택자는 null 반환
      const nonExistent = select('#non-existent-element-12345');
      expect(nonExistent).toBeNull();

      console.log('✅ select 함수 정상 작동');
    });
  });

  describe('Core 미디어 관리자 테스트', () => {
    it('CoreMediaManager 모듈이 올바르게 export되어야 한다', async () => {
      try {
        const coreMedia = await import('@core/media');

        expect(coreMedia.CoreMediaManager).toBeDefined();
        expect(coreMedia.coreMediaManager).toBeDefined();
        expect(coreMedia.extractMediaUrls).toBeDefined();
        expect(coreMedia.isValidMediaUrl).toBeDefined();

        console.log('✅ CoreMediaManager 모든 기능 정상 export');
      } catch (error) {
        console.log('❌ CoreMediaManager 구현 필요:', error);
        throw error;
      }
    });

    it('isValidMediaUrl 함수가 정상 작동해야 한다', async () => {
      const { isValidMediaUrl } = await import('@core/media');

      expect(isValidMediaUrl('https://pbs.twimg.com/media/test.jpg')).toBe(true);
      expect(isValidMediaUrl('invalid-url')).toBe(false);
      expect(isValidMediaUrl('')).toBe(false);

      console.log('✅ isValidMediaUrl 함수 정상 작동');
    });
  });

  describe('Phase 1 완료 검증', () => {
    it('모든 Core 모듈이 독립적으로 작동해야 한다', async () => {
      const [coreStyles, coreDOM, coreMedia] = await Promise.all([
        import('@core/styles'),
        import('@core/dom'),
        import('@core/media'),
      ]);

      // 모든 핵심 기능들이 정상적으로 export되었는지 확인
      expect(coreStyles.coreStyleManager).toBeDefined();
      expect(coreDOM.coreDOMManager).toBeDefined();
      expect(coreMedia.coreMediaManager).toBeDefined();

      console.log('🎉 Phase 1 완료: 모든 Core 모듈 구현 완료');
    });
  });
});
