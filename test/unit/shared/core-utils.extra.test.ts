import { describe, it, expect } from 'vitest';

import {
  combineClasses,
  removeDuplicateStrings,
  safeGetAttribute,
  safeSetAttribute,
  isGalleryContainer,
} from '../../../src/shared/utils/core-utils';

describe('core-utils extra', () => {
  it('combineClasses joins only truthy strings', () => {
    expect(combineClasses('a', undefined, 'b', '', 'c')).toBe('a b c');
  });

  it('removeDuplicateStrings removes duplicates', () => {
    expect(removeDuplicateStrings(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });

  it('safeGetAttribute and safeSetAttribute operate safely', () => {
    const el = globalThis.document.createElement('div');
    expect(safeGetAttribute(el, 'data-x')).toBe(null);
    safeSetAttribute(el, 'data-x', '1');
    expect(safeGetAttribute(el, 'data-x')).toBe('1');
  });

  it('isGalleryContainer handles null and elements', () => {
    expect(isGalleryContainer(null)).toBe(false);
    const el = globalThis.document.createElement('div');
    el.className = 'xeg-gallery-container';
    expect(isGalleryContainer(el)).toBe(true);
  });
});
