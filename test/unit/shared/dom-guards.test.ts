/* global document */
import { describe, it, expect } from 'vitest';
import {
  isElement,
  isHTMLElement,
  isImageElement,
  isVideoElement,
  getSrcIfPresent,
} from '@shared/utils/dom-guards';

describe('dom-guards', () => {
  it('isElement returns false for null/undefined', () => {
    expect(isElement(null)).toBe(false);
    expect(isElement(undefined)).toBe(false);
  });

  it('isElement and isHTMLElement detect elements correctly', () => {
    const div = document.createElement('div');
    expect(isElement(div)).toBe(true);
    expect(isHTMLElement(div)).toBe(true);
  });

  it('isImageElement and isVideoElement work by tagName', () => {
    const img = document.createElement('img');
    const vid = document.createElement('video');

    expect(isImageElement(img)).toBe(true);
    expect(isVideoElement(vid)).toBe(true);
    expect(isImageElement(vid)).toBe(false);
    expect(isVideoElement(img)).toBe(false);
  });

  it('getSrcIfPresent extracts src when present', () => {
    const el = document.createElement('img');
    el.src = 'https://example.com/image.jpg';
    expect(getSrcIfPresent(el)).toBe('https://example.com/image.jpg');

    const noSrc = document.createElement('div');
    expect(getSrcIfPresent(noSrc)).toBeNull();
  });
});
