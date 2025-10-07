import { screen, fireEvent } from '@testing-library/preact';
import { renderWithVendorPreact as render } from '../../../utils/render-with-vendor-preact';
import { getPreact } from '@shared/external/vendors';
import { KeyboardHelpOverlay } from '@/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay';

const { h } = getPreact();

describe('KeyboardHelpOverlay', () => {
  it('opens and closes with ESC and backdrop click', () => {
    const onClose = vi.fn();
    const { rerender, container } = render(h(KeyboardHelpOverlay, { open: true, onClose }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();

    // ESC closes
    fireEvent.keyDown(globalThis.document as unknown as any, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Backdrop click closes (re-open with same instance)
    rerender(h(KeyboardHelpOverlay, { open: true, onClose }));
    const backdrop = container.firstElementChild as unknown as any;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(2);

    // Closed state renders null
    rerender(h(KeyboardHelpOverlay, { open: false, onClose }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
