/**
 * Vendor Library Utilities Unit Tests
 *
 * 외부 라이브러리 접근을 위한 vendor 유틸리티 테스트
 * Feature-based 아키텍처에 맞춰 설계된 vendor 접근 패턴을 검증합니다.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock external libraries with realistic interfaces
const mockFflate = {
  zip: vi.fn((files, callback) => {
    callback(null, new Uint8Array([80, 75, 3, 4])); // ZIP signature
  }),
  unzip: vi.fn((data, callback) => {
    callback(null, { 'test.txt': new Uint8Array([116, 101, 115, 116]) });
  }),
  strToU8: vi.fn(str => new TextEncoder().encode(str)),
  zipSync: vi.fn(() => new Uint8Array([80, 75, 3, 4])),
  version: '0.7.4',
};

const mockMotion = {
  animate: vi.fn(() => Promise.resolve()),
  timeline: vi.fn(() => Promise.resolve()),
  stagger: vi.fn(duration => index => index * duration),
  version: '10.16.4',
};

const mockPreact = {
  h: vi.fn((type, props, ...children) => {
    return { type, props: props || {}, children };
  }),
  render: vi.fn(),
  Fragment: 'Fragment',
  version: '10.0.0',
};

const mockPreactSignals = {
  signal: vi.fn(value => ({
    value,
    peek: () => value,
    subscribe: vi.fn(),
    valueOf: () => value,
    toString: () => String(value),
    toJSON: () => value,
  })),
  computed: vi.fn(fn => ({
    get value() {
      return fn();
    },
  })),
  effect: vi.fn(fn => {
    fn();
    return () => {}; // cleanup function
  }),
  batch: vi.fn(fn => fn()),
  version: '1.0.0',
};

describe('Vendor Library Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock window with all vendors
    if (typeof globalThis !== 'undefined') {
      Object.defineProperty(globalThis, 'window', {
        value: {
          fflate: mockFflate,
          Motion: mockMotion,
          Preact: mockPreact,
          PreactSignals: mockPreactSignals,
        },
        writable: true,
        configurable: true,
      });
    }
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Basic Library Access', () => {
    it('should access fflate library with proper interface', async () => {
      const { getFflate } = await import('../../../../../src/shared/utils/vendors/index');
      expect(() => getFflate()).not.toThrow();

      const fflate = getFflate();
      expect(fflate).toEqual(
        expect.objectContaining({
          zip: expect.any(Function),
          unzip: expect.any(Function),
          strToU8: expect.any(Function),
          zipSync: expect.any(Function),
        })
      );

      // Test actual functionality
      const testData = new Uint8Array([1, 2, 3, 4]);
      const zipResult = fflate.zipSync({ 'test.bin': testData });
      expect(zipResult).toBeInstanceOf(Uint8Array);
      expect(zipResult[0]).toBe(80); // ZIP signature 'P'
    });

    it('should access Motion library with animation capabilities', async () => {
      const { getMotion } = await import('../../../../../src/shared/utils/vendors/index');
      const motion = getMotion();

      expect(motion).toEqual(
        expect.objectContaining({
          animate: expect.any(Function),
          timeline: expect.any(Function),
          stagger: expect.any(Function),
        })
      );

      // Test stagger function
      const staggerFn = motion.stagger(0.1);
      expect(typeof staggerFn).toBe('function');
      expect(staggerFn(0)).toBe(0);
      expect(staggerFn(1)).toBe(0.1);
    });

    it('should access Preact library with component system', async () => {
      const { getPreact } = await import('../../../../../src/shared/utils/vendors/index');
      const preact = getPreact();

      expect(preact).toEqual(
        expect.objectContaining({
          h: expect.any(Function),
          render: expect.any(Function),
          Fragment: expect.any(String),
        })
      );

      // Test createElement functionality
      const element = preact.h('div', { id: 'test' }, 'Hello World');
      expect(element).toEqual({
        type: 'div',
        props: { id: 'test' },
        children: ['Hello World'],
      });
    });

    it('should access Preact Signals with reactive state', async () => {
      const { getPreactSignals } = await import('../../../../../src/shared/utils/vendors/index');
      const signals = getPreactSignals();

      expect(signals).toEqual(
        expect.objectContaining({
          signal: expect.any(Function),
          computed: expect.any(Function),
          effect: expect.any(Function),
          batch: expect.any(Function),
        })
      );

      // Test signal creation
      const testSignal = signals.signal('initial');
      expect(testSignal.value).toBe('initial');
      expect(testSignal.peek()).toBe('initial');
    });
  });

  describe('Library Validation', () => {
    it('should validate all vendors are loaded', async () => {
      const { validateVendors } = await import('../../../../../src/shared/utils/vendors/index');
      expect(() => validateVendors()).not.toThrow();
    });

    it('should get vendor versions', async () => {
      const { getVendorVersions } = await import('../../../../../src/shared/utils/vendors/index');
      const versions = getVendorVersions();

      expect(versions).toEqual(
        expect.objectContaining({
          fflate: expect.any(String),
          motion: expect.any(String),
          preact: expect.any(String),
          signals: expect.any(String),
        })
      );

      expect(versions.fflate).toBe('0.7.4');
      expect(versions.motion).toBe('10.16.4');
      expect(versions.preact).toBe('10.0.0');
      expect(versions.signals).toBe('1.0.0');
    });
  });

  describe('Initialization Process', () => {
    it('should initialize vendors successfully', async () => {
      const { initializeVendors } = await import('../../../../../src/shared/utils/vendors/index');
      const result = await initializeVendors();

      expect(result.success).toBe(true);
      expect(result.loadedLibraries).toContain('fflate');
      expect(result.loadedLibraries).toContain('Motion');
      expect(result.loadedLibraries).toContain('Preact');
      expect(result.loadedLibraries).toContain('PreactSignals');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing vendor gracefully', async () => {
      // Remove one vendor from window
      Object.defineProperty(globalThis, 'window', {
        value: {
          // fflate is missing
          Motion: mockMotion,
          Preact: mockPreact,
          PreactSignals: mockPreactSignals,
        },
        writable: true,
        configurable: true,
      });

      const { getFflate } = await import('../../../../../src/shared/utils/vendors/index');
      expect(() => getFflate()).toThrow('fflate library not loaded');
    });
  });
});
