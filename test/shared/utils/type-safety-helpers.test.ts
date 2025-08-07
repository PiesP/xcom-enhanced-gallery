/**
 * @fileoverview Type Safety Helpers TDD 테스트 (실제 함수들만)
 * @description 실제로 존재하는 타입 안전성 헬퍼 함수들만 테스트
 * @version 2.0.0 - 실제 함수 기반 재작성
 */

import { describe, it, expect } from 'vitest';
import {
  // 실제 존재하는 함수들만 import
  safeParseInt,
  safeParseFloat,
  safeArrayGet,
  safeNodeListAccess,
  safeMatchExtract,
  safeCall,
} from '@shared/utils/type-safety-helpers';

describe('Type Safety Helpers TDD 테스트', () => {
  describe('🔴 RED: 숫자 파싱 유틸리티', () => {
    it('safeParseInt가 문자열을 안전하게 정수로 변환해야 한다', () => {
      expect(safeParseInt('123')).toBe(123);
      expect(safeParseInt('123.45')).toBe(123);
      expect(safeParseInt('0')).toBe(0);
      expect(safeParseInt('-123')).toBe(-123);

      // 실패 케이스들
      expect(safeParseInt('abc')).toBe(0);
      expect(safeParseInt('')).toBe(0);
      expect(safeParseInt(null)).toBe(0);
      expect(safeParseInt(undefined)).toBe(0);
    });

    it('safeParseInt가 다른 진법도 처리해야 한다', () => {
      expect(safeParseInt('1010', 2)).toBe(10); // 2진법
      expect(safeParseInt('FF', 16)).toBe(255); // 16진법
      expect(safeParseInt('77', 8)).toBe(63); // 8진법
    });

    it('safeParseFloat가 문자열을 안전하게 부동소수점으로 변환해야 한다', () => {
      expect(safeParseFloat('123.45')).toBe(123.45);
      expect(safeParseFloat('0.5')).toBe(0.5);
      expect(safeParseFloat('-123.45')).toBe(-123.45);
      expect(safeParseFloat('123')).toBe(123);

      // 실패 케이스들
      expect(safeParseFloat('abc')).toBe(0);
      expect(safeParseFloat('')).toBe(0);
      expect(safeParseFloat(null)).toBe(0);
      expect(safeParseFloat(undefined)).toBe(0);
    });
  });

  describe('🟢 GREEN: 배열 접근 유틸리티', () => {
    it('safeArrayGet이 배열 요소를 안전하게 접근해야 한다', () => {
      const array = [1, 2, 3, 'hello', { key: 'value' }];

      expect(safeArrayGet(array, 0)).toBe(1);
      expect(safeArrayGet(array, 3)).toBe('hello');
      expect(safeArrayGet(array, 4)).toEqual({ key: 'value' });

      // 범위를 벗어난 접근
      expect(safeArrayGet(array, 10)).toBeUndefined();
      expect(safeArrayGet(array, -1)).toBeUndefined();

      // null/undefined 배열
      expect(safeArrayGet(null, 0)).toBeUndefined();
      expect(safeArrayGet(undefined, 0)).toBeUndefined();
    });

    it('safeNodeListAccess가 NodeList를 안전하게 접근해야 한다', () => {
      // DOM 노드 생성
      const div1 = document.createElement('div');
      div1.className = 'test-node';
      const div2 = document.createElement('div');
      div2.className = 'test-node';
      document.body.appendChild(div1);
      document.body.appendChild(div2);

      const nodeList = document.querySelectorAll('.test-node');

      expect(safeNodeListAccess(nodeList, 0)).toBe(div1);
      expect(safeNodeListAccess(nodeList, 1)).toBe(div2);
      expect(safeNodeListAccess(nodeList, 10)).toBeUndefined();

      // 빈 NodeList
      expect(safeNodeListAccess(null, 0)).toBeUndefined();
      expect(safeNodeListAccess(undefined, 0)).toBeUndefined();

      // 정리
      div1.remove();
      div2.remove();
    });

    it('safeNodeListAccess가 배열도 처리해야 한다', () => {
      const nodeArray = [document.createElement('div'), document.createElement('span')];

      expect(safeNodeListAccess(nodeArray, 0)).toBe(nodeArray[0]);
      expect(safeNodeListAccess(nodeArray, 1)).toBe(nodeArray[1]);
      expect(safeNodeListAccess(nodeArray, 10)).toBeUndefined();
    });
  });

  describe('🔵 REFACTOR: 정규식 및 함수 호출 유틸리티', () => {
    it('safeMatchExtract가 정규식 매치 결과를 안전하게 추출해야 한다', () => {
      const text = 'Hello, World! 123';
      const match = text.match(/(\w+),\s*(\w+)!\s*(\d+)/);

      expect(safeMatchExtract(match, 0)).toBe('Hello, World! 123');
      expect(safeMatchExtract(match, 1)).toBe('Hello');
      expect(safeMatchExtract(match, 2)).toBe('World');
      expect(safeMatchExtract(match, 3)).toBe('123');

      // 범위를 벗어난 접근
      expect(safeMatchExtract(match, 10)).toBe(null);

      // 매치 실패
      const noMatch = 'No match here'.match(/\d+/);
      expect(safeMatchExtract(noMatch, 0)).toBe(null);
      expect(safeMatchExtract(noMatch, 0, 'default')).toBe('default');
    });

    it('safeCall이 함수를 안전하게 호출해야 한다', () => {
      const addFn = (a: number, b: number) => a + b;
      const stringFn = (str: string) => str.toUpperCase();

      expect(safeCall(addFn, 5, 3)).toBe(8);
      expect(safeCall(stringFn, 'hello')).toBe('HELLO');

      // null/undefined 함수
      expect(safeCall(null, 1, 2)).toBeUndefined();
      expect(safeCall(undefined, 'test')).toBeUndefined();
    });

    it('safeCall이 복잡한 함수도 처리해야 한다', () => {
      const complexFn = (obj: { name: string; age: number }) => {
        return `${obj.name} is ${obj.age} years old`;
      };

      const testObj = { name: 'Alice', age: 30 };
      expect(safeCall(complexFn, testObj)).toBe('Alice is 30 years old');
    });
  });

  describe('🚀 실제 사용 시나리오', () => {
    it('조합하여 복잡한 데이터 처리를 안전하게 해야 한다', () => {
      // 문자열에서 숫자를 추출하고 배열에 저장하는 시나리오
      const text = 'Price: $123.45, Quantity: 10';
      const priceMatch = text.match(/\$(\d+\.?\d*)/);
      const quantityMatch = text.match(/Quantity:\s*(\d+)/);

      const price = safeParseFloat(safeMatchExtract(priceMatch, 1));
      const quantity = safeParseInt(safeMatchExtract(quantityMatch, 1));

      expect(price).toBe(123.45);
      expect(quantity).toBe(10);

      const values = [price, quantity];
      expect(safeArrayGet(values, 0)).toBe(123.45);
      expect(safeArrayGet(values, 1)).toBe(10);
    });

    it('DOM 조작과 함께 사용해야 한다', () => {
      // DOM 요소 생성
      const input1 = document.createElement('input');
      input1.value = '42';
      const input2 = document.createElement('input');
      input2.value = '3.14';
      document.body.appendChild(input1);
      document.body.appendChild(input2);

      const inputs = document.querySelectorAll('input');

      const value1 = safeParseInt(safeNodeListAccess(inputs, 0)?.value);
      const value2 = safeParseFloat(safeNodeListAccess(inputs, 1)?.value);

      expect(value1).toBe(42);
      expect(value2).toBe(3.14);

      // 정리
      input1.remove();
      input2.remove();
    });
  });
});
