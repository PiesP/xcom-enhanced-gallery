import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type UseProgressiveImageModule =
  typeof import('@features/gallery/components/vertical-gallery-view/hooks/useProgressiveImage');

async function importModule(): Promise<UseProgressiveImageModule> {
  vi.resetModules();
  return await import(
    '@features/gallery/components/vertical-gallery-view/hooks/useProgressiveImage'
  );
}

// Mock Image constructor
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = '';

  get src() {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
  }

  // Store instance for test access
  static instances: MockImage[] = [];

  constructor() {
    MockImage.instances.push(this);
  }

  static reset() {
    MockImage.instances = [];
  }

  static getLatest(): MockImage | undefined {
    return MockImage.instances[MockImage.instances.length - 1];
  }
}

describe('useProgressiveImage', () => {
  beforeEach(() => {
    (global as any).Image = MockImage;
    MockImage.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('초기 상태 및 기본 기능', () => {
    it('should have correct initial state', async () => {
      const { useProgressiveImage } = await importModule();

      const result = useProgressiveImage({ src: 'test.jpg' });
      const state = result.state();

      expect(state.isLoading).toBe(false);
      expect(state.isLoaded).toBe(false);
      expect(state.hasError).toBe(false);
      expect(state.loadedSrc).toBeNull();
      expect(state.progress).toBe(0);
      expect(state.retryCount).toBe(0);
    });

    it('should return imageProps with correct src', async () => {
      const { useProgressiveImage } = await importModule();

      const result = useProgressiveImage({
        src: 'high.jpg',
        lowQualitySrc: 'low.jpg',
      });

      const src = result.imageProps.src;
      expect(src).toMatch(/low\.jpg|high\.jpg/);
    });

    it('should provide imageProps with style object', async () => {
      const { useProgressiveImage } = await importModule();

      const result = useProgressiveImage({ src: 'test.jpg' });
      const style = result.imageProps.style;

      expect(style).toHaveProperty('opacity');
      expect(style).toHaveProperty('transition');
      expect(style).toHaveProperty('transform');
    });
  });

  describe('상태 제어 메서드', () => {
    it('should reset state to initial values', async () => {
      const { useProgressiveImage } = await importModule();

      const result = useProgressiveImage({ src: 'test.jpg' });

      // Call reset
      result.reset();

      const state = result.state();
      expect(state.isLoading).toBe(false);
      expect(state.isLoaded).toBe(false);
      expect(state.hasError).toBe(false);
      expect(state.loadedSrc).toBeNull();
      expect(state.progress).toBe(0);
      expect(state.retryCount).toBe(0);
    });

    it('should have retry method available', async () => {
      const { useProgressiveImage } = await importModule();

      const result = useProgressiveImage({ src: 'test.jpg' });

      expect(result.retry).toBeTypeOf('function');
      expect(() => result.retry()).not.toThrow();
    });
  });

  describe('이미지 Props 동작', () => {
    it('should call onLoad handler', async () => {
      const { useProgressiveImage } = await importModule();

      const result = useProgressiveImage({ src: 'test.jpg' });

      expect(result.imageProps.onLoad).toBeTypeOf('function');
      expect(() => result.imageProps.onLoad()).not.toThrow();
    });

    it('should call onError handler', async () => {
      const { useProgressiveImage } = await importModule();

      const result = useProgressiveImage({ src: 'test.jpg' });

      expect(result.imageProps.onError).toBeTypeOf('function');
      expect(() => result.imageProps.onError()).not.toThrow();
    });

    it('should return different opacity based on load state', async () => {
      const { useProgressiveImage } = await importModule();

      const result = useProgressiveImage({ src: 'test.jpg' });

      const initialStyle = result.imageProps.style;
      expect(initialStyle.opacity).toBe(0.7); // Not loaded yet
    });
  });

  describe('옵션 처리', () => {
    it('should accept maxRetries option', async () => {
      const { useProgressiveImage } = await importModule();

      expect(() => useProgressiveImage({ src: 'test.jpg', maxRetries: 5 })).not.toThrow();
    });

    it('should accept retryDelay option', async () => {
      const { useProgressiveImage } = await importModule();

      expect(() => useProgressiveImage({ src: 'test.jpg', retryDelay: 2000 })).not.toThrow();
    });

    it('should accept timeout option', async () => {
      const { useProgressiveImage } = await importModule();

      expect(() => useProgressiveImage({ src: 'test.jpg', timeout: 10000 })).not.toThrow();
    });

    it('should accept enableProgressTracking option', async () => {
      const { useProgressiveImage } = await importModule();

      expect(() =>
        useProgressiveImage({ src: 'test.jpg', enableProgressTracking: false })
      ).not.toThrow();
    });
  });

  describe('타입 및 인터페이스', () => {
    it('should return all required properties', async () => {
      const { useProgressiveImage } = await importModule();

      const result = useProgressiveImage({ src: 'test.jpg' });

      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('retry');
      expect(result).toHaveProperty('reset');
      expect(result).toHaveProperty('imageProps');
    });

    it('should have imageProps with required properties', async () => {
      const { useProgressiveImage } = await importModule();

      const result = useProgressiveImage({ src: 'test.jpg' });

      expect(result.imageProps).toHaveProperty('src');
      expect(result.imageProps).toHaveProperty('onLoad');
      expect(result.imageProps).toHaveProperty('onError');
      expect(result.imageProps).toHaveProperty('style');
    });
  });
});
