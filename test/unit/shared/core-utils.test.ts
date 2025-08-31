import { describe, it, expect } from 'vitest';
import {
  combineClasses,
  removeDuplicateStrings,
  safeGetAttribute,
  safeSetAttribute,
  isGalleryContainer,
} from '@shared/utils/core-utils';
import { createMockElement, createMockHTMLElement } from '../../utils/mocks/dom-mocks';

describe('core-utils small helpers', () => {
  it('combineClasses joins only truthy classes', () => {
    expect(combineClasses('a', undefined, 'b', '', null, 'c')).toBe('a b c');
  });

  it('removeDuplicateStrings deduplicates preserving order of first occurrences', () => {
    expect(removeDuplicateStrings(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c']);
  });

  it('safeGetAttribute and safeSetAttribute behave safely', () => {
    const el = createMockElement({ tagName: 'div' });
    expect(safeGetAttribute(el, 'data-test')).toBeNull();
    safeSetAttribute(el, 'data-test', '42');
    expect(safeGetAttribute(el, 'data-test')).toBe('42');
  });

  it('isGalleryContainer returns true for matching selector', () => {
    const gallery = createMockHTMLElement({
      tagName: 'div',
      attributes: { class: 'xeg-gallery-container' },
    });
    // ensure matches works on our mock
    expect(isGalleryContainer(gallery)).toBe(true);

    const notGallery = createMockHTMLElement({ tagName: 'div', attributes: { class: 'other' } });
    expect(isGalleryContainer(notGallery)).toBe(false);
  });
});
