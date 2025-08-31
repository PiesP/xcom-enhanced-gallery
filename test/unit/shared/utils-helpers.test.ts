import { describe, it, expect } from 'vitest';
import {
  isGalleryContainer,
  isGalleryInternalElement,
  isVideoControlElement,
  isGalleryInternalEvent,
  canTriggerGallery,
} from '@shared/utils/utils';

function makeFakeElement(tagName = 'DIV', className = '') {
  return {
    tagName,
    className,
    matches(selector) {
      try {
        return selector.includes(tagName.toLowerCase()) || selector.includes(this.className);
      } catch {
        return false;
      }
    },
    closest() {
      return null;
    },
    getAttribute() {
      return null;
    },
  };
}

describe('utils small pure helpers', () => {
  it('recognizes gallery container via matches', () => {
    const el = makeFakeElement('DIV', 'xeg-gallery-container');
    // @ts-ignore - test uses lightweight fake element compatible at runtime
    expect(isGalleryContainer(el)).toBe(true);
  });

  it('identifies gallery internal element when class matches', () => {
    const el = makeFakeElement('ARTICLE', 'xeg-gallery-container');
    // @ts-ignore - test uses lightweight fake element compatible at runtime
    expect(isGalleryInternalElement(el)).toBe(true);
  });

  it('identifies video control element via selector heuristics', () => {
    const el = makeFakeElement('DIV', 'video-player');
    // @ts-ignore - lightweight fake element used for selector heuristics
    expect(isVideoControlElement(el)).toBe(true);
  });

  it('isGalleryInternalEvent returns false for non-element target', () => {
    const fakeEvent = { target: null };
    // @ts-ignore - passing a fake event object for runtime check
    expect(isGalleryInternalEvent(fakeEvent)).toBe(false);
  });

  it('canTriggerGallery returns false when null or gallery open', () => {
    expect(canTriggerGallery(null)).toBe(false);
  });
});
