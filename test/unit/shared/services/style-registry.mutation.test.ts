import { StyleRegistry } from '@shared/services/style-registry';

const mockAddStyle = vi.fn();

vi.mock('@shared/external/userscript/adapter', () => ({
  getUserscript: () => ({
    addStyle: mockAddStyle,
  }),
}));

describe('StyleRegistry Mutation Tests', () => {
  let registry: StyleRegistry;

  beforeEach(() => {
    // Reset singleton
    (StyleRegistry as unknown as { instance: null }).instance = null;
    registry = StyleRegistry.getInstance();

    // Clear DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';

    // Reset mocks
    mockAddStyle.mockReset();
    // Default behavior: return a style element (simulate GM success)
    mockAddStyle.mockImplementation(css => {
      const el = document.createElement('style');
      el.textContent = css;
      document.head.appendChild(el);
      return el;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (StyleRegistry as unknown as { instance: null }).instance = null;
  });

  it('should return cached element even if removed from DOM manually', () => {
    const id = 'test-ghost';
    registry.registerStyle({ id, cssText: '.ghost {}' });

    const element = document.getElementById(id);
    expect(element).not.toBeNull();
    element?.remove(); // Manually remove from DOM

    // Should still be in the map
    // This kills the mutant that removes the map cache check
    expect(registry.getStyleElement(id)).not.toBeNull();
    expect(registry.getStyleElement(id)?.id).toBe(id);
  });

  it('should return null if not in browser environment', () => {
    const originalCreateElement = document.createElement;
    // @ts-ignore
    document.createElement = undefined;

    try {
      const result = registry.registerStyle({ id: 'test-no-browser', cssText: '.test {}' });
      expect(result).toBeNull();
    } finally {
      document.createElement = originalCreateElement;
    }
  });

  it('should fallback to document.createElement if GM_addStyle fails', () => {
    // Mock GM_addStyle to throw
    mockAddStyle.mockImplementation(() => {
      throw new Error('GM_addStyle failed');
    });

    const result = registry.registerStyle({ id: 'test-fallback', cssText: '.fallback {}' });

    expect(result).not.toBeNull();
    expect(result?.replaced).toBe(false);
    // Verify it's in the DOM (fallback behavior)
    const el = document.getElementById('test-fallback');
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe('.fallback {}');
  });

  it('should use GM_addStyle if available', () => {
    const mockEl = document.createElement('style');
    mockAddStyle.mockReturnValue(mockEl);

    const result = registry.registerStyle({ id: 'test-gm', cssText: '.gm {}' });

    expect(mockAddStyle).toHaveBeenCalledWith('.gm {}');
    expect(result?.element).toBe(mockEl);
  });

  it('should return null and warn if cssText is empty', () => {
    const result = registry.registerStyle({ id: 'test-empty', cssText: '   ' });
    expect(result).toBeNull();
  });

  it('should update existing style if replaceExisting is true (default)', () => {
    registry.registerStyle({ id: 'test-replace', cssText: '.original {}' });
    const result = registry.registerStyle({ id: 'test-replace', cssText: '.updated {}' });

    expect(result?.replaced).toBe(true);
    expect(result?.element.textContent).toBe('.updated {}');
  });

  it('should NOT update existing style if replaceExisting is false', () => {
    registry.registerStyle({ id: 'test-no-replace', cssText: '.original {}' });
    const result = registry.registerStyle({
      id: 'test-no-replace',
      cssText: '.ignored {}',
      replaceExisting: false
    });

    expect(result?.replaced).toBe(false);
    expect(result?.element.textContent).toBe('.original {}');
  });

  it('should apply attributes to the style element', () => {
    const result = registry.registerStyle({
      id: 'test-attrs',
      cssText: '.test {}',
      attributes: { 'data-test': 'value', 'media': 'screen' }
    });

    expect(result?.element.getAttribute('data-test')).toBe('value');
    expect(result?.element.getAttribute('media')).toBe('screen');
  });

  it('should remove style from DOM and cache', () => {
    const id = 'test-remove';
    registry.registerStyle({ id, cssText: '.test {}' });
    expect(registry.hasStyle(id)).toBe(true);

    registry.removeStyle(id);

    expect(registry.hasStyle(id)).toBe(false);
    expect(document.getElementById(id)).toBeNull();
  });

  it('should handle removing non-existent style gracefully', () => {
    expect(() => registry.removeStyle('non-existent')).not.toThrow();
  });

  it('should find style in DOM even if not in cache', () => {
    const id = 'test-dom-only';
    const style = document.createElement('style');
    style.id = id;
    document.head.appendChild(style);

    // Not registered via registry, so not in map initially
    expect(registry.hasStyle(id)).toBe(true);
    // Should be added to cache after access
    expect(registry.getStyleElement(id)).toBe(style);
  });
});
