/**
 * @fileoverview solid-helpers.ts 단위 테스트
 * @description Phase B3: 커버리지 개선 (77.8% → 80%+)
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { toAccessor, isAccessor, isHTMLElement } from '@/shared/utils/solid-helpers';

describe('solid-helpers: Solid.js 유틸리티', () => {
  setupGlobalTestIsolation();

  describe('toAccessor', () => {
    it('일반 값을 Accessor 함수로 변환', () => {
      const value = 42;
      const accessor = toAccessor(value);
      expect(typeof accessor).toBe('function');
      expect(accessor()).toBe(42);
    });

    it('문자열 값을 Accessor로 변환', () => {
      const value = 'test-value';
      const accessor = toAccessor(value);
      expect(accessor()).toBe('test-value');
    });

    it('객체 값을 Accessor로 변환', () => {
      const value = { key: 'nested' };
      const accessor = toAccessor(value);
      expect(accessor()).toEqual({ key: 'nested' });
    });

    it('배열 값을 Accessor로 변환', () => {
      const value = [1, 2, 3];
      const accessor = toAccessor(value);
      expect(accessor()).toEqual([1, 2, 3]);
    });

    it('null 값을 Accessor로 변환', () => {
      const value = null;
      const accessor = toAccessor(value);
      expect(accessor()).toBe(null);
    });

    it('undefined 값을 Accessor로 변환', () => {
      const value = undefined;
      const accessor = toAccessor(value);
      expect(accessor()).toBe(undefined);
    });

    it('이미 Accessor 함수는 그대로 반환', () => {
      const originalAccessor = () => 100;
      const accessor = toAccessor(originalAccessor);
      expect(accessor).toBe(originalAccessor);
      expect(accessor()).toBe(100);
    });

    it('boolean 값을 Accessor로 변환', () => {
      const trueAccessor = toAccessor(true);
      const falseAccessor = toAccessor(false);
      expect(trueAccessor()).toBe(true);
      expect(falseAccessor()).toBe(false);
    });

    it('0을 Accessor로 변환 (falsy 값 처리)', () => {
      const accessor = toAccessor(0);
      expect(accessor()).toBe(0);
    });

    it('빈 문자열을 Accessor로 변환 (falsy 값 처리)', () => {
      const accessor = toAccessor('');
      expect(accessor()).toBe('');
    });
  });

  describe('isAccessor', () => {
    it('함수는 Accessor로 인식', () => {
      const func = () => 'test';
      expect(isAccessor(func)).toBe(true);
    });

    it('일반 값은 Accessor 아님', () => {
      expect(isAccessor(42)).toBe(false);
      expect(isAccessor('string')).toBe(false);
      expect(isAccessor({ key: 'value' })).toBe(false);
    });

    it('null은 Accessor 아님', () => {
      expect(isAccessor(null)).toBe(false);
    });

    it('undefined는 Accessor 아님', () => {
      expect(isAccessor(undefined)).toBe(false);
    });

    it('화살표 함수는 Accessor로 인식', () => {
      const arrowFunc = () => 'arrow';
      expect(isAccessor(arrowFunc)).toBe(true);
    });

    it('일반 함수는 Accessor로 인식', () => {
      function regularFunc() {
        return 'regular';
      }
      expect(isAccessor(regularFunc)).toBe(true);
    });

    it('비동기 함수도 Accessor로 인식', () => {
      const asyncFunc = async () => 'async';
      expect(isAccessor(asyncFunc)).toBe(true);
    });

    it('배열은 Accessor 아님', () => {
      expect(isAccessor([])).toBe(false);
      expect(isAccessor([1, 2, 3])).toBe(false);
    });
  });

  describe('isHTMLElement', () => {
    it('HTMLElement 인스턴스 감지', () => {
      const div = document.createElement('div');
      expect(isHTMLElement(div)).toBe(true);
    });

    it('다양한 HTML 태그 감지', () => {
      const button = document.createElement('button');
      const input = document.createElement('input');
      const span = document.createElement('span');

      expect(isHTMLElement(button)).toBe(true);
      expect(isHTMLElement(input)).toBe(true);
      expect(isHTMLElement(span)).toBe(true);
    });

    it('일반 객체는 HTMLElement 아님', () => {
      expect(isHTMLElement({ key: 'value' })).toBe(false);
      expect(isHTMLElement({})).toBe(false);
    });

    it('null은 HTMLElement 아님', () => {
      expect(isHTMLElement(null)).toBe(false);
    });

    it('undefined는 HTMLElement 아님', () => {
      expect(isHTMLElement(undefined)).toBe(false);
    });

    it('숫자/문자열은 HTMLElement 아님', () => {
      expect(isHTMLElement(42)).toBe(false);
      expect(isHTMLElement('string')).toBe(false);
    });

    it('함수는 HTMLElement 아님', () => {
      expect(isHTMLElement(() => {})).toBe(false);
    });

    it('배열은 HTMLElement 아님', () => {
      expect(isHTMLElement([])).toBe(false);
    });

    it('DOM 노드(Document)는 HTMLElement 아님', () => {
      expect(isHTMLElement(document)).toBe(false);
    });

    it('DocumentFragment는 HTMLElement 아님', () => {
      const fragment = document.createDocumentFragment();
      expect(isHTMLElement(fragment)).toBe(false);
    });
  });
});
