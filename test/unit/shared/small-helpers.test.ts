import { describe, it, expect } from 'vitest';
import { combineClasses, getCSSVariable } from '@shared/utils/styles/style-utils';
import { isGalleryContainer, isVideoControlElement } from '@shared/utils/utils';

describe('small shared helpers', () => {
  it('combineClasses joins only truthy values', () => {
    expect(combineClasses('a', undefined, '', 'b', false, 'c')).toBe('a b c');
  });

  it('getCSSVariable returns empty string when element is null', () => {
    expect(getCSSVariable(null, '--missing')).toBe('');
  });

  it('isGalleryContainer matches gallery selectors', () => {
    const el = (globalThis.document || document).createElement('div');
    el.className = 'xeg-gallery-container';
    expect(isGalleryContainer(el)).toBe(true);
  });

  it('isVideoControlElement recognizes video control selectors', () => {
    const btn = (globalThis.document || document).createElement('button');
    btn.setAttribute('data-testid', 'playButton');
    expect(isVideoControlElement(btn)).toBe(true);
  });
});
