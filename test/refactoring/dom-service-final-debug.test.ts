/**
 * @fileoverview DOM Service 최종 디버깅 테스트
 */

import { describe, it } from 'vitest';
import domService from '../../src/shared/dom/DOMService';

describe('DOM Service 최종 디버깅', () => {
  it('should debug createElement return value', () => {
    console.log('=== createElement 디버깅 ===');
    console.log('domService:', domService);
    console.log('domService.createElement:', typeof domService.createElement);

    const element = domService.createElement('div', {
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
    }
  });

  it('should debug DOM element creation in test environment', () => {
    console.log('=== DOM 환경 디버깅 ===');
    console.log('document:', typeof document);
    console.log('document.createElement:', typeof document.createElement);

    const testDiv = document.createElement('div');
    console.log('testDiv:', testDiv);
    console.log('testDiv.classList:', testDiv.classList);
    console.log('testDiv.style:', testDiv.style);

    try {
      testDiv.classList.add('test-class');
      console.log('classList.add success');
    } catch (error) {
      console.log('classList.add error:', error);
    }
  });

  it('should debug addClass/removeClass functionality', () => {
    console.log('=== addClass/removeClass 디버깅 ===');

    const testElement = document.createElement('div');
    console.log('Test element created:', testElement);
    console.log('Test element classList:', testElement.classList);

    const addResult = domService.addClass(testElement, 'test-class');
    console.log('addClass result:', addResult);
    console.log('Element classes after addClass:', testElement.className);

    const removeResult = domService.removeClass(testElement, 'test-class');
    console.log('removeClass result:', removeResult);
    console.log('Element classes after removeClass:', testElement.className);
  });
});
