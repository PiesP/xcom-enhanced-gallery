/**
 * Phase 135: Type Guard 함수 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  createEventListener,
  isHTMLElement,
  isHTMLImageElement,
  isHTMLVideoElement,
  isHTMLAnchorElement,
  isWheelEvent,
  isKeyboardEvent,
  isMouseEvent,
  hasElement,
  isArray,
  isRecord,
} from '@shared/utils/type-guards';

describe('Phase 135: Type Guard 함수들', () => {
  setupGlobalTestIsolation();

  describe('createEventListener', () => {
    it('should create an EventListener from a handler function', () => {
      const handler = (event: Event) => {};
      const listener = createEventListener(handler);

      expect(typeof listener).toBe('function');
    });

    it('should call the handler with the event', () => {
      let called = false;
      const handler = () => {
        called = true;
      };
      const listener = createEventListener(handler);

      const mockEvent = new Event('test');
      listener(mockEvent);

      expect(called).toBe(true);
    });
  });

  describe('isHTMLElement', () => {
    it('should return true for HTMLElement instances', () => {
      const div = document.createElement('div');
      expect(isHTMLElement(div)).toBe(true);
    });

    it('should return false for non-element values', () => {
      expect(isHTMLElement(null)).toBe(false);
      expect(isHTMLElement(undefined)).toBe(false);
      expect(isHTMLElement('string')).toBe(false);
      expect(isHTMLElement({})).toBe(false);
    });
  });

  describe('isHTMLImageElement', () => {
    it('should return true for HTMLImageElement instances', () => {
      const img = document.createElement('img');
      expect(isHTMLImageElement(img)).toBe(true);
    });

    it('should return false for other elements', () => {
      const div = document.createElement('div');
      expect(isHTMLImageElement(div)).toBe(false);
      expect(isHTMLImageElement(null)).toBe(false);
    });
  });

  describe('isHTMLVideoElement', () => {
    it('should return true for HTMLVideoElement instances', () => {
      const video = document.createElement('video');
      expect(isHTMLVideoElement(video)).toBe(true);
    });

    it('should return false for other elements', () => {
      const div = document.createElement('div');
      expect(isHTMLVideoElement(div)).toBe(false);
      expect(isHTMLVideoElement(null)).toBe(false);
    });
  });

  describe('isHTMLAnchorElement', () => {
    it('should return true for HTMLAnchorElement instances', () => {
      const anchor = document.createElement('a');
      expect(isHTMLAnchorElement(anchor)).toBe(true);
    });

    it('should return false for other elements', () => {
      const div = document.createElement('div');
      expect(isHTMLAnchorElement(div)).toBe(false);
      expect(isHTMLAnchorElement(null)).toBe(false);
    });
  });

  describe('Event type guards', () => {
    it('isWheelEvent should detect WheelEvent', () => {
      const wheelEvent = new WheelEvent('wheel');
      expect(isWheelEvent(wheelEvent)).toBe(true);

      const mouseEvent = new MouseEvent('click');
      expect(isWheelEvent(mouseEvent)).toBe(false);
    });

    it('isKeyboardEvent should detect KeyboardEvent', () => {
      const keyEvent = new KeyboardEvent('keydown');
      expect(isKeyboardEvent(keyEvent)).toBe(true);

      const mouseEvent = new MouseEvent('click');
      expect(isKeyboardEvent(mouseEvent)).toBe(false);
    });

    it('isMouseEvent should detect MouseEvent', () => {
      const mouseEvent = new MouseEvent('click');
      expect(isMouseEvent(mouseEvent)).toBe(true);

      const keyEvent = new KeyboardEvent('keydown');
      expect(isMouseEvent(keyEvent)).toBe(false);
    });
  });

  describe('hasElement', () => {
    it('should return true for Element instances', () => {
      const div = document.createElement('div');
      expect(hasElement(div)).toBe(true);
    });

    it('should return false for non-element values', () => {
      expect(hasElement(null)).toBe(false);
      expect(hasElement(undefined)).toBe(false);
      expect(hasElement('string')).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(['a', 'b'])).toBe(true);
    });

    it('should return false for non-array values', () => {
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
      expect(isArray('string')).toBe(false);
      expect(isArray({ length: 3 })).toBe(false);
    });
  });

  describe('isRecord', () => {
    it('should return true for plain objects', () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ a: 1 })).toBe(true);
      expect(isRecord({ foo: 'bar', baz: 123 })).toBe(true);
    });

    it('should return false for arrays, primitives, and null', () => {
      expect(isRecord([])).toBe(false);
      expect(isRecord(null)).toBe(false);
      expect(isRecord(undefined)).toBe(false);
      expect(isRecord('string')).toBe(false);
      expect(isRecord(123)).toBe(false);
      expect(isRecord(true)).toBe(false);
    });
  });
});
