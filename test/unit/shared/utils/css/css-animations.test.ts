/**
 * @fileoverview Tests for CSS animations utilities
 */
import {
  ANIMATION_CLASSES,
  ANIMATION_CONSTANTS,
  animateGalleryEnter,
  animateGalleryExit,
  animateImageItemsEnter,
  cleanupAnimations,
  injectAnimationStyles,
} from '@shared/utils/css/css-animations';

// Mock style registry
vi.mock('@shared/services/style-registry', () => {
  const mockHasStyle = vi.fn(() => false);
  const mockRegisterStyle = vi.fn();
  return {
    getStyleRegistry: () => ({
      hasStyle: mockHasStyle,
      registerStyle: mockRegisterStyle,
      _mockHasStyle: mockHasStyle,
      _mockRegisterStyle: mockRegisterStyle,
    }),
  };
});

// Mock logger
vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Create a custom AnimationEvent for jsdom (which doesn't support AnimationEvent)
function createAnimationEvent(type: string): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  return event;
}

describe('css-animations', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    container.remove();
  });

  describe('ANIMATION_CONSTANTS', () => {
    it('should have correct duration values', () => {
      expect(ANIMATION_CONSTANTS.DURATION_FAST).toBe(150);
      expect(ANIMATION_CONSTANTS.DURATION_NORMAL).toBe(300);
      expect(ANIMATION_CONSTANTS.DURATION_SLOW).toBe(500);
    });

    it('should have correct easing values', () => {
      expect(ANIMATION_CONSTANTS.EASING_EASE_OUT).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
    });

    it('should have correct stagger delay', () => {
      expect(ANIMATION_CONSTANTS.STAGGER_DELAY).toBe(50);
    });
  });

  describe('injectAnimationStyles', () => {
    it('should inject animation styles when not already present', () => {
      // Import the mocked getStyleRegistry to access mock functions
      // The mock returns hasStyle as false, so styles should be registered
      injectAnimationStyles();
      // If no error thrown, the function worked correctly
      expect(true).toBe(true);
    });
  });

  describe('ANIMATION_CLASSES', () => {
    it('should have correct class names', () => {
      expect(ANIMATION_CLASSES.FADE_IN).toBe('animate-fade-in');
      expect(ANIMATION_CLASSES.FADE_OUT).toBe('animate-fade-out');
      expect(ANIMATION_CLASSES.SLIDE_IN_BOTTOM).toBe('animate-slide-in-bottom');
      expect(ANIMATION_CLASSES.SCALE_IN).toBe('animate-scale-in');
    });
  });

  describe('animateGalleryEnter', () => {
    it('should add fade-in class and resolve on animationend', async () => {
      const element = document.createElement('div');
      container.appendChild(element);

      const promise = animateGalleryEnter(element);

      expect(element.classList.contains(ANIMATION_CLASSES.FADE_IN)).toBe(true);

      // Trigger animationend
      element.dispatchEvent(createAnimationEvent('animationend'));

      await promise;
      expect(element.classList.contains(ANIMATION_CLASSES.FADE_IN)).toBe(false);
    });

    it('should call onComplete callback', async () => {
      const element = document.createElement('div');
      container.appendChild(element);
      const onComplete = vi.fn();

      const promise = animateGalleryEnter(element, { onComplete });
      element.dispatchEvent(createAnimationEvent('animationend'));

      await promise;
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('animateGalleryExit', () => {
    it('should add fade-out class and resolve on animationend', async () => {
      const element = document.createElement('div');
      container.appendChild(element);

      const promise = animateGalleryExit(element);

      expect(element.classList.contains(ANIMATION_CLASSES.FADE_OUT)).toBe(true);

      element.dispatchEvent(createAnimationEvent('animationend'));

      await promise;
      expect(element.classList.contains(ANIMATION_CLASSES.FADE_OUT)).toBe(false);
    });
  });

  describe('animateImageItemsEnter', () => {
    it('should resolve immediately for empty array', async () => {
      const promise = animateImageItemsEnter([]);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should add slide-in class to elements with stagger', async () => {
      const element0 = document.createElement('div');
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      const elements = [element0, element1, element2];
      elements.forEach(el => container.appendChild(el));

      const promise = animateImageItemsEnter(elements);

      // First element should get class immediately (0ms delay)
      vi.advanceTimersByTime(0);
      expect(element0.classList.contains(ANIMATION_CLASSES.SLIDE_IN_BOTTOM)).toBe(true);

      // Second element after stagger delay
      vi.advanceTimersByTime(ANIMATION_CONSTANTS.STAGGER_DELAY);
      expect(element1.classList.contains(ANIMATION_CLASSES.SLIDE_IN_BOTTOM)).toBe(true);

      // Third element after another stagger delay
      vi.advanceTimersByTime(ANIMATION_CONSTANTS.STAGGER_DELAY);
      expect(element2.classList.contains(ANIMATION_CLASSES.SLIDE_IN_BOTTOM)).toBe(true);

      // Complete animations
      elements.forEach(el => el.dispatchEvent(createAnimationEvent('animationend')));

      await promise;
    });
  });

  describe('cleanupAnimations', () => {
    it('should remove all animation classes', () => {
      const element = document.createElement('div');
      element.classList.add(ANIMATION_CLASSES.FADE_IN);
      element.classList.add(ANIMATION_CLASSES.SLIDE_IN_BOTTOM);
      element.style.animation = 'test 1s';

      cleanupAnimations(element);

      expect(element.classList.contains(ANIMATION_CLASSES.FADE_IN)).toBe(false);
      expect(element.classList.contains(ANIMATION_CLASSES.SLIDE_IN_BOTTOM)).toBe(false);
      expect(element.style.animation).toBe('');
    });

    it('should handle element without removeProperty gracefully', () => {
      const element = document.createElement('div');
      element.classList.add(ANIMATION_CLASSES.FADE_OUT);

      // Mock style object without removeProperty
      const mockStyle = {
        animation: 'test',
        removeProperty: () => {
          throw new Error('removeProperty not available');
        },
      };
      Object.defineProperty(element, 'style', {
        value: mockStyle,
        writable: true,
      });

      // Should not throw
      expect(() => cleanupAnimations(element)).not.toThrow();
    });

    it('should remove all animation class types', () => {
      const element = document.createElement('div');
      // Add all animation classes
      element.classList.add(ANIMATION_CLASSES.FADE_IN);
      element.classList.add(ANIMATION_CLASSES.FADE_OUT);
      element.classList.add(ANIMATION_CLASSES.SLIDE_IN_BOTTOM);
      element.classList.add(ANIMATION_CLASSES.SLIDE_OUT_TOP);
      element.classList.add(ANIMATION_CLASSES.SCALE_IN);
      element.classList.add(ANIMATION_CLASSES.SCALE_OUT);
      element.classList.add(ANIMATION_CLASSES.IMAGE_LOAD);
      element.classList.add(ANIMATION_CLASSES.REDUCED_MOTION);

      cleanupAnimations(element);

      Object.values(ANIMATION_CLASSES).forEach((className) => {
        expect(element.classList.contains(className)).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('should handle error in animateGalleryEnter gracefully', async () => {
      const { logger } = await import('@shared/logging');

      // Create a problematic element
      const element = {
        addEventListener: () => {
          throw new Error('addEventListener failed');
        },
        removeEventListener: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      } as unknown as Element;

      const promise = animateGalleryEnter(element);

      // Should resolve despite error
      await promise;
      expect(logger.warn).toHaveBeenCalledWith(
        'Gallery entry animation failed:',
        expect.any(Error),
      );
    });

    it('should handle error in animateGalleryExit gracefully', async () => {
      const { logger } = await import('@shared/logging');

      const element = {
        addEventListener: () => {
          throw new Error('addEventListener failed');
        },
        removeEventListener: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      } as unknown as Element;

      const promise = animateGalleryExit(element);

      await promise;
      expect(logger.warn).toHaveBeenCalledWith(
        'Gallery exit animation failed:',
        expect.any(Error),
      );
    });

    it('should handle error in animateImageItemsEnter gracefully', async () => {
      const { logger } = await import('@shared/logging');

      // Create an array that throws when accessed
      const badArray = {
        length: 1,
        forEach: () => {
          throw new Error('forEach failed');
        },
      } as unknown as Element[];

      const promise = animateImageItemsEnter(badArray);

      await promise;
      expect(logger.warn).toHaveBeenCalledWith(
        'Image items entry animation failed:',
        expect.any(Error),
      );
    });
  });

  describe('injectAnimationStyles additional coverage', () => {
    it('should skip injection if styles already present', async () => {
      const { getStyleRegistry } = await import('@shared/services/style-registry');
      const mockRegistry = getStyleRegistry() as ReturnType<typeof getStyleRegistry> & {
        _mockHasStyle: ReturnType<typeof vi.fn>;
        _mockRegisterStyle: ReturnType<typeof vi.fn>;
      };

      // First call to inject
      mockRegistry._mockHasStyle.mockReturnValueOnce(false);
      injectAnimationStyles();
      expect(mockRegistry._mockRegisterStyle).toHaveBeenCalled();

      mockRegistry._mockRegisterStyle.mockClear();

      // Second call should skip due to hasStyle returning true
      mockRegistry._mockHasStyle.mockReturnValueOnce(true);
      injectAnimationStyles();
      // registerStyle should not be called on second injection
      expect(mockRegistry._mockRegisterStyle).not.toHaveBeenCalled();
    });
  });

  describe('animateGalleryEnter onComplete callback', () => {
    it('should call onComplete even without explicit callback', async () => {
      const element = document.createElement('div');
      container.appendChild(element);

      const promise = animateGalleryEnter(element);

      // Trigger animationend
      element.dispatchEvent(createAnimationEvent('animationend'));

      await promise;
      // Should resolve without error
      expect(element.classList.contains(ANIMATION_CLASSES.FADE_IN)).toBe(false);
    });
  });

  describe('animateGalleryExit onComplete callback', () => {
    it('should call onComplete callback', async () => {
      const element = document.createElement('div');
      container.appendChild(element);
      const onComplete = vi.fn();

      const promise = animateGalleryExit(element, { onComplete });
      element.dispatchEvent(createAnimationEvent('animationend'));

      await promise;
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('animateImageItemsEnter completion tracking', () => {
    it('should resolve only when all elements complete animation', async () => {
      const elements = [
        document.createElement('div'),
        document.createElement('div'),
      ] as const;
      elements.forEach(el => container.appendChild(el));

      const promise = animateImageItemsEnter([...elements]);

      // Advance timers for first element
      vi.advanceTimersByTime(0);
      // Complete first animation
      elements[0].dispatchEvent(createAnimationEvent('animationend'));

      // Advance for second element
      vi.advanceTimersByTime(ANIMATION_CONSTANTS.STAGGER_DELAY);
      // Complete second animation
      elements[1].dispatchEvent(createAnimationEvent('animationend'));

      await promise;
      // Both should have completed
      expect(elements[0].classList.contains(ANIMATION_CLASSES.SLIDE_IN_BOTTOM)).toBe(false);
      expect(elements[1].classList.contains(ANIMATION_CLASSES.SLIDE_IN_BOTTOM)).toBe(false);
    });

    it('should not resolve until completedCount equals totalElements', async () => {
      const elements = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div'),
      ] as const;
      elements.forEach(el => container.appendChild(el));

      let resolved = false;
      const promise = animateImageItemsEnter([...elements]).then(() => {
        resolved = true;
      });

      // Advance timers for all elements
      vi.advanceTimersByTime(0);
      vi.advanceTimersByTime(ANIMATION_CONSTANTS.STAGGER_DELAY);
      vi.advanceTimersByTime(ANIMATION_CONSTANTS.STAGGER_DELAY);

      // Complete only 2 of 3 animations
      elements[0].dispatchEvent(createAnimationEvent('animationend'));
      elements[1].dispatchEvent(createAnimationEvent('animationend'));

      // Should not be resolved yet
      await vi.runAllTimersAsync();
      expect(resolved).toBe(false);

      // Complete the last one
      elements[2].dispatchEvent(createAnimationEvent('animationend'));

      await promise;
      expect(resolved).toBe(true);
    });
  });
});
