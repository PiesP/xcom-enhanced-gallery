/**
 * @fileoverview TDD Phase 3: Animation System Consolidation - Core Tests
 * @description Focused tests for static method validation
 */

import { describe, it, expect } from 'vitest';
import { AnimationService } from '@shared/services/animation-service';

describe('TDD Phase 3: Animation System - Core Functionality', () => {
  describe('Static Methods Existence', () => {
    it('should have all required static methods', () => {
      expect(typeof AnimationService.animateCustom).toBe('function');
      expect(typeof AnimationService.animateParallel).toBe('function');
      expect(typeof AnimationService.setupScrollAnimation).toBe('function');
      expect(typeof AnimationService.setupInViewAnimation).toBe('function');
      expect(typeof AnimationService.transformValue).toBe('function');
    });

    it('should have ANIMATION_PRESETS property', () => {
      expect(AnimationService.ANIMATION_PRESETS).toBeDefined();
      expect(typeof AnimationService.ANIMATION_PRESETS).toBe('object');

      // Check key presets
      expect(AnimationService.ANIMATION_PRESETS.fadeIn).toBeDefined();
      expect(AnimationService.ANIMATION_PRESETS.fadeOut).toBeDefined();
      expect(AnimationService.ANIMATION_PRESETS.scaleIn).toBeDefined();
    });
  });

  describe('Static Method Functionality', () => {
    it('should transform values correctly', () => {
      const result1 = AnimationService.transformValue(5, [0, 10], [0, 100]);
      expect(result1).toBe(50);

      const result2 = AnimationService.transformValue(2, [0, 4], [10, 20]);
      expect(result2).toBe(15);

      const result3 = AnimationService.transformValue(0, [0, 1], [0, 255]);
      expect(result3).toBe(0);
    });

    it('should handle edge cases in transformValue', () => {
      const result1 = AnimationService.transformValue(10, [0, 10], [0, 100]);
      expect(result1).toBe(100);

      const result2 = AnimationService.transformValue(0, [0, 10], [50, 150]);
      expect(result2).toBe(50);
    });

    it('should return cleanup function from setupScrollAnimation', () => {
      // Mock minimal window
      global.window = {
        scrollY: 0,
        innerHeight: 800,
        addEventListener: () => {},
        removeEventListener: () => {},
      } as any;

      global.document = {
        documentElement: { scrollHeight: 2000 },
      } as any;

      const cleanup = AnimationService.setupScrollAnimation(() => {});
      expect(typeof cleanup).toBe('function');
    });

    it('should handle missing IntersectionObserver gracefully', () => {
      // Clear global IntersectionObserver
      const originalIntersectionObserver = global.IntersectionObserver;
      global.IntersectionObserver = undefined as any;
      global.globalThis = {} as any;

      const mockElement = {} as Element;
      const cleanup = AnimationService.setupInViewAnimation(mockElement, () => {});

      expect(typeof cleanup).toBe('function');
      // Should be a no-op function
      cleanup();

      // Restore
      global.IntersectionObserver = originalIntersectionObserver;
    });
  });

  describe('Integration with existing AnimationService', () => {
    it('should not break singleton pattern', () => {
      const instance1 = AnimationService.getInstance();
      const instance2 = AnimationService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeDefined();
    });

    it('should have both static and instance methods', () => {
      const instance = AnimationService.getInstance();

      // Instance methods
      expect(typeof instance.fadeIn).toBe('function');
      expect(typeof instance.fadeOut).toBe('function');

      // Static methods
      expect(typeof AnimationService.animateCustom).toBe('function');
      expect(typeof AnimationService.transformValue).toBe('function');
    });
  });
});
