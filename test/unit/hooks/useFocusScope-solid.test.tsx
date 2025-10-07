/* eslint-disable no-undef */
/**
 * createFocusScope Primitive Test (Phase 3 TDD)
 * @description Solid.js primitives로 변환된 Focus Scope 테스트
 */

import { describe, it, expect } from 'vitest';
import { createRoot } from 'solid-js';
import { createFocusScope } from '@/shared/primitives/focusScope-solid';

describe('createFocusScope (Phase 3 TDD)', () => {
  describe('Focus Scope 기본 동작', () => {
    it('should create a focus scope primitive', () => {
      createRoot(dispose => {
        const scope = createFocusScope();

        expect(scope).toBeDefined();
        expect(typeof scope.ref).toBe('function');
        expect(typeof scope.getElement).toBe('function');

        dispose();
      });
    });

    it('should initially return null element', () => {
      createRoot(dispose => {
        const scope = createFocusScope();

        expect(scope.getElement()).toBeNull();

        dispose();
      });
    });

    it('should store element reference when ref is called', () => {
      createRoot(dispose => {
        const scope = createFocusScope<HTMLDivElement>();
        const div = document.createElement('div');

        scope.ref(div);

        expect(scope.getElement()).toBe(div);

        dispose();
      });
    });

    it('should update reference when ref is called multiple times', () => {
      createRoot(dispose => {
        const scope = createFocusScope<HTMLDivElement>();
        const div1 = document.createElement('div');
        const div2 = document.createElement('div');

        scope.ref(div1);
        expect(scope.getElement()).toBe(div1);

        scope.ref(div2);
        expect(scope.getElement()).toBe(div2);

        dispose();
      });
    });

    it('should clear reference when ref is called with null', () => {
      createRoot(dispose => {
        const scope = createFocusScope<HTMLDivElement>();
        const div = document.createElement('div');

        scope.ref(div);
        expect(scope.getElement()).toBe(div);

        scope.ref(null);
        expect(scope.getElement()).toBeNull();

        dispose();
      });
    });
  });

  describe('Type Safety', () => {
    it('should work with specific element types', () => {
      createRoot(dispose => {
        const buttonScope = createFocusScope<HTMLButtonElement>();
        const button = document.createElement('button');

        buttonScope.ref(button);

        const el = buttonScope.getElement();
        expect(el).toBe(button);
        // Type assertion for test - in real code, TypeScript ensures type safety
        expect(el?.tagName).toBe('BUTTON');

        dispose();
      });
    });
  });

  describe('Solid Primitives Migration', () => {
    it('should provide simpler API than Preact useRef', () => {
      createRoot(dispose => {
        const scope = createFocusScope<HTMLDivElement>();

        // Solid pattern: direct ref function
        expect(typeof scope.ref).toBe('function');

        // No need for .current property like Preact
        const div = document.createElement('div');
        scope.ref(div);

        // Direct accessor instead of .current
        expect(scope.getElement()).toBe(div);

        dispose();
      });
    });
  });
});
