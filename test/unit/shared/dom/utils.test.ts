
// Mock logger
vi.mock('@shared/logging', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

// Mock gallerySignals
vi.mock('@shared/state/signals/gallery.signals', () => ({
  gallerySignals: {
    isOpen: { value: false },
  },
}));

import { CSS as CSS_CONST } from '@/constants';
import * as domUtils from '@shared/dom/utils';
import { logger } from '@shared/logging';
import { gallerySignals } from '@shared/state/signals/gallery.signals';

describe('DOM Utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    gallerySignals.isOpen.value = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    gallerySignals.isOpen.value = false;
  });

  describe('ensureGalleryScrollAvailable', () => {
    it('sets overflowY to auto when not set', () => {
      const container = document.createElement('div');
      const list = document.createElement('div');
      list.setAttribute('data-xeg-role', 'items-list');
      container.appendChild(list);

      domUtils.ensureGalleryScrollAvailable(container);

      expect(list.style.overflowY).toBe('auto');
    });

    it('does not modify overflowY when already a scroll', () => {
      const container = document.createElement('div');
      const list = document.createElement('div');
      list.style.overflowY = 'scroll';
      container.appendChild(list);

      domUtils.ensureGalleryScrollAvailable(container);

      expect(list.style.overflowY).toBe('scroll');
    });

    it('does not modify overflowY when already auto', () => {
      const container = document.createElement('div');
      const list = document.createElement('div');
      list.style.overflowY = 'auto';
      list.setAttribute('data-xeg-role', 'items-list');
      container.appendChild(list);

      domUtils.ensureGalleryScrollAvailable(container);

      expect(list.style.overflowY).toBe('auto');
    });

    it('is safe for null parameter', () => {
      expect(() => domUtils.ensureGalleryScrollAvailable(null)).not.toThrow();
    });

    it('sets overflowY to auto when it is set to hidden', () => {
      const container = document.createElement('div');
      const list = document.createElement('div');
      list.style.overflowY = 'hidden';
      list.setAttribute('data-xeg-role', 'items-list');
      container.appendChild(list);

      domUtils.ensureGalleryScrollAvailable(container);

      expect(list.style.overflowY).toBe('auto');
    });
  });

  describe('isVideoControlElement', () => {
    it('returns true for <video> element', () => {
      const video = document.createElement('video');
      expect(domUtils.isVideoControlElement(video)).toBe(true);
    });

    it('returns false for unrelated elements', () => {
      const div = document.createElement('div');
      expect(domUtils.isVideoControlElement(div)).toBe(false);
    });

    it('returns true when matches selector', () => {
      const div = document.createElement('div');
      div.matches = vi.fn().mockReturnValue(true);
      expect(domUtils.isVideoControlElement(div)).toBe(true);
    });

    it('handles element.matches throwing', () => {
      const div = document.createElement('div');
      vi.spyOn(div, 'matches').mockImplementation(() => {
        throw new Error('Invalid selector');
      });
      expect(domUtils.isVideoControlElement(div)).toBe(false);
    });

    it('returns true when closest returns a matching parent element', () => {
      const parent = document.createElement('div');
      parent.setAttribute('data-testid', 'playButton');
      const div = document.createElement('div');
      parent.appendChild(div);
      expect(domUtils.isVideoControlElement(div)).toBe(true);
    });

    it('handles null', () => {
      expect(domUtils.isVideoControlElement(null)).toBe(false);
    });
  });

  describe('isGalleryInternalElement', () => {
    it('returns true for gallery elements', () => {
      const el = document.createElement('div');
      el.classList.add(CSS_CONST.CLASSES.ROOT);
      expect(domUtils.isGalleryInternalElement(el)).toBe(true);
    });

    it('returns false for external nodes', () => {
      const el = document.createElement('div');
      expect(domUtils.isGalleryInternalElement(el)).toBe(false);
    });

    it('returns false for non-element nodes', () => {
      const text = document.createTextNode('text');
      expect(domUtils.isGalleryInternalElement(text as unknown as HTMLElement)).toBe(false);
    });

    it('returns false and logs when matches not a function', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'matches', { value: undefined, writable: true });
      expect(domUtils.isGalleryInternalElement(el as unknown as HTMLElement)).toBe(false);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('handles selector errors gracefully', () => {
      const el = document.createElement('div');
      vi.spyOn(el, 'matches').mockImplementation(() => {
        throw new Error('Invalid selector');
      });
      expect(domUtils.isGalleryInternalElement(el)).toBe(false);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('returns false when closest throws', () => {
      const el = document.createElement('div');
      // Simulate a closest implementation that throws
      vi.spyOn(el, 'closest').mockImplementation(() => {
        throw new Error('Invalid selector in closest');
      });

      expect(domUtils.isGalleryInternalElement(el)).toBe(false);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('returns true if an ancestor matches gallery selectors', () => {
      const parent = document.createElement('div');
      parent.classList.add(CSS_CONST.CLASSES.ROOT);
      const child = document.createElement('div');
      parent.appendChild(child);

      // Use real DOM closest behavior
      expect(domUtils.isGalleryInternalElement(child)).toBe(true);
    });
  });

  describe('canTriggerGallery', () => {
    it('returns false when gallery is open', () => {
      gallerySignals.isOpen.value = true;
      const el = document.createElement('div');
      expect(domUtils.canTriggerGallery(el)).toBe(false);
    });

    it('returns false for video controls', () => {
      const video = document.createElement('video');
      expect(domUtils.canTriggerGallery(video)).toBe(false);
    });

    it('returns false when target is null', () => {
      // Null param is allowed per function signature (HTMLElement | null)
      expect(domUtils.canTriggerGallery(null)).toBe(false);
    });

    it('returns true for valid external targets when closed', () => {
      const el = document.createElement('div');
      expect(domUtils.canTriggerGallery(el)).toBe(true);
    });

    it('returns false when element is internal to gallery', () => {
      const el = document.createElement('div');
      // simulate internal check via matches
      el.matches = vi.fn().mockImplementation((selector) => {
        if (typeof selector === 'string' && selector.includes('video')) return false;
        return true;
      });
      // ensure not considered a video control
      el.closest = () => null;
      expect(domUtils.canTriggerGallery(el)).toBe(false);
    });

    it('respects video control detection via element matching', () => {
      const el = document.createElement('div');
      gallerySignals.isOpen.value = false;
      // Simulate a video control element by returning true when selector includes 'video'
      el.matches = vi.fn().mockImplementation((selector) => {
        return typeof selector === 'string' && selector.includes('video');
      });
      // ensure not considered an internal gallery element
      el.closest = () => null;
      expect(domUtils.canTriggerGallery(el)).toBe(false);
    });

    it('respects video control detection via closest', () => {
      const parent = document.createElement('div');
      parent.setAttribute('data-testid', 'playButton');
      const child = document.createElement('div');
      parent.appendChild(child);
      gallerySignals.isOpen.value = false;

      expect(domUtils.canTriggerGallery(child)).toBe(false);
    });
  });

  describe('isGalleryContainer', () => {
    it('returns true for container elements', () => {
      const el = document.createElement('div');
      el.classList.add(CSS_CONST.CLASSES.CONTAINER);
      expect(domUtils.isGalleryContainer(el)).toBe(true);
    });

    it('returns false for other elements', () => {
      const el = document.createElement('div');
      expect(domUtils.isGalleryContainer(el)).toBe(false);
    });

    it('handles selector errors gracefully', () => {
      const el = document.createElement('div');
      vi.spyOn(el, 'matches').mockImplementation(() => {
        throw new Error('Invalid selector');
      });
      expect(domUtils.isGalleryContainer(el)).toBe(false);
    });
  });

  describe('isGalleryInternalEvent', () => {
    it('returns true when event target is internal', () => {
      const el = document.createElement('div');
      el.classList.add(CSS_CONST.CLASSES.ROOT);
      const ev = { target: el } as unknown as Event;
      expect(domUtils.isGalleryInternalEvent(ev)).toBe(true);
    });

    it('returns false when event target is external', () => {
      const el = document.createElement('div');
      const ev = { target: el } as unknown as Event;
      expect(domUtils.isGalleryInternalEvent(ev)).toBe(false);
    });
  });
});
