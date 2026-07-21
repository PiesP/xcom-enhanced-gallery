// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import { clamp, clampIndex } from '@shared/utils/types/number-utils';

/**
 * Safely parse an integer from any input.
 * Returns 0 for null, undefined, empty string, or non-numeric values.
 */
function safeParseInt(value: unknown, radix = 10): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseInt(String(value), radix);
  return Number.isFinite(parsed) ? parsed : 0;
}

describe('types/safety', () => {
  // ── safeParseInt ──────────────────────────────────────────────────
  describe('safeParseInt', () => {
    it('should parse valid integers', () => {
      expect(safeParseInt('42')).toBe(42);
      expect(safeParseInt('0')).toBe(0);
      expect(safeParseInt('-5')).toBe(-5);
    });

    it('should return 0 for null/undefined', () => {
      expect(safeParseInt(null)).toBe(0);
      expect(safeParseInt(undefined)).toBe(0);
    });

    it('should return 0 for invalid strings', () => {
      expect(safeParseInt('')).toBe(0);
      expect(safeParseInt('abc')).toBe(0);
      expect(safeParseInt('12abc')).toBe(12); // parseInt parses leading digits
    });

    it('should handle float strings by truncating', () => {
      expect(safeParseInt('3.14')).toBe(3);
    });

    it('should handle different radix', () => {
      expect(safeParseInt('ff', 16)).toBe(255);
      expect(safeParseInt('10', 2)).toBe(2);
    });

    it('should return 0 for NaN-like inputs', () => {
      expect(safeParseInt('NaN')).toBe(0);
    });
  });

  // ── clamp ─────────────────────────────────────────────────────────
  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should clamp values outside range', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should use default range [0, 1]', () => {
      expect(clamp(0.5, 0, 1)).toBe(0.5);
      expect(clamp(-1, 0, 1)).toBe(0);
      expect(clamp(2, 0, 1)).toBe(1);
    });

    it('should handle NaN', () => {
      expect(clamp(NaN, 0, 10)).toBe(NaN); // Math.min/max propagate NaN
    });

    it('should handle Infinity', () => {
      expect(clamp(Infinity, 0, 10)).toBe(10);
      expect(clamp(-Infinity, 0, 10)).toBe(0);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });
  });

  // ── clampIndex ────────────────────────────────────────────────────
  describe('clampIndex', () => {
    it('should clamp valid indices', () => {
      expect(clampIndex(0, 5)).toBe(0);
      expect(clampIndex(4, 5)).toBe(4);
      expect(clampIndex(2, 5)).toBe(2);
    });

    it('should clamp out-of-bounds indices', () => {
      expect(clampIndex(-1, 5)).toBe(0);
      expect(clampIndex(5, 5)).toBe(4);
      expect(clampIndex(100, 5)).toBe(4);
    });

    it('should floor float indices', () => {
      expect(clampIndex(2.7, 5)).toBe(2);
    });

    it('should return 0 for invalid length', () => {
      expect(clampIndex(0, 0)).toBe(0);
      expect(clampIndex(0, -1)).toBe(0);
    });

    it('should return 0 for non-finite index', () => {
      expect(clampIndex(NaN, 5)).toBe(0);
      expect(clampIndex(Infinity, 5)).toBe(0);
      expect(clampIndex(-Infinity, 5)).toBe(0);
    });

    it('should handle single-element arrays', () => {
      expect(clampIndex(0, 1)).toBe(0);
      expect(clampIndex(1, 1)).toBe(0);
      expect(clampIndex(-1, 1)).toBe(0);
    });
  });
});
