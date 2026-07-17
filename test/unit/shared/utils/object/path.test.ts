// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import { resolveNestedPath } from '@shared/utils/object/path';

describe('object/path', () => {
  describe('resolveNestedPath', () => {
    const source = {
      gallery: {
        theme: 'dark',
        enableKeyboard: true,
        nested: { deep: { value: 42 } },
      },
      toolbar: { visible: true },
      items: ['a', 'b', 'c'],
    };

    it('should resolve top-level paths', () => {
      expect(resolveNestedPath(source, 'gallery')).toEqual(source.gallery);
      expect(resolveNestedPath(source, 'toolbar')).toEqual(source.toolbar);
    });

    it('should resolve nested paths', () => {
      expect(resolveNestedPath(source, 'gallery.theme')).toBe('dark');
      expect(resolveNestedPath(source, 'gallery.enableKeyboard')).toBe(true);
      expect(resolveNestedPath(source, 'gallery.nested.deep.value')).toBe(42);
    });

    it('should return undefined for missing paths', () => {
      expect(resolveNestedPath(source, 'nonexistent')).toBeUndefined();
      expect(resolveNestedPath(source, 'gallery.nonexistent')).toBeUndefined();
      expect(resolveNestedPath(source, 'gallery.theme.extra')).toBeUndefined();
    });

    it('should return undefined for empty path', () => {
      expect(resolveNestedPath(source, '')).toBeUndefined();
    });

    it('should return undefined for null/undefined source', () => {
      expect(resolveNestedPath(null, 'gallery')).toBeUndefined();
      expect(resolveNestedPath(undefined, 'gallery')).toBeUndefined();
    });

    it('should handle array indices in path', () => {
      expect(resolveNestedPath(source, 'items.0')).toBe('a');
      expect(resolveNestedPath(source, 'items.2')).toBe('c');
    });

    it('should handle paths through non-object intermediates', () => {
      expect(resolveNestedPath(source, 'gallery.theme.length')).toBeUndefined(); // string is not an object for further traversal
    });

    it('should handle very deep paths', () => {
      const deep = { a: { b: { c: { d: { e: 'deep' } } } } };
      expect(resolveNestedPath(deep, 'a.b.c.d.e')).toBe('deep');
      expect(resolveNestedPath(deep, 'a.b.c.d.e.f')).toBeUndefined();
    });
  });
});
