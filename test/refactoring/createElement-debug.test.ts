/**
 * @fileoverview createElement 문제 디버깅
 */

import { describe, it, expect } from 'vitest';
import { createElement } from '../../src/shared/dom/DOMService';

describe('createElement 디버깅', () => {
  it('should debug createElement direct call', () => {
    console.log('=== createElement 직접 호출 디버깅 ===');
    console.log('createElement function:', createElement);
    console.log('typeof createElement:', typeof createElement);

    const element = createElement('div', {
      classes: ['test-class'],
      attributes: { id: 'test-id' },
      styles: { color: 'red' },
    });

    console.log('createElement result:', element);
    console.log('element type:', typeof element);
    console.log('element instanceof HTMLDivElement:', element instanceof HTMLDivElement);

    if (element) {
      console.log('element.tagName:', element.tagName);
      console.log('element.id:', element.id);
      console.log('element.className:', element.className);
      console.log('element.classList:', element.classList);
      console.log('element.style:', element.style);
      console.log('element.style.color:', element.style.color);
    }

    // 기본 검증
    expect(element).not.toBeNull();
  });

  it('should test simple createElement', () => {
    console.log('=== 간단한 createElement 테스트 ===');

    const element = createElement('div');
    console.log('Simple createElement result:', element);
    expect(element).not.toBeNull();
    expect(element).toBeInstanceOf(HTMLDivElement);
  });
});
