import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@solidjs/testing-library';
import { useKeyboardNavigation } from '@shared/hooks/useAccessibility';

describe('FRAME-ALT-001 Stage D Phase 5 — useKeyboardNavigation Solid integration', () => {
  afterEach(() => {
    cleanup();
  });

  it('invokes onEscape handler when Escape key is pressed', () => {
    const onEscape = vi.fn();

    const TestComponent = () => {
      useKeyboardNavigation({ onEscape }, []);
      return <div>Keyboard test</div>;
    };

    render(() => <TestComponent />);

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('cleans up event listeners when component unmounts', () => {
    const onEscape = vi.fn();

    const TestComponent = () => {
      useKeyboardNavigation({ onEscape }, []);
      return <div>Cleanup test</div>;
    };

    const { unmount } = render(() => <TestComponent />);

    const firstEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(firstEvent);
    expect(onEscape).toHaveBeenCalledTimes(1);

    unmount();

    const secondEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(secondEvent);
    expect(onEscape).toHaveBeenCalledTimes(1);
  });
});
