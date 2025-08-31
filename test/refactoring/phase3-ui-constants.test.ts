/**
 * @fileoverview TDD Phase 3.2 - UI 상수 분리 테스트
 * @description constants.ts에서 UI 관련 상수들을 src/shared/constants/ui.constants.ts로 분리
 */

import { describe, expect, it } from 'vitest';

// TDD Phase 3.2: UI 상수 분리
describe('UIConstants - TDD Phase 3.2', () => {
  // RED 단계: 실패하는 테스트부터 작성

  describe('갤러리 설정 상수', () => {
    it('갤러리 설정 상수가 정의되어야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { GALLERY_CONFIG } = await import('@shared/constants/ui.constants');

      // Then: 필수 설정이 존재해야 함
      expect(GALLERY_CONFIG).toBeDefined();
      expect(GALLERY_CONFIG.MAX_IMAGES).toBe(100);
      expect(GALLERY_CONFIG.PAGINATION_SIZE).toBe(20);
      expect(GALLERY_CONFIG.THUMBNAIL_SIZE).toBe(150);
    });

    it('갤러리 설정이 불변이어야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { GALLERY_CONFIG } = await import('@shared/constants/ui.constants');

      // When & Then: 설정 변경 시도시 에러 발생
      expect(() => {
        // @ts-expect-error - 의도적으로 불변성 테스트
        GALLERY_CONFIG.MAX_IMAGES = 200;
      }).toThrow();
    });
  });

  describe('CSS 클래스 상수', () => {
    it('CSS 클래스 상수가 정의되어야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { CSS_CLASSES } = await import('@shared/constants/ui.constants');

      // Then: 필수 CSS 클래스가 존재해야 함
      expect(CSS_CLASSES).toBeDefined();
      expect(CSS_CLASSES.GALLERY_CONTAINER).toBe('xeg-gallery-container');
      expect(CSS_CLASSES.THUMBNAIL).toBe('xeg-thumbnail');
      expect(CSS_CLASSES.MODAL_OVERLAY).toBe('xeg-modal-overlay');
      expect(CSS_CLASSES.LOADING_SPINNER).toBe('xeg-loading-spinner');
    });

    it('모든 CSS 클래스가 xeg- 접두사를 가져야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { CSS_CLASSES } = await import('@shared/constants/ui.constants');

      // When & Then: 모든 클래스가 xeg- 접두사를 가져야 함
      Object.values(CSS_CLASSES).forEach(className => {
        expect(className).toMatch(/^xeg-/);
      });
    });
  });

  describe('Z-Index 상수', () => {
    it('Z-Index 계층 구조가 정의되어야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { Z_INDEX } = await import('@shared/constants/ui.constants');

      // Then: Z-Index 계층이 올바르게 정의되어야 함
      expect(Z_INDEX).toBeDefined();
      expect(Z_INDEX.TOOLBAR).toBe(999999);
      expect(Z_INDEX.MODAL).toBe(1000000);
      expect(Z_INDEX.OVERLAY).toBe(1000001);
      expect(Z_INDEX.TOOLTIP).toBe(1000002);
    });

    it('Z-Index 값이 올바른 순서여야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { Z_INDEX } = await import('@shared/constants/ui.constants');

      // Then: 계층 순서가 올바르게 설정되어야 함
      expect(Z_INDEX.TOOLBAR).toBeLessThan(Z_INDEX.MODAL);
      expect(Z_INDEX.MODAL).toBeLessThan(Z_INDEX.OVERLAY);
      expect(Z_INDEX.OVERLAY).toBeLessThan(Z_INDEX.TOOLTIP);
    });
  });

  describe('애니메이션 설정', () => {
    it('애니메이션 설정이 정의되어야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { ANIMATION_SETTINGS } = await import('@shared/constants/ui.constants');

      // Then: 애니메이션 설정이 존재해야 함
      expect(ANIMATION_SETTINGS).toBeDefined();
      expect(ANIMATION_SETTINGS.FADE_DURATION).toBe(300);
      expect(ANIMATION_SETTINGS.SLIDE_DURATION).toBe(250);
      expect(ANIMATION_SETTINGS.ZOOM_DURATION).toBe(200);
    });

    it('애니메이션 지연 시간이 합리적이어야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { ANIMATION_SETTINGS } = await import('@shared/constants/ui.constants');

      // Then: 지연 시간이 사용자 경험에 적합해야 함
      Object.values(ANIMATION_SETTINGS).forEach(duration => {
        expect(duration).toBeGreaterThan(0);
        expect(duration).toBeLessThanOrEqual(1000); // 1초 이하
      });
    });
  });

  describe('키보드 단축키', () => {
    it('키보드 단축키가 정의되어야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { KEYBOARD_SHORTCUTS } = await import('@shared/constants/ui.constants');

      // Then: 필수 단축키가 존재해야 함
      expect(KEYBOARD_SHORTCUTS).toBeDefined();
      expect(KEYBOARD_SHORTCUTS.CLOSE_GALLERY).toBe('Escape');
      expect(KEYBOARD_SHORTCUTS.NEXT_IMAGE).toBe('ArrowRight');
      expect(KEYBOARD_SHORTCUTS.PREV_IMAGE).toBe('ArrowLeft');
      expect(KEYBOARD_SHORTCUTS.DOWNLOAD_ALL).toBe('d');
    });

    it('단축키가 유효한 키 코드여야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { KEYBOARD_SHORTCUTS } = await import('@shared/constants/ui.constants');

      // Then: 모든 키 코드가 유효해야 함
      const validKeys = ['Escape', 'ArrowRight', 'ArrowLeft', 'Enter', 'Space', 'd', 's', 'f'];
      Object.values(KEYBOARD_SHORTCUTS).forEach(key => {
        expect(validKeys).toContain(key);
      });
    });
  });

  describe('반응형 브레이크포인트', () => {
    it('반응형 브레이크포인트가 정의되어야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { BREAKPOINTS } = await import('@shared/constants/ui.constants');

      // Then: 브레이크포인트가 존재해야 함
      expect(BREAKPOINTS).toBeDefined();
      expect(BREAKPOINTS.MOBILE).toBe(768);
      expect(BREAKPOINTS.TABLET).toBe(1024);
      expect(BREAKPOINTS.DESKTOP).toBe(1200);
    });

    it('브레이크포인트가 올바른 순서여야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { BREAKPOINTS } = await import('@shared/constants/ui.constants');

      // Then: 크기 순서가 올바르게 설정되어야 함
      expect(BREAKPOINTS.MOBILE).toBeLessThan(BREAKPOINTS.TABLET);
      expect(BREAKPOINTS.TABLET).toBeLessThan(BREAKPOINTS.DESKTOP);
    });
  });

  describe('UI 헬퍼 함수', () => {
    it('CSS 클래스 유틸리티 함수가 동작해야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { createClassName, combineClasses } = await import('@shared/constants/ui.constants');

      // When: 클래스 이름 생성
      const className = createClassName('test-component');
      const combined = combineClasses('class1', 'class2', 'class3');

      // Then: 올바른 클래스 이름이 생성되어야 함
      expect(className).toBe('xeg-test-component');
      expect(combined).toBe('class1 class2 class3');
    });

    it('Z-Index 계산 함수가 동작해야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { calculateZIndex } = await import('@shared/constants/ui.constants');

      // When: Z-Index 계산
      const modalZIndex = calculateZIndex('MODAL');
      const tooltipZIndex = calculateZIndex('TOOLTIP');

      // Then: 올바른 Z-Index가 계산되어야 함
      expect(modalZIndex).toBe(1000000);
      expect(tooltipZIndex).toBe(1000002);
    });
  });

  describe('상수 간 일관성', () => {
    it('모든 UI 상수가 타입 안전성을 보장해야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const uiConstants = await import('@shared/constants/ui.constants');

      // Then: 모든 상수가 정의되어야 함
      expect(uiConstants.GALLERY_CONFIG).toBeDefined();
      expect(uiConstants.CSS_CLASSES).toBeDefined();
      expect(uiConstants.Z_INDEX).toBeDefined();
      expect(uiConstants.ANIMATION_SETTINGS).toBeDefined();
      expect(uiConstants.KEYBOARD_SHORTCUTS).toBeDefined();
      expect(uiConstants.BREAKPOINTS).toBeDefined();
    });

    it('CSS 클래스와 애니메이션 설정이 일관성 있게 연결되어야 한다', async () => {
      // Given: UI 상수 모듈을 import
      const { CSS_CLASSES, ANIMATION_SETTINGS } = await import('@shared/constants/ui.constants');

      // Then: 애니메이션이 필요한 클래스가 모두 정의되어야 함
      expect(CSS_CLASSES.MODAL_OVERLAY).toBeDefined();
      expect(ANIMATION_SETTINGS.FADE_DURATION).toBeDefined();

      // 갤러리 컨테이너와 슬라이드 애니메이션 연결
      expect(CSS_CLASSES.GALLERY_CONTAINER).toBeDefined();
      expect(ANIMATION_SETTINGS.SLIDE_DURATION).toBeDefined();
    });
  });
});
