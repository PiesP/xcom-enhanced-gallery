/**
 * @fileoverview core-utils.ts 단위 테스트
 * @description Phase 326.7: Reduced to active functions only
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ensureGalleryScrollAvailable,
  isGalleryInternalEvent,
  removeDuplicateStrings,
} from '@shared/utils';

describe('core-utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('isGalleryInternalEvent', () => {
    it('should return true for events from gallery container', () => {
      const galleryContainer = document.createElement('div');
      galleryContainer.setAttribute('data-gallery-container', '');
      document.body.appendChild(galleryContainer);

      const element = document.createElement('div');
      galleryContainer.appendChild(element);

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: element, writable: false });

      expect(isGalleryInternalEvent(event)).toBe(true);
    });

    it('should return true for events from xeg-gallery-container', () => {
      const galleryContainer = document.createElement('div');
      galleryContainer.classList.add('xeg-gallery-container');
      document.body.appendChild(galleryContainer);

      const element = document.createElement('div');
      galleryContainer.appendChild(element);

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: element, writable: false });

      expect(isGalleryInternalEvent(event)).toBe(true);
    });

    it('should return false for events from outside gallery', () => {
      const externalElement = document.createElement('div');
      document.body.appendChild(externalElement);

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: externalElement, writable: false });

      expect(isGalleryInternalEvent(event)).toBe(false);
    });
  });

  describe('ensureGalleryScrollAvailable', () => {
    it('should activate scroll on gallery elements', () => {
      const galleryElement = document.createElement('div');
      const itemsList = document.createElement('div');
      itemsList.setAttribute('data-xeg-role', 'items-list');
      galleryElement.appendChild(itemsList);
      document.body.appendChild(galleryElement);

      ensureGalleryScrollAvailable(galleryElement);

      expect(itemsList.style.overflowY).toBe('auto');
    });

    it('should handle null element gracefully', () => {
      expect(() => ensureGalleryScrollAvailable(null)).not.toThrow();
    });
  });

  describe('removeDuplicateStrings', () => {
    it('should remove exact duplicates', () => {
      const input = ['apple', 'banana', 'apple', 'cherry', 'banana'];
      const result = removeDuplicateStrings(input);
      expect(result).toEqual(['apple', 'banana', 'cherry']);
    });

    it('should handle empty array', () => {
      const result = removeDuplicateStrings([]);
      expect(result).toEqual([]);
    });

    it('should handle array with no duplicates', () => {
      const input = ['apple', 'banana', 'cherry'];
      const result = removeDuplicateStrings(input);
      expect(result).toEqual(['apple', 'banana', 'cherry']);
    });

    it('should handle array with all duplicates', () => {
      const input = ['apple', 'apple', 'apple'];
      const result = removeDuplicateStrings(input);
      expect(result).toEqual(['apple']);
    });

    it('should preserve order of first occurrence', () => {
      const input = ['zebra', 'apple', 'banana', 'apple', 'zebra'];
      const result = removeDuplicateStrings(input);
      expect(result).toEqual(['zebra', 'apple', 'banana']);
    });
  });
});
