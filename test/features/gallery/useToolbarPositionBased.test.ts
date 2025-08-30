/* global document */
import { vi } from 'vitest';
import { renderHook } from '@testing-library/preact';
import { useToolbarPositionBased } from '@features/gallery/hooks/useToolbarPositionBased';
import { createMockHTMLElement } from '../../utils/mocks/dom-mocks';

// minimal, clean JS-compatible test
const mockSetProperty = vi.fn();
if (typeof document !== 'undefined') {
  Object.defineProperty(document.documentElement, 'style', {
    value: { setProperty: mockSetProperty },
    configurable: true,
  });
}

describe('useToolbarPositionBased', () => {
  const mockToolbarElement = createMockHTMLElement({ tagName: 'div' });
  const mockHoverZoneElement = createMockHTMLElement({ tagName: 'div' });

  beforeEach(() => vi.clearAllMocks());

  it('shows toolbar initially', () => {
    const { result } = renderHook(() =>
      useToolbarPositionBased({
        toolbarElement: mockToolbarElement,
        hoverZoneElement: mockHoverZoneElement,
        enabled: true,
      })
    );

    expect(result.current.isVisible).toBe(true);
    expect(mockSetProperty).toHaveBeenCalled();
  });
});
