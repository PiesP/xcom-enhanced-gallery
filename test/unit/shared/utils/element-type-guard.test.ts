/**
 * @fileoverview Element Type Guard Tests - Phase 237
 * @description isGalleryInternalElement의 타입 가드 기능 검증
 */

import { describe, it, expect } from 'vitest';
import { isGalleryInternalElement } from '../../../../src/shared/utils/utils';

describe('Phase 237: Element Type Guard', () => {
  describe('isGalleryInternalElement', () => {
    it('should return false for null element', () => {
      // Act & Assert
      expect(isGalleryInternalElement(null)).toBe(false);
    });

    it('should return false for element without matches method', () => {
      // Arrange: matches 메서드가 없는 객체
      const invalidElement = {
        tagName: 'DIV',
        closest: () => null,
      } as any;

      // Act & Assert: matches가 없어도 에러 없이 false 반환
      expect(isGalleryInternalElement(invalidElement)).toBe(false);
    });

    it('should return false for element with non-function matches', () => {
      // Arrange: matches가 함수가 아닌 객체
      const invalidElement = {
        tagName: 'DIV',
        matches: 'not-a-function',
        closest: () => null,
      } as any;

      // Act & Assert: matches가 함수가 아니어도 에러 없이 false 반환
      expect(isGalleryInternalElement(invalidElement)).toBe(false);
    });

    it('should work with valid gallery element', () => {
      // Arrange: 정상적인 HTMLElement 모킹
      const galleryElement = document.createElement('div');
      galleryElement.className = 'xeg-gallery-container';

      // Act & Assert
      expect(isGalleryInternalElement(galleryElement)).toBe(true);
    });

    it('should return false for non-gallery element', () => {
      // Arrange: 갤러리와 관련 없는 요소
      const regularElement = document.createElement('div');
      regularElement.className = 'some-other-class';

      // Act & Assert
      expect(isGalleryInternalElement(regularElement)).toBe(false);
    });

    it('should handle elements inside gallery', () => {
      // Arrange: 갤러리 내부 요소
      const container = document.createElement('div');
      container.className = 'xeg-gallery-container';

      const child = document.createElement('span');
      container.appendChild(child);

      // Act & Assert
      expect(isGalleryInternalElement(child)).toBe(true);
    });
  });
});
