/**
 * @fileoverview Event Origin Detector 테스트
 * @description 이벤트가 특정 컨테이너 내부에서 발생했는지 판별하는 유틸리티 테스트
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isEventWithinContainer, BODY_ELEMENTS } from '@shared/utils/events/event-origin';

describe('Event Origin Detector', () => {
  let container: HTMLElement;
  let child: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    child = document.createElement('span');
    container.appendChild(child);
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('isEventWithinContainer', () => {
    it('should return true when event target is inside container', () => {
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: child,
        enumerable: true,
      });

      expect(isEventWithinContainer(event, container)).toBe(true);
    });

    it('should return false when event target is outside container', () => {
      const outside = document.createElement('div');
      document.body.appendChild(outside);

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: outside,
        enumerable: true,
      });

      expect(isEventWithinContainer(event, container)).toBe(false);

      outside.remove();
    });

    it('should use composedPath for Shadow DOM support', () => {
      const event = new MouseEvent('click', { bubbles: true });
      const mockPath = [child, container, document.body];
      vi.spyOn(event, 'composedPath').mockReturnValue(mockPath);

      expect(isEventWithinContainer(event, container)).toBe(true);
    });

    it('should handle body-like elements', () => {
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: document.body,
        enumerable: true,
      });

      expect(isEventWithinContainer(event, document.body)).toBe(true);
    });

    it('should return false when container is null', () => {
      const event = new MouseEvent('click');
      expect(isEventWithinContainer(event, null)).toBe(false);
    });

    it('should return true when target equals container', () => {
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: container,
        enumerable: true,
      });

      expect(isEventWithinContainer(event, container)).toBe(true);
    });

    it('should handle event with null target', () => {
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: null,
        enumerable: true,
      });

      expect(isEventWithinContainer(event, container)).toBe(false);
    });

    it('should handle event with undefined target', () => {
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: undefined,
        enumerable: true,
      });

      expect(isEventWithinContainer(event, container)).toBe(false);
    });

    it('should respect checkComposedPath option', () => {
      const event = new MouseEvent('click', { bubbles: true });
      const mockPath = [child, container, document.body];
      vi.spyOn(event, 'composedPath').mockReturnValue(mockPath);

      // composedPath를 무시하도록 설정
      Object.defineProperty(event, 'target', {
        value: document.createElement('div'), // outside element
        enumerable: true,
      });

      // checkComposedPath: false이면 contains만 체크
      expect(isEventWithinContainer(event, container, { checkComposedPath: false })).toBe(false);
    });

    it('should handle custom bodyLikeElements option', () => {
      const customBody = document.createElement('div');
      customBody.id = 'custom-body';
      document.body.appendChild(customBody);

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: customBody,
        enumerable: true,
      });

      const customBodyElements = new Set<any>([customBody]);

      expect(
        isEventWithinContainer(event, customBody, {
          bodyLikeElements: customBodyElements,
        })
      ).toBe(true);

      customBody.remove();
    });
  });

  describe('BODY_ELEMENTS', () => {
    it('should contain standard body-like elements', () => {
      expect(BODY_ELEMENTS.has(document.body)).toBe(true);
      expect(BODY_ELEMENTS.has(document.documentElement)).toBe(true);
      expect(BODY_ELEMENTS.has(document)).toBe(true);
      expect(BODY_ELEMENTS.has(window)).toBe(true);
    });
  });
});
