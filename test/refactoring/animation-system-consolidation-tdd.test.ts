/**
 * @fileoverview TDD Phase 3: Animation System Consolidation Tests
 * @description RED-GREEN-REFACTOR cycle for animation system unification
 * @version 1.0.0 - Initial TDD implementation
 */

import './animation-setup';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Test imports - should work after consolidation
import { AnimationService } from '@shared/services/animation-service';

describe('TDD Phase 3: Animation System Consolidation', () => {
  let mockElement: HTMLElement;
  let animationService: AnimationService;

  beforeEach(() => {
    // Mock DOM environment
    mockElement = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
      },
      style: {
        setProperty: vi.fn(),
        removeProperty: vi.fn(),
        transition: '',
        opacity: '',
        transform: '',
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;

    // Mock document for style injection tests
    global.document = {
      createElement: vi.fn().mockReturnValue({
        id: '',
        textContent: '',
        setAttribute: vi.fn(),
      }),
      head: {
        appendChild: vi.fn(),
      },
      getElementById: vi.fn().mockReturnValue(null),
      body: mockElement,
      querySelectorAll: vi.fn().mockReturnValue([]),
      documentElement: {
        scrollHeight: 2000,
      },
    } as unknown as Document;

    global.window = {
      scrollY: 100,
      innerHeight: 800,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis;

    animationService = AnimationService.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('RED Phase: Static Animation Utilities', () => {
    it('should have animateCustom static method', () => {
      // 🔴 RED: This should fail initially
      expect(typeof AnimationService.animateCustom).toBe('function');
    });

    it('should have animateParallel static method', () => {
      // 🔴 RED: This should fail initially
      expect(typeof AnimationService.animateParallel).toBe('function');
    });

    it('should have setupScrollAnimation static method', () => {
      // 🔴 RED: This should fail initially
      expect(typeof AnimationService.setupScrollAnimation).toBe('function');
    });

    it('should have setupInViewAnimation static method', () => {
      // 🔴 RED: This should fail initially
      expect(typeof AnimationService.setupInViewAnimation).toBe('function');
    });

    it('should have transformValue static method', () => {
      // 🔴 RED: This should fail initially
      expect(typeof AnimationService.transformValue).toBe('function');
    });

    it('should have ANIMATION_PRESETS static property', () => {
      // 🔴 RED: This should fail initially
      expect(AnimationService.ANIMATION_PRESETS).toBeDefined();
      expect(typeof AnimationService.ANIMATION_PRESETS).toBe('object');
    });
  });

  describe('GREEN Phase: Custom Animation Implementation', () => {
    it('should implement animateCustom with CSS transitions', async () => {
      // Mock setTimeout for Promise resolution
      vi.spyOn(global, 'setTimeout').mockImplementation((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      });

      const keyframes = { opacity: '1', transform: 'translateX(0)' };
      const options = { duration: 300, easing: 'ease-out' };

      await AnimationService.animateCustom(mockElement, keyframes, options);

      expect(mockElement.style.transition).toContain('opacity 300ms ease-out');
      expect(mockElement.style.transition).toContain('transform 300ms ease-out');
      expect(mockElement.style.setProperty).toHaveBeenCalledWith('opacity', '1');
      expect(mockElement.style.setProperty).toHaveBeenCalledWith('transform', 'translateX(0)');
    });

    it('should implement animateParallel for concurrent animations', async () => {
      const element1 = { ...mockElement };
      const element2 = { ...mockElement };

      const animations = [
        { element: element1, keyframes: { opacity: '0.5' } },
        { element: element2, keyframes: { transform: 'scale(1.1)' } },
      ];

      vi.spyOn(global, 'setTimeout').mockImplementation((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      });

      await AnimationService.animateParallel(animations);

      expect(element1.style.setProperty).toHaveBeenCalledWith('opacity', '0.5');
      expect(element2.style.setProperty).toHaveBeenCalledWith('transform', 'scale(1.1)');
    });

    it('should implement setupScrollAnimation with event handlers', () => {
      const onScroll = vi.fn();

      // Mock window object
      global.window = {
        scrollY: 100,
        innerHeight: 800,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as Window & typeof globalThis;

      global.document.documentElement = {
        scrollHeight: 2000,
      } as unknown as HTMLElement;

      const cleanup = AnimationService.setupScrollAnimation(onScroll);

      expect(typeof cleanup).toBe('function');
      expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), {
        passive: true,
      });
    });

    it('should implement setupInViewAnimation with IntersectionObserver', () => {
      const onInView = vi.fn();
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };

      global.IntersectionObserver = vi.fn().mockImplementation(() => mockObserver);

      const cleanup = AnimationService.setupInViewAnimation(mockElement, onInView);

      expect(global.IntersectionObserver).toHaveBeenCalled();
      expect(mockObserver.observe).toHaveBeenCalledWith(mockElement);
      expect(typeof cleanup).toBe('function');
    });

    it('should implement transformValue for value mapping', () => {
      const result = AnimationService.transformValue(5, [0, 10], [0, 100]);
      expect(result).toBe(50);

      const result2 = AnimationService.transformValue(2, [0, 4], [10, 20]);
      expect(result2).toBe(15);
    });

    it('should provide ANIMATION_PRESETS with all required presets', () => {
      const presets = AnimationService.ANIMATION_PRESETS;

      expect(presets.fadeIn).toBeDefined();
      expect(presets.fadeOut).toBeDefined();
      expect(presets.slideInFromBottom).toBeDefined();
      expect(presets.scaleIn).toBeDefined();
      expect(presets.imageLoad).toBeDefined();

      // Verify preset structure
      expect(presets.fadeIn.keyframes).toBeDefined();
      expect(presets.fadeIn.options).toBeDefined();
      expect(presets.fadeIn.options.duration).toBe(300);
    });
  });

  describe('REFACTOR Phase: Enhanced Integration', () => {
    it('should handle edge cases in animateCustom', async () => {
      // Test with missing setProperty method
      const elementWithoutSetProperty = {
        style: {
          transition: '',
        },
      } as unknown as HTMLElement;

      vi.spyOn(global, 'setTimeout').mockImplementation((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      });

      // Should not throw error
      await expect(
        AnimationService.animateCustom(elementWithoutSetProperty, { opacity: '1' })
      ).resolves.toBeUndefined();
    });

    it('should handle missing IntersectionObserver gracefully', () => {
      global.IntersectionObserver = undefined as unknown as typeof IntersectionObserver;

      const cleanup = AnimationService.setupInViewAnimation(mockElement, vi.fn());

      expect(typeof cleanup).toBe('function');
      // Should return no-op function when IntersectionObserver is not available
      cleanup();
    });

    it('should handle scroll animation with custom container', () => {
      const onScroll = vi.fn();
      const container = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as Element;

      const cleanup = AnimationService.setupScrollAnimation(onScroll, container);

      expect(container.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), {
        passive: true,
      });
      expect(typeof cleanup).toBe('function');
    });

    it('should maintain backward compatibility through re-exports', () => {
      // Test that animations.ts can still be imported after refactoring
      expect(() => {
        // This will be tested after we update the animations.ts file
        const animationsModule = require('@shared/utils/animations');
        expect(animationsModule.animateCustom).toBeDefined();
        expect(animationsModule.ANIMATION_PRESETS).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work seamlessly with existing AnimationService methods', async () => {
      // Test that new static methods work alongside existing instance methods
      await animationService.fadeIn(mockElement);
      await AnimationService.animateCustom(mockElement, { opacity: '0.5' });

      expect(mockElement.classList.add).toHaveBeenCalled();
      expect(mockElement.style.setProperty).toHaveBeenCalled();
    });

    it('should preserve animation cleanup functionality', () => {
      animationService.cleanupAnimations(mockElement);

      expect(mockElement.classList.remove).toHaveBeenCalled();
    });
  });
});
