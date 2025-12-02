import {
  supportsHasSelector,
  supportsColorMix,
  supportsOklch,
  supportsContainerQueries,
  applyCSSFeatureClasses,
  clearCSSFeatureCache,
  detectCSSFeatures,
} from '@shared/utils/css/css-features';

describe('css-features', () => {
  beforeEach(() => {
    clearCSSFeatureCache();
    delete (globalThis as any).CSS;
  });

  afterEach(() => {
    clearCSSFeatureCache();
    delete (globalThis as any).CSS;
  });

  it('returns false when CSS.supports is unavailable', () => {
    expect(supportsHasSelector()).toBe(false);
    expect(supportsColorMix()).toBe(false);
    expect(supportsOklch()).toBe(false);
    expect(supportsContainerQueries()).toBe(false);
  });

  it('uses CSS.supports when available and caches results', () => {
    (globalThis as any).CSS = { supports: () => true };
    expect(supportsHasSelector()).toBe(true);
    expect(supportsColorMix()).toBe(true);
    expect(supportsOklch()).toBe(true);
    expect(supportsContainerQueries()).toBe(true);

    // Subsequent calls use cached results; altering CSS.supports will not affect cached value
    (globalThis as any).CSS.supports = () => false;
    expect(supportsHasSelector()).toBe(true);
  });

  it('applyCSSFeatureClasses adds classes for support', () => {
    (globalThis as any).CSS = { supports: () => true };
    const root = document.createElement('div');
    applyCSSFeatureClasses(root);
    expect(root.classList.contains('xeg-modern-css')).toBe(true);
  });
});
// Duplicate imports removed - top-level imports already included (vitest runtime globally provided via tsconfig)

describe('css-features', () => {
  let originalCSS: typeof CSS;

  beforeEach(() => {
    // Store original CSS object
    originalCSS = globalThis.CSS;
    // Clear cache before each test
    clearCSSFeatureCache();
  });

  afterEach(() => {
    // Restore original CSS object
    globalThis.CSS = originalCSS;
    clearCSSFeatureCache();
  });

  describe('supportsHasSelector', () => {
    it('should return false when CSS.supports is not available', () => {
      // @ts-expect-error - Testing undefined CSS
      globalThis.CSS = undefined;

      expect(supportsHasSelector()).toBe(false);
    });

    it('should return false when CSS.supports throws an error', () => {
      globalThis.CSS = {
        supports: vi.fn(() => {
          throw new Error('Not supported');
        }),
      } as unknown as typeof CSS;

      expect(supportsHasSelector()).toBe(false);
    });

    it('should return the result from CSS.supports for selector(:has(*))', () => {
      const mockSupports = vi.fn().mockReturnValue(true);
      globalThis.CSS = {
        supports: mockSupports,
      } as unknown as typeof CSS;

      expect(supportsHasSelector()).toBe(true);
      expect(mockSupports).toHaveBeenCalledWith('selector(:has(*))');
    });

    it('should cache the result after first call', () => {
      const mockSupports = vi.fn().mockReturnValue(true);
      globalThis.CSS = {
        supports: mockSupports,
      } as unknown as typeof CSS;

      // First call
      supportsHasSelector();
      // Second call should use cache
      supportsHasSelector();

      expect(mockSupports).toHaveBeenCalledTimes(1);
    });
  });

  describe('supportsColorMix', () => {
    it('should return false when CSS.supports is not available', () => {
      // @ts-expect-error - Testing undefined CSS
      globalThis.CSS = undefined;

      expect(supportsColorMix()).toBe(false);
    });

    it('should return false when CSS.supports throws an error', () => {
      globalThis.CSS = {
        supports: vi.fn(() => {
          throw new Error('Not supported');
        }),
      } as unknown as typeof CSS;

      expect(supportsColorMix()).toBe(false);
    });

    it('should return the result from CSS.supports for color-mix', () => {
      const mockSupports = vi.fn().mockReturnValue(true);
      globalThis.CSS = {
        supports: mockSupports,
      } as unknown as typeof CSS;

      expect(supportsColorMix()).toBe(true);
      expect(mockSupports).toHaveBeenCalledWith('color', 'color-mix(in oklch, red 50%, blue)');
    });

    it('should cache the result after first call', () => {
      const mockSupports = vi.fn().mockReturnValue(true);
      globalThis.CSS = {
        supports: mockSupports,
      } as unknown as typeof CSS;

      supportsColorMix();
      supportsColorMix();

      expect(mockSupports).toHaveBeenCalledTimes(1);
    });
  });

  describe('supportsOklch', () => {
    it('should return false when CSS.supports is not available', () => {
      // @ts-expect-error - Testing undefined CSS
      globalThis.CSS = undefined;

      expect(supportsOklch()).toBe(false);
    });

    it('should return false when CSS.supports throws an error', () => {
      globalThis.CSS = {
        supports: vi.fn(() => {
          throw new Error('Not supported');
        }),
      } as unknown as typeof CSS;

      expect(supportsOklch()).toBe(false);
    });

    it('should return the result from CSS.supports for oklch', () => {
      const mockSupports = vi.fn().mockReturnValue(true);
      globalThis.CSS = {
        supports: mockSupports,
      } as unknown as typeof CSS;

      expect(supportsOklch()).toBe(true);
      expect(mockSupports).toHaveBeenCalledWith('color', 'oklch(70% 0.15 220deg)');
    });

    it('should cache the result after first call', () => {
      const mockSupports = vi.fn().mockReturnValue(true);
      globalThis.CSS = {
        supports: mockSupports,
      } as unknown as typeof CSS;

      supportsOklch();
      supportsOklch();

      expect(mockSupports).toHaveBeenCalledTimes(1);
    });
  });

  describe('supportsContainerQueries', () => {
    it('should return false when CSS.supports is not available', () => {
      // @ts-expect-error - Testing undefined CSS
      globalThis.CSS = undefined;

      expect(supportsContainerQueries()).toBe(false);
    });

    it('should return false when CSS.supports throws an error', () => {
      globalThis.CSS = {
        supports: vi.fn(() => {
          throw new Error('Not supported');
        }),
      } as unknown as typeof CSS;

      expect(supportsContainerQueries()).toBe(false);
    });

    it('should return the result from CSS.supports for container-type', () => {
      const mockSupports = vi.fn().mockReturnValue(true);
      globalThis.CSS = {
        supports: mockSupports,
      } as unknown as typeof CSS;

      expect(supportsContainerQueries()).toBe(true);
      expect(mockSupports).toHaveBeenCalledWith('container-type', 'size');
    });

    it('should cache the result after first call', () => {
      const mockSupports = vi.fn().mockReturnValue(true);
      globalThis.CSS = {
        supports: mockSupports,
      } as unknown as typeof CSS;

      supportsContainerQueries();
      supportsContainerQueries();

      expect(mockSupports).toHaveBeenCalledTimes(1);
    });
  });

  describe('detectCSSFeatures', () => {
    it('should return all features as false when CSS.supports is not available', () => {
      // @ts-expect-error - Testing undefined CSS
      globalThis.CSS = undefined;

      const features = detectCSSFeatures();

      expect(features.hasSelector).toBe(false);
      expect(features.colorMix).toBe(false);
      expect(features.oklch).toBe(false);
      expect(features.containerQueries).toBe(false);
      expect(features.allModern).toBe(false);
    });

    it('should return all features as true when all are supported', () => {
      const mockSupports = vi.fn().mockReturnValue(true);
      globalThis.CSS = {
        supports: mockSupports,
      } as unknown as typeof CSS;

      const features = detectCSSFeatures();

      expect(features.hasSelector).toBe(true);
      expect(features.colorMix).toBe(true);
      expect(features.oklch).toBe(true);
      expect(features.containerQueries).toBe(true);
      expect(features.allModern).toBe(true);
    });

    it('should set allModern to false when any feature is not supported', () => {
      let callCount = 0;
      const mockSupports = vi.fn().mockImplementation(() => {
        callCount++;
        // Return false for one feature
        return callCount !== 2;
      });
      globalThis.CSS = {
        supports: mockSupports,
      } as unknown as typeof CSS;

      const features = detectCSSFeatures();

      expect(features.allModern).toBe(false);
    });
  });

  describe('applyCSSFeatureClasses', () => {
    let root: HTMLElement;

    beforeEach(() => {
      root = document.createElement('div');
    });

    it('should add feature classes when features are supported', () => {
      const mockSupports = vi.fn().mockReturnValue(true);
      globalThis.CSS = {
        supports: mockSupports,
      } as unknown as typeof CSS;

      applyCSSFeatureClasses(root);

      expect(root.classList.contains('xeg-has-selector')).toBe(true);
      expect(root.classList.contains('xeg-color-mix')).toBe(true);
      expect(root.classList.contains('xeg-oklch')).toBe(true);
      expect(root.classList.contains('xeg-container-queries')).toBe(true);
      expect(root.classList.contains('xeg-modern-css')).toBe(true);
    });

    it('should remove feature classes when features are not supported', () => {
      // First add classes
      root.classList.add('xeg-has-selector', 'xeg-color-mix', 'xeg-oklch', 'xeg-container-queries', 'xeg-modern-css');

      // @ts-expect-error - Testing undefined CSS
      globalThis.CSS = undefined;
      clearCSSFeatureCache();

      applyCSSFeatureClasses(root);

      expect(root.classList.contains('xeg-has-selector')).toBe(false);
      expect(root.classList.contains('xeg-color-mix')).toBe(false);
      expect(root.classList.contains('xeg-oklch')).toBe(false);
      expect(root.classList.contains('xeg-container-queries')).toBe(false);
      expect(root.classList.contains('xeg-modern-css')).toBe(false);
    });

    it('should use document.documentElement as default root', () => {
      const mockSupports = vi.fn().mockReturnValue(true);
      globalThis.CSS = {
        supports: mockSupports,
      } as unknown as typeof CSS;

      applyCSSFeatureClasses();

      expect(document.documentElement.classList.contains('xeg-has-selector')).toBe(true);

      // Cleanup
      document.documentElement.classList.remove(
        'xeg-has-selector',
        'xeg-color-mix',
        'xeg-oklch',
        'xeg-container-queries',
        'xeg-modern-css',
      );
    });
  });

  describe('clearCSSFeatureCache', () => {
    it('should clear the cache so features are re-detected', () => {
      // First call with CSS.supports returning true
      const mockSupports = vi.fn().mockReturnValue(true);
      globalThis.CSS = {
        supports: mockSupports,
      } as unknown as typeof CSS;

      expect(supportsHasSelector()).toBe(true);
      expect(mockSupports).toHaveBeenCalledTimes(1);

      // Clear cache
      clearCSSFeatureCache();

      // Change mock to return false
      mockSupports.mockReturnValue(false);

      // Should re-detect
      expect(supportsHasSelector()).toBe(false);
      expect(mockSupports).toHaveBeenCalledTimes(2);
    });
  });
});
