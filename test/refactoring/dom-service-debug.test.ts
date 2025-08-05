/**
 * @fileoverview DOM 서비스 디버그 테스트
 */

import { describe, it, expect } from 'vitest';
import domService, { DOMService, createElement } from '../../src/shared/dom/DOMService';

describe('DOM 서비스 디버그', () => {
  it('should have DOMService class', () => {
    expect(DOMService).toBeDefined();
    expect(typeof DOMService).toBe('function');
  });

  it('should have domService instance', () => {
    expect(domService).toBeDefined();
    expect(typeof domService).toBe('object');
  });

  it('should have createElement function', () => {
    expect(createElement).toBeDefined();
    expect(typeof createElement).toBe('function');
  });

  it('should create elements', () => {
    console.log('Testing createElement...');

    // 기본 요소 생성
    const element1 = createElement('div');
    console.log('element1:', element1);

    // 옵션과 함께 요소 생성
    const element2 = createElement('div', {
      id: 'test-id',
      className: 'test-class',
    });
    console.log('element2:', element2);

    expect(element1).not.toBeNull();
    expect(element2).not.toBeNull();
  });

  it('should test document availability', () => {
    console.log('document:', typeof document);
    console.log('document.createElement:', typeof document?.createElement);

    if (typeof document !== 'undefined') {
      const testDiv = document.createElement('div');
      console.log('testDiv:', testDiv);
      expect(testDiv).toBeDefined();
    }
  });
});
