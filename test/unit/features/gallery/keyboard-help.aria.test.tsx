import { screen } from '@testing-library/preact';
import { renderWithVendorPreact as render } from '../../../utils/render-with-vendor-preact';
import { getPreact } from '@shared/external/vendors';
import { KeyboardHelpOverlay } from '@/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay';

const { h } = getPreact();

describe('KeyboardHelpOverlay a11y', () => {
  it('has role=dialog and labelled/ described by title/desc', () => {
    const onClose = vi.fn();
    render(h(KeyboardHelpOverlay, { open: true, onClose }));

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const title = screen.getByText('Keyboard shortcuts');
    expect(title.id).toBeTruthy();

    const listItem = screen.getByText('?: Show this help');
    expect(listItem).toBeTruthy();
  });
});
